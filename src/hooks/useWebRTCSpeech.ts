import { useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook for speaking text using WebRTC (OpenAI Realtime API) instead of TTS.
 * This provides consistent audio quality and lower latency across the entire app.
 */
export const useWebRTCSpeech = (voice: string = 'alloy') => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    console.log('[WebRTCSpeech] Cleaning up...');
    
    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('[WebRTCSpeech] Error stopping track:', e);
        }
      });
      mediaStreamRef.current = null;
    }

    // Close data channel
    if (dcRef.current) {
      try {
        dcRef.current.close();
      } catch (e) {
        console.error('[WebRTCSpeech] Error closing data channel:', e);
      }
      dcRef.current = null;
    }

    // Close peer connection
    if (pcRef.current) {
      try {
        pcRef.current.getSenders().forEach(sender => {
          if (sender.track) {
            try {
              sender.track.stop();
            } catch (e) {
              console.error('[WebRTCSpeech] Error stopping sender track:', e);
            }
          }
        });
        pcRef.current.close();
      } catch (e) {
        console.error('[WebRTCSpeech] Error closing peer connection:', e);
      }
      pcRef.current = null;
    }

    // Clean up audio element
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current.pause();
    }

    setIsSpeaking(false);
    console.log('[WebRTCSpeech] Cleanup complete');
  }, []);

  const stopSpeaking = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const speakText = useCallback(async (text: string, instructions?: string): Promise<void> => {
    if (!text.trim()) return;

    // SPEC: Strip UI parsing markers that shouldn't be spoken aloud
    // These markers are for the frontend to parse step data, not for audio
    const cleanedText = text
      .replace(/\*\*DO THIS NOW:\*\*\s*/gi, '')
      .replace(/\*\*DO THIS NOW\*\*:\s*/gi, '')
      .replace(/DO THIS NOW:\s*/gi, '')
      .replace(/\*\*UP NEXT:\*\*\s*/gi, 'Up next: ')
      .replace(/\*\*UP NEXT\*\*:\s*/gi, 'Up next: ')
      .replace(/UP NEXT:\s*/gi, 'Up next: ')
      .replace(/\*Press Next when.*?\*/gi, '')  // Remove italic press next instructions
      .replace(/Press Next when.*$/gim, '')     // Remove press next at end of lines
      .trim();

    if (!cleanedText) {
      console.log('[WebRTCSpeech] Text empty after stripping markers, skipping');
      return;
    }

    console.log('[WebRTCSpeech] Speaking text:', cleanedText.substring(0, 50) + '...');
    
    // Clean up any existing connection first
    cleanup();
    setIsSpeaking(true);

    try {
      // Get ephemeral token from Supabase edge function
      const { data, error } = await supabase.functions.invoke('realtime-session', {
        body: {
          voice,
          instructions: instructions || 'You are reading text aloud. Simply read the provided text naturally and clearly. Do not add any commentary or additional words.',
        },
      });

      if (error) {
        console.error('[WebRTCSpeech] Session error:', error);
        throw error;
      }

      if (!data?.client_secret?.value) {
        throw new Error('Failed to get ephemeral token');
      }

      const EPHEMERAL_KEY = data.client_secret.value;

      // Create audio element
      if (!audioElRef.current) {
        audioElRef.current = document.createElement('audio');
        audioElRef.current.autoplay = true;
      }

      // Create peer connection
      pcRef.current = new RTCPeerConnection();

      // Handle remote audio stream
      pcRef.current.ontrack = (e) => {
        console.log('[WebRTCSpeech] Received remote audio track');
        if (audioElRef.current) {
          audioElRef.current.srcObject = e.streams[0];
        }
      };

      // Add a silent audio track (required by the API but we won't use mic)
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      pcRef.current.addTrack(mediaStreamRef.current.getTracks()[0]);

      // Set up data channel for sending messages
      dcRef.current = pcRef.current.createDataChannel('oai-events');

      // Promise that resolves when speech is complete
      return new Promise((resolve, reject) => {
        let responseDone = false;

        dcRef.current!.addEventListener('open', () => {
          console.log('[WebRTCSpeech] Data channel open, sending text to speak');
          
          // Send the text as a user message to be read aloud
          const createEvent = {
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: `Please read this text aloud exactly as written: "${cleanedText}"`,
                },
              ],
            },
          };

          dcRef.current!.send(JSON.stringify(createEvent));
          dcRef.current!.send(JSON.stringify({ type: 'response.create' }));
        });

        dcRef.current!.addEventListener('message', (e) => {
          const event = JSON.parse(e.data);
          console.log('[WebRTCSpeech] Event:', event.type);

          if (event.type === 'response.done') {
            console.log('[WebRTCSpeech] Response complete');
            responseDone = true;
            // Give a short delay for audio to finish playing, then cleanup
            setTimeout(() => {
              cleanup();
              resolve();
            }, 500);
          }

          if (event.type === 'error') {
            console.error('[WebRTCSpeech] API error:', event.error);
            cleanup();
            reject(new Error(event.error?.message || 'Speech failed'));
          }
        });

        dcRef.current!.addEventListener('error', (e) => {
          console.error('[WebRTCSpeech] Data channel error:', e);
          cleanup();
          reject(new Error('Data channel error'));
        });

        // Create and set local description
        pcRef.current!.createOffer()
          .then((offer) => pcRef.current!.setLocalDescription(offer))
          .then(async () => {
            // Connect to OpenAI's Realtime API
            const baseUrl = 'https://api.openai.com/v1/realtime';
            const model = 'gpt-4o-realtime-preview-2024-12-17';
            
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
              method: 'POST',
              body: pcRef.current!.localDescription!.sdp,
              headers: {
                Authorization: `Bearer ${EPHEMERAL_KEY}`,
                'Content-Type': 'application/sdp',
              },
            });

            if (!sdpResponse.ok) {
              throw new Error(`Failed to connect to OpenAI: ${sdpResponse.status}`);
            }

            const answer = {
              type: 'answer' as RTCSdpType,
              sdp: await sdpResponse.text(),
            };

            await pcRef.current!.setRemoteDescription(answer);
            console.log('[WebRTCSpeech] WebRTC connection established');
          })
          .catch((err) => {
            console.error('[WebRTCSpeech] Connection error:', err);
            cleanup();
            reject(err);
          });

        // Timeout after 30 seconds
        setTimeout(() => {
          if (!responseDone) {
            console.warn('[WebRTCSpeech] Timeout, cleaning up');
            cleanup();
            reject(new Error('Speech timeout'));
          }
        }, 30000);
      });
    } catch (error) {
      console.error('[WebRTCSpeech] Error:', error);
      cleanup();
      toast.error(`Failed to speak: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [voice, cleanup]);

  return {
    speakText,
    stopSpeaking,
    isSpeaking,
  };
};

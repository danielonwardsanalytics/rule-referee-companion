import { useCallback, useRef } from 'react';

export type AudioSource = 'none' | 'webrtc-tts' | 'realtime-chat';

interface UseAudioLockReturn {
  audioSource: React.MutableRefObject<AudioSource>;
  acquireAudioLock: (source: AudioSource) => Promise<boolean>;
  releaseAudioLock: () => void;
}

/**
 * Audio source locking hook to prevent double audio playback.
 * Only ONE audio source may be active at any time.
 * 
 * @param stopSpeaking - Function to stop WebRTC TTS playback
 * @param disconnectRealtime - Function to disconnect realtime chat
 * @param setIsRealtimeConnected - Setter for realtime connection state
 */
export const useAudioLock = (
  stopSpeaking: () => void,
  disconnectRealtime?: () => void,
  setIsRealtimeConnected?: (connected: boolean) => void
): UseAudioLockReturn => {
  const audioSourceRef = useRef<AudioSource>('none');

  const acquireAudioLock = useCallback(async (source: AudioSource): Promise<boolean> => {
    const current = audioSourceRef.current;
    console.log(`[AudioLock] Acquiring ${source}, current: ${current}`);

    if (current === source && source !== 'none') {
      console.log(`[AudioLock] Already holding ${source} lock`);
      return true;
    }

    // Cleanup current source before switching
    if (current === 'webrtc-tts') {
      console.log('[AudioLock] Stopping WebRTC TTS');
      stopSpeaking();
    } else if (current === 'realtime-chat') {
      console.log('[AudioLock] Disconnecting realtime chat');
      disconnectRealtime?.();
      setIsRealtimeConnected?.(false);
    }

    // Small delay to ensure cleanup completes
    if (current !== 'none') {
      await new Promise(r => setTimeout(r, 50));
    }

    audioSourceRef.current = source;
    console.log(`[AudioLock] Acquired ${source}`);
    return true;
  }, [stopSpeaking, disconnectRealtime, setIsRealtimeConnected]);

  const releaseAudioLock = useCallback(() => {
    console.log(`[AudioLock] Releasing, was: ${audioSourceRef.current}`);
    audioSourceRef.current = 'none';
  }, []);

  return {
    audioSource: audioSourceRef,
    acquireAudioLock,
    releaseAudioLock,
  };
};

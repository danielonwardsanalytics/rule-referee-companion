import { useState, useRef, useCallback, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { toast } from "sonner";

interface UseNativeSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  isSupported: boolean;
}

export function useNativeSpeechRecognition(): UseNativeSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const webRecognitionRef = useRef<any>(null);
  const isManualStopRef = useRef(false);
  const accumulatedTranscriptRef = useRef("");

  const isNative = Capacitor.isNativePlatform();
  
  // Check if any speech recognition is supported
  const isSupported = isNative || ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isManualStopRef.current = true;
      if (webRecognitionRef.current) {
        webRecognitionRef.current.stop();
        webRecognitionRef.current = null;
      }
    };
  }, []);

  const startWebRecognition = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true; // Keep listening until manually stopped
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening... tap mic to stop");
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Show accumulated finals + current interim
      const displayText = finalTranscript + interimTranscript;
      if (displayText) {
        setTranscript(displayText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("[WebSpeech] Recognition error:", event.error);
      
      // Don't show error for no-speech or aborted (user stopped)
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast.error(`Speech recognition error: ${event.error}`);
      }
      
      // Only restart if not a manual stop and it's a recoverable error
      if (!isManualStopRef.current && event.error === 'no-speech') {
        // Restart recognition after brief pause
        setTimeout(() => {
          if (!isManualStopRef.current && webRecognitionRef.current) {
            try {
              webRecognitionRef.current.start();
            } catch (e) {
              // Already running or stopped
            }
          }
        }, 100);
      }
    };

    recognition.onend = () => {
      // Only restart if not manually stopped
      if (!isManualStopRef.current) {
        setTimeout(() => {
          if (!isManualStopRef.current && webRecognitionRef.current) {
            try {
              webRecognitionRef.current.start();
            } catch (e) {
              // Recognition already running or context destroyed
              setIsListening(false);
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    webRecognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (error) {
      console.error("[WebSpeech] Error starting recognition:", error);
      toast.error("Could not start speech recognition");
    }
  }, []);

  const startListening = useCallback(async () => {
    setTranscript("");
    accumulatedTranscriptRef.current = "";
    isManualStopRef.current = false;
    
    if (isNative) {
      // Native Capacitor implementation
      try {
        const permissionStatus = await SpeechRecognition.requestPermissions();
        
        if (permissionStatus.speechRecognition !== 'granted') {
          toast.error("Microphone permission denied");
          return;
        }

        const available = await SpeechRecognition.available();
        if (!available.available) {
          toast.error("Speech recognition not available on this device");
          return;
        }

        setIsListening(true);
        toast.info("Listening... tap mic to stop");

        await SpeechRecognition.start({
          language: "en-US",
          maxResults: 1,
          partialResults: true,
          popup: false,
        });

        // Listen for partial results
        SpeechRecognition.addListener("partialResults", (data: { matches: string[] }) => {
          if (data.matches && data.matches.length > 0) {
            // Accumulate transcript
            const newText = data.matches[0];
            accumulatedTranscriptRef.current = newText;
            setTranscript(newText);
          }
        });

      } catch (error) {
        console.error("[NativeSpeech] Error starting native recognition:", error);
        toast.error(`Speech recognition error: ${error instanceof Error ? error.message : "Unknown error"}`);
        setIsListening(false);
      }
    } else {
      // Web fallback using Web Speech API with continuous mode
      startWebRecognition();
    }
  }, [isNative, startWebRecognition]);

  const stopListening = useCallback(async () => {
    isManualStopRef.current = true;
    
    if (isNative) {
      try {
        await SpeechRecognition.stop();
        SpeechRecognition.removeAllListeners();
      } catch (error) {
        console.error("[NativeSpeech] Error stopping:", error);
      }
    } else {
      if (webRecognitionRef.current) {
        try {
          webRecognitionRef.current.stop();
        } catch (e) {
          // Already stopped
        }
        webRecognitionRef.current = null;
      }
    }
    setIsListening(false);
  }, [isNative]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  };
}

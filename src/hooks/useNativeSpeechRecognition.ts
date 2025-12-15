import { useState, useRef, useCallback } from "react";
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

  const isNative = Capacitor.isNativePlatform();
  
  // Check if any speech recognition is supported
  const isSupported = isNative || ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);

  const startListening = useCallback(async () => {
    setTranscript("");
    
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
        toast.info("Listening... speak now!");

        await SpeechRecognition.start({
          language: "en-US",
          maxResults: 1,
          partialResults: true,
          popup: false,
        });

        // Listen for partial results
        SpeechRecognition.addListener("partialResults", (data: { matches: string[] }) => {
          if (data.matches && data.matches.length > 0) {
            setTranscript(data.matches[0]);
          }
        });

      } catch (error) {
        console.error("[NativeSpeech] Error starting native recognition:", error);
        toast.error(`Speech recognition error: ${error instanceof Error ? error.message : "Unknown error"}`);
        setIsListening(false);
      }
    } else {
      // Web fallback using Web Speech API
      try {
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognitionAPI) {
          toast.error("Speech recognition not supported in this browser");
          return;
        }

        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
          toast.info("Listening... speak now!");
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(finalTranscript || interimTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error("[WebSpeech] Recognition error:", event.error);
          if (event.error !== 'no-speech') {
            toast.error(`Speech recognition error: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        webRecognitionRef.current = recognition;
        recognition.start();
      } catch (error) {
        console.error("[WebSpeech] Error starting recognition:", error);
        toast.error(`Could not start speech recognition: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  }, [isNative]);

  const stopListening = useCallback(async () => {
    if (isNative) {
      try {
        await SpeechRecognition.stop();
        SpeechRecognition.removeAllListeners();
      } catch (error) {
        console.error("[NativeSpeech] Error stopping:", error);
      }
    } else {
      if (webRecognitionRef.current) {
        webRecognitionRef.current.stop();
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

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Send, X, Loader2, Volume2, AudioWaveform } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { supabase } from "@/integrations/supabase/client";

interface ChatInterfaceProps {
  gameName?: string;
  voice?: string;
  onVoiceCommand?: (command: string) => Promise<string>;
  isProcessingCommand?: boolean;
  contextType?: "game" | "house-rules";
  contextId?: string;
}

const ChatInterface = ({ 
  gameName, 
  voice = "alloy",
  onVoiceCommand,
  isProcessingCommand = false,
  contextType = "game",
  contextId
}: ChatInterfaceProps) => {
  const { messages, sendMessage, isLoading, clearMessages } = useRealtimeChat();
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceChatMode, setIsVoiceChatMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const contextPrompt = gameName 
    ? `I'm playing ${gameName}. ` 
    : "";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || input;
    if (!messageToSend.trim()) return;
    
    // Clear input if using state input (not override)
    if (!messageOverride) {
      setInput("");
    }
    
    // If this is a house rules context and we have a voice command handler, use it
    if (contextType === "house-rules" && onVoiceCommand) {
      const response = await onVoiceCommand(messageToSend);
      if (isVoiceChatMode) {
        await speakResponse(response);
      }
      return;
    }
    
    // Otherwise use the normal chat flow
    const messageText = contextPrompt + messageToSend;
    
    await sendMessage(messageText, async (aiResponse) => {
      // Only speak response if voice chat mode is enabled
      if (isVoiceChatMode) {
        await speakResponse(aiResponse);
      }
    });
  };

  const speakResponse = async (text: string) => {
    try {
      console.log("[ChatInterface] Starting TTS for text:", text.substring(0, 50));
      setIsSpeaking(true);
      
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { 
          text: text,
          voice: voice 
        },
      });

      console.log("[ChatInterface] TTS response:", { hasData: !!data, error });

      if (error) {
        console.error("[ChatInterface] TTS error:", error);
        throw error;
      }

      if (!data?.audioContent) {
        throw new Error("No audio data received");
      }

      // Decode base64 audio to binary
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log("[ChatInterface] Decoded audio bytes:", bytes.length);

      // Create audio blob and play
      const audioBlob = new Blob([bytes], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log("[ChatInterface] Audio blob created, size:", audioBlob.size);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        console.log("[ChatInterface] Playing audio...");
        await audioRef.current.play();
        console.log("[ChatInterface] Audio playing");
      } else {
        console.error("[ChatInterface] Audio ref not available");
      }
    } catch (error) {
      console.error("[ChatInterface] TTS error:", error);
      toast.error(`Failed to speak response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      console.log("[ChatInterface] Starting recording...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[ChatInterface] Microphone access granted");
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log("[ChatInterface] Audio data available, size:", event.data.size);
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        console.log("[ChatInterface] Recording stopped, chunks:", audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        console.log("[ChatInterface] Audio blob created, size:", audioBlob.size);
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started - speak now!");
      console.log("[ChatInterface] MediaRecorder started");
    } catch (error) {
      console.error("[ChatInterface] Error accessing microphone:", error);
      toast.error(`Could not access microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const stopRecording = () => {
    console.log("[ChatInterface] Stop recording called, isRecording:", isRecording);
    if (mediaRecorderRef.current && isRecording) {
      console.log("[ChatInterface] Stopping MediaRecorder");
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Processing your audio...");
    } else {
      console.log("[ChatInterface] MediaRecorder not available or not recording");
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      console.log("[ChatInterface] Starting transcription...");
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(",")[1];
        if (!base64Audio) {
          console.error("[ChatInterface] No base64 audio data");
          return;
        }

        console.log("[ChatInterface] Calling transcribe-audio edge function...");
        const { data, error } = await supabase.functions.invoke("transcribe-audio", {
          body: { audio: base64Audio },
        });

        console.log("[ChatInterface] Transcription response:", { hasData: !!data, error, text: data?.text });

        if (error) {
          console.error("[ChatInterface] Transcription error:", error);
          throw error;
        }
        
        if (data?.text) {
          console.log("[ChatInterface] Transcribed text:", data.text);
          
          // In voice chat mode, auto-send immediately without updating input state
          if (isVoiceChatMode) {
            console.log("[ChatInterface] Voice chat mode active, auto-sending message");
            await handleSend(data.text);
          } else {
            // Not in voice chat mode, just set the input for manual sending
            console.log("[ChatInterface] Voice chat mode not active, text set in input");
            setInput(data.text);
          }
        } else {
          console.log("[ChatInterface] No text in transcription response");
        }
      };
    } catch (error) {
      console.error("[ChatInterface] Transcription error:", error);
      toast.error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isSpeaking && <Volume2 className="h-5 w-5 text-primary animate-pulse" />}
        </div>
      </div>

      {messages.length > 0 && (
        <ScrollArea className="h-[300px] mb-4" ref={scrollRef}>
          <div className="space-y-4 p-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="space-y-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={
            gameName 
              ? `Ask about ${gameName} rules...` 
              : "Tell me what game you're playing and ask your question."
          }
          className="resize-none italic placeholder:italic"
          rows={2}
          disabled={isLoading || isProcessingCommand}
        />
        
        <div className="flex items-center justify-center gap-2 bg-muted/50 rounded-full px-4 py-2 w-fit mx-auto">
          <Button
            size="icon"
            variant={isRecording ? "default" : "ghost"}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading || isProcessingCommand}
            className="rounded-full h-10 w-10"
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          
          <Button
            size="icon"
            variant={isVoiceChatMode ? "default" : "ghost"}
            onClick={() => {
              setIsVoiceChatMode(!isVoiceChatMode);
              toast.success(isVoiceChatMode ? "Voice chat mode disabled" : "Voice chat mode enabled - AI responses will be spoken");
            }}
            disabled={isLoading || isProcessingCommand}
            className="rounded-full h-10 w-10"
          >
            <AudioWaveform className={`h-5 w-5 ${isVoiceChatMode ? "animate-pulse" : ""}`} />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => handleSend()} 
            disabled={isLoading || isProcessingCommand || !input.trim()}
            className="rounded-full h-10 w-10"
          >
            {(isLoading || isProcessingCommand) ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

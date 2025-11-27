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

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // If this is a house rules context and we have a voice command handler, use it
    if (contextType === "house-rules" && onVoiceCommand) {
      const userMessage = input;
      setInput("");
      const response = await onVoiceCommand(userMessage);
      if (isVoiceChatMode) {
        await speakResponse(response);
      }
      return;
    }
    
    // Otherwise use the normal chat flow
    const messageText = contextPrompt + input;
    setInput("");
    
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

      if (!data) {
        throw new Error("No audio data received");
      }

      const audioBlob = new Blob([data], { type: "audio/mpeg" });
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Processing your audio...");
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(",")[1];
        if (!base64Audio) return;

        const { data, error } = await supabase.functions.invoke("transcribe-audio", {
          body: { audio: base64Audio },
        });

        if (error) throw error;
        if (data?.text) {
          setInput(data.text);
          
          // Auto-send for house rules context
          if (contextType === "house-rules" && onVoiceCommand) {
            const response = await onVoiceCommand(data.text);
            if (isVoiceChatMode) {
              await speakResponse(response);
            }
            setInput("");
          } else if (isVoiceChatMode) {
            // In voice chat mode, auto-send the transcribed message
            await handleSend();
          }
        }
      };
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio");
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
            onClick={handleSend} 
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

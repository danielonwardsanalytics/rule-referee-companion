import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Send, X, Loader2, Volume2, AudioWaveform, Phone } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import { useActiveHouseRules } from "@/hooks/useActiveHouseRules";
import { useNativeSpeechRecognition } from "@/hooks/useNativeSpeechRecognition";

interface ChatInterfaceProps {
  gameName?: string;
  gameId?: string;
  voice?: string;
  onVoiceCommand?: (command: string) => Promise<string>;
  isProcessingCommand?: boolean;
  contextType?: "game" | "house-rules";
  contextId?: string;
}

const ChatInterface = ({ 
  gameName,
  gameId,
  voice = "alloy",
  onVoiceCommand,
  isProcessingCommand = false,
  contextType = "game",
  contextId
}: ChatInterfaceProps) => {
  const { data: houseRulesData } = useActiveHouseRules(gameId);
  const houseRules = houseRulesData?.rules || [];
  const { messages, sendMessage, isLoading, clearMessages } = useRealtimeChat(gameName, houseRules);
  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceChatMode, setIsVoiceChatMode] = useState(false);
  const [voiceChatModeWhenRecording, setVoiceChatModeWhenRecording] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [realtimeMessages, setRealtimeMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const realtimeChatRef = useRef<RealtimeChat | null>(null);

  // Native speech recognition hook
  const { 
    isListening: isNativeListening, 
    transcript: nativeTranscript, 
    startListening, 
    stopListening,
    isSupported: isSpeechSupported 
  } = useNativeSpeechRecognition();
  
  const contextPrompt = gameName 
    ? `I'm playing ${gameName}. ` 
    : "";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (messageOverride?: string, shouldSpeak?: boolean) => {
    console.log("[ChatInterface] handleSend called with override:", !!messageOverride, "shouldSpeak:", shouldSpeak);
    const messageToSend = messageOverride || input;
    const willSpeak = shouldSpeak !== undefined ? shouldSpeak : isVoiceChatMode;
    console.log("[ChatInterface] Message to send:", messageToSend);
    console.log("[ChatInterface] Will speak response:", willSpeak);
    
    if (!messageToSend.trim()) {
      console.log("[ChatInterface] Empty message, returning");
      return;
    }
    
    // Clear input if using state input (not override)
    if (!messageOverride) {
      setInput("");
    }
    
    // If this is a house rules context and we have a voice command handler, use it
    if (contextType === "house-rules" && onVoiceCommand) {
      console.log("[ChatInterface] Using house rules voice command handler");
      const response = await onVoiceCommand(messageToSend);
      if (willSpeak) {
        await speakResponse(response);
      }
      return;
    }
    
    // Otherwise use the normal chat flow
    const messageText = contextPrompt + messageToSend;
    console.log("[ChatInterface] Sending to chat:", messageText);
    
    try {
      await sendMessage(messageText, async (aiResponse) => {
        console.log("[ChatInterface] Received AI response:", aiResponse.substring(0, 50));
        // Only speak response if requested
        if (willSpeak) {
          console.log("[ChatInterface] Speaking response");
          await speakResponse(aiResponse);
        } else {
          console.log("[ChatInterface] Not speaking response");
        }
      });
    } catch (error) {
      console.error("[ChatInterface] Error in sendMessage:", error);
      toast.error("Failed to send message");
    }
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

  // Update input when native transcript changes
  useEffect(() => {
    if (nativeTranscript) {
      if (voiceChatModeWhenRecording) {
        handleSend(nativeTranscript, true);
      } else {
        setInput(nativeTranscript);
      }
    }
  }, [nativeTranscript]);

  const handleDictateToggle = async () => {
    if (isNativeListening) {
      await stopListening();
      toast.success("Dictation stopped");
    } else {
      setVoiceChatModeWhenRecording(isVoiceChatMode);
      await startListening();
    }
  };

  const startRealtimeChat = async () => {
    try {
      console.log("[ChatInterface] Starting realtime chat...");
      toast.info("Connecting to voice chat...");
      
      const contextInstructions = gameName 
        ? `You are a helpful card game rules expert specifically for ${gameName}. Answer questions clearly and concisely about ${gameName} rules, strategies, and common questions. Keep responses under 3 sentences unless more detail is requested.`
        : "You are a helpful card game rules expert. Answer questions clearly and concisely about game rules, strategies, and common questions. Keep responses under 3 sentences unless more detail is requested.";

      let currentAssistantMessage = "";

      realtimeChatRef.current = new RealtimeChat(
        (event) => {
          console.log("[ChatInterface] Realtime event:", event.type);
          
          // Handle user's speech transcription
          if (event.type === 'conversation.item.input_audio_transcription.completed') {
            const transcript = event.transcript || "";
            if (transcript.trim()) {
              setRealtimeMessages(prev => [...prev, { role: 'user', content: transcript }]);
            }
          }
          
          // Handle assistant's response transcript (streaming)
          if (event.type === 'response.audio_transcript.delta') {
            const delta = event.delta || "";
            currentAssistantMessage += delta;
            
            // Update or create assistant message
            setRealtimeMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.role === 'assistant') {
                return [...prev.slice(0, -1), { role: 'assistant', content: currentAssistantMessage }];
              } else {
                return [...prev, { role: 'assistant', content: currentAssistantMessage }];
              }
            });
          }
          
          // Reset assistant message on response completion
          if (event.type === 'response.audio_transcript.done') {
            currentAssistantMessage = "";
          }
        },
        contextInstructions,
        voice,
        gameName,
        houseRules
      );

      await realtimeChatRef.current.init();
      setIsRealtimeConnected(true);
      toast.success("Voice chat connected - start speaking!");
      
    } catch (error) {
      console.error("[ChatInterface] Error starting realtime chat:", error);
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const endRealtimeChat = () => {
    console.log("[ChatInterface] Ending realtime chat...");
    realtimeChatRef.current?.disconnect();
    realtimeChatRef.current = null;
    setIsRealtimeConnected(false);
    setRealtimeMessages([]);
    toast.success("Voice chat disconnected");
  };

  useEffect(() => {
    return () => {
      realtimeChatRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="w-full flex flex-col">
      <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />
      
      {/* House Rules Active Indicator */}
      {houseRulesData && houseRules.length > 0 && (
        <div className="mb-3 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              🏠 House Rules Active: {houseRulesData.ruleSetName}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isSpeaking && <Volume2 className="h-5 w-5 text-primary animate-pulse" />}
        </div>
      </div>

      {(messages.length > 0 || realtimeMessages.length > 0) && (
        <ScrollArea className="h-[300px] mb-4" ref={scrollRef}>
          <div className="space-y-4 p-4">
            {messages.map((msg, idx) => (
              <div
                key={`msg-${idx}`}
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
            {realtimeMessages.map((msg, idx) => (
              <div
                key={`rt-${idx}`}
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
            variant={isNativeListening ? "default" : "ghost"}
            onClick={handleDictateToggle}
            disabled={isLoading || isProcessingCommand || isRealtimeConnected || !isSpeechSupported}
            className="rounded-full h-10 w-10"
          >
            {isNativeListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          
          <Button
            size="icon"
            variant={isVoiceChatMode ? "default" : "ghost"}
            onClick={() => {
              setIsVoiceChatMode(!isVoiceChatMode);
              toast.success(isVoiceChatMode ? "Voice chat mode disabled" : "Voice chat mode enabled - AI responses will be spoken");
            }}
            disabled={isLoading || isProcessingCommand || isRealtimeConnected}
            className="rounded-full h-10 w-10"
          >
            <AudioWaveform className={`h-5 w-5 ${isVoiceChatMode ? "animate-pulse" : ""}`} />
          </Button>

          <Button
            size="icon"
            variant={isRealtimeConnected ? "default" : "ghost"}
            onClick={isRealtimeConnected ? endRealtimeChat : startRealtimeChat}
            disabled={isLoading || isProcessingCommand}
            className="rounded-full h-10 w-10"
          >
            <Phone className={`h-5 w-5 ${isRealtimeConnected ? "animate-pulse text-green-500" : ""}`} />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost"
            onClick={() => handleSend()} 
            disabled={isLoading || isProcessingCommand || !input.trim() || isRealtimeConnected}
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

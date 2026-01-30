import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Mic, MicOff, Send, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useNativeSpeechRecognition } from "@/hooks/useNativeSpeechRecognition";

type Message = { role: 'user' | 'assistant'; content: string };

interface VoiceChatCoreProps {
  // Messages to display
  messages: Message[];
  
  // Text input state
  input: string;
  setInput: (value: string) => void;
  onSend: (message?: string, shouldSpeak?: boolean) => void;
  isLoading: boolean;
  
  // Realtime voice chat
  isRealtimeConnected: boolean;
  realtimeMessages: Message[];
  onStartRealtime: () => void;
  onEndRealtime: () => void;
  
  // Audio state
  isSpeaking: boolean;
  isAudioEnabled: boolean;
  setIsAudioEnabled: (enabled: boolean) => void;
  
  // Context for realtime
  contextInstructions?: string;
  gameName?: string;
  houseRules?: string[];
  voice?: string;
  
  // Customization
  placeholder?: string;
  showAudioToggle?: boolean;
  disabled?: boolean;
  
  // Optional rendering slots
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

/**
 * VoiceChatCore - Shared voice chat UI component
 * 
 * Provides the common UI pattern used across:
 * - AIAdjudicator (homepage)
 * - ChatInterface (game detail page)
 * - VoiceRuleEditor (house rules detail page)
 * 
 * Features:
 * - Big voice button for WebRTC realtime chat
 * - Text input with dictate/send buttons
 * - Audio response toggle
 * - Message list with scroll
 * - Speaking indicator
 */
export const VoiceChatCore = ({
  messages,
  input,
  setInput,
  onSend,
  isLoading,
  isRealtimeConnected,
  realtimeMessages,
  onStartRealtime,
  onEndRealtime,
  isSpeaking,
  isAudioEnabled,
  setIsAudioEnabled,
  placeholder = "Type your message here...",
  showAudioToggle = true,
  disabled = false,
  headerContent,
  footerContent,
}: VoiceChatCoreProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Native speech recognition
  const {
    isListening: isNativeListening,
    transcript: nativeTranscript,
    startListening,
    stopListening,
    isSupported: isSpeechSupported,
  } = useNativeSpeechRecognition();

  // Update input when native transcript changes
  useEffect(() => {
    if (nativeTranscript) {
      if (isAudioEnabled) {
        // Voice chat mode - send immediately with audio
        onSend(nativeTranscript, true);
      } else {
        // Text mode - just populate input
        setInput(nativeTranscript);
      }
    }
  }, [nativeTranscript, isAudioEnabled, onSend, setInput]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, realtimeMessages]);

  const handleDictateToggle = async () => {
    if (isNativeListening) {
      await stopListening();
      toast.success("Dictation stopped");
    } else {
      await startListening();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsAudioEnabled(false);
      onSend();
    }
  };

  const handleTextSend = () => {
    setIsAudioEnabled(false);
    onSend();
  };

  const allMessages = [...messages, ...realtimeMessages];

  return (
    <div className="space-y-4">
      {headerContent}
      
      {/* Big Voice Chat Button */}
      <div className="flex flex-col items-center py-6">
        <button
          onClick={isRealtimeConnected ? onEndRealtime : onStartRealtime}
          disabled={disabled || isLoading || isNativeListening}
          className={`w-32 h-32 rounded-full border-2 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
            isRealtimeConnected
              ? "bg-primary border-primary animate-pulse-glow"
              : "bg-primary border-primary/50 hover:border-primary hover:shadow-lg hover:shadow-primary/30"
          }`}
        >
          {/* Sound wave bars */}
          <div className="flex items-center gap-1.5">
            {[6, 10, 14, 10, 6].map((h, i) => (
              <div
                key={i}
                className="w-2 rounded-full bg-primary-foreground transition-all"
                style={{
                  height: `${h * 4}px`,
                  animation: isRealtimeConnected ? `soundWave 0.8s ease-in-out infinite ${i * 0.1}s` : "none",
                }}
              />
            ))}
          </div>
        </button>

        <p className="mt-4 text-sm text-muted-foreground text-center">
          Press to speak with House Rules AI.
        </p>
      </div>

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="flex items-center justify-center gap-2">
          <Volume2 className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm text-primary">Speaking...</span>
        </div>
      )}

      {/* Message List */}
      {allMessages.length > 0 && (
        <ScrollArea className="h-[200px] border border-border rounded-lg" ref={scrollRef}>
          <div className="space-y-4 p-4">
            {allMessages.map((msg, idx) => (
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
          </div>
        </ScrollArea>
      )}

      {/* Text Input Area */}
      <div className="space-y-2">
        {/* Audio Toggle */}
        {showAudioToggle && (
          <div className="flex items-center justify-end gap-2">
            <span className={`text-xs font-medium ${isAudioEnabled ? "text-green-500" : "text-red-500"}`}>
              Audio Response <span className="font-semibold">{isAudioEnabled ? "ON" : "OFF"}</span>
            </span>
            <Switch
              checked={isAudioEnabled}
              onCheckedChange={setIsAudioEnabled}
              className={`h-5 w-9 ${isAudioEnabled ? "bg-green-500 data-[state=checked]:bg-green-500" : "bg-red-500 data-[state=unchecked]:bg-red-500"}`}
            />
          </div>
        )}

        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className="resize-none pr-24 italic placeholder:italic border border-border"
            rows={2}
            disabled={disabled || isLoading || isRealtimeConnected}
          />

          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Button
              size="icon"
              variant={isNativeListening ? "default" : "ghost"}
              onClick={handleDictateToggle}
              disabled={disabled || isLoading || isRealtimeConnected || !isSpeechSupported}
              className="rounded-full h-8 w-8"
              title={!isSpeechSupported ? "Speech recognition not supported" : undefined}
            >
              {isNativeListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={handleTextSend}
              disabled={disabled || isLoading || !input.trim() || isRealtimeConnected}
              className="rounded-full h-8 w-8"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {footerContent}
    </div>
  );
};

export default VoiceChatCore;

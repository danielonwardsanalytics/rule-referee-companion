import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Mic, MicOff, Send, Loader2, Volume2, ChevronRight, BookOpen, Home } from "lucide-react";
import { toast } from "sonner";
import { useNativeSpeechRecognition } from "@/hooks/useNativeSpeechRecognition";
import { CompanionMode } from "@/components/ai-adjudicator/ModeSelector";

interface GuidedModeLayoutProps {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  realtimeMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  isRealtimeConnected: boolean;
  isSpeaking: boolean;
  isAudioEnabled: boolean;
  setIsAudioEnabled: (value: boolean) => void;
  onSend: (message?: string, shouldSpeak?: boolean) => Promise<void>;
  onStartRealtime: () => Promise<void>;
  onEndRealtime: () => void;
  voice: string;
  gameName?: string;
  houseRulesText: string[];
  onModeChange: (mode: CompanionMode) => void;
}

export function GuidedModeLayout({
  messages,
  realtimeMessages,
  input,
  setInput,
  isLoading,
  isRealtimeConnected,
  isSpeaking,
  isAudioEnabled,
  setIsAudioEnabled,
  onSend,
  onStartRealtime,
  onEndRealtime,
  voice,
  gameName,
  houseRulesText,
  onModeChange,
}: GuidedModeLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { 
    isListening: isNativeListening, 
    transcript: nativeTranscript, 
    startListening, 
    stopListening,
    isSupported: isSpeechSupported 
  } = useNativeSpeechRecognition();

  // Update input when native transcript changes
  useEffect(() => {
    if (nativeTranscript) {
      setInput(nativeTranscript);
    }
  }, [nativeTranscript, setInput]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, realtimeMessages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsAudioEnabled(false);
      onSend();
    }
  };

  const handleDictateToggle = async () => {
    if (isNativeListening) {
      await stopListening();
      toast.success("Dictation stopped");
    } else {
      setIsAudioEnabled(false);
      await startListening();
    }
  };

  const allMessages = [...messages, ...realtimeMessages];

  // Check if we're in an active walkthrough (has assistant messages)
  const hasStartedWalkthrough = allMessages.some(m => m.role === 'assistant');
  
  // Find the latest step instruction
  const latestAssistantMessage = [...allMessages].reverse().find(m => m.role === 'assistant');
  
  // Get previous messages (history) - everything except the latest assistant message
  const historyMessages = allMessages.slice(0, -1);

  return (
    <div className="space-y-4">
      <audio ref={audioRef} />

      {/* Voice Chat Button - Same size as other modes (w-32 h-32 = 128px) */}
      <div className="flex flex-col items-center py-6 mb-6">
        <button
          onClick={isRealtimeConnected ? onEndRealtime : onStartRealtime}
          disabled={isLoading || isNativeListening}
          className={`w-32 h-32 rounded-full border-2 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
            isRealtimeConnected
              ? "bg-primary border-primary animate-pulse-glow"
              : "bg-primary border-primary/50 hover:border-primary hover:shadow-lg hover:shadow-primary/30"
          }`}
        >
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
        <p className="mt-4 text-sm text-muted-foreground text-center">Press to speak with House Rules AI</p>
      </div>

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="flex items-center justify-center gap-2">
          <Volume2 className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm text-primary">Speaking...</span>
        </div>
      )}

      {/* Text Input Area - Larger for better readability */}
      <div className="space-y-2">
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

        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Tell me which game you'd like me to run you through."
            className="resize-none pr-24 italic placeholder:italic border border-border text-base min-h-[100px]"
            rows={4}
            disabled={isLoading || isRealtimeConnected}
          />

          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            <Button
              size="icon"
              variant={isNativeListening ? "default" : "ghost"}
              onClick={handleDictateToggle}
              disabled={isLoading || isRealtimeConnected || !isSpeechSupported}
              className="rounded-full h-9 w-9"
              title={!isSpeechSupported ? "Speech recognition not supported" : undefined}
            >
              {isNativeListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setIsAudioEnabled(false);
                onSend();
              }}
              disabled={isLoading || !input.trim() || isRealtimeConnected}
              className="rounded-full h-9 w-9"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Current Step Card - Styled instruction area */}
      {hasStartedWalkthrough && latestAssistantMessage ? (
        <div className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 rounded-xl p-5 space-y-4 shadow-lg shadow-primary/10">
          {/* Current Step Content */}
          <div className="prose prose-invert prose-base max-w-none">
            <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
              {latestAssistantMessage.content}
            </div>
          </div>
          
          {/* Next Step Button - Bottom of card */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => onSend("Next", isAudioEnabled)}
              disabled={isLoading}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 font-semibold shadow-md"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Next Step
                  <ChevronRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* Placeholder card when walkthrough hasn't started */
        <div className="bg-gradient-to-br from-muted/50 to-muted/20 border border-border rounded-xl p-6">
          <p className="text-base text-muted-foreground text-center">
            Your step-by-step instructions will appear here once you select a game.
          </p>
        </div>
      )}

      {/* What just happened - Previous conversation */}
      {historyMessages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Previous steps:</p>
          <ScrollArea className="h-[100px] border border-border rounded-lg" ref={scrollRef}>
            <div className="space-y-2 p-3">
              {historyMessages.map((msg, idx) => (
                <div key={`msg-${idx}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary/50 text-secondary-foreground"
                    }`}
                  >
                    <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Switch to Normal Game Mode Button */}
      {hasStartedWalkthrough && (
        <Button
          variant="outline"
          onClick={() => onModeChange('hub')}
          className="w-full border-slate-600 hover:bg-slate-700/50"
        >
          <Home className="h-4 w-4 mr-2" />
          Switch to Normal Game Mode
        </Button>
      )}
    </div>
  );
}

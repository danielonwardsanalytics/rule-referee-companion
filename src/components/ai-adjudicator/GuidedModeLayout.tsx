import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Mic, MicOff, Send, Loader2, Volume2, ChevronRight, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import { useNativeSpeechRecognition } from "@/hooks/useNativeSpeechRecognition";

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
  
  // Find the latest step instruction (look for DO THIS NOW or step indicators)
  const latestAssistantMessage = [...allMessages].reverse().find(m => m.role === 'assistant');

  return (
    <div className="space-y-4">
      <audio ref={audioRef} />
      
      {/* Guided Mode Header */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-200">Guided Walkthrough</h3>
            <p className="text-xs text-amber-300/70">
              {hasStartedWalkthrough 
                ? "Follow each step, press Next when ready"
                : "Tell me which game to walk you through"}
            </p>
          </div>
        </div>
      </div>

      {/* Voice Chat Button - Compact in Guided Mode */}
      <div className="flex justify-center">
        <button
          onClick={isRealtimeConnected ? onEndRealtime : onStartRealtime}
          disabled={isLoading || isNativeListening}
          className={`w-20 h-20 rounded-full border-2 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
            isRealtimeConnected
              ? "bg-primary border-primary animate-pulse-glow"
              : "bg-primary border-primary/50 hover:border-primary hover:shadow-lg hover:shadow-primary/30"
          }`}
        >
          <div className="flex items-center gap-1">
            {[4, 6, 8, 6, 4].map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-primary-foreground transition-all"
                style={{
                  height: `${h * 3}px`,
                  animation: isRealtimeConnected ? `soundWave 0.8s ease-in-out infinite ${i * 0.1}s` : "none",
                }}
              />
            ))}
          </div>
        </button>
      </div>

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="flex items-center justify-center gap-2">
          <Volume2 className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm text-primary">Speaking...</span>
        </div>
      )}

      {/* Text Input Area - Now above the step display */}
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
            placeholder={hasStartedWalkthrough ? "Ask a question or say 'Next'..." : "Tell me which game you'd like me to run you through..."}
            className="resize-none pr-24 italic placeholder:italic border border-border text-sm"
            rows={2}
            disabled={isLoading || isRealtimeConnected}
          />

          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <Button
              size="icon"
              variant={isNativeListening ? "default" : "ghost"}
              onClick={handleDictateToggle}
              disabled={isLoading || isRealtimeConnected || !isSpeechSupported}
              className="rounded-full h-8 w-8"
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
              className="rounded-full h-8 w-8"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Tips - Show when walkthrough hasn't started */}
      {!hasStartedWalkthrough && (
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Try saying:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• "Walk me through UNO"</li>
            <li>• "Guide us through Phase 10"</li>
            <li>• "Run us through Monopoly Deal step by step"</li>
          </ul>
        </div>
      )}

      {/* Current Step Display - NOW BELOW TEXT INPUT */}
      {hasStartedWalkthrough && latestAssistantMessage && (
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {latestAssistantMessage.content}
            </div>
          </div>
        </div>
      )}

      {/* Next Button - Prominent when in active walkthrough */}
      {hasStartedWalkthrough && (
        <Button
          onClick={() => onSend("Next", isAudioEnabled)}
          disabled={isLoading}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
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
      )}

      {/* Conversation History - Scrollable */}
      {allMessages.length > 1 && (
        <ScrollArea className="h-[150px] border border-border rounded-lg" ref={scrollRef}>
          <div className="space-y-3 p-3">
            {allMessages.slice(0, -1).map((msg, idx) => (
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
      )}

      {/* Mode Exit Hint */}
      {hasStartedWalkthrough && (
        <p className="text-xs text-muted-foreground text-center">
          Say "I get it" or "We'll take it from here" to exit guided mode
        </p>
      )}
    </div>
  );
}

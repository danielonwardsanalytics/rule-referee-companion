import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Mic, MicOff, Send, Loader2, Volume2, ChevronRight, Home } from "lucide-react";
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

// Helper to extract step title and summary from AI response for the compact card
function extractStepInfo(content: string): { title: string; summary: string } {
  // Try to find "DO THIS NOW:" pattern first
  const doThisMatch = content.match(/\*\*DO THIS NOW:\*\*\s*([^\n]+)/i);
  if (doThisMatch) {
    const summary = doThisMatch[1].trim();
    // Try to find step title like "**Setup – Shuffle & Deal**"
    const titleMatch = content.match(/\*\*([^*]+(?:–|-)[^*]+)\*\*/);
    const title = titleMatch?.[1]?.trim() || "Current Step";
    return { title, summary: summary.length > 100 ? summary.substring(0, 97) + "..." : summary };
  }
  
  // Fallback: Try to extract a step title pattern
  const stepMatch = content.match(/(?:\*\*)?(?:STEP\s*\d+[:\s-]*)?([^.!?\n]{5,50})/i);
  const title = stepMatch?.[1]?.trim() || "Current Step";
  
  // Get first sentence as summary
  const firstSentence = content.split(/[.!?]/)[0]?.trim() || "";
  const summary = firstSentence.length > 100 
    ? firstSentence.substring(0, 97) + "..." 
    : firstSentence || "Follow the instructions";
  
  return { title, summary };
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [wasSpeaking, setWasSpeaking] = useState(false);
  
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, realtimeMessages]);

  // Turn off audio AND disconnect realtime when AI finishes speaking
  // This prevents the microphone from picking up player conversations
  useEffect(() => {
    if (wasSpeaking && !isSpeaking) {
      // AI just finished speaking, turn off audio mode and disconnect
      setIsAudioEnabled(false);
      if (isRealtimeConnected) {
        onEndRealtime();
      }
    }
    setWasSpeaking(isSpeaking);
  }, [isSpeaking, wasSpeaking, setIsAudioEnabled, isRealtimeConnected, onEndRealtime]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleDictateToggle = async () => {
    if (isNativeListening) {
      await stopListening();
      toast.success("Dictation stopped");
    } else {
      await startListening();
    }
  };

  const handleNextStep = () => {
    // Enable audio so the next instruction is read aloud
    setIsAudioEnabled(true);
    onSend("Next", true);
  };

  const handleVoiceButtonClick = async () => {
    if (isRealtimeConnected) {
      onEndRealtime();
    } else {
      setIsAudioEnabled(true);
      await onStartRealtime();
    }
  };

  const allMessages = [...messages, ...realtimeMessages];
  const hasStartedWalkthrough = allMessages.some(m => m.role === 'assistant');
  const latestAssistantMessage = [...allMessages].reverse().find(m => m.role === 'assistant');
  const stepInfo = latestAssistantMessage ? extractStepInfo(latestAssistantMessage.content) : null;
  
  // Check if game is finished
  const isGameFinished = latestAssistantMessage?.content.toLowerCase().includes("game is now finished") ||
                         latestAssistantMessage?.content.toLowerCase().includes("game has ended") ||
                         latestAssistantMessage?.content.toLowerCase().includes("congratulations");

  return (
    <div className="space-y-4">
      <audio ref={audioRef} />

      {/* Voice Chat Button - Same size as other modes (w-32 h-32 = 128px) */}
      <div className="flex flex-col items-center py-4">
        <button
          onClick={handleVoiceButtonClick}
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
        <p className="mt-3 text-sm text-muted-foreground text-center">
          {isRealtimeConnected ? "Listening..." : "Press to speak with House Rules AI"}
        </p>
      </div>

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="flex items-center justify-center gap-2">
          <Volume2 className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm text-primary">Speaking...</span>
        </div>
      )}

      {/* Chat Message Area - Scrollable with thumb, no visible scrollbar */}
      <div className="border border-border rounded-xl bg-background overflow-hidden">
        <div 
          className="overflow-y-auto overscroll-contain touch-pan-y"
          style={{ 
            maxHeight: hasStartedWalkthrough ? '280px' : '120px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="p-4 space-y-3 hide-scrollbar">
            {allMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 italic">
                Tell me which game you'd like me to run you through.
              </p>
            ) : (
              allMessages.map((msg, idx) => (
                <div key={`msg-${idx}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Text Input - Below messages like messenger */}
        <div className="border-t border-border p-3 bg-muted/30">
          <div className="flex items-center justify-end gap-2 mb-2">
            <span className={`text-xs font-medium ${isAudioEnabled ? "text-green-500" : "text-muted-foreground"}`}>
              Audio {isAudioEnabled ? "ON" : "OFF"}
            </span>
            <Switch
              checked={isAudioEnabled}
              onCheckedChange={setIsAudioEnabled}
              className="h-4 w-8"
            />
          </div>
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your question..."
              className="resize-none pr-20 text-sm min-h-[44px] max-h-[80px]"
              rows={1}
              disabled={isLoading || isRealtimeConnected}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Button
                size="icon"
                variant={isNativeListening ? "default" : "ghost"}
                onClick={handleDictateToggle}
                disabled={isLoading || isRealtimeConnected || !isSpeechSupported}
                className="rounded-full h-8 w-8"
              >
                {isNativeListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onSend()}
                disabled={isLoading || !input.trim() || isRealtimeConnected}
                className="rounded-full h-8 w-8"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Step Summary Card - Compact with title, summary, and Next button */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-4 shadow-md">
        {hasStartedWalkthrough && stepInfo ? (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">{stepInfo.title}</h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{stepInfo.summary}</p>
            </div>
            <Button
              onClick={isGameFinished ? () => onModeChange('hub') : handleNextStep}
              disabled={isLoading || isSpeaking}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 font-semibold shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isGameFinished ? (
                <>
                  Finish
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Your step summary will appear here once you start.
          </p>
        )}
      </div>

      {/* Switch to Normal Game Mode Button */}
      {hasStartedWalkthrough && (
        <Button
          variant="outline"
          onClick={() => onModeChange('hub')}
          className="w-full border-border hover:bg-muted/50"
        >
          <Home className="h-4 w-4 mr-2" />
          Switch to Normal Game Mode
        </Button>
      )}
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Mic, MicOff, Send, Loader2, Volume2, ChevronRight, ChevronLeft, Home, RotateCcw, Square } from "lucide-react";
import { toast } from "sonner";
import { useNativeSpeechRecognition } from "@/hooks/useNativeSpeechRecognition";
import { CompanionMode } from "@/components/ai-adjudicator/ModeSelector";
import { GuidedStep } from "@/hooks/useGuidedWalkthrough";

interface GuidedModeLayoutProps {
  messages: Array<{ role: 'user' | 'assistant'; content: string; id?: string }>;
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
  onStopSpeaking?: () => void;
  voice: string;
  gameName?: string;
  houseRulesText: string[];
  onModeChange: (mode: CompanionMode) => void;
  // Guided state
  currentStep: GuidedStep | null;
  stepIndex: number;
  totalSteps: number;
  isComplete: boolean;
  onNextStep: () => void;
  onPrevStep: () => void;
  onReset: () => void;
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
  onStopSpeaking,
  voice,
  gameName,
  houseRulesText,
  onModeChange,
  currentStep,
  stepIndex,
  totalSteps,
  isComplete,
  onNextStep,
  onPrevStep,
  onReset,
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

  // Turn off mic when AI finishes speaking (via TTS)
  // Note: We no longer auto-disconnect realtime here - let user control it
  useEffect(() => {
    if (wasSpeaking && !isSpeaking) {
      // AI just finished speaking via TTS
      console.log("[GuidedMode] AI finished speaking via TTS");
      // Don't wipe anything - just note it
    }
    setWasSpeaking(isSpeaking);
  }, [isSpeaking, wasSpeaking]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
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

  // Next button: advances step, forces mic OFF, requests next step from AI
  const handleNextStep = useCallback(() => {
    console.log("[GuidedMode] Next button pressed");
    // Force mic OFF when delivering next instruction
    setIsAudioEnabled(false);
    if (isRealtimeConnected) {
      onEndRealtime();
    }
    // Call parent's next step handler
    onNextStep();
  }, [setIsAudioEnabled, isRealtimeConnected, onEndRealtime, onNextStep]);

  // Voice button: user explicitly turns on mic to ask a question
  const handleVoiceButtonClick = async () => {
    if (isRealtimeConnected) {
      console.log("[GuidedMode] Voice button: disconnecting");
      onEndRealtime();
    } else {
      console.log("[GuidedMode] Voice button: connecting for question");
      setIsAudioEnabled(true);
      await onStartRealtime();
    }
  };

  // Text send: for asking questions
  const handleTextSend = () => {
    if (!input.trim()) return;
    // Audio off when sending text questions
    setIsAudioEnabled(false);
    onSend(undefined, false);
  };

  const allMessages = [...messages, ...realtimeMessages];
  const hasStartedWalkthrough = allMessages.some(m => m.role === 'assistant');

  return (
    <div className="space-y-4">
      <audio ref={audioRef} />

      {/* Voice Chat Button - Same size as other modes (w-32 h-32 = 128px) */}
      <div className="flex flex-col items-center py-4">
        <button
          onClick={handleVoiceButtonClick}
          disabled={isLoading || isNativeListening || isSpeaking}
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
          {isRealtimeConnected 
            ? "Listening for your question..." 
            : isSpeaking 
              ? "Speaking..." 
              : "Press to ask a question"}
        </p>
      </div>

      {/* Speaking Indicator with Stop Button */}
      {isSpeaking && (
        <div className="flex items-center justify-center gap-3">
          <Volume2 className="h-5 w-5 text-primary animate-pulse" />
          <span className="text-sm text-primary">Speaking...</span>
          {onStopSpeaking && (
            <Button
              size="sm"
              variant="outline"
              onClick={onStopSpeaking}
              className="h-7 px-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          )}
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
                Tell me which game you'd like me to guide you through.
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
              disabled={isLoading || isRealtimeConnected || isSpeaking}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Button
                size="icon"
                variant={isNativeListening ? "default" : "ghost"}
                onClick={handleDictateToggle}
                disabled={isLoading || isRealtimeConnected || !isSpeechSupported || isSpeaking}
                className="rounded-full h-8 w-8"
              >
                {isNativeListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleTextSend}
                disabled={isLoading || !input.trim() || isRealtimeConnected || isSpeaking}
                className="rounded-full h-8 w-8"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Step Summary Card - Shows current step from state */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-4 shadow-md">
        {isComplete ? (
          <div className="text-center space-y-3">
            <h4 className="font-semibold text-foreground">🎉 Walkthrough Complete!</h4>
            <p className="text-sm text-muted-foreground">Would you like to play again or try a different game?</p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={onReset}
                variant="outline"
                className="border-primary/50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <Button
                onClick={() => onModeChange('hub')}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-primary-foreground border-0"
              >
                Finish
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        ) : currentStep ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              {totalSteps > 0 && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  Step {stepIndex + 1}
                </span>
              )}
              <h4 className="font-semibold text-foreground truncate">{currentStep.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{currentStep.summary}</p>
            {currentStep.upNext && (
              <p className="text-xs text-muted-foreground/70 italic">
                Up next: {currentStep.upNext}
              </p>
            )}
            {/* Navigation buttons at bottom */}
            <div className="flex items-center justify-between pt-2">
              <Button
                onClick={onPrevStep}
                disabled={isLoading || isSpeaking || stepIndex === 0}
                variant="outline"
                size="sm"
                className="border-primary/30"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={isLoading || isSpeaking}
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-primary-foreground border-0 font-semibold"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : hasStartedWalkthrough ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Preparing your next step...</p>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Your step-by-step guide will appear here.
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

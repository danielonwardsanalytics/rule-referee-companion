import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Mic, MicOff, Send, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useChatWithActions } from "@/hooks/useChatWithActions";
import { useActiveContext } from "@/hooks/useActiveContext";
import { useHouseRules } from "@/hooks/useHouseRules";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import { ContextSelectorBox } from "@/components/ai-adjudicator/ContextSelectorBox";
import { LearnHowToUse } from "@/components/ai-adjudicator/LearnHowToUse";
import { ActionConfirmation } from "@/components/ai-adjudicator/ActionConfirmation";
import { useNativeSpeechRecognition } from "@/hooks/useNativeSpeechRecognition";

interface AIAdjudicatorProps {
  title?: string;
  subtitle?: string;
  preSelectedRuleSetId?: string;
  preSelectedTournamentId?: string;
  hideContextSelectors?: boolean;
  voice?: string;
  embedded?: boolean; // When true, removes outer wrapper (for use inside pages with existing containers)
}

const AIAdjudicator = ({
  title = "AI Adjudicator",
  subtitle = "Your rules, your rulings — ask away",
  preSelectedRuleSetId,
  preSelectedTournamentId,
  hideContextSelectors = false,
  voice = "alloy",
  embedded = false,
}: AIAdjudicatorProps) => {
  const {
    activeRuleSet,
    activeTournament,
    activeRuleSetId,
    activeTournamentId,
    userRuleSets,
    userTournaments,
    setActiveRuleSet,
    setActiveTournament,
    clearActiveRuleSet,
    clearActiveTournament,
  } = useActiveContext();

  // Use pre-selected IDs if provided, otherwise use context
  const effectiveRuleSetId = preSelectedRuleSetId || activeRuleSetId;
  const effectiveTournamentId = preSelectedTournamentId || activeTournamentId;

  // Get house rules for the active rule set
  const { rules: activeRules } = useHouseRules(effectiveRuleSetId || undefined);
  const houseRulesText = activeRules?.map((r) => r.rule_text) || [];

  // Determine game name from context
  const gameName = activeRuleSet?.gameName || activeTournament?.gameName || undefined;

  const { 
    messages, 
    sendMessage, 
    isLoading, 
    clearMessages,
    pendingAction,
    confirmAction,
    cancelAction,
    handleVoiceConfirmation,
    isExecutingAction,
    detectActionInTranscript,
  } = useChatWithActions(gameName, houseRulesText, effectiveRuleSetId);
  
  // Native speech recognition hook (works on native apps and web)
  const { 
    isListening: isNativeListening, 
    transcript: nativeTranscript, 
    startListening, 
    stopListening,
    isSupported: isSpeechSupported 
  } = useNativeSpeechRecognition();
  
  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [realtimeMessages, setRealtimeMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  
  // Track previous rule set to detect changes
  const previousRuleSetRef = useRef<{ id: string | null; name: string | null }>({ id: null, name: null });
  const [ruleChangeContext, setRuleChangeContext] = useState<string | null>(null);

  // Detect rule set changes
  useEffect(() => {
    const prevId = previousRuleSetRef.current.id;
    const prevName = previousRuleSetRef.current.name;
    const currentId = effectiveRuleSetId || null;
    const currentName = activeRuleSet?.name || null;

    // Only trigger if there was a previous state (not initial load)
    if (prevId !== null || prevName !== null) {
      if (prevId && !currentId) {
        // Rules were turned off
        setRuleChangeContext(`IMPORTANT CONTEXT CHANGE: The house rules "${prevName}" have just been TURNED OFF. The user is now playing by standard/official rules only. Please acknowledge this change in your response.`);
      } else if (!prevId && currentId) {
        // Rules were turned on
        setRuleChangeContext(`IMPORTANT CONTEXT CHANGE: The house rules "${currentName}" have just been ACTIVATED. Please acknowledge this change and note that you're now answering based on these house rules.`);
      } else if (prevId && currentId && prevId !== currentId) {
        // Rules were changed to different set
        setRuleChangeContext(`IMPORTANT CONTEXT CHANGE: The house rules have been CHANGED from "${prevName}" to "${currentName}". Please acknowledge this change and note that you're now answering based on the new house rules.`);
      }
    }

    // Update the ref to current state
    previousRuleSetRef.current = { id: currentId, name: currentName };
  }, [effectiveRuleSetId, activeRuleSet?.name]);

  // Build context prompt
  const buildContextPrompt = () => {
    let prompt = "";
    
    // Include rule change context if present
    if (ruleChangeContext) {
      prompt += ruleChangeContext + " ";
    }
    
    if (gameName) prompt += `I'm playing ${gameName}. `;
    if (activeRuleSet) {
      prompt += `Using "${activeRuleSet.name}" house rules. `;
    } else {
      prompt += `Playing by standard/official rules (no house rules active). `;
    }
    if (activeTournament) prompt += `In the "${activeTournament.name}" tournament. `;
    return prompt;
  };

  // Reset audio when component mounts
  useEffect(() => {
    setIsAudioEnabled(false);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, realtimeMessages]);

  const handleSend = async (messageOverride?: string, shouldSpeak?: boolean) => {
    const messageToSend = messageOverride || input;
    const willSpeak = shouldSpeak !== undefined ? shouldSpeak : isAudioEnabled;

    console.log("[AIAdjudicator] handleSend called:", { messageToSend, willSpeak });

    if (!messageToSend.trim()) {
      console.log("[AIAdjudicator] Empty message, skipping");
      return;
    }

    if (!messageOverride) {
      setInput("");
    }

    const messageText = buildContextPrompt() + messageToSend;
    console.log("[AIAdjudicator] Sending message with context:", messageText);

    try {
      await sendMessage(messageText, async (aiResponse, hasAction) => {
        console.log("[AIAdjudicator] sendMessage completed:", { hasAction, responseLength: aiResponse?.length });
        if (willSpeak) {
          await speakResponse(aiResponse);
        }
        // Clear rule change context after first message acknowledges it
        if (ruleChangeContext) {
          setRuleChangeContext(null);
        }
      });
    } catch (error) {
      console.error("[AIAdjudicator] Error in sendMessage:", error);
      toast.error("Failed to send message");
    }
  };

  const speakResponse = async (text: string) => {
    try {
      setIsSpeaking(true);

      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text, voice },
      });

      if (error) throw error;
      if (!data?.audioContent) throw new Error("No audio data received");

      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBlob = new Blob([bytes], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error("[AIAdjudicator] TTS error:", error);
      toast.error(`Failed to speak response: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsAudioEnabled(false);
      handleSend();
    }
  };

  const handleTextSend = () => {
    setIsAudioEnabled(false);
    handleSend();
  };

  // Update input when native transcript changes
  useEffect(() => {
    if (nativeTranscript) {
      setInput(nativeTranscript);
    }
  }, [nativeTranscript]);

  const handleDictateToggle = async () => {
    if (isNativeListening) {
      await stopListening();
      toast.success("Dictation stopped");
    } else {
      setIsAudioEnabled(false);
      await startListening();
    }
  };

  const startRealtimeChat = async () => {
    try {
      setIsAudioEnabled(true);

      toast.info("Connecting to voice chat...");

      const rulesContext = houseRulesText.map((r, i) => `Rule ${i + 1}: ${r}`).join("\n");

      let contextInstructions = `You are a helpful card game rules expert`;
      if (gameName) {
        contextInstructions += ` for ${gameName}`;
      }
      contextInstructions += ".\n\n";

      if (activeRuleSet) {
        contextInstructions += `The player is using the "${activeRuleSet.name}" house rules set.\n\n`;
        contextInstructions += `House Rules:\n${rulesContext || "No custom rules - using official rules only."}\n\n`;
      }

      if (activeTournament) {
        contextInstructions += `The player is in the "${activeTournament.name}" tournament.\n\n`;
      }

      contextInstructions += `You can help users create house rule sets, add rules to existing sets, and create tournaments.
When a user asks you to create something (like "create a house rule set called X" or "add a rule that Y"), 
respond with a clear confirmation of what you'll create and ask them to confirm.

Answer questions clearly and concisely about game rules, strategies, and disputes. 
When house rules apply, explain how they modify the standard rules.
Keep responses under 3 sentences unless more detail is requested.`;

      let currentAssistantMessage = "";

      realtimeChatRef.current = new RealtimeChat(
        (event) => {
          if (event.type === "conversation.item.input_audio_transcription.completed") {
            const transcript = event.transcript || "";
            if (transcript.trim()) {
              // Check if this is a voice confirmation for a pending action
              const wasHandled = handleVoiceConfirmation(transcript);
              if (!wasHandled) {
                setRealtimeMessages((prev) => [...prev, { role: "user", content: transcript }]);
              }
            }
          }

          if (event.type === "response.audio_transcript.delta") {
            const delta = event.delta || "";
            currentAssistantMessage += delta;

            setRealtimeMessages((prev) => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.role === "assistant") {
                return [...prev.slice(0, -1), { role: "assistant", content: currentAssistantMessage }];
              } else {
                return [...prev, { role: "assistant", content: currentAssistantMessage }];
              }
            });
          }

          if (event.type === "response.audio_transcript.done") {
            currentAssistantMessage = "";
          }
        },
        contextInstructions,
        voice,
        gameName,
        houseRulesText,
        // Voice chat is Q&A only - no action detection needed
        // Actions are handled by text chat, voice chat politely declines
        undefined
      );

      await realtimeChatRef.current.init();
      setIsRealtimeConnected(true);
      toast.success("Voice chat connected - start speaking!");
    } catch (error) {
      console.error("[AIAdjudicator] Error starting realtime chat:", error);
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const endRealtimeChat = () => {
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

  const allMessages = [...messages, ...realtimeMessages];

  // Dynamic title based on active rule set
  const displayTitle = activeRuleSet 
    ? (
        <>
          <span className="text-emerald-300">{activeRuleSet.name}</span>
          <span className="text-white"> {title}</span>
        </>
      )
    : title;

  const cardContent = (
    <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-card)] overflow-hidden backdrop-blur-sm hover-lift">
      <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5">
          <h2 className="text-2xl font-bold">{displayTitle}</h2>
          <p className="text-white/90 text-sm mt-1">{subtitle}</p>
        </div>

        <div className="p-6">
          <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />

          {/* Big Voice Chat Button */}
          <div className="flex flex-col items-center py-6 mb-6">
            <button
              onClick={isRealtimeConnected ? endRealtimeChat : startRealtimeChat}
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

            <p className="mt-4 text-sm text-muted-foreground text-center">Press to speak with House Rules AI.</p>
          </div>

          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Volume2 className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm text-primary">Speaking...</span>
            </div>
          )}

          {/* Response Area */}
          {allMessages.length > 0 && (
            <ScrollArea className="h-[200px] mb-4 border border-border rounded-lg" ref={scrollRef}>
              <div className="space-y-4 p-4">
                {allMessages.map((msg, idx) => (
                  <div key={`msg-${idx}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Action Confirmation Buttons - PROMINENT */}
          {pendingAction && (
            <>
              {console.log("[AIAdjudicator] Rendering ActionConfirmation, pendingAction:", pendingAction)}
              <ActionConfirmation
                onConfirm={confirmAction}
                onCancel={cancelAction}
                isExecuting={isExecutingAction}
                confirmationMessage={pendingAction.confirmationMessage}
              />
            </>
          )}

          {/* Text Input Area with Audio Toggle */}
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
                placeholder="Alternatively, type your question here..."
                className="resize-none pr-24 italic placeholder:italic border border-border"
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
                  onClick={handleTextSend}
                  disabled={isLoading || !input.trim() || isRealtimeConnected}
                  className="rounded-full h-8 w-8"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Context Selector Boxes - Below Input */}
          {!hideContextSelectors && (
            <div className="mt-8 space-y-2">
              <div className="flex gap-4">
                <ContextSelectorBox
                  label="Rules Set"
                  type="ruleSet"
                  activeItem={activeRuleSet}
                  availableItems={userRuleSets}
                  onSelect={setActiveRuleSet}
                  onClear={clearActiveRuleSet}
                />
                <ContextSelectorBox
                  label="Tournaments"
                  type="tournament"
                  activeItem={activeTournament}
                  availableItems={userTournaments}
                  onSelect={setActiveTournament}
                  onClear={clearActiveTournament}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                When a rule set is active, the AI Adjudicator will abide by these rules.
              </p>
            </div>
          )}

          {/* Learn How To Use Section */}
          <LearnHowToUse />
        </div>
      </div>
  );

  // When embedded, return just the card without the outer section wrapper
  if (embedded) {
    return cardContent;
  }

  // When standalone (homepage), wrap in section with max-width and padding
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-slide-up" style={{ animationDelay: "0.2s" }} aria-label="AI Adjudicator">
      {cardContent}
    </section>
  );
};

export default AIAdjudicator;

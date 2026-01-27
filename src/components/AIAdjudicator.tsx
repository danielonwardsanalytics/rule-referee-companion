import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Mic, MicOff, Send, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useChatWithActions } from "@/hooks/useChatWithActions";
import { useActiveContext } from "@/hooks/useActiveContext";
import { useHouseRules } from "@/hooks/useHouseRules";
import { useTournamentPlayers } from "@/hooks/useTournamentPlayers";
import { useTournamentNotes } from "@/hooks/useTournamentNotes";
import { useGameResults } from "@/hooks/useGameResults";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChat, GuidedVoiceContext } from "@/utils/RealtimeAudio";
import { ContextSelectorBox } from "@/components/ai-adjudicator/ContextSelectorBox";
import { TournamentRulesSelector } from "@/components/ai-adjudicator/TournamentRulesSelector";
import { TournamentMiniScoreboard } from "@/components/ai-adjudicator/TournamentMiniScoreboard";
import { LearnHowToUse } from "@/components/ai-adjudicator/LearnHowToUse";
import { ActionConfirmation } from "@/components/ai-adjudicator/ActionConfirmation";
import { useNativeSpeechRecognition } from "@/hooks/useNativeSpeechRecognition";
import { ModeSelector, CompanionMode, modeLabels } from "@/components/ai-adjudicator/ModeSelector";
import { GuidedModeLayout } from "@/components/ai-adjudicator/GuidedModeLayout";
import { AddPlayerModal } from "@/components/tournaments/AddPlayerModal";
import { useGuidedWalkthrough, parseStepFromResponse } from "@/hooks/useGuidedWalkthrough";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
interface AIAdjudicatorProps {
  title?: string;
  subtitle?: string;
  preSelectedRuleSetId?: string;
  preSelectedTournamentId?: string;
  hideContextSelectors?: boolean;
  voice?: string;
  embedded?: boolean; // When true, removes outer wrapper (for use inside pages with existing containers)
  showTournamentProTips?: boolean; // When true, shows tournament-specific pro tips below input
  // Tournament-specific props for the locked rules selector
  tournamentMode?: boolean;
  tournamentGameId?: string;
  tournamentGameName?: string;
  lockedRuleSetId?: string | null;
  lockedRuleSetName?: string | null;
  onLockRuleSet?: (ruleSetId: string) => void;
}

// Mode configuration for dynamic title/subtitle
const modeConfig: Record<CompanionMode, { title: string; subtitle: string }> = {
  hub: {
    title: "Game Companion",
    subtitle: "Settle something, ask anything"
  },
  quickStart: {
    title: "Quick Start Mode",
    subtitle: "Let's get you playing in two minutes"
  },
  tournament: {
    title: "Tournament Mode",
    subtitle: "Track competition without thinking"
  },
  guided: {
    title: "Guided Play Mode",
    subtitle: "Let's walk you through without thinking"
  }
};

const AIAdjudicator = ({
  title,
  subtitle,
  preSelectedRuleSetId,
  preSelectedTournamentId,
  hideContextSelectors = false,
  voice = "alloy",
  embedded = false,
  showTournamentProTips = false,
  tournamentMode = false,
  tournamentGameId,
  tournamentGameName,
  lockedRuleSetId,
  lockedRuleSetName,
  onLockRuleSet,
}: AIAdjudicatorProps) => {
  // Mode state for Game Companion hub
  const [activeMode, setActiveMode] = useState<CompanionMode>('hub');
  const isGuidedMode = activeMode === 'guided';
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

  // Tournament mode: track whether house rules are being used
  const [isUsingTournamentHouseRules, setIsUsingTournamentHouseRules] = useState(!!lockedRuleSetId);
  
  // State for add player modal in tournament mode mini scoreboard
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);

  // Use pre-selected IDs if provided, otherwise use context
  // In tournament mode with locked rules, use the locked rule set ID when toggled on
  const effectiveRuleSetId = tournamentMode 
    ? (isUsingTournamentHouseRules && lockedRuleSetId ? lockedRuleSetId : null)
    : (preSelectedRuleSetId || activeRuleSetId);
  const effectiveTournamentId = preSelectedTournamentId || activeTournamentId;

  // Get house rules for the active rule set
  const { rules: activeRules } = useHouseRules(
    isGuidedMode ? undefined : (effectiveRuleSetId || undefined)
  );
  const houseRulesText = isGuidedMode ? [] : (activeRules?.map((r) => r.rule_text) || []);

  // Get tournament players for context
  const { players: tournamentPlayers } = useTournamentPlayers(
    isGuidedMode ? undefined : (effectiveTournamentId || undefined)
  );
  const tournamentPlayersContext = tournamentPlayers?.map(p => ({
    id: p.id,
    display_name: p.display_name,
    status: p.status || 'active',
  })) || [];

  // Get tournament notes for context
  const { notes: tournamentNotes } = useTournamentNotes(
    isGuidedMode ? undefined : (effectiveTournamentId || undefined)
  );
  const tournamentNotesContext = tournamentNotes?.map(n => ({
    title: n.title,
    content: n.content,
    created_at: n.created_at,
  })) || [];

  // Get game results for context
  const { results: gameResults } = useGameResults(
    isGuidedMode ? undefined : (effectiveTournamentId || undefined)
  );
  const gameResultsContext = gameResults?.map(r => ({
    winner_name: r.tournament_players?.display_name || 'Unknown',
    created_at: r.created_at || '',
    notes: r.notes,
  })) || [];

  // Determine game name from context
  const gameName = isGuidedMode ? undefined : (activeRuleSet?.gameName || activeTournament?.gameName || undefined);

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
  } = useChatWithActions(
    gameName,
    houseRulesText,
    isGuidedMode ? null : effectiveRuleSetId,
    isGuidedMode ? null : effectiveTournamentId,
    tournamentPlayersContext,
    tournamentNotesContext,
    gameResultsContext,
    activeMode
  );
  
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
  
  // Mode switch confirmation state
  const [showModeChangeConfirmation, setShowModeChangeConfirmation] = useState(false);
  const [pendingModeChange, setPendingModeChange] = useState<CompanionMode | null>(null);
  
  // Guided walkthrough state machine - single source of truth
  const guidedWalkthrough = useGuidedWalkthrough();
  
  // Track previous rule set to detect changes
  const previousRuleSetRef = useRef<{ id: string | null; name: string | null }>({ id: null, name: null });
  const [ruleChangeContext, setRuleChangeContext] = useState<string | null>(null);
  
  // Track spoken message IDs to prevent double TTS
  const spokenMessageIdsRef = useRef<Set<string>>(new Set());

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
    // Guided Mode must be STANDARD RULES ONLY (no tournament, no house rules)
    // and must not inject extra context that could override the guided system prompt.
    if (isGuidedMode) return "";

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

  const handleSend = useCallback(async (messageOverride?: string, shouldSpeak?: boolean) => {
    const messageToSend = messageOverride || input;

    // Treat a non-null realtimeChatRef as "connected" for audio-safety.
    // This prevents TTS from firing while WebRTC is still active but state is mid-transition.
    const hasActiveRealtime = isRealtimeConnected || !!realtimeChatRef.current;
    // CRITICAL FIX: Never speak TTS when Realtime WebRTC is active - it has its own audio stream
    // This prevents double audio (WebRTC audio + TTS audio playing simultaneously)
    const willSpeak = hasActiveRealtime 
      ? false 
      : (shouldSpeak !== undefined ? shouldSpeak : isAudioEnabled);

    console.log("[AIAdjudicator] handleSend called:", { 
      messageToSend, 
      willSpeak, 
      activeMode, 
      isRealtimeConnected,
      originalShouldSpeak: shouldSpeak 
    });

    if (!messageToSend.trim()) {
      console.log("[AIAdjudicator] Empty message, skipping");
      return;
    }

    if (!messageOverride) {
      setInput("");
    }

    // In guided mode, we need to provide game context for the AI
    // especially when "Next" is pressed after a voice session established the game
    let messageText: string;
    if (isGuidedMode) {
      // Check if this is a "Next" command that needs game context
      const lowerMsg = messageToSend.toLowerCase().trim();
      const isNextCommand = lowerMsg.includes('next') || lowerMsg === 'continue' || lowerMsg === 'go on' || lowerMsg === 'ready';
      
      if (isNextCommand && guidedWalkthrough.game && guidedWalkthrough.currentStep) {
        // Include full context: game name, current step info, and that we want the NEXT step
        messageText = `[GUIDED MODE CONTEXT: Game is ${guidedWalkthrough.game}. Current step completed: "${guidedWalkthrough.currentStep.summary}". Step ${guidedWalkthrough.stepIndex + 1} of walkthrough.] The player pressed Next. Provide the next step.`;
      } else if (isNextCommand && guidedWalkthrough.currentStep) {
        // We have a step but no game name recorded - try to extract from transcript
        messageText = `[GUIDED MODE: Current step was "${guidedWalkthrough.currentStep.summary}"] Next step please.`;
      } else {
        messageText = messageToSend;
      }
    } else {
      messageText = buildContextPrompt() + messageToSend;
    }
    console.log("[AIAdjudicator] Sending message with context:", messageText);
    
    // In guided mode, add user message to transcript (show the original, not the context-enhanced version)
    if (activeMode === 'guided') {
      guidedWalkthrough.addToTranscript('user', messageToSend.includes('[') ? 'Next' : messageToSend);
    }

    try {
      await sendMessage(messageText, async (aiResponse, hasAction) => {
        console.log("[AIAdjudicator] sendMessage completed:", { hasAction, responseLength: aiResponse?.length });
        
        // In guided mode, handle transcript and step parsing
        if (activeMode === 'guided' && aiResponse) {
          // Add AI response to transcript
          const messageId = guidedWalkthrough.addToTranscript('assistant', aiResponse);
          
          // Detect the type of message sent
          const lowerMessage = messageToSend.toLowerCase().trim();
          
          // Messages that should trigger step parsing
          const isNextCommand = lowerMessage === 'next' || 
                               lowerMessage === 'continue' || 
                               lowerMessage === 'go on' ||
                               lowerMessage === 'ready';
                               
          const isGameStartRequest = lowerMessage.includes('guide') || 
                                     lowerMessage.includes('walk') ||
                                     lowerMessage.includes('teach') ||
                                     lowerMessage.includes('show me') ||
                                     lowerMessage.includes('help me play') ||
                                     lowerMessage.includes('let\'s play') ||
                                     lowerMessage.includes('how do i play') ||
                                     lowerMessage.includes('how to play');
                                     
          const isNavigationCommand = ['skip', 'go back', 'restart', 'previous', 'start over'].some(
            cmd => lowerMessage.includes(cmd)
          );
          
          // Check if the AI response contains a step (has "DO THIS NOW:")
          const hasStepMarker = aiResponse.includes('DO THIS NOW:') || 
                                aiResponse.includes('**DO THIS NOW:**') ||
                                aiResponse.includes('**DO THIS NOW**:');
          
          console.log('[AIAdjudicator] Guided mode message analysis:', {
            lowerMessage: lowerMessage.substring(0, 50),
            isNextCommand,
            isGameStartRequest,
            isNavigationCommand,
            hasStepMarker,
            currentStepCount: guidedWalkthrough.steps.length
          });
          
          // If this is a game start and we don't have a game name yet, try to extract it
          if (isGameStartRequest && !guidedWalkthrough.game) {
            const gamePatterns = [
              /(?:guide.*through|walk.*through|playing|teach.*)\s+([A-Z][a-zA-Z0-9\s\-]+?)(?:\.|,|!|\s+is|\s+where)/i,
              /^([A-Z][a-zA-Z0-9\-]+)\s+is\s+(?:a|an)/i,
            ];
            for (const pattern of gamePatterns) {
              const match = aiResponse.match(pattern);
              if (match && match[1]) {
                const extractedGame = match[1].trim();
                console.log('[AIAdjudicator] Text: Extracted game name:', extractedGame);
                guidedWalkthrough.setGameName(extractedGame);
                break;
              }
            }
          }
          
          // Parse and add step if this is a step-producing message
          if ((isNextCommand || isGameStartRequest || isNavigationCommand) && hasStepMarker) {
            const parsedStep = parseStepFromResponse(aiResponse);
            if (parsedStep) {
              console.log('[AIAdjudicator] Adding step:', {
                title: parsedStep.title,
                summary: parsedStep.summary,
                stepNumber: guidedWalkthrough.steps.length + 1
              });
              guidedWalkthrough.addStep(parsedStep);
            } else {
              console.warn('[AIAdjudicator] Step marker found but parsing failed');
            }
          } else if (hasStepMarker) {
            // Response has step marker but wasn't triggered by expected command
            // This might happen on first load or edge cases - still parse it
            console.log('[AIAdjudicator] Unexpected step marker found, parsing anyway');
            const parsedStep = parseStepFromResponse(aiResponse);
            if (parsedStep) {
              guidedWalkthrough.addStep(parsedStep);
            }
          }
          // For questions without step markers, step is NOT changed - just added to transcript
          
          // Speak if needed (using transcript message ID for dedup)
          if (willSpeak && !guidedWalkthrough.hasBeenSpoken(messageId)) {
            console.log("[AIAdjudicator] TTS: Speaking message", messageId);
            guidedWalkthrough.markAsSpoken(messageId);
            await speakResponse(aiResponse);
          }
        } else {
          // Non-guided mode: original behavior
          const messageId = `msg-${Date.now()}-${aiResponse?.substring(0, 20)}`;
          
          if (willSpeak && !spokenMessageIdsRef.current.has(messageId)) {
            console.log("[AIAdjudicator] TTS: Speaking message", messageId);
            spokenMessageIdsRef.current.add(messageId);
            await speakResponse(aiResponse);
          } else if (willSpeak) {
            console.log("[AIAdjudicator] TTS: Skipping duplicate message", messageId);
          }
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
   }, [input, isAudioEnabled, activeMode, sendMessage, ruleChangeContext, guidedWalkthrough, isRealtimeConnected, isGuidedMode]);

  const speakResponse = useCallback(async (text: string) => {
    // CRITICAL FIX: Double-check Realtime is not active before TTS
    // This catches cases where the state might have changed during async operations
    if (isRealtimeConnected || realtimeChatRef.current) {
      console.log("[AIAdjudicator] TTS: Skipping - Realtime WebRTC audio is active (has its own audio stream)");
      return;
    }
    
    // Prevent concurrent TTS calls
    if (isSpeaking) {
      console.log("[AIAdjudicator] TTS: Already speaking, skipping concurrent call");
      return;
    }
    
    console.log("[AIAdjudicator] TTS: Proceeding with text-to-speech for:", text.substring(0, 50) + "...");
    
    try {
      // Cancel any previous audio before starting new
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Final realtime check before making the network call
      if (isRealtimeConnected || realtimeChatRef.current) {
        console.log("[AIAdjudicator] TTS: Aborting - Realtime became active during setup");
        return;
      }
      
      setIsSpeaking(true);
      console.log("[AIAdjudicator] TTS: Starting speech");

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
        console.log("[AIAdjudicator] TTS: Audio playing");
      }
    } catch (error) {
      console.error("[AIAdjudicator] TTS error:", error);
      toast.error(`Failed to speak response: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsSpeaking(false);
    }
    // Note: setIsSpeaking(false) is handled by the audio onEnded event
  }, [isSpeaking, voice, isRealtimeConnected]);

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
      // CRITICAL: Stop any TTS before starting voice chat to prevent double audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsSpeaking(false);
      
      setIsAudioEnabled(true);

      toast.info("Connecting to voice chat...");

      // Guided Mode voice chat should use the backend's guided voice instructions,
      // and MUST NOT include house rules/tournament context.
      // We achieve this by passing `instructions: undefined` and `houseRules: undefined`
      // so realtime-session can build the correct instructions based on activeMode.
      const rulesContext = houseRulesText.map((r, i) => `Rule ${i + 1}: ${r}`).join("\n");

      let contextInstructions: string | undefined;
      if (!isGuidedMode) {
        contextInstructions = `You are a helpful card game rules expert`;
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

        contextInstructions += `Answer questions clearly and concisely about game rules, strategies, and disputes. 
When house rules apply, explain how they modify the standard rules.
Keep responses under 3 sentences unless more detail is requested.`;
      }

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
                
                // CRITICAL: In Guided Mode, add user voice message to transcript
                if (isGuidedMode) {
                  guidedWalkthrough.addToTranscript('user', transcript);
                }
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
            // CRITICAL: In Guided Mode, parse steps from voice responses
            // NOTE: We parse the step here but do NOT disconnect yet - wait for response.done
            if (isGuidedMode && currentAssistantMessage.trim()) {
              console.log('[AIAdjudicator] Voice transcript complete in Guided Mode, parsing for steps...');
              
              // Add to transcript
              guidedWalkthrough.addToTranscript('assistant', currentAssistantMessage);
              
              // Try to extract game name if not already set (from phrases like "UNO is a..." or "Let's play Monopoly")
              if (!guidedWalkthrough.game) {
                const gamePatterns = [
                  /(?:playing|guide.*through|walk.*through|teaching|let's play)\s+([A-Z][a-zA-Z0-9\s\-]+?)(?:\.|,|!|\s+is|\s+where)/i,
                  /^([A-Z][a-zA-Z0-9\-]+)\s+is\s+(?:a|an)/i,
                  /(?:game\s+of|playing)\s+([A-Z][a-zA-Z0-9\s\-]+)/i,
                ];
                for (const pattern of gamePatterns) {
                  const match = currentAssistantMessage.match(pattern);
                  if (match && match[1]) {
                    const extractedGame = match[1].trim();
                    console.log('[AIAdjudicator] Voice: Extracted game name:', extractedGame);
                    guidedWalkthrough.setGameName(extractedGame);
                    break;
                  }
                }
              }
              
              // Check for step marker and parse
              const hasStepMarker = currentAssistantMessage.includes('DO THIS NOW:') || 
                                    currentAssistantMessage.includes('**DO THIS NOW:**') ||
                                    currentAssistantMessage.includes('**DO THIS NOW**:');
              
              if (hasStepMarker) {
                const parsedStep = parseStepFromResponse(currentAssistantMessage);
                if (parsedStep) {
                  console.log('[AIAdjudicator] Voice: Parsed step:', {
                    title: parsedStep.title,
                    summary: parsedStep.summary,
                    stepNumber: guidedWalkthrough.steps.length + 1,
                    gameName: guidedWalkthrough.game
                  });
                  guidedWalkthrough.addStep(parsedStep);
                  // NOTE: Do NOT disconnect here - wait for response.done + audio buffer
                } else {
                  console.warn('[AIAdjudicator] Voice: Step marker found but parsing failed');
                }
              } else {
                console.log('[AIAdjudicator] Voice: Response has no step marker, likely a Q&A answer');
              }
            }
            
            currentAssistantMessage = "";
          }
          
          // CRITICAL: Wait for response.done (final event) before disconnecting
          // This ensures all audio has been SENT. We then add buffer time for playback.
          if (event.type === "response.done" && isGuidedMode) {
            // Check if we just delivered a step (steps array grew)
            const hasSteps = guidedWalkthrough.steps.length > 0;
            if (hasSteps) {
              console.log('[AIAdjudicator] Voice: response.done received, waiting for audio playback to finish...');
              // Wait 3 seconds after response.done to let the WebRTC audio stream finish playing
              // The audio is streamed in real-time, but there's buffer delay
              setTimeout(() => {
                console.log('[AIAdjudicator] Voice: Audio buffer complete, disconnecting voice chat');
                endRealtimeChat();
              }, 3000);
            }
          }
        },
        contextInstructions,
        voice,
        // In guided mode, use the walkthrough's game name (more up-to-date) or fall back to context
        isGuidedMode ? (guidedWalkthrough.game || undefined) : gameName,
        isGuidedMode ? undefined : houseRulesText,
        // Voice chat is Q&A only - no action detection needed
        // Actions are handled by text chat, voice chat politely declines
        undefined,
        activeMode,
        // CRITICAL: Pass guided context for session continuity when re-engaging voice chat
        isGuidedMode && guidedWalkthrough.game && guidedWalkthrough.currentStep ? {
          game: guidedWalkthrough.game,
          currentStep: guidedWalkthrough.currentStep.title,
          stepIndex: guidedWalkthrough.stepIndex,
          totalSteps: guidedWalkthrough.steps.length
        } as GuidedVoiceContext : undefined
      );

      await realtimeChatRef.current.init();
      setIsRealtimeConnected(true);
      toast.success("Voice chat connected - start speaking!");
    } catch (error) {
      console.error("[AIAdjudicator] Error starting realtime chat:", error);
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const endRealtimeChat = useCallback(() => {
    console.log("[AIAdjudicator] endRealtimeChat called - disconnecting voice chat");
    
    // CRITICAL: Stop TTS audio as well when ending realtime
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    
    // Disconnect the WebRTC connection and release mic
    if (realtimeChatRef.current) {
      realtimeChatRef.current.disconnect();
      realtimeChatRef.current = null;
    }
    
    // Update state AFTER disconnecting to ensure cleanup happens
    setIsRealtimeConnected(false);
    setIsAudioEnabled(false);
    
    // PHASE 2 FIX: Do NOT clear realtimeMessages on disconnect
    // Messages persist in transcript - only clear on explicit reset
    console.log("[AIAdjudicator] Voice chat disconnected, mic released, preserving transcript");
  }, []);

  // Check if there's an active session that should trigger confirmation
  const hasActiveSession = useCallback(() => {
    // Check if there are any messages in the current session
    const hasMessages = messages.length > 0 || realtimeMessages.length > 0;
    // Check if guided mode has started
    const hasGuidedSession = activeMode === 'guided' && (guidedWalkthrough.transcript.length > 0 || guidedWalkthrough.currentStep !== null);
    return hasMessages || hasGuidedSession;
  }, [messages.length, realtimeMessages.length, activeMode, guidedWalkthrough.transcript.length, guidedWalkthrough.currentStep]);

  // Handle mode change request with confirmation
  const handleModeChangeRequest = useCallback((newMode: CompanionMode) => {
    if (hasActiveSession()) {
      setPendingModeChange(newMode);
      setShowModeChangeConfirmation(true);
    } else {
      // Always stop voice chat when switching modes.
      endRealtimeChat();
      setActiveMode(newMode);
    }
  }, [hasActiveSession, endRealtimeChat]);

  // Confirm mode change - wipe session and switch
  const handleConfirmModeChange = useCallback(() => {
    // Always stop voice chat when wiping a session.
    endRealtimeChat();
    // Clear all session data
    clearMessages();
    setRealtimeMessages([]);
    guidedWalkthrough.reset();
    
    // Switch to the new mode
    if (pendingModeChange) {
      setActiveMode(pendingModeChange);
    }
    
    // Close dialog
    setShowModeChangeConfirmation(false);
    setPendingModeChange(null);
  }, [clearMessages, guidedWalkthrough, pendingModeChange, endRealtimeChat]);

  // Cancel mode change
  const handleCancelModeChange = useCallback(() => {
    setShowModeChangeConfirmation(false);
    setPendingModeChange(null);
  }, []);

  useEffect(() => {
    return () => {
      realtimeChatRef.current?.disconnect();
    };
  }, []);

  const allMessages = [...messages, ...realtimeMessages];

  // Get current mode configuration (use props if provided, otherwise use mode config)
  const currentModeConfig = modeConfig[activeMode];
  const displayTitle = title ? title : (
    activeRuleSet && activeMode === 'tournament'
      ? (
          <>
            <span className="text-emerald-300">{activeRuleSet.name}</span>
            <span className="text-white"> {currentModeConfig.title}</span>
          </>
        )
      : currentModeConfig.title
  );
  const displaySubtitle = subtitle ? subtitle : currentModeConfig.subtitle;

  const cardContent = (
    <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-card)] overflow-hidden backdrop-blur-sm hover-lift">
      <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5">
        <h2 className="text-2xl font-bold">{displayTitle}</h2>
        <p className="text-white/90 text-sm mt-1">{displaySubtitle}</p>
      </div>

      <div className="p-6">
        <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />

        {/* Guided Mode - Completely different layout */}
        {activeMode === 'guided' ? (
          <GuidedModeLayout
            messages={messages}
            realtimeMessages={realtimeMessages}
            transcript={guidedWalkthrough.transcript}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            isRealtimeConnected={isRealtimeConnected}
            isSpeaking={isSpeaking}
            isAudioEnabled={isAudioEnabled}
            setIsAudioEnabled={setIsAudioEnabled}
            onSend={handleSend}
            onStartRealtime={startRealtimeChat}
            onEndRealtime={endRealtimeChat}
            voice={voice}
            gameName={gameName}
            houseRulesText={houseRulesText}
            onModeChange={handleModeChangeRequest}
            currentStep={guidedWalkthrough.currentStep}
            stepIndex={guidedWalkthrough.stepIndex}
            totalSteps={guidedWalkthrough.steps.length}
            isComplete={guidedWalkthrough.status === 'complete'}
            onNextStep={() => {
              // CRITICAL: Disconnect any lingering voice session FIRST to prevent double audio
              // Then send "Next" through text chat with step context
              if (realtimeChatRef.current) {
                realtimeChatRef.current.disconnect();
                realtimeChatRef.current = null;
                setIsRealtimeConnected(false);
              }
              
              // Include current step context AND step number so AI knows exactly where we are
              // This is crucial for proper progression - AI needs to know which step just completed
              const stepNumber = guidedWalkthrough.stepIndex + 1;
              const gameName = guidedWalkthrough.game || 'the game';
              const stepContext = guidedWalkthrough.currentStep 
                ? `[GUIDED MODE: Playing ${gameName}. Just completed Step ${stepNumber}: "${guidedWalkthrough.currentStep.summary}"] Provide the NEXT step (Step ${stepNumber + 1}).`
                : `[GUIDED MODE: Playing ${gameName}] Provide the next step.`;
              
              console.log('[AIAdjudicator] Next button context:', stepContext);
              
              // Use TTS for the response (shouldSpeak = true)
              handleSend(stepContext, true);
            }}
            onPrevStep={() => {
              guidedWalkthrough.prevStep();
            }}
            onStopSpeaking={() => {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
              setIsSpeaking(false);
            }}
            onReset={() => {
              endRealtimeChat();
              guidedWalkthrough.reset();
              clearMessages();
              setRealtimeMessages([]);
            }}
          />
        ) : (
          <>
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
          </>
        )}

        {/* Text Input Area with Audio Toggle - Only for non-guided modes */}
        {activeMode !== 'guided' && (
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
        )}

        {/* Tournament Pro Tips - Only shown on tournament pages and not in guided mode */}
        {showTournamentProTips && activeMode !== 'guided' && (
            <div className="mt-4 p-3 bg-secondary/50 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Pro tip:</span> Ask AI to summarise where you left off or get a summary of your last session, including rules updates and notes.
              </p>
            </div>
          )}

          {/* Mode Selector and Context Selectors - Below Input */}
          {!hideContextSelectors && !tournamentMode && (
            <div className="mt-8 space-y-4">
              {/* Context Selectors - Only visible in Tournament mode */}
              {activeMode === 'tournament' && (
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
              )}

              {/* Mode Selector - Always visible */}
              <ModeSelector 
                activeMode={activeMode}
                onModeChange={setActiveMode}
                onModeChangeRequest={handleModeChangeRequest}
              />
              
              {/* Mini Tournament Scoreboard - Below buttons so they don't move */}
              {activeMode === 'tournament' && (
                <div className="pt-8">
                  <TournamentMiniScoreboard
                    tournament={activeTournament}
                    players={tournamentPlayers}
                    isLoading={false}
                    onAddPlayer={() => setShowAddPlayerModal(true)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tournament Mode: Single Rules Selector */}
          {tournamentMode && tournamentGameId && tournamentGameName && onLockRuleSet && (
            <div className="mt-8 space-y-2">
              <div className="flex justify-center">
                <div className="w-full max-w-xs">
                  <TournamentRulesSelector
                    tournamentId={effectiveTournamentId || ""}
                    gameId={tournamentGameId}
                    gameName={tournamentGameName}
                    lockedRuleSetId={lockedRuleSetId || null}
                    lockedRuleSetName={lockedRuleSetName || null}
                    isUsingHouseRules={isUsingTournamentHouseRules}
                    onToggleRules={setIsUsingTournamentHouseRules}
                    onLockRuleSet={onLockRuleSet}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {lockedRuleSetId 
                  ? "Toggle between locked house rules and official rules."
                  : "Add house rules to lock them into this tournament."}
              </p>
            </div>
          )}

          {/* Learn How To Use Section */}
          <LearnHowToUse />
          
          {/* Add Player Modal for Mini Scoreboard (homepage tournament mode) */}
          {activeTournament && !tournamentMode && (
            <AddPlayerModal
              isOpen={showAddPlayerModal}
              onClose={() => setShowAddPlayerModal(false)}
              tournamentId={activeTournament.id}
            />
          )}
        </div>
      </div>
  );

  // Mode change confirmation dialog
  const modeChangeDialog = (
    <AlertDialog open={showModeChangeConfirmation} onOpenChange={setShowModeChangeConfirmation}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End {modeLabels[activeMode]} Session?</AlertDialogTitle>
          <AlertDialogDescription>
            Your session transcript will be cleared and a new session will start. Are you sure you want to exit?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelModeChange}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmModeChange}>
            Yes, End Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // When embedded, return just the card without the outer section wrapper
  if (embedded) {
    return (
      <>
        {cardContent}
        {modeChangeDialog}
      </>
    );
  }

  // When standalone (homepage), wrap in section with max-width and padding
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-slide-up" style={{ animationDelay: "0.2s" }} aria-label="AI Adjudicator">
      {cardContent}
      {modeChangeDialog}
    </section>
  );
};

export default AIAdjudicator;

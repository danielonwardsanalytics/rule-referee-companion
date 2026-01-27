import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mic, MicOff, Send, Loader2, Volume2, Check, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import { useNativeSpeechRecognition } from "@/hooks/useNativeSpeechRecognition";
import { useWebRTCSpeech } from "@/hooks/useWebRTCSpeech";
import type { HouseRule } from "@/hooks/useHouseRules";

interface RuleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleSetId: string;
  ruleSetName: string;
  gameName: string;
  existingRule?: HouseRule | null;
  currentRules: HouseRule[];
  onSave: (data: { ruleText: string; title?: string }) => Promise<void>;
}

export const RuleEditorModal = ({
  isOpen,
  onClose,
  ruleSetId,
  ruleSetName,
  gameName,
  existingRule,
  currentRules,
  onSave,
}: RuleEditorModalProps) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [ruleText, setRuleText] = useState("");
  const [suggestedRule, setSuggestedRule] = useState<string | null>(null); // Rule awaiting confirmation
  const [isManualEditMode, setIsManualEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [isVoiceChatConnecting, setIsVoiceChatConnecting] = useState(false);
  const [isVoiceChatSpeaking, setIsVoiceChatSpeaking] = useState(false); // For live voice chat audio
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string, isSuggestion?: boolean}>>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  
  // WebRTC speech for unified audio (text-to-speech replacement)
  const { speakText: speakResponse, stopSpeaking, isSpeaking: isWebRTCSpeechPlaying } = useWebRTCSpeech("alloy");
  
  // Combined speaking indicator - true if either speech system is active
  const isSpeaking = isWebRTCSpeechPlaying || isVoiceChatSpeaking;

  // Native speech recognition hook
  const { 
    isListening: isNativeListening, 
    transcript: nativeTranscript, 
    startListening, 
    stopListening,
    isSupported: isSpeechSupported 
  } = useNativeSpeechRecognition();

  const isEditing = !!existingRule;

  useEffect(() => {
    if (isOpen) {
      if (existingRule) {
        setTitle(existingRule.title || "");
        setRuleText(existingRule.rule_text);
      } else {
        setTitle("");
        setRuleText("");
      }
      setMessages([]);
      setSuggestedRule(null);
      setIsManualEditMode(false);
      setIsAudioEnabled(false);
      setIsVoiceChatActive(false);
    }
  }, [isOpen, existingRule]);

  // Cleanup voice chat on unmount or close
  useEffect(() => {
    return () => {
      if (realtimeChatRef.current) {
        realtimeChatRef.current.disconnect();
        realtimeChatRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAICommand = async (command: string, shouldSpeak?: boolean) => {
    if (!command.trim()) return;

    const willSpeak = shouldSpeak !== undefined ? shouldSpeak : isAudioEnabled;
    
    setMessages(prev => [...prev, { role: 'user', content: command }]);
    setIsProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Construct context for AI
      const context = isEditing 
        ? `You are editing an existing rule. Current rule text: "${ruleText}"\nUser wants to: ${command}`
        : `You are creating a new rule for ${gameName}. User wants to: ${command}`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: `You are a helpful assistant for creating and editing house rules for the card game ${gameName}. 
                
When the user asks you to create or modify a rule, respond with ONLY the rule text itself - no explanations, no prefixes like "Here's the rule:", just the actual rule.

If the user asks a question or wants clarification, respond normally.

Keep rules clear, concise, and unambiguous. Rules should be actionable during gameplay.`
              },
              { role: "user", content: context }
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      // Parse streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      }

      if (fullResponse) {
        // Check if response looks like a rule (not a question/clarification)
        const looksLikeRule = !fullResponse.includes('?') && fullResponse.length > 10 && fullResponse.length < 500;
        
        if (looksLikeRule) {
          // Store as suggestion instead of directly updating
          setSuggestedRule(fullResponse.trim());
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: fullResponse.trim(),
            isSuggestion: true 
          }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
        }

        if (willSpeak) {
          await speakResponse(looksLikeRule ? `Here's the suggested rule: ${fullResponse.trim()}. Click "Use This Rule" to confirm.` : fullResponse);
        }
      }
    } catch (error) {
      console.error("AI command error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process command";
      toast.error(errorMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRule = () => {
    if (suggestedRule) {
      setRuleText(suggestedRule);
      setSuggestedRule(null);
      toast.success("Rule confirmed!");
    }
  };

  const handleRejectRule = () => {
    setSuggestedRule(null);
    setMessages(prev => [...prev, { role: 'assistant', content: "No problem! Tell me what changes you'd like to make." }]);
  };

  // Note: speakResponse is now provided by useWebRTCSpeech hook (line ~60)

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const command = chatInput;
    setChatInput("");
    handleAICommand(command);
  };

  // Update chatInput when native transcript changes
  useEffect(() => {
    if (nativeTranscript) {
      setChatInput(nativeTranscript);
    }
  }, [nativeTranscript]);

  const handleDictateToggle = async () => {
    if (isNativeListening) {
      await stopListening();
      toast.success("Dictation stopped");
    } else {
      await startListening();
    }
  };

  // Voice Chat Functions
  const handleRealtimeMessage = (event: any) => {
    console.log("[RuleEditorModal] Realtime event:", event.type);

    if (event.type === "response.audio_transcript.delta") {
      // Streaming transcript from AI
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === "assistant" && !lastMessage.isSuggestion) {
          return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + event.delta }];
        }
        return [...prev, { role: "assistant", content: event.delta }];
      });
    } else if (event.type === "response.audio_transcript.done") {
      // Full transcript received - check if it's a rule suggestion
      const transcript = event.transcript || "";
      
      // Check if the AI is explicitly defining/creating a rule
      const isDefiningRule = 
        transcript.toLowerCase().includes("the rule is:") ||
        transcript.toLowerCase().includes("here's the rule:") ||
        transcript.toLowerCase().includes("your rule is:") ||
        transcript.toLowerCase().includes("i've created:") ||
        transcript.toLowerCase().includes("i've updated the rule to:") ||
        transcript.toLowerCase().includes("the new rule is:") ||
        transcript.toLowerCase().includes("rule text:") ||
        /^(when|if|players? (can|cannot|must|may)|during|at the|after|before)/i.test(transcript.trim());
      
      // Check it's NOT a conversational response
      const isConversational = 
        transcript.toLowerCase().includes("you're welcome") ||
        transcript.toLowerCase().includes("no problem") ||
        transcript.toLowerCase().includes("is there anything else") ||
        transcript.toLowerCase().includes("let me know") ||
        transcript.toLowerCase().includes("happy to help") ||
        transcript.toLowerCase().includes("glad") ||
        transcript.toLowerCase().includes("sure") ||
        transcript.toLowerCase().includes("okay") ||
        transcript.toLowerCase().includes("great!") ||
        transcript.includes("?") ||
        transcript.length < 20;
      
      // Check for voice confirmation
      const userConfirmed = 
        transcript.toLowerCase().includes("yes") ||
        transcript.toLowerCase().includes("use it") ||
        transcript.toLowerCase().includes("that's perfect") ||
        transcript.toLowerCase().includes("confirm") ||
        transcript.toLowerCase().includes("perfect");
      
      // If user confirmed via voice and we have a pending suggestion
      if (userConfirmed && suggestedRule) {
        handleConfirmRule();
        return;
      }
      
      if (isDefiningRule && !isConversational) {
        // Extract the actual rule text
        let ruleContent = transcript
          .replace(/^(the rule is:|here's the rule:|your rule is:|i've created:|i've updated the rule to:|the new rule is:|rule text:)/i, "")
          .trim();
        
        if (ruleContent.length > 10) {
          // Store as suggestion, don't auto-apply
          setSuggestedRule(ruleContent);
          // Update the last message to be a suggestion
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content: ruleContent,
                isSuggestion: true
              };
            }
            return newMessages;
          });
          console.log("[RuleEditorModal] Suggested rule:", ruleContent);
        }
      } else {
        console.log("[RuleEditorModal] Not updating rule - conversational response detected");
      }
    } else if (event.type === "conversation.item.input_audio_transcription.completed") {
      // User's speech transcribed
      const userText = event.transcript || "";
      if (userText.trim()) {
        setMessages(prev => [...prev, { role: "user", content: userText }]);
      }
    } else if (event.type === "response.audio.delta") {
      setIsVoiceChatSpeaking(true);
    } else if (event.type === "response.audio.done") {
      setIsVoiceChatSpeaking(false);
    }
  };

  const startVoiceChat = async () => {
    try {
      setIsVoiceChatConnecting(true);
      
      const instructions = `You are a helpful assistant for creating and editing house rules for the card game ${gameName}.
      
When the user asks you to create or modify a rule, respond with ONLY the rule text itself - no explanations, no prefixes like "Here's the rule:", just the actual rule.

If the user asks a question or wants clarification, respond normally.

Keep rules clear, concise, and unambiguous. Rules should be actionable during gameplay.

Current rule set: "${ruleSetName}"
${ruleText ? `Current rule being edited: "${ruleText}"` : "Creating a new rule."}`;

      realtimeChatRef.current = new RealtimeChat(
        handleRealtimeMessage,
        instructions,
        "alloy",
        gameName,
        currentRules.map(r => r.rule_text)
      );

      await realtimeChatRef.current.init();
      setIsVoiceChatActive(true);
      setIsAudioEnabled(true);
      toast.success("Voice chat connected - speak now!");
    } catch (error) {
      console.error("[RuleEditorModal] Voice chat error:", error);
      toast.error("Failed to connect voice chat");
    } finally {
      setIsVoiceChatConnecting(false);
    }
  };

  const stopVoiceChat = () => {
    if (realtimeChatRef.current) {
      realtimeChatRef.current.disconnect();
      realtimeChatRef.current = null;
    }
    setIsVoiceChatActive(false);
    toast.info("Voice chat disconnected");
  };

  const toggleVoiceChat = () => {
    if (isVoiceChatActive) {
      stopVoiceChat();
    } else {
      startVoiceChat();
    }
  };

  const handleSave = async () => {
    if (!ruleText.trim()) {
      toast.error("Please enter a rule");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ ruleText: ruleText.trim(), title: title.trim() || undefined });
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save rule");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Rule" : "Add New Rule"}
          </DialogTitle>
        </DialogHeader>

        {/* Audio is now handled by useWebRTCSpeech hook */}

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Rule Title (optional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Stack Draw Cards"
              disabled={isSaving}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate a title
            </p>
          </div>

          {/* Rule Text Display/Edit */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Rule Text</label>
              <Button
                size="sm"
                variant={isManualEditMode ? "default" : "outline"}
                onClick={() => setIsManualEditMode(!isManualEditMode)}
                className="h-7 text-xs"
              >
                <Pencil className="h-3 w-3 mr-1" />
                {isManualEditMode ? "Done Editing" : "Edit Manually"}
              </Button>
            </div>
            
            {isManualEditMode ? (
              <Textarea
                value={ruleText}
                onChange={(e) => setRuleText(e.target.value)}
                placeholder="Enter your rule here..."
                className="min-h-[120px]"
                disabled={isSaving}
              />
            ) : (
              <div className="min-h-[120px] p-4 bg-muted/50 rounded-lg border border-border">
                {ruleText ? (
                  <p className="text-sm whitespace-pre-wrap">{ruleText}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Use the AI chat below to create your rule, or click "Edit Manually" to type it yourself.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* AI Chat Section */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-primary/10 px-4 py-2 border-b border-border">
              <h3 className="text-sm font-medium">AI Rule Assistant</h3>
              <p className="text-xs text-muted-foreground">
                Describe your rule and the AI will write it for you
              </p>
            </div>

            {/* Chat Messages */}
            {messages.length > 0 && (
              <ScrollArea className="h-[150px] p-4" ref={scrollRef}>
                <div className="space-y-3">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : msg.isSuggestion
                            ? "bg-emerald-500/20 border border-emerald-500/40 text-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {msg.isSuggestion && (
                          <p className="text-xs text-emerald-400 font-medium mb-1">Suggested Rule:</p>
                        )}
                        {msg.content}
                        {/* Show confirmation buttons for the latest suggestion */}
                        {msg.isSuggestion && suggestedRule && idx === messages.length - 1 && (
                          <div className="flex gap-2 mt-3 pt-2 border-t border-emerald-500/30">
                            <Button
                              size="sm"
                              onClick={handleConfirmRule}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Use This Rule
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleRejectRule}
                              className="h-7 text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Modify
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Voice Chat / Speaking Indicator */}
            {(isSpeaking || isVoiceChatActive) && (
              <div className="flex items-center justify-center gap-2 py-2 border-t border-border">
                {isVoiceChatActive && !isSpeaking && (
                  <>
                    <div className="flex items-center gap-[2px]">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="w-1 bg-primary rounded-full animate-pulse"
                          style={{
                            height: `${[6, 10, 14, 10, 6][i - 1]}px`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-primary">Voice Chat Active - Speak now</span>
                  </>
                )}
                {isSpeaking && (
                  <>
                    <Volume2 className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-xs text-primary">Speaking...</span>
                  </>
                )}
              </div>
            )}

            {/* Chat Input */}
            <div className="p-3 border-t border-border space-y-2">
              <div className="flex items-center justify-end gap-2">
                <span className={`text-xs ${isAudioEnabled ? "text-green-500" : "text-red-500"}`}>
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
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyPress}
                  placeholder="e.g., Create a rule where players can stack +2 cards"
                  className="resize-none pr-20 text-sm"
                  rows={2}
                  disabled={isProcessing || isSaving}
                />
                
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  {/* Voice Chat Button - mini version */}
                  <Button
                    size="icon"
                    variant={isVoiceChatActive ? "default" : "ghost"}
                    onClick={toggleVoiceChat}
                    disabled={isProcessing || isSaving || isVoiceChatConnecting}
                    className={`rounded-full h-7 w-7 ${isVoiceChatActive ? "bg-primary animate-pulse-glow" : ""}`}
                    title={isVoiceChatActive ? "Stop voice chat" : "Start voice chat"}
                  >
                    {isVoiceChatConnecting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <div className="flex items-center justify-center gap-[1px]">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`w-[2px] rounded-full transition-all ${
                              isVoiceChatActive 
                                ? "bg-primary-foreground" 
                                : "bg-current"
                            }`}
                            style={{
                              height: `${[4, 8, 12, 8, 4][i - 1]}px`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </Button>

                  {/* Dictate Button */}
                  <Button
                    size="icon"
                    variant={isNativeListening ? "default" : "ghost"}
                    onClick={handleDictateToggle}
                    disabled={isProcessing || isSaving || isVoiceChatActive || !isSpeechSupported}
                    className="rounded-full h-7 w-7"
                    title={isNativeListening ? "Stop dictation" : "Dictate"}
                  >
                    {isNativeListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  </Button>
                  
                  {/* Send Button */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleChatSend}
                    disabled={isProcessing || !chatInput.trim() || isSaving || isVoiceChatActive}
                    className="rounded-full h-7 w-7"
                    title="Send"
                  >
                    {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!ruleText.trim() || isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {isEditing ? "Save Changes" : "Add Rule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
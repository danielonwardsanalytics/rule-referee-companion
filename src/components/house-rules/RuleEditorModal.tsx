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
  const [isManualEditMode, setIsManualEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [isVoiceChatConnecting, setIsVoiceChatConnecting] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const realtimeChatRef = useRef<RealtimeChat | null>(null);

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
          setRuleText(fullResponse.trim());
          setMessages(prev => [...prev, { role: 'assistant', content: `I've updated the rule to: "${fullResponse.trim()}"` }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
        }

        if (willSpeak) {
          await speakResponse(looksLikeRule ? `I've updated the rule to: ${fullResponse.trim()}` : fullResponse);
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

  const speakResponse = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text, voice: "alloy" },
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
      console.error("[RuleEditorModal] TTS error:", error);
    } finally {
      setIsSpeaking(false);
    }
  };

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
      toast.info("Recording - speak now!");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
          setChatInput(data.text);
        }
      };
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio");
    }
  };

  // Voice Chat Functions
  const handleRealtimeMessage = (event: any) => {
    console.log("[RuleEditorModal] Realtime event:", event.type);

    if (event.type === "response.audio_transcript.delta") {
      // Streaming transcript from AI
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === "assistant" && !lastMessage.content.includes("I've updated")) {
          return [...prev.slice(0, -1), { ...lastMessage, content: lastMessage.content + event.delta }];
        }
        return [...prev, { role: "assistant", content: event.delta }];
      });
    } else if (event.type === "response.audio_transcript.done") {
      // Full transcript received - check if it's a rule
      const transcript = event.transcript || "";
      const looksLikeRule = !transcript.includes('?') && transcript.length > 10 && transcript.length < 500;
      
      if (looksLikeRule) {
        // Extract the rule from the response
        const ruleMatch = transcript.match(/(?:rule[:\s]*|updated[:\s]*|created[:\s]*)?["']?([^"']+)["']?/i);
        if (ruleMatch) {
          setRuleText(transcript.trim());
        }
      }
    } else if (event.type === "conversation.item.input_audio_transcription.completed") {
      // User's speech transcribed
      const userText = event.transcript || "";
      if (userText.trim()) {
        setMessages(prev => [...prev, { role: "user", content: userText }]);
      }
    } else if (event.type === "response.audio.delta") {
      setIsSpeaking(true);
    } else if (event.type === "response.audio.done") {
      setIsSpeaking(false);
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

        <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />

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
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {msg.content}
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
                    className={`rounded-full h-7 w-7 ${isVoiceChatActive ? "bg-primary animate-pulse" : ""}`}
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
                                ? "bg-primary-foreground animate-pulse" 
                                : "bg-current"
                            }`}
                            style={{
                              height: `${[4, 8, 12, 8, 4][i - 1]}px`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </Button>

                  {/* Dictate Button */}
                  <Button
                    size="icon"
                    variant={isRecording ? "default" : "ghost"}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing || isSaving || isVoiceChatActive}
                    className="rounded-full h-7 w-7"
                    title={isRecording ? "Stop recording" : "Dictate"}
                  >
                    {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
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
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import { VoiceChatCore } from "@/components/ai-adjudicator/VoiceChatCore";
import { useWebRTCSpeech } from "@/hooks/useWebRTCSpeech";

interface VoiceRuleEditorProps {
  ruleSetId: string;
  ruleSetName: string;
  gameName: string;
  currentRules: Array<{ id: string; rule_text: string; sort_order: number }>;
}

export const VoiceRuleEditor = ({ ruleSetId, ruleSetName, gameName, currentRules }: VoiceRuleEditorProps) => {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [input, setInput] = useState("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [realtimeMessages, setRealtimeMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  
  // WebRTC speech for unified audio
  const { speakText: speakResponse, isSpeaking } = useWebRTCSpeech("alloy");

  // Reset audio to OFF when component mounts
  useEffect(() => {
    setIsAudioEnabled(false);
  }, []);

  const handleVoiceCommand = async (command: string, shouldSpeak?: boolean) => {
    if (!command.trim()) return;

    const willSpeak = shouldSpeak !== undefined ? shouldSpeak : isAudioEnabled;
    
    setMessages(prev => [...prev, { role: 'user', content: command }]);
    setIsProcessing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-rule-command`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            command,
            ruleSetId,
            currentRules,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast.error(result.message || "Premium feature required");
          setMessages(prev => [...prev, { role: 'assistant', content: result.message }]);
          return;
        }
        throw new Error(result.error || "Failed to process command");
      }

      // Invalidate queries to refresh the rules list
      queryClient.invalidateQueries({ queryKey: ["house-rules", ruleSetId] });
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });

      const responseMessage = result.message || "Command processed successfully";
      setMessages(prev => [...prev, { role: 'assistant', content: responseMessage }]);
      
      toast.success(responseMessage);

      if (willSpeak) {
        await speakResponse(responseMessage);
      }
    } catch (error) {
      console.error("Voice command error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process voice command";
      toast.error(errorMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that command. Please try again." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = (messageOverride?: string, shouldSpeak?: boolean) => {
    const message = messageOverride || input;
    if (!message.trim()) return;
    if (!messageOverride) setInput("");
    handleVoiceCommand(message, shouldSpeak);
  };

  const startRealtimeChat = async () => {
    try {
      setIsAudioEnabled(true);
      
      toast.info("Connecting to voice chat...");
      
      const currentRulesText = currentRules.map((r, i) => `Rule ${i + 1}: ${r.rule_text}`).join("\n");
      
      const contextInstructions = `You are a voice assistant for managing house rules. 
You are currently editing the rule set called "${ruleSetName}" for the game ${gameName}.
You can help users:
- Add new rules to this rule set
- Edit or change existing rules
- Remove rules
- Reorder rules

Current rules in "${ruleSetName}":
${currentRulesText || "No rules yet."}

When the user asks to modify rules, confirm what you understood and execute the command. Be concise and helpful.
Always remember you are editing "${ruleSetName}" - if the user refers to this rule set by name, you know which one they mean.`;

      let currentAssistantMessage = "";

      realtimeChatRef.current = new RealtimeChat(
        (event) => {
          if (event.type === 'conversation.item.input_audio_transcription.completed') {
            const transcript = event.transcript || "";
            if (transcript.trim()) {
              setRealtimeMessages(prev => [...prev, { role: 'user', content: transcript }]);
              // Process the command
              handleVoiceCommand(transcript, true);
            }
          }
          
          if (event.type === 'response.audio_transcript.delta') {
            const delta = event.delta || "";
            currentAssistantMessage += delta;
            
            setRealtimeMessages(prev => {
              const lastMsg = prev[prev.length - 1];
              if (lastMsg?.role === 'assistant') {
                return [...prev.slice(0, -1), { role: 'assistant', content: currentAssistantMessage }];
              } else {
                return [...prev, { role: 'assistant', content: currentAssistantMessage }];
              }
            });
          }
          
          if (event.type === 'response.audio_transcript.done') {
            currentAssistantMessage = "";
          }
        },
        contextInstructions,
        "alloy",
        gameName,
        currentRules.map(r => r.rule_text)
      );

      await realtimeChatRef.current.init();
      setIsRealtimeConnected(true);
      toast.success("Voice chat connected - start speaking!");
      
    } catch (error) {
      console.error("[VoiceRuleEditor] Error starting realtime chat:", error);
      toast.error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const fallbackContent = (
    <Card className="border border-border">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 rounded-t-lg">
        <CardTitle className="text-white">Voice Rule Editor</CardTitle>
        <CardDescription className="text-white/90">
          Create and edit house rules using voice commands
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Premium users can use natural language to manage their house rules:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>"Add a rule: no skipping turns"</li>
          <li>"Change rule 2 to draw 4 cards"</li>
          <li>"Remove rule 3"</li>
          <li>"Move rule 1 to position 3"</li>
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <PremiumGate feature="Voice Rule Editor" fallback={fallbackContent}>
      <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5">
          <h2 className="text-2xl font-bold text-white">Voice Rule Editor</h2>
          <p className="text-white/90 text-sm mt-1">Use commands to create and edit your rule set.</p>
        </div>
        
        <div className="p-6">
          <VoiceChatCore
            messages={messages}
            realtimeMessages={realtimeMessages}
            input={input}
            setInput={setInput}
            onSend={handleSend}
            isLoading={isProcessing}
            isRealtimeConnected={isRealtimeConnected}
            onStartRealtime={startRealtimeChat}
            onEndRealtime={endRealtimeChat}
            isSpeaking={isSpeaking}
            isAudioEnabled={isAudioEnabled}
            setIsAudioEnabled={setIsAudioEnabled}
            placeholder="Or type your command here..."
            footerContent={
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm font-semibold mb-3 text-foreground">Try these commands:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="space-y-1.5">
                    <p>• "Add a rule: <span className="text-foreground/80">[your rule text]</span>"</p>
                    <p>• "Change rule <span className="text-foreground/80">[number]</span> to <span className="text-foreground/80">[new text]</span>"</p>
                    <p>• "Remove rule <span className="text-foreground/80">[number]</span>"</p>
                  </div>
                  <div className="space-y-1.5">
                    <p>• "Move rule <span className="text-foreground/80">[number]</span> to position <span className="text-foreground/80">[new position]</span>"</p>
                    <p>• "Add <span className="text-foreground/80">[friend's name]</span> as an admin"</p>
                    <p>• "What rules do we have?"</p>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </PremiumGate>
  );
};

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Mic, MicOff, Send, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RealtimeChat } from "@/utils/RealtimeAudio";

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
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const realtimeChatRef = useRef<RealtimeChat | null>(null);

  // Reset audio to OFF when component mounts
  useEffect(() => {
    setIsAudioEnabled(false);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      console.error("[VoiceRuleEditor] TTS error:", error);
      toast.error(`Failed to speak response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setIsAudioEnabled(false);
      handleTextSend();
    }
  };

  const handleTextSend = () => {
    if (!input.trim()) return;
    setIsAudioEnabled(false);
    const command = input;
    setInput("");
    handleVoiceCommand(command);
  };

  const startRecording = async () => {
    try {
      setIsAudioEnabled(false);
      
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
      toast.info("Recording started - speak now!");
    } catch (error) {
      console.error("[VoiceRuleEditor] Error accessing microphone:", error);
      toast.error(`Could not access microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Processing your audio...");
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
          setInput(data.text);
        }
      };
    } catch (error) {
      console.error("[VoiceRuleEditor] Transcription error:", error);
      toast.error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
              setMessages(prev => [...prev, { role: 'user', content: transcript }]);
              // Process the command
              handleVoiceCommand(transcript, true);
            }
          }
          
          if (event.type === 'response.audio_transcript.delta') {
            const delta = event.delta || "";
            currentAssistantMessage += delta;
            
            setMessages(prev => {
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
          <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />

          {/* Big Voice Chat Button - Sound Wave Style */}
          <div className="flex flex-col items-center py-6 mb-6">
            <button
              onClick={isRealtimeConnected ? endRealtimeChat : startRealtimeChat}
              disabled={isProcessing || isRecording}
              className={`w-32 h-32 rounded-full border-2 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                isRealtimeConnected 
                  ? "bg-primary border-primary" 
                  : "bg-primary border-primary/50 hover:border-primary hover:shadow-lg hover:shadow-primary/30"
              }`}
            >
              {/* Sound wave bars */}
              <div className="flex items-center gap-1.5">
                <div 
                  className={`w-2 rounded-full bg-primary-foreground transition-all ${
                    isRealtimeConnected ? "h-6 animate-pulse" : "h-6"
                  }`}
                  style={isRealtimeConnected ? { animation: 'soundWave 0.8s ease-in-out infinite' } : {}}
                />
                <div 
                  className={`w-2 rounded-full bg-primary-foreground transition-all ${
                    isRealtimeConnected ? "h-10 animate-pulse" : "h-10"
                  }`}
                  style={isRealtimeConnected ? { animation: 'soundWave 0.8s ease-in-out infinite 0.1s' } : {}}
                />
                <div 
                  className={`w-2 rounded-full bg-primary-foreground transition-all ${
                    isRealtimeConnected ? "h-14 animate-pulse" : "h-14"
                  }`}
                  style={isRealtimeConnected ? { animation: 'soundWave 0.8s ease-in-out infinite 0.2s' } : {}}
                />
                <div 
                  className={`w-2 rounded-full bg-primary-foreground transition-all ${
                    isRealtimeConnected ? "h-10 animate-pulse" : "h-10"
                  }`}
                  style={isRealtimeConnected ? { animation: 'soundWave 0.8s ease-in-out infinite 0.3s' } : {}}
                />
                <div 
                  className={`w-2 rounded-full bg-primary-foreground transition-all ${
                    isRealtimeConnected ? "h-6 animate-pulse" : "h-6"
                  }`}
                  style={isRealtimeConnected ? { animation: 'soundWave 0.8s ease-in-out infinite 0.4s' } : {}}
                />
              </div>
            </button>
            
            <p className="mt-4 text-sm text-muted-foreground text-center">
              Press to speak with House Rules AI.
            </p>
          </div>

          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Volume2 className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm text-primary">Speaking...</span>
            </div>
          )}

          {/* Response Area */}
          {messages.length > 0 && (
            <ScrollArea className="h-[200px] mb-4 border border-border rounded-lg" ref={scrollRef}>
              <div className="space-y-4 p-4">
                {messages.map((msg, idx) => (
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

          {/* Text Input Area with Audio Toggle */}
          <div className="space-y-2">
            {/* Audio Response Toggle - Top Right above text input */}
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
                placeholder="Or type your command here..."
                className="resize-none pr-24 italic placeholder:italic border border-border"
                rows={2}
                disabled={isProcessing || isRealtimeConnected}
              />
              
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <Button
                  size="icon"
                  variant={isRecording ? "default" : "ghost"}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing || isRealtimeConnected}
                  className="rounded-full h-8 w-8"
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleTextSend}
                  disabled={isProcessing || !input.trim() || isRealtimeConnected}
                  className="rounded-full h-8 w-8"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Try These Commands Section */}
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
        </div>
      </div>
    </PremiumGate>
  );
};

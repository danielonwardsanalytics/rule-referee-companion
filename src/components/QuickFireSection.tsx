import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Mic, MicOff, Send, Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChat } from "@/utils/RealtimeAudio";

interface QuickFireSectionProps {
  gameName?: string;
  gameId?: string;
  voice?: string;
  houseRules?: string[];
}

const QuickFireSection = ({ 
  gameName,
  gameId,
  voice = "alloy",
  houseRules = []
}: QuickFireSectionProps) => {
  const { messages, sendMessage, isLoading, clearMessages } = useRealtimeChat(gameName, houseRules);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [realtimeMessages, setRealtimeMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  
  const contextPrompt = gameName 
    ? `I'm playing ${gameName}. ` 
    : "";

  // Reset audio to OFF when component mounts (fresh section entry)
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
    
    if (!messageToSend.trim()) return;
    
    if (!messageOverride) {
      setInput("");
    }
    
    const messageText = contextPrompt + messageToSend;
    
    try {
      await sendMessage(messageText, async (aiResponse) => {
        if (willSpeak) {
          await speakResponse(aiResponse);
        }
      });
    } catch (error) {
      console.error("[QuickFireSection] Error in sendMessage:", error);
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
      console.error("[QuickFireSection] TTS error:", error);
      toast.error(`Failed to speak response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Text input: auto OFF for audio
      setIsAudioEnabled(false);
      handleSend();
    }
  };

  const handleTextSend = () => {
    // Text input: auto OFF for audio
    setIsAudioEnabled(false);
    handleSend();
  };

  const startRecording = async () => {
    try {
      // Dictate: auto OFF for audio
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
      console.error("[QuickFireSection] Error accessing microphone:", error);
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
          // For dictate, just set the text in input - user must send manually
          setInput(data.text);
        }
      };
    } catch (error) {
      console.error("[QuickFireSection] Transcription error:", error);
      toast.error(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const startRealtimeChat = async () => {
    try {
      // Voice chat: auto ON for audio
      setIsAudioEnabled(true);
      
      toast.info("Connecting to voice chat...");
      
      const contextInstructions = gameName 
        ? `You are a helpful card game rules expert specifically for ${gameName}. Answer questions clearly and concisely about ${gameName} rules, strategies, and common questions. Keep responses under 3 sentences unless more detail is requested.`
        : "You are a helpful card game rules expert. Answer questions clearly and concisely about game rules, strategies, and common questions. Keep responses under 3 sentences unless more detail is requested.";

      let currentAssistantMessage = "";

      realtimeChatRef.current = new RealtimeChat(
        (event) => {
          if (event.type === 'conversation.item.input_audio_transcription.completed') {
            const transcript = event.transcript || "";
            if (transcript.trim()) {
              setRealtimeMessages(prev => [...prev, { role: 'user', content: transcript }]);
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
        voice,
        gameName,
        houseRules
      );

      await realtimeChatRef.current.init();
      setIsRealtimeConnected(true);
      toast.success("Voice chat connected - start speaking!");
      
    } catch (error) {
      console.error("[QuickFireSection] Error starting realtime chat:", error);
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

  const allMessages = [...messages, ...realtimeMessages];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-slide-up" style={{ animationDelay: '0.2s' }} aria-label="Quick questions">
      <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-card)] overflow-hidden backdrop-blur-sm hover-lift">
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-5">
          <h2 className="text-2xl font-bold text-white">Quick Fire Question</h2>
          <p className="text-white/90 text-sm mt-1">Get instant answers about any game rule</p>
        </div>
        
        <div className="p-6">
          <audio ref={audioRef} onEnded={() => setIsSpeaking(false)} />



          {/* Big Voice Chat Button - Sound Wave Style */}
          <div className="flex flex-col items-center mb-6">
            <button
              onClick={isRealtimeConnected ? endRealtimeChat : startRealtimeChat}
              disabled={isLoading || isRecording}
              className={`w-32 h-32 rounded-full border-2 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                isRealtimeConnected 
                  ? "bg-primary border-primary" 
                  : "bg-primary border-primary/50 hover:border-primary hover:shadow-lg hover:shadow-primary/30"
              }`}
            >
              {/* Sound wave bars like ChatGPT */}
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
          {allMessages.length > 0 && (
            <ScrollArea className="h-[200px] mb-4 border border-border rounded-lg" ref={scrollRef}>
              <div className="space-y-4 p-4">
                {allMessages.map((msg, idx) => (
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
                placeholder="Alternatively, type your question here..."
                className="resize-none pr-24 italic placeholder:italic border border-border"
                rows={2}
                disabled={isLoading || isRealtimeConnected}
              />
              
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <Button
                  size="icon"
                  variant={isRecording ? "default" : "ghost"}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || isRealtimeConnected}
                  className="rounded-full h-8 w-8"
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
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
        </div>
      </div>
    </section>
  );
};

export default QuickFireSection;

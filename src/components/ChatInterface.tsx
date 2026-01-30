import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useChatWithActions } from "@/hooks/useChatWithActions";
import { useWebRTCSpeech } from "@/hooks/useWebRTCSpeech";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import { useActiveHouseRules } from "@/hooks/useActiveHouseRules";
import { VoiceChatCore } from "@/components/ai-adjudicator/VoiceChatCore";

interface ChatInterfaceProps {
  gameName?: string;
  gameId?: string;
  voice?: string;
  onVoiceCommand?: (command: string) => Promise<string>;
  isProcessingCommand?: boolean;
  contextType?: "game" | "house-rules";
  contextId?: string;
}

const ChatInterface = ({ 
  gameName,
  gameId,
  voice = "alloy",
  onVoiceCommand,
  isProcessingCommand = false,
  contextType = "game",
  contextId
}: ChatInterfaceProps) => {
  const { data: houseRulesData } = useActiveHouseRules(gameId);
  const houseRules = houseRulesData?.rules || [];
  
  // Use consolidated chat hook
  const { messages, sendMessage, isLoading, clearMessages } = useChatWithActions(
    gameName,
    houseRules
  );
  
  const [input, setInput] = useState("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [realtimeMessages, setRealtimeMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const realtimeChatRef = useRef<RealtimeChat | null>(null);
  
  // WebRTC speech for unified audio
  const { speakText: speakResponse, isSpeaking } = useWebRTCSpeech(voice);
  
  const contextPrompt = gameName 
    ? `I'm playing ${gameName}. ` 
    : "";

  const handleSend = async (messageOverride?: string, shouldSpeak?: boolean) => {
    const messageToSend = messageOverride || input;
    const willSpeak = shouldSpeak !== undefined ? shouldSpeak : isAudioEnabled;
    
    if (!messageToSend.trim()) return;
    
    if (!messageOverride) {
      setInput("");
    }
    
    // If this is a house rules context and we have a voice command handler, use it
    if (contextType === "house-rules" && onVoiceCommand) {
      const response = await onVoiceCommand(messageToSend);
      if (willSpeak) {
        await speakResponse(response);
      }
      return;
    }
    
    // Otherwise use the normal chat flow
    const messageText = contextPrompt + messageToSend;
    
    try {
      await sendMessage(messageText, async (aiResponse) => {
        if (willSpeak) {
          await speakResponse(aiResponse);
        }
      });
    } catch (error) {
      console.error("[ChatInterface] Error in sendMessage:", error);
      toast.error("Failed to send message");
    }
  };

  const startRealtimeChat = async () => {
    try {
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
      console.error("[ChatInterface] Error starting realtime chat:", error);
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

  return (
    <div className="w-full flex flex-col">
      {/* House Rules Active Indicator */}
      {houseRulesData && houseRules.length > 0 && (
        <div className="mb-3 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              🏠 House Rules Active: {houseRulesData.ruleSetName}
            </span>
          </div>
        </div>
      )}
      
      <VoiceChatCore
        messages={messages}
        realtimeMessages={realtimeMessages}
        input={input}
        setInput={setInput}
        onSend={handleSend}
        isLoading={isLoading || isProcessingCommand}
        isRealtimeConnected={isRealtimeConnected}
        onStartRealtime={startRealtimeChat}
        onEndRealtime={endRealtimeChat}
        isSpeaking={isSpeaking}
        isAudioEnabled={isAudioEnabled}
        setIsAudioEnabled={setIsAudioEnabled}
        placeholder={
          gameName 
            ? `Ask about ${gameName} rules...` 
            : "Tell me what game you're playing and ask your question."
        }
      />
    </div>
  );
};

export default ChatInterface;

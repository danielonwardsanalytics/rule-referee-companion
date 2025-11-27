import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const RealtimeVoiceChat = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to voice agent');
      setIsConnected(true);
      toast({
        title: "Voice chat connected",
        description: "Start speaking to interact with the assistant",
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from voice agent');
      setIsConnected(false);
      setConversationId(null);
    },
    onError: (error) => {
      console.error('Voice chat error:', error);
      toast({
        title: "Connection error",
        description: typeof error === 'string' ? error : "Failed to connect to voice chat",
        variant: "destructive",
      });
    },
    onMessage: (message) => {
      console.log('Message received:', message);
    },
  });

  const startConversation = async () => {
    try {
      // Request microphone access first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const id = await conversation.startSession({
        agentId: 'pmpt_6928292322ac81969fb37fee32643fa70a0725b380e1d77c',
      });
      
      setConversationId(id);
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      toast({
        title: "Failed to start",
        description: error.message || "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const endConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-2xl border border-border shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        {isConnected ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Voice chat active</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-muted rounded-full" />
            <span>Voice chat ready</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!isConnected ? (
          <Button
            onClick={startConversation}
            size="lg"
            className="gap-2"
          >
            <Mic className="h-5 w-5" />
            Start Voice Chat
          </Button>
        ) : (
          <Button
            onClick={endConversation}
            size="lg"
            variant="destructive"
            className="gap-2"
          >
            <PhoneOff className="h-5 w-5" />
            End Call
          </Button>
        )}
      </div>

      {conversation.isSpeaking && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Assistant is speaking...</span>
        </div>
      )}
    </div>
  );
};

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Message = { role: 'user' | 'assistant'; content: string };

interface PendingAction {
  type: string;
  params: Record<string, any>;
  confirmationMessage: string;
}

export const useChatWithActions = (gameName?: string, houseRules?: string[], activeRuleSetId?: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [isDetectingAction, setIsDetectingAction] = useState(false);

  const sendMessage = useCallback(async (
    userMessage: string, 
    onComplete?: (response: string, hasAction?: boolean) => void
  ) => {
    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('User must be authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-actions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            gameName,
            houseRules,
            activeRuleSetId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      if (data.type === 'action_proposal') {
        // AI wants to perform an action - show confirmation
        const assistantMsg: Message = { role: 'assistant', content: data.message };
        setMessages((prev) => [...prev, assistantMsg]);
        
        setPendingAction({
          type: data.action.type,
          params: data.action.params,
          confirmationMessage: data.message,
        });

        if (onComplete) {
          onComplete(data.message, true);
        }
      } else {
        // Regular text response
        const assistantMsg: Message = { role: 'assistant', content: data.message };
        setMessages((prev) => [...prev, assistantMsg]);
        
        if (onComplete) {
          onComplete(data.message, false);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [messages, gameName, houseRules, activeRuleSetId]);

  const confirmAction = useCallback(async () => {
    if (!pendingAction) return;

    setIsExecutingAction(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('User must be authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-action`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            actionType: pendingAction.type,
            params: pendingAction.params,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute action');
      }

      // Add success message
      const successMsg: Message = { role: 'assistant', content: `✓ ${data.message}` };
      setMessages((prev) => [...prev, successMsg]);
      
      toast.success(data.message);
      setPendingAction(null);

      return data;
    } catch (error) {
      console.error('Action execution error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute action');
    } finally {
      setIsExecutingAction(false);
    }
  }, [pendingAction]);

  const cancelAction = useCallback(() => {
    if (!pendingAction) return;

    const cancelMsg: Message = { role: 'assistant', content: "No problem! Let me know if you'd like to do something else." };
    setMessages((prev) => [...prev, cancelMsg]);
    setPendingAction(null);
  }, [pendingAction]);

  // Check if user's voice response is a confirmation
  const handleVoiceConfirmation = useCallback((transcript: string) => {
    if (!pendingAction) return false;

    const confirmPhrases = ['yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'confirm', 'do it', 'go ahead', 'please', 'yes please'];
    const cancelPhrases = ['no', 'nope', 'cancel', 'never mind', 'stop', "don't"];

    const lowerTranscript = transcript.toLowerCase().trim();

    if (confirmPhrases.some(phrase => lowerTranscript.includes(phrase))) {
      confirmAction();
      return true;
    }

    if (cancelPhrases.some(phrase => lowerTranscript.includes(phrase))) {
      cancelAction();
      return true;
    }

    return false;
  }, [pendingAction, confirmAction, cancelAction]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingAction(null);
  }, []);

  // Detect action in a voice transcript without adding to messages
  const detectActionInTranscript = useCallback(async (transcript: string): Promise<boolean> => {
    if (pendingAction) return false; // Already have a pending action

    setIsDetectingAction(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return false;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-actions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: transcript }],
            gameName,
            houseRules,
            activeRuleSetId,
          }),
        }
      );

      if (!response.ok) return false;

      const data = await response.json();

      if (data.type === 'action_proposal') {
        console.log('[useChatWithActions] Action detected in transcript:', data.action);
        setPendingAction({
          type: data.action.type,
          params: data.action.params,
          confirmationMessage: data.message,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('[useChatWithActions] Error detecting action:', error);
      return false;
    } finally {
      setIsDetectingAction(false);
    }
  }, [pendingAction, gameName, houseRules, activeRuleSetId]);

  return { 
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
    isDetectingAction,
  };
};

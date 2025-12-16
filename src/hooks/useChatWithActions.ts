import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type Message = { role: 'user' | 'assistant'; content: string };

interface PendingAction {
  type: string;
  params: Record<string, any>;
  confirmationMessage: string;
}

export const useChatWithActions = (
  gameName?: string, 
  houseRules?: string[], 
  activeRuleSetId?: string | null,
  activeTournamentId?: string | null,
  tournamentPlayers?: Array<{ id: string; display_name: string; status: string }>,
  tournamentNotes?: Array<{ title: string; content: string; created_at: string }>,
  gameResults?: Array<{ winner_name: string; created_at: string; notes?: string | null }>
) => {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [isDetectingAction, setIsDetectingAction] = useState(false);

  const sendMessage = useCallback(async (
    userMessage: string, 
    onComplete?: (response: string, hasAction?: boolean) => void
  ) => {
    console.log('[useChatWithActions] sendMessage called with:', userMessage);
    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[useChatWithActions] Session check:', !!session?.access_token);
      if (!session?.access_token) {
        throw new Error('User must be authenticated');
      }

      const requestBody = {
        messages: [...messages, userMsg],
        gameName,
        houseRules,
        activeRuleSetId,
        activeTournamentId,
        tournamentPlayers,
        tournamentNotes,
        gameResults,
      };
      console.log('[useChatWithActions] Calling chat-with-actions with:', {
        messageCount: requestBody.messages.length,
        gameName,
        hasHouseRules: houseRules?.length || 0,
        activeRuleSetId,
        activeTournamentId,
        hasPlayers: tournamentPlayers?.length || 0,
        hasNotes: tournamentNotes?.length || 0,
        hasResults: gameResults?.length || 0,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-with-actions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('[useChatWithActions] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[useChatWithActions] Error response:', errorData);
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();
      console.log('[useChatWithActions] Response data:', data);
      console.log('[useChatWithActions] Response type:', data.type);

      if (data.type === 'action_proposal') {
        console.log('[useChatWithActions] ACTION PROPOSAL DETECTED!', data.action);
        // AI wants to perform an action - show confirmation
        const assistantMsg: Message = { role: 'assistant', content: data.message };
        setMessages((prev) => [...prev, assistantMsg]);
        
        const newPendingAction = {
          type: data.action.type,
          params: data.action.params,
          confirmationMessage: data.message,
        };
        console.log('[useChatWithActions] Setting pendingAction:', newPendingAction);
        setPendingAction(newPendingAction);

        if (onComplete) {
          onComplete(data.message, true);
        }
      } else {
        console.log('[useChatWithActions] Regular text response (no action)');
        // Regular text response
        const assistantMsg: Message = { role: 'assistant', content: data.message };
        setMessages((prev) => [...prev, assistantMsg]);
        
        if (onComplete) {
          onComplete(data.message, false);
        }
      }
    } catch (error) {
      console.error('[useChatWithActions] Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [messages, gameName, houseRules, activeRuleSetId, activeTournamentId, tournamentPlayers, tournamentNotes, gameResults]);

  const confirmAction = useCallback(async () => {
    if (!pendingAction) {
      console.log('[useChatWithActions] confirmAction called but no pending action');
      return;
    }

    console.log('[useChatWithActions] Confirming action:', pendingAction);
    setIsExecutingAction(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('User must be authenticated');
      }

      console.log('[useChatWithActions] Calling execute-action with:', {
        actionType: pendingAction.type,
        params: pendingAction.params,
      });

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
      console.log('[useChatWithActions] execute-action response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute action');
      }

      // Add success message
      const successMsg: Message = { role: 'assistant', content: `✓ ${data.message}` };
      setMessages((prev) => [...prev, successMsg]);
      
      toast.success(data.message);

      // Invalidate relevant queries based on action type to refresh the page data
      const actionType = pendingAction.type;
      console.log('[useChatWithActions] Invalidating queries for action type:', actionType);
      
      if (actionType === 'add_tournament_note' && activeTournamentId) {
        await queryClient.invalidateQueries({ queryKey: ['tournament-notes', activeTournamentId] });
      } else if (actionType === 'add_tournament_player' && activeTournamentId) {
        await queryClient.invalidateQueries({ queryKey: ['tournament-players', activeTournamentId] });
      } else if (actionType === 'record_game_result' && activeTournamentId) {
        await queryClient.invalidateQueries({ queryKey: ['game-results', activeTournamentId] });
        await queryClient.invalidateQueries({ queryKey: ['tournament-players', activeTournamentId] });
      } else if (actionType === 'update_player_status' && activeTournamentId) {
        await queryClient.invalidateQueries({ queryKey: ['tournament-players', activeTournamentId] });
      } else if (actionType === 'create_house_rule_set') {
        await queryClient.invalidateQueries({ queryKey: ['house-rule-sets'] });
      } else if (actionType === 'add_house_rule' && activeRuleSetId) {
        await queryClient.invalidateQueries({ queryKey: ['house-rules', activeRuleSetId] });
      } else if (actionType === 'create_tournament') {
        await queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      }

      setPendingAction(null);

      return data;
    } catch (error) {
      console.error('[useChatWithActions] Action execution error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute action');
    } finally {
      setIsExecutingAction(false);
    }
  }, [pendingAction, queryClient, activeTournamentId, activeRuleSetId]);

  const cancelAction = useCallback(() => {
    if (!pendingAction) return;

    const cancelMsg: Message = { role: 'assistant', content: "No problem! Let me know if you'd like to do something else." };
    setMessages((prev) => [...prev, cancelMsg]);
    setPendingAction(null);
  }, [pendingAction]);

  // Check if user's voice response is a confirmation
  const handleVoiceConfirmation = useCallback((transcript: string) => {
    console.log('[useChatWithActions] handleVoiceConfirmation called with:', transcript, 'pendingAction:', !!pendingAction);
    
    if (!pendingAction) return false;

    const confirmPhrases = ['yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'confirm', 'do it', 'go ahead', 'please', 'yes please', 'implement', 'create it'];
    const cancelPhrases = ['no', 'nope', 'cancel', 'never mind', 'stop', "don't"];

    const lowerTranscript = transcript.toLowerCase().trim();
    console.log('[useChatWithActions] Checking transcript:', lowerTranscript);

    if (confirmPhrases.some(phrase => lowerTranscript.includes(phrase))) {
      console.log('[useChatWithActions] Confirm phrase detected, executing action');
      confirmAction();
      return true;
    }

    if (cancelPhrases.some(phrase => lowerTranscript.includes(phrase))) {
      console.log('[useChatWithActions] Cancel phrase detected');
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
            activeTournamentId,
            tournamentPlayers,
            tournamentNotes,
            gameResults,
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
  }, [pendingAction, gameName, houseRules, activeRuleSetId, activeTournamentId, tournamentPlayers, tournamentNotes, gameResults]);

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

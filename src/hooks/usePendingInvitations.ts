import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PendingInvitation {
  tournament_id: string;
  tournament_name: string;
  game_name: string;
  invited_at: string;
  expires_at: string;
}

export const usePendingInvitations = () => {
  const { user } = useAuth();

  const { data: pendingInvitations = [], isLoading } = useQuery({
    queryKey: ["pending-invitations", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const { data, error } = await supabase.rpc("get_pending_invitations_for_email", {
        _email: user.email,
      });

      if (error) throw error;
      return (data || []) as PendingInvitation[];
    },
    enabled: !!user?.email,
  });

  return {
    pendingInvitations,
    isLoading,
    hasPendingInvitations: pendingInvitations.length > 0,
  };
};

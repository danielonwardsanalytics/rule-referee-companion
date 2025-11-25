import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TournamentPlayer {
  id: string;
  tournament_id: string;
  user_id: string | null;
  display_name: string;
  email: string | null;
  status: string;
  wins: number;
  losses: number;
  points: number;
  position: number | null;
  joined_at: string;
}

export const useTournamentPlayers = (tournamentId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["tournament-players", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];

      const { data, error } = await supabase
        .from("tournament_players")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("position", { ascending: true, nullsFirst: false })
        .order("wins", { ascending: false });

      if (error) throw error;
      return data as TournamentPlayer[];
    },
    enabled: !!tournamentId,
  });

  const addPlayerMutation = useMutation({
    mutationFn: async (data: { tournamentId: string; displayName?: string; email?: string }) => {
      const insertData: any = {
        tournament_id: data.tournamentId,
        status: "active",
      };

      if (data.email) {
        // Email invitation
        insertData.email = data.email;
        insertData.display_name = data.email.split('@')[0]; // Use email prefix as display name
        insertData.status = "pending_invite";
        insertData.invited_at = new Date().toISOString();
        insertData.invite_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      } else if (data.displayName) {
        // Name-only player
        insertData.display_name = data.displayName;
      }

      const { error } = await supabase
        .from("tournament_players")
        .insert(insertData);

      if (error) throw error;
      
      return { isEmailInvite: !!data.email };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["tournament-players"] });
      
      if (result?.isEmailInvite) {
        toast.success("Invitation sent! They'll be added when they sign up or log in with this email.");
      } else {
        toast.success("Player added!");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add player");
    },
  });

  const removePlayerMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase
        .from("tournament_players")
        .delete()
        .eq("id", playerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-players"] });
      toast.success("Player removed!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove player");
    },
  });

  return {
    players,
    isLoading,
    addPlayer: addPlayerMutation.mutate,
    removePlayer: removePlayerMutation.mutate,
    isAddingPlayer: addPlayerMutation.isPending,
  };
};

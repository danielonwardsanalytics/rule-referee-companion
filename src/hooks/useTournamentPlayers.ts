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
    mutationFn: async (data: { tournamentId: string; displayName: string }) => {
      const { error } = await supabase
        .from("tournament_players")
        .insert({
          tournament_id: data.tournamentId,
          display_name: data.displayName,
          status: "active",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-players"] });
      toast.success("Player added!");
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

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface GameResult {
  id: string;
  tournament_id: string;
  winner_id: string;
  recorded_by: string;
  notes: string | null;
  created_at: string;
  tournament_players: {
    display_name: string;
  };
}

export const useGameResults = (tournamentId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["game-results", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];

      const { data, error } = await supabase
        .from("game_results")
        .select(`
          *,
          tournament_players:winner_id (
            display_name
          )
        `)
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GameResult[];
    },
    enabled: !!tournamentId,
  });

  const recordGameMutation = useMutation({
    mutationFn: async (data: {
      tournamentId: string;
      winnerId: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Record the game result
      const { error: resultError } = await supabase
        .from("game_results")
        .insert({
          tournament_id: data.tournamentId,
          winner_id: data.winnerId,
          recorded_by: user.id,
          notes: data.notes,
        });

      if (resultError) throw resultError;

      // Update winner's stats
      const { data: player, error: playerError } = await supabase
        .from("tournament_players")
        .select("wins")
        .eq("id", data.winnerId)
        .single();

      if (playerError) throw playerError;

      const { error: updateError } = await supabase
        .from("tournament_players")
        .update({ wins: player.wins + 1 })
        .eq("id", data.winnerId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-results"] });
      queryClient.invalidateQueries({ queryKey: ["tournament-players"] });
      toast.success("Game result recorded!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record game");
    },
  });

  return {
    results,
    isLoading,
    recordGame: recordGameMutation.mutate,
    isRecording: recordGameMutation.isPending,
  };
};

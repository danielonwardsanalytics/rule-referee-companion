import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface TournamentWithStats {
  id: string;
  name: string;
  updated_at: string;
  games: {
    name: string;
    accent_color: string;
    image_url: string | null;
  };
  leader: {
    display_name: string;
    wins: number;
  } | null;
  total_games: number;
}

export const useRecentTournaments = () => {
  const { user } = useAuth();

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["recent-tournaments", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get latest 10 tournaments
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from("tournaments")
        .select(`
          id,
          name,
          updated_at,
          games:game_id (
            name,
            accent_color,
            image_url
          )
        `)
        .eq("admin_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (tournamentsError) throw tournamentsError;

      // For each tournament, get leader and game count
      const tournamentsWithStats = await Promise.all(
        (tournamentsData || []).map(async (tournament) => {
          // Get current leader
          const { data: leader } = await supabase
            .from("tournament_players")
            .select("display_name, wins")
            .eq("tournament_id", tournament.id)
            .eq("status", "active")
            .order("wins", { ascending: false })
            .limit(1)
            .single();

          // Get total games count
          const { count } = await supabase
            .from("game_results")
            .select("*", { count: "exact", head: true })
            .eq("tournament_id", tournament.id);

          return {
            ...tournament,
            leader: leader || null,
            total_games: count || 0,
          } as TournamentWithStats;
        })
      );

      return tournamentsWithStats;
    },
    enabled: !!user,
  });

  return { tournaments, isLoading };
};

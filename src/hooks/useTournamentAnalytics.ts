import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PlayerStats {
  id: string;
  display_name: string;
  wins: number;
  losses: number;
  total_games: number;
  win_rate: number;
  points: number;
  recent_form: Array<"W" | "L">; // Last 5 games
}

interface GameResultWithPlayer {
  id: string;
  created_at: string;
  winner_id: string;
  tournament_players: {
    display_name: string;
  };
}

interface AnalyticsData {
  playerStats: PlayerStats[];
  totalGames: number;
  activityTimeline: Array<{ date: string; games: number }>;
  topPerformer: PlayerStats | null;
  recentWinner: string | null;
}

export const useTournamentAnalytics = (tournamentId: string | undefined) => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["tournament-analytics", tournamentId],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!tournamentId) {
        return {
          playerStats: [],
          totalGames: 0,
          activityTimeline: [],
          topPerformer: null,
          recentWinner: null,
        };
      }

      // Fetch players
      const { data: players, error: playersError } = await supabase
        .from("tournament_players")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("status", "active");

      if (playersError) throw playersError;

      // Fetch game results
      const { data: results, error: resultsError } = await supabase
        .from("game_results")
        .select(`
          id,
          created_at,
          winner_id,
          tournament_players:winner_id (
            display_name
          )
        `)
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: false });

      if (resultsError) throw resultsError;

      const gameResults = results as unknown as GameResultWithPlayer[];

      // Calculate player stats
      const playerStats: PlayerStats[] = players.map((player) => {
        const playerWins = gameResults.filter((r) => r.winner_id === player.id);
        const totalGames = player.wins + (player.losses || 0);
        const winRate = totalGames > 0 ? (player.wins / totalGames) * 100 : 0;

        // Calculate recent form (last 5 games)
        const recentGames = gameResults
          .slice(0, 5)
          .filter((r) => r.winner_id === player.id || 
            gameResults.some((g) => g.created_at === r.created_at && g.winner_id !== player.id))
          .map((r) => (r.winner_id === player.id ? "W" : "L") as "W" | "L")
          .slice(0, 5);

        return {
          id: player.id,
          display_name: player.display_name,
          wins: player.wins || 0,
          losses: player.losses || 0,
          total_games: totalGames,
          win_rate: winRate,
          points: player.points || 0,
          recent_form: recentGames,
        };
      });

      // Sort by wins
      playerStats.sort((a, b) => b.wins - a.wins);

      // Calculate activity timeline (games per day for last 7 days)
      const activityMap = new Map<string, number>();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split("T")[0];
      }).reverse();

      last7Days.forEach((date) => activityMap.set(date, 0));

      gameResults.forEach((result) => {
        const date = new Date(result.created_at).toISOString().split("T")[0];
        if (activityMap.has(date)) {
          activityMap.set(date, (activityMap.get(date) || 0) + 1);
        }
      });

      const activityTimeline = Array.from(activityMap.entries()).map(
        ([date, games]) => ({
          date: new Date(date).toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric" 
          }),
          games,
        })
      );

      return {
        playerStats,
        totalGames: gameResults.length,
        activityTimeline,
        topPerformer: playerStats[0] || null,
        recentWinner: gameResults[0]?.tournament_players?.display_name || null,
      };
    },
    enabled: !!tournamentId,
  });

  return {
    analytics,
    isLoading,
  };
};

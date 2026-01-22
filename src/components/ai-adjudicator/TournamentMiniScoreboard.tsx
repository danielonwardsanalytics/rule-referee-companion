import { Plus, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TournamentPlayer {
  id: string;
  display_name: string;
  wins: number;
  losses: number;
  status: string;
}

interface TournamentMiniScoreboardProps {
  tournament: {
    id: string;
    name: string;
  } | null;
  players: TournamentPlayer[];
  isLoading: boolean;
  onAddPlayer: () => void;
}

export const TournamentMiniScoreboard = ({
  tournament,
  players,
  isLoading,
  onAddPlayer,
}: TournamentMiniScoreboardProps) => {
  // Sort players by wins descending
  const sortedPlayers = [...players]
    .filter(p => p.status === 'active')
    .sort((a, b) => b.wins - a.wins);

  const calculateWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  // No tournament selected state
  if (!tournament) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h4 className="text-sm font-medium text-muted-foreground text-center">
          No tournament selected
        </h4>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Select a tournament above to see the scoreboard
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
      {/* Header with tournament name and add button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <h4 className="text-sm font-semibold text-foreground truncate flex-1 mr-2">
          {tournament.name}
        </h4>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onAddPlayer}
          aria-label="Add player"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Player list */}
      {isLoading ? (
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      ) : sortedPlayers.length === 0 ? (
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">No players yet</p>
          <Button
            variant="link"
            size="sm"
            className="text-xs mt-1 h-auto p-0"
            onClick={onAddPlayer}
          >
            Add the first player
          </Button>
        </div>
      ) : (
        <div className="max-h-[160px] overflow-y-auto">
          {sortedPlayers.map((player, index) => {
            const winRate = calculateWinRate(player.wins, player.losses);
            const isLeader = index === 0 && player.wins > 0;

            return (
              <div
                key={player.id}
                className="flex items-center justify-between px-4 py-2 border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs text-muted-foreground w-5 shrink-0">
                    {index + 1}.
                  </span>
                  {isLeader && (
                    <Trophy className="h-3 w-3 text-primary shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate">
                    {player.display_name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0 ml-2">
                  <span className="text-foreground font-medium">W:{player.wins}</span>
                  <span className="text-muted-foreground">L:{player.losses}</span>
                  <span className="text-muted-foreground w-8 text-right">{winRate}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

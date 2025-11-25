import { format } from "date-fns";
import { Trophy } from "lucide-react";

interface GameResult {
  id: string;
  created_at: string;
  tournament_players: {
    display_name: string;
  };
}

interface GameHistoryProps {
  results: GameResult[];
}

export const GameHistory = ({ results }: GameHistoryProps) => {
  return (
    <div className="space-y-3">
      {results.map((result) => (
        <div
          key={result.id}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
        >
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{result.tournament_players.display_name}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(result.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

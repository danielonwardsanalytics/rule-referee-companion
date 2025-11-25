import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";

interface Player {
  id: string;
  display_name: string;
  wins: number;
  losses: number;
  points: number;
}

interface LeaderboardTableProps {
  players: Player[];
  isAdmin: boolean;
  accentColor: string;
}

export const LeaderboardTable = ({ players, isAdmin, accentColor }: LeaderboardTableProps) => {
  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No players added yet. Add players to start tracking the leaderboard.
      </div>
    );
  }

  const sortedPlayers = [...players].sort((a, b) => b.wins - a.wins);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-center">Wins</TableHead>
            <TableHead className="text-center">Losses</TableHead>
            <TableHead className="text-center">Win Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((player, index) => {
            const totalGames = player.wins + player.losses;
            const winRate = totalGames > 0 ? ((player.wins / totalGames) * 100).toFixed(0) : "0";

            return (
              <TableRow key={player.id}>
                <TableCell className="font-medium">
                  {index === 0 && player.wins > 0 ? (
                    <Trophy className="h-5 w-5" style={{ color: accentColor }} />
                  ) : (
                    <span className="text-muted-foreground">#{index + 1}</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">{player.display_name}</TableCell>
                <TableCell className="text-center font-bold">{player.wins}</TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {player.losses}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium">{winRate}%</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

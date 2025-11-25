import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Mail } from "lucide-react";

interface Player {
  id: string;
  display_name: string;
  wins: number;
  losses: number;
  points: number;
  status: string;
  email?: string | null;
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
            const isPendingInvite = player.status === "pending_invite";

            return (
              <TableRow key={player.id} className={isPendingInvite ? "opacity-60" : ""}>
                <TableCell className="font-medium">
                  {index === 0 && player.wins > 0 ? (
                    <Trophy className="h-5 w-5" style={{ color: accentColor }} />
                  ) : (
                    <span className="text-muted-foreground">#{index + 1}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.display_name}</span>
                    {isPendingInvite && (
                      <Badge variant="outline" className="text-xs">
                        <Mail className="h-3 w-3 mr-1" />
                        Invited
                      </Badge>
                    )}
                  </div>
                </TableCell>
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

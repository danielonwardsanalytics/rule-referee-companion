import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Mail } from "lucide-react";
import { useRef, useState, useCallback } from "react";

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

const truncateName = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length <= 2) return name;
  return `${words[0]} ${words[1]}...`;
};

export const LeaderboardTable = ({ players, isAdmin, accentColor }: LeaderboardTableProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

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
      <div className="flex">
        {/* Frozen columns */}
        <div className="flex-shrink-0 bg-background z-10 border-r border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 px-2">Rank</TableHead>
                <TableHead className="w-28 px-2">Player</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player, index) => {
                const isPendingInvite = player.status === "pending_invite";
                return (
                  <TableRow key={player.id} className={isPendingInvite ? "opacity-60" : ""}>
                    <TableCell className="px-2 font-medium">
                      {index === 0 && player.wins > 0 ? (
                        <Trophy className="h-5 w-5" style={{ color: accentColor }} />
                      ) : (
                        <span className="text-muted-foreground">#{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="px-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium truncate max-w-[90px]" title={player.display_name}>
                          {truncateName(player.display_name)}
                        </span>
                        {isPendingInvite && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            <Mail className="h-3 w-3 mr-1" />
                            Invited
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Scrollable columns */}
        <div 
          ref={scrollRef}
          className="overflow-x-auto flex-1 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleMouseUp}
          onTouchMove={handleTouchMove}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center min-w-[70px]">Wins</TableHead>
                <TableHead className="text-center min-w-[70px]">Losses</TableHead>
                <TableHead className="text-center min-w-[80px]">Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => {
                const totalGames = player.wins + player.losses;
                const winRate = totalGames > 0 ? ((player.wins / totalGames) * 100).toFixed(0) : "0";
                const isPendingInvite = player.status === "pending_invite";

                return (
                  <TableRow key={player.id} className={isPendingInvite ? "opacity-60" : ""}>
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
      </div>
    </div>
  );
};
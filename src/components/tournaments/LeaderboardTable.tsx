import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  onRecordGame?: () => void;
}

const truncateName = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length <= 2) return name;
  return `${words[0]} ${words[1]}...`;
};

export const LeaderboardTable = ({ players, isAdmin, accentColor, onRecordGame }: LeaderboardTableProps) => {
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
    <div className="border-t border-border overflow-hidden">
      <div className="flex">
        {/* Frozen columns */}
        <div className="flex-shrink-0 bg-background z-10 border-r border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 px-1 text-xs">#</TableHead>
                <TableHead className="w-24 px-1 text-xs">Player</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player, index) => {
                const isPendingInvite = player.status === "pending_invite";
                return (
                  <TableRow key={player.id} className={isPendingInvite ? "opacity-60" : ""}>
                    <TableCell className="px-1 font-medium text-xs">
                      {index === 0 && player.wins > 0 ? (
                        <Trophy className="h-4 w-4" style={{ color: accentColor }} />
                      ) : (
                        <span className="text-muted-foreground">{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell className="px-1">
                      <div className="flex items-center gap-1">
                        <span className="font-medium truncate max-w-[80px] text-sm" title={player.display_name}>
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
                <TableHead className="text-center w-12 px-1 text-xs">W</TableHead>
                <TableHead className="text-center w-12 px-1 text-xs">L</TableHead>
                <TableHead className="text-center w-12 px-1 text-xs">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => {
                const totalGames = player.wins + player.losses;
                const winRate = totalGames > 0 ? ((player.wins / totalGames) * 100).toFixed(0) : "0";
                const isPendingInvite = player.status === "pending_invite";

                return (
                  <TableRow key={player.id} className={isPendingInvite ? "opacity-60" : ""}>
                    <TableCell className="text-center font-bold px-1 text-sm">{player.wins}</TableCell>
                    <TableCell className="text-center text-muted-foreground px-1 text-sm">
                      {player.losses}
                    </TableCell>
                    <TableCell className="text-center px-1">
                      <span className="text-xs font-medium">{winRate}%</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Record Game Button */}
      {isAdmin && players.length >= 2 && onRecordGame && (
        <div className="p-4 border-t border-border">
          <Button onClick={onRecordGame} className="w-full hover-scale">
            Record Winner
          </Button>
        </div>
      )}
    </div>
  );
};
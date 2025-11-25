import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Trophy, Users, Calendar } from "lucide-react";
import { useTournamentPlayers } from "@/hooks/useTournamentPlayers";
import { format } from "date-fns";

interface TournamentCardProps {
  tournament: {
    id: string;
    name: string;
    created_at: string;
    games: {
      name: string;
      accent_color: string;
      image_url: string | null;
    };
  };
}

export const TournamentCard = ({ tournament }: TournamentCardProps) => {
  const navigate = useNavigate();
  const { players } = useTournamentPlayers(tournament.id);

  const champion = players.length > 0 ? players.reduce((prev, current) => 
    (current.wins > prev.wins) ? current : prev
  ) : null;

  return (
    <Card
      className="card-interactive animate-scale-in overflow-hidden border-2"
      style={{ borderColor: tournament.games.accent_color + "40" }}
      onClick={() => navigate(`/tournament/${tournament.id}`)}
    >
      <div
        className="h-2 transition-all duration-300 group-hover:h-3"
        style={{ backgroundColor: tournament.games.accent_color }}
      />
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg mb-1 line-clamp-2">{tournament.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{tournament.games.name}</p>
          </div>
          {tournament.games.image_url && (
            <div className="shrink-0 overflow-hidden rounded-lg shadow-sm">
              <img
                src={tournament.games.image_url}
                alt={tournament.games.name}
                className="w-12 h-12 object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">
              {players.length} {players.length === 1 ? "player" : "players"}
            </span>
          </div>

          {champion && champion.wins > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 shrink-0" style={{ color: tournament.games.accent_color }} />
              <span className="font-medium truncate">{champion.display_name}</span>
              <span className="text-muted-foreground shrink-0">
                ({champion.wins} {champion.wins === 1 ? "win" : "wins"})
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>Started {format(new Date(tournament.created_at), "MMM d, yyyy")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

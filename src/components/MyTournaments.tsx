import { useRecentTournaments } from "@/hooks/useRecentTournaments";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Trophy, Users, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const MyTournaments = () => {
  const { tournaments, isLoading } = useRecentTournaments();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-2xl font-bold text-foreground mb-4">My Tournaments</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="min-w-[200px] h-[280px] rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (tournaments.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <h2 className="text-2xl font-bold text-foreground mb-4">My Tournaments</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {tournaments.map((tournament, index) => (
          <div
            key={tournament.id}
            onClick={() => navigate(`/tournaments/${tournament.id}`)}
            className="group relative min-w-[200px] max-w-[200px] h-[340px] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl snap-start bg-card"
            style={{
              animationDelay: `${index * 0.05}s`,
            }}
          >
            {/* Image Section (Top ~45%) */}
            <div className="relative h-[150px] overflow-hidden rounded-t-xl">
              {tournament.games.image_url ? (
                <>
                  {/* Game Image */}
                  <img
                    src={tournament.games.image_url}
                    alt={tournament.games.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Dark gradient overlay for badge readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </>
              ) : (
                /* Fallback gradient if no image */
                <div
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(135deg, ${tournament.games.accent_color}40 0%, ${tournament.games.accent_color}80 100%)`,
                  }}
                />
              )}

              {/* Game Name Badge - Bottom Left of Image */}
              <div
                className="absolute bottom-2 left-2 px-3 py-1 rounded-md bg-black/70 backdrop-blur-sm border"
                style={{
                  borderColor: `${tournament.games.accent_color}60`,
                }}
              >
                <span className="text-xs font-semibold text-white">
                  {tournament.games.name}
                </span>
              </div>
            </div>

            {/* Info Section (Bottom ~55%) */}
            <div className="p-4 flex flex-col gap-3 h-[190px]">
              {/* Tournament Title */}
              <h3 className="text-base font-bold text-foreground line-clamp-2">
                {tournament.name}
              </h3>

              {/* Leader Card */}
              {tournament.leader && (
                <div
                  className="rounded-lg p-2.5 border"
                  style={{
                    backgroundColor: `${tournament.games.accent_color}15`,
                    borderColor: `${tournament.games.accent_color}40`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Trophy className="h-3.5 w-3.5" style={{ color: tournament.games.accent_color }} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Leader
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground line-clamp-1">
                    {tournament.leader.display_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tournament.leader.wins} {tournament.leader.wins === 1 ? 'win' : 'wins'}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="space-y-1.5 mt-auto">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{tournament.total_games} {tournament.total_games === 1 ? 'game' : 'games'} played</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Updated {formatDistanceToNow(new Date(tournament.updated_at), { addSuffix: true })}</span>
                </div>
              </div>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        ))}
      </div>
    </section>
  );
};

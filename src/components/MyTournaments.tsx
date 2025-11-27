import { useRecentTournaments } from "@/hooks/useRecentTournaments";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Trophy, Users, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export const MyTournaments = () => {
  const { tournaments, isLoading } = useRecentTournaments();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-2xl font-bold text-foreground mb-4">My Tournaments</h2>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="min-w-[160px] h-[260px] rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (tournaments.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <h2 className="text-2xl font-bold text-foreground mb-3">My Tournaments</h2>
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {tournaments.map((tournament, index) => (
            <CarouselItem key={tournament.id} className="pl-3 basis-[140px] shrink-0">
              <div
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
                className="group relative w-[140px] h-[240px] rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl border border-border flex-shrink-0"
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {/* Image Section (Top ~40%) */}
                <div className="relative h-[96px] overflow-hidden rounded-t-lg">
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
                    className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm border"
                    style={{
                      borderColor: `${tournament.games.accent_color}60`,
                    }}
                  >
                    <span className="text-[10px] font-semibold text-white">
                      {tournament.games.name}
                    </span>
                  </div>
                </div>

                {/* Info Section (Bottom ~60%) */}
                <div className="p-2.5 flex flex-col gap-1.5 h-[144px] bg-card">
                  {/* Tournament Title */}
                  <h3 className="text-xs font-bold text-foreground line-clamp-2 mb-0.5">
                    {tournament.name}
                  </h3>

                  {/* Leader Card - Always show, even if no leader yet */}
                  <div
                    className="rounded p-1.5 border flex-shrink-0"
                    style={{
                      backgroundColor: `${tournament.games.accent_color}15`,
                      borderColor: `${tournament.games.accent_color}40`,
                    }}
                  >
                    <div className="flex items-center gap-0.5 mb-0.5">
                      <Trophy className="h-2.5 w-2.5" style={{ color: tournament.games.accent_color }} />
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Leader
                      </span>
                    </div>
                    {tournament.leader ? (
                      <>
                        <p className="text-[11px] font-bold text-foreground line-clamp-1">
                          {tournament.leader.display_name}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {tournament.leader.wins} {tournament.leader.wins === 1 ? 'win' : 'wins'}
                        </p>
                      </>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic">
                        No games yet
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="space-y-0.5 mt-auto">
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <Users className="h-2 w-2" />
                      <span>{tournament.total_games} {tournament.total_games === 1 ? 'game' : 'games'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <Clock className="h-2 w-2" />
                      <span>Updated {formatDistanceToNow(new Date(tournament.updated_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
};

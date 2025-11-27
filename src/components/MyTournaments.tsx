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
        <CarouselContent className="-ml-4">
          {tournaments.map((tournament, index) => (
            <CarouselItem key={tournament.id} className="pl-4 basis-[140px] shrink-0">
              <div
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
                className="group relative w-[140px] h-[260px] rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl border border-border flex-shrink-0"
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
                <div 
                  className="px-4 py-4 flex flex-col gap-2 h-[164px] rounded-b-lg border border-white/[0.08]"
                  style={{
                    backgroundColor: '#151820',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                  }}
                >
                  {/* Tournament Title */}
                  <h3 className="text-base font-semibold line-clamp-2" style={{ color: 'rgba(255,255,255,0.95)' }}>
                    {tournament.name}
                  </h3>

                  {/* Leader Info */}
                  <div className="flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 shrink-0" style={{ color: tournament.games.accent_color }} />
                    {tournament.leader ? (
                      <div className="min-w-0">
                        <span className="text-[13px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                          {tournament.leader.display_name}
                        </span>
                        <span className="text-[13px] font-medium ml-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                          ({tournament.leader.wins} {tournament.leader.wins === 1 ? 'win' : 'wins'})
                        </span>
                      </div>
                    ) : (
                      <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        No games yet
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="space-y-1.5 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }} />
                      <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {tournament.total_games} {tournament.total_games === 1 ? 'game' : 'games'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }} />
                      <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        Updated {formatDistanceToNow(new Date(tournament.updated_at), { addSuffix: true })}
                      </span>
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

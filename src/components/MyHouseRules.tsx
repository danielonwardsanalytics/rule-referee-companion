import { useHouseRuleSets } from "@/hooks/useHouseRuleSets";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Scroll, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export const MyHouseRules = () => {
  const { ruleSets, isLoading } = useHouseRuleSets();
  const navigate = useNavigate();

  // Show up to 10 most recent rule sets
  const recentRuleSets = ruleSets.slice(0, 10);

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">My House Rules</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="min-w-[160px] h-[280px] rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (recentRuleSets.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">My House Rules</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/house-rules')}
          >
            See all <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Scroll className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No House Rules yet — create your own custom rules for any game.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My House Rules</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Your created and saved custom rulesets</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/house-rules')}
        >
          See all <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {recentRuleSets.map((ruleSet, index) => (
            <CarouselItem key={ruleSet.id} className="pl-4 basis-[160px] shrink-0">
              <div
                onClick={() => navigate(`/house-rules/${ruleSet.id}`)}
                className="group relative w-[160px] h-[280px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl border border-border flex-shrink-0"
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {/* Image Section (Top ~50%) */}
                <div className="relative h-[140px] overflow-hidden rounded-t-2xl">
                  {ruleSet.games.image_url ? (
                    <>
                      {/* Game Image */}
                      <img
                        src={ruleSet.games.image_url}
                        alt={ruleSet.games.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Dark gradient overlay for badge readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </>
                  ) : (
                    /* Fallback gradient if no image */
                    <div
                      className="w-full h-full"
                      style={{
                        background: `linear-gradient(135deg, ${ruleSet.games.accent_color}40 0%, ${ruleSet.games.accent_color}80 100%)`,
                      }}
                    />
                  )}

                  {/* Game Name Badge - Bottom of Image */}
                  <div
                    className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-sm border"
                    style={{
                      borderColor: `${ruleSet.games.accent_color}60`,
                    }}
                  >
                    <span className="text-[11px] font-semibold text-white">
                      {ruleSet.games.name}
                    </span>
                  </div>
                </div>

                {/* Text Section (Bottom ~50%) */}
                <div 
                  className="px-4 py-4 flex flex-col gap-2 h-[140px] rounded-b-2xl border-t border-white/[0.06]"
                  style={{
                    backgroundColor: '#151820',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                  }}
                >
                  {/* House Rule Title */}
                  <h3 className="text-[15px] font-semibold line-clamp-2 leading-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
                    {ruleSet.name}
                  </h3>

                  {/* Owner Info */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      Created by You
                    </span>
                  </div>

                  {/* Last Updated */}
                  <div className="mt-auto">
                    <span className="text-[12px] font-normal" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Updated {formatDistanceToNow(new Date(ruleSet.updated_at), { addSuffix: true })}
                    </span>
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

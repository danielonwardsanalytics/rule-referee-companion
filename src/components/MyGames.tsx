import { useState, useEffect } from "react";
import { Plus, Loader2, ArrowRight } from "lucide-react";
import { Reorder } from "framer-motion";
import SelectGameModal from "./SelectGameModal";
import GameCardCircular from "./GameCardCircular";
import { useUserGames } from "@/hooks/useUserGames";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const MyGames = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [hasReordered, setHasReordered] = useState(false);
  const { userGames, isLoading, removeGame, reorderGames } = useUserGames();
  const [orderedGames, setOrderedGames] = useState(userGames);

  // Update local order when userGames changes
  useEffect(() => {
    setOrderedGames(userGames);
  }, [userGames]);

  // Create 10 fixed slots
  const TOTAL_SLOTS = 10;

  const handleEnterDeleteMode = () => {
    setIsDeleteMode(true);
  };

  const handleExitDeleteMode = () => {
    if (isDeleteMode) {
      setIsDeleteMode(false);
      // Only save the order if user actually reordered games
      if (hasReordered) {
        const consolidatedGames = orderedGames.map((game, index) => ({
          gameId: game.game_id,
          order: index,
        }));
        reorderGames(consolidatedGames);
        setHasReordered(false);
      }
    }
  };

  const handleReorder = (newOrder: typeof userGames) => {
    setOrderedGames(newOrder);
    setHasReordered(true);
  };

  const handleRemoveGame = (gameId: string) => {
    removeGame(gameId);
    // Update local state to reflect removal
    setOrderedGames(prev => prev.filter(g => g.game_id !== gameId));
  };

  return (
    <>
      {/* Full-page click handler to exit delete mode */}
      {isDeleteMode && (
        <div 
          className="fixed inset-0 z-10"
          onClick={handleExitDeleteMode}
        />
      )}
      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">My Games</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/games')}
          >
            See all <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              <Reorder.Group
                axis="x"
                values={orderedGames}
                onReorder={handleReorder}
                className="flex gap-2 pl-2"
                style={{ pointerEvents: isDeleteMode ? 'auto' : 'none' }}
              >
                {orderedGames.map((game) => (
                  <Reorder.Item
                    key={game.game_id}
                    value={game}
                    drag={isDeleteMode}
                    dragListener={isDeleteMode}
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    whileDrag={{
                      scale: 1.1,
                      zIndex: 1000,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                    }}
                    className="flex-shrink-0"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <GameCardCircular
                      id={game.games.slug}
                      title={game.games.name}
                      image={game.games.image_url || ""}
                      canRemove={true}
                      onRemove={() => handleRemoveGame(game.game_id)}
                      onLongPress={handleEnterDeleteMode}
                      isDeleteMode={isDeleteMode}
                      shouldShake={isDeleteMode}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {/* Empty slots */}
              {Array.from({ length: TOTAL_SLOTS - orderedGames.length }).map((_, index) => (
                <CarouselItem key={`empty-${index}`} className="pl-2 basis-auto">
                  <div className="flex flex-col items-center gap-2 w-[90px] pt-2 flex-shrink-0">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-20 h-20 rounded-full border-2 border-dashed border-border hover:border-primary bg-muted/30 hover:bg-muted/50 transition-all duration-300 flex items-center justify-center group"
                      aria-label="Add game to this slot"
                    >
                      <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
                    </button>
                    {/* Only show "Add Game" on first empty slot */}
                    {index === 0 && (
                      <span className="text-xs text-center text-muted-foreground group-hover:text-foreground font-medium">
                        Add Game
                      </span>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}
      </section>

      <SelectGameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default MyGames;

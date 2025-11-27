import { useState, useRef } from "react";
import { Plus, Loader2 } from "lucide-react";
import SelectGameModal from "./SelectGameModal";
import GameCardCircular from "./GameCardCircular";
import { useUserGames } from "@/hooks/useUserGames";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const MyGames = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { userGames, isLoading, removeGame, reorderGames } = useUserGames();

  // Create 10 fixed slots
  const TOTAL_SLOTS = 10;
  const slots = Array.from({ length: TOTAL_SLOTS }, (_, index) => {
    const userGame = userGames[index];
    return userGame || null;
  });

  const handleEnterDeleteMode = () => {
    setIsDeleteMode(true);
  };

  const handleExitDeleteMode = () => {
    if (isDeleteMode) {
      setIsDeleteMode(false);
      // Consolidate games: remove gaps between games
      const consolidatedGames = userGames.map((game, index) => ({
        gameId: game.game_id,
        order: index,
      }));
      reorderGames(consolidatedGames);
    }
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    // Reorder the games array
    const newGames = [...userGames];
    const [movedGame] = newGames.splice(draggedIndex, 1);
    
    // If dropping on empty slot, put at end of games
    const insertIndex = targetIndex >= userGames.length ? userGames.length : targetIndex;
    newGames.splice(insertIndex, 0, movedGame);

    // Update order in database
    const reorderedGames = newGames.map((game, index) => ({
      gameId: game.game_id,
      order: index,
    }));
    
    reorderGames(reorderedGames);
    setDraggedIndex(null);
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
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-foreground">My Games</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {/* 10 Fixed Slots */}
              {slots.map((slot, index) => (
                <CarouselItem key={index} className="pl-2 basis-auto">
                  {slot ? (
                    <GameCardCircular
                      id={slot.games.slug}
                      title={slot.games.name}
                      image={slot.games.image_url || ""}
                      canRemove={true}
                      onRemove={() => removeGame(slot.game_id)}
                      onLongPress={handleEnterDeleteMode}
                      isDeleteMode={isDeleteMode}
                      shouldShake={isDeleteMode}
                      draggable={isDeleteMode}
                      onDragStart={handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop(index)}
                    />
                  ) : (
                    <div 
                      className="flex flex-col items-center gap-2 w-[80px]"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop(index)}
                    >
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-16 h-16 rounded-full border-2 border-dashed border-border hover:border-primary bg-muted/30 hover:bg-muted/50 transition-all duration-300 flex items-center justify-center group"
                        aria-label="Add game to this slot"
                      >
                        <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
                      </button>
                      {/* Only show "Add Game" on first empty slot */}
                      {userGames.length === index && (
                        <span className="text-xs text-center text-muted-foreground group-hover:text-foreground font-medium">
                          Add Game
                        </span>
                      )}
                    </div>
                  )}
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

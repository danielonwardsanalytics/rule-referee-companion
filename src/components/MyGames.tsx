import { useState } from "react";
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
  const { userGames, isLoading, removeGame } = useUserGames();

  // Create 10 fixed slots
  const TOTAL_SLOTS = 10;
  const slots = Array.from({ length: TOTAL_SLOTS }, (_, index) => {
    const userGame = userGames[index];
    return userGame || null;
  });

  const handleExitDeleteMode = (e: React.MouseEvent) => {
    // Only exit if clicking on the section itself, not on children (game cards)
    if (e.target === e.currentTarget && isDeleteMode) {
      setIsDeleteMode(false);
    }
  };

  return (
    <>
      <section 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        onClick={handleExitDeleteMode}
      >
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
            <CarouselContent className="-ml-2" onClick={(e) => e.stopPropagation()}>
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
                      onDeleteModeChange={setIsDeleteMode}
                      shouldShake={isDeleteMode}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 w-[80px]">
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

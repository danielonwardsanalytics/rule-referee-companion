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
  const { userGames, isLoading, removeGame } = useUserGames();

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold text-foreground">My Games</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : userGames.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground mb-4">No games added yet</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Add your first game
            </button>
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
              {/* Game Cards */}
              {userGames.map((userGame) => (
                <CarouselItem key={userGame.games.id} className="pl-2 basis-auto">
                  <GameCardCircular
                    id={userGame.games.slug}
                    title={userGame.games.name}
                    image={userGame.games.image_url || ""}
                    canRemove={true}
                    onRemove={() => removeGame(userGame.game_id)}
                  />
                </CarouselItem>
              ))}

              {/* Add Game Card - Now at the end */}
              <CarouselItem className="pl-2 basis-auto">
                <div className="flex flex-col items-center gap-2 w-[80px]">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-16 h-16 rounded-full border-2 border-dashed border-border hover:border-primary bg-card/50 hover:bg-card transition-all duration-300 flex items-center justify-center group"
                    aria-label="Add game"
                  >
                    <Plus className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  </button>
                  <span className="text-xs text-center text-muted-foreground group-hover:text-foreground font-medium">
                    Add Game
                  </span>
                </div>
              </CarouselItem>
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

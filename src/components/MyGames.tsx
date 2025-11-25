import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import SelectGameModal from "./SelectGameModal";
import GameCardCompact from "./GameCardCompact";
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
            <CarouselContent className="-ml-4">
              {/* Add Game Card */}
              <CarouselItem className="pl-4 basis-auto">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-[140px] h-[180px] rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-card/50 hover:bg-card transition-all duration-300 flex flex-col items-center justify-center gap-2 group"
                  aria-label="Add game"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Plus className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Add Game
                  </span>
                </button>
              </CarouselItem>

              {/* Game Cards */}
              {userGames.map((userGame) => (
                <CarouselItem key={userGame.games.id} className="pl-4 basis-auto">
                  <GameCardCompact
                    id={userGame.games.slug}
                    title={userGame.games.name}
                    image={userGame.games.image_url || ""}
                    canRemove={true}
                    onRemove={() => removeGame(userGame.game_id)}
                  />
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

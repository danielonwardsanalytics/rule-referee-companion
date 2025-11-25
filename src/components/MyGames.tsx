import { useState } from "react";
import { ChevronRight, Plus, Loader2 } from "lucide-react";
import SelectGameModal from "./SelectGameModal";
import GameCard from "./GameCard";
import { useUserGames } from "@/hooks/useUserGames";

const MyGames = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userGames, isLoading, removeGame } = useUserGames();

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">My Games</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors group"
              aria-label="Add game"
            >
              <Plus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </button>
          </div>
          {userGames.length > 4 && (
            <button className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium transition-colors">
              View All
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {userGames.slice(0, 4).map((userGame) => (
              <GameCard
                key={userGame.games.id}
                id={userGame.games.slug}
                title={userGame.games.name}
                image={userGame.games.image_url || ""}
                players="Various"
                difficulty="Various"
                canRemove={true}
                onRemove={() => removeGame(userGame.game_id)}
              />
            ))}
          </div>
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

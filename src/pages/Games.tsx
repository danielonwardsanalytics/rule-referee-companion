import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAllGames } from "@/hooks/useAllGames";
import { useUserGames } from "@/hooks/useUserGames";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Games = () => {
  const navigate = useNavigate();
  const { games, isLoading } = useAllGames();
  const { userGames, addGame, isAddingGame } = useUserGames();

  const userGameIds = userGames.map((ug) => ug.game_id);

  const handleAddGame = async (gameId: string, gameName: string) => {
    try {
      await addGame(gameId);
      toast.success(`${gameName} added to your games`);
    } catch (error) {
      toast.error("Failed to add game");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">All Games</h1>
            <p className="text-sm text-muted-foreground">
              {games.length} games available
            </p>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {games.map((game) => {
              const isAdded = userGameIds.includes(game.id);
              return (
                <div
                  key={game.id}
                  className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
                >
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => navigate(`/game/${game.slug}`)}
                  >
                    {/* Game Image */}
                    <div
                      className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2"
                      style={{ borderColor: game.accent_color || "hsl(var(--border))" }}
                    >
                      {game.image_url ? (
                        <img
                          src={game.image_url}
                          alt={game.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                          style={{ backgroundColor: game.accent_color || "#6366f1" }}
                        >
                          {game.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Game Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {game.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {game.description}
                      </p>
                    </div>

                    {/* Add Button */}
                    <Button
                      variant={isAdded ? "secondary" : "default"}
                      size="sm"
                      disabled={isAdded || isAddingGame}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAdded) {
                          handleAddGame(game.id, game.name);
                        }
                      }}
                      className="shrink-0"
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Accent color bar */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: game.accent_color || "#6366f1" }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && games.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No games available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Check, Search, MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAllGames } from "@/hooks/useAllGames";
import { useUserGames } from "@/hooks/useUserGames";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RequestGameModal } from "@/components/games/RequestGameModal";

const Games = () => {
  const navigate = useNavigate();
  const { games, isLoading } = useAllGames();
  const { userGames, addGame, isAddingGame } = useUserGames();
  const [searchQuery, setSearchQuery] = useState("");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const userGameIds = userGames.map((ug) => ug.game_id);

  // Filter games based on search query
  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return games;
    const query = searchQuery.toLowerCase().trim();
    return games.filter(
      (game) =>
        game.name.toLowerCase().includes(query) ||
        game.description?.toLowerCase().includes(query)
    );
  }, [games, searchQuery]);

  const handleAddGame = async (gameId: string, gameName: string) => {
    try {
      await addGame(gameId);
      toast.success(`${gameName} added to your games`);
    } catch (error) {
      toast.error("Failed to add game");
    }
  };

  const noResults = searchQuery.trim() && filteredGames.length === 0;

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

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for a game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
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
        ) : noResults ? (
          /* No Results State */
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-foreground font-medium">
                No games found for "{searchQuery}"
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Can't find what you're looking for?
              </p>
            </div>
            <Button
              onClick={() => setIsRequestModalOpen(true)}
              className="mt-4"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Request "{searchQuery}" to be added
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredGames.map((game) => {
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

        {/* Empty State (no games in DB) */}
        {!isLoading && games.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No games available yet.</p>
          </div>
        )}

        {/* Request Game Button (always visible at bottom when there are results) */}
        {!isLoading && !noResults && filteredGames.length > 0 && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => setIsRequestModalOpen(true)}
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Can't find your game? Request it
            </Button>
          </div>
        )}
      </div>

      {/* Request Game Modal */}
      <RequestGameModal
        open={isRequestModalOpen}
        onOpenChange={setIsRequestModalOpen}
        prefillGameName={noResults ? searchQuery : ""}
      />
    </div>
  );
};

export default Games;

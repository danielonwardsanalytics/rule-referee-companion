import { Search, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAllGames } from "@/hooks/useAllGames";
import { useUserGames } from "@/hooks/useUserGames";

interface SelectGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SelectGameModal = ({ isOpen, onClose }: SelectGameModalProps) => {
  const [search, setSearch] = useState("");
  const { games, isLoading } = useAllGames();
  const { userGames, addGame, isAddingGame } = useUserGames();

  const userGameIds = new Set(userGames.map((ug) => ug.game_id));

  const filteredGames = games.filter((game) =>
    game.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddGame = (gameId: string) => {
    addGame(gameId);
    setTimeout(() => onClose(), 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select a Game</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
            {filteredGames.map((game) => {
              const isAdded = userGameIds.has(game.id);
              
              return (
                <button
                  key={game.id}
                  onClick={() => !isAdded && handleAddGame(game.id)}
                  disabled={isAdded || isAddingGame}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed relative group"
                >
                  {game.image_url ? (
                    <img
                      src={game.image_url}
                      alt={game.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded flex items-center justify-center text-xs font-medium text-white"
                      style={{ backgroundColor: game.accent_color }}
                    >
                      {game.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium flex-1">{game.name}</span>
                  {isAdded && (
                    <CheckCircle2 className="h-5 w-5 text-primary absolute top-3 right-3" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SelectGameModal;

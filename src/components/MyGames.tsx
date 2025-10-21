import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SelectGameModal from "@/components/SelectGameModal";

interface Game {
  id: string;
  name: string;
  icon?: string;
}

const MyGames = () => {
  const [selectedGames, setSelectedGames] = useState<Game[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const maxGames = 12;
  const emptySlots = maxGames - selectedGames.length;

  const handleAddGame = (game: Game) => {
    if (selectedGames.length < maxGames) {
      setSelectedGames([...selectedGames, game]);
    }
  };

  const handleRemoveGame = (gameId: string) => {
    setSelectedGames(selectedGames.filter(game => game.id !== gameId));
  };

  const handleGameClick = (game: Game) => {
    if (!isEditMode) {
      // Navigate to game template page
      window.location.href = `/game/${game.id}`;
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-transparent border-2 border-white rounded-2xl p-4 sm:p-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">My Games</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="text-white hover:bg-white/10 border border-white/50"
          >
            {isEditMode ? "Done" : "Edit"}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Render selected games */}
          {selectedGames.map((game) => (
            <div
              key={game.id}
              className="relative aspect-square bg-white/10 backdrop-blur-sm rounded-xl border-2 border-white/50 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-white/20 group"
              onClick={() => handleGameClick(game)}
            >
              {isEditMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveGame(game.id);
                  }}
                  className="absolute -top-2 -right-2 bg-white text-primary rounded-full p-1 shadow-lg z-10 transition-transform hover:scale-110"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {game.icon ? (
                <img src={game.icon} alt={game.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="text-center p-4">
                  <span className="text-white font-bold text-sm sm:text-base">{game.name}</span>
                </div>
              )}
            </div>
          ))}

          {/* Render empty slots */}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className={`aspect-square rounded-xl border-2 border-dashed border-white/50 flex items-center justify-center transition-all duration-300 ${
                index === 0 && !isEditMode
                  ? "cursor-pointer hover:bg-white/10 hover:border-white"
                  : ""
              }`}
              onClick={() => {
                if (index === 0 && !isEditMode) {
                  setIsModalOpen(true);
                }
              }}
            >
              {index === 0 && !isEditMode && (
                <Plus className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              )}
            </div>
          ))}
        </div>
      </div>

      <SelectGameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectGame={handleAddGame}
        selectedGameIds={selectedGames.map(g => g.id)}
      />
    </section>
  );
};

export default MyGames;

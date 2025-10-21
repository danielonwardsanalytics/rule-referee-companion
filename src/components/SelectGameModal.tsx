import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Game {
  id: string;
  name: string;
  icon?: string;
}

interface SelectGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (game: Game) => void;
  selectedGameIds: string[];
}

const availableGames: Game[] = [
  { id: "uno", name: "UNO" },
  { id: "phase-10", name: "Phase 10" },
  { id: "monopoly", name: "Monopoly" },
  { id: "monopoly-deal", name: "Monopoly Deal" },
  { id: "clue", name: "Clue" },
  { id: "poker", name: "Poker" },
  { id: "solitaire", name: "Solitaire" },
  { id: "exploding-kittens", name: "Exploding Kittens" },
  { id: "gin-rummy", name: "Gin Rummy" },
  { id: "crazy-eight", name: "Crazy Eight" },
  { id: "scrabble", name: "Scrabble" },
  { id: "trivial-pursuit", name: "Trivial Pursuit" },
  { id: "battleship", name: "Battleship" },
  { id: "ticket-to-ride", name: "Ticket to Ride" },
  { id: "catan", name: "Catan" },
  { id: "bridge", name: "Bridge" },
  { id: "pictionary", name: "Pictionary" },
  { id: "mahjong", name: "Mahjong" },
  { id: "chess", name: "Chess" },
  { id: "checkers", name: "Checkers" },
  { id: "backgammon", name: "Backgammon" },
  { id: "beer-pong", name: "Beer Pong" },
  { id: "hearts", name: "Hearts" },
  { id: "cribbage", name: "Cribbage" },
  { id: "canasta", name: "Canasta" },
  { id: "kings-cup", name: "Kings Cup" },
  { id: "flip-cup", name: "Flip Cup" },
  { id: "spades", name: "Spades" },
  { id: "skip-bo", name: "Skip-Bo" },
];

const SelectGameModal = ({ isOpen, onClose, onSelectGame, selectedGameIds }: SelectGameModalProps) => {
  const handleGameSelect = (game: Game) => {
    onSelectGame(game);
    onClose();
  };

  const availableToSelect = availableGames.filter(
    game => !selectedGameIds.includes(game.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Select a Game</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableToSelect.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game)}
                className="aspect-square bg-card border-2 border-border rounded-xl flex items-center justify-center p-4 transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-[var(--shadow-card)]"
              >
                <span className="text-foreground font-semibold text-center text-sm">
                  {game.name}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SelectGameModal;

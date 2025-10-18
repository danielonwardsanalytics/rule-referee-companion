import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, Menu, Layers, Boxes, Landmark, Crown, Users, Spade, Grid3x3, Box } from "lucide-react";
import GameIconCard from "@/components/GameIconCard";

const games = [
  { id: "uno", title: "UNO", icon: Layers },
  { id: "monopoly", title: "Monopoly", icon: Landmark },
  { id: "monopoly-deal", title: "Monopoly Deal", icon: Crown },
  { id: "phase-10", title: "Phase 10", icon: Grid3x3 },
  { id: "bridge", title: "Bridge", icon: Boxes },
  { id: "president", title: "President & Arseholes", icon: Users },
  { id: "poker", title: "Poker", icon: Spade },
  { id: "rummy", title: "Rummy", icon: Box },
  { id: "skip-bo", title: "Skip-Bo", icon: Layers },
];

const Library = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = games.filter((game) =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Game Library</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGames.map((game) => (
            <GameIconCard
              key={game.id}
              icon={game.icon}
              title={game.title}
              onClick={() => navigate(`/game/${game.id}`)}
            />
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No games found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Library;

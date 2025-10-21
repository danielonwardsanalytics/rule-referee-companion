import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GameCard from "@/components/GameCard";
import AskQuestionModal from "@/components/AskQuestionModal";
import ChatInterface from "@/components/ChatInterface";
import { Search, MessageSquare } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import unoCard from "@/assets/uno-card.jpg";
import phase10Card from "@/assets/phase10-card.jpg";
import monopolyDealCard from "@/assets/monopoly-deal-card.jpg";
import skipboCard from "@/assets/skipbo-card.jpg";

const games = [
  {
    id: "uno",
    title: "UNO",
    image: unoCard,
    players: "2-10 players",
    difficulty: "Easy",
  },
  {
    id: "phase-10",
    title: "Phase 10",
    image: phase10Card,
    players: "2-6 players",
    difficulty: "Medium",
  },
  {
    id: "monopoly-deal",
    title: "Monopoly Deal",
    image: monopolyDealCard,
    players: "2-5 players",
    difficulty: "Easy",
  },
  {
    id: "skip-bo",
    title: "Skip-Bo",
    image: skipboCard,
    players: "2-6 players",
    difficulty: "Easy",
  },
];

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredGames = games.filter((game) =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Game night"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-background" />
        </div>
        
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in">
            Game nights just got fairer. 🎴
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-2xl animate-fade-in">
            Your personal rule companion for every game. Look up rules, settle disputes, and keep the peace.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl animate-scale-in">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search any game or rule..."
                className="pl-10 h-12 bg-card/95 backdrop-blur-sm border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              size="lg"
              className="h-12 px-6 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-[var(--shadow-gold)]"
              onClick={() => setIsModalOpen(true)}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Ask a Question
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Fire Question Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card border border-border rounded-2xl shadow-[var(--shadow-soft)] overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Quick Fire Question</h2>
            <p className="text-white/90 text-sm mt-1">Get instant answers about any game rule</p>
          </div>
          <div className="p-6">
            <ChatInterface isOpen={true} onClose={() => {}} />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Popular Games
              </h2>
              <p className="text-muted-foreground">
                Quick access to the most played card games
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <GameCard key={game.id} {...game} />
            ))}
          </div>

          {filteredGames.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No games found. Try a different search term.
              </p>
            </div>
          )}
        </section>

        <section className="bg-gradient-to-r from-secondary to-secondary/50 rounded-2xl p-8 border border-border shadow-[var(--shadow-soft)]">
          <div className="max-w-2xl">
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Never argue about rules again 🤝
            </h3>
            <p className="text-muted-foreground mb-6">
              Get instant answers to any rule question. Our AI-powered assistant knows the official rules for hundreds of games and can settle any dispute in seconds.
            </p>
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => setIsModalOpen(true)}
            >
              Try it now
            </Button>
          </div>
        </section>
      </main>

      <AskQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default Home;

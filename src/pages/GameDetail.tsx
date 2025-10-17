import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AskQuestionModal from "@/components/AskQuestionModal";
import { ArrowLeft, MessageSquare, Bookmark } from "lucide-react";
import { toast } from "sonner";
import unoCard from "@/assets/uno-card.jpg";
import phase10Card from "@/assets/phase10-card.jpg";
import monopolyDealCard from "@/assets/monopoly-deal-card.jpg";
import skipboCard from "@/assets/skipbo-card.jpg";

const gameData: Record<string, any> = {
  uno: {
    title: "UNO",
    image: unoCard,
    description: "The classic card game of matching colors and numbers.",
    rules: {
      setup: "Each player draws a card. The person with the highest card deals. Shuffle the deck and deal 7 cards to each player. Place the remaining cards face down as the draw pile, and flip the top card to start the discard pile.",
      gameplay: "Players take turns matching a card from their hand to the card on top of the discard pile by either color, number, or symbol. If you don't have a matching card, you must draw from the pile. When you play your second-to-last card, you must yell 'UNO!'",
      specialCards: "Skip: Next player loses their turn. Reverse: Order of play reverses. Draw Two: Next player draws 2 cards and loses their turn. Wild: Choose any color to continue play. Wild Draw Four: Choose any color, next player draws 4 cards.",
      winning: "The first player to get rid of all their cards wins the round. Points are tallied based on remaining cards in other players' hands.",
    },
  },
  "phase-10": {
    title: "Phase 10",
    image: phase10Card,
    description: "Complete 10 different phases before your opponents.",
    rules: {
      setup: "Shuffle the deck and deal 10 cards to each player. Place the remaining cards face down as the draw pile. Flip the top card to start the discard pile.",
      gameplay: "Each turn: draw a card from either pile, try to complete your current phase, and discard one card. Phases must be completed in order from 1 to 10.",
      phases: "Phase 1: 2 sets of 3. Phase 2: 1 set of 3 + 1 run of 4. Phase 3: 1 set of 4 + 1 run of 4. Phase 4: 1 run of 7. Phase 5: 1 run of 8. Continue through all 10 phases.",
      winning: "The first player to complete all 10 phases wins the game.",
    },
  },
  "monopoly-deal": {
    title: "Monopoly Deal",
    image: monopolyDealCard,
    description: "Collect property sets, charge rent, and bankrupt your opponents.",
    rules: {
      setup: "Shuffle the deck. Deal 5 cards to each player. Place remaining cards face down as the draw pile.",
      gameplay: "On your turn: draw 2 cards, then play up to 3 action cards or property cards. Cards can be played as money, properties, or actions.",
      actions: "Deal Breaker: Steal a complete property set. Forced Deal: Swap one property with an opponent. Debt Collector: Collect 5M from any player. Rent: Charge rent to all players or one player.",
      winning: "The first player to collect 3 complete property sets wins the game.",
    },
  },
  "skip-bo": {
    title: "Skip-Bo",
    image: skipboCard,
    description: "Be the first to play all cards from your stock pile.",
    rules: {
      setup: "Deal 30 cards to each player for their stock pile (20 for 5+ players). Each player draws 5 cards for their hand. Place remaining cards as the draw pile.",
      gameplay: "On your turn: draw until you have 5 cards, play cards from your stock pile or hand onto building piles (1-12 sequence), and discard one card to your discard pile.",
      specialCards: "Skip-Bo cards are wild and can be played as any number. Building piles start at 1 and go up to 12, then are removed.",
      winning: "The first player to play all cards from their stock pile wins.",
    },
  },
};

const GameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const game = gameId ? gameData[gameId] : null;

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Game not found</h1>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="hover:bg-secondary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBookmark}
              className={isBookmarked ? "text-accent" : ""}
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Game Header */}
      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={game.image}
            alt={game.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/70 to-background" />
        </div>
        
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-8">
          <h1 className="text-5xl font-bold text-white mb-3 animate-fade-in">
            {game.title}
          </h1>
          <p className="text-xl text-white/90 mb-6 max-w-2xl animate-fade-in">
            {game.description}
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="rules" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="ask">Ask</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-6">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {Object.entries(game.rules).map(([key, value], index) => (
                <AccordionItem
                  key={key}
                  value={`item-${index}`}
                  className="border border-border rounded-lg px-6 bg-card shadow-[var(--shadow-soft)]"
                >
                  <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline">
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    {String(value)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="ask" className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-8 shadow-[var(--shadow-soft)]">
              <div className="max-w-2xl mx-auto text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  Have a question about {game.title}?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Ask anything about the rules, special scenarios, or how to resolve disputes. We'll provide an official ruling based on the game's rules.
                </p>
                <Button
                  size="lg"
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Ask a Question
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AskQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        gameName={game.title}
      />
    </div>
  );
};

export default GameDetail;

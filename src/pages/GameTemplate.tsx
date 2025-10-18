import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useHouseRules } from "@/hooks/useHouseRules";
import { Button } from "@/components/ui/button";
import { Menu, MessageSquare, Clock, Trophy, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ChatInterface from "@/components/ChatInterface";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const games: Record<string, string> = {
  "uno": "UNO",
  "phase-10": "Phase 10",
  "monopoly-deal": "Monopoly Deal",
  "skip-bo": "Skip-Bo",
};

const GameTemplate = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const activeRuleSetId = searchParams.get("activeRuleSetId");
  const { getRule } = useHouseRules();
  const [isChatOpen, setIsChatOpen] = useState(false);

  const gameName = games[gameId!] || gameId;
  const activeRule = activeRuleSetId ? getRule(activeRuleSetId) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {gameName.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{gameName}</h1>
              {activeRule && (
                <p className="text-xs text-muted-foreground">Active Rules: {activeRule.name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 mb-8">
          <div className="flex flex-wrap gap-3">
            {activeRule && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Rule Summary
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{activeRule.name}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <Accordion type="single" collapsible className="space-y-2">
                      {activeRule.sections.map((section, index) => (
                        <AccordionItem key={index} value={`section-${index}`} className="border rounded-lg px-4">
                          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                            {section.title}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {section.content}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <Button variant="outline" onClick={() => setIsChatOpen(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Ask a Question
            </Button>
            <Button variant="outline">
              <Clock className="mr-2 h-4 w-4" />
              Timer
            </Button>
            <Button variant="outline">
              <Trophy className="mr-2 h-4 w-4" />
              Scoreboard
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Ready to Play!</h2>
          <p className="text-muted-foreground">
            Use the quick actions above to access rules, ask questions, track time, or keep score.
          </p>
        </div>
      </main>

      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        gameName={gameName}
        houseRule={activeRule || undefined}
      />
    </div>
  );
};

export default GameTemplate;

import { useNavigate, useParams } from "react-router-dom";
import { useHouseRules } from "@/hooks/useHouseRules";
import { Button } from "@/components/ui/button";
import { Menu, Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const games: Record<string, string> = {
  "uno": "UNO",
  "phase-10": "Phase 10",
  "monopoly-deal": "Monopoly Deal",
  "skip-bo": "Skip-Bo",
};

const HouseRuleDetail = () => {
  const navigate = useNavigate();
  const { gameId, ruleSetId } = useParams();
  const { getRule } = useHouseRules();

  const rule = getRule(ruleSetId!);
  const gameName = games[gameId!] || gameId;

  if (!rule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Couldn't load rules. Retry.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

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
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{gameName}</h1>
            <p className="text-sm text-muted-foreground">{rule.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sticky top-20 z-10 mb-8 pb-4 bg-background">
          <Button
            size="lg"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            onClick={() => navigate(`/play/${gameId}?activeRuleSetId=${ruleSetId}`)}
          >
            Play These Rules
          </Button>
        </div>

        {rule.sections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            This rule set has no sections yet. Add one to get started.
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {rule.sections.map((section, index) => (
              <AccordionItem
                key={index}
                value={`section-${index}`}
                className="border border-border rounded-lg px-6 bg-card"
              >
                <AccordionTrigger className="text-lg font-semibold text-foreground hover:no-underline">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground whitespace-pre-wrap">
                  {section.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => navigate(`/house-rules/new?gameId=${gameId}`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Rule
          </Button>
        </div>
      </main>
    </div>
  );
};

export default HouseRuleDetail;

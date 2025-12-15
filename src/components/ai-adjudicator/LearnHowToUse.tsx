import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const LearnHowToUse = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <div className="flex justify-start">
        <CollapsibleTrigger className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/50 hover:bg-secondary transition-colors">
          <HelpCircle className={`h-5 w-5 transition-colors ${isOpen ? "text-primary" : "text-muted-foreground"}`} />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="pt-4">
        <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm text-foreground">Voice Commands You Can Use:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span><strong>"What are the rules for..."</strong> - Ask about any game rule or clarification</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span><strong>"Create a new rule..."</strong> - Add a custom house rule to your active rule set</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span><strong>"Update the rule about..."</strong> - Modify an existing house rule</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span><strong>"[Player name] won"</strong> - Record a game result in your tournament</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span><strong>"Start a new tournament for..."</strong> - Create a new tournament</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span><strong>"Add [player] to the tournament"</strong> - Add a player to your active tournament</span>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            💡 Tip: Press the voice button to speak naturally. The AI understands context and will help manage your games, rules, and tournaments.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

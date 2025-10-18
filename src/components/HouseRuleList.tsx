import { useNavigate } from "react-router-dom";
import { useHouseRules } from "@/hooks/useHouseRules";
import HouseRuleCard from "./HouseRuleCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const games: Record<string, string> = {
  "uno": "UNO",
  "phase-10": "Phase 10",
  "monopoly-deal": "Monopoly Deal",
  "skip-bo": "Skip-Bo",
};

const HouseRuleList = () => {
  const navigate = useNavigate();
  const { rules } = useHouseRules();

  if (rules.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">No house rules yet.</p>
        <p className="text-sm text-muted-foreground mb-6">
          Create your first set from any game page, or import from a friend.
        </p>
        <Button onClick={() => navigate("/house-rules/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create House Rules
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => (
        <HouseRuleCard
          key={rule.id}
          rule={rule}
          gameName={games[rule.gameId] || rule.gameId}
          onClick={() => navigate(`/house-rules/${rule.gameId}/${rule.id}`)}
        />
      ))}
    </div>
  );
};

export default HouseRuleList;

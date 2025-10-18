import { Card } from "@/components/ui/card";
import { HouseRule } from "@/hooks/useHouseRules";
import { formatDistanceToNow } from "date-fns";

interface HouseRuleCardProps {
  rule: HouseRule;
  gameName: string;
  onClick: () => void;
}

const HouseRuleCard = ({ rule, gameName, onClick }: HouseRuleCardProps) => {
  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-border bg-card"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-primary">
            {gameName.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{rule.name}</h3>
          <p className="text-sm text-muted-foreground">{gameName}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Updated {formatDistanceToNow(new Date(rule.updatedAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default HouseRuleCard;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RuleSetCardProps {
  ruleSet: {
    id: string;
    name: string;
    is_active: boolean;
    is_public: boolean;
    save_count: number;
    updated_at: string;
    games: {
      name: string;
      accent_color: string;
    };
  };
  onClick: () => void;
}

export const RuleSetCard = ({ ruleSet, onClick }: RuleSetCardProps) => {
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow animate-fade-in hover-scale"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{ruleSet.name}</CardTitle>
          {ruleSet.is_active && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1"
              style={{
                backgroundColor: `${ruleSet.games.accent_color}20`,
                color: ruleSet.games.accent_color,
                borderColor: ruleSet.games.accent_color,
              }}
            >
              <Check className="h-3 w-3" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>
            Updated {formatDistanceToNow(new Date(ruleSet.updated_at), { addSuffix: true })}
          </span>
        </div>
        {ruleSet.is_public && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{ruleSet.save_count} saves</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

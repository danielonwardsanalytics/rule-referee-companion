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
      className="card-interactive animate-scale-in border-border"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2 flex-1">{ruleSet.name}</CardTitle>
          {ruleSet.is_active && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 shrink-0"
              style={{
                backgroundColor: `${ruleSet.games.accent_color}20`,
                color: ruleSet.games.accent_color,
                borderColor: `${ruleSet.games.accent_color}40`,
              }}
            >
              <Check className="h-3 w-3" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            Updated {formatDistanceToNow(new Date(ruleSet.updated_at), { addSuffix: true })}
          </span>
        </div>
        {ruleSet.is_public && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{ruleSet.save_count} {ruleSet.save_count === 1 ? 'save' : 'saves'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

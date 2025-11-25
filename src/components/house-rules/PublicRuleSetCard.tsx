import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookmarkPlus, Eye, Users } from "lucide-react";
import { useState } from "react";
import { RuleSetDetailModal } from "./RuleSetDetailModal";

interface PublicRuleSetCardProps {
  ruleSet: {
    id: string;
    name: string;
    save_count: number | null;
    created_at: string;
    game: {
      name: string;
      slug: string;
    } | null;
    creator?: {
      display_name: string | null;
      email: string;
    } | null;
    rules: Array<{
      id: string;
      rule_text: string;
      sort_order: number | null;
    }>;
  };
  onSave: (ruleSetId: string) => void;
  isSaving: boolean;
}

export const PublicRuleSetCard = ({ ruleSet, onSave, isSaving }: PublicRuleSetCardProps) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const creatorName = ruleSet.creator?.display_name || ruleSet.creator?.email?.split("@")[0] || "Anonymous";
  const previewRules = ruleSet.rules.slice(0, 3);
  const hasMoreRules = ruleSet.rules.length > 3;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{ruleSet.name}</CardTitle>
              {ruleSet.game && (
                <Badge variant="secondary" className="mt-2">
                  {ruleSet.game.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
              <Users className="h-4 w-4" />
              <span>{ruleSet.save_count || 0}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="space-y-2 flex-1">
            <p className="text-sm text-muted-foreground">
              Created by {creatorName}
            </p>
            
            <div className="space-y-1.5">
              {previewRules.map((rule, index) => (
                <div
                  key={rule.id}
                  className="text-sm p-2 bg-muted/50 rounded border-l-2 border-primary/20"
                >
                  {index + 1}. {rule.rule_text}
                </div>
              ))}
              {hasMoreRules && (
                <p className="text-sm text-muted-foreground italic">
                  +{ruleSet.rules.length - 3} more rules
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDetailModalOpen(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
            <Button
              className="flex-1"
              onClick={() => onSave(ruleSet.id)}
              disabled={isSaving}
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <RuleSetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        ruleSet={ruleSet}
        onSave={() => onSave(ruleSet.id)}
        isSaving={isSaving}
      />
    </>
  );
};

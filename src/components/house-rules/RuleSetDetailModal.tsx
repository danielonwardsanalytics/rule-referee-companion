import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookmarkPlus, Users, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RuleSetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleSet: {
    id: string;
    name: string;
    save_count: number | null;
    created_at: string;
    game: {
      name: string;
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
  onSave: () => void;
  isSaving: boolean;
}

export const RuleSetDetailModal = ({
  isOpen,
  onClose,
  ruleSet,
  onSave,
  isSaving,
}: RuleSetDetailModalProps) => {
  const creatorName = ruleSet.creator?.display_name || ruleSet.creator?.email?.split("@")[0] || "Anonymous";

  const handleSaveAndClose = () => {
    onSave();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{ruleSet.name}</DialogTitle>
          <DialogDescription className="flex flex-wrap gap-3 items-center">
            {ruleSet.game && (
              <Badge variant="secondary">{ruleSet.game.name}</Badge>
            )}
            <span className="flex items-center gap-1 text-sm">
              <Users className="h-4 w-4" />
              {ruleSet.save_count || 0} saves
            </span>
            <span className="flex items-center gap-1 text-sm">
              <Calendar className="h-4 w-4" />
              {formatDistanceToNow(new Date(ruleSet.created_at), { addSuffix: true })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Created by <span className="font-medium">{creatorName}</span>
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Rules ({ruleSet.rules.length})</h3>
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-3">
                {ruleSet.rules
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                  .map((rule, index) => (
                    <div
                      key={rule.id}
                      className="p-3 bg-muted/50 rounded-lg border-l-2 border-primary/30"
                    >
                      <p className="text-sm">
                        <span className="font-semibold text-primary mr-2">
                          {index + 1}.
                        </span>
                        {rule.rule_text}
                      </p>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button
              onClick={handleSaveAndClose}
              disabled={isSaving}
              className="flex-1"
            >
              <BookmarkPlus className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save to My Rules"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { HouseRule } from "@/hooks/useHouseRules";

interface CollapsibleRuleCardProps {
  rule: HouseRule;
  index: number;
  isExpanded: boolean;
  canEdit: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateTitle: (title: string) => void;
}

export const CollapsibleRuleCard = ({
  rule,
  index,
  isExpanded,
  canEdit,
  onToggle,
  onEdit,
  onDelete,
  onUpdateTitle,
}: CollapsibleRuleCardProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(rule.title || `Rule ${index + 1}`);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displayTitle = rule.title || `Rule ${index + 1}`;
  
  // Truncate rule text to ~2-3 lines (approximately 150 chars)
  const truncatedText = rule.rule_text.length > 150 
    ? rule.rule_text.substring(0, 150) + "..." 
    : rule.rule_text;

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== rule.title) {
      onUpdateTitle(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditedTitle(rule.title || `Rule ${index + 1}`);
      setIsEditingTitle(false);
    }
  };

  return (
    <>
      <div 
        className={`bg-card border border-border rounded-xl overflow-hidden transition-all ${
          isExpanded ? "shadow-lg" : "hover:border-primary/30"
        }`}
      >
        {/* Card Header */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => !isEditingTitle && onToggle()}
        >
          <div className="flex-1 min-w-0">
            {isEditingTitle && canEdit ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="h-8 text-sm font-semibold"
                autoFocus
              />
            ) : (
              <h3 
                className={`font-semibold text-sm truncate ${canEdit ? "hover:text-primary cursor-text" : ""}`}
                onClick={(e) => {
                  if (canEdit) {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }
                }}
              >
                {displayTitle}
              </h3>
            )}
            
            {/* Truncated preview when collapsed */}
            {!isExpanded && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {truncatedText}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            {canEdit && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-border">
            <p className="text-sm text-foreground whitespace-pre-wrap pt-3">
              {rule.rule_text}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{displayTitle}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
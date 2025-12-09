import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Trash2, Check, X } from "lucide-react";
import { useHouseRules } from "@/hooks/useHouseRules";

interface RuleItemProps {
  rule: {
    id: string;
    rule_text: string;
    sort_order: number;
  };
  index: number;
  ruleSetId: string;
  canEdit?: boolean;
}

export const RuleItem = ({ rule, index, ruleSetId, canEdit = true }: RuleItemProps) => {
  const { updateRule, deleteRule } = useHouseRules(ruleSetId);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(rule.rule_text);

  const handleSave = () => {
    if (editedText.trim() && editedText !== rule.rule_text) {
      updateRule(
        { id: rule.id, ruleText: editedText.trim(), ruleSetId },
        {
          onSuccess: () => setIsEditing(false),
        }
      );
    } else {
      setIsEditing(false);
      setEditedText(rule.rule_text);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this rule?")) {
      deleteRule({ id: rule.id, ruleSetId });
    }
  };

  if (isEditing && canEdit) {
    return (
      <div className="flex gap-2 items-start p-3 border rounded-lg">
        <span className="text-sm text-muted-foreground mt-2 min-w-[2rem]">
          {index + 1}.
        </span>
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          className="flex-1"
          rows={2}
          autoFocus
        />
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsEditing(false);
              setEditedText(rule.rule_text);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-start p-3 border rounded-lg hover:bg-accent/50 transition-colors group">
      <span className="text-sm text-muted-foreground mt-0.5 min-w-[2rem]">
        {index + 1}.
      </span>
      <p className="flex-1">{rule.rule_text}</p>
      {canEdit && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

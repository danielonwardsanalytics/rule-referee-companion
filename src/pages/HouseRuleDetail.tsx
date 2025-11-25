import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
  Copy,
  Loader2,
  Globe,
  Users,
} from "lucide-react";
import { useRuleSetDetail, useHouseRuleSets } from "@/hooks/useHouseRuleSets";
import { useHouseRules } from "@/hooks/useHouseRules";
import { RuleItem } from "@/components/house-rules/RuleItem";
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

const HouseRuleDetail = () => {
  const { ruleSetId } = useParams();
  const navigate = useNavigate();
  const { ruleSet, isLoading: ruleSetLoading } = useRuleSetDetail(ruleSetId);
  const { rules, isLoading: rulesLoading, addRule } = useHouseRules(ruleSetId);
  const {
    updateRuleSet,
    setActiveRuleSet,
    deleteRuleSet,
    duplicateRuleSet,
  } = useHouseRuleSets();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [newRuleText, setNewRuleText] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isLoading = ruleSetLoading || rulesLoading;

  const handleSaveName = () => {
    if (ruleSet && editedName.trim()) {
      updateRuleSet({ id: ruleSet.id, name: editedName });
      setIsEditingName(false);
    }
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleSetId || !newRuleText.trim()) return;

    addRule(
      { ruleSetId, ruleText: newRuleText.trim() },
      {
        onSuccess: () => setNewRuleText(""),
      }
    );
  };

  const handleSetActive = () => {
    if (ruleSet) {
      setActiveRuleSet({ id: ruleSet.id, gameId: ruleSet.game_id });
    }
  };

  const handleTogglePublic = () => {
    if (ruleSet) {
      updateRuleSet({ id: ruleSet.id, isPublic: !ruleSet.is_public });
    }
  };

  const handleDuplicate = () => {
    if (ruleSetId) {
      duplicateRuleSet(ruleSetId, {
        onSuccess: () => navigate("/house-rules"),
      });
    }
  };

  const handleDelete = () => {
    if (ruleSetId) {
      deleteRuleSet(ruleSetId, {
        onSuccess: () => navigate("/house-rules"),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ruleSet) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Rule set not found</h1>
          <Button onClick={() => navigate("/house-rules")}>
            Back to House Rules
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/house-rules")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="max-w-md"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleSaveName}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsEditingName(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold">{ruleSet.name}</h1>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditedName(ruleSet.name);
                    setIsEditingName(true);
                  }}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                {ruleSet.is_active && (
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${ruleSet.games.accent_color}20`,
                      color: ruleSet.games.accent_color,
                      borderColor: ruleSet.games.accent_color,
                    }}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
                {ruleSet.is_public && (
                  <Badge variant="secondary">
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>
            )}
            <p className="text-muted-foreground mt-1">{ruleSet.games.name}</p>
          </div>
        </div>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6 flex flex-wrap gap-2">
            {!ruleSet.is_active && (
              <Button onClick={handleSetActive} variant="default">
                Set as Active
              </Button>
            )}
            <Button onClick={handleTogglePublic} variant="outline">
              {ruleSet.is_public ? (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Make Private
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Make Public
                </>
              )}
            </Button>
            <Button onClick={handleDuplicate} variant="outline">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button
              onClick={() => setIsDeleteDialogOpen(true)}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </CardContent>
        </Card>

        {/* Rules List */}
        <Card>
          <CardHeader>
            <CardTitle>Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rules.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No rules added yet. Add your first rule below.
              </p>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <RuleItem
                    key={rule.id}
                    rule={rule}
                    index={index}
                    ruleSetId={ruleSet.id}
                  />
                ))}
              </div>
            )}

            {/* Add New Rule */}
            <form onSubmit={handleAddRule} className="space-y-2 pt-4">
              <Textarea
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                placeholder="Enter a new rule..."
                rows={2}
              />
              <Button type="submit" disabled={!newRuleText.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule Set</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule set? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HouseRuleDetail;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useRuleSetDetail, useHouseRuleSets } from "@/hooks/useHouseRuleSets";
import { useHouseRules } from "@/hooks/useHouseRules";
import { useRuleSetEditors } from "@/hooks/useRuleSetEditors";
import { useSavedRuleSets } from "@/hooks/useSavedRuleSets";
import { useAuth } from "@/hooks/useAuth";
import { RuleItem } from "@/components/house-rules/RuleItem";
import { RuleSetInfoPanel } from "@/components/house-rules/RuleSetInfoPanel";
import { AddEditorModal } from "@/components/house-rules/AddEditorModal";
import { VoiceRuleEditor } from "@/components/house-rules/VoiceRuleEditor";
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const HouseRuleDetail = () => {
  const { ruleSetId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ruleSet, isLoading: ruleSetLoading } = useRuleSetDetail(ruleSetId);
  const { rules, isLoading: rulesLoading, addRule } = useHouseRules(ruleSetId);
  const { isEditor, removeSelfAsEditor } = useRuleSetEditors(ruleSetId);
  const { isSaved, unsaveRuleSet } = useSavedRuleSets(ruleSetId);
  const {
    updateRuleSet,
    setActiveRuleSet,
    deleteRuleSet,
    duplicateRuleSet,
  } = useHouseRuleSets();

  const [newRuleText, setNewRuleText] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isAddEditorModalOpen, setIsAddEditorModalOpen] = useState(false);

  const isLoading = ruleSetLoading || rulesLoading;
  const isOwner = ruleSet?.user_id === user?.id;

  // Fetch owner profile if not owner
  const { data: ownerProfile } = useQuery({
    queryKey: ["owner-profile", ruleSet?.user_id],
    queryFn: async () => {
      if (!ruleSet?.user_id || isOwner) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("id", ruleSet.user_id)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!ruleSet?.user_id && !isOwner,
  });

  const handleUpdateName = (name: string) => {
    if (ruleSet) {
      updateRuleSet({ id: ruleSet.id, name });
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

  const handleRemove = () => {
    if (isEditor) {
      removeSelfAsEditor(undefined, {
        onSuccess: () => navigate("/house-rules"),
      });
    } else if (isSaved && ruleSetId) {
      unsaveRuleSet(ruleSetId, {
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

  const canEditRules = isOwner || isEditor;
  const ownerName = ownerProfile?.display_name || ownerProfile?.email;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/house-rules")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to House Rules
        </Button>

        {/* Info Panel */}
        <RuleSetInfoPanel
          ruleSet={ruleSet}
          isOwner={isOwner}
          isEditor={isEditor}
          isSaved={isSaved}
          ownerName={ownerName}
          onUpdateName={handleUpdateName}
          onSetActive={handleSetActive}
          onTogglePublic={handleTogglePublic}
          onDuplicate={handleDuplicate}
          onDelete={() => setIsDeleteDialogOpen(true)}
          onRemove={() => setIsRemoveDialogOpen(true)}
          onAddEditor={() => setIsAddEditorModalOpen(true)}
        />

        {/* Rules List */}
        <Card>
          <CardHeader>
            <CardTitle>Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rules.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No rules added yet. {canEditRules ? "Add your first rule below." : ""}
              </p>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, index) => (
                  <RuleItem
                    key={rule.id}
                    rule={rule}
                    index={index}
                    ruleSetId={ruleSet.id}
                    canEdit={canEditRules}
                  />
                ))}
              </div>
            )}

            {/* Add New Rule - only for those who can edit */}
            {canEditRules && (
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
            )}
          </CardContent>
        </Card>

        {/* Voice Rule Editor - only for those who can edit */}
        {canEditRules && (
          <VoiceRuleEditor 
            ruleSetId={ruleSet.id}
            ruleSetName={ruleSet.name}
            gameName={ruleSet.games.name}
            currentRules={rules}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule Set</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this rule set? This action cannot be undone. All rules and editor access will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from My Rules</AlertDialogTitle>
            <AlertDialogDescription>
              {isEditor
                ? "Are you sure you want to remove yourself as an editor? You will lose access to edit this rule set."
                : "Are you sure you want to remove this rule set from your profile?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Editor Modal */}
      <AddEditorModal
        isOpen={isAddEditorModalOpen}
        onClose={() => setIsAddEditorModalOpen(false)}
        ruleSetId={ruleSet.id}
      />
    </div>
  );
};

export default HouseRuleDetail;

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Editor {
  id: string;
  rule_set_id: string;
  user_id: string;
  added_by: string;
  added_at: string;
  profile: {
    id: string;
    email: string;
    display_name: string | null;
  };
}

export const useRuleSetEditors = (ruleSetId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: editors = [], isLoading } = useQuery({
    queryKey: ["rule-set-editors", ruleSetId],
    queryFn: async () => {
      if (!ruleSetId) return [];

      const { data: editorRecords, error } = await supabase
        .from("house_rule_set_editors")
        .select("*")
        .eq("rule_set_id", ruleSetId);

      if (error) throw error;
      if (!editorRecords || editorRecords.length === 0) return [];

      // Get editor profiles
      const userIds = editorRecords.map(e => e.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      return editorRecords.map(editor => ({
        ...editor,
        profile: profiles?.find(p => p.id === editor.user_id) || {
          id: editor.user_id,
          email: "Unknown",
          display_name: null,
        },
      })) as Editor[];
    },
    enabled: !!ruleSetId,
  });

  const { data: isEditor = false } = useQuery({
    queryKey: ["is-editor", ruleSetId, user?.id],
    queryFn: async () => {
      if (!ruleSetId || !user) return false;

      const { data, error } = await supabase
        .from("house_rule_set_editors")
        .select("id")
        .eq("rule_set_id", ruleSetId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!ruleSetId && !!user,
  });

  const addEditorMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!user || !ruleSetId) throw new Error("Missing required data");

      const { error } = await supabase
        .from("house_rule_set_editors")
        .insert({
          rule_set_id: ruleSetId,
          user_id: userId,
          added_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rule-set-editors", ruleSetId] });
      toast.success("Editor added successfully");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("This user is already an editor");
      } else {
        toast.error(error.message || "Failed to add editor");
      }
    },
  });

  const removeEditorMutation = useMutation({
    mutationFn: async (editorId: string) => {
      const { error } = await supabase
        .from("house_rule_set_editors")
        .delete()
        .eq("id", editorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rule-set-editors", ruleSetId] });
      toast.success("Editor removed");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove editor");
    },
  });

  const removeSelfAsEditorMutation = useMutation({
    mutationFn: async () => {
      if (!user || !ruleSetId) throw new Error("Missing required data");

      const { error } = await supabase
        .from("house_rule_set_editors")
        .delete()
        .eq("rule_set_id", ruleSetId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rule-set-editors"] });
      queryClient.invalidateQueries({ queryKey: ["is-editor"] });
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });
      toast.success("Removed from rule set");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove yourself");
    },
  });

  return {
    editors,
    isLoading,
    isEditor,
    addEditor: addEditorMutation.mutate,
    removeEditor: removeEditorMutation.mutate,
    removeSelfAsEditor: removeSelfAsEditorMutation.mutate,
    isAddingEditor: addEditorMutation.isPending,
  };
};

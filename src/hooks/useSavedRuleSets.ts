import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useSavedRuleSets = (ruleSetId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isSaved = false } = useQuery({
    queryKey: ["is-saved-rule-set", ruleSetId, user?.id],
    queryFn: async () => {
      if (!ruleSetId || !user) return false;

      const { data, error } = await supabase
        .from("saved_house_rule_sets")
        .select("id")
        .eq("rule_set_id", ruleSetId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!ruleSetId && !!user,
  });

  const { data: savedRuleSets = [], isLoading } = useQuery({
    queryKey: ["saved-rule-sets", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("saved_house_rule_sets")
        .select(`
          *,
          rule_set:rule_set_id (
            id,
            name,
            user_id,
            game_id,
            is_public,
            save_count,
            created_at,
            games:game_id (
              id,
              name,
              slug,
              accent_color,
              image_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveRuleSetMutation = useMutation({
    mutationFn: async (targetRuleSetId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("saved_house_rule_sets")
        .insert({
          user_id: user.id,
          rule_set_id: targetRuleSetId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-rule-sets"] });
      queryClient.invalidateQueries({ queryKey: ["is-saved-rule-set"] });
      toast.success("Rule set saved to your profile");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Rule set already saved");
      } else {
        toast.error(error.message || "Failed to save rule set");
      }
    },
  });

  const unsaveRuleSetMutation = useMutation({
    mutationFn: async (targetRuleSetId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("saved_house_rule_sets")
        .delete()
        .eq("user_id", user.id)
        .eq("rule_set_id", targetRuleSetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-rule-sets"] });
      queryClient.invalidateQueries({ queryKey: ["is-saved-rule-set"] });
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });
      toast.success("Rule set removed from your profile");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove rule set");
    },
  });

  return {
    isSaved,
    savedRuleSets,
    isLoading,
    saveRuleSet: saveRuleSetMutation.mutate,
    unsaveRuleSet: unsaveRuleSetMutation.mutate,
    isSaving: saveRuleSetMutation.isPending,
  };
};

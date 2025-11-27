import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface HouseRuleSet {
  id: string;
  user_id: string;
  game_id: string;
  name: string;
  is_active: boolean;
  is_public: boolean;
  save_count: number;
  created_at: string;
  updated_at: string;
  games: {
    id: string;
    name: string;
    slug: string;
    accent_color: string;
    image_url: string | null;
  };
}

export const useHouseRuleSets = (gameId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: ruleSets = [], isLoading } = useQuery({
    queryKey: ["house-rule-sets", user?.id, gameId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("house_rule_sets")
        .select(`
          *,
          games:game_id (
            id,
            name,
            slug,
            accent_color,
            image_url
          )
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (gameId) {
        query = query.eq("game_id", gameId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as HouseRuleSet[];
    },
    enabled: !!user,
  });

  const createRuleSetMutation = useMutation({
    mutationFn: async (data: { name: string; gameId: string }) => {
      if (!user) throw new Error("User not authenticated");

      // Check if there's already an active rule set for this game
      const { data: existing } = await supabase
        .from("house_rule_sets")
        .select("id")
        .eq("user_id", user.id)
        .eq("game_id", data.gameId)
        .eq("is_active", true)
        .single();

      const { data: ruleSet, error } = await supabase
        .from("house_rule_sets")
        .insert({
          name: data.name,
          game_id: data.gameId,
          user_id: user.id,
          is_active: !existing, // Only set as active if no other active set exists
        })
        .select()
        .single();

      if (error) throw error;
      return ruleSet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });
      toast.success("Rule set created!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create rule set");
    },
  });

  const updateRuleSetMutation = useMutation({
    mutationFn: async (data: { id: string; name?: string; isPublic?: boolean }) => {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.isPublic !== undefined) updateData.is_public = data.isPublic;

      const { error } = await supabase
        .from("house_rule_sets")
        .update(updateData)
        .eq("id", data.id);

      if (error) throw error;
      return data.id;
    },
    onSuccess: (ruleSetId) => {
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });
      queryClient.invalidateQueries({ queryKey: ["house-rule-set", ruleSetId] });
      toast.success("Rule set updated!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update rule set");
    },
  });

  const setActiveRuleSetMutation = useMutation({
    mutationFn: async (data: { id: string; gameId: string }) => {
      if (!user) throw new Error("User not authenticated");

      // Deactivate all other rule sets for this game
      await supabase
        .from("house_rule_sets")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("game_id", data.gameId);

      // Activate the selected rule set
      const { error } = await supabase
        .from("house_rule_sets")
        .update({ is_active: true })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });
      toast.success("Active rule set updated!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to set active rule set");
    },
  });

  const deleteRuleSetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("house_rule_sets")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });
      toast.success("Rule set deleted!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete rule set");
    },
  });

  const duplicateRuleSetMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      // Get the original rule set and its rules
      const { data: originalSet, error: setError } = await supabase
        .from("house_rule_sets")
        .select("*")
        .eq("id", id)
        .single();

      if (setError) throw setError;

      const { data: originalRules, error: rulesError } = await supabase
        .from("house_rules")
        .select("*")
        .eq("rule_set_id", id)
        .order("sort_order");

      if (rulesError) throw rulesError;

      // Create new rule set
      const { data: newSet, error: newSetError } = await supabase
        .from("house_rule_sets")
        .insert({
          name: `${originalSet.name} (Copy)`,
          game_id: originalSet.game_id,
          user_id: user.id,
          is_active: false,
        })
        .select()
        .single();

      if (newSetError) throw newSetError;

      // Copy all rules
      if (originalRules.length > 0) {
        const newRules = originalRules.map((rule) => ({
          rule_set_id: newSet.id,
          rule_text: rule.rule_text,
          sort_order: rule.sort_order,
        }));

        const { error: copyError } = await supabase
          .from("house_rules")
          .insert(newRules);

        if (copyError) throw copyError;
      }

      return newSet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });
      toast.success("Rule set duplicated!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to duplicate rule set");
    },
  });

  return {
    ruleSets,
    isLoading,
    createRuleSet: createRuleSetMutation.mutate,
    updateRuleSet: updateRuleSetMutation.mutate,
    setActiveRuleSet: setActiveRuleSetMutation.mutate,
    deleteRuleSet: deleteRuleSetMutation.mutate,
    duplicateRuleSet: duplicateRuleSetMutation.mutate,
    isCreating: createRuleSetMutation.isPending,
  };
};

export const useRuleSetDetail = (ruleSetId: string | undefined) => {
  const { data: ruleSet, isLoading } = useQuery({
    queryKey: ["house-rule-set", ruleSetId],
    queryFn: async () => {
      if (!ruleSetId) return null;

      const { data, error } = await supabase
        .from("house_rule_sets")
        .select(`
          *,
          games:game_id (
            id,
            name,
            slug,
            accent_color,
            image_url
          )
        `)
        .eq("id", ruleSetId)
        .single();

      if (error) throw error;
      return data as HouseRuleSet;
    },
    enabled: !!ruleSetId,
  });

  return { ruleSet, isLoading };
};

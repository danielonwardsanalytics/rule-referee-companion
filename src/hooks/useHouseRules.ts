import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HouseRule {
  id: string;
  rule_set_id: string;
  rule_text: string;
  title: string | null;
  sort_order: number;
  created_at: string;
}

export const useHouseRules = (ruleSetId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["house-rules", ruleSetId],
    queryFn: async () => {
      if (!ruleSetId) return [];

      const { data, error } = await supabase
        .from("house_rules")
        .select("*")
        .eq("rule_set_id", ruleSetId)
        .order("sort_order");

      if (error) throw error;
      return data as HouseRule[];
    },
    enabled: !!ruleSetId,
  });

  const addRuleMutation = useMutation({
    mutationFn: async (data: { ruleSetId: string; ruleText: string; title?: string }) => {
      // Get the highest sort_order
      const { data: existingRules } = await supabase
        .from("house_rules")
        .select("sort_order")
        .eq("rule_set_id", data.ruleSetId)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextSortOrder = existingRules && existingRules.length > 0 
        ? existingRules[0].sort_order + 1 
        : 0;

      const { data: insertedRule, error } = await supabase
        .from("house_rules")
        .insert({
          rule_set_id: data.ruleSetId,
          rule_text: data.ruleText,
          title: data.title || null,
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      // Update the rule set's updated_at timestamp
      await supabase
        .from("house_rule_sets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", data.ruleSetId);

      return insertedRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["house-rules"] });
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });
      toast.success("Rule added!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add rule");
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async (data: { id: string; ruleText?: string; title?: string; ruleSetId: string }) => {
      const updateData: { rule_text?: string; title?: string } = {};
      if (data.ruleText !== undefined) updateData.rule_text = data.ruleText;
      if (data.title !== undefined) updateData.title = data.title;

      const { error } = await supabase
        .from("house_rules")
        .update(updateData)
        .eq("id", data.id);

      if (error) throw error;

      // Update the rule set's updated_at timestamp
      await supabase
        .from("house_rule_sets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", data.ruleSetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["house-rules"] });
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });
      toast.success("Rule updated!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update rule");
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (data: { id: string; ruleSetId: string }) => {
      const { error } = await supabase
        .from("house_rules")
        .delete()
        .eq("id", data.id);

      if (error) throw error;

      // Update the rule set's updated_at timestamp
      await supabase
        .from("house_rule_sets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", data.ruleSetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["house-rules"] });
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });
      toast.success("Rule deleted!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete rule");
    },
  });

  const reorderRulesMutation = useMutation({
    mutationFn: async (data: { rules: Array<{ id: string; sort_order: number }>; ruleSetId: string }) => {
      // Update all rules with new sort orders
      for (const rule of data.rules) {
        await supabase
          .from("house_rules")
          .update({ sort_order: rule.sort_order })
          .eq("id", rule.id);
      }

      // Update the rule set's updated_at timestamp
      await supabase
        .from("house_rule_sets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", data.ruleSetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["house-rules"] });
      queryClient.invalidateQueries({ queryKey: ["house-rule-sets"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reorder rules");
    },
  });

  return {
    rules,
    isLoading,
    addRule: addRuleMutation.mutateAsync,
    updateRule: updateRuleMutation.mutate,
    deleteRule: deleteRuleMutation.mutate,
    reorderRules: reorderRulesMutation.mutate,
  };
};
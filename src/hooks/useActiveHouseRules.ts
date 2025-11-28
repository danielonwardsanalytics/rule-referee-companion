import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useActiveHouseRules = (gameId: string | undefined) => {
  return useQuery({
    queryKey: ["active-house-rules", gameId],
    queryFn: async () => {
      if (!gameId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get the active house rule set for this game
      const { data: ruleSet, error: ruleSetError } = await supabase
        .from("house_rule_sets")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("game_id", gameId)
        .eq("is_active", true)
        .maybeSingle();

      if (ruleSetError) throw ruleSetError;
      if (!ruleSet) return null;

      // Get the rules for this rule set
      const { data: rules, error: rulesError } = await supabase
        .from("house_rules")
        .select("rule_text, sort_order")
        .eq("rule_set_id", ruleSet.id)
        .order("sort_order");

      if (rulesError) throw rulesError;

      return {
        ruleSetName: ruleSet.name,
        rules: rules?.map(r => r.rule_text) || []
      };
    },
    enabled: !!gameId,
  });
};

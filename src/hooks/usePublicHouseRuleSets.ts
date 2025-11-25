import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePublicHouseRuleSets = () => {
  return useQuery({
    queryKey: ["public-house-rule-sets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("house_rule_sets")
        .select(`
          *,
          games (
            id,
            name,
            slug,
            image_url,
            accent_color
          ),
          profiles!house_rule_sets_user_id_fkey (
            display_name,
            email
          ),
          house_rules (
            id,
            rule_text,
            sort_order
          )
        `)
        .eq("is_public", true)
        .order("save_count", { ascending: false });

      if (error) throw error;
      
      // Transform the data to include game and creator info
      return data.map((ruleSet: any) => ({
        ...ruleSet,
        game: ruleSet.games,
        creator: ruleSet.profiles,
        rules: ruleSet.house_rules || [],
      }));
    },
  });
};

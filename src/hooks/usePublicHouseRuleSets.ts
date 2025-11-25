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
            image_url,
            accent_color
          )
        `)
        .eq("is_public", true)
        .gte("save_count", 50)
        .order("save_count", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

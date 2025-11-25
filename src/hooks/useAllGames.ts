import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Game {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  accent_color: string;
  rules_summary: string | null;
  created_at: string;
}

export const useAllGames = () => {
  const { data: games = [], isLoading } = useQuery({
    queryKey: ["all-games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Game[];
    },
  });

  return {
    games,
    isLoading,
  };
};

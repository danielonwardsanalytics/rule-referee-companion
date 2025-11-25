import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Game {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  accent_color: string;
}

interface UserGame {
  id: string;
  user_id: string;
  game_id: string;
  is_visible: boolean;
  added_at: string;
  games: Game;
}

export const useUserGames = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userGames = [], isLoading } = useQuery({
    queryKey: ["user-games", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_games")
        .select(`
          id,
          user_id,
          game_id,
          is_visible,
          added_at,
          games:game_id (
            id,
            name,
            slug,
            description,
            image_url,
            accent_color
          )
        `)
        .eq("user_id", user.id)
        .eq("is_visible", true)
        .order("added_at", { ascending: false });

      if (error) throw error;
      return data as UserGame[];
    },
    enabled: !!user,
  });

  const addGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("user_games")
        .upsert(
          {
            user_id: user.id,
            game_id: gameId,
            is_visible: true,
          },
          { onConflict: "user_id,game_id" }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-games"] });
      toast.success("Game added to My Games");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add game");
    },
  });

  const removeGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("user_games")
        .update({ is_visible: false })
        .eq("user_id", user.id)
        .eq("game_id", gameId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-games"] });
      toast.success("Game removed from My Games");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove game");
    },
  });

  return {
    userGames,
    isLoading,
    addGame: addGameMutation.mutate,
    removeGame: removeGameMutation.mutate,
    isAddingGame: addGameMutation.isPending,
    isRemovingGame: removeGameMutation.isPending,
  };
};

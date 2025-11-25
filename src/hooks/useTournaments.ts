import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Tournament {
  id: string;
  name: string;
  game_id: string;
  admin_id: string;
  house_rule_set_id: string | null;
  is_active: boolean;
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

export const useTournaments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["tournaments", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("tournaments")
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
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Tournament[];
    },
    enabled: !!user,
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (data: { name: string; gameId: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data: tournament, error } = await supabase
        .from("tournaments")
        .insert({
          name: data.name,
          game_id: data.gameId,
          admin_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return tournament;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      toast.success("Tournament created!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create tournament");
    },
  });

  const updateTournamentMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      const { error } = await supabase
        .from("tournaments")
        .update({ name: data.name })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["tournament"] });
      toast.success("Tournament updated!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update tournament");
    },
  });

  return {
    tournaments,
    isLoading,
    createTournament: createTournamentMutation.mutate,
    updateTournament: updateTournamentMutation.mutate,
    isCreating: createTournamentMutation.isPending,
  };
};

export const useTournamentDetail = (tournamentId: string | undefined) => {
  const { data: tournament, isLoading } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return null;

      const { data, error } = await supabase
        .from("tournaments")
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
        .eq("id", tournamentId)
        .single();

      if (error) throw error;
      return data as Tournament;
    },
    enabled: !!tournamentId,
  });

  return { tournament, isLoading };
};

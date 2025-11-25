import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const useGameSuggestions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["game-suggestions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("game_suggestions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitSuggestion = useMutation({
    mutationFn: async (suggestion: {
      game_name: string;
      description?: string;
      reason?: string;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("game_suggestions")
        .insert({
          user_id: user.id,
          game_name: suggestion.game_name,
          description: suggestion.description,
          reason: suggestion.reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-suggestions"] });
      toast({
        title: "Request submitted",
        description: "Your game request has been submitted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit game request. Please try again.",
        variant: "destructive",
      });
      console.error("Error submitting game suggestion:", error);
    },
  });

  return {
    suggestions,
    isLoading,
    submitSuggestion: submitSuggestion.mutate,
    isSubmitting: submitSuggestion.isPending,
  };
};

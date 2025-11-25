import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface NotificationPreferences {
  id: string;
  user_id: string;
  tournament_invites: boolean;
  game_results: boolean;
  friend_requests: boolean;
  game_requests: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as NotificationPreferences | null;
    },
    enabled: !!user,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!user) throw new Error("No user");

      // First check if preferences exist
      const { data: existing } = await supabase
        .from("notification_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("notification_preferences")
          .update(updates)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: user.id,
            ...updates,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Notification preferences updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update preferences");
      console.error(error);
    },
  });

  return {
    preferences,
    isLoading,
    updatePreferences: updatePreferencesMutation.mutate,
    isUpdating: updatePreferencesMutation.isPending,
  };
};

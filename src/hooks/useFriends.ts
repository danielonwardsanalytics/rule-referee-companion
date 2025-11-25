import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend: {
    id: string;
    email: string;
    display_name: string | null;
  };
}

export const useFriends = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get friendships
      const { data: friendships, error: friendshipsError } = await supabase
        .from("friends")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (friendshipsError) throw friendshipsError;
      if (!friendships || friendships.length === 0) return [];

      // Get friend profiles
      const friendIds = friendships.map(f => f.friend_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", friendIds);

      if (profilesError) throw profilesError;

      // Combine the data
      return friendships.map(friendship => ({
        ...friendship,
        friend: profiles?.find(p => p.id === friendship.friend_id) || {
          id: friendship.friend_id,
          email: "Unknown",
          display_name: null,
        },
      })) as Friend[];
    },
    enabled: !!user,
  });

  const removeFriendMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend removed");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove friend");
    },
  });

  return {
    friends,
    isLoading,
    removeFriend: removeFriendMutation.mutate,
  };
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface FriendRequest {
  id: string;
  requester_id: string;
  recipient_id: string | null;
  recipient_email: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
  requester: {
    id: string;
    email: string;
    display_name: string | null;
  } | null;
  recipient: {
    id: string;
    email: string;
    display_name: string | null;
  } | null;
}

export const useFriendRequests = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Incoming friend requests (where current user is recipient)
  const { data: incomingRequests = [], isLoading: incomingLoading } = useQuery({
    queryKey: ["friend-requests-incoming", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get incoming requests
      const { data: requests, error: requestsError } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("recipient_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;
      if (!requests || requests.length === 0) return [];

      // Get requester profiles
      const requesterIds = requests.map(r => r.requester_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", requesterIds);

      if (profilesError) throw profilesError;

      // Combine the data
      return requests.map(request => ({
        ...request,
        requester: profiles?.find(p => p.id === request.requester_id) || null,
        recipient: null,
      })) as FriendRequest[];
    },
    enabled: !!user,
  });

  // Outgoing friend requests (where current user is requester)
  const { data: outgoingRequests = [], isLoading: outgoingLoading } = useQuery({
    queryKey: ["friend-requests-outgoing", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get outgoing requests
      const { data: requests, error: requestsError } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("requester_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;
      if (!requests || requests.length === 0) return [];

      // Get recipient profiles (only for those with recipient_id)
      const recipientIds = requests.filter(r => r.recipient_id).map(r => r.recipient_id!);
      let profiles: any[] = [];
      
      if (recipientIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, email, display_name")
          .in("id", recipientIds);

        if (profilesError) throw profilesError;
        profiles = profilesData || [];
      }

      // Combine the data
      return requests.map(request => ({
        ...request,
        requester: null,
        recipient: request.recipient_id 
          ? profiles?.find(p => p.id === request.recipient_id) || null
          : null,
      })) as FriendRequest[];
    },
    enabled: !!user,
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!user) throw new Error("User not authenticated");

      // Check if user is trying to add themselves
      if (email.toLowerCase() === user.email?.toLowerCase()) {
        throw new Error("You cannot send a friend request to yourself");
      }

      // Look up the recipient by email
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (profileError) throw profileError;

      // Check if they're already friends
      if (profiles) {
        const { data: existingFriend } = await supabase
          .from("friends")
          .select("id")
          .or(`and(user_id.eq.${user.id},friend_id.eq.${profiles.id}),and(user_id.eq.${profiles.id},friend_id.eq.${user.id})`)
          .maybeSingle();

        if (existingFriend) {
          throw new Error("You are already friends with this user");
        }

        // Check for existing pending request
        const { data: existingRequest } = await supabase
          .from("friend_requests")
          .select("id")
          .eq("requester_id", user.id)
          .eq("recipient_id", profiles.id)
          .eq("status", "pending")
          .maybeSingle();

        if (existingRequest) {
          throw new Error("Friend request already sent");
        }
      }

      const { error } = await supabase.from("friend_requests").insert({
        requester_id: user.id,
        recipient_id: profiles?.id || null,
        recipient_email: profiles ? null : email,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests-outgoing"] });
      toast.success("Friend request sent!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send friend request");
    },
  });

  const acceptFriendRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error("User not authenticated");

      // Get the request details
      const { data: request, error: requestError } = await supabase
        .from("friend_requests")
        .select("requester_id")
        .eq("id", requestId)
        .single();

      if (requestError) throw requestError;

      // Update the request status
      const { error: updateError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Create the friendship (both directions)
      const { error: friendError1 } = await supabase.from("friends").insert({
        user_id: user.id,
        friend_id: request.requester_id,
      });

      if (friendError1) throw friendError1;

      const { error: friendError2 } = await supabase.from("friends").insert({
        user_id: request.requester_id,
        friend_id: user.id,
      });

      if (friendError2) throw friendError2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests-incoming"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request accepted!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to accept friend request");
    },
  });

  const rejectFriendRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("friend_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests-incoming"] });
      toast.success("Friend request rejected");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reject friend request");
    },
  });

  const cancelFriendRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests-outgoing"] });
      toast.success("Friend request cancelled");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel friend request");
    },
  });

  return {
    incomingRequests,
    outgoingRequests,
    isLoading: incomingLoading || outgoingLoading,
    sendFriendRequest: sendFriendRequestMutation.mutate,
    acceptFriendRequest: acceptFriendRequestMutation.mutate,
    rejectFriendRequest: rejectFriendRequestMutation.mutate,
    cancelFriendRequest: cancelFriendRequestMutation.mutate,
    isSending: sendFriendRequestMutation.isPending,
  };
};

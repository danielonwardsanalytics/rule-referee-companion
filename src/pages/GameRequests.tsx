import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { GameRequestCard } from "@/components/game-requests/GameRequestCard";
import { SendRequestModal } from "@/components/game-requests/SendRequestModal";
import { useFriends } from "@/hooks/useFriends";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GameRequests = () => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; name: string } | null>(null);

  // Fetch received requests
  const { data: receivedRequests = [], isLoading: receivedLoading, refetch: refetchReceived } = useQuery({
    queryKey: ["game-requests-received", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("game_requests")
        .select(`
          *,
          games (
            name,
            accent_color
          ),
          requester:profiles!game_requests_requester_id_fkey (
            display_name,
            email
          )
        `)
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map((req: any) => ({
        ...req,
        game: req.games,
        requester: req.requester,
      }));
    },
    enabled: !!user,
  });

  // Fetch sent requests
  const { data: sentRequests = [], isLoading: sentLoading, refetch: refetchSent } = useQuery({
    queryKey: ["game-requests-sent", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("game_requests")
        .select(`
          *,
          games (
            name,
            accent_color
          ),
          recipient:profiles!game_requests_recipient_id_fkey (
            display_name,
            email
          )
        `)
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map((req: any) => ({
        ...req,
        game: req.games,
        recipient: req.recipient,
      }));
    },
    enabled: !!user,
  });

  const handleUpdate = () => {
    refetchReceived();
    refetchSent();
  };

  const handleOpenSendModal = (friendId: string, friendName: string) => {
    setSelectedFriend({ id: friendId, name: friendName });
    setIsSendModalOpen(true);
  };

  const handleFriendSelect = (friendId: string) => {
    const friend = friends?.find((f) => f.friend_id === friendId);
    if (friend) {
      handleOpenSendModal(
        friend.friend_id,
        friend.friend.display_name || friend.friend.email
      );
    }
  };

  const isLoading = receivedLoading || sentLoading;
  const pendingReceivedCount = receivedRequests.filter((r: any) => r.status === "pending").length;
  const pendingSentCount = sentRequests.filter((r: any) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Game Invitations</h1>
            <p className="text-muted-foreground mt-1">
              Send and receive game invitations with friends
            </p>
          </div>
          {friends && friends.length > 0 && (
            <div className="flex items-center gap-2">
              <Select onValueChange={handleFriendSelect}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select friend" />
                </SelectTrigger>
                <SelectContent>
                  {friends.map((friend) => (
                    <SelectItem key={friend.id} value={friend.friend_id}>
                      {friend.friend.display_name || friend.friend.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isLoading ? (
          <LoadingSpinner size="lg" text="Loading requests..." />
        ) : (
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received" className="relative">
                <Inbox className="h-4 w-4 mr-2" />
                Received
                {pendingReceivedCount > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1.5 py-0 text-xs">
                    {pendingReceivedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="relative">
                <Send className="h-4 w-4 mr-2" />
                Sent
                {pendingSentCount > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-xs">
                    {pendingSentCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="space-y-4">
              {receivedRequests.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No game invitations"
                  description="You haven't received any game invitations yet"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {receivedRequests.map((request: any) => (
                    <GameRequestCard
                      key={request.id}
                      request={request}
                      type="received"
                      onUpdate={handleUpdate}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {sentRequests.length === 0 ? (
                <EmptyState
                  icon={Send}
                  title="No sent invitations"
                  description="You haven't sent any game invitations yet"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sentRequests.map((request: any) => (
                    <GameRequestCard
                      key={request.id}
                      request={request}
                      type="sent"
                      onUpdate={handleUpdate}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {selectedFriend && (
        <SendRequestModal
          isOpen={isSendModalOpen}
          onClose={() => {
            setIsSendModalOpen(false);
            setSelectedFriend(null);
          }}
          recipientId={selectedFriend.id}
          recipientName={selectedFriend.name}
          onSuccess={handleUpdate}
        />
      )}
    </div>
  );
};

export default GameRequests;

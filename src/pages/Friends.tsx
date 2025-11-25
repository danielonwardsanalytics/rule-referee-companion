import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Loader2, Mail, Check, X, Trash2, UserX } from "lucide-react";
import { useFriends } from "@/hooks/useFriends";
import { useFriendRequests } from "@/hooks/useFriendRequests";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Friends = () => {
  const { friends, isLoading: friendsLoading, removeFriend } = useFriends();
  const {
    incomingRequests,
    outgoingRequests,
    isLoading: requestsLoading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    isSending,
  } = useFriendRequests();

  const [email, setEmail] = useState("");
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);

  const isLoading = friendsLoading || requestsLoading;

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    sendFriendRequest(email.trim(), {
      onSuccess: () => setEmail(""),
    });
  };

  const handleRemoveFriend = () => {
    if (friendToRemove) {
      removeFriend(friendToRemove);
      setFriendToRemove(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Friends</h1>
          <p className="text-muted-foreground mt-1">
            Manage your friends and invitations
          </p>
        </div>

        {/* Add Friend */}
        <Card>
          <CardHeader>
            <CardTitle>Add Friend</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendRequest} className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={isSending}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Incoming Friend Requests */}
        {incomingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Friend Requests</CardTitle>
                <Badge variant="secondary">{incomingRequests.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {incomingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {request.requester?.display_name || request.requester?.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => acceptFriendRequest(request.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectFriendRequest(request.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Outgoing Friend Requests */}
        {outgoingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {outgoingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {request.recipient?.display_name ||
                          request.recipient?.email ||
                          request.recipient_email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Sent {formatDistanceToNow(new Date(request.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelFriendRequest(request.id)}
                  >
                    Cancel
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Friends List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Friends</CardTitle>
              <Badge variant="secondary">{friends.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <UserX className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No friends yet. Send a friend request to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friendship) => (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {(friendship.friend.display_name || friendship.friend.email)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {friendship.friend.display_name || friendship.friend.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {friendship.friend.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setFriendToRemove(friendship.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Remove Friend Confirmation */}
      <AlertDialog
        open={!!friendToRemove}
        onOpenChange={() => setFriendToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this friend? They will be able to send
              you a friend request again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveFriend}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Friends;

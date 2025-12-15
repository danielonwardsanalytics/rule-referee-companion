import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFriends } from "@/hooks/useFriends";
import { useRuleSetEditors } from "@/hooks/useRuleSetEditors";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { UserPlus, X, Loader2, Check, Users, Mail, QrCode } from "lucide-react";

interface AddEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleSetId: string;
}

export const AddEditorModal = ({ isOpen, onClose, ruleSetId }: AddEditorModalProps) => {
  const { friends, isLoading: friendsLoading } = useFriends();
  const { editors, addEditor, removeEditor, isAddingEditor } = useRuleSetEditors(ruleSetId);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const editorUserIds = editors.map(e => e.user_id);

  // Sort friends alphabetically by display name or email
  const sortedFriends = [...friends].sort((a, b) => {
    const nameA = (a.friend.display_name || a.friend.email).toLowerCase();
    const nameB = (b.friend.display_name || b.friend.email).toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const handleAddEditor = (userId: string) => {
    setSelectedFriend(userId);
    addEditor(userId, {
      onSettled: () => setSelectedFriend(null),
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user is trying to add themselves
      if (user.email?.toLowerCase() === email.trim().toLowerCase()) {
        toast({
          title: "Invalid Request",
          description: "You cannot send a friend request to yourself",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Use secure server-side function for email lookup
      const { data: lookupResult } = await supabase
        .rpc("lookup_user_by_email", { _email: email.trim().toLowerCase() })
        .single();
      
      const existingFriend = lookupResult ? { id: lookupResult.user_id } : null;

      if (existingFriend) {
        // Check if already friends
        const { data: friendship } = await supabase
          .from("friends")
          .select("id")
          .eq("user_id", user.id)
          .eq("friend_id", existingFriend.id)
          .maybeSingle();

        if (friendship) {
          // Already friends - add them directly as editor
          addEditor(existingFriend.id, {
            onSuccess: () => {
              setEmail("");
              toast({
                title: "Editor Added",
                description: "Your friend has been added as an editor",
              });
            },
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Check for existing pending request
      const { data: existingRequest } = await supabase
        .from("friend_requests")
        .select("id, status")
        .eq("requester_id", user.id)
        .eq("recipient_email", email.trim().toLowerCase())
        .eq("status", "pending")
        .maybeSingle();

      if (existingRequest) {
        toast({
          title: "Request Already Sent",
          description: "You already have a pending friend request with this user",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Send friend request
      const { error } = await supabase
        .from("friend_requests")
        .insert({
          requester_id: user.id,
          recipient_email: email.trim().toLowerCase(),
          recipient_id: existingFriend?.id || null,
        });

      if (error) throw error;

      toast({
        title: "Friend Request Sent",
        description: existingFriend
          ? "Your friend request has been sent. They will be added as editor once they accept."
          : "An invitation will be sent. They will be added as editor once they join and accept.",
      });

      setEmail("");
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRScan = async (qrData: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const friendId = qrData.replace("qr_", "");

      if (friendId === user.id) {
        toast({
          title: "Invalid QR Code",
          description: "You cannot add yourself as an editor",
          variant: "destructive",
        });
        return;
      }

      // Check if already friends
      const { data: friendship } = await supabase
        .from("friends")
        .select("id")
        .eq("user_id", user.id)
        .eq("friend_id", friendId)
        .maybeSingle();

      if (friendship) {
        // Already friends - add as editor directly
        addEditor(friendId, {
          onSuccess: () => {
            toast({
              title: "Editor Added",
              description: "Your friend has been added as an editor",
            });
            onClose();
          },
        });
        return;
      }

      // Send friend request
      const { error } = await supabase
        .from("friend_requests")
        .insert({
          requester_id: user.id,
          recipient_id: friendId,
          recipient_email: null,
        });

      if (error) throw error;

      toast({
        title: "Friend Request Sent",
        description: "They will be added as editor once they accept your friend request.",
      });

      onClose();
    } catch (error) {
      console.error("Error processing QR code:", error);
      toast({
        title: "Error",
        description: "Failed to process QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Editor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Editors */}
          {editors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Current Editors</h4>
              <div className="space-y-2">
                {editors.map((editor) => (
                  <div
                    key={editor.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(editor.profile.display_name, editor.profile.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {editor.profile.display_name || editor.profile.email}
                        </p>
                        {editor.profile.display_name && (
                          <p className="text-xs text-muted-foreground">{editor.profile.email}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeEditor(editor.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs for choosing friends or inviting new */}
          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="friends">
                <Users className="h-4 w-4 mr-2" />
                From Friends
              </TabsTrigger>
              <TabsTrigger value="invite">
                <Mail className="h-4 w-4 mr-2" />
                Invite Friend
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-4">
              {friendsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sortedFriends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No friends yet. Use the "Invite Friend" tab to add someone.
                </p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {sortedFriends.map((friendship) => {
                      const isAlreadyEditor = editorUserIds.includes(friendship.friend_id);
                      const isSelecting = selectedFriend === friendship.friend_id;

                      return (
                        <div
                          key={friendship.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(friendship.friend.display_name, friendship.friend.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {friendship.friend.display_name || friendship.friend.email}
                              </p>
                              {friendship.friend.display_name && (
                                <p className="text-xs text-muted-foreground">
                                  {friendship.friend.email}
                                </p>
                              )}
                            </div>
                          </div>
                          {isAlreadyEditor ? (
                            <Badge variant="secondary" className="gap-1">
                              <Check className="h-3 w-3" />
                              Editor
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddEditor(friendship.friend_id)}
                              disabled={isAddingEditor || isSelecting}
                            >
                              {isSelecting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="invite" className="space-y-4">
              <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="qr">
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editor-email">Friend's Email or Username</Label>
                    <Input
                      id="editor-email"
                      type="email"
                      placeholder="friend@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleEmailSubmit()}
                    />
                    <p className="text-xs text-muted-foreground">
                      If they don't have an account, they'll receive an invitation email.
                    </p>
                  </div>
                  <Button
                    onClick={handleEmailSubmit}
                    disabled={!email.trim() || isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Send Invitation
                  </Button>
                </TabsContent>

                <TabsContent value="qr" className="space-y-4">
                  <QRCodeScanner onScan={handleQRScan} onClose={() => {}} />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

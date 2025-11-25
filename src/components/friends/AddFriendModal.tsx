import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, QrCode, Loader2 } from "lucide-react";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddFriendModal = ({ isOpen, onClose, onSuccess }: AddFriendModalProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleEmailSubmit = async () => {
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user is trying to add themselves
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (profile?.email === email.trim().toLowerCase()) {
        toast({
          title: "Invalid Request",
          description: "You cannot send a friend request to yourself",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if already friends
      const { data: existingFriend } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .single();

      if (existingFriend) {
        const { data: friendship } = await supabase
          .from("friends")
          .select("id")
          .eq("user_id", user.id)
          .eq("friend_id", existingFriend.id)
          .maybeSingle();

        if (friendship) {
          toast({
            title: "Already Friends",
            description: "You are already friends with this user",
            variant: "destructive",
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
          ? "Your friend request has been sent"
          : "An invitation email will be sent once they join",
      });

      setEmail("");
      onSuccess();
      onClose();
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

      // Extract user ID from QR code
      const friendId = qrData.replace("qr_", "");

      if (friendId === user.id) {
        toast({
          title: "Invalid QR Code",
          description: "You cannot add yourself as a friend",
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
        toast({
          title: "Already Friends",
          description: "You are already friends with this user",
          variant: "destructive",
        });
        return;
      }

      // Get friend email
      const { data: friendProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", friendId)
        .single();

      if (!friendProfile) throw new Error("User not found");

      // Send friend request
      const { error } = await supabase
        .from("friend_requests")
        .insert({
          requester_id: user.id,
          recipient_id: friendId,
          recipient_email: friendProfile.email,
        });

      if (error) throw error;

      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent",
      });

      onSuccess();
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
        </DialogHeader>

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
              <Label htmlFor="email">Friend's Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleEmailSubmit()}
              />
            </div>
            <Button
              onClick={handleEmailSubmit}
              disabled={!email.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Friend Request
            </Button>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <QRCodeScanner onScan={handleQRScan} onClose={onClose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

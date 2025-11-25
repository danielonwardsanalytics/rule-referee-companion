import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTournamentPlayers } from "@/hooks/useTournamentPlayers";
import { useFriends } from "@/hooks/useFriends";
import { Loader2, Users, UserPlus, Mail, Info } from "lucide-react";

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
}

export const AddPlayerModal = ({ isOpen, onClose, tournamentId }: AddPlayerModalProps) => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const { addPlayer, isAddingPlayer } = useTournamentPlayers(tournamentId);
  const { friends, isLoading: friendsLoading } = useFriends();

  const handleSubmitName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    addPlayer(
      { tournamentId, displayName: displayName.trim() },
      {
        onSuccess: () => {
          setDisplayName("");
          onClose();
        },
      }
    );
  };

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    addPlayer(
      { tournamentId, email: email.trim() },
      {
        onSuccess: () => {
          setEmail("");
          onClose();
        },
      }
    );
  };

  const handleAddFriend = (friendName: string) => {
    addPlayer(
      { tournamentId, displayName: friendName },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Player</DialogTitle>
          <DialogDescription>
            Add a player by name, select from friends, or invite by email
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="name" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="name">
              <UserPlus className="h-4 w-4 mr-2" />
              By Name
            </TabsTrigger>
            <TabsTrigger value="friends">
              <Users className="h-4 w-4 mr-2" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email Invite
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="name">
            <form onSubmit={handleSubmitName} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playerName">Player Name</Label>
                <Input
                  id="playerName"
                  placeholder="Enter player name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isAddingPlayer}>
                  {isAddingPlayer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Player
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="friends">
            <div className="space-y-4">
              {friendsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No friends yet. Add friends first to invite them!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
                          <p className="text-xs text-muted-foreground">
                            {friendship.friend.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddFriend(friendship.friend.display_name || friendship.friend.email)}
                        disabled={isAddingPlayer}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="email">
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Send an email invitation. The player will be added to the tournament when they sign up or log in with this email. Invitation expires in 7 days.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="playerEmail">Email Address</Label>
                <Input
                  id="playerEmail"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={isAddingPlayer}>
                  {isAddingPlayer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invitation
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

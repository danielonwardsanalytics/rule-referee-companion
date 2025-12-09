import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFriends } from "@/hooks/useFriends";
import { useRuleSetEditors } from "@/hooks/useRuleSetEditors";
import { UserPlus, X, Loader2, Check } from "lucide-react";

interface AddEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleSetId: string;
}

export const AddEditorModal = ({ isOpen, onClose, ruleSetId }: AddEditorModalProps) => {
  const { friends, isLoading: friendsLoading } = useFriends();
  const { editors, addEditor, removeEditor, isAddingEditor } = useRuleSetEditors(ruleSetId);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

  const editorUserIds = editors.map(e => e.user_id);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Manage Editors
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

          {/* Add from Friends */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Add from Friends</h4>
            {friendsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No friends yet. Add friends to invite them as editors.
              </p>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {friends.map((friendship) => {
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

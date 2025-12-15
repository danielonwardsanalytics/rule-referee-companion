import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  X,
  Edit2,
  Globe,
  Users,
  Copy,
  Trash2,
  UserPlus,
  Calendar,
  Gamepad2,
  Settings,
  Lock,
} from "lucide-react";
import { format } from "date-fns";

interface RuleSetInfoPanelProps {
  ruleSet: {
    id: string;
    name: string;
    is_active: boolean;
    is_public: boolean;
    created_at: string;
    user_id: string;
    games: {
      name: string;
      accent_color: string;
    };
  };
  isOwner: boolean;
  isEditor: boolean;
  isSaved: boolean;
  onUpdateName: (name: string) => void;
  onTogglePublic: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRemove: () => void;
  onAddEditor: () => void;
  ownerName?: string;
}

export const RuleSetInfoPanel = ({
  ruleSet,
  isOwner,
  isEditor,
  isSaved,
  onUpdateName,
  onTogglePublic,
  onDuplicate,
  onDelete,
  onRemove,
  onAddEditor,
  ownerName,
}: RuleSetInfoPanelProps) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(ruleSet.name);

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdateName(editedName.trim());
      setIsEditingName(false);
    }
  };

  const canEdit = isOwner || isEditor;

  return (
    <div className="space-y-3">
      {/* Title Row */}
      <div className="flex items-center gap-2">
        {isEditingName && canEdit ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-3xl font-bold max-w-md"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={handleSaveName}>
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setEditedName(ruleSet.name);
                setIsEditingName(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{ruleSet.name}</h1>
            {canEdit && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditingName(true)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Game Name */}
      <p className="text-muted-foreground flex items-center gap-2">
        <Gamepad2 className="h-4 w-4" />
        {ruleSet.games.name}
      </p>

      {/* Public/Private Status */}
      <p className="text-muted-foreground flex items-center gap-2">
        {ruleSet.is_public ? (
          <>
            <Globe className="h-4 w-4" />
            Public
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Private
          </>
        )}
      </p>

      {/* Date Created */}
      <p className="text-muted-foreground flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Created {format(new Date(ruleSet.created_at), "MMM d, yyyy")}
      </p>

      {/* Owner info if not owner */}
      {!isOwner && ownerName && (
        <p className="text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Owner: {ownerName}
        </p>
      )}

      {/* Editor badge if applicable */}
      {isEditor && !isOwner && (
        <p className="text-muted-foreground flex items-center gap-2">
          <Edit2 className="h-4 w-4" />
          You are an editor
        </p>
      )}

      {/* Saved badge if applicable */}
      {isSaved && !isOwner && !isEditor && (
        <p className="text-muted-foreground flex items-center gap-2">
          <Check className="h-4 w-4" />
          Saved to your rules
        </p>
      )}

      {/* Settings Dropdown */}
      <div className="pt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
              <Settings className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-popover border-[3px] border-white ring-2 ring-primary shadow-lg">
            {/* Owner-only actions */}
            {isOwner && (
              <>
                <DropdownMenuItem onClick={onTogglePublic}>
                  {ruleSet.is_public ? (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Make Public
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddEditor}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Editor
                </DropdownMenuItem>
              </>
            )}

            {/* Available to all with access */}
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Delete/Remove action */}
            {isOwner ? (
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Rule Set
              </DropdownMenuItem>
            ) : (isEditor || isSaved) ? (
              <DropdownMenuItem
                onClick={onRemove}
                className="text-destructive focus:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Remove from My Rules
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <Card className="overflow-hidden">
      <div
        className="h-2"
        style={{ backgroundColor: ruleSet.games.accent_color }}
      />
      <CardContent className="pt-6 space-y-4">
        {/* Title Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {isEditingName && canEdit ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-xl font-bold"
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
                <h1 className="text-2xl font-bold">{ruleSet.name}</h1>
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

          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {ruleSet.is_public && (
              <Badge variant="secondary">
                <Globe className="h-3 w-3 mr-1" />
                Public
              </Badge>
            )}
            {isEditor && !isOwner && (
              <Badge variant="outline">
                <Edit2 className="h-3 w-3 mr-1" />
                Editor
              </Badge>
            )}
            {isSaved && !isOwner && !isEditor && (
              <Badge variant="outline">Saved</Badge>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gamepad2 className="h-4 w-4" />
            <span>{ruleSet.games.name}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Created {format(new Date(ruleSet.created_at), "MMM d, yyyy")}</span>
          </div>
          {!isOwner && ownerName && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <Users className="h-4 w-4" />
              <span>Owner: {ownerName}</span>
            </div>
          )}
        </div>

        {/* Settings Dropdown - Bottom Right */}
        <div className="flex justify-end pt-2 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
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
                  Delete Set
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
      </CardContent>
    </Card>
  );
};

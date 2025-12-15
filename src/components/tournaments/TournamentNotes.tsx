import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, StickyNote } from "lucide-react";
import { useTournamentNotes } from "@/hooks/useTournamentNotes";
import { AddNoteModal } from "./AddNoteModal";
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

interface TournamentNotesProps {
  tournamentId: string;
  isAdmin: boolean;
}

export const TournamentNotes = ({ tournamentId, isAdmin }: TournamentNotesProps) => {
  const { notes, addNote, updateNote, deleteNote, isAdding, isUpdating } = useTournamentNotes(tournamentId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editNote, setEditNote] = useState<{ id: string; title: string; content: string } | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const handleSave = (title: string, content: string) => {
    if (editNote) {
      updateNote({ id: editNote.id, title, content });
    } else {
      addNote({ title, content });
    }
    setIsModalOpen(false);
    setEditNote(null);
  };

  const handleEdit = (note: { id: string; title: string; content: string }) => {
    setEditNote(note);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (deleteNoteId) {
      deleteNote(deleteNoteId);
      setDeleteNoteId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditNote(null);
  };

  return (
    <>
      <Card className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Tournament Notes
          </CardTitle>
          {isAdmin && (
            <Button onClick={() => setIsModalOpen(true)} className="hover-scale">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No notes yet</p>
              {isAdmin && (
                <p className="text-sm mt-1">Add notes to keep track of tournament events and decisions.</p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 bg-secondary/50 rounded-lg border border-border group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-foreground">{note.title}</h4>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleEdit({ id: note.id, title: note.title, content: note.content })}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteNoteId(note.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{note.content}</p>
                  <p className="text-xs text-muted-foreground/70 mt-3">
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddNoteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        isSaving={isAdding || isUpdating}
        editNote={editNote}
      />

      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TournamentNote {
  id: string;
  tournament_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useTournamentNotes = (tournamentId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["tournament-notes", tournamentId],
    queryFn: async () => {
      if (!tournamentId) return [];
      
      const { data, error } = await supabase
        .from("tournament_notes")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TournamentNote[];
    },
    enabled: !!tournamentId && !!user,
  });

  const addNote = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      if (!tournamentId || !user) throw new Error("Missing tournament or user");

      const { data, error } = await supabase
        .from("tournament_notes")
        .insert({
          tournament_id: tournamentId,
          user_id: user.id,
          title,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-notes", tournamentId] });
      toast.success("Note added");
    },
    onError: (error) => {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
      const { data, error } = await supabase
        .from("tournament_notes")
        .update({ title, content })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-notes", tournamentId] });
      toast.success("Note updated");
    },
    onError: (error) => {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("tournament_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournament-notes", tournamentId] });
      toast.success("Note deleted");
    },
    onError: (error) => {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    },
  });

  return {
    notes,
    isLoading,
    addNote: addNote.mutate,
    updateNote: updateNote.mutate,
    deleteNote: deleteNote.mutate,
    isAdding: addNote.isPending,
    isUpdating: updateNote.isPending,
    isDeleting: deleteNote.isPending,
  };
};

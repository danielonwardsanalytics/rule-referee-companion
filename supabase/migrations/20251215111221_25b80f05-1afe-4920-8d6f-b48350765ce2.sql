-- Create tournament_notes table
CREATE TABLE public.tournament_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournament_notes ENABLE ROW LEVEL SECURITY;

-- Tournament admins can manage notes
CREATE POLICY "Tournament admins can manage notes"
  ON public.tournament_notes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE tournaments.id = tournament_notes.tournament_id
      AND tournaments.admin_id = auth.uid()
    )
  );

-- Tournament players can view notes
CREATE POLICY "Tournament players can view notes"
  ON public.tournament_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tournament_players
      WHERE tournament_players.tournament_id = tournament_notes.tournament_id
      AND tournament_players.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_tournament_notes_updated_at
  BEFORE UPDATE ON public.tournament_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
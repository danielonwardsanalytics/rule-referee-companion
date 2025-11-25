-- Fix the tournament_players admin policy to allow INSERT
DROP POLICY IF EXISTS "Tournament admins can manage players" ON public.tournament_players;

-- Recreate with proper WITH CHECK clause for INSERT
CREATE POLICY "Tournament admins can manage players" 
  ON public.tournament_players 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE id = tournament_id AND admin_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE id = tournament_id AND admin_id = auth.uid()
    )
  );
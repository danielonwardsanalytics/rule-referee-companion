-- Drop the recursive SELECT policy
DROP POLICY IF EXISTS "Players in a tournament can view other players" ON public.tournament_players;

-- Simple solution: Only tournament admins can view players
-- This checks tournaments table (no recursion) since we're in Phase 1 with name-only players
CREATE POLICY "Tournament admins can view players" 
  ON public.tournament_players 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE id = tournament_id AND admin_id = auth.uid()
    )
  );
-- Drop the problematic policies
DROP POLICY IF EXISTS "Tournament players can view tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Players can view tournament participants" ON public.tournament_players;

-- Recreate without circular dependency
-- Allow users to view tournaments where they are admin (no recursion)
CREATE POLICY "Users can view their own tournaments" 
  ON public.tournaments 
  FOR SELECT 
  USING (auth.uid() = admin_id);

-- Allow tournament players to view other players in the same tournament
-- This checks the table itself, not tournaments, avoiding recursion
CREATE POLICY "Players in a tournament can view other players" 
  ON public.tournament_players 
  FOR SELECT 
  USING (
    tournament_id IN (
      SELECT tournament_id 
      FROM public.tournament_players 
      WHERE user_id = auth.uid()
    )
  );
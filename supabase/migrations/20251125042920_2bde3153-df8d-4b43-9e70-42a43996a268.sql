-- Add invitation expiry tracking to tournament_players
ALTER TABLE tournament_players
ADD COLUMN IF NOT EXISTS invited_at timestamptz,
ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz;

-- Create function to check and clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_tournament_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete tournament_players with expired invitations (pending_invite status and past expiry)
  DELETE FROM tournament_players
  WHERE status = 'pending_invite'
    AND invite_expires_at IS NOT NULL
    AND invite_expires_at < now();
END;
$$;

-- Create a function to get pending invitations for an email
CREATE OR REPLACE FUNCTION get_pending_invitations_for_email(_email text)
RETURNS TABLE (
  tournament_id uuid,
  tournament_name text,
  game_name text,
  invited_at timestamptz,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    tp.tournament_id,
    t.name as tournament_name,
    g.name as game_name,
    tp.invited_at,
    tp.invite_expires_at as expires_at
  FROM tournament_players tp
  JOIN tournaments t ON t.id = tp.tournament_id
  JOIN games g ON g.id = t.game_id
  WHERE tp.email = _email
    AND tp.status = 'pending_invite'
    AND tp.user_id IS NULL
    AND (tp.invite_expires_at IS NULL OR tp.invite_expires_at > now())
$$;

-- Create function to auto-accept tournament invitations on signup
CREATE OR REPLACE FUNCTION auto_accept_tournament_invitations(_user_id uuid, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all pending tournament invitations for this email
  UPDATE tournament_players
  SET 
    user_id = _user_id,
    status = 'active',
    joined_at = now()
  WHERE email = _email
    AND status = 'pending_invite'
    AND user_id IS NULL
    AND (invite_expires_at IS NULL OR invite_expires_at > now());
END;
$$;

-- Update handle_new_user to auto-accept invitations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, qr_code_data, subscription_status, trial_ends_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    'qr_' || NEW.id,
    'trial',
    now() + interval '5 days'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Auto-accept any pending tournament invitations
  PERFORM auto_accept_tournament_invitations(NEW.id, NEW.email);
  
  RETURN NEW;
END;
$$;
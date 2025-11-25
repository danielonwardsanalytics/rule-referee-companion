-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'tournament_invite', 'game_result', 'friend_request', 'game_request'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tournament_invites BOOLEAN NOT NULL DEFAULT true,
  game_results BOOLEAN NOT NULL DEFAULT true,
  friend_requests BOOLEAN NOT NULL DEFAULT true,
  game_requests BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  _user_id UUID,
  _type TEXT,
  _title TEXT,
  _message TEXT,
  _action_url TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
  prefs RECORD;
BEGIN
  -- Check user preferences
  SELECT * INTO prefs FROM notification_preferences WHERE user_id = _user_id;
  
  -- If no preferences set, assume all enabled
  IF prefs IS NULL THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
    VALUES (_user_id, _type, _title, _message, _action_url, _metadata)
    RETURNING id INTO notification_id;
    RETURN notification_id;
  END IF;
  
  -- Check if this notification type is enabled
  IF (_type = 'tournament_invite' AND prefs.tournament_invites) OR
     (_type = 'game_result' AND prefs.game_results) OR
     (_type = 'friend_request' AND prefs.friend_requests) OR
     (_type = 'game_request' AND prefs.game_requests) THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
    VALUES (_user_id, _type, _title, _message, _action_url, _metadata)
    RETURNING id INTO notification_id;
    RETURN notification_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Trigger to create notification on tournament invite
CREATE OR REPLACE FUNCTION notify_tournament_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tournament_name TEXT;
BEGIN
  IF NEW.status = 'pending_invite' AND NEW.email IS NOT NULL AND NEW.user_id IS NULL THEN
    SELECT name INTO tournament_name FROM tournaments WHERE id = NEW.tournament_id;
    
    -- Note: This will only work once user_id is set (when they accept)
    -- For now, we'll handle email invites via the edge function
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to notify on game result
CREATE OR REPLACE FUNCTION notify_game_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tournament_rec RECORD;
  player_rec RECORD;
  winner_name TEXT;
BEGIN
  -- Get tournament info
  SELECT t.name, t.admin_id, g.name as game_name
  INTO tournament_rec
  FROM tournaments t
  JOIN games g ON g.id = t.game_id
  WHERE t.id = NEW.tournament_id;
  
  -- Get winner name
  SELECT display_name INTO winner_name
  FROM tournament_players
  WHERE id = NEW.winner_id;
  
  -- Notify all players in the tournament
  FOR player_rec IN
    SELECT DISTINCT user_id
    FROM tournament_players
    WHERE tournament_id = NEW.tournament_id
      AND user_id IS NOT NULL
      AND user_id != NEW.recorded_by
  LOOP
    PERFORM create_notification(
      player_rec.user_id,
      'game_result',
      'New Game Result',
      winner_name || ' won in ' || tournament_rec.name,
      '/tournaments/' || NEW.tournament_id,
      jsonb_build_object('tournament_id', NEW.tournament_id, 'winner_id', NEW.winner_id)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_game_result_created
  AFTER INSERT ON game_results
  FOR EACH ROW
  EXECUTE FUNCTION notify_game_result();

-- Trigger to notify on friend request
CREATE OR REPLACE FUNCTION notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name TEXT;
BEGIN
  IF NEW.status = 'pending' AND NEW.recipient_id IS NOT NULL THEN
    SELECT display_name INTO requester_name
    FROM profiles
    WHERE id = NEW.requester_id;
    
    PERFORM create_notification(
      NEW.recipient_id,
      'friend_request',
      'New Friend Request',
      requester_name || ' sent you a friend request',
      '/friends',
      jsonb_build_object('request_id', NEW.id, 'requester_id', NEW.requester_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_friend_request_created
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_friend_request();

-- Trigger to notify on game request
CREATE OR REPLACE FUNCTION notify_game_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name TEXT;
  game_name TEXT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT p.display_name, g.name
    INTO requester_name, game_name
    FROM profiles p, games g
    WHERE p.id = NEW.requester_id AND g.id = NEW.game_id;
    
    PERFORM create_notification(
      NEW.recipient_id,
      'game_request',
      'New Game Request',
      requester_name || ' wants to play ' || game_name,
      '/game-requests',
      jsonb_build_object('request_id', NEW.id, 'game_id', NEW.game_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_game_request_created
  AFTER INSERT ON game_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_game_request();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Update trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
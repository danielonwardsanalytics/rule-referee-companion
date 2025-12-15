-- Add column to track pending editor invitations
ALTER TABLE friend_requests 
ADD COLUMN pending_editor_rule_set_id uuid REFERENCES house_rule_sets(id) ON DELETE SET NULL;

-- Create function to auto-add editor when friend request is accepted
CREATE OR REPLACE FUNCTION public.handle_friend_request_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_profile_id uuid;
  recipient_profile_id uuid;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    requester_profile_id := NEW.requester_id;
    recipient_profile_id := NEW.recipient_id;
    
    -- Create bidirectional friendship
    INSERT INTO friends (user_id, friend_id)
    VALUES (requester_profile_id, recipient_profile_id)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO friends (user_id, friend_id)
    VALUES (recipient_profile_id, requester_profile_id)
    ON CONFLICT DO NOTHING;
    
    -- If there's a pending editor invitation, add them as editor
    IF NEW.pending_editor_rule_set_id IS NOT NULL THEN
      INSERT INTO house_rule_set_editors (rule_set_id, user_id, added_by)
      VALUES (NEW.pending_editor_rule_set_id, recipient_profile_id, requester_profile_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for friend request acceptance
DROP TRIGGER IF EXISTS on_friend_request_accepted ON friend_requests;
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_friend_request_accepted();
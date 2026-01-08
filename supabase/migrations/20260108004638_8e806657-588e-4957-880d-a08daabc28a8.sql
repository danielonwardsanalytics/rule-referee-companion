-- ============================================
-- PUSH NOTIFICATION SYSTEM TABLES
-- ============================================

-- 1. User Push Tokens Table
-- Stores OneSignal player IDs per user/device
CREATE TABLE public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Device identification
  player_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_model TEXT,
  os_version TEXT,
  app_version TEXT,
  
  -- Token lifecycle
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Environment
  environment TEXT DEFAULT 'production' CHECK (environment IN ('production', 'sandbox', 'development')),
  
  -- Constraints
  UNIQUE(user_id, player_id)
);

-- Indexes for user_push_tokens
CREATE INDEX idx_push_tokens_user_id ON public.user_push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON public.user_push_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_push_tokens_platform ON public.user_push_tokens(platform);

-- RLS for user_push_tokens
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push tokens"
ON public.user_push_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
ON public.user_push_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
ON public.user_push_tokens FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
ON public.user_push_tokens FOR DELETE
USING (auth.uid() = user_id);

-- 2. Add new columns to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quiet_hours_start TIME DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS quiet_hours_end TIME DEFAULT '07:00',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS rule_updates BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS vote_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mentions BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS editor_invites BOOLEAN DEFAULT true;

-- 3. Notification Entity Overrides Table
-- Per-ruleset/tournament mute/follow settings
CREATE TABLE public.notification_entity_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('ruleset', 'tournament')),
  entity_id UUID NOT NULL,
  
  muted BOOLEAN DEFAULT false,
  following BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, entity_type, entity_id)
);

CREATE INDEX idx_entity_overrides_user ON public.notification_entity_overrides(user_id);
CREATE INDEX idx_entity_overrides_entity ON public.notification_entity_overrides(entity_type, entity_id);

-- RLS for notification_entity_overrides
ALTER TABLE public.notification_entity_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entity overrides"
ON public.notification_entity_overrides FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entity overrides"
ON public.notification_entity_overrides FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entity overrides"
ON public.notification_entity_overrides FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entity overrides"
ON public.notification_entity_overrides FOR DELETE
USING (auth.uid() = user_id);

-- 4. Push Notification Queue Table
CREATE TABLE public.push_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event classification
  event_type TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Source entity
  entity_type TEXT,
  entity_id UUID,
  actor_user_id UUID,
  
  -- Targeting
  targeting JSONB NOT NULL,
  
  -- Content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Deep link
  deeplink JSONB NOT NULL,
  
  -- Delivery tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'partial', 'failed', 'cancelled')),
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  
  -- Delivery stats
  recipients_total INTEGER DEFAULT 0,
  recipients_sent INTEGER DEFAULT 0,
  recipients_failed INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  onesignal_response JSONB,
  
  -- Idempotency / deduplication
  dedupe_key TEXT,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for push_notification_queue
CREATE UNIQUE INDEX idx_push_queue_dedupe ON public.push_notification_queue(dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX idx_push_queue_status ON public.push_notification_queue(status) WHERE status = 'pending';
CREATE INDEX idx_push_queue_scheduled ON public.push_notification_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_push_queue_entity ON public.push_notification_queue(entity_type, entity_id);
CREATE INDEX idx_push_queue_created ON public.push_notification_queue(created_at DESC);

-- RLS for push_notification_queue (service role only for writes, users can view their targeted notifications)
ALTER TABLE public.push_notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage push queue"
ON public.push_notification_queue FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Push Notification Delivery Table
CREATE TABLE public.push_notification_delivery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.push_notification_queue(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  player_id TEXT NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  skip_reason TEXT,
  onesignal_notification_id TEXT,
  error_code TEXT,
  
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_delivery_queue ON public.push_notification_delivery(queue_id);
CREATE INDEX idx_delivery_user ON public.push_notification_delivery(user_id);

-- RLS for push_notification_delivery
ALTER TABLE public.push_notification_delivery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own delivery logs"
ON public.push_notification_delivery FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage delivery logs"
ON public.push_notification_delivery FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Throttle check function
CREATE OR REPLACE FUNCTION public.check_notification_throttle(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_event_type TEXT,
  p_target_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  throttle_minutes INTEGER := 5;
  recent_count INTEGER;
BEGIN
  CASE p_event_type
    WHEN 'rule_updated' THEN throttle_minutes := 10;
    WHEN 'vote_reminder' THEN throttle_minutes := 60;
    WHEN 'tournament_reminder' THEN throttle_minutes := 30;
    ELSE throttle_minutes := 5;
  END CASE;
  
  SELECT COUNT(*) INTO recent_count
  FROM public.push_notification_queue
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND event_type = p_event_type
    AND targeting->>'user_id' = p_target_user_id::text
    AND created_at > now() - (throttle_minutes || ' minutes')::interval
    AND status IN ('pending', 'processing', 'sent');
  
  RETURN recent_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Updated at trigger for new tables
CREATE TRIGGER update_user_push_tokens_updated_at
BEFORE UPDATE ON public.user_push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entity_overrides_updated_at
BEFORE UPDATE ON public.notification_entity_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_push_queue_updated_at
BEFORE UPDATE ON public.push_notification_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
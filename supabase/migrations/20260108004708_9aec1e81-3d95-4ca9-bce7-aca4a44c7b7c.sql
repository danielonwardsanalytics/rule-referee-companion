-- Fix the overly permissive RLS policies by restricting to service role operations
-- These tables should only be written by edge functions using service role key

DROP POLICY IF EXISTS "Service role can manage push queue" ON public.push_notification_queue;
DROP POLICY IF EXISTS "Service role can manage delivery logs" ON public.push_notification_delivery;

-- For push_notification_queue: No direct user access for writes (edge function uses service role)
-- Users should not be able to read the queue directly either for security
CREATE POLICY "No direct user access to push queue"
ON public.push_notification_queue FOR SELECT
USING (false);

-- For push_notification_delivery: Users can only see their own delivery status
-- Already have this policy, just ensure no write access from users
-- (Service role bypasses RLS entirely, so we don't need a permissive policy)
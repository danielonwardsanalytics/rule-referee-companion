-- Create beta_feedback table
CREATE TABLE public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bugs', 'confusing', 'user_flow', 'design_ui', 'performance', 'feature_request', 'beta_feedback', 'onboarding', 'other')),
  feedback_text TEXT NOT NULL,
  page_url TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'addressed', 'archived')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.beta_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.beta_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.beta_feedback
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all feedback
CREATE POLICY "Admins can update all feedback"
ON public.beta_feedback
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));
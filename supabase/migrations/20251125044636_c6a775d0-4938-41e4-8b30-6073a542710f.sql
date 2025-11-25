-- Create game_suggestions table for users to request new games to be added
CREATE TABLE IF NOT EXISTS public.game_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_name TEXT NOT NULL,
  description TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view their own suggestions
CREATE POLICY "Users can view their own game suggestions"
ON public.game_suggestions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own suggestions
CREATE POLICY "Users can create game suggestions"
ON public.game_suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending suggestions
CREATE POLICY "Users can update their own pending suggestions"
ON public.game_suggestions
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_game_suggestions_updated_at
BEFORE UPDATE ON public.game_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_game_suggestions_user_id ON public.game_suggestions(user_id);
CREATE INDEX idx_game_suggestions_status ON public.game_suggestions(status);
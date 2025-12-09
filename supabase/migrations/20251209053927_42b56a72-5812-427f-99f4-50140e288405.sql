-- Add title column to house_rules table for AI-generated rule titles
ALTER TABLE public.house_rules ADD COLUMN title TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.house_rules.title IS 'AI-generated or user-edited short title for the rule';
-- Create table for rule set editors (collaborators)
CREATE TABLE public.house_rule_set_editors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_set_id UUID NOT NULL REFERENCES public.house_rule_sets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_by UUID NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rule_set_id, user_id)
);

-- Create table for saved rule sets (bookmarked from public)
CREATE TABLE public.saved_house_rule_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  rule_set_id UUID NOT NULL REFERENCES public.house_rule_sets(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, rule_set_id)
);

-- Enable RLS
ALTER TABLE public.house_rule_set_editors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_house_rule_sets ENABLE ROW LEVEL SECURITY;

-- RLS for house_rule_set_editors
CREATE POLICY "Owners can manage editors"
ON public.house_rule_set_editors
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.house_rule_sets
    WHERE id = house_rule_set_editors.rule_set_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Editors can view their editor records"
ON public.house_rule_set_editors
FOR SELECT
USING (user_id = auth.uid());

-- RLS for saved_house_rule_sets
CREATE POLICY "Users can manage their saved rule sets"
ON public.saved_house_rule_sets
FOR ALL
USING (user_id = auth.uid());

-- Update house_rule_sets RLS to allow editors to view
CREATE POLICY "Editors can view rule sets they're invited to"
ON public.house_rule_sets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.house_rule_set_editors
    WHERE rule_set_id = house_rule_sets.id
    AND user_id = auth.uid()
  )
);

-- Update house_rules RLS to allow editors to modify rules
CREATE POLICY "Editors can manage rules in sets they're invited to"
ON public.house_rules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.house_rule_set_editors e
    JOIN public.house_rule_sets s ON s.id = e.rule_set_id
    WHERE s.id = house_rules.rule_set_id
    AND e.user_id = auth.uid()
  )
);
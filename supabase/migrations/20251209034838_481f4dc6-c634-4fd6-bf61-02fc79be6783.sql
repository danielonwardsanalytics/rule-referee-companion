-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Editors can view rule sets they're invited to" ON public.house_rule_sets;
DROP POLICY IF EXISTS "Editors can manage rules in sets they're invited to" ON public.house_rules;

-- Create security definer function to check if user is an editor of a rule set
CREATE OR REPLACE FUNCTION public.is_rule_set_editor(_user_id uuid, _rule_set_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.house_rule_set_editors
    WHERE user_id = _user_id
      AND rule_set_id = _rule_set_id
  )
$$;

-- Recreate policies using the security definer function
CREATE POLICY "Editors can view rule sets they're invited to"
ON public.house_rule_sets
FOR SELECT
USING (public.is_rule_set_editor(auth.uid(), id));

CREATE POLICY "Editors can manage rules in sets they're invited to"
ON public.house_rules
FOR ALL
USING (public.is_rule_set_editor(auth.uid(), rule_set_id));
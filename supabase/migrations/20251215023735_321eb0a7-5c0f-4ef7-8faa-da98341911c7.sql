-- Create a SECURITY DEFINER function for secure email lookups
-- This prevents email enumeration by providing a consistent interface
CREATE OR REPLACE FUNCTION public.lookup_user_by_email(_email text)
RETURNS TABLE(user_id uuid, user_email text, display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return results if the requesting user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT p.id, p.email, p.display_name
  FROM profiles p
  WHERE LOWER(p.email) = LOWER(_email)
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.lookup_user_by_email(text) TO authenticated;
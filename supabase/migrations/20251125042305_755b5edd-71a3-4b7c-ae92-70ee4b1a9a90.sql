-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM ('trial', 'free', 'premium', 'cancelled');

-- Add subscription_status column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'trial';

-- Update existing users to have proper status based on trial_ends_at
UPDATE profiles 
SET subscription_status = CASE 
  WHEN is_premium = true THEN 'premium'::subscription_status
  WHEN trial_ends_at > now() THEN 'trial'::subscription_status
  ELSE 'free'::subscription_status
END;

-- Create function to check if user has premium access (trial or paid)
CREATE OR REPLACE FUNCTION public.has_premium_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND (
        is_premium = true 
        OR (subscription_status = 'trial' AND trial_ends_at > now())
      )
  )
$$;

-- Create function to get user's premium status
CREATE OR REPLACE FUNCTION public.get_premium_status(_user_id uuid)
RETURNS TABLE (
  has_access boolean,
  status subscription_status,
  trial_ends_at timestamptz,
  is_trial boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (is_premium = true OR (subscription_status = 'trial' AND profiles.trial_ends_at > now())) as has_access,
    subscription_status as status,
    profiles.trial_ends_at,
    (subscription_status = 'trial' AND profiles.trial_ends_at > now()) as is_trial
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Update the handle_new_user function to set trial status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, qr_code_data, subscription_status, trial_ends_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    'qr_' || NEW.id,
    'trial',
    now() + interval '5 days'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;
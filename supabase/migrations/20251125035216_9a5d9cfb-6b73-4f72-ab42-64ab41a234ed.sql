-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.tournament_player_status AS ENUM ('active', 'pending_invite', 'inactive');
CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.game_request_status AS ENUM ('pending', 'accepted', 'declined');

-- Profiles table (auto-created on signup)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  qr_code_data TEXT UNIQUE,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Games table
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  accent_color TEXT DEFAULT '#3B82F6',
  rules_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User games (My Games)
CREATE TABLE public.user_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, game_id)
);

-- House rule sets
CREATE TABLE public.house_rule_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  save_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournaments table
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  house_rule_set_id UUID REFERENCES public.house_rule_sets(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament players
CREATE TABLE public.tournament_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  status tournament_player_status DEFAULT 'active',
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  position INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (tournament_id, user_id),
  UNIQUE (tournament_id, email)
);

-- Game results
CREATE TABLE public.game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  winner_id UUID REFERENCES public.tournament_players(id) ON DELETE CASCADE NOT NULL,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual house rules
CREATE TABLE public.house_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_set_id UUID REFERENCES public.house_rule_sets(id) ON DELETE CASCADE NOT NULL,
  rule_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends table
CREATE TABLE public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Friend requests
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT,
  status friend_request_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (recipient_id IS NOT NULL OR recipient_email IS NOT NULL),
  CHECK (requester_id != recipient_id)
);

-- Game requests
CREATE TABLE public.game_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status game_request_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (requester_id != recipient_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_rule_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_requests ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Games are viewable by everyone" ON public.games FOR SELECT USING (true);

CREATE POLICY "Users can view their own games" ON public.user_games FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own games" ON public.user_games FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own games" ON public.user_games FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own games" ON public.user_games FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Tournament admins can manage their tournaments" ON public.tournaments FOR ALL USING (auth.uid() = admin_id);
CREATE POLICY "Tournament players can view tournaments" ON public.tournaments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tournament_players WHERE tournament_id = tournaments.id AND user_id = auth.uid())
);

CREATE POLICY "Tournament admins can manage players" ON public.tournament_players FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id AND admin_id = auth.uid())
);
CREATE POLICY "Players can view tournament participants" ON public.tournament_players FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tournament_players tp WHERE tp.tournament_id = tournament_players.tournament_id AND tp.user_id = auth.uid())
);

CREATE POLICY "Tournament admins can manage results" ON public.game_results FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_id AND admin_id = auth.uid())
);
CREATE POLICY "Players can view game results" ON public.game_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tournament_players WHERE tournament_id = game_results.tournament_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage their own rule sets" ON public.house_rule_sets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public rule sets are viewable by everyone" ON public.house_rule_sets FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage rules in their sets" ON public.house_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.house_rule_sets WHERE id = rule_set_id AND user_id = auth.uid())
);
CREATE POLICY "Public rules are viewable by everyone" ON public.house_rules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.house_rule_sets WHERE id = rule_set_id AND is_public = true)
);

CREATE POLICY "Users can view their own friends" ON public.friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete their own friendships" ON public.friends FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their friend requests" ON public.friend_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can create friend requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Recipients can update friend requests" ON public.friend_requests FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Users can view their game requests" ON public.game_requests FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can create game requests" ON public.game_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Recipients can update game requests" ON public.game_requests FOR UPDATE USING (auth.uid() = recipient_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_house_rule_sets_updated_at BEFORE UPDATE ON public.house_rule_sets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_game_requests_updated_at BEFORE UPDATE ON public.game_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, qr_code_data)
  VALUES (NEW.id, NEW.email, 'qr_' || NEW.id);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed games data
INSERT INTO public.games (name, slug, description, accent_color, image_url) VALUES
  ('UNO', 'uno', 'The classic card game of matching colors and numbers', '#DC2626', '/assets/uno-card.jpg'),
  ('Skip-Bo', 'skipbo', 'Sequential card game with building piles', '#2563EB', '/assets/skipbo-card.jpg'),
  ('Phase 10', 'phase10', 'Complete 10 phases to win', '#16A34A', '/assets/phase10-card.jpg'),
  ('Monopoly Deal', 'monopoly-deal', 'Fast-paced property trading card game', '#059669', '/assets/monopoly-deal-card.jpg'),
  ('Rummy', 'rummy', 'Classic melding card game', '#7C3AED', NULL),
  ('Go Fish', 'go-fish', 'Simple matching card game for all ages', '#0891B2', NULL),
  ('Crazy Eights', 'crazy-eights', 'Match suit or rank to get rid of cards', '#DC2626', NULL),
  ('Poker', 'poker', 'Texas Hold''em and other variants', '#1F2937', NULL),
  ('Hearts', 'hearts', 'Avoid taking hearts and the Queen of Spades', '#EF4444', NULL),
  ('Spades', 'spades', 'Trick-taking game with bidding', '#1F2937', NULL),
  ('Gin Rummy', 'gin-rummy', 'Two-player matching and melding game', '#8B5CF6', NULL),
  ('Solitaire', 'solitaire', 'Classic single-player card game', '#10B981', NULL)
ON CONFLICT (slug) DO NOTHING;
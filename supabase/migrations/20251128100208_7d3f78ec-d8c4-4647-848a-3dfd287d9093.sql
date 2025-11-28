-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'normal');

-- Create dialect enum for common dialects
CREATE TABLE public.dialects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  region VARCHAR(100),
  iso_code VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'normal',
  UNIQUE (user_id, role)
);

-- Create entries table (main dataset)
CREATE TABLE public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  script VARCHAR(50) DEFAULT 'Pashto',
  dialect_id INTEGER REFERENCES public.dialects(id) ON DELETE CASCADE NOT NULL,
  meaning_ur TEXT NOT NULL,
  meaning_en TEXT NOT NULL,
  example_sentence TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audio entries table
CREATE TABLE public.audio_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE NOT NULL,
  audio_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  accent VARCHAR(100),
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create variant links table (dialect mappings)
CREATE TABLE public.variant_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry1_id UUID REFERENCES public.entries(id) ON DELETE CASCADE NOT NULL,
  entry2_id UUID REFERENCES public.entries(id) ON DELETE CASCADE NOT NULL,
  confidence_score FLOAT DEFAULT 0.0,
  votes_up INTEGER DEFAULT 0,
  votes_down INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (entry1_id, entry2_id)
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
  variant_link_id UUID REFERENCES public.variant_links(id) ON DELETE CASCADE,
  vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('correct', 'incorrect')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, entry_id),
  UNIQUE (user_id, variant_link_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for dialects
CREATE POLICY "Anyone can view dialects"
  ON public.dialects FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage dialects"
  ON public.dialects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for entries
CREATE POLICY "Anyone can view entries"
  ON public.entries FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create entries"
  ON public.entries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own entries"
  ON public.entries FOR UPDATE
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own entries"
  ON public.entries FOR DELETE
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audio_entries
CREATE POLICY "Anyone can view audio entries"
  ON public.audio_entries FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create audio entries"
  ON public.audio_entries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own audio entries"
  ON public.audio_entries FOR UPDATE
  USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for variant_links
CREATE POLICY "Anyone can view variant links"
  ON public.variant_links FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create variant links"
  ON public.variant_links FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for votes
CREATE POLICY "Users can view all votes"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own votes"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
  ON public.votes FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert initial dialects
INSERT INTO public.dialects (name, region, iso_code) VALUES
  ('Wazir', 'Waziristan', 'ps'),
  ('Bannuchi', 'Bannu', 'ps'),
  ('Afridi', 'Khyber', 'ps'),
  ('Yusufzai', 'Peshawar', 'ps'),
  ('Khattak', 'Karak', 'ps'),
  ('Marwat', 'Lakki Marwat', 'ps');

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'normal');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update user points
CREATE OR REPLACE FUNCTION public.increment_user_points(user_uuid UUID, points_to_add INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + points_to_add
  WHERE id = user_uuid;
END;
$$;
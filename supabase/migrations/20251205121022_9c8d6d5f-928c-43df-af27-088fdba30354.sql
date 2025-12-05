
-- Create languages table
CREATE TABLE public.languages (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  native_name VARCHAR NOT NULL,
  iso_code VARCHAR,
  region VARCHAR NOT NULL,
  speakers_estimate VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on languages
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view languages" ON public.languages FOR SELECT USING (true);
CREATE POLICY "Admins can manage languages" ON public.languages FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Add language_id to dialects table
ALTER TABLE public.dialects ADD COLUMN language_id INTEGER REFERENCES public.languages(id);

-- Create badges table
CREATE TABLE public.badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon VARCHAR NOT NULL,
  category VARCHAR NOT NULL DEFAULT 'contribution',
  requirement_type VARCHAR NOT NULL,
  requirement_value INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

-- Create user_badges table
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all user badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can create user badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add stats columns to profiles for badge tracking
ALTER TABLE public.profiles ADD COLUMN words_added INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN audio_uploaded INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN votes_cast INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN streak_days INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN last_contribution_date DATE;

-- Insert all Pakistani languages
INSERT INTO public.languages (name, native_name, iso_code, region, speakers_estimate) VALUES
('Pashto', 'پښتو', 'ps', 'KPK/FATA/Balochistan', '40M+'),
('Punjabi', 'پنجابی', 'pa', 'Punjab', '80M+'),
('Sindhi', 'سنڌي', 'sd', 'Sindh', '30M+'),
('Balochi', 'بلوچی', 'bal', 'Balochistan', '10M+'),
('Saraiki', 'سرائیکی', 'skr', 'Southern Punjab', '25M+'),
('Kashmiri', 'کٲشُر', 'ks', 'AJK/Gilgit', '7M+'),
('Hindko', 'ہندکو', 'hnd', 'Hazara/Peshawar', '7M+'),
('Balti', 'བལྟི', 'bft', 'Gilgit-Baltistan', '400K+'),
('Burushaski', 'بروشسکی', 'bsk', 'Hunza/Nagar', '100K+'),
('Wakhi', 'وخی', 'wbl', 'Upper Hunza', '60K+'),
('Shina', 'شینا', 'scl', 'Gilgit', '600K+'),
('Khowar', 'کھوار', 'khw', 'Chitral', '300K+'),
('Urdu', 'اُردُو', 'ur', 'National', '70M+');

-- Update existing Pashto dialects with language_id
UPDATE public.dialects SET language_id = (SELECT id FROM public.languages WHERE name = 'Pashto');

-- Insert dialects for all languages
-- Punjabi dialects
INSERT INTO public.dialects (name, region, iso_code, language_id) VALUES
('Majhi', 'Central Punjab/Lahore', 'pa', (SELECT id FROM public.languages WHERE name = 'Punjabi')),
('Malwi', 'Sahiwal/Okara', 'pa', (SELECT id FROM public.languages WHERE name = 'Punjabi')),
('Doabi', 'Gujranwala/Sialkot', 'pa', (SELECT id FROM public.languages WHERE name = 'Punjabi')),
('Pothwari', 'Rawalpindi/AJK', 'pa', (SELECT id FROM public.languages WHERE name = 'Punjabi')),
('Shahpuri', 'Sargodha/Mianwali', 'pa', (SELECT id FROM public.languages WHERE name = 'Punjabi')),
('Jhangochi', 'Jhang/Chiniot', 'pa', (SELECT id FROM public.languages WHERE name = 'Punjabi'));

-- Sindhi dialects
INSERT INTO public.dialects (name, region, iso_code, language_id) VALUES
('Siriki', 'Upper Sindh', 'sd', (SELECT id FROM public.languages WHERE name = 'Sindhi')),
('Vicholi', 'Central Sindh/Hyderabad', 'sd', (SELECT id FROM public.languages WHERE name = 'Sindhi')),
('Lari', 'Lower Sindh/Karachi', 'sd', (SELECT id FROM public.languages WHERE name = 'Sindhi')),
('Thareli', 'Thar Desert', 'sd', (SELECT id FROM public.languages WHERE name = 'Sindhi')),
('Macharia', 'Coastal Areas', 'sd', (SELECT id FROM public.languages WHERE name = 'Sindhi'));

-- Balochi dialects
INSERT INTO public.dialects (name, region, iso_code, language_id) VALUES
('Makrani', 'Makran Coast', 'bal', (SELECT id FROM public.languages WHERE name = 'Balochi')),
('Rakhshani', 'Quetta/Chagai', 'bal', (SELECT id FROM public.languages WHERE name = 'Balochi')),
('Sulaimani', 'Dera Bugti/Kohlu', 'bal', (SELECT id FROM public.languages WHERE name = 'Balochi')),
('Eastern Hill', 'Marri/Bugti Areas', 'bal', (SELECT id FROM public.languages WHERE name = 'Balochi'));

-- Saraiki dialects
INSERT INTO public.dialects (name, region, iso_code, language_id) VALUES
('Multani', 'Multan', 'skr', (SELECT id FROM public.languages WHERE name = 'Saraiki')),
('Bahawalpuri', 'Bahawalpur', 'skr', (SELECT id FROM public.languages WHERE name = 'Saraiki')),
('Derawali', 'Dera Ghazi Khan', 'skr', (SELECT id FROM public.languages WHERE name = 'Saraiki')),
('Riasti', 'Rahim Yar Khan', 'skr', (SELECT id FROM public.languages WHERE name = 'Saraiki')),
('Thalochi', 'Thal Desert', 'skr', (SELECT id FROM public.languages WHERE name = 'Saraiki'));

-- Kashmiri dialects
INSERT INTO public.dialects (name, region, iso_code, language_id) VALUES
('Kishtwari', 'Kishtwar', 'ks', (SELECT id FROM public.languages WHERE name = 'Kashmiri')),
('Poguli', 'Pogal Valley', 'ks', (SELECT id FROM public.languages WHERE name = 'Kashmiri')),
('Muzaffarabadi', 'Muzaffarabad', 'ks', (SELECT id FROM public.languages WHERE name = 'Kashmiri'));

-- Hindko dialects
INSERT INTO public.dialects (name, region, iso_code, language_id) VALUES
('Peshawari', 'Peshawar', 'hnd', (SELECT id FROM public.languages WHERE name = 'Hindko')),
('Hazarewal', 'Abbottabad/Mansehra', 'hnd', (SELECT id FROM public.languages WHERE name = 'Hindko')),
('Awankari', 'Attock/Mianwali', 'hnd', (SELECT id FROM public.languages WHERE name = 'Hindko')),
('Chibhali', 'Mirpur AJK', 'hnd', (SELECT id FROM public.languages WHERE name = 'Hindko'));

-- Balti dialects
INSERT INTO public.dialects (name, region, iso_code, language_id) VALUES
('Skardu', 'Skardu', 'bft', (SELECT id FROM public.languages WHERE name = 'Balti')),
('Khaplu', 'Khaplu', 'bft', (SELECT id FROM public.languages WHERE name = 'Balti')),
('Shigar', 'Shigar', 'bft', (SELECT id FROM public.languages WHERE name = 'Balti')),
('Rondu', 'Rondu', 'bft', (SELECT id FROM public.languages WHERE name = 'Balti'));

-- Shina dialects
INSERT INTO public.dialects (name, region, iso_code, language_id) VALUES
('Gilgiti', 'Gilgit', 'scl', (SELECT id FROM public.languages WHERE name = 'Shina')),
('Astori', 'Astore', 'scl', (SELECT id FROM public.languages WHERE name = 'Shina')),
('Kohistani Shina', 'Kohistan', 'scl', (SELECT id FROM public.languages WHERE name = 'Shina')),
('Drasi', 'Dras', 'scl', (SELECT id FROM public.languages WHERE name = 'Shina'));

-- Khowar dialects
INSERT INTO public.dialects (name, region, iso_code, language_id) VALUES
('Lower Khowar', 'Lower Chitral', 'khw', (SELECT id FROM public.languages WHERE name = 'Khowar')),
('Upper Khowar', 'Upper Chitral', 'khw', (SELECT id FROM public.languages WHERE name = 'Khowar'));

-- Other minority languages (single dialect initially)
INSERT INTO public.dialects (name, region, iso_code, language_id) VALUES
('Central Burushaski', 'Hunza/Nagar', 'bsk', (SELECT id FROM public.languages WHERE name = 'Burushaski')),
('Gojal Wakhi', 'Gojal/Chipursan', 'wbl', (SELECT id FROM public.languages WHERE name = 'Wakhi')),
('Standard Urdu', 'National', 'ur', (SELECT id FROM public.languages WHERE name = 'Urdu'));

-- Insert badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value, points_reward) VALUES
('First Word', 'Added your first word to the platform', 'BookOpen', 'contribution', 'words_added', 1, 10),
('Voice of Heritage', 'Uploaded your first audio pronunciation', 'Mic', 'contribution', 'audio_uploaded', 1, 15),
('Dialect Keeper', 'Added 10 words to preserve dialects', 'Shield', 'contribution', 'words_added', 10, 50),
('Language Champion', 'Added 50 words - a true champion!', 'Trophy', 'contribution', 'words_added', 50, 200),
('Master Linguist', 'Added 100 words - master level!', 'Crown', 'contribution', 'words_added', 100, 500),
('Audio Pioneer', 'Uploaded 10 audio pronunciations', 'Volume2', 'contribution', 'audio_uploaded', 10, 100),
('Voice Ambassador', 'Uploaded 50 audio recordings', 'Radio', 'contribution', 'audio_uploaded', 50, 300),
('Voting Star', 'Cast 50 votes on dialect mappings', 'Star', 'engagement', 'votes_cast', 50, 50),
('Community Pillar', 'Cast 200 votes to help the community', 'Users', 'engagement', 'votes_cast', 200, 150),
('Week Warrior', 'Maintained a 7-day contribution streak', 'Flame', 'streak', 'streak_days', 7, 100),
('Month Master', 'Maintained a 30-day contribution streak', 'Zap', 'streak', 'streak_days', 30, 500);

-- Create function to handle voting and update counts
CREATE OR REPLACE FUNCTION public.handle_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_vote_type VARCHAR;
BEGIN
  -- Check for existing vote on variant_link
  IF NEW.variant_link_id IS NOT NULL THEN
    SELECT vote_type INTO old_vote_type 
    FROM votes 
    WHERE user_id = NEW.user_id AND variant_link_id = NEW.variant_link_id AND id != NEW.id;
    
    IF old_vote_type IS NOT NULL THEN
      -- Remove old vote count
      IF old_vote_type = 'correct' THEN
        UPDATE variant_links SET votes_up = votes_up - 1 WHERE id = NEW.variant_link_id;
      ELSE
        UPDATE variant_links SET votes_down = votes_down - 1 WHERE id = NEW.variant_link_id;
      END IF;
      -- Delete old vote
      DELETE FROM votes WHERE user_id = NEW.user_id AND variant_link_id = NEW.variant_link_id AND id != NEW.id;
    END IF;
    
    -- Add new vote count
    IF NEW.vote_type = 'correct' THEN
      UPDATE variant_links SET votes_up = votes_up + 1, confidence_score = (votes_up + 1.0) / GREATEST(votes_up + votes_down + 1, 1) WHERE id = NEW.variant_link_id;
    ELSE
      UPDATE variant_links SET votes_down = votes_down + 1, confidence_score = (votes_up * 1.0) / GREATEST(votes_up + votes_down + 1, 1) WHERE id = NEW.variant_link_id;
    END IF;
  END IF;
  
  -- Update user's votes_cast count
  UPDATE profiles SET votes_cast = votes_cast + 1 WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for voting
DROP TRIGGER IF EXISTS on_vote_created ON public.votes;
CREATE TRIGGER on_vote_created
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_vote();

-- Create function to update user stats on word addition
CREATE OR REPLACE FUNCTION public.handle_entry_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles 
  SET 
    words_added = words_added + 1,
    last_contribution_date = CURRENT_DATE,
    streak_days = CASE 
      WHEN last_contribution_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
      WHEN last_contribution_date = CURRENT_DATE THEN streak_days
      ELSE 1
    END
  WHERE id = NEW.created_by;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_entry_created ON public.entries;
CREATE TRIGGER on_entry_created
  AFTER INSERT ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_entry_created();

-- Create function to update user stats on audio upload
CREATE OR REPLACE FUNCTION public.handle_audio_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET audio_uploaded = audio_uploaded + 1 WHERE id = NEW.uploaded_by;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_audio_created ON public.audio_entries;
CREATE TRIGGER on_audio_created
  AFTER INSERT ON public.audio_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audio_created();

-- Create function to check and award badges
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_stats RECORD;
  badge RECORD;
BEGIN
  SELECT words_added, audio_uploaded, votes_cast, streak_days, points INTO user_stats
  FROM profiles WHERE id = p_user_id;
  
  FOR badge IN SELECT * FROM badges LOOP
    -- Check if user already has this badge
    IF NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = badge.id) THEN
      -- Check if user meets requirement
      IF (badge.requirement_type = 'words_added' AND user_stats.words_added >= badge.requirement_value) OR
         (badge.requirement_type = 'audio_uploaded' AND user_stats.audio_uploaded >= badge.requirement_value) OR
         (badge.requirement_type = 'votes_cast' AND user_stats.votes_cast >= badge.requirement_value) OR
         (badge.requirement_type = 'streak_days' AND user_stats.streak_days >= badge.requirement_value) THEN
        -- Award badge
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge.id);
        -- Award bonus points
        UPDATE profiles SET points = points + badge.points_reward WHERE id = p_user_id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

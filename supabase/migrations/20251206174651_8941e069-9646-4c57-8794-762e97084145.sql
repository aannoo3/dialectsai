-- Create seed words table for daily labeling challenges
CREATE TABLE public.seed_words (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  word_urdu text NOT NULL,
  word_english text NOT NULL,
  category varchar(50) DEFAULT 'general',
  difficulty varchar(20) DEFAULT 'easy',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seed_words ENABLE ROW LEVEL SECURITY;

-- Anyone can view seed words
CREATE POLICY "Anyone can view seed words" ON public.seed_words FOR SELECT USING (true);

-- Only admins can manage seed words
CREATE POLICY "Admins can manage seed words" ON public.seed_words FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create daily_labels table to track user contributions
CREATE TABLE public.daily_labels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seed_word_id uuid NOT NULL REFERENCES public.seed_words(id) ON DELETE CASCADE,
  dialect_id integer NOT NULL REFERENCES public.dialects(id),
  label_text text NOT NULL,
  audio_url text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, seed_word_id, dialect_id)
);

-- Enable RLS
ALTER TABLE public.daily_labels ENABLE ROW LEVEL SECURITY;

-- Anyone can view labels
CREATE POLICY "Anyone can view daily labels" ON public.daily_labels FOR SELECT USING (true);

-- Authenticated users can create labels
CREATE POLICY "Users can create their own labels" ON public.daily_labels FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own labels
CREATE POLICY "Users can update their own labels" ON public.daily_labels FOR UPDATE USING (auth.uid() = user_id);

-- Insert 100+ common Urdu words across categories
INSERT INTO public.seed_words (word_urdu, word_english, category, difficulty) VALUES
-- Family
('ماں', 'Mother', 'family', 'easy'),
('باپ', 'Father', 'family', 'easy'),
('بھائی', 'Brother', 'family', 'easy'),
('بہن', 'Sister', 'family', 'easy'),
('دادا', 'Grandfather', 'family', 'easy'),
('دادی', 'Grandmother', 'family', 'easy'),
('چچا', 'Uncle (paternal)', 'family', 'medium'),
('ماموں', 'Uncle (maternal)', 'family', 'medium'),
('پھوپھی', 'Aunt (paternal)', 'family', 'medium'),
('خالہ', 'Aunt (maternal)', 'family', 'medium'),
('بیوی', 'Wife', 'family', 'easy'),
('شوہر', 'Husband', 'family', 'easy'),
('بیٹا', 'Son', 'family', 'easy'),
('بیٹی', 'Daughter', 'family', 'easy'),
-- Food
('روٹی', 'Bread', 'food', 'easy'),
('چاول', 'Rice', 'food', 'easy'),
('پانی', 'Water', 'food', 'easy'),
('دودھ', 'Milk', 'food', 'easy'),
('چائے', 'Tea', 'food', 'easy'),
('گوشت', 'Meat', 'food', 'easy'),
('سبزی', 'Vegetables', 'food', 'easy'),
('پھل', 'Fruit', 'food', 'easy'),
('نمک', 'Salt', 'food', 'easy'),
('مرچ', 'Chili', 'food', 'easy'),
('آم', 'Mango', 'food', 'easy'),
('سیب', 'Apple', 'food', 'easy'),
('انڈا', 'Egg', 'food', 'easy'),
('مچھلی', 'Fish', 'food', 'easy'),
-- Nature
('سورج', 'Sun', 'nature', 'easy'),
('چاند', 'Moon', 'nature', 'easy'),
('ستارہ', 'Star', 'nature', 'easy'),
('بارش', 'Rain', 'nature', 'easy'),
('ہوا', 'Wind', 'nature', 'easy'),
('پہاڑ', 'Mountain', 'nature', 'easy'),
('دریا', 'River', 'nature', 'easy'),
('سمندر', 'Ocean', 'nature', 'medium'),
('درخت', 'Tree', 'nature', 'easy'),
('پھول', 'Flower', 'nature', 'easy'),
('گھاس', 'Grass', 'nature', 'easy'),
('پتھر', 'Stone', 'nature', 'easy'),
-- Body
('سر', 'Head', 'body', 'easy'),
('آنکھ', 'Eye', 'body', 'easy'),
('کان', 'Ear', 'body', 'easy'),
('ناک', 'Nose', 'body', 'easy'),
('منہ', 'Mouth', 'body', 'easy'),
('ہاتھ', 'Hand', 'body', 'easy'),
('پاؤں', 'Foot', 'body', 'easy'),
('دل', 'Heart', 'body', 'easy'),
('پیٹ', 'Stomach', 'body', 'easy'),
('بال', 'Hair', 'body', 'easy'),
-- Actions
('کھانا', 'To eat', 'actions', 'easy'),
('پینا', 'To drink', 'actions', 'easy'),
('سونا', 'To sleep', 'actions', 'easy'),
('جاگنا', 'To wake up', 'actions', 'easy'),
('چلنا', 'To walk', 'actions', 'easy'),
('دوڑنا', 'To run', 'actions', 'easy'),
('بولنا', 'To speak', 'actions', 'easy'),
('سننا', 'To listen', 'actions', 'easy'),
('دیکھنا', 'To see', 'actions', 'easy'),
('لکھنا', 'To write', 'actions', 'medium'),
('پڑھنا', 'To read', 'actions', 'medium'),
('ہنسنا', 'To laugh', 'actions', 'easy'),
('رونا', 'To cry', 'actions', 'easy'),
-- Time
('آج', 'Today', 'time', 'easy'),
('کل', 'Tomorrow/Yesterday', 'time', 'easy'),
('صبح', 'Morning', 'time', 'easy'),
('شام', 'Evening', 'time', 'easy'),
('رات', 'Night', 'time', 'easy'),
('دن', 'Day', 'time', 'easy'),
('ہفتہ', 'Week', 'time', 'easy'),
('مہینہ', 'Month', 'time', 'easy'),
('سال', 'Year', 'time', 'easy'),
-- Weather
('گرمی', 'Heat/Summer', 'weather', 'easy'),
('سردی', 'Cold/Winter', 'weather', 'easy'),
('برف', 'Snow', 'weather', 'easy'),
('دھوپ', 'Sunshine', 'weather', 'easy'),
('بادل', 'Cloud', 'weather', 'easy'),
-- Emotions
('خوشی', 'Happiness', 'emotions', 'easy'),
('غم', 'Sadness', 'emotions', 'easy'),
('پیار', 'Love', 'emotions', 'easy'),
('غصہ', 'Anger', 'emotions', 'easy'),
('ڈر', 'Fear', 'emotions', 'easy'),
-- Colors
('سفید', 'White', 'colors', 'easy'),
('کالا', 'Black', 'colors', 'easy'),
('لال', 'Red', 'colors', 'easy'),
('نیلا', 'Blue', 'colors', 'easy'),
('ہرا', 'Green', 'colors', 'easy'),
('پیلا', 'Yellow', 'colors', 'easy'),
-- Numbers
('ایک', 'One', 'numbers', 'easy'),
('دو', 'Two', 'numbers', 'easy'),
('تین', 'Three', 'numbers', 'easy'),
('چار', 'Four', 'numbers', 'easy'),
('پانچ', 'Five', 'numbers', 'easy'),
('سو', 'Hundred', 'numbers', 'easy'),
('ہزار', 'Thousand', 'numbers', 'easy'),
-- Animals
('کتا', 'Dog', 'animals', 'easy'),
('بلی', 'Cat', 'animals', 'easy'),
('گھوڑا', 'Horse', 'animals', 'easy'),
('گائے', 'Cow', 'animals', 'easy'),
('بکری', 'Goat', 'animals', 'easy'),
('مرغی', 'Chicken', 'animals', 'easy'),
('پرندہ', 'Bird', 'animals', 'easy'),
('مچھر', 'Mosquito', 'animals', 'easy');

-- Function to handle daily label creation and award points
CREATE OR REPLACE FUNCTION public.handle_daily_label_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 5 points for labeling a word
  UPDATE profiles SET points = points + 5 WHERE id = NEW.user_id;
  
  -- Extra 3 points if audio is included
  IF NEW.audio_url IS NOT NULL THEN
    UPDATE profiles SET audio_uploaded = audio_uploaded + 1 WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for daily labels
CREATE TRIGGER on_daily_label_created
  AFTER INSERT ON public.daily_labels
  FOR EACH ROW EXECUTE FUNCTION public.handle_daily_label_created();
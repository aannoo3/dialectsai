-- Create weekly_dialect_stats table to track weekly contributions per dialect
CREATE TABLE public.weekly_dialect_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dialect_id integer NOT NULL REFERENCES public.dialects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  words_added integer DEFAULT 0,
  audio_uploaded integer DEFAULT 0,
  labels_added integer DEFAULT 0,
  points_earned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(dialect_id, user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_dialect_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can view weekly stats
CREATE POLICY "Anyone can view weekly dialect stats"
ON public.weekly_dialect_stats
FOR SELECT
USING (true);

-- System can insert/update stats (via triggers)
CREATE POLICY "Authenticated users can insert their stats"
ON public.weekly_dialect_stats
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
ON public.weekly_dialect_stats
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to get the start of the current week (Monday)
CREATE OR REPLACE FUNCTION public.get_week_start(input_date date DEFAULT CURRENT_DATE)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT date_trunc('week', input_date)::date;
$$;

-- Function to update weekly dialect stats when an entry is created
CREATE OR REPLACE FUNCTION public.update_weekly_stats_on_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_week date;
BEGIN
  current_week := get_week_start(CURRENT_DATE);
  
  INSERT INTO weekly_dialect_stats (dialect_id, user_id, week_start, words_added, points_earned)
  VALUES (NEW.dialect_id, NEW.created_by, current_week, 1, 10)
  ON CONFLICT (dialect_id, user_id, week_start)
  DO UPDATE SET 
    words_added = weekly_dialect_stats.words_added + 1,
    points_earned = weekly_dialect_stats.points_earned + 10,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Function to update weekly stats when audio is uploaded
CREATE OR REPLACE FUNCTION public.update_weekly_stats_on_audio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_week date;
  entry_dialect integer;
BEGIN
  current_week := get_week_start(CURRENT_DATE);
  
  -- Get dialect from the entry
  SELECT dialect_id INTO entry_dialect FROM entries WHERE id = NEW.entry_id;
  
  INSERT INTO weekly_dialect_stats (dialect_id, user_id, week_start, audio_uploaded, points_earned)
  VALUES (entry_dialect, NEW.uploaded_by, current_week, 1, 5)
  ON CONFLICT (dialect_id, user_id, week_start)
  DO UPDATE SET 
    audio_uploaded = weekly_dialect_stats.audio_uploaded + 1,
    points_earned = weekly_dialect_stats.points_earned + 5,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Function to update weekly stats when daily label is created
CREATE OR REPLACE FUNCTION public.update_weekly_stats_on_label()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_week date;
BEGIN
  current_week := get_week_start(CURRENT_DATE);
  
  INSERT INTO weekly_dialect_stats (dialect_id, user_id, week_start, labels_added, points_earned)
  VALUES (NEW.dialect_id, NEW.user_id, current_week, 1, 5)
  ON CONFLICT (dialect_id, user_id, week_start)
  DO UPDATE SET 
    labels_added = weekly_dialect_stats.labels_added + 1,
    points_earned = weekly_dialect_stats.points_earned + 5,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_entry_created_update_weekly_stats
  AFTER INSERT ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_weekly_stats_on_entry();

CREATE TRIGGER on_audio_created_update_weekly_stats
  AFTER INSERT ON public.audio_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_weekly_stats_on_audio();

CREATE TRIGGER on_label_created_update_weekly_stats
  AFTER INSERT ON public.daily_labels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_weekly_stats_on_label();

-- Create index for faster queries
CREATE INDEX idx_weekly_dialect_stats_week ON public.weekly_dialect_stats(week_start DESC);
CREATE INDEX idx_weekly_dialect_stats_dialect ON public.weekly_dialect_stats(dialect_id);
-- Create training_data table for storing audio recordings with manual transcriptions
CREATE TABLE public.training_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language_id INTEGER NOT NULL REFERENCES public.languages(id),
  dialect_id INTEGER NOT NULL REFERENCES public.dialects(id),
  audio_url TEXT NOT NULL,
  transcript TEXT NOT NULL,
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view training data"
ON public.training_data
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own training data"
ON public.training_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training data"
ON public.training_data
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own training data"
ON public.training_data
FOR UPDATE
USING (auth.uid() = user_id);

-- Create training-audio storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-audio', 'training-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for training-audio bucket
CREATE POLICY "Anyone can view training audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'training-audio');

CREATE POLICY "Authenticated users can upload training audio"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'training-audio' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own training audio"
ON storage.objects
FOR DELETE
USING (bucket_id = 'training-audio' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for audio bucket
CREATE POLICY "Anyone can view audio files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio');

CREATE POLICY "Authenticated users can upload audio files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own audio files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audio' AND auth.uid()::text = (storage.foldername(name))[1]);
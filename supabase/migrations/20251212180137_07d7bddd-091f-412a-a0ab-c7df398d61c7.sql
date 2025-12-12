-- Add default language and dialect columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN default_language_id integer REFERENCES public.languages(id),
ADD COLUMN default_dialect_id integer REFERENCES public.dialects(id);
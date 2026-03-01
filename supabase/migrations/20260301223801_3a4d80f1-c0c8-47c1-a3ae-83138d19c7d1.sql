
-- Create secure token storage table
CREATE TABLE public.google_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  connected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tokens"
  ON public.google_calendar_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON public.google_calendar_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
  ON public.google_calendar_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
  ON public.google_calendar_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Migrate existing data
INSERT INTO public.google_calendar_tokens (user_id, access_token, refresh_token, token_expires_at, connected)
SELECT user_id, google_access_token, google_refresh_token, google_token_expires_at, google_calendar_connected
FROM public.profiles
WHERE google_calendar_connected = true;

-- Remove token columns from profiles
ALTER TABLE public.profiles
  DROP COLUMN google_access_token,
  DROP COLUMN google_refresh_token,
  DROP COLUMN google_token_expires_at;

-- Add updated_at trigger
CREATE TRIGGER update_google_calendar_tokens_updated_at
  BEFORE UPDATE ON public.google_calendar_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

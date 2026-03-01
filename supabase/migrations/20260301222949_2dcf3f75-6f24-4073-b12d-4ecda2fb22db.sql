
-- Add Google Calendar OAuth columns to profiles
ALTER TABLE public.profiles
ADD COLUMN google_access_token text,
ADD COLUMN google_refresh_token text,
ADD COLUMN google_token_expires_at timestamp with time zone,
ADD COLUMN google_calendar_connected boolean NOT NULL DEFAULT false;

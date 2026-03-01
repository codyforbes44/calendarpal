
ALTER TABLE public.profiles
ADD COLUMN slack_channel_id text,
ADD COLUMN slack_notifications_enabled boolean NOT NULL DEFAULT false;

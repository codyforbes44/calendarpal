
-- Add notification preferences column to profiles
ALTER TABLE public.profiles
ADD COLUMN notification_preferences JSONB NOT NULL DEFAULT '{"booking_created": true, "booking_cancelled": true, "booking_rescheduled": true, "reminder": true}'::jsonb;

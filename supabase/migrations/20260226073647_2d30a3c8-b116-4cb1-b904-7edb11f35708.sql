
-- Update the default notification_preferences to include email channels
ALTER TABLE public.profiles
ALTER COLUMN notification_preferences
SET DEFAULT '{"booking_created": true, "booking_cancelled": true, "booking_rescheduled": true, "reminder": true, "email_booking_created": true, "email_booking_cancelled": true, "email_booking_rescheduled": true, "email_reminder": true}'::jsonb;

-- Update existing rows that don't have email preferences yet
UPDATE public.profiles
SET notification_preferences = notification_preferences || '{"email_booking_created": true, "email_booking_cancelled": true, "email_booking_rescheduled": true, "email_reminder": true}'::jsonb
WHERE NOT (notification_preferences ? 'email_booking_created');

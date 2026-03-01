
-- Add booking theme and custom branding columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS booking_theme text NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS custom_brand_color text,
  ADD COLUMN IF NOT EXISTS custom_brand_logo text,
  ADD COLUMN IF NOT EXISTS custom_welcome_message text;

-- Add timezone column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';

-- Add timezone to bookings for historical accuracy
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS host_timezone text,
ADD COLUMN IF NOT EXISTS guest_timezone text;
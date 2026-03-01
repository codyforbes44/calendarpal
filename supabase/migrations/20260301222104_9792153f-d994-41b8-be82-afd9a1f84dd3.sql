
-- Add pricing to event_types
ALTER TABLE public.event_types
  ADD COLUMN IF NOT EXISTS price_amount integer,
  ADD COLUMN IF NOT EXISTS price_currency text NOT NULL DEFAULT 'usd';

-- Add payment tracking to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS stripe_payment_id text;

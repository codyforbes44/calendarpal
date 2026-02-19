ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS email_status text DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS last_email_type text;

-- Backfill: mark any booking that already has confirmation_email_sent = true as 'sent'
UPDATE public.bookings
  SET email_status = 'sent'
  WHERE confirmation_email_sent = true;
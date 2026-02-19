ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reminder_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_bookings_reminder_sent ON public.bookings (reminder_sent, scheduled_date, status)
  WHERE reminder_sent = false AND status = 'confirmed';
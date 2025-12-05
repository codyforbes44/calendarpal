-- Add recurring settings to event_types
ALTER TABLE public.event_types 
ADD COLUMN allow_recurring boolean NOT NULL DEFAULT false;

-- Add recurrence fields to bookings
ALTER TABLE public.bookings 
ADD COLUMN recurrence_pattern text,
ADD COLUMN recurrence_count integer,
ADD COLUMN recurrence_end_date date,
ADD COLUMN parent_booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE;

-- Add index for finding recurring booking series
CREATE INDEX idx_bookings_parent_booking_id ON public.bookings(parent_booking_id);

-- Add comment for clarity
COMMENT ON COLUMN public.bookings.recurrence_pattern IS 'weekly, biweekly, or monthly';
COMMENT ON COLUMN public.bookings.parent_booking_id IS 'References the first booking in a recurring series';
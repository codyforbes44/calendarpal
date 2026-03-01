
-- Create email click events table
CREATE TABLE public.email_click_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL, -- 'manage_booking', 'add_to_google', 'add_to_outlook', 'add_to_calendar'
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.email_click_events ENABLE ROW LEVEL SECURITY;

-- Hosts can view click events for their bookings
CREATE POLICY "Hosts can view click events for their bookings"
ON public.email_click_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = email_click_events.booking_id
    AND b.host_user_id = auth.uid()
  )
);

-- Service/edge functions can insert click events
CREATE POLICY "Service can insert click events"
ON public.email_click_events
FOR INSERT
WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_email_click_events_booking_id ON public.email_click_events(booking_id);
CREATE INDEX idx_email_click_events_clicked_at ON public.email_click_events(clicked_at);

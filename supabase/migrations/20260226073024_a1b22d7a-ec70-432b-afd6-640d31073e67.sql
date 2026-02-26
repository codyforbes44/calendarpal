
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'booking_created', 'booking_cancelled', 'booking_rescheduled', 'reminder'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Allow inserts (for triggers and edge functions)
CREATE POLICY "Service can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Index for fast user lookups
CREATE INDEX idx_notifications_user_id ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications (user_id, is_read) WHERE is_read = false;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function to create notification on new booking
CREATE OR REPLACE FUNCTION public.notify_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, booking_id)
    VALUES (
      NEW.host_user_id,
      'booking_created',
      'New Booking',
      'You have a new booking from ' || NEW.guest_name || ' on ' || to_char(NEW.scheduled_date, 'Mon DD, YYYY'),
      NEW.id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, type, title, message, booking_id)
      VALUES (
        NEW.host_user_id,
        'booking_cancelled',
        'Booking Cancelled',
        NEW.guest_name || ' cancelled their booking on ' || to_char(NEW.scheduled_date, 'Mon DD, YYYY'),
        NEW.id
      );
    ELSIF NEW.status = 'rescheduled' THEN
      INSERT INTO public.notifications (user_id, type, title, message, booking_id)
      VALUES (
        NEW.host_user_id,
        'booking_rescheduled',
        'Booking Rescheduled',
        NEW.guest_name || ' rescheduled their booking to ' || to_char(NEW.scheduled_date, 'Mon DD, YYYY'),
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to bookings table
CREATE TRIGGER on_booking_change
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_booking();

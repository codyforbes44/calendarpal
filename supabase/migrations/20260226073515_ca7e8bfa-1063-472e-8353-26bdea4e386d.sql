
-- Update trigger to check notification preferences
CREATE OR REPLACE FUNCTION public.notify_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  prefs JSONB;
  notif_type TEXT;
BEGIN
  -- Get user's notification preferences
  SELECT COALESCE(notification_preferences, '{"booking_created": true, "booking_cancelled": true, "booking_rescheduled": true, "reminder": true}'::jsonb)
  INTO prefs
  FROM public.profiles
  WHERE user_id = NEW.host_user_id;

  IF TG_OP = 'INSERT' THEN
    notif_type := 'booking_created';
    IF COALESCE((prefs->>notif_type)::boolean, true) THEN
      INSERT INTO public.notifications (user_id, type, title, message, booking_id)
      VALUES (
        NEW.host_user_id,
        notif_type,
        'New Booking',
        'You have a new booking from ' || NEW.guest_name || ' on ' || to_char(NEW.scheduled_date, 'Mon DD, YYYY'),
        NEW.id
      );
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'cancelled' THEN
      notif_type := 'booking_cancelled';
      IF COALESCE((prefs->>notif_type)::boolean, true) THEN
        INSERT INTO public.notifications (user_id, type, title, message, booking_id)
        VALUES (
          NEW.host_user_id,
          notif_type,
          'Booking Cancelled',
          NEW.guest_name || ' cancelled their booking on ' || to_char(NEW.scheduled_date, 'Mon DD, YYYY'),
          NEW.id
        );
      END IF;
    ELSIF NEW.status = 'rescheduled' THEN
      notif_type := 'booking_rescheduled';
      IF COALESCE((prefs->>notif_type)::boolean, true) THEN
        INSERT INTO public.notifications (user_id, type, title, message, booking_id)
        VALUES (
          NEW.host_user_id,
          notif_type,
          'Booking Rescheduled',
          NEW.guest_name || ' rescheduled their booking to ' || to_char(NEW.scheduled_date, 'Mon DD, YYYY'),
          NEW.id
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


-- =========================================================================
-- 1. BOOKINGS: remove public read, add secure helper for slot conflicts
-- =========================================================================

DROP POLICY IF EXISTS "Guests can view their booking by cancellation token" ON public.bookings;

-- Secure function: return ONLY busy-window data (no PII) for a given host+date.
-- Used by the public booking page to compute available slots.
CREATE OR REPLACE FUNCTION public.get_booked_slots(p_user_id uuid, p_date date)
RETURNS TABLE(start_time time, end_time time, buffer_before integer, buffer_after integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.start_time, b.end_time,
         COALESCE(et.buffer_before, 0) AS buffer_before,
         COALESCE(et.buffer_after, 0)  AS buffer_after
  FROM public.bookings b
  LEFT JOIN public.event_types et ON et.id = b.event_type_id
  WHERE b.host_user_id = p_user_id
    AND b.scheduled_date = p_date
    AND b.status <> 'cancelled';
$$;

REVOKE ALL ON FUNCTION public.get_booked_slots(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(uuid, date) TO anon, authenticated;

-- =========================================================================
-- 2. PROFILES: restrict public SELECT to safe columns via a view
-- =========================================================================

DROP POLICY IF EXISTS "Public can view profiles by username" ON public.profiles;

-- Re-create owner-only SELECT (idempotent — already exists, just ensure)
-- (the "Users can view their own profile" policy already exists; leave as is)

-- Public view exposing only display-safe columns
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  user_id,
  full_name,
  username,
  avatar_url,
  bio,
  timezone,
  booking_theme,
  custom_brand_color,
  custom_brand_logo,
  custom_welcome_message
FROM public.profiles
WHERE username IS NOT NULL;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- =========================================================================
-- 3. BOOKING_ANSWERS: remove public read
-- =========================================================================

DROP POLICY IF EXISTS "Anyone can view answers by booking" ON public.booking_answers;
-- "Hosts can view answers for their bookings" already exists and is correct.

-- =========================================================================
-- 4. GEO_BLOCK_APPEALS: lock down read + fix self-approve loophole
-- =========================================================================

DROP POLICY IF EXISTS "Users can view their own appeal by email" ON public.geo_block_appeals;
DROP POLICY IF EXISTS "Allow verification token update only" ON public.geo_block_appeals;
-- All appeal read/verify/review traffic goes through edge functions
-- (geo-appeal, admin-appeals) using the service role.

-- =========================================================================
-- 5. NOTIFICATIONS: restrict inserts
-- =========================================================================

DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS, so trigger-driven inserts (notify_on_booking)
-- continue to work without an explicit policy.

-- =========================================================================
-- 6. STORAGE: admin-only writes on hero-images
-- =========================================================================

DROP POLICY IF EXISTS "Admins can manage hero images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update hero images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete hero images" ON storage.objects;

CREATE POLICY "Admins can upload hero images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hero-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update hero images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'hero-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete hero images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'hero-images'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- =========================================================================
-- 7. SECURITY DEFINER functions: revoke public/anon EXECUTE
-- =========================================================================

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.get_popular_times(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_popular_times(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_client_directory(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_client_directory(uuid) TO authenticated;

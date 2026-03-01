
CREATE OR REPLACE FUNCTION public.get_client_directory(p_user_id uuid)
RETURNS TABLE(
  email text,
  name text,
  total_meetings bigint,
  last_meeting date,
  first_meeting date
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    lower(guest_email) AS email,
    max(guest_name) AS name,
    count(*) AS total_meetings,
    max(scheduled_date) AS last_meeting,
    min(scheduled_date) AS first_meeting
  FROM bookings
  WHERE host_user_id = p_user_id
  GROUP BY lower(guest_email)
  ORDER BY max(scheduled_date) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_popular_times(p_user_id uuid)
RETURNS TABLE(
  day_index integer,
  hour_index integer,
  booking_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    CASE extract(isodow FROM scheduled_date)::int
      WHEN 7 THEN 6 ELSE extract(isodow FROM scheduled_date)::int - 1
    END AS day_index,
    extract(hour FROM start_time::time)::int - 8 AS hour_index,
    count(*) AS booking_count
  FROM bookings
  WHERE host_user_id = p_user_id
    AND status = 'confirmed'
    AND extract(hour FROM start_time::time)::int BETWEEN 8 AND 19
  GROUP BY day_index, hour_index;
$$;

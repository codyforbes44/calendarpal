
# Create Database RPC Functions for Client Aggregation and Popular Times

## Problem

Both `Clients.tsx` and `PopularTimesChart.tsx` fetch all bookings client-side and aggregate in JavaScript. With the default 1000-row query limit, users with more than 1000 bookings will get incomplete/incorrect data.

## Solution

Create two PostgreSQL RPC functions that perform the aggregation server-side, then update the frontend to call them via `supabase.rpc()`.

## 1. Database Migration -- Two RPC Functions

### `get_client_directory(p_user_id uuid)`

Returns aggregated client data directly from the database:

```sql
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
```

### `get_popular_times(p_user_id uuid)`

Returns a heatmap grid of booking counts by day-of-week (0=Mon..6=Sun) and hour (8-19):

```sql
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
    extract(hour FROM start_time)::int - 8 AS hour_index,
    count(*) AS booking_count
  FROM bookings
  WHERE host_user_id = p_user_id
    AND status = 'confirmed'
    AND extract(hour FROM start_time)::int BETWEEN 8 AND 19
  GROUP BY day_index, hour_index;
$$;
```

Both use `SECURITY DEFINER` so they bypass RLS but explicitly filter by the passed `user_id`. The frontend will pass `auth.uid()`.

## 2. Update `Clients.tsx`

Replace `useBookings()` + client-side `useMemo` aggregation with a direct `supabase.rpc('get_client_directory', { p_user_id: user.id })` call. The search/sort filtering stays client-side (operating on the already-aggregated, much smaller dataset). Remove the `useBookings` import.

## 3. Update `PopularTimesChart.tsx`

Replace the raw `supabase.from("bookings").select(...)` query with `supabase.rpc('get_popular_times', { p_user_id: user.id })`. Map the flat result rows into the 7x12 grid array. Remove client-side loop aggregation.

## Summary

| Component | Change |
|---|---|
| Database migration | Add `get_client_directory` and `get_popular_times` RPC functions |
| `src/pages/Clients.tsx` | Call RPC instead of fetching all bookings |
| `src/components/dashboard/PopularTimesChart.tsx` | Call RPC instead of fetching all bookings |
| `src/integrations/supabase/types.ts` | Auto-updated (no manual edit) |

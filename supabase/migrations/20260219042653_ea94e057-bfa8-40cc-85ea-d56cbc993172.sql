ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_host_user_id_profiles_fkey
  FOREIGN KEY (host_user_id)
  REFERENCES public.profiles(user_id)
  ON DELETE CASCADE;
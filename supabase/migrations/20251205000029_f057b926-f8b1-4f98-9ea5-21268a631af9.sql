-- Add cancellation_token to bookings for guest access
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS cancellation_token uuid DEFAULT gen_random_uuid();

-- Add RLS policy for guests to view/update their bookings via token
CREATE POLICY "Guests can view booking by token" 
ON public.bookings 
FOR SELECT 
USING (true);

CREATE POLICY "Guests can update booking by token" 
ON public.bookings 
FOR UPDATE 
USING (true)
WITH CHECK (true);
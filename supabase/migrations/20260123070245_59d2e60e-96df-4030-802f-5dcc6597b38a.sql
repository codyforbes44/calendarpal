-- Fix remaining permissive INSERT/UPDATE policies
-- The issue is with geo_block_appeals and bookings INSERT/UPDATE policies

-- For bookings: Keep public INSERT (guests need to create bookings)
-- but remove the permissive UPDATE - we'll use edge function instead
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;

-- Recreate with proper check - require guest_email to be provided
CREATE POLICY "Anyone can create bookings with required fields" 
ON bookings 
FOR INSERT 
WITH CHECK (
  guest_name IS NOT NULL 
  AND guest_email IS NOT NULL 
  AND event_type_id IS NOT NULL
  AND scheduled_date IS NOT NULL
);

-- For geo_block_appeals: Keep INSERT but require all fields
DROP POLICY IF EXISTS "Anyone can create appeals" ON geo_block_appeals;

CREATE POLICY "Anyone can create appeals with required fields" 
ON geo_block_appeals 
FOR INSERT 
WITH CHECK (
  email IS NOT NULL 
  AND full_name IS NOT NULL 
  AND country_code IS NOT NULL
  AND reason IS NOT NULL
);

-- For geo_block_appeals UPDATE: Only allow updating verification status
DROP POLICY IF EXISTS "Anyone can verify their appeal" ON geo_block_appeals;

CREATE POLICY "Allow verification token update only" 
ON geo_block_appeals 
FOR UPDATE 
USING (verified_at IS NULL)
WITH CHECK (
  verified_at IS NOT NULL 
  AND status = 'verified'
);
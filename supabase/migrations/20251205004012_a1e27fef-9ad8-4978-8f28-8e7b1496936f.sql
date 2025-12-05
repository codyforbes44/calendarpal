-- Add buffer time columns to event_types table
ALTER TABLE public.event_types 
ADD COLUMN buffer_before integer NOT NULL DEFAULT 0,
ADD COLUMN buffer_after integer NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.event_types.buffer_before IS 'Buffer time in minutes before the meeting';
COMMENT ON COLUMN public.event_types.buffer_after IS 'Buffer time in minutes after the meeting';
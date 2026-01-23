-- Create table for geo-block appeals
CREATE TABLE public.geo_block_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  country_code text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'email_sent', 'verified', 'approved', 'rejected')),
  verification_token uuid DEFAULT gen_random_uuid(),
  verified_at timestamptz,
  reviewed_at timestamptz,
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.geo_block_appeals ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can create an appeal (since they're blocked)
CREATE POLICY "Anyone can create appeals"
ON public.geo_block_appeals
FOR INSERT
WITH CHECK (true);

-- Policy: Anyone can view their own appeal by email
CREATE POLICY "Anyone can view appeals by verification token"
ON public.geo_block_appeals
FOR SELECT
USING (true);

-- Policy: Anyone can update appeal status via verification token
CREATE POLICY "Anyone can verify their appeal"
ON public.geo_block_appeals
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_geo_block_appeals_updated_at
BEFORE UPDATE ON public.geo_block_appeals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
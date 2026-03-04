
-- Create invitation_codes table
CREATE TABLE public.invitation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  used_by uuid NULL,
  used_at timestamp with time zone NULL,
  expires_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  batch_id uuid NOT NULL DEFAULT gen_random_uuid()
);

-- Enable RLS
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- Admins can view all codes
CREATE POLICY "Admins can view all invitation codes"
ON public.invitation_codes FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert codes
CREATE POLICY "Admins can insert invitation codes"
ON public.invitation_codes FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update codes
CREATE POLICY "Admins can update invitation codes"
ON public.invitation_codes FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete codes
CREATE POLICY "Admins can delete invitation codes"
ON public.invitation_codes FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public can validate a code (anon select for code validation via edge function)
-- We don't need public SELECT since validation goes through edge function with service role

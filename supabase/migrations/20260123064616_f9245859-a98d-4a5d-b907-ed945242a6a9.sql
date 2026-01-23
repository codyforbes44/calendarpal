-- Create table for logging blocked access attempts
CREATE TABLE public.blocked_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  ip_hash text,
  user_agent text,
  path_attempted text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view blocked access logs"
  ON public.blocked_access_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow edge functions to insert logs (service role)
CREATE POLICY "Service role can insert logs"
  ON public.blocked_access_logs
  FOR INSERT
  WITH CHECK (true);

-- Create admin audit log table
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_blocked_access_logs_country ON public.blocked_access_logs(country_code);
CREATE INDEX idx_blocked_access_logs_created ON public.blocked_access_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_admin ON public.admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_created ON public.admin_audit_logs(created_at DESC);
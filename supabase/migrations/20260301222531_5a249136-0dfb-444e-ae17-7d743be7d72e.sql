
-- Create booking_page_views table for anonymous funnel tracking
CREATE TABLE public.booking_page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id uuid NOT NULL,
  event_type_id uuid REFERENCES public.event_types(id) ON DELETE SET NULL,
  viewer_session_id text NOT NULL,
  step text NOT NULL DEFAULT 'page_view',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_page_views ENABLE ROW LEVEL SECURITY;

-- Hosts can view their own page view data
CREATE POLICY "Hosts can view their own page views"
ON public.booking_page_views
FOR SELECT
USING (auth.uid() = host_user_id);

-- Anyone can insert page views (anonymous tracking)
CREATE POLICY "Anyone can insert page views"
ON public.booking_page_views
FOR INSERT
WITH CHECK (true);

-- Index for fast host queries
CREATE INDEX idx_booking_page_views_host ON public.booking_page_views (host_user_id, created_at DESC);
CREATE INDEX idx_booking_page_views_session ON public.booking_page_views (viewer_session_id);

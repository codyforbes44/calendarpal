
-- Create booking_questions table
CREATE TABLE public.booking_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id uuid NOT NULL REFERENCES public.event_types(id) ON DELETE CASCADE,
  label text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  options jsonb DEFAULT '[]'::jsonb,
  is_required boolean NOT NULL DEFAULT false,
  include_other boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create booking_answers table
CREATE TABLE public.booking_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.booking_questions(id) ON DELETE CASCADE,
  answer jsonb NOT NULL DEFAULT '""'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_answers ENABLE ROW LEVEL SECURITY;

-- booking_questions RLS: anyone can read (public booking pages need them)
CREATE POLICY "Anyone can view booking questions"
  ON public.booking_questions FOR SELECT
  USING (true);

-- booking_questions RLS: event owner can manage
CREATE POLICY "Event owners can insert questions"
  ON public.booking_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_types
      WHERE id = event_type_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can update questions"
  ON public.booking_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.event_types
      WHERE id = event_type_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Event owners can delete questions"
  ON public.booking_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.event_types
      WHERE id = event_type_id AND user_id = auth.uid()
    )
  );

-- booking_answers RLS: anyone can insert (guests)
CREATE POLICY "Anyone can insert booking answers"
  ON public.booking_answers FOR INSERT
  WITH CHECK (true);

-- booking_answers RLS: host can view answers for their bookings
CREATE POLICY "Hosts can view answers for their bookings"
  ON public.booking_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id AND host_user_id = auth.uid()
    )
  );

-- Also allow public read for answers (guests viewing confirmation)
CREATE POLICY "Anyone can view answers by booking"
  ON public.booking_answers FOR SELECT
  USING (true);


-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (deal_id, reviewer_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read reviews
CREATE POLICY "Reviews readable by authenticated"
  ON public.reviews FOR SELECT
  USING (true);

-- Deal participants can insert their own review
CREATE POLICY "Participants can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.deals d
      WHERE d.id = reviews.deal_id
        AND d.state = 'completed'
        AND (d.streamer_id = auth.uid() OR EXISTS (
          SELECT 1 FROM public.organization_members om
          WHERE om.organization_id = d.organization_id AND om.user_id = auth.uid()
        ))
    )
  );

-- Add inquiry deal state
INSERT INTO public.deal_states (name, sort_order, description, is_terminal)
VALUES ('inquiry', -1, 'Initial contact request awaiting streamer acceptance', false)
ON CONFLICT DO NOTHING;

-- Add inquiry transitions
INSERT INTO public.deal_state_transitions (from_state, to_state, allowed_roles)
VALUES 
  ('inquiry', 'negotiation', '{streamer}'),
  ('inquiry', 'cancelled', '{casino_manager,streamer,admin}')
ON CONFLICT DO NOTHING;

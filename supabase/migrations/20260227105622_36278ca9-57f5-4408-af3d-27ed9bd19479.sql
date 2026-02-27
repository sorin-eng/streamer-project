
-- Fix: Enable RLS on deal_states and deal_state_transitions
ALTER TABLE public.deal_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_state_transitions ENABLE ROW LEVEL SECURITY;

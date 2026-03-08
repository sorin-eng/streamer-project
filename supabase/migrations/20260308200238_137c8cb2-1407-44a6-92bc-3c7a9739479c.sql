
-- Add platform fee percentage to deals (default 8%)
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS platform_fee_pct numeric NOT NULL DEFAULT 8;

-- Add platform_fee_pct to commissions for tracking actual fee at time of computation
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS platform_fee numeric NOT NULL DEFAULT 0;

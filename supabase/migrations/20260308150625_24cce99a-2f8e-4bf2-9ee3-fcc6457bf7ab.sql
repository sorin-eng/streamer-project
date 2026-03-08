
-- Add platform & social link columns to streamer_profiles
ALTER TABLE public.streamer_profiles
  ADD COLUMN IF NOT EXISTS twitch_url text,
  ADD COLUMN IF NOT EXISTS kick_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS discord_url text,
  ADD COLUMN IF NOT EXISTS wallet_address text,
  ADD COLUMN IF NOT EXISTS preferred_crypto text DEFAULT 'USDT';

-- Create listing pricing type enum
DO $$ BEGIN
  CREATE TYPE public.listing_pricing_type AS ENUM ('fixed_per_stream', 'fixed_package', 'hourly', 'negotiable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create listing status enum
DO $$ BEGIN
  CREATE TYPE public.listing_status AS ENUM ('active', 'paused', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create streamer_listings table
CREATE TABLE IF NOT EXISTS public.streamer_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  pricing_type listing_pricing_type NOT NULL DEFAULT 'negotiable',
  price_amount numeric DEFAULT 0,
  price_currency text NOT NULL DEFAULT 'USDT',
  min_streams integer,
  package_details text,
  platforms text[] NOT NULL DEFAULT '{}',
  status listing_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.streamer_listings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active listings
CREATE POLICY "Anyone can view active listings"
  ON public.streamer_listings FOR SELECT
  USING (status = 'active' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Streamers can insert own listings
CREATE POLICY "Streamers can create own listings"
  ON public.streamer_listings FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'streamer'));

-- Streamers can update own listings
CREATE POLICY "Streamers can update own listings"
  ON public.streamer_listings FOR UPDATE
  USING (user_id = auth.uid());

-- Streamers can delete own listings
CREATE POLICY "Streamers can delete own listings"
  ON public.streamer_listings FOR DELETE
  USING (user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_streamer_listings_updated_at
  BEFORE UPDATE ON public.streamer_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

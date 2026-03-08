
-- Fix: only the realtime line that failed. Skip it since deal_messages is already in publication.
-- Just need to verify the other tables were created. If they were (IF NOT EXISTS), this is a no-op.
-- Actually we need to check if everything was created or rolled back.
SELECT 1;

import type { Tables } from '@/integrations/supabase/types';

// Deals with joined relations
export interface DealWithRelations extends Tables<'deals'> {
  campaigns: { title: string } | null;
  organizations: { name: string } | null;
  profiles: { display_name: string } | null;
}

// Streamer profile with display info
export interface StreamerWithProfile extends Tables<'streamer_profiles'> {
  profiles: { display_name: string; avatar_url: string | null } | null;
  listings?: Tables<'streamer_listings'>[];
}

// Application with joined profiles
export interface ApplicationWithProfile extends Tables<'applications'> {
  profiles: { display_name: string; avatar_url: string | null } | null;
  streamer_profiles: { platforms: string[]; follower_count: number; avg_live_viewers: number } | null;
}

// Deal message with sender profile
export interface DealMessageWithSender extends Tables<'deal_messages'> {
  profiles: { display_name: string } | null;
}

// Commission with deal info
export interface CommissionWithDeal extends Tables<'commissions'> {
  deals: { id: string; campaigns: { title: string } | null } | null;
}

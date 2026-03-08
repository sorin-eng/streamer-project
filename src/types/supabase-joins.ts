import type { Tables } from '@/integrations/supabase/types';

// Deals with joined relations
export interface DealWithRelations extends Tables<'deals'> {
  campaigns: { title: string } | null;
  organizations: { name: string } | null;
  profiles: { display_name: string } | null;
}

// Campaign with org info
export interface CampaignWithOrg extends Tables<'campaigns'> {
  organizations: { name: string; logo_url: string | null } | null;
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

// Profile with user roles
export interface ProfileWithRole extends Tables<'profiles'> {
  user_roles: { role: string }[];
}

// Verification doc with profile
export interface VerificationDocWithProfile extends Tables<'verification_documents'> {
  profiles: { display_name: string } | null;
}

// Audit log with profile
export interface AuditLogWithProfile extends Tables<'audit_log'> {
  profiles: { display_name: string } | null;
}

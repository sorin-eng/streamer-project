export type UserRole = 'casino' | 'streamer' | 'admin';

export type CampaignStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type DealStatus = 'negotiation' | 'contract_pending' | 'active' | 'completed' | 'disputed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'shortlisted' | 'accepted' | 'rejected';
export type DealType = 'revshare' | 'cpa' | 'hybrid' | 'flat_fee';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatarUrl?: string;
  verified: boolean;
  createdAt: string;
}

export interface StreamerProfile {
  userId: string;
  displayName: string;
  platforms: string[];
  followerCount: number;
  avgLiveViewers: number;
  monthlyImpressions: number;
  audienceGeo: string[];
  engagementRate: number;
  nicheType: string;
  pastDeals: number;
  restrictedCountries: string[];
  paymentPreference: string;
  bio: string;
  avatarUrl: string;
  verified: boolean;
}

export interface CasinoProfile {
  userId: string;
  brandName: string;
  licenseJurisdiction: string;
  acceptedCountries: string[];
  affiliateTerms: DealType;
  marketingGuidelines: string;
  restrictedTerritories: string[];
  paymentTerms: string;
  logoUrl: string;
  website: string;
  verified: boolean;
}

export interface Campaign {
  id: string;
  casinoId: string;
  casinoBrand: string;
  title: string;
  description: string;
  budget: number;
  dealType: DealType;
  targetGeo: string[];
  duration: string;
  requirements: string;
  status: CampaignStatus;
  applicationsCount: number;
  createdAt: string;
}

export interface CampaignApplication {
  id: string;
  campaignId: string;
  streamerId: string;
  streamerName: string;
  streamerAvatar: string;
  platforms: string[];
  followers: number;
  avgViewers: number;
  message: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface Deal {
  id: string;
  campaignId: string;
  campaignTitle: string;
  casinoId: string;
  casinoBrand: string;
  streamerId: string;
  streamerName: string;
  dealType: DealType;
  value: number;
  status: DealStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface DealMessage {
  id: string;
  dealId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
}

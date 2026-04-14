import type { AppUser } from '@/contexts/AuthContext';
import type { StreamerWithProfile, CampaignWithOrg, DealWithRelations, DealMessageWithSender, ApplicationWithProfile, ProfileWithRole, VerificationDocWithProfile, AuditLogWithProfile } from '@/types/supabase-joins';
import type { Tables } from '@/integrations/supabase/types';

export interface ReviewStat {
  reviewee_id: string;
  avg_rating: number;
  review_count: number;
}

export interface CasinoDashboardStats {
  activeCampaigns: number;
  activeDeals: number;
  totalSpend: number;
  applicationCount: number;
}

export interface StreamerDashboardStats {
  activeDeals: number;
  totalEarnings: number;
  openCampaigns: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalDeals: number;
  activeDeals: number;
  platformRevenue: number;
  pendingVerifications: number;
}

export type DashboardStats = CasinoDashboardStats | StreamerDashboardStats | AdminDashboardStats | null;

export interface CreateCampaignInput {
  title: string;
  description: string;
  budget: number;
  duration: string;
  target_geo: string[];
  deal_type: 'revshare' | 'cpa' | 'hybrid' | 'flat_fee';
  requirements: string;
}

export interface SubmitApplicationInput {
  campaign_id: string;
  message: string;
}

export interface SendMessageInput {
  dealId: string;
  content: string;
}

export interface CreateDealInput {
  application_id?: string;
  campaign_id: string;
  organization_id: string;
  streamer_id: string;
  deal_type: 'revshare' | 'cpa' | 'hybrid' | 'flat_fee';
  value: number;
}

export type DealState = 'inquiry' | 'negotiation' | 'contract_pending' | 'active' | 'completed' | 'cancelled' | 'disputed';

export interface DealTransitionInput {
  dealId: string;
  to_state: DealState;
  from_state?: string;
  reason?: string;
}

export interface InitiateContactInput {
  streamerId: string;
  message: string;
}

export interface UpdateStreamerProfileInput {
  [key: string]: unknown;
}

export interface UpdateCasinoProgramInput {
  [key: string]: unknown;
}

export interface CreateListingInput {
  title: string;
  description: string;
  pricing_type: string;
  price_amount: number;
  price_currency: string;
  min_streams?: number;
  package_details?: string;
  platforms: string[];
}

export interface UpdateListingInput {
  id: string;
  [key: string]: unknown;
}

export interface UpdateApplicationStatusInput {
  id: string;
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';
}

export interface SignContractInput {
  contractId: string;
}

export interface UpdateVerificationInput {
  id: string;
  status: 'approved' | 'rejected';
}

export interface CreateReviewInput {
  dealId: string;
  revieweeId: string;
  rating: number;
  comment: string;
}

export interface RespondToInquiryInput {
  dealId: string;
  accept: boolean;
}

export interface AppDataService {
  getDashboardStats(user: AppUser | null): Promise<DashboardStats>;
  browseStreamers(): Promise<StreamerWithProfile[]>;
  getStreamerReviewStats(): Promise<ReviewStat[]>;
  getCampaigns(search?: string): Promise<CampaignWithOrg[]>;
  getDeals(user?: AppUser | null): Promise<DealWithRelations[]>;
  getApplications(user?: AppUser | null, campaignId?: string): Promise<ApplicationWithProfile[]>;
  getDealMessages(dealId: string | null): Promise<DealMessageWithSender[]>;
  getStreamerListings(userId?: string): Promise<Tables<'streamer_listings'>[]>;
  getStreamerProfile(userId: string): Promise<unknown>;
  getCasinoProgram(orgId: string): Promise<unknown>;
  getContracts(dealId: string): Promise<Tables<'contracts'>[]>;
  getAllProfiles(): Promise<ProfileWithRole[]>;
  getVerificationDocuments(): Promise<VerificationDocWithProfile[]>;
  getAuditLog(): Promise<AuditLogWithProfile[]>;
  getCommissions(user: AppUser | null): Promise<unknown[]>;
  getReportUploads(user: AppUser | null): Promise<unknown[]>;
  getUnreadDealsCount(user: AppUser): Promise<number>;
  getNotifications(user: AppUser): Promise<Tables<'notifications'>[]>;
  getCampaignSummary(campaignId: string): Promise<Pick<Tables<'campaigns'>, 'id' | 'organization_id' | 'deal_type' | 'budget'>>;

  createCampaign(user: AppUser, values: CreateCampaignInput): Promise<CampaignWithOrg>;
  submitApplication(user: AppUser, values: SubmitApplicationInput): Promise<ApplicationWithProfile>;
  updateApplicationStatus(user: AppUser, values: UpdateApplicationStatusInput): Promise<void>;
  sendDealMessage(user: AppUser, values: SendMessageInput): Promise<{ hasContactInfo: boolean }>;
  createDeal(values: CreateDealInput, user: AppUser): Promise<DealWithRelations>;
  advanceDealState(values: DealTransitionInput, user: AppUser): Promise<DealWithRelations>;
  cancelDeal(values: DealTransitionInput, user: AppUser): Promise<DealWithRelations>;
  disputeDeal(values: DealTransitionInput, user: AppUser): Promise<DealWithRelations>;
  respondToInquiry(user: AppUser, values: RespondToInquiryInput): Promise<void>;
  initiateContact(values: InitiateContactInput, user: AppUser): Promise<DealWithRelations>;
  updateStreamerProfile(user: AppUser, values: UpdateStreamerProfileInput): Promise<void>;
  updateCasinoProgram(user: AppUser, values: UpdateCasinoProgramInput): Promise<void>;
  createListing(user: AppUser, values: CreateListingInput): Promise<Tables<'streamer_listings'>>;
  updateListing(values: UpdateListingInput): Promise<void>;
  deleteListing(id: string): Promise<void>;
  signContract(user: AppUser, values: SignContractInput): Promise<void>;
  markNotificationRead(id: string): Promise<void>;
  updateVerification(user: AppUser, values: UpdateVerificationInput): Promise<void>;
  createReview(user: AppUser, values: CreateReviewInput): Promise<void>;
}

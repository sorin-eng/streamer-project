import type { Tables } from '@/integrations/supabase/types';
import type { StreamerWithProfile, CampaignWithOrg, DealWithRelations, DealMessageWithSender, ApplicationWithProfile, ProfileWithRole, VerificationDocWithProfile, AuditLogWithProfile, CommissionWithDeal } from '@/types/supabase-joins';
import type {
  AppDataService,
  DashboardStats,
  ReviewStat,
  CreateCampaignInput,
  SubmitApplicationInput,
  SendMessageInput,
  CreateDealInput,
  DealTransitionInput,
  DealState,
  InitiateContactInput,
  UpdateStreamerProfileInput,
  UpdateCasinoProgramInput,
  CreateListingInput,
  UpdateListingInput,
  UpdateApplicationStatusInput,
  SignContractInput,
  UpdateVerificationInput,
  CreateReviewInput,
} from '@/core/services/appDataService';
import type { AppUser } from '@/core/domain/types';
import { evaluateCampaignApplicationGeoGate, evaluateInquiryGeoGate } from '@/lib/geoCompliance';
import { parseReportCsv } from '@/lib/reportCsv';

const CONTACT_PATTERNS = [
  /[\w.-]+@[\w.-]+\.\w{2,}/i,
  /\+?\d[\d\s-()]{7,}\d/,
  /discord\.gg\/\S+/i,
  /t\.me\/\S+/i,
  /(?:^|\s)@[\w]{3,}/,
  /(?:whatsapp|telegram|signal|skype)\s*[:\-]?\s*\S+/i,
];

function detectContactInfo(text: string): boolean {
  return CONTACT_PATTERNS.some(pattern => pattern.test(text));
}

let campaignCounter = 3;
let applicationCounter = 2;
let dealCounter = 3;
let messageCounter = 4;
let reportUploadCounter = 1;
let commissionCounter = 1;
let webhookEndpointCounter = 1;
let webhookDeliveryCounter = 1;
let disclaimerCounter = 1;

const mockStreamerProfileByUserId = new Map<string, Record<string, unknown>>();
const mockCasinoProgramByOrgId = new Map<string, Record<string, unknown>>();
const mockReportEventsByDealId = new Map<string, Array<{ event_type: string; event_date: string; amount: number; player_id: string | null }>>();
const mockPasswordsByUserId = new Map<string, string>();

interface MockDisclaimerAcceptance {
  id: string;
  user_id: string;
  disclaimer_type: string;
  disclaimer_version: string;
  created_at: string;
}

const mockListings: Tables<'streamer_listings'>[] = [
  {
    id: 'listing-1',
    user_id: 'streamer-1',
    title: 'Kick slots launch stream',
    description: 'Sponsored 2-hour stream with pinned CTA and post-stream clip package.',
    pricing_type: 'fixed_per_stream',
    price_amount: 1800,
    price_currency: 'USD',
    min_streams: 1,
    package_details: '2-hour live stream + 3 edited clips',
    platforms: ['Kick', 'TikTok'],
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'listing-2',
    user_id: 'streamer-2',
    title: 'High-roller affiliate push',
    description: 'Three sponsored segments with custom promo code placement.',
    pricing_type: 'fixed_package',
    price_amount: 4200,
    price_currency: 'USD',
    min_streams: 3,
    package_details: '3 streams + branded overlay + recap post',
    platforms: ['Twitch', 'YouTube'],
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

let mockContracts: Tables<'contracts'>[] = [
  {
    id: 'contract-1',
    deal_id: 'deal-1',
    title: 'Contract for Spring slots push',
    terms_json: { deal_type: 'hybrid', value: 12000, auto_generated: true },
    status: 'pending_signature',
    signer_casino_id: 'manager-1',
    signer_streamer_id: null,
    signed_at: null,
    pdf_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockProfiles: ProfileWithRole[] = [
  {
    id: 'profile-streamer-1',
    user_id: 'streamer-1',
    display_name: 'LunaSpin',
    avatar_url: null,
    kyc_status: 'unverified',
    notification_preferences: { email: true },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    suspended: false,
    user_roles: [{ role: 'streamer' as any }],
  } as ProfileWithRole,
  {
    id: 'profile-streamer-2',
    user_id: 'streamer-2',
    display_name: 'AceAfterDark',
    avatar_url: null,
    kyc_status: 'verified',
    notification_preferences: { email: true },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    suspended: false,
    user_roles: [{ role: 'streamer' as any }],
  } as ProfileWithRole,
  {
    id: 'profile-manager-1',
    user_id: 'manager-1',
    display_name: 'Mock Casino',
    avatar_url: null,
    kyc_status: 'verified',
    notification_preferences: { email: true },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    suspended: false,
    user_roles: [{ role: 'casino_manager' as any }],
  } as ProfileWithRole,
  {
    id: 'profile-admin-1',
    user_id: 'admin-1',
    display_name: 'Mock Admin',
    avatar_url: null,
    kyc_status: 'verified',
    notification_preferences: { email: true },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    suspended: false,
    user_roles: [{ role: 'admin' as any }],
  } as ProfileWithRole,
];

const mockVerificationDocs: VerificationDocWithProfile[] = [
  {
    id: 'verif-1',
    user_id: 'streamer-1',
    status: 'pending' as any,
    document_type: 'id' as any,
    file_url: 'https://example.com/doc.pdf',
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: { display_name: 'LunaSpin' },
  } as VerificationDocWithProfile,
];

const mockAuditLog: AuditLogWithProfile[] = [];
const mockNotifications: Tables<'notifications'>[] = [];
const mockReportUploads: Tables<'report_uploads'>[] = [];
const mockCommissions: CommissionWithDeal[] = [];
const mockWebhookEndpoints: Tables<'webhook_endpoints'>[] = [];
const mockWebhookDeliveries: Tables<'webhook_deliveries'>[] = [];
const mockDisclaimerAcceptances: MockDisclaimerAcceptance[] = [];

const mockStreamers: StreamerWithProfile[] = [
  {
    id: 'profile-1',
    user_id: 'streamer-1',
    bio: 'Crypto-casino streamer with strong English-speaking EU audience.',
    platforms: ['Kick', 'TikTok'],
    follower_count: 128000,
    avg_live_viewers: 3400,
    engagement_rate: 6.2,
    niche_type: 'Slots',
    audience_geo: ['Germany', 'Romania', 'Canada'],
    verified: 'approved',
    twitch_url: null,
    kick_url: 'locked',
    youtube_url: null,
    twitter_url: 'locked',
    tiktok_url: 'locked',
    instagram_url: null,
    discord_url: 'locked',
    monthly_impressions: 460000,
    past_deals: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    full_name: null,
    dob: null,
    country: null,
    languages: ['English'],
    preferred_deal_types: ['flat_fee', 'hybrid'],
    content_verticals: ['Casino', 'Slots'],
    avg_ccv: 3400,
    promo_style: null,
    manager_name: null,
    manager_email: null,
    manager_phone: null,
    kyc_status: 'approved',
    compliance_notes: null,
    geo_restrictions: ['US'],
    profiles: { display_name: 'LunaSpin', avatar_url: null },
    listings: mockListings.filter((listing) => listing.user_id === 'streamer-1'),
  } as StreamerWithProfile,
  {
    id: 'profile-2',
    user_id: 'streamer-2',
    bio: 'Table games creator, heavier on loyalty and long-session retention.',
    platforms: ['Twitch', 'YouTube'],
    follower_count: 212000,
    avg_live_viewers: 5100,
    engagement_rate: 5.4,
    niche_type: 'Blackjack',
    audience_geo: ['UK', 'Sweden', 'Norway'],
    verified: 'approved',
    twitch_url: 'locked',
    kick_url: null,
    youtube_url: 'locked',
    twitter_url: null,
    tiktok_url: null,
    instagram_url: 'locked',
    discord_url: 'locked',
    monthly_impressions: 820000,
    past_deals: 21,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    full_name: null,
    dob: null,
    country: null,
    languages: ['English', 'Swedish'],
    preferred_deal_types: ['revshare', 'hybrid'],
    content_verticals: ['Casino', 'Table Games'],
    avg_ccv: 5100,
    promo_style: null,
    manager_name: null,
    manager_email: null,
    manager_phone: null,
    kyc_status: 'approved',
    compliance_notes: null,
    geo_restrictions: ['US'],
    profiles: { display_name: 'AceAfterDark', avatar_url: null },
    listings: mockListings.filter((listing) => listing.user_id === 'streamer-2'),
  } as StreamerWithProfile,
];

let mockReviewStats: ReviewStat[] = [
  { reviewee_id: 'streamer-1', avg_rating: 4.8, review_count: 18 },
  { reviewee_id: 'streamer-2', avg_rating: 4.6, review_count: 11 },
];

let mockCampaigns: CampaignWithOrg[] = [
  {
    id: 'campaign-1',
    title: 'Spring slots push',
    description: 'Looking for Kick-first creators for a regulated EU traffic push.',
    budget: 12000,
    duration: '4 weeks',
    target_geo: ['Germany', 'Romania', 'Canada'],
    deal_type: 'hybrid',
    requirements: '18+ audience, English content, at least 2K avg viewers.',
    restricted_countries: ['US'],
    status: 'open',
    organization_id: 'mock-org-1',
    created_by: 'mock-casino-user',
    casino_program_id: null,
    min_avg_viewers: 2000,
    min_followers: 50000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organizations: { name: 'Mock Casino', logo_url: null },
  },
  {
    id: 'campaign-2',
    title: 'Blackjack affiliate sprint',
    description: 'Need long-form table-game coverage with promo code placement.',
    budget: 18000,
    duration: '6 weeks',
    target_geo: ['UK', 'Sweden'],
    deal_type: 'revshare',
    requirements: 'Strong loyalty audience and consistent weekly schedule.',
    restricted_countries: ['US'],
    status: 'in_progress',
    organization_id: 'mock-org-1',
    created_by: 'mock-casino-user',
    casino_program_id: null,
    min_avg_viewers: 3000,
    min_followers: 100000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organizations: { name: 'Mock Casino', logo_url: null },
  },
];

let mockDeals: DealWithRelations[] = [
  {
    id: 'deal-1',
    application_id: 'application-1',
    campaign_id: 'campaign-1',
    organization_id: 'mock-org-1',
    streamer_id: 'streamer-1',
    deal_type: 'hybrid',
    value: 12000,
    state: 'negotiation',
    start_date: null,
    end_date: null,
    platform_fee_pct: 8,
    terms_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    campaigns: { title: 'Spring slots push' },
    organizations: { name: 'Mock Casino' },
    profiles: { display_name: 'LunaSpin' },
  },
  {
    id: 'deal-2',
    application_id: null,
    campaign_id: null,
    organization_id: 'mock-org-1',
    streamer_id: 'streamer-2',
    deal_type: 'flat_fee',
    value: 4200,
    state: 'active',
    start_date: '2026-04-10',
    end_date: '2026-04-24',
    platform_fee_pct: 8,
    terms_version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    campaigns: { title: 'Direct deal' },
    organizations: { name: 'Mock Casino' },
    profiles: { display_name: 'AceAfterDark' },
  },
];

const mockApplications: ApplicationWithProfile[] = [
  {
    id: 'application-1',
    campaign_id: 'campaign-1',
    streamer_id: 'streamer-1',
    status: 'pending',
    message: 'Good fit for EU slots traffic, can start this week.',
    reviewed_at: null,
    reviewed_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: { display_name: 'LunaSpin', avatar_url: null },
    streamer_profiles: { platforms: ['Kick', 'TikTok'], follower_count: 128000, avg_live_viewers: 3400 },
  },
] as ApplicationWithProfile[];

const mockDealMessages: Record<string, DealMessageWithSender[]> = {
  'deal-1': [
    {
      id: 'msg-1',
      deal_id: 'deal-1',
      sender_id: 'mock-casino-user',
      content: 'We want two launch streams and three clips. Sound good?',
      created_at: new Date().toISOString(),
      profiles: { display_name: 'Mock Casino' },
    },
    {
      id: 'msg-2',
      deal_id: 'deal-1',
      sender_id: 'streamer-1',
      content: 'Yep. I can do that, but I want the clip approvals same-day.',
      created_at: new Date().toISOString(),
      profiles: { display_name: 'LunaSpin' },
    },
  ],
  'deal-2': [
    {
      id: 'msg-3',
      deal_id: 'deal-2',
      sender_id: 'streamer-2',
      content: 'First stream is locked for Friday night.',
      created_at: new Date().toISOString(),
      profiles: { display_name: 'AceAfterDark' },
    },
  ],
};

const initialMockState = {
  profiles: structuredClone(mockProfiles),
  listings: structuredClone(mockListings),
  contracts: structuredClone(mockContracts),
  campaigns: structuredClone(mockCampaigns),
  deals: structuredClone(mockDeals),
  applications: structuredClone(mockApplications),
  dealMessages: structuredClone(mockDealMessages),
  verificationDocs: structuredClone(mockVerificationDocs),
  auditLog: structuredClone(mockAuditLog),
  notifications: structuredClone(mockNotifications),
  reportUploads: structuredClone(mockReportUploads),
  commissions: structuredClone(mockCommissions),
  reviewStats: structuredClone(mockReviewStats),
  webhookEndpoints: structuredClone(mockWebhookEndpoints),
  webhookDeliveries: structuredClone(mockWebhookDeliveries),
  disclaimerAcceptances: structuredClone(mockDisclaimerAcceptances),
};

export function resetMockAppData() {
  campaignCounter = 3;
  applicationCounter = 2;
  dealCounter = 3;
  messageCounter = 4;
  reportUploadCounter = 1;
  commissionCounter = 1;
  webhookEndpointCounter = 1;
  webhookDeliveryCounter = 1;
  disclaimerCounter = 1;

  mockStreamerProfileByUserId.clear();
  mockCasinoProgramByOrgId.clear();
  mockReportEventsByDealId.clear();
  mockPasswordsByUserId.clear();

  mockProfiles.splice(0, mockProfiles.length, ...structuredClone(initialMockState.profiles));
  mockListings.splice(0, mockListings.length, ...structuredClone(initialMockState.listings));
  mockContracts = structuredClone(initialMockState.contracts);
  mockCampaigns = structuredClone(initialMockState.campaigns);
  mockDeals = structuredClone(initialMockState.deals);
  mockApplications.splice(0, mockApplications.length, ...structuredClone(initialMockState.applications));
  mockVerificationDocs.splice(0, mockVerificationDocs.length, ...structuredClone(initialMockState.verificationDocs));
  mockAuditLog.splice(0, mockAuditLog.length, ...structuredClone(initialMockState.auditLog));
  mockNotifications.splice(0, mockNotifications.length, ...structuredClone(initialMockState.notifications));
  mockReportUploads.splice(0, mockReportUploads.length, ...structuredClone(initialMockState.reportUploads));
  mockCommissions.splice(0, mockCommissions.length, ...structuredClone(initialMockState.commissions));
  mockReviewStats = structuredClone(initialMockState.reviewStats);
  mockWebhookEndpoints.splice(0, mockWebhookEndpoints.length, ...structuredClone(initialMockState.webhookEndpoints));
  mockWebhookDeliveries.splice(0, mockWebhookDeliveries.length, ...structuredClone(initialMockState.webhookDeliveries));
  mockDisclaimerAcceptances.splice(0, mockDisclaimerAcceptances.length, ...structuredClone(initialMockState.disclaimerAcceptances));

  Object.keys(mockDealMessages).forEach((key) => delete mockDealMessages[key]);
  Object.assign(mockDealMessages, structuredClone(initialMockState.dealMessages));
}

export async function createMockContractDraft(params: { dealId: string; title: string; termsJson: Tables<'contracts'>['terms_json'] }) {
  const contract: Tables<'contracts'> = {
    id: `contract-${mockContracts.length + 1}`,
    deal_id: params.dealId,
    title: params.title,
    terms_json: params.termsJson,
    status: 'pending_signature',
    signer_casino_id: null,
    signer_streamer_id: null,
    signed_at: null,
    pdf_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockContracts = [contract, ...mockContracts.filter((item) => item.deal_id !== params.dealId)];
  const dealIndex = mockDeals.findIndex((deal) => deal.id === params.dealId);
  if (dealIndex >= 0) {
    mockDeals[dealIndex] = {
      ...mockDeals[dealIndex]!,
      state: 'contract_pending',
      updated_at: new Date().toISOString(),
    };
  }
  return contract;
}

function findMockProfile(userId: string) {
  return mockProfiles.find((profile) => profile.user_id === userId || profile.id === userId) || null;
}

function upsertMockAudit(action: string, displayName: string, details: Record<string, unknown> = {}) {
  mockAuditLog.unshift({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    details,
    user_id: null,
    created_at: new Date().toISOString(),
    profiles: { display_name: displayName },
  } as AuditLogWithProfile);
}

export async function getMockProfileNotificationPreferences(userId: string): Promise<Record<string, boolean> | null> {
  const profile = findMockProfile(userId);
  return (profile?.notification_preferences as Record<string, boolean> | null) || { email: true };
}

export async function updateMockProfileNotificationPreferences(userId: string, prefs: Record<string, boolean>): Promise<void> {
  const profile = findMockProfile(userId);
  if (profile) {
    profile.notification_preferences = prefs as any;
    profile.updated_at = new Date().toISOString();
    return;
  }

  mockProfiles.unshift({
    id: `profile-${userId}`,
    user_id: userId,
    display_name: userId,
    avatar_url: null,
    kyc_status: 'unverified',
    notification_preferences: prefs as any,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    suspended: false,
    user_roles: [{ role: 'streamer' }],
  } as ProfileWithRole);
}

export async function changeMockPassword(userId: string, password: string): Promise<void> {
  mockPasswordsByUserId.set(userId, password);
}

export function getMockPasswordForUser(userId: string): string | undefined {
  return mockPasswordsByUserId.get(userId);
}

export async function uploadMockAvatar(userId: string, file: File): Promise<string> {
  const url = `mock://avatars/${userId}/${encodeURIComponent(file.name)}`;
  const profile = findMockProfile(userId);
  if (profile) {
    profile.avatar_url = url;
    profile.updated_at = new Date().toISOString();
  }
  return url;
}

export async function createMockWebhookEndpoint(params: { organizationId: string; url: string; events: string[] }) {
  const endpoint: Tables<'webhook_endpoints'> = {
    id: `webhook-endpoint-${webhookEndpointCounter++}`,
    organization_id: params.organizationId,
    url: params.url,
    events: params.events,
    secret: `whsec_${Math.random().toString(36).slice(2, 14)}`,
    active: true,
    created_at: new Date().toISOString(),
  };

  mockWebhookEndpoints.unshift(endpoint);
  return endpoint;
}

export async function getMockWebhookEndpoints(organizationId: string) {
  return mockWebhookEndpoints.filter((endpoint) => endpoint.organization_id === organizationId);
}

export async function getMockWebhookDeliveries(endpointId: string) {
  return mockWebhookDeliveries.filter((delivery) => delivery.endpoint_id === endpointId);
}

export async function updateMockWebhookEndpointActive(id: string, active: boolean): Promise<void> {
  const index = mockWebhookEndpoints.findIndex((endpoint) => endpoint.id === id);
  if (index === -1) throw new Error('Webhook endpoint not found');
  mockWebhookEndpoints[index] = { ...mockWebhookEndpoints[index], active };
}

export async function deleteMockWebhookEndpoint(id: string): Promise<void> {
  const index = mockWebhookEndpoints.findIndex((endpoint) => endpoint.id === id);
  if (index >= 0) mockWebhookEndpoints.splice(index, 1);

  for (let i = mockWebhookDeliveries.length - 1; i >= 0; i -= 1) {
    if (mockWebhookDeliveries[i]?.endpoint_id === id) mockWebhookDeliveries.splice(i, 1);
  }
}

export async function createMockReportUpload(params: {
  organizationId: string;
  uploadedBy: string;
  dealId: string;
  csvData: string;
  csvFile: File | null;
}) {
  const rows = parseReportCsv(params.csvData);
  mockReportEventsByDealId.set(params.dealId, rows);

  const upload: Tables<'report_uploads'> = {
    id: `report-upload-${reportUploadCounter++}`,
    organization_id: params.organizationId,
    uploaded_by: params.uploadedBy,
    file_name: params.csvFile?.name || `mock-report-${Date.now()}.csv`,
    file_url: params.csvFile ? `mock://reports/${params.organizationId}/${encodeURIComponent(params.csvFile.name)}` : null,
    row_count: rows.length,
    status: 'processed',
    error_message: null,
    created_at: new Date().toISOString(),
  };

  mockReportUploads.unshift(upload);
  upsertMockAudit('report.uploaded', 'Mock Casino', { deal_id: params.dealId, row_count: rows.length });

  return { events_count: rows.length };
}

export async function computeMockCommissions(params: { dealId: string; periodStart?: string; periodEnd?: string }) {
  if (params.periodStart && params.periodEnd && params.periodStart > params.periodEnd) {
    throw new Error('Period start must be on or before period end.');
  }

  const rows = mockReportEventsByDealId.get(params.dealId) || [];
  const filteredRows = rows.filter((row) => {
    if (params.periodStart && row.event_date < params.periodStart) return false;
    if (params.periodEnd && row.event_date > params.periodEnd) return false;
    return true;
  });

  const deal = mockDeals.find((item) => item.id === params.dealId);
  if (!deal) throw new Error('Deal not found');

  const totalAmount = filteredRows.reduce((sum, row) => sum + row.amount, 0);
  const commissionAmount = Number((totalAmount * 0.2).toFixed(2));
  const lastRow = filteredRows[filteredRows.length - 1] || null;
  const commission: CommissionWithDeal = {
    id: `commission-${commissionCounter++}`,
    deal_id: params.dealId,
    streamer_id: deal.streamer_id,
    amount: commissionAmount,
    currency: 'USD',
    conversion_event_id: null,
    period_start: params.periodStart || filteredRows[0]?.event_date || null,
    period_end: params.periodEnd || lastRow?.event_date || null,
    platform_fee: Number((commissionAmount * 0.1).toFixed(2)),
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deals: {
      id: deal.id,
      campaigns: deal.campaigns ? { title: deal.campaigns.title } : null,
    },
  };

  mockCommissions.unshift(commission);
  upsertMockAudit('commission.computed', 'Mock Casino', { deal_id: params.dealId, events_processed: filteredRows.length });

  return {
    commissions: [commission],
    events_processed: filteredRows.length,
  };
}

export async function updateMockProfileKycStatus(userId: string, kycStatus: string): Promise<void> {
  const profile = findMockProfile(userId);
  if (!profile) return;
  profile.kyc_status = kycStatus;
  profile.updated_at = new Date().toISOString();
}

export async function logMockComplianceEvent(params: {
  _event_type: string;
  _entity_type?: string;
  _entity_id?: string;
  _details?: Record<string, unknown>;
  _severity?: string;
}): Promise<void> {
  upsertMockAudit(params._event_type, 'Mock Admin', {
    entity_type: params._entity_type,
    entity_id: params._entity_id,
    severity: params._severity,
    ...(params._details || {}),
  });
}

export async function changeMockRole(userId: string, newRole: string): Promise<void> {
  const profile = findMockProfile(userId);
  if (!profile) throw new Error('Profile not found');
  profile.user_roles = [{ role: newRole }];
  profile.updated_at = new Date().toISOString();
  upsertMockAudit('admin.role_changed', 'Mock Admin', { user_id: userId, role: newRole });
}

export async function toggleMockSuspend(userId: string, suspended: boolean): Promise<void> {
  const profile = findMockProfile(userId);
  if (!profile) throw new Error('Profile not found');
  profile.suspended = suspended;
  profile.updated_at = new Date().toISOString();
  upsertMockAudit('admin.suspension_changed', 'Mock Admin', { user_id: userId, suspended });
}

export async function insertMockDisclaimerAcceptance(params: {
  user_id: string;
  disclaimer_type: string;
  disclaimer_version: string;
}) {
  const record: MockDisclaimerAcceptance = {
    id: `disclaimer-${disclaimerCounter++}`,
    user_id: params.user_id,
    disclaimer_type: params.disclaimer_type,
    disclaimer_version: params.disclaimer_version,
    created_at: new Date().toISOString(),
  };

  mockDisclaimerAcceptances.unshift(record);
  return { data: record, error: null };
}

export async function queryMockDisclaimerAcceptance(userId: string, disclaimerType: string) {
  const record = mockDisclaimerAcceptances.find((item) => item.user_id === userId && item.disclaimer_type === disclaimerType) || null;
  return { data: record, error: null };
}

export async function queryMockDisclaimerAcceptances(userId: string) {
  const data = mockDisclaimerAcceptances.filter((item) => item.user_id === userId);
  return { data, error: null };
}

export async function deleteMockDisclaimerAcceptance(id: string) {
  const index = mockDisclaimerAcceptances.findIndex((item) => item.id === id);
  if (index >= 0) mockDisclaimerAcceptances.splice(index, 1);
  return { error: null };
}

function nextStateIsValid(currentState: string, toState: DealState): boolean {
  const map: Record<string, DealState[]> = {
    inquiry: ['negotiation', 'cancelled'],
    negotiation: ['contract_pending', 'cancelled'],
    contract_pending: ['active', 'cancelled'],
    active: ['completed', 'disputed'],
    completed: [],
    cancelled: [],
    disputed: [],
  };

  return map[currentState]?.includes(toState) ?? false;
}

export const mockAppDataService: AppDataService = {
  async getDashboardStats(user: AppUser | null): Promise<DashboardStats> {
    if (!user) return null;

    if (user.role === 'casino_manager') {
      return {
        activeCampaigns: 3,
        activeDeals: 5,
        totalSpend: 18750,
        applicationCount: 14,
      };
    }

    if (user.role === 'streamer') {
      return {
        activeDeals: 2,
        totalEarnings: 9600,
        openCampaigns: 7,
      };
    }

    return {
      totalUsers: 42,
      totalCampaigns: 9,
      activeCampaigns: 6,
      totalDeals: 27,
      activeDeals: 8,
      platformRevenue: 14280,
      pendingVerifications: 3,
    };
  },

  async browseStreamers(): Promise<StreamerWithProfile[]> {
    return mockStreamers;
  },

  async getStreamerReviewStats(): Promise<ReviewStat[]> {
    return mockReviewStats;
  },

  async getCampaigns(search?: string): Promise<CampaignWithOrg[]> {
    if (!search) return [...mockCampaigns];
    const q = search.toLowerCase();
    return mockCampaigns.filter((campaign) =>
      campaign.title.toLowerCase().includes(q) ||
      (campaign.description || '').toLowerCase().includes(q)
    );
  },

  async getDeals(user?: AppUser | null): Promise<DealWithRelations[]> {
    if (!user || user.role === 'admin') {
      return [...mockDeals];
    }

    if (user.role === 'streamer') {
      return mockDeals.filter((deal) => deal.streamer_id === user.id);
    }

    if (user.role === 'casino_manager') {
      return mockDeals.filter((deal) => deal.organization_id === user.organizationId);
    }

    return [...mockDeals];
  },

  async getApplications(user?: AppUser | null, campaignId?: string): Promise<ApplicationWithProfile[]> {
    let applications = [...mockApplications];

    if (campaignId) {
      applications = applications.filter((application) => application.campaign_id === campaignId);
    }

    if (!user || user.role === 'admin') {
      return applications;
    }

    if (user.role === 'streamer') {
      return applications.filter((application) => application.streamer_id === user.id);
    }

    if (user.role === 'casino_manager') {
      const campaignIds = new Set(
        mockCampaigns
          .filter((campaign) => campaign.organization_id === user.organizationId)
          .map((campaign) => campaign.id)
      );
      return applications.filter((application) => campaignIds.has(application.campaign_id));
    }

    return applications;
  },

  async getDealMessages(dealId: string | null): Promise<DealMessageWithSender[]> {
    if (!dealId) return [];
    return mockDealMessages[dealId] || [];
  },

  async getStreamerListings(userId?: string): Promise<Tables<'streamer_listings'>[]> {
    return userId ? mockListings.filter((listing) => listing.user_id === userId) : [...mockListings];
  },

  async getStreamerProfile(userId: string) {
    const baseProfile = mockStreamers.find((streamer) => streamer.user_id === userId) ?? null;
    const overrides = mockStreamerProfileByUserId.get(userId) || null;

    if (!baseProfile && !overrides) return null;
    return {
      user_id: userId,
      ...(baseProfile || {}),
      ...(overrides || {}),
    };
  },

  async getCasinoProgram(orgId: string) {
    return mockCasinoProgramByOrgId.get(orgId) ?? { organization_id: orgId };
  },

  async getContracts(dealId: string): Promise<Tables<'contracts'>[]> {
    return mockContracts.filter((contract) => contract.deal_id === dealId);
  },

  async getAllProfiles(): Promise<ProfileWithRole[]> {
    return [...mockProfiles];
  },

  async getVerificationDocuments(): Promise<VerificationDocWithProfile[]> {
    return [...mockVerificationDocs];
  },

  async getAuditLog(): Promise<AuditLogWithProfile[]> {
    return [...mockAuditLog];
  },

  async getCommissions(user): Promise<unknown[]> {
    if (!user) return [...mockCommissions];
    if (user.role === 'streamer') {
      return mockCommissions.filter((commission) => commission.streamer_id === user.id);
    }
    if (user.role === 'casino_manager') {
      const orgDealIds = new Set(
        mockDeals
          .filter((deal) => deal.organization_id === user.organizationId)
          .map((deal) => deal.id),
      );
      return mockCommissions.filter((commission) => orgDealIds.has(commission.deal_id));
    }

    return [...mockCommissions];
  },

  async getReportUploads(user): Promise<unknown[]> {
    if (!user) return [...mockReportUploads];
    if (user.role === 'casino_manager') {
      return mockReportUploads.filter((upload) => upload.organization_id === user.organizationId);
    }

    return [...mockReportUploads];
  },

  async getUnreadDealsCount(user: AppUser): Promise<number> {
    return mockDeals.filter((deal) => {
      const isMine = user.role === 'streamer' ? deal.streamer_id === user.id : deal.organization_id === user.organizationId;
      if (!isMine) return false;
      const last = mockDealMessages[deal.id]?.[mockDealMessages[deal.id].length - 1];
      return !!last && last.sender_id !== user.id;
    }).length;
  },

  async getNotifications(): Promise<Tables<'notifications'>[]> {
    return mockNotifications.filter((notification) => !notification.read);
  },

  async getCampaignSummary(campaignId: string) {
    const campaign = mockCampaigns.find((item) => item.id === campaignId);
    if (!campaign) throw new Error('Campaign not found');
    return {
      id: campaign.id,
      organization_id: campaign.organization_id,
      deal_type: campaign.deal_type,
      budget: campaign.budget,
    };
  },

  async createCampaign(user, values: CreateCampaignInput): Promise<CampaignWithOrg> {
    const newCampaign: CampaignWithOrg = {
      id: `campaign-${campaignCounter++}`,
      title: values.title,
      description: values.description,
      budget: values.budget,
      duration: values.duration,
      target_geo: values.target_geo,
      deal_type: values.deal_type,
      requirements: values.requirements,
      restricted_countries: ['US'],
      status: 'open',
      organization_id: user.organizationId || 'mock-org-1',
      created_by: user.id,
      casino_program_id: null,
      min_avg_viewers: null,
      min_followers: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organizations: { name: 'Mock Casino', logo_url: null },
    };

    mockCampaigns = [newCampaign, ...mockCampaigns];
    return newCampaign;
  },

  async submitApplication(user, values: SubmitApplicationInput): Promise<ApplicationWithProfile> {
    const streamerProfile = await this.getStreamerProfile(user.id) as {
      audience_geo?: string[];
      restricted_countries?: string[];
    } | null;
    const campaign = mockCampaigns.find((item) => item.id === values.campaign_id) || null;
    const geoGate = evaluateCampaignApplicationGeoGate(streamerProfile, campaign);

    if (!geoGate.allowed) {
      throw new Error(geoGate.blockers[0] || 'Application blocked by geo rules.');
    }

    const newApplication: ApplicationWithProfile = {
      id: `application-${applicationCounter++}`,
      campaign_id: values.campaign_id,
      streamer_id: user.id,
      status: 'pending',
      message: values.message,
      reviewed_at: null,
      reviewed_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: { display_name: user.displayName, avatar_url: null },
      streamer_profiles: {
        platforms: ['Kick'],
        follower_count: 0,
        avg_live_viewers: 0,
      },
    };

    mockApplications.push(newApplication);
    return newApplication;
  },

  async updateApplicationStatus(user, values: UpdateApplicationStatusInput) {
    const index = mockApplications.findIndex((application) => application.id === values.id);
    if (index === -1) throw new Error('Application not found');
    mockApplications[index] = {
      ...mockApplications[index],
      status: values.status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async sendDealMessage(user, values: SendMessageInput): Promise<{ hasContactInfo: boolean }> {
    const hasContactInfo = detectContactInfo(values.content);
    const messages = mockDealMessages[values.dealId] || [];
    const newMessage: DealMessageWithSender = {
      id: `msg-${messageCounter++}`,
      deal_id: values.dealId,
      sender_id: user.id,
      content: values.content,
      created_at: new Date().toISOString(),
      profiles: { display_name: user.displayName },
    };

    mockDealMessages[values.dealId] = [...messages, newMessage];
    return { hasContactInfo };
  },

  async initiateContact(values: InitiateContactInput, user: AppUser): Promise<DealWithRelations> {
    const streamer = mockStreamers.find((item) => item.user_id === values.streamerId);
    const program = user.organizationId
      ? await this.getCasinoProgram(user.organizationId) as {
          accepted_countries?: string[];
          restricted_territories?: string[];
          license_jurisdiction?: string | null;
        } | null
      : null;
    const geoGate = evaluateInquiryGeoGate(streamer, program);

    if (!geoGate.allowed) {
      throw new Error(geoGate.blockers[0] || 'Inquiry blocked by geo rules.');
    }

    const newDeal: DealWithRelations = {
      id: `deal-${dealCounter++}`,
      application_id: null,
      campaign_id: null,
      organization_id: user.organizationId || 'mock-org-1',
      streamer_id: values.streamerId,
      deal_type: 'flat_fee',
      value: 0,
      state: 'inquiry',
      start_date: null,
      end_date: null,
      platform_fee_pct: 8,
      terms_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      campaigns: { title: 'Direct Deal' },
      organizations: { name: user.organizationId ? 'Mock Casino' : 'Unknown Org' },
      profiles: { display_name: streamer?.profiles?.display_name || 'Streamer' },
    };

    mockDeals = [newDeal, ...mockDeals];

    const newMessage: DealMessageWithSender = {
      id: `msg-${messageCounter++}`,
      deal_id: newDeal.id,
      sender_id: user.id,
      content: values.message,
      created_at: new Date().toISOString(),
      profiles: { display_name: user.displayName },
    };

    mockDealMessages[newDeal.id] = [newMessage];

    return newDeal;
  },

  async createDeal(values: CreateDealInput, _user: AppUser): Promise<DealWithRelations> {
    const campaign = mockCampaigns.find((item) => item.id === values.campaign_id);
    const streamer = mockStreamers.find((item) => item.user_id === values.streamer_id);
    const isRenewal = values.application_id?.startsWith('renewal:');
    const campaignTitle = campaign?.title || (isRenewal ? 'Repeat Deal' : values.campaign_id.slice(0, 8));
    const newDeal: DealWithRelations = {
      id: `deal-${dealCounter++}`,
      application_id: values.application_id || null,
      campaign_id: values.campaign_id,
      organization_id: values.organization_id,
      streamer_id: values.streamer_id,
      deal_type: values.deal_type,
      value: values.value,
      state: 'negotiation',
      start_date: null,
      end_date: null,
      platform_fee_pct: 8,
      terms_version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      campaigns: { title: campaignTitle },
      organizations: { name: 'Mock Casino' },
      profiles: { display_name: streamer?.profiles?.display_name || 'Streamer' },
    };

    mockDeals = [newDeal, ...mockDeals];
    return newDeal;
  },

  async advanceDealState(input: DealTransitionInput, _user: AppUser): Promise<DealWithRelations> {
    const toState = input.to_state as DealState;
    const index = mockDeals.findIndex((deal) => deal.id === input.dealId);
    if (index === -1) throw new Error('Deal not found');

    const currentState = mockDeals[index]?.state;
    if (!nextStateIsValid(currentState, toState)) {
      throw new Error('Transition not allowed');
    }

    const next: DealWithRelations = {
      ...mockDeals[index]!,
      state: toState,
      updated_at: new Date().toISOString(),
    };

    mockDeals[index] = next;
    return next;
  },

  async cancelDeal(input: DealTransitionInput, _user: AppUser): Promise<DealWithRelations> {
    if (!input.reason?.trim()) {
      throw new Error('Cancellation reason required');
    }

    return this.advanceDealState({
      ...input,
      reason: input.reason.trim(),
      to_state: 'cancelled',
    });
  },

  async disputeDeal(input: DealTransitionInput, _user: AppUser): Promise<DealWithRelations> {
    return this.advanceDealState({
      ...input,
      to_state: 'disputed',
    });
  },

  async respondToInquiry(user, values) {
    const currentDeal = mockDeals.find((deal) => deal.id === values.dealId);
    if (!currentDeal) throw new Error('Deal not found');

    await this.advanceDealState({
      dealId: values.dealId,
      from_state: currentDeal.state,
      to_state: values.accept ? 'negotiation' : 'cancelled',
      reason: values.accept ? 'Streamer accepted inquiry' : 'Streamer declined inquiry',
    }, user);
  },

  async updateStreamerProfile(user, values: UpdateStreamerProfileInput) {
    mockStreamerProfileByUserId.set(user.id, { ...(mockStreamerProfileByUserId.get(user.id) || {}), ...values });
  },

  async updateCasinoProgram(user, values: UpdateCasinoProgramInput) {
    const orgId = user.organizationId || 'mock-org-1';
    mockCasinoProgramByOrgId.set(orgId, { ...(mockCasinoProgramByOrgId.get(orgId) || {}), ...values });
  },

  async createListing(user, values: CreateListingInput) {
    const listing: Tables<'streamer_listings'> = {
      id: `listing-${Date.now()}`,
      user_id: user.id,
      title: values.title,
      description: values.description,
      pricing_type: values.pricing_type as Tables<'streamer_listings'>['pricing_type'],
      price_amount: values.price_amount,
      price_currency: values.price_currency,
      min_streams: values.min_streams ?? null,
      package_details: values.package_details ?? null,
      platforms: values.platforms,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockListings.unshift(listing);
    return listing;
  },

  async updateListing(values: UpdateListingInput) {
    const index = mockListings.findIndex((listing) => listing.id === values.id);
    if (index === -1) throw new Error('Listing not found');
    mockListings[index] = {
      ...mockListings[index],
      ...values,
      id: mockListings[index]!.id,
      updated_at: new Date().toISOString(),
    } as Tables<'streamer_listings'>;
  },

  async deleteListing(id: string) {
    const index = mockListings.findIndex((listing) => listing.id === id);
    if (index === -1) throw new Error('Listing not found');
    mockListings.splice(index, 1);
  },

  async signContract(user, values: SignContractInput) {
    const index = mockContracts.findIndex((contract) => contract.id === values.contractId);
    if (index === -1) throw new Error('Contract not found');

    const contract = mockContracts[index]!;
    const signField = user.role === 'streamer' ? 'signer_streamer_id' : 'signer_casino_id';
    const otherField = user.role === 'streamer' ? 'signer_casino_id' : 'signer_streamer_id';
    const otherSigned = !!contract[otherField];
    const signedAt = otherSigned ? new Date().toISOString() : contract.signed_at;

    mockContracts[index] = {
      ...contract,
      [signField]: user.id,
      status: otherSigned ? 'signed' : 'pending_signature',
      signed_at: signedAt,
      updated_at: new Date().toISOString(),
    };

    if (otherSigned) {
      const dealIndex = mockDeals.findIndex((deal) => deal.id === contract.deal_id);
      if (dealIndex >= 0) {
        const currentState = mockDeals[dealIndex]!.state;
        if (currentState !== 'active' && currentState !== 'completed' && currentState !== 'cancelled' && currentState !== 'disputed') {
          mockDeals[dealIndex] = {
            ...mockDeals[dealIndex]!,
            state: 'active',
            updated_at: signedAt || new Date().toISOString(),
          };
        }
      }
    }
  },

  async markNotificationRead(id: string) {
    const index = mockNotifications.findIndex((item) => item.id === id);
    if (index >= 0) mockNotifications[index] = { ...mockNotifications[index], read: true };
  },

  async updateVerification(user, values: UpdateVerificationInput) {
    const index = mockVerificationDocs.findIndex((item) => item.id === values.id);
    if (index === -1) throw new Error('Verification document not found');
    mockVerificationDocs[index] = {
      ...mockVerificationDocs[index],
      status: values.status as any,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  async createReview(_user, values: CreateReviewInput) {
    const existing = mockReviewStats.find((item) => item.reviewee_id === values.revieweeId);
    if (!existing) {
      mockReviewStats = [{
        reviewee_id: values.revieweeId,
        avg_rating: values.rating,
        review_count: 1,
      }, ...mockReviewStats];
      return;
    }

    const nextCount = existing.review_count + 1;
    const nextAverage = ((existing.avg_rating * existing.review_count) + values.rating) / nextCount;
    mockReviewStats = mockReviewStats.map((item) => item.reviewee_id === values.revieweeId
      ? { ...item, review_count: nextCount, avg_rating: nextAverage }
      : item);
  },
};

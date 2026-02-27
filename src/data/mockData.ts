import { Campaign, CampaignApplication, Deal, DealMessage, StreamerProfile, CasinoProfile, AuditLogEntry, User } from '@/types';

export const mockUsers: User[] = [
  { id: 'casino-1', email: 'marketing@betroyal.com', role: 'casino', displayName: 'BetRoyal Casino', verified: true, createdAt: '2025-08-15' },
  { id: 'casino-2', email: 'partners@luckystar.io', role: 'casino', displayName: 'LuckyStar Gaming', verified: true, createdAt: '2025-09-01' },
  { id: 'streamer-1', email: 'ace@slots.tv', role: 'streamer', displayName: 'AceSlots', verified: true, createdAt: '2025-07-20' },
  { id: 'streamer-2', email: 'luna@stream.gg', role: 'streamer', displayName: 'LunaSpins', verified: true, createdAt: '2025-10-05' },
  { id: 'streamer-3', email: 'max@gaming.live', role: 'streamer', displayName: 'MaxBet Live', verified: false, createdAt: '2025-11-12' },
  { id: 'admin-1', email: 'admin@brokerplatform.io', role: 'admin', displayName: 'Platform Admin', verified: true, createdAt: '2025-01-01' },
];

export const mockStreamerProfiles: StreamerProfile[] = [
  {
    userId: 'streamer-1', displayName: 'AceSlots', platforms: ['Twitch', 'YouTube'], followerCount: 245000,
    avgLiveViewers: 3200, monthlyImpressions: 1800000, audienceGeo: ['US', 'CA', 'UK', 'DE'],
    engagementRate: 4.8, nicheType: 'Slots & Table Games', pastDeals: 12, restrictedCountries: ['FR', 'AU'],
    paymentPreference: 'Crypto (USDT)', bio: 'Full-time casino streamer since 2022. Known for high-energy slots sessions and transparent gameplay.', avatarUrl: '', verified: true,
  },
  {
    userId: 'streamer-2', displayName: 'LunaSpins', platforms: ['Kick', 'YouTube', 'Rumble'], followerCount: 128000,
    avgLiveViewers: 1800, monthlyImpressions: 920000, audienceGeo: ['UK', 'DE', 'NL', 'SE'],
    engagementRate: 5.2, nicheType: 'Live Casino & Slots', pastDeals: 7, restrictedCountries: ['US', 'FR'],
    paymentPreference: 'Bank Transfer (EUR)', bio: 'European casino content creator focusing on live dealer games and community interaction.', avatarUrl: '', verified: true,
  },
  {
    userId: 'streamer-3', displayName: 'MaxBet Live', platforms: ['Twitch'], followerCount: 52000,
    avgLiveViewers: 680, monthlyImpressions: 310000, audienceGeo: ['BR', 'PT', 'ES'],
    engagementRate: 6.1, nicheType: 'Sports Betting & Slots', pastDeals: 2, restrictedCountries: [],
    paymentPreference: 'PayPal', bio: 'Rising streamer in the Latin American market with highly engaged community.', avatarUrl: '', verified: false,
  },
];

export const mockCasinoProfiles: CasinoProfile[] = [
  {
    userId: 'casino-1', brandName: 'BetRoyal Casino', licenseJurisdiction: 'Malta (MGA)',
    acceptedCountries: ['UK', 'DE', 'CA', 'NL', 'SE', 'FI'], affiliateTerms: 'hybrid',
    marketingGuidelines: 'Must include responsible gambling notice. No underage targeting. Brand assets provided.', restrictedTerritories: ['US', 'FR', 'AU'],
    paymentTerms: 'Net-30, minimum $500 payout', logoUrl: '', website: 'https://betroyal.com', verified: true,
  },
  {
    userId: 'casino-2', brandName: 'LuckyStar Gaming', licenseJurisdiction: 'Curaçao (GCB)',
    acceptedCountries: ['BR', 'MX', 'CL', 'PE', 'CO'], affiliateTerms: 'revshare',
    marketingGuidelines: 'Localized content preferred. Spanish/Portuguese required for LATAM markets.',
    restrictedTerritories: ['US', 'UK', 'AU', 'FR'], paymentTerms: 'Net-15, no minimum',
    logoUrl: '', website: 'https://luckystar.io', verified: true,
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1', casinoId: 'casino-1', casinoBrand: 'BetRoyal Casino', title: 'Summer Slots Showdown 2026',
    description: 'Looking for top-tier slot streamers to promote our new summer game releases. High CPA + rev-share hybrid deals available for qualified streamers with 1000+ avg viewers.',
    budget: 50000, dealType: 'hybrid', targetGeo: ['UK', 'DE', 'CA'], duration: '3 months',
    requirements: 'Min 1000 avg viewers, established audience in target geos, clean streaming history',
    status: 'open', applicationsCount: 8, createdAt: '2026-02-01',
  },
  {
    id: 'camp-2', casinoId: 'casino-2', casinoBrand: 'LuckyStar Gaming', title: 'LATAM Market Expansion',
    description: 'Seeking Portuguese and Spanish-speaking streamers to help expand our presence in Latin America. Competitive rev-share deals with performance bonuses.',
    budget: 30000, dealType: 'revshare', targetGeo: ['BR', 'MX', 'CL'], duration: '6 months',
    requirements: 'Must stream in Portuguese or Spanish, 500+ avg viewers, LATAM audience',
    status: 'open', applicationsCount: 3, createdAt: '2026-02-10',
  },
  {
    id: 'camp-3', casinoId: 'casino-1', casinoBrand: 'BetRoyal Casino', title: 'Live Casino Ambassador Program',
    description: 'Exclusive ambassador program for live casino content. Monthly retainer + performance bonuses. Limited to 5 streamers.',
    budget: 100000, dealType: 'hybrid', targetGeo: ['UK', 'DE', 'NL', 'SE'], duration: '12 months',
    requirements: 'Min 2000 avg viewers, experience with live casino content, professional setup required',
    status: 'in_progress', applicationsCount: 15, createdAt: '2026-01-15',
  },
];

export const mockApplications: CampaignApplication[] = [
  {
    id: 'app-1', campaignId: 'camp-1', streamerId: 'streamer-1', streamerName: 'AceSlots', streamerAvatar: '',
    platforms: ['Twitch', 'YouTube'], followers: 245000, avgViewers: 3200,
    message: "I'd love to be part of this campaign. My audience aligns perfectly with your target geos and I have extensive experience promoting slot games.",
    status: 'shortlisted', createdAt: '2026-02-03',
  },
  {
    id: 'app-2', campaignId: 'camp-1', streamerId: 'streamer-2', streamerName: 'LunaSpins', streamerAvatar: '',
    platforms: ['Kick', 'YouTube'], followers: 128000, avgViewers: 1800,
    message: 'Excited about this opportunity! I specialize in slots content for European audiences.',
    status: 'pending', createdAt: '2026-02-05',
  },
  {
    id: 'app-3', campaignId: 'camp-2', streamerId: 'streamer-3', streamerName: 'MaxBet Live', streamerAvatar: '',
    platforms: ['Twitch'], followers: 52000, avgViewers: 680,
    message: 'I stream exclusively in Portuguese for Brazilian audiences—perfect fit for your LATAM expansion.',
    status: 'pending', createdAt: '2026-02-12',
  },
];

export const mockDeals: Deal[] = [
  {
    id: 'deal-1', campaignId: 'camp-3', campaignTitle: 'Live Casino Ambassador Program', casinoId: 'casino-1',
    casinoBrand: 'BetRoyal Casino', streamerId: 'streamer-1', streamerName: 'AceSlots', dealType: 'hybrid',
    value: 25000, status: 'active', startDate: '2026-02-01', endDate: '2027-01-31', createdAt: '2026-01-28',
  },
  {
    id: 'deal-2', campaignId: 'camp-3', campaignTitle: 'Live Casino Ambassador Program', casinoId: 'casino-1',
    casinoBrand: 'BetRoyal Casino', streamerId: 'streamer-2', streamerName: 'LunaSpins', dealType: 'hybrid',
    value: 18000, status: 'negotiation', startDate: '', endDate: '', createdAt: '2026-02-15',
  },
];

export const mockMessages: DealMessage[] = [
  { id: 'msg-1', dealId: 'deal-1', senderId: 'casino-1', senderName: 'BetRoyal Casino', senderRole: 'casino', content: 'Welcome aboard! Let\'s discuss the streaming schedule and content guidelines.', createdAt: '2026-02-01T10:00:00' },
  { id: 'msg-2', dealId: 'deal-1', senderId: 'streamer-1', senderName: 'AceSlots', senderRole: 'streamer', content: 'Thanks! I\'m excited to get started. I was thinking 3 dedicated streams per week—Mon, Wed, Fri evenings.', createdAt: '2026-02-01T10:15:00' },
  { id: 'msg-3', dealId: 'deal-1', senderId: 'casino-1', senderName: 'BetRoyal Casino', senderRole: 'casino', content: 'That works perfectly. I\'ll send over the brand kit and streaming overlays by end of day.', createdAt: '2026-02-01T11:00:00' },
  { id: 'msg-4', dealId: 'deal-2', senderId: 'casino-1', senderName: 'BetRoyal Casino', senderRole: 'casino', content: 'Hi Luna, we\'d love to have you in the ambassador program. Let\'s discuss terms.', createdAt: '2026-02-15T14:00:00' },
  { id: 'msg-5', dealId: 'deal-2', senderId: 'streamer-2', senderName: 'LunaSpins', senderRole: 'streamer', content: 'Sounds great! What\'s the proposed monthly retainer and commission structure?', createdAt: '2026-02-15T14:30:00' },
];

export const mockAuditLog: AuditLogEntry[] = [
  { id: 'log-1', userId: 'admin-1', userEmail: 'admin@brokerplatform.io', action: 'VERIFY_USER', details: 'Approved verification for BetRoyal Casino', createdAt: '2026-02-01T09:00:00' },
  { id: 'log-2', userId: 'casino-1', userEmail: 'marketing@betroyal.com', action: 'CREATE_CAMPAIGN', details: 'Created campaign: Live Casino Ambassador Program', createdAt: '2026-01-15T08:00:00' },
  { id: 'log-3', userId: 'streamer-1', userEmail: 'ace@slots.tv', action: 'APPLY_CAMPAIGN', details: 'Applied to: Live Casino Ambassador Program', createdAt: '2026-01-18T16:00:00' },
  { id: 'log-4', userId: 'admin-1', userEmail: 'admin@brokerplatform.io', action: 'APPROVE_DEAL', details: 'Approved first deal between BetRoyal Casino and AceSlots', createdAt: '2026-01-28T10:00:00' },
  { id: 'log-5', userId: 'casino-1', userEmail: 'marketing@betroyal.com', action: 'UPLOAD_REPORT', details: 'Uploaded performance report for deal-1 (January 2026)', createdAt: '2026-02-05T12:00:00' },
  { id: 'log-6', userId: 'admin-1', userEmail: 'admin@brokerplatform.io', action: 'FLAG_ACCOUNT', details: 'Flagged MaxBet Live for missing verification documents', createdAt: '2026-02-10T11:00:00' },
];

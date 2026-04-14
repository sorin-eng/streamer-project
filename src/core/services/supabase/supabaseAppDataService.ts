import { supabase } from '@/integrations/supabase/client';
import type { AppUser } from '@/contexts/AuthContext';
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
import type { Tables } from '@/integrations/supabase/types';
import { evaluateCampaignApplicationGeoGate, evaluateInquiryGeoGate } from '@/lib/geoCompliance';

const CONTACT_PATTERNS = [
  /[\w.-]+@[\w.-]+\.\w{2,}/i,
  /\+?\d[\d\s-()]{7,}\d/,
  /discord\.gg\/\S+/i,
  /t\.me\/\S+/i,
  /(?:^|\s)@[\w]{3,}/,
  /(?:whatsapp|telegram|signal|skype)\s*[:\-]?\s*\S+/i,
];

function detectContactInfo(text: string): boolean {
  return CONTACT_PATTERNS.some((pattern) => pattern.test(text));
}

async function sendNotification(params: {
  event_type: string;
  deal_id?: string;
  title: string;
  body?: string;
  entity_type?: string;
  entity_id?: string;
}) {
  try {
    await supabase.functions.invoke('notify', { body: params });
  } catch {
    // Non-blocking — don't fail the main action
  }
}

async function getDealById(id: string): Promise<DealWithRelations> {
  const { data, error } = await supabase
    .from('deals')
    .select('*, campaigns(title), organizations(name), profiles:streamer_id(display_name)')
    .eq('id', id)
    .single();
  if (error) throw error;
  if (!data) throw new Error('Deal not found');
  return data as DealWithRelations;
}

export const supabaseAppDataService: AppDataService = {
  async getDashboardStats(user: AppUser | null): Promise<DashboardStats> {
    if (!user) return null;

    if (user.role === 'casino_manager') {
      const [campaigns, deals, applications] = await Promise.all([
        supabase.from('campaigns').select('id, status, budget', { count: 'exact' }).eq('organization_id', user.organizationId!),
        supabase.from('deals').select('id, state, value', { count: 'exact' }).eq('organization_id', user.organizationId!),
        supabase.from('applications').select('id', { count: 'exact' }).in('campaign_id',
          (await supabase.from('campaigns').select('id').eq('organization_id', user.organizationId!)).data?.map(c => c.id) || []
        ),
      ]);

      return {
        activeCampaigns: campaigns.data?.filter(c => c.status === 'open' || c.status === 'in_progress').length || 0,
        activeDeals: deals.data?.filter(d => d.state === 'active').length || 0,
        totalSpend: deals.data?.reduce((sum, deal) => sum + Number(deal.value), 0) || 0,
        applicationCount: applications.count || 0,
      };
    }

    if (user.role === 'streamer') {
      const [deals, commissions] = await Promise.all([
        supabase.from('deals').select('id, state, value').eq('streamer_id', user.id),
        supabase.from('commissions').select('amount, status').eq('streamer_id', user.id),
      ]);

      return {
        activeDeals: deals.data?.filter(d => d.state === 'active').length || 0,
        totalEarnings: commissions.data?.reduce((sum, commission) => sum + Number(commission.amount), 0) || 0,
        openCampaigns: (await supabase.from('campaigns').select('id', { count: 'exact' }).eq('status', 'open')).count || 0,
      };
    }

    const [profileCount, campaignData, dealData, pendingDocs] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('campaigns').select('id, status', { count: 'exact' }),
      supabase.from('deals').select('id, value, state, platform_fee_pct', { count: 'exact' }),
      supabase.from('verification_documents').select('id', { count: 'exact' }).eq('status', 'pending'),
    ]);

    const platformRevenue = (dealData.data || []).reduce((sum, deal) => {
      return sum + Number(deal.value) * (Number(deal.platform_fee_pct ?? 8) / 100);
    }, 0);

    return {
      totalUsers: profileCount.count || 0,
      totalCampaigns: campaignData.count || 0,
      activeCampaigns: campaignData.data?.filter(c => c.status === 'open' || c.status === 'in_progress').length || 0,
      totalDeals: dealData.count || 0,
      activeDeals: dealData.data?.filter(d => d.state === 'active').length || 0,
      platformRevenue: Math.round(platformRevenue * 100) / 100,
      pendingVerifications: pendingDocs.count || 0,
    };
  },

  async browseStreamers(): Promise<StreamerWithProfile[]> {
    const { data: streamers, error } = await supabase
      .from('streamer_profiles')
      .select('*')
      .order('avg_live_viewers', { ascending: false });

    if (error) throw error;

    const userIds = streamers?.map((streamer) => streamer.user_id) || [];
    if (!userIds.length) return [];

    const [{ data: listings, error: listingsError }, { data: profiles, error: profilesError }] = await Promise.all([
      supabase
        .from('streamer_listings')
        .select('*')
        .in('user_id', userIds)
        .eq('status', 'active'),
      supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds),
    ]);

    if (listingsError) throw listingsError;
    if (profilesError) throw profilesError;

    const profilesByUserId = new Map((profiles || []).map((profile) => [profile.user_id, profile]));

    return (streamers || []).map((streamer) => ({
      ...streamer,
      profiles: profilesByUserId.get(streamer.user_id)
        ? {
            display_name: profilesByUserId.get(streamer.user_id)!.display_name,
            avatar_url: profilesByUserId.get(streamer.user_id)!.avatar_url,
          }
        : null,
      listings: (listings || []).filter((listing) => listing.user_id === streamer.user_id),
    })) as StreamerWithProfile[];
  },

  async getStreamerReviewStats(): Promise<ReviewStat[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('reviewee_id, rating');

    if (error) throw error;

    const map = new Map<string, { total: number; count: number }>();
    (data || []).forEach((review) => {
      const existing = map.get(review.reviewee_id) || { total: 0, count: 0 };
      existing.total += review.rating;
      existing.count += 1;
      map.set(review.reviewee_id, existing);
    });

    return Array.from(map.entries()).map(([reviewee_id, { total, count }]) => ({
      reviewee_id,
      avg_rating: total / count,
      review_count: count,
    }));
  },

  async getCampaigns(search?: string): Promise<CampaignWithOrg[]> {
    let query = supabase
      .from('campaigns')
      .select('*, organizations(name, logo_url)')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as CampaignWithOrg[];
  },

  async getDeals(user?: AppUser | null): Promise<DealWithRelations[]> {
    let query = supabase
      .from('deals')
      .select('*, campaigns(title), organizations(name), profiles:streamer_id(display_name)')
      .order('created_at', { ascending: false });

    if (user?.role === 'streamer') {
      query = query.eq('streamer_id', user.id);
    } else if (user?.role === 'casino_manager') {
      if (!user.organizationId) return [];
      query = query.eq('organization_id', user.organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as DealWithRelations[];
  },

  async getApplications(user?: AppUser | null, campaignId?: string): Promise<ApplicationWithProfile[]> {
    let query = supabase
      .from('applications')
      .select('*, profiles:streamer_id(display_name, avatar_url), streamer_profiles:streamer_id(platforms, follower_count, avg_live_viewers)')
      .order('created_at', { ascending: false });

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    if (user?.role === 'streamer') {
      query = query.eq('streamer_id', user.id);
    } else if (user?.role === 'casino_manager') {
      if (!user.organizationId) return [];
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('organization_id', user.organizationId);

      if (campaignsError) throw campaignsError;

      const campaignIds = (campaigns || []).map((campaign) => campaign.id);
      if (!campaignIds.length) return [];
      query = query.in('campaign_id', campaignIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as ApplicationWithProfile[];
  },

  async getDealMessages(dealId: string | null): Promise<DealMessageWithSender[]> {
    if (!dealId) return [];

    const { data, error } = await supabase
      .from('deal_messages')
      .select('*, profiles:sender_id(display_name)')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as DealMessageWithSender[];
  },

  async getStreamerListings(userId?: string): Promise<Tables<'streamer_listings'>[]> {
    let query = supabase
      .from('streamer_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getStreamerProfile(userId: string) {
    const { data, error } = await supabase
      .from('streamer_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getCasinoProgram(orgId: string) {
    const { data, error } = await supabase
      .from('casino_programs')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getContracts(dealId: string): Promise<Tables<'contracts'>[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getAllProfiles(): Promise<ProfileWithRole[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as ProfileWithRole[];
  },

  async getVerificationDocuments(): Promise<VerificationDocWithProfile[]> {
    const { data, error } = await supabase
      .from('verification_documents')
      .select('*, profiles:user_id(display_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as VerificationDocWithProfile[];
  },

  async getAuditLog(): Promise<AuditLogWithProfile[]> {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*, profiles:user_id(display_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data as unknown as AuditLogWithProfile[];
  },

  async getCommissions(user: AppUser | null): Promise<CommissionWithDeal[]> {
    let q = supabase.from('commissions').select('*, deals(id, campaigns(title))').order('created_at', { ascending: false });
    if (user?.role === 'streamer') q = q.eq('streamer_id', user.id);
    const { data, error } = await q;
    if (error) throw error;
    return data as unknown as CommissionWithDeal[];
  },

  async getReportUploads(user: AppUser | null): Promise<Tables<'report_uploads'>[]> {
    let q = supabase.from('report_uploads').select('*').order('created_at', { ascending: false });
    if (user?.organizationId) q = q.eq('organization_id', user.organizationId);
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async getUnreadDealsCount(user: AppUser): Promise<number> {
    const { data: deals, error } = await supabase
      .from('deals')
      .select('id')
      .or(user.role === 'streamer' ? `streamer_id.eq.${user.id}` : `organization_id.eq.${user.organizationId}`);
    if (error) throw error;
    if (!deals?.length) return 0;

    let unread = 0;
    for (const deal of deals) {
      const { data: lastMsg } = await supabase
        .from('deal_messages')
        .select('sender_id')
        .eq('deal_id', deal.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastMsg && lastMsg.sender_id !== user.id) unread++;
    }
    return unread;
  },

  async getNotifications(_user: AppUser): Promise<Tables<'notifications'>[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data;
  },

  async getCampaignSummary(campaignId: string) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, organization_id, deal_type, budget')
      .eq('id', campaignId)
      .single();
    if (error) throw error;
    return data;
  },

  async createCampaign(user, values: CreateCampaignInput): Promise<CampaignWithOrg> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...values,
        organization_id: user.organizationId,
        created_by: user.id,
        status: 'open',
      })
      .select('*, organizations(name, logo_url)')
      .single();

    if (error) throw error;
    if (!data) throw new Error('Campaign create failed');

    await supabase.rpc('log_audit', {
      _action: 'CREATE_CAMPAIGN',
      _entity_type: 'campaign',
      _entity_id: data.id,
      _details: { title: values.title },
    });

    return data as CampaignWithOrg;
  },

  async submitApplication(user, values: SubmitApplicationInput): Promise<ApplicationWithProfile> {
    const [streamerProfileResult, campaignResult] = await Promise.all([
      supabase
        .from('streamer_profiles')
        .select('audience_geo, restricted_countries')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('campaigns')
        .select('target_geo, restricted_countries')
        .eq('id', values.campaign_id)
        .maybeSingle(),
    ]);

    if (streamerProfileResult.error) throw streamerProfileResult.error;
    if (campaignResult.error) throw campaignResult.error;

    const geoGate = evaluateCampaignApplicationGeoGate(streamerProfileResult.data, campaignResult.data);
    if (!geoGate.allowed) {
      throw new Error(geoGate.blockers[0] || 'Application blocked by geo rules.');
    }

    const { data, error } = await supabase
      .from('applications')
      .insert({ ...values, streamer_id: user.id })
      .select('*, profiles:streamer_id(display_name, avatar_url), streamer_profiles:streamer_id(platforms, follower_count, avg_live_viewers)')
      .single();

    if (error) throw error;
    if (!data) throw new Error('Application submit failed');

    await supabase.rpc('log_audit', {
      _action: 'APPLY_CAMPAIGN',
      _entity_type: 'application',
      _entity_id: data.id,
      _details: { campaign_id: values.campaign_id },
    });

    return data as ApplicationWithProfile;
  },

  async updateApplicationStatus(user: AppUser, values: UpdateApplicationStatusInput) {
    const { error } = await supabase
      .from('applications')
      .update({ status: values.status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', values.id);
    if (error) throw error;
  },

  async sendDealMessage(user, values: SendMessageInput): Promise<{ hasContactInfo: boolean }> {
    const hasContactInfo = detectContactInfo(values.content);

    const { error } = await supabase
      .from('deal_messages')
      .insert({
        deal_id: values.dealId,
        sender_id: user.id,
        content: values.content,
      });

    if (error) throw error;

    if (hasContactInfo) {
      try {
        await supabase.rpc('log_compliance_event', {
          _event_type: 'off_platform_contact_attempt',
          _entity_type: 'deal',
          _entity_id: values.dealId,
          _details: JSON.stringify({ flagged_content: values.content.slice(0, 200) }),
          _severity: 'warning',
        });
      } catch {
        // non-blocking
      }
    }

    await sendNotification({
      event_type: 'new_message',
      deal_id: values.dealId,
      title: 'New message',
      body: values.content.slice(0, 100),
      entity_type: 'deal',
      entity_id: values.dealId,
    });

    return { hasContactInfo };
  },

  async initiateContact(values: InitiateContactInput, user: AppUser): Promise<DealWithRelations> {
    const [streamerProfileResult, programResult] = await Promise.all([
      supabase
        .from('streamer_profiles')
        .select('audience_geo, restricted_countries')
        .eq('user_id', values.streamerId)
        .maybeSingle(),
      supabase
        .from('casino_programs')
        .select('accepted_countries, restricted_territories, license_jurisdiction')
        .eq('organization_id', user.organizationId)
        .maybeSingle(),
    ]);

    if (streamerProfileResult.error) throw streamerProfileResult.error;
    if (programResult.error) throw programResult.error;

    const geoGate = evaluateInquiryGeoGate(streamerProfileResult.data, programResult.data);
    if (!geoGate.allowed) {
      throw new Error(geoGate.blockers[0] || 'Inquiry blocked by geo rules.');
    }

    const { data: deal, error: dealErr } = await supabase
      .from('deals')
      .insert({
        streamer_id: values.streamerId,
        organization_id: user.organizationId,
        deal_type: 'flat_fee' as const,
        value: 0,
        state: 'inquiry',
      })
      .select('*, campaigns(title), organizations(name), profiles:streamer_id(display_name)')
      .single();

    if (dealErr) throw dealErr;
    if (!deal) throw new Error('Unable to start inquiry');

    const { error: msgErr } = await supabase
      .from('deal_messages')
      .insert({
        deal_id: deal.id,
        sender_id: user.id,
        content: values.message,
      });
    if (msgErr) throw msgErr;

    await supabase.from('deal_state_log').insert({
      deal_id: deal.id,
      to_state: 'inquiry',
      changed_by: user.id,
    });

    await supabase.rpc('log_audit', {
      _action: 'INITIATE_CONTACT',
      _entity_type: 'deal',
      _entity_id: deal.id,
      _details: { streamer_id: values.streamerId },
    });

    await sendNotification({
      event_type: 'deal_created',
      deal_id: deal.id,
      title: 'New deal inquiry',
      body: values.message.slice(0, 100),
      entity_type: 'deal',
      entity_id: deal.id,
    });

    return getDealById(deal.id);
  },

  async createDeal(values: CreateDealInput, user: AppUser): Promise<DealWithRelations> {
    const { data, error } = await supabase
      .from('deals')
      .insert({
        ...values,
        state: 'negotiation',
      })
      .select('*, campaigns(title), organizations(name), profiles:streamer_id(display_name)')
      .single();

    if (error) throw error;
    if (!data) throw new Error('Deal create failed');

    await supabase.from('contracts').insert({
      deal_id: data.id,
      title: `Contract for ${values.campaign_id.slice(0, 8)}`,
      terms_json: {
        deal_type: values.deal_type,
        value: values.value,
        auto_generated: true,
      },
      status: 'draft' as const,
    });

    await supabase.from('deal_state_log').insert({
      deal_id: data.id,
      to_state: 'negotiation',
      changed_by: user.id,
    });

    await supabase.rpc('log_audit', {
      _action: 'ACCEPT_APPLICATION_CREATE_DEAL',
      _entity_type: 'deal',
      _entity_id: data.id,
      _details: { application_id: values.application_id, campaign_id: values.campaign_id },
    });

    await sendNotification({
      event_type: 'application_accepted',
      deal_id: data.id,
      title: 'Application accepted',
      body: 'Your application has been accepted and a deal has been created.',
      entity_type: 'deal',
      entity_id: data.id,
    });

    return data as DealWithRelations;
  },

  async advanceDealState(input: DealTransitionInput, user: AppUser): Promise<DealWithRelations> {
    const toState = input.to_state as DealState;

    const { data: valid } = await supabase.rpc('validate_deal_transition', {
      _deal_id: input.dealId,
      _to_state: toState,
      _user_id: user.id,
    });

    if (!valid) {
      throw new Error('Transition not allowed');
    }

    await supabase.from('deals').update({ state: toState }).eq('id', input.dealId);
    await supabase.from('deal_state_log').insert({
      deal_id: input.dealId,
      from_state: input.from_state,
      to_state: toState,
      changed_by: user.id,
      reason: input.reason,
    });

    if (toState === 'contract_pending') {
      await supabase.from('contracts').update({ status: 'pending_signature' as const }).eq('deal_id', input.dealId);
    }

    await supabase.rpc('log_audit', {
      _action: 'ADVANCE_DEAL_STATE',
      _entity_type: 'deal',
      _entity_id: input.dealId,
      _details: { from: input.from_state, to: toState },
    });

    await sendNotification({
      event_type: 'deal_state_change',
      deal_id: input.dealId,
      title: `Deal moved to ${toState.replace('_', ' ')}`,
      entity_type: 'deal',
      entity_id: input.dealId,
    });

    return getDealById(input.dealId);
  },

  async cancelDeal(input: DealTransitionInput, user: AppUser): Promise<DealWithRelations> {
    if (!input.reason?.trim()) {
      throw new Error('Cancellation reason required');
    }

    const { data: valid } = await supabase.rpc('validate_deal_transition', {
      _deal_id: input.dealId,
      _to_state: 'cancelled',
      _user_id: user.id,
    });

    if (!valid) {
      throw new Error('Cannot cancel');
    }

    await supabase.from('deals').update({ state: 'cancelled' }).eq('id', input.dealId);
    await supabase.from('deal_state_log').insert({
      deal_id: input.dealId,
      from_state: input.from_state,
      to_state: 'cancelled',
      changed_by: user.id,
      reason: input.reason.trim(),
    });

    await supabase.rpc('log_audit', {
      _action: 'CANCEL_DEAL',
      _entity_type: 'deal',
      _entity_id: input.dealId,
      _details: { from: input.from_state, reason: input.reason.trim() },
    });

    return getDealById(input.dealId);
  },

  async disputeDeal(input: DealTransitionInput, user: AppUser): Promise<DealWithRelations> {
    const { data: valid } = await supabase.rpc('validate_deal_transition', {
      _deal_id: input.dealId,
      _to_state: 'disputed',
      _user_id: user.id,
    });

    if (!valid) {
      throw new Error('Cannot dispute');
    }

    await supabase.from('deals').update({ state: 'disputed' }).eq('id', input.dealId);
    await supabase.from('deal_state_log').insert({
      deal_id: input.dealId,
      from_state: input.from_state,
      to_state: 'disputed',
      changed_by: user.id,
      reason: input.reason || null,
    });

    await supabase.rpc('log_audit', {
      _action: 'DISPUTE_DEAL',
      _entity_type: 'deal',
      _entity_id: input.dealId,
      _details: { from: input.from_state, reason: input.reason },
    });

    return getDealById(input.dealId);
  },

  async respondToInquiry(user, values) {
    const newState = values.accept ? 'negotiation' : 'cancelled';

    const { data: valid } = await supabase.rpc('validate_deal_transition', {
      _deal_id: values.dealId,
      _to_state: newState,
      _user_id: user.id,
    });

    if (!valid) throw new Error('Transition not allowed');

    await supabase.from('deals').update({ state: newState }).eq('id', values.dealId);
    await supabase.from('deal_state_log').insert({
      deal_id: values.dealId,
      from_state: 'inquiry',
      to_state: newState,
      changed_by: user.id,
      reason: values.accept ? 'Streamer accepted inquiry' : 'Streamer declined inquiry',
    });

    await supabase.rpc('log_audit', {
      _action: values.accept ? 'ACCEPT_INQUIRY' : 'DECLINE_INQUIRY',
      _entity_type: 'deal',
      _entity_id: values.dealId,
    });

    await sendNotification({
      event_type: values.accept ? 'inquiry_accepted' : 'inquiry_declined',
      deal_id: values.dealId,
      title: values.accept ? 'Inquiry accepted' : 'Inquiry declined',
      entity_type: 'deal',
      entity_id: values.dealId,
    });
  },

  async updateStreamerProfile(user, values: UpdateStreamerProfileInput) {
    const { error } = await supabase
      .from('streamer_profiles')
      .update(values as Record<string, string>)
      .eq('user_id', user.id);
    if (error) throw error;
  },

  async updateCasinoProgram(user, values: UpdateCasinoProgramInput) {
    if (!user.organizationId) throw new Error('No org');
    const { error } = await supabase
      .from('casino_programs')
      .update(values as Record<string, string>)
      .eq('organization_id', user.organizationId);
    if (error) throw error;
  },

  async createListing(user, values: CreateListingInput) {
    const { data, error } = await supabase
      .from('streamer_listings')
      .insert({
        ...values,
        user_id: user.id,
        pricing_type: values.pricing_type as 'fixed_per_stream' | 'fixed_package' | 'hourly' | 'negotiable',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateListing(values: UpdateListingInput) {
    const { id, ...rest } = values;
    const { error } = await supabase
      .from('streamer_listings')
      .update(rest as Record<string, string>)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteListing(id: string) {
    const { error } = await supabase
      .from('streamer_listings')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async signContract(user, values: SignContractInput) {
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', values.contractId)
      .single();
    if (fetchError) throw fetchError;
    if (!contract) throw new Error('Contract not found');

    const signField = user.role === 'streamer' ? 'signer_streamer_id' : 'signer_casino_id';
    const otherField = user.role === 'streamer' ? 'signer_casino_id' : 'signer_streamer_id';
    const otherSigned = !!contract[otherField];
    const signedAt = otherSigned ? new Date().toISOString() : undefined;
    const updatePayload: Record<string, unknown> = {
      [signField]: user.id,
      status: otherSigned ? 'signed' : 'pending_signature',
    };

    if (signedAt) updatePayload.signed_at = signedAt;

    const { error } = await supabase
      .from('contracts')
      .update(updatePayload)
      .eq('id', values.contractId);
    if (error) throw error;

    if (otherSigned && contract.deal_id) {
      const { data: deal, error: dealFetchError } = await supabase
        .from('deals')
        .select('id, state')
        .eq('id', contract.deal_id)
        .single();
      if (dealFetchError) throw dealFetchError;

      if (deal && deal.state !== 'active' && deal.state !== 'completed' && deal.state !== 'cancelled' && deal.state !== 'disputed') {
        const { error: dealUpdateError } = await supabase
          .from('deals')
          .update({ state: 'active' })
          .eq('id', contract.deal_id);
        if (dealUpdateError) throw dealUpdateError;

        await supabase.from('deal_state_log').insert({
          deal_id: contract.deal_id,
          from_state: deal.state,
          to_state: 'active',
          changed_by: user.id,
          reason: 'Contract fully signed',
        });

        await sendNotification({
          event_type: 'deal_state_change',
          deal_id: contract.deal_id,
          title: 'Deal moved to active',
          entity_type: 'deal',
          entity_id: contract.deal_id,
        });
      }
    }

    await supabase.rpc('log_audit', {
      _action: 'SIGN_CONTRACT',
      _entity_type: 'contract',
      _entity_id: values.contractId,
    });

    await supabase.rpc('log_compliance_event', {
      _event_type: 'compliance.verified',
      _entity_type: 'contract',
      _entity_id: values.contractId,
      _details: { signer_role: user.role },
      _severity: 'info',
    });
  },

  async markNotificationRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) throw error;
  },

  async updateVerification(user, values: UpdateVerificationInput) {
    const { error } = await supabase
      .from('verification_documents')
      .update({ status: values.status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', values.id);
    if (error) throw error;

    await supabase.rpc('log_audit', {
      _action: values.status === 'approved' ? 'APPROVE_VERIFICATION' : 'REJECT_VERIFICATION',
      _entity_type: 'verification_document',
      _entity_id: values.id,
    });
  },

  async createReview(user, values: CreateReviewInput) {
    const { error } = await supabase
      .from('reviews')
      .insert({
        deal_id: values.dealId,
        reviewer_id: user.id,
        reviewee_id: values.revieweeId,
        rating: values.rating,
        comment: values.comment || null,
      });
    if (error) throw error;
  },
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ---- Campaigns ----
export function useCampaigns(search?: string) {
  return useQuery({
    queryKey: ['campaigns', search],
    queryFn: async () => {
      let q = supabase
        .from('campaigns')
        .select('*, organizations(name, logo_url)')
        .order('created_at', { ascending: false });
      if (search) {
        q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: {
      title: string;
      description: string;
      budget: number;
      duration: string;
      target_geo: string[];
      deal_type: 'revshare' | 'cpa' | 'hybrid' | 'flat_fee';
      requirements: string;
    }) => {
      if (!user?.organizationId) throw new Error('No organization');
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          ...values,
          organization_id: user.organizationId,
          created_by: user.id,
          status: 'open',
        })
        .select()
        .single();
      if (error) throw error;
      // Audit
      await supabase.rpc('log_audit', {
        _action: 'CREATE_CAMPAIGN',
        _entity_type: 'campaign',
        _entity_id: data.id,
        _details: { title: values.title },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

// ---- Applications ----
export function useApplications(campaignId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['applications', campaignId, user?.id],
    queryFn: async () => {
      let q = supabase
        .from('applications')
        .select('*, profiles:streamer_id(display_name, avatar_url), streamer_profiles:streamer_id(platforms, follower_count, avg_live_viewers)')
        .order('created_at', { ascending: false });
      if (campaignId) q = q.eq('campaign_id', campaignId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: { campaign_id: string; message: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('applications')
        .insert({ ...values, streamer_id: user.id })
        .select()
        .single();
      if (error) throw error;
      await supabase.rpc('log_audit', {
        _action: 'APPLY_CAMPAIGN',
        _entity_type: 'application',
        _entity_id: data.id,
        _details: { campaign_id: values.campaign_id },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('applications')
        .update({ status: status as any, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

// ---- Deals ----
export function useDeals() {
  return useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*, campaigns(title), organizations(name), profiles:streamer_id(display_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      application_id: string;
      campaign_id: string;
      organization_id: string;
      streamer_id: string;
      deal_type: 'revshare' | 'cpa' | 'hybrid' | 'flat_fee';
      value: number;
    }) => {
      const { data, error } = await supabase
        .from('deals')
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      // Log initial state
      await supabase.from('deal_state_log').insert({
        deal_id: data.id,
        to_state: 'negotiation',
        changed_by: values.streamer_id, // will be overridden by the caller
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

// ---- Deal Messages ----
export function useDealMessages(dealId: string | null) {
  return useQuery({
    queryKey: ['deal_messages', dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deal_messages')
        .select('*, profiles:sender_id(display_name)')
        .eq('deal_id', dealId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000, // poll every 5s as backup to realtime
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ dealId, content }: { dealId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('deal_messages')
        .insert({ deal_id: dealId, sender_id: user.id, content });
      if (error) throw error;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['deal_messages', vars.dealId] }),
  });
}

// ---- Profiles ----
export function useStreamerProfile(userId?: string) {
  return useQuery({
    queryKey: ['streamer_profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streamer_profiles')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCasinoProgram(orgId?: string) {
  return useQuery({
    queryKey: ['casino_program', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('casino_programs')
        .select('*')
        .eq('organization_id', orgId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateStreamerProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      const { error } = await supabase
        .from('streamer_profiles')
        .update(values)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streamer_profile'] }),
  });
}

export function useUpdateCasinoProgram() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: Record<string, any>) => {
      if (!user?.organizationId) throw new Error('No org');
      const { error } = await supabase
        .from('casino_programs')
        .update(values)
        .eq('organization_id', user.organizationId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casino_program'] }),
  });
}

// ---- Admin ----
export function useAllProfiles() {
  return useQuery({
    queryKey: ['all_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, user_roles(role)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useVerificationDocuments() {
  return useQuery({
    queryKey: ['verification_docs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_documents')
        .select('*, profiles:user_id(display_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateVerification() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('verification_documents')
        .update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await supabase.rpc('log_audit', {
        _action: status === 'approved' ? 'APPROVE_VERIFICATION' : 'REJECT_VERIFICATION',
        _entity_type: 'verification_document',
        _entity_id: id,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification_docs'] }),
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ['audit_log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*, profiles:user_id(display_name)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
}

// ---- Dashboard Stats ----
export function useDashboardStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard_stats', user?.id, user?.role],
    queryFn: async () => {
      if (!user) return null;
      
      if (user.role === 'casino_manager') {
        const [campaigns, deals, applications] = await Promise.all([
          supabase.from('campaigns').select('id, status, budget', { count: 'exact' }).eq('organization_id', user.organizationId!),
          supabase.from('deals').select('id, state, value', { count: 'exact' }).eq('organization_id', user.organizationId!),
          supabase.from('applications').select('id', { count: 'exact' }).in('campaign_id',
            (await supabase.from('campaigns').select('id').eq('organization_id', user.organizationId!)).data?.map(c => c.id) || []
          ),
        ]);
        const activeCampaigns = campaigns.data?.filter(c => c.status === 'open' || c.status === 'in_progress').length || 0;
        const activeDeals = deals.data?.filter(d => d.state === 'active').length || 0;
        const totalSpend = deals.data?.reduce((s, d) => s + Number(d.value), 0) || 0;
        return { activeCampaigns, activeDeals, totalSpend, applicationCount: applications.count || 0 };
      }

      if (user.role === 'streamer') {
        const [deals, commissions] = await Promise.all([
          supabase.from('deals').select('id, state, value').eq('streamer_id', user.id),
          supabase.from('commissions').select('amount, status').eq('streamer_id', user.id),
        ]);
        const activeDeals = deals.data?.filter(d => d.state === 'active').length || 0;
        const totalEarnings = commissions.data?.reduce((s, c) => s + Number(c.amount), 0) || 0;
        const openCampaigns = (await supabase.from('campaigns').select('id', { count: 'exact' }).eq('status', 'open')).count || 0;
        return { activeDeals, totalEarnings, openCampaigns };
      }

      // Admin
      const [profileCount, campaignCount, dealCount] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('campaigns').select('id', { count: 'exact' }),
        supabase.from('deals').select('id, value', { count: 'exact' }),
      ]);
      return {
        totalUsers: profileCount.count || 0,
        totalCampaigns: campaignCount.count || 0,
        totalDeals: dealCount.count || 0,
        platformRevenue: 0,
      };
    },
  });
}

// ---- Streamer Listings ----
export function useStreamerListings(userId?: string) {
  return useQuery({
    queryKey: ['streamer_listings', userId],
    queryFn: async () => {
      let q = supabase
        .from('streamer_listings')
        .select('*')
        .order('created_at', { ascending: false });
      if (userId) q = q.eq('user_id', userId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: {
      title: string;
      description: string;
      pricing_type: string;
      price_amount: number;
      price_currency: string;
      min_streams?: number;
      package_details?: string;
      platforms: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('streamer_listings')
        .insert({ ...values, user_id: user.id, pricing_type: values.pricing_type as any })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streamer_listings'] }),
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from('streamer_listings')
        .update(values)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streamer_listings'] }),
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('streamer_listings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streamer_listings'] }),
  });
}

export function useBrowseStreamers() {
  return useQuery({
    queryKey: ['browse_streamers'],
    queryFn: async () => {
      const { data: streamers, error } = await supabase
        .from('streamer_profiles')
        .select('*, profiles:user_id(display_name, avatar_url)')
        .order('avg_live_viewers', { ascending: false });
      if (error) throw error;
      
      // Fetch active listings for all streamers
      const userIds = streamers?.map(s => s.user_id) || [];
      const { data: listings } = await supabase
        .from('streamer_listings')
        .select('*')
        .in('user_id', userIds)
        .eq('status', 'active');
      
      return (streamers || []).map(s => ({
        ...s,
        listings: (listings || []).filter(l => l.user_id === s.user_id),
      }));
    },
  });
}

// ---- Commissions ----
export function useCommissions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['commissions', user?.id],
    queryFn: async () => {
      let q = supabase.from('commissions').select('*, deals(id, campaigns(title))').order('created_at', { ascending: false });
      if (user?.role === 'streamer') {
        q = q.eq('streamer_id', user.id);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

// ---- Report Uploads ----
export function useReportUploads() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['report_uploads', user?.organizationId],
    enabled: !!user?.organizationId || user?.role === 'admin',
    queryFn: async () => {
      let q = supabase.from('report_uploads').select('*').order('created_at', { ascending: false });
      if (user?.organizationId) {
        q = q.eq('organization_id', user.organizationId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

// ---- Contracts ----
export function useContracts(dealId?: string) {
  return useQuery({
    queryKey: ['contracts', dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('deal_id', dealId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

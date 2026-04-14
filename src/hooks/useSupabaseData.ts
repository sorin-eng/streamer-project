import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getAppDataService } from '@/core/services/registry';
import type {
  DealWithRelations, CampaignWithOrg, ApplicationWithProfile,
  DealMessageWithSender, CommissionWithDeal, StreamerWithProfile,
  ProfileWithRole, VerificationDocWithProfile, AuditLogWithProfile,
} from '@/types/supabase-joins';
import type {
  CreateCampaignInput,
  SubmitApplicationInput,
  SendMessageInput,
  CreateDealInput,
  DealTransitionInput,
  RespondToInquiryInput,
  UpdateStreamerProfileInput,
  UpdateCasinoProgramInput,
  CreateListingInput,
  UpdateListingInput,
  UpdateApplicationStatusInput,
  SignContractInput,
  UpdateVerificationInput,
  CreateReviewInput,
} from '@/core/services/appDataService';

// ---- Campaigns ----
export function useCampaigns(search?: string) {
  return useQuery({
    queryKey: ['campaigns', search],
    queryFn: async () => getAppDataService().getCampaigns(search),
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: CreateCampaignInput) => {
      if (!user) throw new Error('Not authenticated');
      if (!user.organizationId) throw new Error('Organization required');
      return getAppDataService().createCampaign(user, values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

// ---- Applications ----
export function useApplications(campaignId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['applications', campaignId, user?.id],
    queryFn: async () => getAppDataService().getApplications(user, campaignId),
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: SubmitApplicationInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().submitApplication(user, values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: UpdateApplicationStatusInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().updateApplicationStatus(user, values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });
}

// ---- Deals ----
export function useDeals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['deals', user?.id, user?.organizationId, user?.role],
    queryFn: async () => getAppDataService().getDeals(user),
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: CreateDealInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().createDeal(values, user);
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
    queryFn: async () => getAppDataService().getDealMessages(dealId),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (vars: SendMessageInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().sendDealMessage(user, vars);
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['deal_messages', vars.dealId] }),
  });
}

// ---- Profiles ----
export function useStreamerProfile(userId?: string) {
  return useQuery({
    queryKey: ['streamer_profile', userId],
    enabled: !!userId,
    queryFn: async () => getAppDataService().getStreamerProfile(userId!),
  });
}

export function useCasinoProgram(orgId?: string) {
  return useQuery({
    queryKey: ['casino_program', orgId],
    enabled: !!orgId,
    queryFn: async () => getAppDataService().getCasinoProgram(orgId!),
  });
}

export function useUpdateStreamerProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: UpdateStreamerProfileInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().updateStreamerProfile(user, values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streamer_profile'] }),
  });
}

export function useUpdateCasinoProgram() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: UpdateCasinoProgramInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().updateCasinoProgram(user, values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['casino_program'] }),
  });
}

// ---- Admin ----
export function useAllProfiles() {
  return useQuery({
    queryKey: ['all_profiles'],
    queryFn: async () => getAppDataService().getAllProfiles() as Promise<ProfileWithRole[]>,
  });
}

export function useVerificationDocuments() {
  return useQuery({
    queryKey: ['verification_docs'],
    queryFn: async () => getAppDataService().getVerificationDocuments() as Promise<VerificationDocWithProfile[]>,
  });
}

export function useUpdateVerification() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: UpdateVerificationInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().updateVerification(user, values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['verification_docs'] }),
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ['audit_log'],
    queryFn: async () => getAppDataService().getAuditLog() as Promise<AuditLogWithProfile[]>,
  });
}

// ---- Dashboard Stats ----
export function useDashboardStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard_stats', user?.id, user?.role],
    queryFn: async () => getAppDataService().getDashboardStats(user),
  });
}

// ---- Streamer Listings ----
export function useStreamerListings(userId?: string) {
  return useQuery({
    queryKey: ['streamer_listings', userId],
    queryFn: async () => getAppDataService().getStreamerListings(userId),
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: CreateListingInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().createListing(user, values);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streamer_listings'] }),
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: UpdateListingInput) => getAppDataService().updateListing(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streamer_listings'] }),
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => getAppDataService().deleteListing(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['streamer_listings'] }),
  });
}

export function useBrowseStreamers() {
  return useQuery({
    queryKey: ['browse_streamers'],
    queryFn: async () => getAppDataService().browseStreamers(),
  });
}

export function useInitiateContact() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { streamerId: string; message: string }) => {
      if (!user || !user.organizationId) throw new Error('Organization required');
      return getAppDataService().initiateContact(input, user);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

// ---- Commissions ----
export function useCommissions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['commissions', user?.id],
    queryFn: async () => getAppDataService().getCommissions(user) as Promise<CommissionWithDeal[]>,
  });
}

// ---- Report Uploads ----
export function useReportUploads() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['report_uploads', user?.organizationId],
    enabled: !!user?.organizationId || user?.role === 'admin',
    queryFn: async () => getAppDataService().getReportUploads(user),
  });
}

// ---- Unread Deals ----
export function useUnreadDeals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['unread_deals', user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => user ? getAppDataService().getUnreadDealsCount(user) : 0,
  });
}

// ---- Notifications ----
export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notifications', user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => user ? getAppDataService().getNotifications(user) : [],
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => getAppDataService().markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// ---- Contracts ----
export function useContracts(dealId?: string) {
  return useQuery({
    queryKey: ['contracts', dealId],
    enabled: !!dealId,
    queryFn: async () => getAppDataService().getContracts(dealId!),
  });
}

export function useSignContract() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: SignContractInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().signContract(user, values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

// ---- Reviews ----
export function useStreamerReviewStats() {
  return useQuery({
    queryKey: ['review_stats'],
    queryFn: async () => getAppDataService().getStreamerReviewStats(),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (values: CreateReviewInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().createReview(user, values);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review_stats'] });
      qc.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

// ---- Accept / Decline Inquiry ----


export function useAdvanceDealState() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: DealTransitionInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().advanceDealState(input, user);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  });
}

export function useCancelDeal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: DealTransitionInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().cancelDeal(input, user);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  });
}

export function useDisputeDeal() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: DealTransitionInput) => {
      if (!user) throw new Error('Not authenticated');
      return getAppDataService().disputeDeal(input, user);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  });
}

export function useAcceptApplicationToDeal() {
  const qc = useQueryClient();
  const updateAppStatus = useUpdateApplicationStatus();
  const createDeal = useCreateDeal();

  return useMutation({
    mutationFn: async (app: ApplicationWithProfile) => {
      await updateAppStatus.mutateAsync({ id: app.id, status: 'accepted' });

      const campaignData = await getAppDataService().getCampaignSummary(app.campaign_id);

      return createDeal.mutateAsync({
        application_id: app.id,
        campaign_id: app.campaign_id,
        organization_id: campaignData.organization_id,
        streamer_id: app.streamer_id,
        deal_type: campaignData.deal_type,
        value: campaignData.budget || 0,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
}

export function useRespondToInquiry() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ dealId, accept }: { dealId: string; accept: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      await getAppDataService().respondToInquiry(user, { dealId, accept });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  });
}

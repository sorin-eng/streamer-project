import { beforeEach, describe, expect, it } from 'vitest';
import { computeMockCommissions, mockAppDataService, resetMockAppData } from '@/core/services/mock/mockAppDataService';

const manager: Parameters<typeof mockAppDataService.getDashboardStats>[0] = {
  id: 'manager-1',
  email: 'manager@example.com',
  role: 'casino_manager',
  displayName: 'Manager',
  verified: true,
  suspended: false,
  emailConfirmed: true,
  organizationId: 'org-1',
};

const streamer: Parameters<typeof mockAppDataService.getDashboardStats>[0] = {
  id: 'streamer-1',
  email: 'streamer@example.com',
  role: 'streamer',
  displayName: 'Streamer',
  verified: true,
  suspended: false,
  emailConfirmed: true,
};

const freshStreamer = {
  ...streamer,
  id: 'streamer-empty',
  email: 'empty@example.com',
  displayName: 'Fresh Streamer',
};

describe('mockAppDataService', () => {
  beforeEach(() => {
    resetMockAppData();
  });

  it('returns seeded streamers with attached listings', async () => {
    const streamers = await mockAppDataService.browseStreamers();

    expect(streamers.length).toBeGreaterThan(0);
    expect(streamers[0].profiles?.display_name).toBeTruthy();
    expect(streamers[0].listings?.length).toBeGreaterThan(0);
  });

  it('returns role-specific dashboard stats', async () => {
    const casinoStats = await mockAppDataService.getDashboardStats(manager);
    const streamerStats = await mockAppDataService.getDashboardStats(streamer);

    expect(casinoStats).toMatchObject({ activeCampaigns: 3, activeDeals: 5 });
    expect(streamerStats).toMatchObject({ activeDeals: 2, openCampaigns: 7 });
  });

  it('returns seeded campaigns, deals, applications, and messages', async () => {
    const campaigns = await mockAppDataService.getCampaigns('slots');
    const deals = await mockAppDataService.getDeals();
    const applications = await mockAppDataService.getApplications();
    const messages = await mockAppDataService.getDealMessages('deal-1');

    expect(campaigns[0]?.title).toContain('slots');
    expect(deals.length).toBeGreaterThan(0);
    expect(applications[0]?.profiles?.display_name).toBe('LunaSpin');
    expect(messages[0]?.content).toContain('launch streams');
  });

  it('filters deal reads by the current user in mock mode', async () => {
    const casinoDeals = await mockAppDataService.getDeals({ ...manager, organizationId: 'mock-org-1' } as any);
    const streamerDeals = await mockAppDataService.getDeals(streamer as any);
    const emptyStreamerDeals = await mockAppDataService.getDeals(freshStreamer as any);

    expect(casinoDeals).toHaveLength(2);
    expect(streamerDeals).toHaveLength(1);
    expect(streamerDeals[0]?.streamer_id).toBe('streamer-1');
    expect(emptyStreamerDeals).toHaveLength(0);
  });

  it('filters application reads by the current user in mock mode', async () => {
    const casinoApplications = await mockAppDataService.getApplications({ ...manager, organizationId: 'mock-org-1' } as any);
    const streamerApplications = await mockAppDataService.getApplications(streamer as any);
    const emptyStreamerApplications = await mockAppDataService.getApplications(freshStreamer as any);

    expect(casinoApplications).toHaveLength(1);
    expect(streamerApplications).toHaveLength(1);
    expect(streamerApplications[0]?.streamer_id).toBe('streamer-1');
    expect(emptyStreamerApplications).toHaveLength(0);
  });

  it('creates campaigns, applications, and messages through write actions', async () => {
    const beforeCampaigns = await mockAppDataService.getCampaigns();
    const createdCampaign = await mockAppDataService.createCampaign(manager, {
      title: 'New mock campaign',
      description: 'A test campaign',
      budget: 500,
      duration: '2 weeks',
      target_geo: ['Germany'],
      deal_type: 'cpa',
      requirements: 'Requirements',
    });

    const afterCampaigns = await mockAppDataService.getCampaigns();

    const createdApplication = await mockAppDataService.submitApplication(streamer, {
      campaign_id: createdCampaign.id,
      message: 'Hello, I can do this.',
    });

    const sent = await mockAppDataService.sendDealMessage(streamer, {
      dealId: 'deal-1',
      content: 'Contact me at test@example.com',
    });

    expect(createdCampaign.title).toBe('New mock campaign');
    expect(afterCampaigns.length).toBe(beforeCampaigns.length + 1);
    expect(createdApplication.campaign_id).toBe(createdCampaign.id);
    expect(createdApplication.status).toBe('pending');
    expect(sent.hasContactInfo).toBe(true);
  });

  it('advances, cancels, and disputes deal state transitions', async () => {
    const inProgressDeal = await mockAppDataService.createDeal({
      application_id: 'application-1',
      campaign_id: 'campaign-1',
      organization_id: 'mock-org-1',
      streamer_id: 'streamer-1',
      deal_type: 'hybrid',
      value: 1000,
    }, manager as any);

    const advanced = await mockAppDataService.advanceDealState({
      dealId: inProgressDeal.id,
      to_state: 'contract_pending',
      from_state: 'negotiation',
    }, manager as any);

    const cancelled = await mockAppDataService.cancelDeal({
      dealId: advanced.id,
      to_state: 'cancelled',
      from_state: advanced.state,
      reason: 'Stopped',
    }, manager as any);

    const disputed = await mockAppDataService.disputeDeal({
      dealId: 'deal-2',
      to_state: 'disputed',
      from_state: 'active',
      reason: 'Late response',
    }, manager as any);

    expect(advanced.state).toBe('contract_pending');
    expect(cancelled.state).toBe('cancelled');
    expect(disputed.state).toBe('disputed');
  });

  it('requires a reason before cancelling a deal through the service seam', async () => {
    await expect(mockAppDataService.cancelDeal({
      dealId: 'deal-1',
      to_state: 'cancelled',
      from_state: 'negotiation',
      reason: '   ',
    }, manager as any)).rejects.toThrow('Cancellation reason required');
  });

  it('rejects inverted commission periods through the report seam', async () => {
    await expect(computeMockCommissions({
      dealId: 'deal-1',
      periodStart: '2026-04-02',
      periodEnd: '2026-04-01',
    })).rejects.toThrow('Period start must be on or before period end.');
  });

  it('supports listing reads and listing/profile write actions', async () => {
    const before = await mockAppDataService.getStreamerListings('streamer-1');

    await mockAppDataService.updateStreamerProfile(streamer as any, { bio: 'Updated bio' });
    await mockAppDataService.updateCasinoProgram({ ...manager, organizationId: 'mock-org-1' } as any, { brand_name: 'Updated Casino' });
    await mockAppDataService.createListing(streamer as any, {
      title: 'Fresh listing',
      description: 'new description',
      pricing_type: 'fixed_package',
      price_amount: 250,
      price_currency: 'USDT',
      platforms: ['Kick'],
    });

    const after = await mockAppDataService.getStreamerListings('streamer-1');
    expect(after.length).toBe(before.length + 1);
  });

  it('supports contract reads and signing through the service seam', async () => {
    const contractsBefore = await mockAppDataService.getContracts('deal-1');
    expect(contractsBefore[0]?.signer_streamer_id).toBeFalsy();

    await mockAppDataService.signContract(streamer as any, { contractId: 'contract-1' });

    const contractsAfter = await mockAppDataService.getContracts('deal-1');
    const dealsAfter = await mockAppDataService.getDeals({ ...manager, organizationId: 'mock-org-1' } as any);
    expect(contractsAfter[0]?.signer_streamer_id).toBe('streamer-1');
    expect(contractsAfter[0]?.status).toBe('signed');
    expect(dealsAfter.find((deal) => deal.id === 'deal-1')?.state).toBe('active');
  });
});

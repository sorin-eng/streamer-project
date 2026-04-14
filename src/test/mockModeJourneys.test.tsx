import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import App from '@/App';
import type { AppUser } from '@/core/domain/types';
import { createMockContractDraft, mockAppDataService, resetMockAppData } from '@/core/services/mock/mockAppDataService';

vi.mock('@/components/dashboard/DashboardCharts', () => ({
  DashboardChartCard: ({ title, children }: { title: string; children: ReactNode }) => (
    <section>
      <h3>{title}</h3>
      {children}
    </section>
  ),
  TrendBarChart: () => <div>mock-trend-bar-chart</div>,
  TrendLineChart: () => <div>mock-trend-line-chart</div>,
  BreakdownPieChart: () => <div>mock-breakdown-pie-chart</div>,
}));

vi.mock('@/hooks/useCompliance', () => ({
  latestEligibleBirthDate: () => '2008-04-14',
  useComplianceStatus: () => ({
    data: {
      age_verified: true,
      kyc_status: 'verified',
      terms_accepted: true,
      privacy_accepted: true,
      fully_compliant: true,
    },
    isLoading: false,
  }),
  useSubmitAgeVerification: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAcceptDisclaimer: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useComplianceGate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubmitKycDocument: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const STORAGE_KEY = 'castreamino-mock-user';

function setRoute(path: string) {
  window.history.pushState({}, '', path);
}

function setMockUser(user: AppUser | null) {
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

const casinoUser: AppUser = {
  id: 'manager-1',
  email: 'casino@example.com',
  role: 'casino_manager',
  displayName: 'Mock Casino',
  verified: true,
  organizationId: 'mock-org-1',
  suspended: false,
  emailConfirmed: true,
};

const streamerUser: AppUser = {
  id: 'streamer-1',
  email: 'streamer@example.com',
  role: 'streamer',
  displayName: 'LunaSpin',
  verified: true,
  suspended: false,
  emailConfirmed: true,
};

const freshStreamerUser: AppUser = {
  id: 'fresh-streamer',
  email: 'fresh@example.com',
  role: 'streamer',
  displayName: 'Fresh Streamer',
  verified: true,
  suspended: false,
  emailConfirmed: true,
};

describe('mock-mode journey flows', () => {
  beforeEach(() => {
    resetMockAppData();
    window.localStorage.clear();
    setRoute('/');
  });

  it('completes streamer onboarding and creates the first listing in mock mode', async () => {
    setMockUser(freshStreamerUser);
    setRoute('/dashboard');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Where do you stream?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Kick' }));
    fireEvent.change(screen.getByPlaceholderText('https://kick.com/...'), {
      target: { value: 'https://kick.com/fresh-streamer' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText('Your streaming stats')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('10000'), { target: { value: '25000' } });
    fireEvent.change(screen.getByPlaceholderText('Tell casinos about your streaming style...'), {
      target: { value: 'Slots streamer focused on EU traffic.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText('Create your first listing')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('e.g. Slots Streaming on Kick — 2hr sessions'), {
      target: { value: 'Fresh Kick Launch Package' },
    });
    fireEvent.change(screen.getByPlaceholderText("What's included..."), {
      target: { value: 'Two live streams and one highlight clip.' },
    });
    fireEvent.change(screen.getByPlaceholderText('500'), { target: { value: '900' } });
    fireEvent.click(screen.getByRole('button', { name: /finish setup/i }));

    await waitFor(async () => {
      const profile = await mockAppDataService.getStreamerProfile(freshStreamerUser.id) as {
        platforms?: string[];
        follower_count?: number;
        bio?: string;
      } | null;
      const listings = await mockAppDataService.getStreamerListings(freshStreamerUser.id);

      expect(profile?.platforms).toEqual(['Kick']);
      expect(profile?.follower_count).toBe(25000);
      expect(profile?.bio).toContain('EU traffic');
      expect(listings[0]?.title).toBe('Fresh Kick Launch Package');
    });
  });

  it('lets a casino send an inquiry that creates a deal in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/streamers');

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Send Inquiry').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText('Send Inquiry')[0]!);

    await waitFor(() => {
      expect(screen.getByText('Contact LunaSpin')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Hi, I'm interested in partnering with you for..."), {
      target: { value: 'We want a direct slots promo next week.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Inquiry' }));

    await waitFor(() => {
      expect(window.location.pathname).toBe('/deals');
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
    });

    await waitFor(async () => {
      const deals = await mockAppDataService.getDeals();
      const inquiryDeal = deals.find((deal) => deal.state === 'inquiry' && deal.streamer_id === 'streamer-1');
      expect(inquiryDeal).toBeTruthy();
      expect(inquiryDeal?.profiles?.display_name).toBe('LunaSpin');

      const messages = await mockAppDataService.getDealMessages(inquiryDeal?.id || null);
      expect(messages[0]?.content).toContain('direct slots promo next week');
    });
  });

  it('lets a streamer sign a pending contract from the contract route in mock mode', async () => {
    setMockUser(streamerUser);
    setRoute('/contracts?deal=deal-1');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Contract' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Contract' }));

    await waitFor(async () => {
      const contracts = await mockAppDataService.getContracts('deal-1');
      const deals = await mockAppDataService.getDeals(streamerUser);
      expect(contracts[0]?.signer_streamer_id).toBe('streamer-1');
      expect(contracts[0]?.status).toBe('signed');
      expect(deals.find((deal) => deal.id === 'deal-1')?.state).toBe('active');
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Go to Reports' })).toBeInTheDocument();
    });
  });

  it('proves the contract-to-commission workflow in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/deals');

    const casinoView = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create contract/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /create contract/i }));

    const contractDialog = await screen.findByRole('dialog');
    fireEvent.change(within(contractDialog).getByLabelText('CPA Amount ($)'), {
      target: { value: '75' },
    });
    fireEvent.change(within(contractDialog).getByLabelText('RevShare Percentage (%)'), {
      target: { value: '20' },
    });
    fireEvent.click(within(contractDialog).getByRole('button', { name: 'Create Contract' }));

    await waitFor(async () => {
      const deals = await mockAppDataService.getDeals(casinoUser);
      expect(deals.find((deal) => deal.id === 'deal-1')?.state).toBe('contract_pending');
    });

    casinoView.unmount();

    setMockUser(casinoUser);
    setRoute('/contracts?deal=deal-1');
    const casinoContractView = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Contract' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Contract' }));

    await waitFor(async () => {
      const contracts = await mockAppDataService.getContracts('deal-1');
      expect(contracts[0]?.signer_casino_id).toBe('manager-1');
      expect(contracts[0]?.status).toBe('pending_signature');
    });

    casinoContractView.unmount();

    setMockUser(streamerUser);
    setRoute('/contracts?deal=deal-1');
    const streamerContractView = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Contract' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Contract' }));

    await waitFor(async () => {
      const contracts = await mockAppDataService.getContracts('deal-1');
      const deals = await mockAppDataService.getDeals(streamerUser);
      expect(contracts[0]?.status).toBe('signed');
      expect(deals.find((deal) => deal.id === 'deal-1')?.state).toBe('active');
    });

    streamerContractView.unmount();

    setMockUser(casinoUser);
    setRoute('/reports?deal=deal-1');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
      expect(screen.getByText('Spring slots push')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /upload report/i })[0]!);

    await waitFor(() => {
      expect(screen.getByText('Upload Performance Report')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/ftd,2026-02-15,100,player_001/i), {
      target: { value: 'ftd,2026-04-01,100,player_001' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Upload & Process' }));

    await waitFor(async () => {
      const uploads = await mockAppDataService.getReportUploads(casinoUser) as Array<{ row_count: number; status: string }>;
      expect(uploads[0]?.row_count).toBe(1);
      expect(uploads[0]?.status).toBe('processed');
    });

    fireEvent.click(screen.getByRole('button', { name: /compute commissions/i }));

    const computeDialog = await screen.findByRole('dialog');
    fireEvent.click(within(computeDialog).getByRole('button', { name: 'Compute Now' }));

    await waitFor(async () => {
      const commissions = await mockAppDataService.getCommissions(casinoUser) as Array<{ deal_id: string; status: string }>;
      expect(commissions.find((commission) => commission.deal_id === 'deal-1' && commission.status === 'pending')).toBeTruthy();
    });
  });

  it('proves the full browse-to-commission workflow on one deal in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/streamers');

    const browseView = render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Send Inquiry').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText('Send Inquiry')[0]!);

    await waitFor(() => {
      expect(screen.getByText('Contact LunaSpin')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Hi, I'm interested in partnering with you for..."), {
      target: { value: 'Need a full end-to-end slots launch push next week.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Inquiry' }));

    let fullJourneyDealId = '';
    await waitFor(async () => {
      const deals = await mockAppDataService.getDeals(casinoUser);
      const newestInquiry = deals.find((deal) => deal.state === 'inquiry' && deal.streamer_id === 'streamer-1');
      expect(newestInquiry).toBeTruthy();
      fullJourneyDealId = newestInquiry?.id || '';
      expect(fullJourneyDealId).not.toBe('');
    });

    browseView.unmount();

    setMockUser(streamerUser);
    setRoute('/deals');
    const streamerDealView = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accept Inquiry' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Accept Inquiry' }));

    await waitFor(async () => {
      const deals = await mockAppDataService.getDeals(streamerUser);
      expect(deals.find((deal) => deal.id === fullJourneyDealId)?.state).toBe('negotiation');
    });

    streamerDealView.unmount();

    await createMockContractDraft({
      dealId: fullJourneyDealId,
      title: 'Partnership Agreement',
      termsJson: {
        deal_type: 'hybrid',
        deal_value: 2500,
        duration: '3 months',
        commission_structure: {
          cpa_amount: 75,
          revshare_pct: 20,
        },
        created_at: new Date().toISOString(),
      } as any,
    });

    await waitFor(async () => {
      const deals = await mockAppDataService.getDeals(casinoUser);
      expect(deals.find((deal) => deal.id === fullJourneyDealId)?.state).toBe('contract_pending');
    });

    setMockUser(casinoUser);
    setRoute(`/contracts?deal=${fullJourneyDealId}`);
    const casinoContractView = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Contract' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Contract' }));

    await waitFor(async () => {
      const contracts = await mockAppDataService.getContracts(fullJourneyDealId);
      expect(contracts[0]?.signer_casino_id).toBe('manager-1');
      expect(contracts[0]?.status).toBe('pending_signature');
    });

    casinoContractView.unmount();

    setMockUser(streamerUser);
    setRoute(`/contracts?deal=${fullJourneyDealId}`);
    const streamerContractView = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign Contract' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Contract' }));

    await waitFor(async () => {
      const contracts = await mockAppDataService.getContracts(fullJourneyDealId);
      const deals = await mockAppDataService.getDeals(streamerUser);
      expect(contracts[0]?.status).toBe('signed');
      expect(deals.find((deal) => deal.id === fullJourneyDealId)?.state).toBe('active');
    });

    streamerContractView.unmount();

    setMockUser(casinoUser);
    setRoute(`/reports?deal=${fullJourneyDealId}`);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
      expect(screen.getByText('Direct Deal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /upload report/i })[0]!);

    await waitFor(() => {
      expect(screen.getByText('Upload Performance Report')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/ftd,2026-02-15,100,player_001/i), {
      target: { value: 'ftd,2026-04-01,120,player_full_journey' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Upload & Process' }));

    await waitFor(async () => {
      const uploads = await mockAppDataService.getReportUploads(casinoUser) as Array<{ row_count: number; status: string }>;
      expect(uploads[0]?.row_count).toBe(1);
      expect(uploads[0]?.status).toBe('processed');
    });

    fireEvent.click(screen.getByRole('button', { name: /compute commissions/i }));

    const computeDialog = await screen.findByRole('dialog');
    fireEvent.click(within(computeDialog).getByRole('button', { name: 'Compute Now' }));

    await waitFor(async () => {
      const commissions = await mockAppDataService.getCommissions(casinoUser) as Array<{ deal_id: string; status: string; amount: number }>;
      const commission = commissions.find((item) => item.deal_id === fullJourneyDealId && item.status === 'pending');
      expect(commission).toBeTruthy();
      expect(commission?.amount).toBe(24);
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import App from '@/App';
import type { AppUser } from '@/core/domain/types';
import { mockAppDataService, resetMockAppData } from '@/core/services/mock/mockAppDataService';
import { resetMockAuthState } from '@/core/services/mock/mockAuthService';

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
const DEAL_ROOM_STORAGE_KEY = 'castreamino-deal-room-workflow';
const TRUST_STORAGE_KEY = 'castreamino-partner-trust-v1';

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

function getDealRoomState() {
  return JSON.parse(window.localStorage.getItem(DEAL_ROOM_STORAGE_KEY) || '{}') as Record<string, any>;
}

function getTrustState() {
  return JSON.parse(window.localStorage.getItem(TRUST_STORAGE_KEY) || '{}') as Record<string, any>;
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

describe('sticky workflow hard-proof pass', () => {
  beforeEach(() => {
    resetMockAppData();
    resetMockAuthState();
    window.localStorage.clear();
    setRoute('/');
  });

  it('proves operator-only trust memory stays private while shared assets stay collaborative', async () => {
    setMockUser(streamerUser);
    setRoute('/deals?deal=deal-1');

    const streamerView = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Partner history and renewal lane' })).toBeInTheDocument();
      expect(screen.queryByText('Private trust memory')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('New trust note')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Approve Copy draft' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit Copy draft' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Copy draft'), {
      target: { value: '18+ only. Smooth welcome offer walkthrough with the approved CTA.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Copy draft' }));

    await waitFor(() => {
      expect(screen.getByText(/Submitted by LunaSpin/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      const state = getDealRoomState();
      expect(state['deal-1']?.assets?.find((asset: any) => asset.id === 'copy')?.submittedBy).toBe('LunaSpin');
      expect(state['deal-1']?.assets?.find((asset: any) => asset.id === 'copy')?.status).toBe('pending');
    });

    streamerView.unmount();

    setMockUser(casinoUser);
    setRoute('/deals?deal=deal-1');
    const casinoView = render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Private trust memory')).toBeInTheDocument();
      expect(screen.getByLabelText('New trust note')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Approve Copy draft' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('New trust note'), {
      target: { value: 'Private note: keep geo locked to DE and RO, no freelance US mentions.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save operator note' }));
    fireEvent.click(screen.getByRole('button', { name: 'Approve Copy draft' }));

    await waitFor(() => {
      expect(screen.getByText(/Private note: keep geo locked to DE and RO/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      const trust = getTrustState();
      const dealRoom = getDealRoomState();
      expect(trust['mock-org-1::streamer-1']?.operatorNotes?.[0]?.content).toContain('Private note');
      expect(dealRoom['deal-1']?.assets?.find((asset: any) => asset.id === 'copy')?.status).toBe('approved');
    });

    casinoView.unmount();

    setMockUser(streamerUser);
    setRoute('/deals?deal=deal-1');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Partner history and renewal lane' })).toBeInTheDocument();
      expect(screen.queryByText('Private trust memory')).not.toBeInTheDocument();
      expect(screen.queryByText(/Private note: keep geo locked to DE and RO/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText('New trust note')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Approve Copy draft' })).not.toBeInTheDocument();
      expect(screen.getByText('Shared room view')).toBeInTheDocument();
    });
  });

  it('proves the sticky workflow from deal room approvals through payout and renewal across roles', async () => {
    setMockUser(streamerUser);
    setRoute('/deals?deal=deal-1');

    const streamerDealView = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit Copy draft' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit Media preview' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Copy draft'), {
      target: { value: '18+ only. Approved slots walkthrough copy for the launch stream.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Copy draft' }));

    fireEvent.change(screen.getByLabelText('Media preview'), {
      target: { value: 'https://cdn.example.com/spring-slots-preview.png' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Media preview' }));

    await waitFor(() => {
      const state = getDealRoomState();
      expect(state['deal-1']?.assets?.find((asset: any) => asset.id === 'copy')?.status).toBe('pending');
      expect(state['deal-1']?.assets?.find((asset: any) => asset.id === 'media')?.status).toBe('pending');
    });

    streamerDealView.unmount();

    setMockUser(casinoUser);
    setRoute('/deals?deal=deal-1');
    const casinoDealView = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Submit Tracking link' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Approve Copy draft' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Approve Media preview' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Tracking link'), {
      target: { value: 'https://mock.casino.example/spring-launch' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Tracking link' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve Tracking link' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Approve Copy draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Approve Media preview' }));
    fireEvent.click(screen.getByRole('button', { name: 'Approve Tracking link' }));
    fireEvent.click(screen.getByLabelText('Responsible gambling disclaimer confirmed'));
    fireEvent.click(screen.getByLabelText('Age and geo restrictions confirmed'));

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

    await waitFor(() => {
      const state = getDealRoomState();
      expect(state['deal-1']?.assets?.every((asset: any) => asset.status === 'approved')).toBe(true);
      expect(state['deal-1']?.compliance?.find((item: any) => item.id === 'disclaimer-confirmed')?.complete).toBe(true);
      expect(state['deal-1']?.compliance?.find((item: any) => item.id === 'geo-confirmed')?.complete).toBe(true);
    });

    casinoDealView.unmount();

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
      const deals = await mockAppDataService.getDeals(streamerUser);
      expect(deals.find((deal) => deal.id === 'deal-1')?.state).toBe('active');
    });

    streamerContractView.unmount();

    setMockUser(casinoUser);
    setRoute('/deals?deal=deal-1');
    const proofView = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log delivery proof' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Placement / post label'), {
      target: { value: 'Kick launch stream replay' },
    });
    fireEvent.change(screen.getByLabelText('Proof URL'), {
      target: { value: 'https://kick.com/mock-launch/replay' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log delivery proof' }));

    await waitFor(() => {
      expect(screen.getByText('Kick launch stream replay')).toBeInTheDocument();
    });

    await waitFor(() => {
      const state = getDealRoomState();
      expect(state['deal-1']?.proofs?.[0]?.label).toBe('Kick launch stream replay');
    });

    proofView.unmount();

    setMockUser(casinoUser);
    setRoute('/reports?deal=deal-1');
    const reportsView = render(<App />);

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

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Payout ledger' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /compute commissions/i }));

    const computeDialog = await screen.findByRole('dialog');
    fireEvent.click(within(computeDialog).getByRole('button', { name: 'Compute Now' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve payout' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Approve payout' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mark payout pending' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mark payout pending' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mark payout paid' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mark payout paid' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Mark payout paid' })).not.toBeInTheDocument();
      expect(screen.getAllByText(/paid/i).length).toBeGreaterThan(0);
    });

    reportsView.unmount();

    setMockUser(casinoUser);
    setRoute('/deals?deal=deal-1');
    const renewalView = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create repeat deal from prior terms' })).toBeInTheDocument();
      expect(screen.getByText(/Cold start: 4 steps, repeat deal: 1 step/i)).toBeInTheDocument();
    });

    const beforeDeals = await mockAppDataService.getDeals(casinoUser);
    fireEvent.click(screen.getByRole('button', { name: 'Create repeat deal from prior terms' }));

    await waitFor(async () => {
      const afterDeals = await mockAppDataService.getDeals(casinoUser);
      expect(afterDeals).toHaveLength(beforeDeals.length + 1);
      expect(afterDeals[0]?.application_id).toBe('renewal:deal-1');
      expect(afterDeals[0]?.deal_type).toBe('hybrid');
      expect(Number(afterDeals[0]?.value)).toBe(12000);
    });

    renewalView.unmount();
  }, 15000);
});

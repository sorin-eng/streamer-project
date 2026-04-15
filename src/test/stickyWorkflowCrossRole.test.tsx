import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import App from '@/App';
import type { AppUser } from '@/core/domain/types';
import { mockAppDataService, resetMockAppData } from '@/core/services/mock/mockAppDataService';
import { uploadPerformanceReport, computeCommissions as runCommissionCompute } from '@/core/services/platformService';
import { resetMockAuthState } from '@/core/services/mock/mockAuthService';
import { loadPartnerTrustState } from '@/lib/mockPartnerTrust';

vi.mock('@/components/dashboard/DashboardCharts', () => ({
  DashboardChartCard: ({ title, children }: { title: string; children: React.ReactNode }) => (
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
  id: 'streamer-2',
  email: 'streamer2@example.com',
  role: 'streamer',
  displayName: 'AceAfterDark',
  verified: true,
  suspended: false,
  emailConfirmed: true,
};

describe('sticky workflow cross-role hardening', () => {
  beforeEach(() => {
    resetMockAppData();
    resetMockAuthState();
    window.localStorage.clear();
    setRoute('/');
  });

  it('hard-proofs sticky deal-room surfaces and trust boundaries for roles', async () => {
    setMockUser(casinoUser);
    setRoute('/deals?deal=deal-2');

    const casinoView = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Promo asset approvals' })).toBeInTheDocument();
      expect(screen.getByText('Operator view only')).toBeInTheDocument();
      expect(screen.getByText('Private trust memory')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Approve Tracking link' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Request Revision Tracking link' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reject Tracking link' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Log delivery proof' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save operator note' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Tracking link'), {
      target: { value: 'https://mock.casino.example/deal-2-revision' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Resubmit Tracking link' }));

    fireEvent.change(screen.getByLabelText('New trust note'), {
      target: { value: 'Reuse the premium language, but keep bonus lockouts explicit.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save operator note' }));

    fireEvent.change(screen.getByLabelText('Placement / post label'), {
      target: { value: 'Kick replay clip' },
    });
    fireEvent.change(screen.getByLabelText('Proof URL'), {
      target: { value: 'https://kick.com/mock-stream/replay' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Optional notes, timing, or placement context/i), {
      target: { value: 'Replay captured after stream ended.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log delivery proof' }));

    await waitFor(() => {
      expect(screen.getByText('Kick replay clip')).toBeInTheDocument();
      expect(screen.getByText('Replay captured after stream ended.')).toBeInTheDocument();
      expect(screen.getByText('Reuse the premium language, but keep bonus lockouts explicit.')).toBeInTheDocument();
    });

    const trustState = loadPartnerTrustState();
    expect(trustState['mock-org-1::streamer-2']?.operatorNotes[0]?.content).toBe('Reuse the premium language, but keep bonus lockouts explicit.');

    casinoView.unmount();

    setMockUser(streamerUser);
    setRoute('/deals?deal=deal-2');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
      expect(screen.getByText('Shared room view')).toBeInTheDocument();
      expect(screen.queryByText('Operator view only')).not.toBeInTheDocument();
      expect(screen.queryByText('Private trust memory')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save operator note' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Approve Tracking link' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Request Revision Tracking link' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reject Tracking link' })).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText('Copy draft')).toBeInTheDocument();
    expect(screen.getByLabelText('Media preview')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Copy draft'), {
      target: { value: '18+ only. premium welcome campaign with responsible-gaming close.' },
    });
    fireEvent.change(screen.getByLabelText('Media preview'), {
      target: { value: 'https://cdn.example/mock-revision.png' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Copy draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Media preview' }));

    await waitFor(() => {
      expect(screen.getAllByText(/Submitted by AceAfterDark/i).length).toBeGreaterThanOrEqual(2);
    });

    expect(screen.queryByText('Reuse the premium language, but keep bonus lockouts explicit.')).not.toBeInTheDocument();
  }, 10000);

  it('keeps payout controls operator-only while preserving status visibility for streamer', async () => {
    await uploadPerformanceReport({
      organizationId: casinoUser.organizationId,
      dealId: 'deal-2',
      csvData: 'ftd,2026-04-01,100,player_001',
      csvFile: null,
    });
    await runCommissionCompute({ dealId: 'deal-2' });
    await mockAppDataService.updateStreamerProfile(streamerUser, {
      wallet_address: '0xstreamerwallet',
    });

    setMockUser(casinoUser);
    setRoute('/reports?deal=deal-2');
    const casinoReports = render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Approve payout' })).toBeInTheDocument();
      expect(screen.queryByText('Payout destination on file')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Approve payout' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mark payout pending' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Approve payout' })).not.toBeInTheDocument();
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

    casinoReports.unmount();

    setMockUser(streamerUser);
    setRoute('/reports?deal=deal-2');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Earnings' })).toBeInTheDocument();
      expect(screen.getByText('Payout destination on file')).toBeInTheDocument();
      expect(screen.getByText('0xstreamerwallet')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Approve payout' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Mark payout pending' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Mark payout paid' })).not.toBeInTheDocument();
    });
  }, 10000);
});

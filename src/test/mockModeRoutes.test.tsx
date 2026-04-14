import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import App from '@/App';
import type { AppUser } from '@/core/domain/types';
import { resetMockAppData } from '@/core/services/mock/mockAppDataService';

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
  id: 'mock-casino-user',
  email: 'casino@example.com',
  role: 'casino_manager',
  displayName: 'Mock Casino',
  verified: true,
  organizationId: 'mock-org-1',
  suspended: false,
  emailConfirmed: true,
};

const streamerUser: AppUser = {
  id: 'mock-streamer-user',
  email: 'streamer@example.com',
  role: 'streamer',
  displayName: 'Mock Streamer',
  verified: true,
  suspended: false,
  emailConfirmed: true,
};

const adminUser: AppUser = {
  id: 'mock-admin-user',
  email: 'admin@example.com',
  role: 'admin',
  displayName: 'Mock Admin',
  verified: true,
  suspended: false,
  emailConfirmed: true,
};

describe('mock-mode route and role flows', () => {
  beforeEach(() => {
    resetMockAppData();
    window.localStorage.clear();
    setRoute('/');
  });

  it('lets a streamer reach the dashboard flow in mock mode', async () => {
    setMockUser(streamerUser);
    setRoute('/dashboard');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Streamer Dashboard' })).toBeInTheDocument();
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'My Listings' })).toBeInTheDocument();
    });
  });

  it('keeps the streamer dashboard focused on the core workflow in mock mode', async () => {
    setMockUser(streamerUser);
    setRoute('/dashboard');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Your workflow' })).toBeInTheDocument();
      expect(screen.getAllByText('Core workflow').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Supporting tools').length).toBeGreaterThan(0);
      expect(screen.getByText('Finish setup, get discovered, respond to deals, sign contracts, then track commissions.')).toBeInTheDocument();
      expect(screen.getByText('Manage listings')).toBeInTheDocument();
      expect(screen.getByText('Review deals')).toBeInTheDocument();
      expect(screen.getByText('Check commissions')).toBeInTheDocument();
      expect(screen.getByText('Deal Messages')).toBeInTheDocument();
      expect(screen.getByText('Optional Campaigns')).toBeInTheDocument();
    });
  });

  it('lets a casino manager browse streamers in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/streamers');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Browse Streamers' })).toBeInTheDocument();
      expect(screen.getByText('Discover streamers and view their listings')).toBeInTheDocument();
      expect(screen.getAllByText('Send Inquiry')[0]).toBeInTheDocument();
    });
  });

  it('lets an admin reach the verifications review route in mock mode', async () => {
    setMockUser(adminUser);
    setRoute('/admin/verifications');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Verifications' })).toBeInTheDocument();
      expect(screen.getByText('Review and approve user KYC/KYB documents')).toBeInTheDocument();
    });
  });

  it('redirects a streamer away from casino-only browse streamers route', async () => {
    setMockUser(streamerUser);
    setRoute('/streamers');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Streamer Dashboard' })).toBeInTheDocument();
      expect(window.location.pathname).toBe('/dashboard');
    });
  });

  it('renders reports in mock mode for the streamer earnings flow', async () => {
    setMockUser(streamerUser);
    setRoute('/reports');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Earnings' })).toBeInTheDocument();
      expect(screen.getByText('No deals are ready for reporting yet. Finish signatures first, then active deals will show up here.')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Commission status' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Export filtered CSV' })).toBeInTheDocument();
    });
  });

  it('lets a casino manager open an important streamer detail route', async () => {
    setMockUser(casinoUser);
    setRoute('/streamers/streamer-1');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'LunaSpin' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Inquiry' })).toBeInTheDocument();
      expect(screen.getByText('Platforms & Links')).toBeInTheDocument();
    });
  });

  it('keeps the casino dashboard focused on browse to deal work in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/dashboard');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Casino Dashboard' })).toBeInTheDocument();
      expect(screen.getAllByText('Core workflow').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Supporting tools').length).toBeGreaterThan(0);
      expect(screen.getByText('Campaigns are optional intake')).toBeInTheDocument();
      expect(screen.getAllByText('Browse Streamers').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Open Deals').length).toBeGreaterThan(0);
      expect(screen.getByText('Deal Messages')).toBeInTheDocument();
      expect(screen.getByText('Campaign Intake')).toBeInTheDocument();
    });
  });

  it('keeps the contracts overview limited to contract-stage deals', async () => {
    setMockUser(casinoUser);
    setRoute('/contracts');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Contracts' })).toBeInTheDocument();
      expect(screen.getByText('Only deals in negotiation, signature, or live delivery stages belong here.')).toBeInTheDocument();
      expect(screen.getByText('Spring slots push')).toBeInTheDocument();
      expect(screen.getByText('Direct deal')).toBeInTheDocument();
    });
  });

  it('lets an admin reach the audit log route in mock mode', async () => {
    setMockUser(adminUser);
    setRoute('/admin/audit');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Audit Log' })).toBeInTheDocument();
      expect(screen.getByText('No audit entries yet')).toBeInTheDocument();
    });
  });
});

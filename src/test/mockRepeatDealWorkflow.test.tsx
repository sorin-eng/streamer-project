import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

describe('mock repeat-deal workflow', () => {
  beforeEach(() => {
    resetMockAppData();
    resetMockAuthState();
    window.localStorage.clear();
    setRoute('/');
  });

  it('lets a casino manager use partner history, save trust notes, and create a repeat deal from prior terms', async () => {
    setMockUser(casinoUser);
    setRoute('/deals?deal=deal-2');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Partner history and renewal lane' })).toBeInTheDocument();
      expect(screen.getByText('Second deal should be easier')).toBeInTheDocument();
      expect(screen.getByText(/Cold start: 4 steps, repeat deal: 1 step/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('New trust note'), {
      target: { value: 'Swedish audience stays clean if bonus copy is pre-approved.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save operator note' }));

    await waitFor(() => {
      expect(screen.getByText('Swedish audience stays clean if bonus copy is pre-approved.')).toBeInTheDocument();
    });

    const beforeDeals = await mockAppDataService.getDeals(casinoUser);

    fireEvent.click(screen.getByRole('button', { name: 'Create repeat deal from prior terms' }));

    await waitFor(async () => {
      const afterDeals = await mockAppDataService.getDeals(casinoUser);
      expect(afterDeals).toHaveLength(beforeDeals.length + 1);
      expect(afterDeals[0]?.application_id).toBe('renewal:deal-2');
      expect(afterDeals[0]?.deal_type).toBe('flat_fee');
      expect(Number(afterDeals[0]?.value)).toBe(4200);
      expect(afterDeals[0]?.campaigns?.title).toBe('Repeat Deal');
    });

    await waitFor(() => {
      expect(screen.getAllByText('Repeat Deal').length).toBeGreaterThan(0);
    });
  });

  it('shows shared history to a streamer without leaking operator-only trust controls', async () => {
    setMockUser(streamerUser);
    setRoute('/deals?deal=deal-2');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Partner history and renewal lane' })).toBeInTheDocument();
      expect(screen.getByText(/Mostly reliable, watch the details/i)).toBeInTheDocument();
    });

    expect(screen.queryByText('Trust memory')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('New trust note')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create repeat deal from prior terms' })).not.toBeInTheDocument();
  });
});

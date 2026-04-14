import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const supabaseSpies = vi.hoisted(() => ({
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  })),
  removeChannel: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: supabaseSpies.channel,
    removeChannel: supabaseSpies.removeChannel,
  },
}));

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

import App from '@/App';
import type { AppUser } from '@/core/domain/types';
import { resetMockAppData } from '@/core/services/mock/mockAppDataService';

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

const streamerUser: AppUser = {
  id: 'streamer-1',
  email: 'streamer@example.com',
  role: 'streamer',
  displayName: 'LunaSpin',
  verified: true,
  suspended: false,
  emailConfirmed: true,
};

describe('mock-mode realtime guards', () => {
  beforeEach(() => {
    resetMockAppData();
    window.localStorage.clear();
    setRoute('/');
    supabaseSpies.channel.mockClear();
    supabaseSpies.removeChannel.mockClear();
  });

  it('does not subscribe to live Supabase channels on the messages route in mock mode', async () => {
    setMockUser(streamerUser);
    setRoute('/messages?deal=deal-1');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Deal Threads')).toBeInTheDocument();
      expect(screen.getByText('Deal communication only')).toBeInTheDocument();
      expect(screen.getByLabelText('Open notifications')).toBeInTheDocument();
      expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    });

    expect(supabaseSpies.channel).not.toHaveBeenCalled();
    expect(supabaseSpies.removeChannel).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import App from '@/App';
import type { AppUser } from '@/core/domain/types';
import { getMockPasswordForUser, getMockProfileNotificationPreferences, getMockWebhookEndpoints, mockAppDataService, resetMockAppData } from '@/core/services/mock/mockAppDataService';
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
  id: 'streamer-1',
  email: 'streamer@example.com',
  role: 'streamer',
  displayName: 'LunaSpin',
  verified: true,
  suspended: false,
  emailConfirmed: true,
};

const adminUser: AppUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'admin',
  displayName: 'Mock Admin',
  verified: true,
  suspended: false,
  emailConfirmed: true,
};

const freshStreamerUser: AppUser = {
  id: 'streamer-empty',
  email: 'empty-streamer@example.com',
  role: 'streamer',
  displayName: 'Fresh Streamer',
  verified: true,
  suspended: false,
  emailConfirmed: true,
};

describe('mock-mode management flows', () => {
  beforeEach(() => {
    resetMockAppData();
    resetMockAuthState();
    window.localStorage.clear();
    setRoute('/');
  });

  it('lets a casino manager upload a report and compute commissions in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/reports');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Deals ready for reporting' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /upload report/i })[0]!);

    await waitFor(() => {
      expect(screen.getByText('Upload Performance Report')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/ftd,2026-02-15,100,player_001/i), {
      target: {
        value: 'ftd,2026-04-01,100,player_001\ndeposit,2026-04-02,50,player_002',
      },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Upload & Process' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Upload & Process' }));

    await waitFor(async () => {
      const uploads = await mockAppDataService.getReportUploads(casinoUser);
      expect(uploads).toHaveLength(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Upload History')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /compute commissions/i }));

    const computeDialog = await screen.findByRole('dialog');

    await waitFor(() => {
      expect(within(computeDialog).getByText('Compute Commissions')).toBeInTheDocument();
      expect(within(computeDialog).getByRole('button', { name: 'Compute Now' })).toBeEnabled();
    });

    fireEvent.click(within(computeDialog).getByRole('button', { name: 'Compute Now' }));

    await waitFor(async () => {
      const commissions = await mockAppDataService.getCommissions(casinoUser);
      expect(commissions).toHaveLength(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Commission History')).toBeInTheDocument();
      expect(screen.getAllByText('$30').length).toBeGreaterThan(0);
    });
  });

  it('blocks inverted commission date ranges in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/reports');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /compute commissions/i }));

    const dialog = await screen.findByRole('dialog');
    const computeButton = within(dialog).getByRole('button', { name: 'Compute Now' });

    fireEvent.change(within(dialog).getByLabelText('Period Start'), {
      target: { value: '2026-04-10' },
    });
    fireEvent.change(within(dialog).getByLabelText('Period End'), {
      target: { value: '2026-04-01' },
    });

    await waitFor(() => {
      expect(computeButton).toBeDisabled();
    });
  });

  it('blocks malformed report uploads in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/reports');

    const before = await mockAppDataService.getReportUploads(casinoUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: /upload report/i })[0]!);

    await waitFor(() => {
      expect(screen.getByText('Upload Performance Report')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/ftd,2026-02-15,100,player_001/i), {
      target: {
        value: 'ftd,2026-02-30,0,player_001',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Upload & Process' }));

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid event date at line 1. Use YYYY-MM-DD.')).toBeInTheDocument();
    });

    const after = await mockAppDataService.getReportUploads(casinoUser);
    expect(after).toHaveLength(before.length);
  });

  it('lets a streamer save payout setup in mock mode', async () => {
    setMockUser(streamerUser);
    setRoute('/settings');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('0x... or bc1...'), {
      target: { value: '0xabc123mockwallet' },
    });

    expect(screen.getByText('MVP settings only')).toBeInTheDocument();
    expect(screen.getByText('Payout Setup')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save payout setup/i }));

    await waitFor(async () => {
      const profile = await mockAppDataService.getStreamerProfile(streamerUser.id) as { wallet_address?: string } | null;
      expect(profile?.wallet_address).toBe('0xabc123mockwallet');
    });
  });

  it('trims blank wallet addresses back to null in settings', async () => {
    setMockUser(streamerUser);
    setRoute('/settings');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Wallet Address'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save payout setup/i }));

    await waitFor(async () => {
      const profile = await mockAppDataService.getStreamerProfile(streamerUser.id) as { wallet_address?: string | null } | null;
      expect(profile?.wallet_address ?? null).toBeNull();
    });
  });

  it('lets a streamer toggle email notifications in mock mode with visible feedback', async () => {
    setMockUser(streamerUser);
    setRoute('/settings');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('switch')[0]!);

    await waitFor(() => {
      expect(screen.getByText('Email notifications disabled')).toBeInTheDocument();
    });

    await waitFor(async () => {
      const prefs = await getMockProfileNotificationPreferences(streamerUser.id);
      expect(prefs?.email).toBe(false);
    });
  });

  it('shows password validation errors in settings before trying to submit', async () => {
    setMockUser(streamerUser);
    setRoute('/settings');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Min 8 characters'), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByPlaceholderText('Re-enter password'), {
      target: { value: 'short' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    await waitFor(() => {
      expect(screen.getByText('Password too short')).toBeInTheDocument();
      expect(screen.getByText('Minimum 8 characters')).toBeInTheDocument();
    });
  });

  it('lets a streamer update the profile form in mock mode', async () => {
    setMockUser(streamerUser);
    setRoute('/profile');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Streamer Profile' })).toBeInTheDocument();
    });

    const bioInput = document.querySelector('textarea[name="bio"]') as HTMLTextAreaElement | null;
    const followersInput = document.querySelector('input[name="follower_count"]') as HTMLInputElement | null;
    const walletInput = document.querySelector('input[name="wallet_address"]') as HTMLInputElement | null;

    expect(bioInput).not.toBeNull();
    expect(followersInput).not.toBeNull();
    expect(walletInput).not.toBeNull();

    fireEvent.change(bioInput!, { target: { value: 'Now streaming nightly crypto casino sessions.' } });
    fireEvent.change(followersInput!, { target: { value: '420000' } });
    fireEvent.change(walletInput!, { target: { value: '0xstreamerprofilewallet' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(screen.getByText('Profile updated')).toBeInTheDocument();
    });

    await waitFor(async () => {
      const profile = await mockAppDataService.getStreamerProfile(streamerUser.id) as { bio?: string; follower_count?: number; wallet_address?: string } | null;
      expect(profile?.bio).toBe('Now streaming nightly crypto casino sessions.');
      expect(profile?.follower_count).toBe(420000);
      expect(profile?.wallet_address).toBe('0xstreamerprofilewallet');
    });
  });

  it('shows signup validation until age confirmation is accepted, then completes signup in mock mode', async () => {
    setRoute('/signup');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Display Name'), {
      target: { value: 'Fresh Casino' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'fresh-casino@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'mockpass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('You must confirm you are 18+')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
      expect(screen.getByText(/fresh-casino@example.com/i)).toBeInTheDocument();
    });
  });

  it('blocks blank display names on the signup route', async () => {
    setRoute('/signup');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Display Name'), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'fresh-casino@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'mockpass123' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
    });
  });

  it('lets a mock user log in through the login route', async () => {
    setRoute('/login');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'streamer@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'whatever' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
      expect(screen.getByRole('heading', { name: 'Streamer Dashboard' })).toBeInTheDocument();
    });
  });

  it('exposes seeded mock-role shortcuts outside the test harness', async () => {
    setRoute('/login');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Mock mode dev tools')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Use Admin' }));

    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
      expect(screen.getByRole('button', { name: 'Admin active' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reset seeded data' })).toBeInTheDocument();
    });
  });

  it('lets a casino manager create a campaign in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/campaigns');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'My Campaigns' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /new campaign/i }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText(/summer slots promotion/i), {
      target: { value: 'High Roller Weekend Push' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText(/describe the campaign requirements/i), {
      target: { value: 'Weekend slots acquisition push for regulated markets.' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText('50000'), {
      target: { value: '12000' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText('3 months'), {
      target: { value: '4 weeks' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText('UK, DE, CA'), {
      target: { value: 'UK, DE' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText(/min viewers, audience requirements/i), {
      target: { value: '18+ audience, strong slots conversion history.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create Campaign' }));

    await waitFor(async () => {
      const campaigns = await mockAppDataService.getCampaigns('High Roller Weekend Push');
      expect(campaigns[0]?.title).toBe('High Roller Weekend Push');
    });
  });

  it('lets a streamer apply to a campaign with visible success feedback in mock mode', async () => {
    setMockUser(streamerUser);
    setRoute('/campaigns');

    const before = await mockAppDataService.getApplications(streamerUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Browse Campaigns' })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Apply Now' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Apply Now' })[0]!);

    const dialog = await screen.findByRole('dialog');
    const submitButton = within(dialog).getByRole('button', { name: 'Submit Application' });
    expect(submitButton).toBeDisabled();

    fireEvent.change(within(dialog).getByPlaceholderText("Tell the casino why you're a great fit..."), {
      target: { value: 'My slots audience converts well in CA and Ontario.' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Application submitted!')).toBeInTheDocument();
    });

    await waitFor(async () => {
      const after = await mockAppDataService.getApplications(streamerUser);
      expect(after).toHaveLength(before.length + 1);
      expect(after.at(-1)?.message).toBe('My slots audience converts well in CA and Ontario.');
      expect(after.at(-1)?.status).toBe('pending');
    });
  });

  it('blocks a streamer application when audience geography misses the campaign target markets', async () => {
    await mockAppDataService.updateStreamerProfile(streamerUser, {
      audience_geo: ['UK'],
      restricted_countries: [],
    });

    setMockUser(streamerUser);
    setRoute('/campaigns');

    const before = await mockAppDataService.getApplications(streamerUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Browse Campaigns' })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: 'Apply Now' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Apply Now' })[0]!);

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText("Tell the casino why you're a great fit..."), {
      target: { value: 'I can still probably make this work.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit Application' }));

    await waitFor(() => {
      expect(screen.getByText('Your audience does not overlap the campaign target geography: Germany, Romania, Canada.')).toBeInTheDocument();
    });

    const after = await mockAppDataService.getApplications(streamerUser);
    expect(after).toHaveLength(before.length);
  });

  it('routes a casino manager from campaign management into deals intentionally', async () => {
    setMockUser(casinoUser);
    setRoute('/campaigns');

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Open Deals' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Open Deals' })[0]!);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/deals');
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
    });
  });

  it('lets a streamer create a listing in mock mode from the listings route', async () => {
    setMockUser(streamerUser);
    setRoute('/listings');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'My Listings' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /new listing/i }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText(/slots streaming on kick/i), {
      target: { value: 'VIP Slots Listing' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText(/describe your streaming offer/i), {
      target: { value: 'Three sponsored slots streams with short-form recap clip.' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText('0.00'), {
      target: { value: '1500' },
    });
    fireEvent.click(within(dialog).getByLabelText('Kick'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create Listing' }));

    await waitFor(async () => {
      const listings = await mockAppDataService.getStreamerListings(streamerUser.id);
      expect(listings.some((listing) => listing.title === 'VIP Slots Listing')).toBe(true);
    });
  });

  it('shows an error when a streamer tries to create a listing without a platform', async () => {
    setMockUser(streamerUser);
    setRoute('/listings');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'My Listings' })).toBeInTheDocument();
    });

    const before = await mockAppDataService.getStreamerListings(streamerUser.id);

    fireEvent.click(screen.getByRole('button', { name: /new listing/i }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getByPlaceholderText(/slots streaming on kick/i), {
      target: { value: 'Broken Listing Attempt' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create Listing' }));

    await waitFor(() => {
      expect(screen.getByText('Select at least one platform for the listing.')).toBeInTheDocument();
    });

    const after = await mockAppDataService.getStreamerListings(streamerUser.id);
    expect(after).toHaveLength(before.length);
  });

  it('lets a casino manager create a contract from the deals route in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/deals');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create contract/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /create contract/i }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText('CPA Amount ($)'), {
      target: { value: '75' },
    });
    fireEvent.change(within(dialog).getByLabelText('RevShare Percentage (%)'), {
      target: { value: '20' },
    });
    fireEvent.change(within(dialog).getByLabelText('Special Clauses'), {
      target: { value: 'Streamer must include responsible gambling disclaimer.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create Contract' }));

    await waitFor(async () => {
      const contracts = await mockAppDataService.getContracts('deal-1');
      const deals = await mockAppDataService.getDeals(casinoUser);
      expect(contracts[0]?.title).toBe('Partnership Agreement');
      expect((contracts[0]?.terms_json as Record<string, unknown>)?.special_clauses).toBe('Streamer must include responsible gambling disclaimer.');
      expect(deals.find((deal) => deal.id === 'deal-1')?.state).toBe('contract_pending');
    });
  });

  it('blocks impossible contract percentages in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/deals');

    const before = await mockAppDataService.getContracts('deal-1');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create contract/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /create contract/i }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText('CPA Amount ($)'), {
      target: { value: '75' },
    });
    fireEvent.change(within(dialog).getByLabelText('RevShare Percentage (%)'), {
      target: { value: '150' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create Contract' }));

    await waitFor(() => {
      expect(screen.getByText('Revenue share percentage must be between 0 and 100.')).toBeInTheDocument();
    });

    const after = await mockAppDataService.getContracts('deal-1');
    expect(after).toHaveLength(before.length);
  });

  it('lets a casino manager send an inquiry from the streamer detail route in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/streamers/streamer-1');

    const before = await mockAppDataService.getDeals(casinoUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'LunaSpin' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Inquiry' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Send Inquiry' }));

    const dialog = await screen.findByRole('dialog');
    const submitButton = within(dialog).getByRole('button', { name: 'Send Inquiry' });
    expect(submitButton).toBeDisabled();

    fireEvent.change(within(dialog).getByPlaceholderText("Hi, I'm interested in partnering with you for..."), {
      target: { value: 'Interested in a detail-page-only promo test.' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/deals');
      expect(screen.getByText('Inquiry sent')).toBeInTheDocument();
    });

    await waitFor(async () => {
      const after = await mockAppDataService.getDeals(casinoUser);
      expect(after).toHaveLength(before.length + 1);
      const inquiryDeal = after.find((deal) => !before.some((existing) => existing.id === deal.id));
      expect(inquiryDeal?.state).toBe('inquiry');

      const messages = await mockAppDataService.getDealMessages(inquiryDeal?.id || null);
      expect(messages[0]?.content).toContain('detail-page-only promo test');
    });
  });

  it('blocks a casino inquiry when the streamer audience hits restricted territories', async () => {
    await mockAppDataService.updateCasinoProgram(casinoUser, {
      accepted_countries: ['Germany', 'Canada'],
      restricted_territories: ['Romania'],
      license_jurisdiction: 'Malta',
    });

    setMockUser(casinoUser);
    setRoute('/streamers/streamer-1');

    const before = await mockAppDataService.getDeals(casinoUser);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'LunaSpin' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Inquiry' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Send Inquiry' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText("Hi, I'm interested in partnering with you for..."), {
      target: { value: 'Trying to bypass geo rules.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Send Inquiry' }));

    await waitFor(() => {
      expect(screen.getByText('Audience includes casino-restricted territories: Romania.')).toBeInTheDocument();
    });

    const after = await mockAppDataService.getDeals(casinoUser);
    expect(after).toHaveLength(before.length);
    expect(window.location.pathname).toBe('/streamers/streamer-1');
  });

  it('routes the deal messages action into the messages route intentionally', async () => {
    setMockUser(casinoUser);
    setRoute('/deals');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Messages' })[0]!);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/messages');
      expect(window.location.search).toContain('deal=deal-1');
      expect(screen.getByRole('heading', { name: 'Deal Threads' })).toBeInTheDocument();
      expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    });
  });

  it('shows the empty deals state instead of crashing when a user has no deals', async () => {
    setMockUser(freshStreamerUser);
    setRoute('/deals');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Browse Campaigns' })).toBeInTheDocument();
    });
  });

  it('routes the deal contract action into the contracts route intentionally', async () => {
    setMockUser(casinoUser);
    setRoute('/deals');

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'View Contract' })[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'View Contract' })[0]!);

    await waitFor(() => {
      expect(window.location.pathname).toBe('/contracts');
      expect(window.location.search).toContain('deal=deal-1');
      expect(screen.getByRole('heading', { name: 'Contract' })).toBeInTheDocument();
    });
  });

  it('lets a public user request a password reset in mock mode', async () => {
    setRoute('/forgot-password');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'streamer@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
      expect(screen.getByText(/streamer@example.com/i)).toBeInTheDocument();
    });
  });

  it('lets a public user update a password in mock mode', async () => {
    setRoute('/reset-password');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Set New Password' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'newmockpassword' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'newmockpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    await waitFor(() => {
      expect(screen.getByText('Password updated!')).toBeInTheDocument();
    });
  });

  it('lets a casino manager create a webhook endpoint in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/settings');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Optional automation')).toBeInTheDocument();
      expect(screen.getByText('Webhook Endpoints')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /add endpoint/i }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText('https://your-app.com/webhooks'), {
      target: { value: 'https://hooks.example.com/castreamino' },
    });
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /deal\.created/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create Endpoint' }));

    await waitFor(async () => {
      const endpoints = await getMockWebhookEndpoints('mock-org-1');
      expect(endpoints).toHaveLength(1);
    });

    await waitFor(() => {
      expect(screen.getByText('https://hooks.example.com/castreamino')).toBeInTheDocument();
    });
  });

  it('lets an admin approve a verification in mock mode', async () => {
    setMockUser(adminUser);
    setRoute('/admin/verifications');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /approve/i }));

    await waitFor(async () => {
      const docs = await mockAppDataService.getVerificationDocuments();
      const profiles = await mockAppDataService.getAllProfiles();
      expect(docs[0]?.status).toBe('approved');
      expect(profiles.find((profile) => profile.user_id === 'streamer-1')?.kyc_status).toBe('verified');
    });
  });

  it('lets an admin suspend a user in mock mode', async () => {
    setMockUser(adminUser);
    setRoute('/admin/users');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Suspend LunaSpin' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Suspend LunaSpin' }));

    await waitFor(async () => {
      const profiles = await mockAppDataService.getAllProfiles();
      expect(profiles.find((profile) => profile.user_id === 'streamer-1')?.suspended).toBe(true);
    });
  });

  it('lets a streamer accept an inquiry from the deals page in mock mode', async () => {
    const seededDeal = await mockAppDataService.initiateContact({
      streamerId: 'streamer-1',
      message: 'Can you run a launch stream next week?',
    }, casinoUser);

    setMockUser(streamerUser);
    setRoute('/deals');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accept Inquiry' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Accept Inquiry' }));

    await waitFor(async () => {
      const deals = await mockAppDataService.getDeals(streamerUser);
      expect(deals.find((deal) => deal.id === seededDeal.id)?.state).toBe('negotiation');
    });

    await waitFor(() => {
      expect(screen.getByText('Inquiry accepted — negotiation started')).toBeInTheDocument();
    });
  });

  it('lets a streamer decline an inquiry from the deals page in mock mode', async () => {
    const seededDeal = await mockAppDataService.initiateContact({
      streamerId: 'streamer-1',
      message: 'Can you do a one-off promo?',
    }, casinoUser);

    setMockUser(streamerUser);
    setRoute('/deals');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Decline' }));

    await waitFor(async () => {
      const deals = await mockAppDataService.getDeals(streamerUser);
      expect(deals.find((deal) => deal.id === seededDeal.id)?.state).toBe('cancelled');
    });

    await waitFor(() => {
      expect(screen.getByText('Inquiry declined')).toBeInTheDocument();
    });
  });

  it('lets a casino manager cancel a negotiation deal in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/deals');

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Cancel' }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[0]!);

    const dialog = await screen.findByRole('dialog');
    const submitButton = within(dialog).getByRole('button', { name: 'Cancel Deal' });
    expect(submitButton).toBeDisabled();

    fireEvent.change(within(dialog).getByPlaceholderText('Why are you cancelling this deal?'), {
      target: { value: 'Budget got pulled.' },
    });
    fireEvent.click(submitButton);

    await waitFor(async () => {
      const deals = await mockAppDataService.getDeals(casinoUser);
      expect(deals.find((deal) => deal.id === 'deal-1')?.state).toBe('cancelled');
    });

    await waitFor(() => {
      expect(screen.getAllByText('Deal cancelled').length).toBeGreaterThan(0);
    });
  });

  it('lets a casino manager dispute an active deal in mock mode', async () => {
    setMockUser(casinoUser);
    setRoute('/deals');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Dispute' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Dispute' }));

    const dialog = await screen.findByRole('dialog');
    const submitButton = within(dialog).getByRole('button', { name: 'Submit Dispute' });
    expect(submitButton).toBeDisabled();

    fireEvent.change(within(dialog).getByPlaceholderText('Describe the issue with this deal...'), {
      target: { value: 'Conversion tracking numbers do not match.' },
    });
    fireEvent.click(submitButton);

    await waitFor(async () => {
      const deals = await mockAppDataService.getDeals(casinoUser);
      expect(deals.find((deal) => deal.id === 'deal-2')?.state).toBe('disputed');
    });

    await waitFor(() => {
      expect(screen.getByText('Deal disputed')).toBeInTheDocument();
    });
  });

  it('lets a casino manager leave a review after completing a deal in mock mode', async () => {
    const before = (await mockAppDataService.getStreamerReviewStats()).find((stat) => stat.reviewee_id === 'streamer-2');

    setMockUser(casinoUser);
    setRoute('/deals');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mark Completed' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mark Completed' }));

    await waitFor(async () => {
      const deals = await mockAppDataService.getDeals(casinoUser);
      expect(deals.find((deal) => deal.id === 'deal-2')?.state).toBe('completed');
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Leave Review' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Leave Review' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Rate 5 stars' }));
    fireEvent.change(within(dialog).getByPlaceholderText('How was your experience?'), {
      target: { value: 'Strong delivery and easy communication.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit Review' }));

    await waitFor(() => {
      expect(screen.getByText('Review submitted')).toBeInTheDocument();
    });

    await waitFor(async () => {
      const after = (await mockAppDataService.getStreamerReviewStats()).find((stat) => stat.reviewee_id === 'streamer-2');
      expect(after?.review_count).toBe((before?.review_count || 0) + 1);
      expect(after?.avg_rating).toBeCloseTo((((before?.avg_rating || 0) * (before?.review_count || 0)) + 5) / ((before?.review_count || 0) + 1), 5);
    });
  });

  it('updates the password for the current mock user from settings', async () => {
    setMockUser(streamerUser);
    setRoute('/settings');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Min 8 characters'), {
      target: { value: 'newstrongpass' },
    });
    fireEvent.change(screen.getByPlaceholderText('Re-enter password'), {
      target: { value: 'newstrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }));

    await waitFor(() => {
      expect(screen.getByText('Password updated successfully')).toBeInTheDocument();
    });

    expect(getMockPasswordForUser(streamerUser.id)).toBe('newstrongpass');
  });
});

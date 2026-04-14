import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ComplianceGate } from '@/components/ComplianceGate';

const complianceHarness = vi.hoisted(() => {
  const defaultState = {
    age_verified: false,
    kyc_status: 'verified' as const,
    terms_accepted: false,
    privacy_accepted: false,
    fully_compliant: false,
  };

  let state = { ...defaultState };
  const listeners = new Set<() => void>();

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  const reset = (next?: Partial<typeof defaultState>) => {
    state = { ...defaultState, ...next };
    listeners.clear();
  };

  const patch = (next: Partial<typeof defaultState>) => {
    state = { ...state, ...next };
    notify();
  };

  const submitAge = vi.fn(async ({ date_of_birth }: { date_of_birth: string }) => {
    if (date_of_birth > '2008-04-14') {
      throw new Error('You must be at least 18 years old');
    }
    patch({ age_verified: true });
  });

  const acceptDisclaimer = vi.fn(async ({ disclaimer_type }: { disclaimer_type: string }) => {
    if (disclaimer_type === 'terms') patch({ terms_accepted: true });
    if (disclaimer_type === 'privacy') patch({ privacy_accepted: true, fully_compliant: true });
  });

  return {
    getState: () => state,
    reset,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    submitAge,
    acceptDisclaimer,
  };
});

const toastSpy = vi.hoisted(() => vi.fn());

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'streamer-1',
      email: 'streamer@example.com',
      role: 'streamer',
      displayName: 'LunaSpin',
      verified: true,
      suspended: false,
      emailConfirmed: true,
    },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock('@/hooks/useCompliance', async () => {
  const React = await import('react');

  return {
    latestEligibleBirthDate: () => '2008-04-14',
    useComplianceStatus: () => {
      const [, setTick] = React.useState(0);
      React.useEffect(() => complianceHarness.subscribe(() => setTick((tick) => tick + 1)), []);
      return { data: complianceHarness.getState(), isLoading: false };
    },
    useSubmitAgeVerification: () => ({ mutateAsync: complianceHarness.submitAge, isPending: false }),
    useAcceptDisclaimer: () => ({ mutateAsync: complianceHarness.acceptDisclaimer, isPending: false }),
  };
});

describe('ComplianceGate', () => {
  beforeEach(() => {
    complianceHarness.reset();
    complianceHarness.submitAge.mockClear();
    complianceHarness.acceptDisclaimer.mockClear();
    toastSpy.mockClear();
  });

  it('keeps protected content hidden until age verification and disclaimers are complete', async () => {
    render(
      <MemoryRouter>
        <ComplianceGate>
          <div>Protected dashboard</div>
        </ComplianceGate>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Age Verification Required')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '2000-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Age' }));

    await waitFor(() => {
      expect(screen.getByText('Accept Legal Disclaimers')).toBeInTheDocument();
    });
    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'I Accept All Terms' }));

    await waitFor(() => {
      expect(screen.getByText('Protected dashboard')).toBeInTheDocument();
    });
    expect(complianceHarness.acceptDisclaimer).toHaveBeenCalledTimes(2);
  });

  it('keeps content blocked when age verification fails', async () => {
    render(
      <MemoryRouter>
        <ComplianceGate>
          <div>Protected dashboard</div>
        </ComplianceGate>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '2008-12-31' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Age' }));

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith({
        title: 'Age verification failed',
        description: 'You must be at least 18 years old',
        variant: 'destructive',
      });
    });

    expect(screen.getByText('Age Verification Required')).toBeInTheDocument();
    expect(screen.queryByText('Protected dashboard')).not.toBeInTheDocument();
  });

  it('renders protected content immediately when the user is already compliant', () => {
    complianceHarness.reset({
      age_verified: true,
      terms_accepted: true,
      privacy_accepted: true,
      fully_compliant: true,
    });

    render(
      <MemoryRouter>
        <ComplianceGate>
          <div>Protected dashboard</div>
        </ComplianceGate>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Age Verification Required')).not.toBeInTheDocument();
    expect(screen.queryByText('Accept Legal Disclaimers')).not.toBeInTheDocument();
  });
});

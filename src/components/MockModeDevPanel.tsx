import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { isMockMode } from '@/data/dataMode';
import { useAuth } from '@/contexts/AuthContext';
import { resetMockAppData } from '@/core/services/mock/mockAppDataService';
import { mockSeedAccounts, resetMockAuthState } from '@/core/services/mock/mockAuthService';
import { useToast } from '@/hooks/use-toast';

type MockModeDevPanelProps = {
  className?: string;
};

export const MockModeDevPanel = ({ className }: MockModeDevPanelProps) => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (!isMockMode()) return null;

  const currentEmail = user?.email?.toLowerCase() || null;

  const handleUseSeed = async (email: string) => {
    setBusyKey(email);
    const result = await login(email, 'mock-mode');
    if (result.ok) {
      await qc.invalidateQueries();
      navigate('/dashboard');
      const seed = mockSeedAccounts.find((account) => account.email === email);
      toast({
        title: 'Mock session ready',
        description: seed ? `Signed in as ${seed.label}.` : 'Signed in with mock data.',
      });
    } else {
      toast({ title: 'Mock sign-in failed', description: result.error || 'Unknown error', variant: 'destructive' });
    }
    setBusyKey(null);
  };

  const handleReset = async () => {
    setBusyKey('reset');
    const seedToRestore = currentEmail ? mockSeedAccounts.find((account) => account.email === currentEmail) : null;

    resetMockAppData();
    resetMockAuthState();

    if (seedToRestore) {
      await login(seedToRestore.email, 'mock-mode');
      navigate('/dashboard');
    } else {
      await logout();
      navigate('/login');
    }

    await qc.invalidateQueries();

    toast({
      title: 'Mock data reset',
      description: seedToRestore
        ? `Restored the local seed state and kept ${seedToRestore.label.toLowerCase()} signed in.`
        : 'Restored the local seed state. Pick a seeded role to keep testing.',
    });

    setBusyKey(null);
  };

  return (
    <div className={cn('rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-card', className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FlaskConical className="h-4 w-4 text-primary" />
            Mock mode dev tools
          </p>
          <p className="text-xs text-muted-foreground">
            Jump into seeded roles fast. Password is ignored here because this is local mock mode, not a real auth flow.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={busyKey !== null}
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          {busyKey === 'reset' ? 'Resetting...' : 'Reset seeded data'}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {mockSeedAccounts.map((account) => {
          const active = currentEmail === account.email;
          const busy = busyKey === account.email;
          return (
            <Button
              key={account.email}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              className={active ? 'bg-gradient-brand hover:opacity-90' : ''}
              onClick={() => handleUseSeed(account.email)}
              disabled={busyKey !== null}
            >
              {busy ? 'Switching...' : active ? `${account.label} active` : `Use ${account.label}`}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Radio, AlertCircle, CheckCircle2 } from 'lucide-react';
import { isMockMode } from '@/data/dataMode';
import { getAuthService } from '@/core/services/registry';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isMockMode()) {
      setHasRecovery(true);
      return;
    }

    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setHasRecovery(true);
    }

    const subscription = getAuthService().onAuthStateChange((state) => {
      if (state.event === 'PASSWORD_RECOVERY') {
        setHasRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    const result = await getAuthService().updatePassword(password);
    setLoading(false);
    if (!result.ok) setError(result.error || 'Failed to update password');
    else {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    }
  };

  if (!hasRecovery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="text-center space-y-4">
          <Radio className="h-8 w-8 mx-auto text-primary" />
          <p className="text-muted-foreground">Invalid or expired reset link.</p>
          <Button variant="outline" onClick={() => navigate('/forgot-password')}>Request a new link</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm space-y-6 animate-slide-up">
        <div>
          <h2 className="text-2xl font-bold">Set New Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose a strong new password</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />{error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <h3 className="font-semibold">Password updated!</h3>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-gradient-brand hover:opacity-90" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;

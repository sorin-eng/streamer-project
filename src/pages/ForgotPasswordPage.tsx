import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Radio, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getAuthService } from '@/core/services/registry';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await getAuthService().requestPasswordReset(email, `${window.location.origin}/reset-password`);
    setLoading(false);
    if (!result.ok) setError(result.error || 'Failed to send reset link');
    else setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm space-y-6 animate-slide-up">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand">
            <Radio className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Castreamino</span>
        </Link>

        <div>
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter your email to receive a reset link</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />{error}
          </div>
        )}

        {sent ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <h3 className="font-semibold">Check your email</h3>
            <p className="text-sm text-muted-foreground">We sent a password reset link to <strong>{email}</strong>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-gradient-brand hover:opacity-90" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

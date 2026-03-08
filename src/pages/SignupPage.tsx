import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Building2, Video, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type SignupRole = 'casino_manager' | 'streamer';

const roles: { value: SignupRole; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'casino_manager', label: 'Casino', desc: 'Licensed online casino operator', icon: <Building2 className="h-5 w-5" /> },
  { value: 'streamer', label: 'Streamer', desc: 'Gambling content creator', icon: <Video className="h-5 w-5" /> },
];

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<SignupRole>('streamer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageConfirmed) { setError('You must confirm you are 18+'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError('');
    setLoading(true);
    const result = await signup(email, password, role, displayName);
    setLoading(false);
    if (result.ok) navigate('/dashboard');
    else setError(result.error || 'Signup failed');
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-dark flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary-foreground">BrokerHub</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">Join the Platform</h1>
          <p className="mt-4 text-lg text-primary-foreground/70 max-w-md">
            Whether you're a casino looking for streamers or an influencer seeking partnerships — get started in minutes.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/40">18+ only. This platform does not process gambling bets.</p>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6 animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">BrokerHub</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Create an account</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose your role to get started</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {roles.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
                  role === r.value
                    ? "border-primary bg-accent shadow-glow"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", role === r.value ? "bg-gradient-brand text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {r.icon}
                </div>
                <span className="text-sm font-semibold">{r.label}</span>
                <span className="text-xs text-muted-foreground">{r.desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder={role === 'casino_manager' ? 'Casino brand name' : 'Your streamer name'} value={displayName} onChange={e => setDisplayName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)} className="mt-1 rounded border-border" />
              <span className="text-muted-foreground">I confirm I am 18 years or older and agree to the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</span>
            </label>
            <Button type="submit" className="w-full bg-gradient-brand hover:opacity-90" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

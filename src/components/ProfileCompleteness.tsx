import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

interface ProfileCompletenessProps {
  profile: Tables<'streamer_profiles'> | null;
  listingsCount: number;
  kycStatus: string;
}

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({ profile, listingsCount, kycStatus }) => {
  const checks = [
    { label: 'Bio filled', done: !!profile?.bio },
    { label: 'Platforms connected', done: (profile?.platforms?.length ?? 0) > 0 },
    { label: 'Stats entered', done: (profile?.follower_count ?? 0) > 0 },
    { label: 'At least one listing', done: listingsCount > 0 },
    { label: 'KYC submitted', done: kycStatus !== 'unverified' },
  ];

  const completed = checks.filter(c => c.done).length;
  const pct = Math.round((completed / checks.length) * 100);

  if (pct === 100) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Profile Completeness</h3>
        <span className="text-xs font-bold text-primary">{pct}%</span>
      </div>
      <Progress value={pct} className="h-2" />
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5 text-xs">
            {c.done ? <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" /> : <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <span className={c.done ? 'text-foreground' : 'text-muted-foreground'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

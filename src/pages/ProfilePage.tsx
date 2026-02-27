import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStreamerProfile, useCasinoProgram, useUpdateStreamerProfile, useUpdateCasinoProgram } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/StatusBadge';
import { Globe, Users, Eye, TrendingUp, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const ProfilePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  if (user?.role === 'streamer') return <StreamerProfileView />;
  return <CasinoProfileView />;
};

const StreamerProfileView = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useStreamerProfile(user?.id);
  const updateProfile = useUpdateStreamerProfile();
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await updateProfile.mutateAsync({
        bio: fd.get('bio') as string,
        audience_geo: (fd.get('audience_geo') as string).split(',').map(s => s.trim()),
        payment_preference: fd.get('payment_preference') as string,
        restricted_countries: (fd.get('restricted_countries') as string).split(',').map(s => s.trim()).filter(Boolean),
      });
      toast({ title: 'Profile updated' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <form onSubmit={handleSave} className="space-y-6 animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Streamer Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your public profile for casino partners</p>
          </div>
          <Button type="submit" className="bg-gradient-brand hover:opacity-90" disabled={updateProfile.isPending}>Save Changes</Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand text-xl font-bold text-primary-foreground">
              {user?.displayName[0] || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.displayName}</h2>
              <div className="flex items-center gap-2 mt-1">
                {profile?.verified === 'approved' && <span className="inline-flex items-center gap-1 text-xs text-success"><Shield className="h-3 w-3" />Verified</span>}
                <span className="text-xs text-muted-foreground">{profile?.niche_type}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-muted p-3 text-center">
              <Users className="h-4 w-4 mx-auto text-muted-foreground" />
              <p className="mt-1 text-lg font-bold">{((profile?.follower_count || 0) / 1000).toFixed(0)}K</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <Eye className="h-4 w-4 mx-auto text-muted-foreground" />
              <p className="mt-1 text-lg font-bold">{(profile?.avg_live_viewers || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Avg Viewers</p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground" />
              <p className="mt-1 text-lg font-bold">{profile?.engagement_rate || 0}%</p>
              <p className="text-xs text-muted-foreground">Engagement</p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <Globe className="h-4 w-4 mx-auto text-muted-foreground" />
              <p className="mt-1 text-lg font-bold">{((profile?.monthly_impressions || 0) / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">Impressions/mo</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2"><Label>Bio</Label><Textarea name="bio" defaultValue={profile?.bio || ''} rows={3} /></div>
            <div className="space-y-2"><Label>Platforms</Label><div className="flex gap-2">{(profile?.platforms || []).map(p => <span key={p} className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{p}</span>)}</div></div>
            <div className="space-y-2"><Label>Audience Geo</Label><Input name="audience_geo" defaultValue={(profile?.audience_geo || []).join(', ')} /></div>
            <div className="space-y-2"><Label>Payment Preference</Label><Input name="payment_preference" defaultValue={profile?.payment_preference || ''} /></div>
            <div className="space-y-2"><Label>Restricted Countries</Label><Input name="restricted_countries" defaultValue={(profile?.restricted_countries || []).join(', ')} /></div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
};

const CasinoProfileView = () => {
  const { user } = useAuth();
  const { data: program, isLoading } = useCasinoProgram(user?.organizationId);
  const updateProgram = useUpdateCasinoProgram();
  const { toast } = useToast();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await updateProgram.mutateAsync({
        brand_name: fd.get('brand_name') as string,
        license_jurisdiction: fd.get('license_jurisdiction') as string,
        website: fd.get('website') as string,
        accepted_countries: (fd.get('accepted_countries') as string).split(',').map(s => s.trim()),
        restricted_territories: (fd.get('restricted_territories') as string).split(',').map(s => s.trim()).filter(Boolean),
        payment_terms: fd.get('payment_terms') as string,
        marketing_guidelines: fd.get('marketing_guidelines') as string,
      });
      toast({ title: 'Profile updated' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <form onSubmit={handleSave} className="space-y-6 animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Casino Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your brand profile and affiliate terms</p>
          </div>
          <Button type="submit" className="bg-gradient-brand hover:opacity-90" disabled={updateProgram.isPending}>Save Changes</Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand text-xl font-bold text-primary-foreground">
              {program?.brand_name?.[0] || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{program?.brand_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {program?.verified === 'approved' && <span className="inline-flex items-center gap-1 text-xs text-success"><Shield className="h-3 w-3" />Verified</span>}
                <span className="text-xs text-muted-foreground">{program?.license_jurisdiction}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2"><Label>Brand Name</Label><Input name="brand_name" defaultValue={program?.brand_name || ''} /></div>
            <div className="space-y-2"><Label>License Jurisdiction</Label><Input name="license_jurisdiction" defaultValue={program?.license_jurisdiction || ''} /></div>
            <div className="space-y-2"><Label>Website</Label><Input name="website" defaultValue={program?.website || ''} /></div>
            <div className="space-y-2"><Label>Affiliate Terms</Label><StatusBadge status={program?.affiliate_terms || 'revshare'} /></div>
            <div className="space-y-2"><Label>Accepted Countries</Label><Input name="accepted_countries" defaultValue={(program?.accepted_countries || []).join(', ')} /></div>
            <div className="space-y-2"><Label>Restricted Territories</Label><Input name="restricted_territories" defaultValue={(program?.restricted_territories || []).join(', ')} /></div>
            <div className="space-y-2"><Label>Payment Terms</Label><Input name="payment_terms" defaultValue={program?.payment_terms || ''} /></div>
            <div className="space-y-2"><Label>Marketing Guidelines</Label><Textarea name="marketing_guidelines" defaultValue={program?.marketing_guidelines || ''} rows={3} /></div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default ProfilePage;

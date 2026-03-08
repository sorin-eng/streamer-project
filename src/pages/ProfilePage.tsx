import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStreamerProfile, useCasinoProgram, useUpdateStreamerProfile, useUpdateCasinoProgram } from '@/hooks/useSupabaseData';
import { useComplianceStatus, useSubmitKycDocument } from '@/hooks/useCompliance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/StatusBadge';
import { Globe, Users, TrendingUp, Shield, Upload, FileCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';

const ProfilePage = () => {
  const { user } = useAuth();
  if (user?.role === 'streamer') return <StreamerProfileView />;
  return <CasinoProfileView />;
};

const KycSection = () => {
  const { data: compliance } = useComplianceStatus();
  const submitKyc = useSubmitKycDocument();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const kycStatus = compliance?.kyc_status || 'unverified';

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    try {
      await submitKyc.mutateAsync({ document_type: 'identity', file });
      toast({ title: 'Document submitted for review' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Upload failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" /> KYC Verification
        </h3>
        <StatusBadge status={kycStatus} />
      </div>
      
      {kycStatus === 'unverified' && (
        <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
          <p className="text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <span className="text-muted-foreground">
              Upload a government-issued ID to verify your identity. This is required to create deals and sign contracts.
            </span>
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm" />
            <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={handleUpload} disabled={submitKyc.isPending}>
              <Upload className="mr-1 h-3 w-3" />{submitKyc.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      )}
      
      {kycStatus === 'pending' && (
        <div className="rounded-lg border border-info/20 bg-info/5 p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-info" />
            Your documents are being reviewed. This typically takes 1-2 business days.
          </p>
        </div>
      )}

      {kycStatus === 'verified' && (
        <div className="rounded-lg border border-success/20 bg-success/5 p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            Your identity has been verified. You have full platform access.
          </p>
        </div>
      )}

      {kycStatus === 'rejected' && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <span>Your verification was rejected. Please upload updated documents.</span>
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="text-sm" />
            <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={handleUpload} disabled={submitKyc.isPending}>
              <Upload className="mr-1 h-3 w-3" />{submitKyc.isPending ? 'Uploading...' : 'Resubmit'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
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
        follower_count: Number(fd.get('follower_count')) || 0,
        avg_live_viewers: Number(fd.get('avg_live_viewers')) || 0,
        engagement_rate: Number(fd.get('engagement_rate')) || 0,
        monthly_impressions: Number(fd.get('monthly_impressions')) || 0,
        twitch_url: fd.get('twitch_url') as string || null,
        kick_url: fd.get('kick_url') as string || null,
        youtube_url: fd.get('youtube_url') as string || null,
        twitter_url: fd.get('twitter_url') as string || null,
        instagram_url: fd.get('instagram_url') as string || null,
        tiktok_url: fd.get('tiktok_url') as string || null,
        discord_url: fd.get('discord_url') as string || null,
        wallet_address: fd.get('wallet_address') as string || null,
        preferred_crypto: fd.get('preferred_crypto') as string || 'USDT',
      });
      toast({ title: 'Profile updated' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">
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

            <div className="border-t border-border pt-4 mt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" />Performance Stats</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Followers</Label>
                  <Input name="follower_count" type="number" defaultValue={profile?.follower_count || 0} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Avg Live Viewers</Label>
                  <Input name="avg_live_viewers" type="number" defaultValue={profile?.avg_live_viewers || 0} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Engagement Rate (%)</Label>
                  <Input name="engagement_rate" type="number" step="0.1" defaultValue={profile?.engagement_rate || 0} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Monthly Impressions</Label>
                  <Input name="monthly_impressions" type="number" defaultValue={profile?.monthly_impressions || 0} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2"><Label>Bio</Label><Textarea name="bio" defaultValue={profile?.bio || ''} rows={3} /></div>
              <div className="space-y-2"><Label>Platforms</Label><div className="flex gap-2">{(profile?.platforms || []).map(p => <span key={p} className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{p}</span>)}</div></div>
              
              <div className="border-t border-border pt-4 mt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Globe className="h-4 w-4" />Platform Links</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label className="text-xs">Twitch URL</Label><Input name="twitch_url" defaultValue={profile?.twitch_url || ''} placeholder="https://twitch.tv/..." /></div>
                  <div className="space-y-1"><Label className="text-xs">Kick URL</Label><Input name="kick_url" defaultValue={profile?.kick_url || ''} placeholder="https://kick.com/..." /></div>
                  <div className="space-y-1"><Label className="text-xs">YouTube URL</Label><Input name="youtube_url" defaultValue={profile?.youtube_url || ''} placeholder="https://youtube.com/..." /></div>
                  <div className="space-y-1"><Label className="text-xs">TikTok URL</Label><Input name="tiktok_url" defaultValue={profile?.tiktok_url || ''} placeholder="https://tiktok.com/@..." /></div>
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" />Social Media</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label className="text-xs">Twitter / X</Label><Input name="twitter_url" defaultValue={profile?.twitter_url || ''} placeholder="https://x.com/..." /></div>
                  <div className="space-y-1"><Label className="text-xs">Instagram</Label><Input name="instagram_url" defaultValue={profile?.instagram_url || ''} placeholder="https://instagram.com/..." /></div>
                  <div className="space-y-1"><Label className="text-xs">Discord</Label><Input name="discord_url" defaultValue={profile?.discord_url || ''} placeholder="https://discord.gg/..." /></div>
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">💰 Crypto Payment</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><Label className="text-xs">Wallet Address</Label><Input name="wallet_address" defaultValue={profile?.wallet_address || ''} placeholder="0x... or bc1..." /></div>
                  <div className="space-y-1"><Label className="text-xs">Preferred Crypto</Label><Input name="preferred_crypto" defaultValue={profile?.preferred_crypto || 'USDT'} placeholder="USDT, BTC, ETH" /></div>
                </div>
              </div>

              <div className="space-y-2"><Label>Audience Geo</Label><Input name="audience_geo" defaultValue={(profile?.audience_geo || []).join(', ')} /></div>
              <div className="space-y-2"><Label>Payment Preference</Label><Input name="payment_preference" defaultValue={profile?.payment_preference || ''} /></div>
              <div className="space-y-2"><Label>Restricted Countries</Label><Input name="restricted_countries" defaultValue={(profile?.restricted_countries || []).join(', ')} /></div>
            </div>
          </div>
        </form>

        <KycSection />
      </div>
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6">
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

        <KycSection />
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;

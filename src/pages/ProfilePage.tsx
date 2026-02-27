import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { mockStreamerProfiles, mockCasinoProfiles } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/StatusBadge';
import { Globe, Users, Eye, TrendingUp, Shield } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  if (user?.role === 'streamer') {
    const profile = mockStreamerProfiles.find(p => p.userId === user.id) || mockStreamerProfiles[0];
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Streamer Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your public profile for casino partners</p>
            </div>
            <Button className="bg-gradient-brand hover:opacity-90">Save Changes</Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand text-xl font-bold text-primary-foreground">
                {profile.displayName[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile.displayName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {profile.verified && <span className="inline-flex items-center gap-1 text-xs text-success"><Shield className="h-3 w-3" />Verified</span>}
                  <span className="text-xs text-muted-foreground">{profile.nicheType}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-muted p-3 text-center">
                <Users className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="mt-1 text-lg font-bold">{(profile.followerCount / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <Eye className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="mt-1 text-lg font-bold">{profile.avgLiveViewers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Avg Viewers</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="mt-1 text-lg font-bold">{profile.engagementRate}%</p>
                <p className="text-xs text-muted-foreground">Engagement</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <Globe className="h-4 w-4 mx-auto text-muted-foreground" />
                <p className="mt-1 text-lg font-bold">{(profile.monthlyImpressions / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-muted-foreground">Impressions/mo</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2"><Label>Bio</Label><Textarea defaultValue={profile.bio} rows={3} /></div>
              <div className="space-y-2"><Label>Platforms</Label><div className="flex gap-2">{profile.platforms.map(p => <span key={p} className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">{p}</span>)}</div></div>
              <div className="space-y-2"><Label>Audience Geo</Label><Input defaultValue={profile.audienceGeo.join(', ')} /></div>
              <div className="space-y-2"><Label>Payment Preference</Label><Input defaultValue={profile.paymentPreference} /></div>
              <div className="space-y-2"><Label>Restricted Countries</Label><Input defaultValue={profile.restrictedCountries.join(', ')} /></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Casino profile
  const profile = mockCasinoProfiles.find(p => p.userId === user?.id) || mockCasinoProfiles[0];
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Casino Profile</h1>
            <p className="text-sm text-muted-foreground">Manage your brand profile and affiliate terms</p>
          </div>
          <Button className="bg-gradient-brand hover:opacity-90">Save Changes</Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand text-xl font-bold text-primary-foreground">
              {profile.brandName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile.brandName}</h2>
              <div className="flex items-center gap-2 mt-1">
                {profile.verified && <span className="inline-flex items-center gap-1 text-xs text-success"><Shield className="h-3 w-3" />Verified</span>}
                <span className="text-xs text-muted-foreground">{profile.licenseJurisdiction}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2"><Label>Brand Name</Label><Input defaultValue={profile.brandName} /></div>
            <div className="space-y-2"><Label>License Jurisdiction</Label><Input defaultValue={profile.licenseJurisdiction} /></div>
            <div className="space-y-2"><Label>Website</Label><Input defaultValue={profile.website} /></div>
            <div className="space-y-2"><Label>Affiliate Terms</Label><StatusBadge status={profile.affiliateTerms} /></div>
            <div className="space-y-2"><Label>Accepted Countries</Label><Input defaultValue={profile.acceptedCountries.join(', ')} /></div>
            <div className="space-y-2"><Label>Restricted Territories</Label><Input defaultValue={profile.restrictedTerritories.join(', ')} /></div>
            <div className="space-y-2"><Label>Payment Terms</Label><Input defaultValue={profile.paymentTerms} /></div>
            <div className="space-y-2"><Label>Marketing Guidelines</Label><Textarea defaultValue={profile.marketingGuidelines} rows={3} /></div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;

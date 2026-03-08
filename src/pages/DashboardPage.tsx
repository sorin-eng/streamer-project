import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ProfileCompleteness } from '@/components/ProfileCompleteness';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { useDashboardStats, useCampaigns, useDeals, useStreamerListings, useStreamerProfile } from '@/hooks/useSupabaseData';
import { useComplianceStatus } from '@/hooks/useCompliance';
import { Megaphone, Handshake, DollarSign, Users, TrendingUp, Tag, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { DealWithRelations, CampaignWithOrg } from '@/types/supabase-joins';

const CasinoDashboard = () => {
  const { data: stats } = useDashboardStats();
  const { data: campaigns } = useCampaigns();
  const { data: deals } = useDeals();

  const hasNoCampaigns = !campaigns?.length;
  const hasNoDeals = !deals?.length;
  const showWelcome = hasNoCampaigns && hasNoDeals;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Casino Dashboard</h1>
        <p className="text-sm text-muted-foreground">Find streamers and manage partnerships</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Campaigns" value={stats?.activeCampaigns ?? 0} icon={<Megaphone className="h-5 w-5" />} />
        <StatCard label="Active Deals" value={stats?.activeDeals ?? 0} icon={<Handshake className="h-5 w-5" />} />
        <StatCard label="Total Spend" value={`$${(stats?.totalSpend ?? 0).toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="Applications" value={stats?.applicationCount ?? 0} icon={<Users className="h-5 w-5" />} />
      </div>

      {showWelcome && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.03] p-8 text-center space-y-3">
          <h2 className="text-xl font-bold">Welcome to Castreamino! 🎉</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Start by browsing verified streamers — view their stats, listings, and reach out directly to start a partnership.
          </p>
          <Link to="/streamers">
            <Button className="bg-gradient-brand hover:opacity-90 mt-2">
              <Search className="mr-2 h-4 w-4" />Browse Streamers
            </Button>
          </Link>
        </div>
      )}

      {!showWelcome && (
        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Discover Streamers</h2>
            <p className="text-sm text-muted-foreground">Browse verified streamers, view their listings, and reach out directly.</p>
          </div>
          <Link to="/streamers"><Button className="bg-gradient-brand hover:opacity-90"><Search className="mr-2 h-4 w-4" />Browse Streamers</Button></Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Campaigns</h2>
            <Link to="/campaigns"><Button variant="ghost" size="sm">View All</Button></Link>
          </div>
          <div className="space-y-3">
            {(campaigns || []).slice(0, 3).map((c: CampaignWithOrg) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">${Number(c.budget || 0).toLocaleString()}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
            {(!campaigns || campaigns.length === 0) && <p className="text-sm text-muted-foreground">No campaigns yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StreamerDashboard = () => {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: deals } = useDeals();
  const { data: listings } = useStreamerListings(user?.id);
  const { data: profile } = useStreamerProfile(user?.id);
  const { data: compliance } = useComplianceStatus();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  const needsOnboarding = profile !== undefined && !profile?.bio && (!listings || listings.length === 0);
  if (showOnboarding === null && needsOnboarding) {
    setTimeout(() => setShowOnboarding(true), 300);
  }

  const typedDeals = (deals || []) as DealWithRelations[];

  return (
    <div className="space-y-6 animate-fade-in">
      {showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}

      <div>
        <h1 className="text-2xl font-bold">Streamer Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your listings and partnerships</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Listings" value={listings?.filter(l => l.status === 'active').length ?? 0} icon={<Tag className="h-5 w-5" />} />
        <StatCard label="Active Deals" value={stats?.activeDeals ?? 0} icon={<Handshake className="h-5 w-5" />} />
        <StatCard label="Total Earnings" value={`$${(stats?.totalEarnings ?? 0).toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="Open Campaigns" value={stats?.openCampaigns ?? 0} icon={<Megaphone className="h-5 w-5" />} />
      </div>

      <ProfileCompleteness
        profile={profile ?? null}
        listingsCount={listings?.length ?? 0}
        kycStatus={compliance?.kyc_status || 'unverified'}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">My Listings</h2>
            <Link to="/listings"><Button variant="ghost" size="sm">Manage</Button></Link>
          </div>
          <div className="space-y-3">
            {(listings || []).slice(0, 3).map(l => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{l.price_amount} {l.price_currency} · {l.pricing_type?.replace('_', ' ')}</p>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
            {(!listings || listings.length === 0) && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">No listings yet</p>
                <Link to="/listings"><Button size="sm" className="bg-gradient-brand hover:opacity-90">Create Listing</Button></Link>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">My Deals</h2>
            <Link to="/deals"><Button variant="ghost" size="sm">View All</Button></Link>
          </div>
          <div className="space-y-3">
            {typedDeals.slice(0, 3).map((d: DealWithRelations) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{d.campaigns?.title || 'Direct Deal'}</p>
                  <p className="text-xs text-muted-foreground">{d.organizations?.name} · ${Number(d.value).toLocaleString()}</p>
                </div>
                <StatusBadge status={d.state} />
              </div>
            ))}
            {typedDeals.length === 0 && <p className="text-sm text-muted-foreground">No deals yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { data: stats } = useDashboardStats();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview and management</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active Campaigns" value={stats?.activeCampaigns ?? 0} icon={<Megaphone className="h-5 w-5" />} />
        <StatCard label="Active Deals" value={stats?.activeDeals ?? 0} icon={<Handshake className="h-5 w-5" />} />
        <StatCard label="Platform Revenue" value={`$${(stats?.platformRevenue ?? 0).toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Campaigns" value={stats?.totalCampaigns ?? 0} icon={<Megaphone className="h-5 w-5" />} />
        <StatCard label="Total Deals" value={stats?.totalDeals ?? 0} icon={<Handshake className="h-5 w-5" />} />
        <StatCard label="Pending Verifications" value={stats?.pendingVerifications ?? 0} icon={<Shield className="h-5 w-5" />} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/admin/verifications">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow cursor-pointer">
            <h3 className="font-semibold mb-1">Verifications</h3>
            <p className="text-sm text-muted-foreground">Review pending KYC documents</p>
          </div>
        </Link>
        <Link to="/admin/audit">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow cursor-pointer">
            <h3 className="font-semibold mb-1">Audit Log</h3>
            <p className="text-sm text-muted-foreground">Track all platform activity</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      {user?.role === 'casino_manager' && <CasinoDashboard />}
      {user?.role === 'streamer' && <StreamerDashboard />}
      {user?.role === 'admin' && <AdminDashboard />}
    </DashboardLayout>
  );
};

export default DashboardPage;

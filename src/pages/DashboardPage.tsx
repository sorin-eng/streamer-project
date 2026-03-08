import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useDashboardStats, useCampaigns, useDeals, useApplications, useStreamerListings } from '@/hooks/useSupabaseData';
import { Megaphone, Handshake, DollarSign, Users, TrendingUp, Eye, Tag, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CasinoDashboard = () => {
  const { data: stats } = useDashboardStats();
  const { data: campaigns } = useCampaigns();

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

      {/* Browse Streamers CTA */}
      <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-6 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Discover Streamers</h2>
          <p className="text-sm text-muted-foreground">Browse verified streamers, view their listings, and reach out directly.</p>
        </div>
        <Link to="/streamers"><Button className="bg-gradient-brand hover:opacity-90"><Search className="mr-2 h-4 w-4" />Browse Streamers</Button></Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Campaigns</h2>
            <Link to="/campaigns"><Button variant="ghost" size="sm">View All</Button></Link>
          </div>
          <div className="space-y-3">
            {(campaigns || []).slice(0, 3).map(c => (
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
  const { data: stats } = useDashboardStats();
  const { data: deals } = useDeals();
  const { data: campaigns } = useCampaigns();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Streamer Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your partnerships and opportunities</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Active Deals" value={stats?.activeDeals ?? 0} icon={<Handshake className="h-5 w-5" />} />
        <StatCard label="Total Earnings" value={`$${(stats?.totalEarnings ?? 0).toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="Open Campaigns" value={stats?.openCampaigns ?? 0} icon={<Megaphone className="h-5 w-5" />} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">My Deals</h2>
            <Link to="/deals"><Button variant="ghost" size="sm">View All</Button></Link>
          </div>
          <div className="space-y-3">
            {(deals || []).slice(0, 3).map(d => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{(d.campaigns as any)?.title}</p>
                  <p className="text-xs text-muted-foreground">{(d.organizations as any)?.name} · ${Number(d.value).toLocaleString()}</p>
                </div>
                <StatusBadge status={d.state} />
              </div>
            ))}
            {(!deals || deals.length === 0) && <p className="text-sm text-muted-foreground">No deals yet</p>}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Open Campaigns</h2>
            <Link to="/campaigns"><Button variant="ghost" size="sm">Browse All</Button></Link>
          </div>
          <div className="space-y-3">
            {(campaigns || []).filter(c => c.status === 'open').slice(0, 3).map(c => (
              <Link key={c.id} to="/campaigns" className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{(c.organizations as any)?.name} · {c.target_geo?.join(', ')}</p>
                </div>
                <StatusBadge status={c.deal_type} />
              </Link>
            ))}
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
        <StatCard label="Campaigns" value={stats?.totalCampaigns ?? 0} icon={<Megaphone className="h-5 w-5" />} />
        <StatCard label="Deals" value={stats?.totalDeals ?? 0} icon={<Handshake className="h-5 w-5" />} />
        <StatCard label="Platform Revenue" value={`$${(stats?.platformRevenue ?? 0).toLocaleString()}`} icon={<TrendingUp className="h-5 w-5" />} />
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

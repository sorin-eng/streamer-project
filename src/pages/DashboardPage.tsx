import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { mockCampaigns, mockDeals, mockApplications } from '@/data/mockData';
import { Megaphone, Handshake, DollarSign, Users, TrendingUp, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CasinoDashboard = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold">Casino Dashboard</h1>
      <p className="text-sm text-muted-foreground">Manage campaigns and streamer partnerships</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Active Campaigns" value={2} change="+1 this month" trend="up" icon={<Megaphone className="h-5 w-5" />} />
      <StatCard label="Active Deals" value={1} change="Stable" trend="neutral" icon={<Handshake className="h-5 w-5" />} />
      <StatCard label="Total Spend" value="$43,000" change="+18%" trend="up" icon={<DollarSign className="h-5 w-5" />} />
      <StatCard label="Applications" value={11} change="+3 new" trend="up" icon={<Users className="h-5 w-5" />} />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Campaigns</h2>
          <Link to="/campaigns"><Button variant="ghost" size="sm">View All</Button></Link>
        </div>
        <div className="space-y-3">
          {mockCampaigns.slice(0, 3).map(c => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.applicationsCount} applications · ${c.budget.toLocaleString()}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Applications</h2>
          <Link to="/campaigns"><Button variant="ghost" size="sm">View All</Button></Link>
        </div>
        <div className="space-y-3">
          {mockApplications.slice(0, 3).map(a => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {a.streamerName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{a.streamerName}</p>
                  <p className="text-xs text-muted-foreground">{a.avgViewers} avg viewers</p>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const StreamerDashboard = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold">Streamer Dashboard</h1>
      <p className="text-sm text-muted-foreground">Your partnerships and opportunities</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Active Deals" value={1} change="1 in negotiation" trend="neutral" icon={<Handshake className="h-5 w-5" />} />
      <StatCard label="Total Earnings" value="$12,400" change="+22%" trend="up" icon={<DollarSign className="h-5 w-5" />} />
      <StatCard label="Open Campaigns" value={2} change="New this week" trend="up" icon={<Megaphone className="h-5 w-5" />} />
      <StatCard label="Avg Viewers" value="3,200" change="+8%" trend="up" icon={<Eye className="h-5 w-5" />} />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">My Deals</h2>
          <Link to="/deals"><Button variant="ghost" size="sm">View All</Button></Link>
        </div>
        <div className="space-y-3">
          {mockDeals.map(d => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{d.campaignTitle}</p>
                <p className="text-xs text-muted-foreground">{d.casinoBrand} · ${d.value.toLocaleString()}</p>
              </div>
              <StatusBadge status={d.status} />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recommended Campaigns</h2>
          <Link to="/campaigns"><Button variant="ghost" size="sm">Browse All</Button></Link>
        </div>
        <div className="space-y-3">
          {mockCampaigns.filter(c => c.status === 'open').map(c => (
            <Link key={c.id} to="/campaigns" className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
              <div>
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.casinoBrand} · {c.targetGeo.join(', ')}</p>
              </div>
              <StatusBadge status={c.dealType} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => (
  <div className="space-y-6 animate-fade-in">
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground">Platform overview and management</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Users" value={6} change="+2 this week" trend="up" icon={<Users className="h-5 w-5" />} />
      <StatCard label="Active Campaigns" value={3} icon={<Megaphone className="h-5 w-5" />} />
      <StatCard label="Active Deals" value={2} icon={<Handshake className="h-5 w-5" />} />
      <StatCard label="Platform Revenue" value="$4,300" change="+12%" trend="up" icon={<TrendingUp className="h-5 w-5" />} />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-semibold mb-4">Pending Verifications</h2>
        <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
          <p className="text-sm font-medium">MaxBet Live</p>
          <p className="text-xs text-muted-foreground">Streamer · Missing license documentation</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="bg-gradient-brand hover:opacity-90 text-xs">Review</Button>
            <Button size="sm" variant="outline" className="text-xs">Flag</Button>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-semibold mb-4">Platform Health</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Verified Users</span><span className="font-medium">4/6</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Deals This Month</span><span className="font-medium">2</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg Deal Value</span><span className="font-medium">$21,500</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Dispute Rate</span><span className="font-medium text-success">0%</span></div>
        </div>
      </div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  return (
    <DashboardLayout>
      {user?.role === 'casino' && <CasinoDashboard />}
      {user?.role === 'streamer' && <StreamerDashboard />}
      {user?.role === 'admin' && <AdminDashboard />}
    </DashboardLayout>
  );
};

export default DashboardPage;

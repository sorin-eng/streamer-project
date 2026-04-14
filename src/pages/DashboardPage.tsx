import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Handshake,
  Megaphone,
  Shield,
  Tag,
  Users,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ProfileCompleteness } from '@/components/ProfileCompleteness';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import {
  useApplications,
  useCampaigns,
  useCommissions,
  useDashboardStats,
  useDeals,
  useStreamerListings,
  useStreamerProfile,
} from '@/hooks/useSupabaseData';
import { useComplianceStatus } from '@/hooks/useCompliance';
import { Button } from '@/components/ui/button';
import type { CampaignWithOrg, CommissionWithDeal, DealWithRelations } from '@/types/supabase-joins';

interface WorkflowCardProps {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  to: string;
  primary?: boolean;
}

const WorkflowCard = ({ eyebrow, title, description, ctaLabel, to, primary = false }: WorkflowCardProps) => (
  <div className={`rounded-xl border p-5 shadow-card space-y-3 ${primary ? 'border-primary/30 bg-primary/[0.04]' : 'border-border bg-card'}`}>
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
    <div className="space-y-1">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Link to={to}>
      <Button className={primary ? 'bg-gradient-brand hover:opacity-90' : ''} variant={primary ? 'default' : 'outline'}>
        {ctaLabel}
      </Button>
    </Link>
  </div>
);

const CasinoDashboard = () => {
  const { data: stats } = useDashboardStats();
  const { data: campaigns } = useCampaigns();
  const { data: deals } = useDeals();
  const { data: applications } = useApplications();

  const typedCampaigns = (campaigns || []) as CampaignWithOrg[];
  const typedDeals = (deals || []) as DealWithRelations[];
  const pendingApplications = (applications || []).filter((application) => application.status === 'pending').length;
  const dealsWaiting = typedDeals.filter((deal) => deal.state === 'negotiation' || deal.state === 'contract_pending').length;
  const liveDeals = typedDeals.filter((deal) => deal.state === 'active').length;
  const recentDeals = typedDeals.slice(0, 3);
  const recentCampaigns = typedCampaigns.slice(0, 3);

  const primaryAction = useMemo(() => {
    if (pendingApplications > 0 || dealsWaiting > 0) {
      return {
        title: 'Move inbound interest into real partnerships',
        description: `${pendingApplications} pending application${pendingApplications === 1 ? '' : 's'} and ${dealsWaiting} deal${dealsWaiting === 1 ? '' : 's'} waiting on negotiation or contract work.`,
        ctaLabel: 'Open Deals',
        to: '/deals',
      };
    }

    if (liveDeals > 0) {
      return {
        title: 'Close the loop on live partnerships',
        description: `${liveDeals} active deal${liveDeals === 1 ? '' : 's'} ready for report uploads and commission tracking.`,
        ctaLabel: 'Open Reports',
        to: '/reports',
      };
    }

    return {
      title: 'Start with streamer discovery',
      description: 'Browse streamers, inspect listings, and open a direct inquiry. That is the real front door of the MVP.',
      ctaLabel: 'Browse Streamers',
      to: '/streamers',
    };
  }, [dealsWaiting, liveDeals, pendingApplications]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Casino Dashboard</h1>
        <p className="text-sm text-muted-foreground">Keep the MVP focused on discovery, deals, contracts, and reporting.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open Deals" value={stats?.activeDeals ?? 0} icon={<Handshake className="h-5 w-5" />} />
        <StatCard label="Waiting on You" value={dealsWaiting + pendingApplications} icon={<AlertCircle className="h-5 w-5" />} />
        <StatCard label="Live Partnerships" value={liveDeals} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Pending Applications" value={pendingApplications} icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5 shadow-card space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Core workflow</p>
        <h2 className="font-semibold text-lg">Browse streamers, open a deal, lock terms, then upload reports.</h2>
        <p className="text-sm text-muted-foreground">
          Campaigns can help collect applications, but the real product lives in Deals, Contracts, and Reports.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <WorkflowCard
          eyebrow="Do this next"
          title={primaryAction.title}
          description={primaryAction.description}
          ctaLabel={primaryAction.ctaLabel}
          to={primaryAction.to}
          primary
        />
        <WorkflowCard
          eyebrow="Step 1"
          title="Find streamers worth contacting"
          description="Browse profiles, listings, stats, and geo fit before you start a partnership conversation."
          ctaLabel="Browse Streamers"
          to="/streamers"
        />
        <WorkflowCard
          eyebrow="Step 2"
          title="Keep active work inside Deals"
          description="Applications, negotiations, contract progress, and disputes should all converge in the same pipeline."
          ctaLabel="Open Deals"
          to="/deals"
        />
        <WorkflowCard
          eyebrow="Step 3"
          title="Upload reports and track commissions"
          description="Once a deal is live, Reports is where execution turns into commission visibility."
          ctaLabel="Open Reports"
          to="/reports"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent deals</h2>
            <Link to="/deals"><Button variant="ghost" size="sm">View Deals</Button></Link>
          </div>
          <div className="space-y-3">
            {recentDeals.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{deal.campaigns?.title || 'Direct Deal'}</p>
                  <p className="text-xs text-muted-foreground">{deal.profiles?.display_name} · ${Number(deal.value).toLocaleString()}</p>
                </div>
                <StatusBadge status={deal.state} />
              </div>
            ))}
            {recentDeals.length === 0 && <p className="text-sm text-muted-foreground">No deals yet. Start by browsing streamers and opening an inquiry.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Campaigns are optional intake</h2>
            <Link to="/campaigns"><Button variant="ghost" size="sm">View Campaigns</Button></Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Use campaigns when you want structured applications. After that, the real work should move into Deals.
          </p>
          <div className="space-y-3">
            {recentCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{campaign.title}</p>
                  <p className="text-xs text-muted-foreground">${Number(campaign.budget || 0).toLocaleString()} · {campaign.target_geo?.join(', ') || 'Global'}</p>
                </div>
                <StatusBadge status={campaign.status} />
              </div>
            ))}
            {recentCampaigns.length === 0 && <p className="text-sm text-muted-foreground">No campaigns yet. That is fine. The MVP still works through direct streamer outreach.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

const StreamerDashboard = () => {
  const { user } = useAuth();
  const { data: deals } = useDeals();
  const { data: listings } = useStreamerListings(user?.id);
  const { data: profile } = useStreamerProfile(user?.id);
  const { data: compliance } = useComplianceStatus();
  const { data: commissions } = useCommissions();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const typedDeals = (deals || []) as DealWithRelations[];
  const typedCommissions = (commissions || []) as CommissionWithDeal[];
  const pendingResponses = typedDeals.filter((deal) => deal.state === 'inquiry' || deal.state === 'contract_pending').length;
  const activeDeals = typedDeals.filter((deal) => deal.state === 'active').length;

  const completionChecklist = useMemo(() => {
    return [
      { label: 'Add your bio', done: !!profile?.bio, route: '/profile' },
      { label: 'Add platform links', done: (profile?.platforms?.length || 0) > 0, route: '/profile' },
      { label: 'Add audience stats', done: (profile?.follower_count || 0) > 0, route: '/profile' },
      { label: 'Create first listing', done: (listings || []).length > 0, route: '/listings' },
      { label: 'Submit KYC', done: !!(compliance?.kyc_status && compliance.kyc_status !== 'unverified'), route: '/profile' },
    ];
  }, [compliance?.kyc_status, listings, profile?.bio, profile?.follower_count, profile?.platforms?.length]);

  const completionRate = useMemo(() => {
    const completed = completionChecklist.filter((item) => item.done).length;
    return Math.round((completed / completionChecklist.length) * 100);
  }, [completionChecklist]);

  const onboardingNeeded = useMemo(() => {
    return profile !== undefined && !profile?.bio && (!listings || listings.length === 0);
  }, [profile, listings]);

  useEffect(() => {
    if (onboardingNeeded) {
      const timer = setTimeout(() => setShowOnboarding(true), 300);
      return () => clearTimeout(timer);
    }
    setShowOnboarding(false);
    return undefined;
  }, [onboardingNeeded]);

  const primaryAction = useMemo(() => {
    const nextIncomplete = completionChecklist.find((item) => !item.done);

    if (nextIncomplete) {
      return {
        title: 'Finish setup so casinos can actually book you',
        description: `Your fastest path into the marketplace is still: ${nextIncomplete.label.toLowerCase()}.`,
        ctaLabel: 'Complete setup',
        to: nextIncomplete.route,
      };
    }

    if (pendingResponses > 0) {
      return {
        title: 'Respond to deal activity waiting on you',
        description: `${pendingResponses} deal${pendingResponses === 1 ? '' : 's'} need a response, contract signature, or next-step decision.`,
        ctaLabel: 'Review Deals',
        to: '/deals',
      };
    }

    if (activeDeals > 0) {
      return {
        title: 'Track active work and commission status',
        description: `${activeDeals} live deal${activeDeals === 1 ? '' : 's'} already running. Keep an eye on reports and commission visibility.`,
        ctaLabel: 'Check Commissions',
        to: '/reports',
      };
    }

    return {
      title: 'Keep your listing sharp for new inquiries',
      description: 'Once your setup is done, the job is to stay discoverable and convert attention into deals.',
      ctaLabel: 'Manage Listings',
      to: '/listings',
    };
  }, [activeDeals, completionChecklist, pendingResponses]);

  return (
    <div className="space-y-6 animate-fade-in">
      {showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}

      <div>
        <h1 className="text-2xl font-bold">Streamer Dashboard</h1>
        <p className="text-sm text-muted-foreground">Move from setup to deals to commissions without getting lost in fluff.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Profile Ready" value={`${completionRate}%`} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Active Listings" value={listings?.filter((listing) => listing.status === 'active').length ?? 0} icon={<Tag className="h-5 w-5" />} />
        <StatCard label="Waiting on You" value={pendingResponses} icon={<AlertCircle className="h-5 w-5" />} />
        <StatCard label="Commission Records" value={typedCommissions.length} icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5 shadow-card space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Core workflow</p>
        <h2 className="font-semibold text-lg">Finish setup, get discovered, respond to deals, sign contracts, then track commissions.</h2>
        <p className="text-sm text-muted-foreground">
          That is the product. Everything else should support that path instead of distracting from it.
        </p>
      </div>

      <ProfileCompleteness
        profile={profile ?? null}
        listingsCount={listings?.length ?? 0}
        kycStatus={compliance?.kyc_status || 'unverified'}
      />

      {completionRate < 100 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold mb-3">Finish onboarding</h2>
          <div className="space-y-2">
            {completionChecklist.map((item, idx) => {
              if (item.done) return null;
              return (
                <Link key={item.label + idx} to={item.route} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/40">
                  <span>{item.label}</span>
                  <span className="text-xs text-primary">Complete now</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold">Your workflow</h2>
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <WorkflowCard
            eyebrow="Do this next"
            title={primaryAction.title}
            description={primaryAction.description}
            ctaLabel={primaryAction.ctaLabel}
            to={primaryAction.to}
            primary
          />
          <WorkflowCard
            eyebrow="Step 1"
            title="Keep your listing marketable"
            description="Listings are the product card casinos judge before they ever open a deal with you."
            ctaLabel="Manage listings"
            to="/listings"
          />
          <WorkflowCard
            eyebrow="Step 2"
            title="Review deals and contract requests"
            description="Inquiries, negotiations, and signatures should all funnel through the same deal pipeline."
            ctaLabel="Review deals"
            to="/deals"
          />
          <WorkflowCard
            eyebrow="Step 3"
            title="Check commissions and payout status"
            description="Once work is live, Reports is where performance and earnings become visible."
            ctaLabel="Check commissions"
            to="/reports"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">My Listings</h2>
            <Link to="/listings"><Button variant="ghost" size="sm">Manage</Button></Link>
          </div>
          <div className="space-y-3">
            {(listings || []).slice(0, 3).map((listing) => (
              <div key={listing.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{listing.title}</p>
                  <p className="text-xs text-muted-foreground">{listing.price_amount} {listing.price_currency} · {listing.pricing_type?.replace('_', ' ')}</p>
                </div>
                <StatusBadge status={listing.status} />
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
            {typedDeals.slice(0, 3).map((deal) => (
              <div key={deal.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{deal.campaigns?.title || 'Direct Deal'}</p>
                  <p className="text-xs text-muted-foreground">{deal.organizations?.name} · ${Number(deal.value).toLocaleString()}</p>
                </div>
                <StatusBadge status={deal.state} />
              </div>
            ))}
            {typedDeals.length === 0 && <p className="text-sm text-muted-foreground">No deals yet. Keep your profile and listings ready for inquiries.</p>}
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
        <p className="text-sm text-muted-foreground">Keep compliance, moderation, and audit visibility clean while the MVP stays small.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending Verifications" value={stats?.pendingVerifications ?? 0} icon={<Shield className="h-5 w-5" />} />
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Active Deals" value={stats?.activeDeals ?? 0} icon={<Handshake className="h-5 w-5" />} />
        <StatCard label="Active Campaigns" value={stats?.activeCampaigns ?? 0} icon={<Megaphone className="h-5 w-5" />} />
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5 shadow-card space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Admin focus</p>
        <h2 className="font-semibold text-lg">For MVP, trust surfaces matter more than vanity analytics.</h2>
        <p className="text-sm text-muted-foreground">
          Review KYC, keep user state sane, and preserve a clear audit trail. That is enough for now.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <WorkflowCard
          eyebrow="Compliance"
          title="Review pending KYC"
          description="Handle the trust gate first so legitimate users can move through the product cleanly."
          ctaLabel="Open verifications"
          to="/admin/verifications"
          primary
        />
        <WorkflowCard
          eyebrow="Moderation"
          title="Check user state"
          description="Role changes and suspensions should stay deliberate and visible, not buried in a generic admin shell."
          ctaLabel="Open users"
          to="/admin/users"
        />
        <WorkflowCard
          eyebrow="Audit"
          title="Review platform activity"
          description="Use the audit log to inspect sensitive actions and confirm the system is behaving intentionally."
          ctaLabel="Open audit log"
          to="/admin/audit"
        />
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

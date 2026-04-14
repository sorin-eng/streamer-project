import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useDeals, useApplications, useUpdateApplicationStatus, useRespondToInquiry, useCreateReview, useAcceptApplicationToDeal, useAdvanceDealState, useCancelDeal, useDisputeDeal } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Handshake, DollarSign, Calendar, ArrowRight, CheckCircle2, XCircle, FileText, Ban, AlertTriangle, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SearchBar, PaginationControls } from '@/components/SearchPagination';
import { ContractBuilder } from '@/components/ContractBuilder';
import { StarRating } from '@/components/StarRating';
import type { DealWithRelations, ApplicationWithProfile } from '@/types/supabase-joins';
import { useQueryClient } from '@tanstack/react-query';
import { DealsSkeleton } from '@/components/PageSkeletons';
import { DashboardChartCard } from '@/components/dashboard/DashboardCharts';

const PAGE_SIZE = 20;

const NEXT_STATES: Record<string, string> = {
  active: 'completed',
};

const DEAL_STAGE_ORDER: DealWithRelations['state'][] = [
  'inquiry',
  'negotiation',
  'contract_pending',
  'active',
  'completed',
];

function getDealStageMeta(state: DealWithRelations['state']) {
  if (state === 'cancelled') return { progress: 100, tone: 'text-destructive', label: 'Deal cancelled' };
  if (state === 'disputed') return { progress: 85, tone: 'text-warning', label: 'Needs dispute resolution' };

  const index = DEAL_STAGE_ORDER.indexOf(state);
  const progress = index >= 0 ? Math.round(((index + 1) / DEAL_STAGE_ORDER.length) * 100) : 0;
  return {
    progress,
    tone: 'text-primary',
    label: `Progress: ${progress}%`,
  };
}

const DealsPage = () => {
  const { user } = useAuth();
  const { data: deals, isLoading } = useDeals();
  const { data: applications } = useApplications();
  const updateAppStatus = useUpdateApplicationStatus();
  const respondToInquiry = useRespondToInquiry();
  const createReview = useCreateReview();
  const acceptApplicationToDeal = useAcceptApplicationToDeal();
  const advanceDealState = useAdvanceDealState();
  const cancelDealMutation = useCancelDeal();
  const disputeDealMutation = useDisputeDeal();
  const { toast } = useToast();
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [showApps, setShowApps] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [contractDeal, setContractDeal] = useState<DealWithRelations | null>(null);
  const [cancelDeal, setCancelDeal] = useState<DealWithRelations | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [disputeDeal, setDisputeDeal] = useState<DealWithRelations | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputing, setDisputing] = useState(false);
  const [reviewDeal, setReviewDeal] = useState<DealWithRelations | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  type DealFilter = 'all' | 'needs_action' | DealWithRelations['state'];

  const isCasino = user?.role === 'casino_manager';
  const pendingApps = (applications || []).filter(a => a.status === 'pending');
  const [stateFilter, setStateFilter] = useState<DealFilter>('all');
  const stateOptions = useMemo(() => {
    const states = Array.from(new Set((deals || []).map((deal) => deal.state))).sort();
    return states;
  }, [deals]);

  const needsActionCount = useMemo(() => {
    if (isCasino) {
      return (deals || []).filter((deal) => deal.state === 'negotiation' || deal.state === 'contract_pending').length;
    }
    return (deals || []).filter((deal) => deal.state === 'inquiry').length;
  }, [deals, isCasino]);

  const stateCounts = useMemo(() => {
    const map: Record<string, number> = { all: (deals || []).length, needs_action: needsActionCount };
    (deals || []).forEach((deal) => {
      map[deal.state] = (map[deal.state] || 0) + 1;
    });
    return map;
  }, [deals, needsActionCount]);

  const activeCount = (deals || []).filter((deal) => deal.state === 'active').length;
  const completedCount = (deals || []).filter((deal) => deal.state === 'completed').length;
  const urgentDeals = (deals || []).filter((deal) => {
    if (isCasino) return deal.state === 'negotiation' || deal.state === 'contract_pending';
    return deal.state === 'inquiry' || deal.state === 'contract_pending';
  }).slice(0, 3);

  // Filter and paginate
  const filtered = (deals || []).filter((d: DealWithRelations) => {
    const actionRelevant = isCasino ? (d.state === 'negotiation' || d.state === 'contract_pending') : d.state === 'inquiry';
    if (stateFilter === 'needs_action' && !actionRelevant) return false;
    if (stateFilter !== 'all' && stateFilter !== 'needs_action' && d.state !== stateFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (d.campaigns?.title || '').toLowerCase().includes(s) ||
      (d.organizations?.name || '').toLowerCase().includes(s) ||
      (d.profiles?.display_name || '').toLowerCase().includes(s) ||
      d.state.toLowerCase().includes(s);
  });
  const totalCount = filtered.length;
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleAcceptApplication = async (app: ApplicationWithProfile) => {
    try {
      await acceptApplicationToDeal.mutateAsync(app);
      toast({ title: 'Application accepted & deal created' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleRejectApplication = async (appId: string) => {
    try {
      await updateAppStatus.mutateAsync({ id: appId, status: 'rejected' });
      toast({ title: 'Application rejected' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const qc = useQueryClient();
  const handleAdvanceState = async (dealId: string, currentState: string) => {
    const nextState = NEXT_STATES[currentState];
    if (!nextState) return;

    setTransitioning(dealId);
    try {
      await advanceDealState.mutateAsync({
        dealId,
        to_state: nextState,
        from_state: currentState,
      });
      toast({ title: `Deal moved to ${nextState.replace('_', ' ')}` });
      qc.invalidateQueries({ queryKey: ['contracts'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setTransitioning(null);
  };

  const handleCancelDeal = async () => {
    if (!cancelDeal) return;
    if (!cancelReason.trim()) {
      toast({ title: 'Cancellation reason required', description: 'Add a short reason so the audit trail is not useless.', variant: 'destructive' });
      return;
    }
    setCancelling(true);
    try {
      await cancelDealMutation.mutateAsync({
        dealId: cancelDeal.id,
        to_state: 'cancelled',
        from_state: cancelDeal.state,
        reason: cancelReason,
      });
      toast({ title: 'Deal cancelled' });
      setCancelDeal(null);
      setCancelReason('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setCancelling(false);
  };

  const handleDisputeDeal = async () => {
    if (!disputeDeal) return;
    setDisputing(true);
    try {
      await disputeDealMutation.mutateAsync({
        dealId: disputeDeal.id,
        to_state: 'disputed',
        from_state: disputeDeal.state,
        reason: disputeReason,
      });
      toast({ title: 'Deal disputed' });
      setDisputeDeal(null);
      setDisputeReason('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setDisputing(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Deals</h1>
            <p className="text-sm text-muted-foreground">Move each partnership from inquiry to signed contract to live delivery.</p>
          </div>
          {isCasino && pendingApps.length > 0 && (
            <Button variant="outline" onClick={() => setShowApps(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {pendingApps.length} Pending Application{pendingApps.length > 1 ? 's' : ''}
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 shadow-card space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Core workflow</p>
          <p className="text-sm text-muted-foreground">Accept the right opportunity, move it into contract, keep execution visible, then hand off to reporting and commissions.</p>
        </div>

        <SearchBar value={search} onChange={v => { setSearch(v); setPage(0); }} placeholder="Search deals or partners..." />

        <div className="flex flex-wrap gap-2">
          <Button
            variant={stateFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStateFilter('all'); setPage(0); }}
          >
            All ({stateCounts.all || 0})
          </Button>
          <Button
            variant={stateFilter === 'needs_action' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStateFilter('needs_action'); setPage(0); }}
          >
            Needs Action ({stateCounts.needs_action || 0})
          </Button>
          {stateOptions.map((state) => (
            <Button
              key={state}
              variant={stateFilter === state ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStateFilter(state); setPage(0); }}
            >
              {state.replace('_', ' ')} ({stateCounts[state] || 0})
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardChartCard title="Total deals" subtitle="Everything in your current pipeline">
            <p className="text-3xl font-bold">{stateCounts.all || 0}</p>
          </DashboardChartCard>
          <DashboardChartCard title="Needs action" subtitle={isCasino ? 'Negotiation and contract work waiting on you' : 'Inquiries or contracts waiting on you'}>
            <p className="text-3xl font-bold text-primary">{needsActionCount}</p>
          </DashboardChartCard>
          <DashboardChartCard title="Active" subtitle="Live partnerships currently running">
            <p className="text-3xl font-bold">{activeCount}</p>
          </DashboardChartCard>
          <DashboardChartCard title="Completed" subtitle="Finished deals you can review or reference">
            <p className="text-3xl font-bold">{completedCount}</p>
          </DashboardChartCard>
        </div>

        {urgentDeals.length > 0 && (
          <DashboardChartCard
            title="Move these next"
            subtitle={isCasino ? 'These are the closest deals to turning into signed work' : 'These are the partnerships most likely to need your response next'}
          >
            <div className="space-y-3">
              {urgentDeals.map((deal) => (
                <div key={deal.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{deal.campaigns?.title || 'Direct Deal'}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.role === 'streamer' ? deal.organizations?.name : deal.profiles?.display_name} · ${Number(deal.value).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={deal.state} />
                    {deal.state !== 'inquiry' && (
                      <Link to={`/messages?deal=${deal.id}`}>
                        <Button size="sm" variant="outline">Open</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DashboardChartCard>
        )}

        {isLoading ? (
          <DealsSkeleton />
        ) : !totalCount ? (
          <EmptyState
            icon={<Handshake className="h-6 w-6" />}
            title={stateFilter === 'all' ? 'No deals yet' : 'No deals match this filter'}
            description={
              stateFilter === 'all'
                ? (isCasino
                    ? 'Start by browsing streamers and opening an inquiry.'
                    : 'Deals will appear here once a casino reaches out or you join a campaign that turns into a partnership.')
                : search || stateFilter !== 'all'
                  ? 'Try a different search term or filter.'
                  : 'No deals are currently in this state.'
            }
            action={isCasino
              ? <Link to="/streamers"><Button className="bg-gradient-brand hover:opacity-90">Browse Streamers</Button></Link>
              : <Link to="/campaigns"><Button className="bg-gradient-brand hover:opacity-90">Browse Campaigns</Button></Link>}
          />
        ) : (
          <div className="space-y-4">
            {paginated.map((deal: DealWithRelations) => {
              const nextState = NEXT_STATES[deal.state];
              const isTerminal = deal.state === 'completed' || deal.state === 'cancelled';
              const stageMeta = getDealStageMeta(deal.state);
              const nextAction =
                deal.state === 'inquiry' && user?.role === 'streamer'
                  ? 'Respond to inquiry'
                  : deal.state === 'negotiation'
                    ? 'Create contract and collect signatures'
                    : deal.state === 'contract_pending'
                      ? 'Finish signatures in the contract step'
                      : deal.state === 'active'
                        ? 'Upload delivery proof and track commissions'
                        : deal.state === 'disputed'
                          ? 'Review dispute'
                          : deal.state === 'completed'
                            ? 'Leave review'
                            : 'No action required';
              return (
                <div key={deal.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Handshake className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{deal.campaigns?.title || 'Direct Deal'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {user?.role === 'streamer' ? deal.organizations?.name : deal.profiles?.display_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={deal.state} />
                      <StatusBadge status={deal.deal_type} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />${Number(deal.value).toLocaleString()}</span>
                    <span className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">Platform fee: {deal.platform_fee_pct}%</span>
                    {deal.start_date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{deal.start_date} → {deal.end_date}</span>}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Next step: {nextAction}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Workflow progress</span>
                      <span className={stageMeta.tone}>{stageMeta.label}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${deal.state === 'cancelled' ? 'bg-destructive' : deal.state === 'disputed' ? 'bg-warning' : 'bg-primary'}`}
                        style={{ width: `${stageMeta.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* Inquiry accept/decline for streamers */}
                    {deal.state === 'inquiry' && user?.role === 'streamer' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-gradient-brand hover:opacity-90"
                          onClick={async () => {
                            try {
                              await respondToInquiry.mutateAsync({ dealId: deal.id, accept: true });
                              toast({ title: 'Inquiry accepted — negotiation started' });
                            } catch (err: unknown) {
                              toast({ title: 'Error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
                            }
                          }}
                          disabled={respondToInquiry.isPending}
                        >
                          <ThumbsUp className="mr-1 h-3 w-3" />Accept Inquiry
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={async () => {
                            try {
                              await respondToInquiry.mutateAsync({ dealId: deal.id, accept: false });
                              toast({ title: 'Inquiry declined' });
                            } catch (err: unknown) {
                              toast({ title: 'Error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
                            }
                          }}
                          disabled={respondToInquiry.isPending}
                        >
                          <ThumbsDown className="mr-1 h-3 w-3" />Decline
                        </Button>
                      </>
                    )}
                    {deal.state !== 'inquiry' && (
                      <Link to={`/messages?deal=${deal.id}`}>
                        <Button size="sm" variant="outline">Messages</Button>
                      </Link>
                    )}
                    {deal.state !== 'inquiry' && (
                      <Link to={`/contracts?deal=${deal.id}`}>
                        <Button size="sm" variant="outline">View Contract</Button>
                      </Link>
                    )}
                    {(deal.state === 'active' || deal.state === 'completed') && (
                      <Link to={`/reports?deal=${deal.id}`}>
                        <Button size="sm" variant="outline">Reports</Button>
                      </Link>
                    )}
                    {isCasino && deal.state === 'negotiation' && (
                      <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={() => setContractDeal(deal)}>
                        <FileText className="mr-1 h-3 w-3" />Create Contract
                      </Button>
                    )}
                    {nextState && deal.state !== 'inquiry' && (
                      <Button
                        size="sm"
                        className="bg-gradient-brand hover:opacity-90"
                        onClick={() => handleAdvanceState(deal.id, deal.state)}
                        disabled={transitioning === deal.id}
                      >
                        {transitioning === deal.id ? 'Processing...' : (
                          <>Mark Completed <ArrowRight className="ml-1 h-3.5 w-3.5" /></>
                        )}
                      </Button>
                    )}
                    {deal.state === 'contract_pending' && (
                      <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs text-primary">
                        Contract is out for signature, the deal goes live once both sides sign
                      </span>
                    )}
                    {deal.state === 'active' && (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                        Live deal, move delivery proof and payouts through reports
                      </span>
                    )}
                    {deal.state === 'disputed' && (
                      <span className="inline-flex items-center rounded-full border border-warning/20 bg-warning/10 px-2.5 py-1 text-xs text-warning">
                        Escalated, review messages and contract details
                      </span>
                    )}
                    {deal.state === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReviewDeal(deal)}
                      >
                        <Star className="mr-1 h-3 w-3" />Leave Review
                      </Button>
                    )}
                    {deal.state === 'active' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-warning hover:text-warning"
                        onClick={() => setDisputeDeal(deal)}
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />Dispute
                      </Button>
                    )}
                    {!isTerminal && deal.state !== 'inquiry' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setCancelDeal(deal)}
                      >
                        <Ban className="mr-1 h-3 w-3" />Cancel
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <PaginationControls page={page} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      {/* Pending Applications Dialog */}
      <Dialog open={showApps} onOpenChange={setShowApps}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pending Applications</DialogTitle>
            <DialogDescription>Review new streamer applications and decide whether to create a deal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingApps.map((app: ApplicationWithProfile) => (
              <div key={app.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                      {app.profiles?.display_name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{app.profiles?.display_name || 'Streamer'}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.streamer_profiles?.avg_live_viewers || 0} avg viewers · {app.streamer_profiles?.follower_count?.toLocaleString() || 0} followers
                      </p>
                    </div>
                  </div>
                </div>
                {app.message && <p className="text-sm text-muted-foreground bg-muted rounded-lg p-2">{app.message}</p>}
                <div className="flex gap-2">
                  <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={() => handleAcceptApplication(app)} disabled={acceptApplicationToDeal.isPending || updateAppStatus.isPending}>
                    <CheckCircle2 className="mr-1 h-3 w-3" />Accept & Create Deal
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRejectApplication(app.id)} disabled={acceptApplicationToDeal.isPending || updateAppStatus.isPending}>
                    <XCircle className="mr-1 h-3 w-3" />Reject
                  </Button>
                </div>
              </div>
            ))}
            {pendingApps.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pending applications</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Deal Dialog */}
      <Dialog open={!!cancelDeal} onOpenChange={open => { if (!open) { setCancelDeal(null); setCancelReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Deal</DialogTitle>
            <DialogDescription>Close this deal and optionally record why it is ending.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel this deal? This action will be logged and the other party will be notified.
            </p>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Why are you cancelling this deal?"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setCancelDeal(null); setCancelReason(''); }}>
                Keep Deal
              </Button>
              <Button variant="destructive" onClick={handleCancelDeal} disabled={cancelling || !cancelReason.trim()}>
                {cancelling ? 'Cancelling...' : 'Cancel Deal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Deal Dialog */}
      <Dialog open={!!disputeDeal} onOpenChange={open => { if (!open) { setDisputeDeal(null); setDisputeReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dispute Deal</DialogTitle>
            <DialogDescription>Flag the deal for review and notify the other side that there is an issue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Raise a dispute for this deal. The other party and platform admins will be notified.
            </p>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                placeholder="Describe the issue with this deal..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setDisputeDeal(null); setDisputeReason(''); }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDisputeDeal} disabled={disputing || !disputeReason.trim()}>
                {disputing ? 'Submitting...' : 'Submit Dispute'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Builder */}
      {contractDeal && (
        <ContractBuilder
          open={!!contractDeal}
          onOpenChange={open => { if (!open) setContractDeal(null); }}
          dealId={contractDeal.id}
          dealType={contractDeal.deal_type}
          dealValue={Number(contractDeal.value)}
        />
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewDeal} onOpenChange={open => { if (!open) { setReviewDeal(null); setReviewRating(0); setReviewComment(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>Capture feedback once the deal is finished so trust signals stay useful.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rate your experience with {user?.role === 'streamer' ? reviewDeal?.organizations?.name : reviewDeal?.profiles?.display_name}.
            </p>
            <div className="flex justify-center">
              <StarRating rating={reviewRating} onChange={setReviewRating} />
            </div>
            <div className="space-y-2">
              <Label>Comment (optional)</Label>
              <Textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="How was your experience?"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setReviewDeal(null); setReviewRating(0); setReviewComment(''); }}>
                Cancel
              </Button>
              <Button
                className="bg-gradient-brand hover:opacity-90"
                disabled={reviewRating === 0 || createReview.isPending}
                onClick={async () => {
                  if (!reviewDeal) return;
                  const revieweeId = user?.role === 'streamer' 
                    ? reviewDeal.organization_id 
                    : reviewDeal.streamer_id;
                  try {
                    await createReview.mutateAsync({
                      dealId: reviewDeal.id,
                      revieweeId,
                      rating: reviewRating,
                      comment: reviewComment,
                    });
                    toast({ title: 'Review submitted' });
                    setReviewDeal(null);
                    setReviewRating(0);
                    setReviewComment('');
                  } catch (err: unknown) {
                    toast({ title: 'Error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
                  }
                }}
              >
                {createReview.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DealsPage;

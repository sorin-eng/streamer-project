import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useDeals, useApplications, useUpdateApplicationStatus, useRespondToInquiry, useCreateReview } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Handshake, DollarSign, Calendar, ArrowRight, CheckCircle2, XCircle, FileText, Ban, AlertTriangle, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SearchBar, PaginationControls } from '@/components/SearchPagination';
import { ContractBuilder } from '@/components/ContractBuilder';
import { StarRating } from '@/components/StarRating';
import type { DealWithRelations, ApplicationWithProfile } from '@/types/supabase-joins';
import { DealsSkeleton } from '@/components/PageSkeletons';

const PAGE_SIZE = 20;

const NEXT_STATES: Record<string, string> = {
  negotiation: 'contract_pending',
  contract_pending: 'active',
  active: 'completed',
};

const DealsPage = () => {
  const { user } = useAuth();
  const { data: deals, isLoading } = useDeals();
  const { data: applications } = useApplications();
  const updateAppStatus = useUpdateApplicationStatus();
  const respondToInquiry = useRespondToInquiry();
  const createReview = useCreateReview();
  const { toast } = useToast();
  const qc = useQueryClient();
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

  const isCasino = user?.role === 'casino_manager';
  const pendingApps = (applications || []).filter(a => a.status === 'pending');

  // Filter and paginate
  const filtered = (deals || []).filter((d: DealWithRelations) => {
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
      await updateAppStatus.mutateAsync({ id: app.id, status: 'accepted' });

      const campaign = await supabase
        .from('campaigns')
        .select('id, organization_id, deal_type, budget')
        .eq('id', app.campaign_id)
        .single();

      if (campaign.data) {
        const { data: deal } = await supabase
          .from('deals')
          .insert({
            application_id: app.id,
            campaign_id: app.campaign_id,
            organization_id: campaign.data.organization_id,
            streamer_id: app.streamer_id,
            deal_type: campaign.data.deal_type,
            value: campaign.data.budget || 0,
          })
          .select('id')
          .single();

        if (deal) {
          await supabase.from('contracts').insert({
            deal_id: deal.id,
            title: `Contract for ${app.campaign_id.slice(0, 8)}`,
            terms_json: {
              deal_type: campaign.data.deal_type,
              value: campaign.data.budget || 0,
              auto_generated: true,
            },
            status: 'draft' as const,
          });

          await supabase.from('deal_state_log').insert({
            deal_id: deal.id,
            to_state: 'negotiation',
            changed_by: user!.id,
          });

          await supabase.rpc('log_audit', {
            _action: 'ACCEPT_APPLICATION_CREATE_DEAL',
            _entity_type: 'deal',
            _entity_id: deal.id,
            _details: { application_id: app.id, campaign_id: app.campaign_id },
          });

          await supabase.functions.invoke('notify', {
            body: {
              event_type: 'application_accepted',
              deal_id: deal.id,
              title: 'Application accepted',
              body: 'Your application has been accepted and a deal has been created.',
              entity_type: 'deal',
              entity_id: deal.id,
            },
          }).catch(() => {});
        }
      }

      toast({ title: 'Application accepted & deal created' });
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
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

  const handleAdvanceState = async (dealId: string, currentState: string) => {
    const nextState = NEXT_STATES[currentState];
    if (!nextState) return;

    setTransitioning(dealId);
    try {
      const { data: valid } = await supabase.rpc('validate_deal_transition', {
        _deal_id: dealId,
        _to_state: nextState,
        _user_id: user!.id,
      });

      if (!valid) {
        toast({ title: 'Transition not allowed', description: 'You do not have permission for this state change.', variant: 'destructive' });
        setTransitioning(null);
        return;
      }

      await supabase.from('deals').update({ state: nextState }).eq('id', dealId);
      await supabase.from('deal_state_log').insert({
        deal_id: dealId,
        from_state: currentState,
        to_state: nextState,
        changed_by: user!.id,
      });

      if (nextState === 'contract_pending') {
        await supabase.from('contracts').update({ status: 'pending_signature' as const }).eq('deal_id', dealId);
      }

      await supabase.rpc('log_audit', {
        _action: 'ADVANCE_DEAL_STATE',
        _entity_type: 'deal',
        _entity_id: dealId,
        _details: { from: currentState, to: nextState },
      });

      await supabase.functions.invoke('notify', {
        body: {
          event_type: 'deal_state_change',
          deal_id: dealId,
          title: `Deal moved to ${nextState.replace('_', ' ')}`,
          entity_type: 'deal',
          entity_id: dealId,
        },
      }).catch(() => {});

      toast({ title: `Deal moved to ${nextState.replace('_', ' ')}` });
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setTransitioning(null);
  };

  const handleCancelDeal = async () => {
    if (!cancelDeal) return;
    setCancelling(true);
    try {
      const { data: valid } = await supabase.rpc('validate_deal_transition', {
        _deal_id: cancelDeal.id,
        _to_state: 'cancelled',
        _user_id: user!.id,
      });

      if (!valid) {
        toast({ title: 'Cannot cancel', description: 'This deal cannot be cancelled in its current state.', variant: 'destructive' });
        setCancelling(false);
        return;
      }

      await supabase.from('deals').update({ state: 'cancelled' }).eq('id', cancelDeal.id);
      await supabase.from('deal_state_log').insert({
        deal_id: cancelDeal.id,
        from_state: cancelDeal.state,
        to_state: 'cancelled',
        changed_by: user!.id,
        reason: cancelReason || null,
      });

      await supabase.rpc('log_audit', {
        _action: 'CANCEL_DEAL',
        _entity_type: 'deal',
        _entity_id: cancelDeal.id,
        _details: { from: cancelDeal.state, reason: cancelReason },
      });

      toast({ title: 'Deal cancelled' });
      qc.invalidateQueries({ queryKey: ['deals'] });
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
      const { data: valid } = await supabase.rpc('validate_deal_transition', {
        _deal_id: disputeDeal.id,
        _to_state: 'disputed',
        _user_id: user!.id,
      });

      if (!valid) {
        toast({ title: 'Cannot dispute', description: 'This deal cannot be disputed in its current state.', variant: 'destructive' });
        setDisputing(false);
        return;
      }

      await supabase.from('deals').update({ state: 'disputed' }).eq('id', disputeDeal.id);
      await supabase.from('deal_state_log').insert({
        deal_id: disputeDeal.id,
        from_state: disputeDeal.state,
        to_state: 'disputed',
        changed_by: user!.id,
        reason: disputeReason || null,
      });

      await supabase.rpc('log_audit', {
        _action: 'DISPUTE_DEAL',
        _entity_type: 'deal',
        _entity_id: disputeDeal.id,
        _details: { from: disputeDeal.state, reason: disputeReason },
      });

      toast({ title: 'Deal disputed' });
      qc.invalidateQueries({ queryKey: ['deals'] });
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
            <p className="text-sm text-muted-foreground">Track and manage your partnerships</p>
          </div>
          {isCasino && pendingApps.length > 0 && (
            <Button variant="outline" onClick={() => setShowApps(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {pendingApps.length} Pending Application{pendingApps.length > 1 ? 's' : ''}
            </Button>
          )}
        </div>

        <SearchBar value={search} onChange={v => { setSearch(v); setPage(0); }} placeholder="Search deals..." />

        {isLoading ? (
          <DealsSkeleton />
        ) : !paginated.length ? (
          <EmptyState
            icon={<Handshake className="h-6 w-6" />}
            title="No deals yet"
            description="Deals will appear here once you're matched with a partner."
            action={<Link to="/campaigns"><Button className="bg-gradient-brand hover:opacity-90">Browse Campaigns</Button></Link>}
          />
        ) : (
          <div className="space-y-4">
            {paginated.map((deal: DealWithRelations) => {
              const nextState = NEXT_STATES[deal.state];
              const isTerminal = deal.state === 'completed' || deal.state === 'cancelled';
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to={`/messages?deal=${deal.id}`}>
                      <Button size="sm" variant="outline">Messages</Button>
                    </Link>
                    <Link to={`/contracts?deal=${deal.id}`}>
                      <Button size="sm" variant="outline">View Contract</Button>
                    </Link>
                    {isCasino && deal.state === 'negotiation' && (
                      <Button size="sm" variant="outline" onClick={() => setContractDeal(deal)}>
                        <FileText className="mr-1 h-3 w-3" />Create Contract
                      </Button>
                    )}
                    {nextState && (
                      <Button
                        size="sm"
                        className="bg-gradient-brand hover:opacity-90"
                        onClick={() => handleAdvanceState(deal.id, deal.state)}
                        disabled={transitioning === deal.id}
                      >
                        {transitioning === deal.id ? 'Processing...' : (
                          <>Advance to {nextState.replace('_', ' ')} <ArrowRight className="ml-1 h-3.5 w-3.5" /></>
                        )}
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
                    {!isTerminal && (
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
          <DialogHeader><DialogTitle>Pending Applications</DialogTitle></DialogHeader>
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
                  <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={() => handleAcceptApplication(app)} disabled={updateAppStatus.isPending}>
                    <CheckCircle2 className="mr-1 h-3 w-3" />Accept & Create Deal
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRejectApplication(app.id)} disabled={updateAppStatus.isPending}>
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
          <DialogHeader><DialogTitle>Cancel Deal</DialogTitle></DialogHeader>
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
              <Button variant="destructive" onClick={handleCancelDeal} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Cancel Deal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Deal Dialog */}
      <Dialog open={!!disputeDeal} onOpenChange={open => { if (!open) { setDisputeDeal(null); setDisputeReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Dispute Deal</DialogTitle></DialogHeader>
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
    </DashboardLayout>
  );
};

export default DealsPage;

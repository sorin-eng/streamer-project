import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useDeals, useApplications, useUpdateApplicationStatus, useCreateDeal } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Handshake, DollarSign, Calendar, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const DEAL_STATE_ORDER = ['negotiation', 'contract_pending', 'active', 'completed', 'cancelled'];
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
  const createDeal = useCreateDeal();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [showApps, setShowApps] = useState(false);

  const isCasino = user?.role === 'casino_manager';
  const pendingApps = applications?.filter(a => a.status === 'pending') || [];

  const handleAcceptApplication = async (app: any) => {
    try {
      // Update application status
      await updateAppStatus.mutateAsync({ id: app.id, status: 'accepted' });

      // Auto-create deal
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
          // Create contract stub
          await supabase.from('contracts').insert({
            deal_id: deal.id,
            title: `Contract for ${app.campaign_id.slice(0, 8)}`,
            terms_json: {
              deal_type: campaign.data.deal_type,
              value: campaign.data.budget || 0,
              auto_generated: true,
            },
            status: 'draft' as any,
          });

          // Log state
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
        }
      }

      toast({ title: 'Application accepted & deal created' });
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleRejectApplication = async (appId: string) => {
    try {
      await updateAppStatus.mutateAsync({ id: appId, status: 'rejected' });
      toast({ title: 'Application rejected' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
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

      // If moving to contract_pending, update contract to pending_signature
      if (nextState === 'contract_pending') {
        await supabase.from('contracts').update({ status: 'pending_signature' as any }).eq('deal_id', dealId);
      }

      await supabase.rpc('log_audit', {
        _action: 'ADVANCE_DEAL_STATE',
        _entity_type: 'deal',
        _entity_id: dealId,
        _details: { from: currentState, to: nextState },
      });

      toast({ title: `Deal moved to ${nextState.replace('_', ' ')}` });
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setTransitioning(null);
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

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : !deals?.length ? (
          <EmptyState
            icon={<Handshake className="h-6 w-6" />}
            title="No deals yet"
            description="Deals will appear here once you're matched with a partner."
            action={<Link to="/campaigns"><Button className="bg-gradient-brand hover:opacity-90">Browse Campaigns</Button></Link>}
          />
        ) : (
          <div className="space-y-4">
            {deals.map(deal => {
              const nextState = NEXT_STATES[deal.state];
              return (
                <div key={deal.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Handshake className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{(deal.campaigns as any)?.title || `Direct Deal`}</h3>
                        <p className="text-sm text-muted-foreground">
                          {user?.role === 'streamer' ? (deal.organizations as any)?.name : (deal.profiles as any)?.display_name}
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
                    {deal.start_date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{deal.start_date} → {deal.end_date}</span>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to={`/messages?deal=${deal.id}`}>
                      <Button size="sm" variant="outline">Messages</Button>
                    </Link>
                    <Link to={`/contracts?deal=${deal.id}`}>
                      <Button size="sm" variant="outline">View Contract</Button>
                    </Link>
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Applications Dialog */}
      <Dialog open={showApps} onOpenChange={setShowApps}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Pending Applications</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingApps.map(app => (
              <div key={app.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                      {(app.profiles as any)?.display_name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{(app.profiles as any)?.display_name || 'Streamer'}</p>
                      <p className="text-xs text-muted-foreground">
                        {(app.streamer_profiles as any)?.avg_live_viewers || 0} avg viewers · {(app.streamer_profiles as any)?.follower_count?.toLocaleString() || 0} followers
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
    </DashboardLayout>
  );
};

export default DealsPage;

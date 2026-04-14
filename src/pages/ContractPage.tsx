import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useContracts, useDeals, useSignContract } from '@/hooks/useSupabaseData';
import { ComplianceGate } from '@/components/ComplianceGate';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { FileText, Download, Pen, Calendar, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DealWithRelations } from '@/types/supabase-joins';

const ContractPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const dealId = searchParams.get('deal');
  const { data: deals } = useDeals();
  const { data: contracts, isLoading } = useContracts(dealId || undefined);
  const signContract = useSignContract();
  const { toast } = useToast();

  const deal = deals?.find((d: DealWithRelations) => d.id === dealId);
  const contractStageDeals = useMemo(() => {
    const stageRank: Record<string, number> = {
      contract_pending: 0,
      negotiation: 1,
      active: 2,
      completed: 3,
    };

    return (deals || [])
      .filter((d: DealWithRelations) => ['negotiation', 'contract_pending', 'active', 'completed'].includes(d.state))
      .sort((a, b) => (stageRank[a.state] ?? 99) - (stageRank[b.state] ?? 99));
  }, [deals]);

  const handleSign = async (contractId: string) => {
    try {
      const contract = contracts?.find(c => c.id === contractId);
      if (!contract) throw new Error('Contract not found');
      const otherField = user?.role === 'streamer' ? 'signer_casino_id' : 'signer_streamer_id';
      const otherSigned = !!contract[otherField];
      await signContract.mutateAsync({ contractId });

      toast({ title: otherSigned ? 'Contract fully signed, deal is live' : 'Contract signed — awaiting other party' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error signing', description: message, variant: 'destructive' });
    }
  };

  const alreadySigned = (contract: typeof contracts extends (infer T)[] | undefined ? T : never) => {
    if (!contract || !user) return false;
    if (user.role === 'streamer') return !!contract.signer_streamer_id;
    return !!contract.signer_casino_id;
  };

  if (!dealId) {
    return (
      <DashboardLayout>
        <ComplianceGate requireKyc>
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold">Contracts</h1>
              <p className="text-sm text-muted-foreground">Only deals in negotiation, signature, or live delivery stages belong here.</p>
            </div>
            <div className="space-y-3">
              {contractStageDeals.map((d: DealWithRelations) => (
                <Link
                  key={d.id}
                  to={`/contracts?deal=${d.id}`}
                  className="block rounded-xl border border-border bg-card p-4 hover:shadow-elevated transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{d.campaigns?.title || `Direct Deal — ${d.organizations?.name || d.profiles?.display_name}`}</p>
                      <p className="text-sm text-muted-foreground">{d.organizations?.name}</p>
                    </div>
                    <StatusBadge status={d.state} />
                  </div>
                </Link>
              ))}
              {contractStageDeals.length === 0 && (
                <EmptyState icon={<FileText className="h-6 w-6" />} title="No contract-stage deals" description="Once a deal moves past inquiry, it will show up here for terms and signatures." />
              )}
            </div>
          </div>
        </ComplianceGate>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ComplianceGate requireKyc>
        <div className="space-y-6 animate-fade-in max-w-3xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Contract</h1>
              <p className="text-sm text-muted-foreground">
                {deal ? `${deal.campaigns?.title || 'Direct Deal'} — ${deal.organizations?.name}` : 'Deal contract'}
              </p>
            </div>
            <Link to="/deals"><Button variant="outline">Back to Deals</Button></Link>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 shadow-card space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Signature step</p>
            <p className="text-sm text-muted-foreground">This is where negotiation turns into a real agreement, with fee terms, signatures, and compliance checks in one place.</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : !contracts?.length ? (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No contract yet"
              description="A contract will be created when the deal moves to contract stage."
            />
          ) : (
            contracts.map(contract => (
              <div key={contract.id} className="rounded-xl border border-border bg-card p-6 shadow-card space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{contract.title}</h2>
                  <StatusBadge status={contract.status} />
                </div>

                <div className="rounded-lg bg-muted p-4 space-y-3">
                  <h3 className="font-medium text-sm">Contract Terms</h3>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                    {JSON.stringify(contract.terms_json, null, 2)}
                  </pre>
                </div>

                {deal && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <h3 className="font-medium text-sm">Fee Breakdown</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Deal Value</p>
                        <p className="font-semibold">${Number(deal.value).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Platform Fee ({deal.platform_fee_pct}%)</p>
                        <p className="font-semibold">${(Number(deal.value) * deal.platform_fee_pct / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Streamer Payout</p>
                        <p className="font-semibold text-primary">${(Number(deal.value) * (1 - deal.platform_fee_pct / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(contract.created_at).toLocaleDateString()}</p>
                  </div>
                  {contract.signed_at && (
                    <div>
                      <p className="text-muted-foreground">Signed</p>
                      <p className="font-medium flex items-center gap-1"><Pen className="h-3.5 w-3.5" />{new Date(contract.signed_at).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Casino Signature</p>
                    <p className="font-medium">{contract.signer_casino_id ? '✓ Signed' : '⏳ Pending'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Streamer Signature</p>
                    <p className="font-medium">{contract.signer_streamer_id ? '✓ Signed' : '⏳ Pending'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {contract.status === 'pending_signature' && !alreadySigned(contract) && (
                    <Button className="bg-gradient-brand hover:opacity-90" onClick={() => handleSign(contract.id)}>
                      <Pen className="mr-2 h-4 w-4" />Sign Contract
                    </Button>
                  )}
                  {contract.status === 'pending_signature' && alreadySigned(contract) && (
                    <Button variant="outline" disabled>
                      <Pen className="mr-2 h-4 w-4" />You've Signed — Awaiting Other Party
                    </Button>
                  )}
                  <Link to={`/messages?deal=${dealId}`}>
                    <Button variant="outline">Open Deal Messages</Button>
                  </Link>
                  {(contract.status === 'signed' || deal?.state === 'active' || deal?.state === 'completed') && (
                    <Link to={`/reports?deal=${dealId}`}>
                      <Button variant="outline">Go to Reports</Button>
                    </Link>
                  )}
                  {contract.pdf_url && (
                    <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline"><Download className="mr-2 h-4 w-4" />Download PDF</Button>
                    </a>
                  )}
                </div>

                {contract.status === 'signed' && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    Both sides have signed. This deal is ready for delivery tracking and commission reporting.
                  </div>
                )}

                <div className="rounded-lg border border-info/20 bg-info/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
                  <Shield className="h-4 w-4 text-info mt-0.5 shrink-0" />
                  <span>This contract is binding upon signature by both parties. Digital signatures are timestamped and logged for compliance. Signing requires completed KYC verification.</span>
                </div>
              </div>
            ))
          )}
        </div>
      </ComplianceGate>
    </DashboardLayout>
  );
};

export default ContractPage;

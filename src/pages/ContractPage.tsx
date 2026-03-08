import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useContracts, useDeals } from '@/hooks/useSupabaseData';
import { ComplianceGate } from '@/components/ComplianceGate';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/EmptyState';
import { FileText, Download, Pen, Calendar, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const ContractPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const dealId = searchParams.get('deal');
  const { data: deals } = useDeals();
  const { data: contracts, isLoading } = useContracts(dealId || undefined);
  const { toast } = useToast();
  const qc = useQueryClient();

  const deal = deals?.find(d => d.id === dealId);

  const handleSign = async (contractId: string) => {
    try {
      const signField = user?.role === 'streamer' ? 'signer_streamer_id' : 'signer_casino_id';
      const { error } = await supabase
        .from('contracts')
        .update({
          [signField]: user?.id,
          signed_at: new Date().toISOString(),
          status: 'signed' as any,
        })
        .eq('id', contractId);
      if (error) throw error;

      await supabase.rpc('log_audit', {
        _action: 'SIGN_CONTRACT',
        _entity_type: 'contract',
        _entity_id: contractId,
      });

      await supabase.rpc('log_compliance_event' as any, {
        _event_type: 'compliance.verified',
        _entity_type: 'contract',
        _entity_id: contractId,
        _details: { signer_role: user?.role },
        _severity: 'info',
      });

      toast({ title: 'Contract signed' });
      qc.invalidateQueries({ queryKey: ['contracts'] });
    } catch (err: any) {
      toast({ title: 'Error signing', description: err.message, variant: 'destructive' });
    }
  };

  if (!dealId) {
    return (
      <DashboardLayout>
        <ComplianceGate requireKyc>
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold">Contracts</h1>
              <p className="text-sm text-muted-foreground">Select a deal to view its contracts</p>
            </div>
            <div className="space-y-3">
              {(deals || []).map(d => (
                <Link
                  key={d.id}
                  to={`/contracts?deal=${d.id}`}
                  className="block rounded-xl border border-border bg-card p-4 hover:shadow-elevated transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{(d.campaigns as any)?.title || `Direct Deal — ${(d.organizations as any)?.name || (d.profiles as any)?.display_name}`}</p>
                      <p className="text-sm text-muted-foreground">{(d.organizations as any)?.name}</p>
                    </div>
                    <StatusBadge status={d.state} />
                  </div>
                </Link>
              ))}
              {(!deals || deals.length === 0) && (
                <EmptyState icon={<FileText className="h-6 w-6" />} title="No deals" description="Contracts are created when deals are established." />
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
          <div>
            <h1 className="text-2xl font-bold">Contract</h1>
            <p className="text-sm text-muted-foreground">
              {deal ? `${(deal.campaigns as any)?.title || 'Direct Deal'} — ${(deal.organizations as any)?.name}` : 'Deal contract'}
            </p>
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

                {/* Fee breakdown */}
                {deal && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <h3 className="font-medium text-sm">Fee Breakdown</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Deal Value</p>
                        <p className="font-semibold">${Number(deal.value).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Platform Fee ({(deal as any).platform_fee_pct ?? 8}%)</p>
                        <p className="font-semibold">${(Number(deal.value) * ((deal as any).platform_fee_pct ?? 8) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Streamer Payout</p>
                        <p className="font-semibold text-primary">${(Number(deal.value) * (1 - ((deal as any).platform_fee_pct ?? 8) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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

                <div className="flex gap-3">
                  {contract.status === 'pending_signature' && (
                    <Button className="bg-gradient-brand hover:opacity-90" onClick={() => handleSign(contract.id)}>
                      <Pen className="mr-2 h-4 w-4" />Sign Contract
                    </Button>
                  )}
                  {contract.pdf_url && (
                    <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline"><Download className="mr-2 h-4 w-4" />Download PDF</Button>
                    </a>
                  )}
                </div>

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

import { DashboardLayout } from '@/components/DashboardLayout';
import { useAllProfiles, useVerificationDocuments, useUpdateVerification, useAuditLog } from '@/hooks/useSupabaseData';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export const AdminVerificationsPage = () => {
  const { data: docs, isLoading } = useVerificationDocuments();
  const updateVerification = useUpdateVerification();
  const { toast } = useToast();
  const qc = useQueryClient();

  const pending = docs?.filter(d => d.status === 'pending') || [];
  const reviewed = docs?.filter(d => d.status !== 'pending') || [];

  const handleAction = async (id: string, userId: string, status: 'approved' | 'rejected') => {
    try {
      await updateVerification.mutateAsync({ id, status });

      const kycStatus = status === 'approved' ? 'verified' : 'rejected';
      await supabase
        .from('profiles')
        .update({ kyc_status: kycStatus } as any)
        .eq('user_id', userId);

      await supabase.rpc('log_compliance_event' as any, {
        _event_type: status === 'approved' ? 'kyc.approved' : 'kyc.rejected',
        _entity_type: 'user',
        _entity_id: userId,
        _details: { verification_document_id: id },
        _severity: status === 'approved' ? 'info' : 'warning',
      });

      toast({ title: `Verification ${status}` });
      qc.invalidateQueries({ queryKey: ['all_profiles'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Verifications</h1>
          <p className="text-sm text-muted-foreground">Review and approve user KYC/KYB documents</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold text-warning flex items-center gap-2"><Shield className="h-4 w-4" />Pending Review ({pending.length})</h2>
                {pending.map(d => (
                  <div key={d.id} className="rounded-xl border border-warning/20 bg-warning/5 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                        {(d.profiles as any)?.display_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{(d.profiles as any)?.display_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{d.document_type} · <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">View Document</a></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={() => handleAction(d.id, d.user_id, 'approved')}>
                        <CheckCircle2 className="mr-1 h-3 w-3" />Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleAction(d.id, d.user_id, 'rejected')}>
                        <XCircle className="mr-1 h-3 w-3" />Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reviewed.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Reviewed ({reviewed.length})</h2>
                {reviewed.map(d => (
                  <div key={d.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                        {(d.profiles as any)?.display_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{(d.profiles as any)?.display_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{d.document_type}</p>
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                ))}
              </div>
            )}

            {!docs?.length && (
              <p className="text-sm text-muted-foreground py-8 text-center">No verification documents submitted yet.</p>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export const AdminUsersPage = () => {
  const { data: profiles, isLoading } = useAllProfiles();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">All registered users on the platform</p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">KYC</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(profiles || []).map(p => (
                  <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.display_name}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{(p.user_roles as any)?.[0]?.role?.replace('_', ' ') || 'N/A'}</td>
                    <td className="px-4 py-3"><StatusBadge status={(p as any).kyc_status || 'unverified'} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export const AdminAuditPage = () => {
  const { data: logs, isLoading } = useAuditLog();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Track all platform activity</p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(logs || []).map(log => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">{(log.profiles as any)?.display_name || 'System'}</td>
                    <td className="px-4 py-3"><span className="inline-flex rounded bg-accent px-2 py-0.5 text-xs font-mono text-accent-foreground">{log.action}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{JSON.stringify(log.details)}</td>
                  </tr>
                ))}
                {(!logs || logs.length === 0) && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No audit entries yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

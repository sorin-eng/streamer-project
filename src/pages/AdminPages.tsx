import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAllProfiles, useVerificationDocuments, useUpdateVerification, useAuditLog } from '@/hooks/useSupabaseData';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, XCircle, UserCog, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { updateProfileKycStatus, rpcLogComplianceEvent, rpcAdminChangeRole, rpcAdminToggleSuspend } from '@/lib/supabaseHelpers';
import { TableSkeleton } from '@/components/PageSkeletons';
import { SearchBar, PaginationControls } from '@/components/SearchPagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { VerificationDocWithProfile, ProfileWithRole, AuditLogWithProfile } from '@/types/supabase-joins';

const PAGE_SIZE = 20;

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
      await updateProfileKycStatus(userId, kycStatus);
      await rpcLogComplianceEvent({
        _event_type: status === 'approved' ? 'kyc.approved' : 'kyc.rejected',
        _entity_type: 'user',
        _entity_id: userId,
        _details: { verification_document_id: id },
        _severity: status === 'approved' ? 'info' : 'warning',
      });
      toast({ title: `Verification ${status}` });
      qc.invalidateQueries({ queryKey: ['all_profiles'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
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
                        {(d as VerificationDocWithProfile).profiles?.display_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{(d as VerificationDocWithProfile).profiles?.display_name || 'User'}</p>
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
                        {(d as VerificationDocWithProfile).profiles?.display_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-medium">{(d as VerificationDocWithProfile).profiles?.display_name || 'User'}</p>
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
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [roleDialog, setRoleDialog] = useState<ProfileWithRole | null>(null);
  const [newRole, setNewRole] = useState('');

  const filtered = (profiles || []).filter((p: ProfileWithRole) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.display_name.toLowerCase().includes(s) ||
      (p.user_roles?.[0]?.role || '').toLowerCase().includes(s);
  });
  const totalCount = filtered.length;
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleChangeRole = async () => {
    if (!roleDialog || !newRole) return;
    try {
      await rpcAdminChangeRole(roleDialog.user_id, newRole);
      toast({ title: 'Role updated' });
      qc.invalidateQueries({ queryKey: ['all_profiles'] });
      setRoleDialog(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleToggleSuspend = async (userId: string, currentlySuspended: boolean) => {
    try {
      await rpcAdminToggleSuspend(userId, !currentlySuspended);
      toast({ title: currentlySuspended ? 'User unsuspended' : 'User suspended' });
      qc.invalidateQueries({ queryKey: ['all_profiles'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">All registered users on the platform</p>
        </div>

        <SearchBar value={search} onChange={v => { setSearch(v); setPage(0); }} placeholder="Search users..." />

        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">KYC</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((p: ProfileWithRole) => {
                  const isSuspended = !!(p as ProfileWithRole & { suspended?: boolean }).suspended;
                  return (
                    <tr key={p.id} className={`hover:bg-muted/50 transition-colors ${isSuspended ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.display_name}</p>
                        {isSuspended && <span className="text-xs text-destructive">Suspended</span>}
                      </td>
                      <td className="px-4 py-3 capitalize">{p.user_roles?.[0]?.role?.replace('_', ' ') || 'N/A'}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.kyc_status || 'unverified'} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Change role for ${p.display_name}`}
                            onClick={() => { setRoleDialog(p); setNewRole(p.user_roles?.[0]?.role || ''); }}
                          >
                            <UserCog className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`${isSuspended ? 'Unsuspend' : 'Suspend'} ${p.display_name}`}
                            className={isSuspended ? 'text-success' : 'text-destructive'}
                            onClick={() => handleToggleSuspend(p.user_id, isSuspended)}
                          >
                            <Ban className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <PaginationControls page={page} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      {/* Role Change Dialog */}
      <Dialog open={!!roleDialog} onOpenChange={open => { if (!open) setRoleDialog(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role for {roleDialog?.display_name}</DialogTitle>
            <DialogDescription>Update the selected user’s role in mock/local admin mode.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="streamer">Streamer</SelectItem>
                  <SelectItem value="casino_manager">Casino Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-gradient-brand hover:opacity-90" onClick={handleChangeRole} disabled={!newRole}>
              Update Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export const AdminAuditPage = () => {
  const { data: logs, isLoading } = useAuditLog();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = (logs || []).filter((log: AuditLogWithProfile) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return log.action.toLowerCase().includes(s) ||
      (log.profiles?.display_name || '').toLowerCase().includes(s);
  });
  const totalCount = filtered.length;
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Track all platform activity</p>
        </div>

        <SearchBar value={search} onChange={v => { setSearch(v); setPage(0); }} placeholder="Search actions..." />

        {isLoading ? (
          <TableSkeleton rows={8} />
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
                {paginated.map((log: AuditLogWithProfile) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs">{log.profiles?.display_name || 'System'}</td>
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

        <PaginationControls page={page} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
};

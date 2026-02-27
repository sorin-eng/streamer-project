import { DashboardLayout } from '@/components/DashboardLayout';
import { mockUsers, mockAuditLog } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, XCircle, Flag } from 'lucide-react';

export const AdminVerificationsPage = () => {
  const pending = mockUsers.filter(u => !u.verified && u.role !== 'admin');
  const verified = mockUsers.filter(u => u.verified && u.role !== 'admin');

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Verifications</h1>
          <p className="text-sm text-muted-foreground">Review and approve user verification documents</p>
        </div>

        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-warning flex items-center gap-2"><Shield className="h-4 w-4" />Pending Review ({pending.length})</h2>
            {pending.map(u => (
              <div key={u.id} className="rounded-xl border border-warning/20 bg-warning/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{u.displayName[0]}</div>
                  <div>
                    <p className="font-medium">{u.displayName}</p>
                    <p className="text-xs text-muted-foreground">{u.email} · <span className="capitalize">{u.role}</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-gradient-brand hover:opacity-90"><CheckCircle2 className="mr-1 h-3 w-3" />Approve</Button>
                  <Button size="sm" variant="outline"><XCircle className="mr-1 h-3 w-3" />Reject</Button>
                  <Button size="sm" variant="outline" className="text-warning"><Flag className="mr-1 h-3 w-3" />Flag</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="font-semibold text-success flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Verified ({verified.length})</h2>
          {verified.map(u => (
            <div key={u.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{u.displayName[0]}</div>
                <div>
                  <p className="font-medium">{u.displayName}</p>
                  <p className="text-xs text-muted-foreground">{u.email} · <span className="capitalize">{u.role}</span></p>
                </div>
              </div>
              <span className="text-xs text-success font-medium">Verified ✓</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export const AdminUsersPage = () => (
  <DashboardLayout>
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">All registered users on the platform</p>
      </div>
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockUsers.map(u => (
              <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <div><p className="font-medium">{u.displayName}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                </td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">{u.verified ? <span className="text-success text-xs font-medium">Verified</span> : <span className="text-warning text-xs font-medium">Pending</span>}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </DashboardLayout>
);

export const AdminAuditPage = () => (
  <DashboardLayout>
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Track all platform activity</p>
      </div>
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
            {mockAuditLog.map(log => (
              <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs">{log.userEmail}</td>
                <td className="px-4 py-3"><span className="inline-flex rounded bg-accent px-2 py-0.5 text-xs font-mono text-accent-foreground">{log.action}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </DashboardLayout>
);

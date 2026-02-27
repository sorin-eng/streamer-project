import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/StatCard';
import { useCommissions, useReportUploads } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, BarChart3, Upload } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

const ReportsPage = () => {
  const { user } = useAuth();
  const { data: commissions } = useCommissions();
  const { data: uploads } = useReportUploads();

  const totalAmount = commissions?.reduce((s, c) => s + Number(c.amount), 0) || 0;
  const pendingCount = commissions?.filter(c => c.status === 'pending').length || 0;
  const approvedCount = commissions?.filter(c => c.status === 'approved').length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{user?.role === 'streamer' ? 'Earnings' : 'Reports'}</h1>
            <p className="text-sm text-muted-foreground">
              {user?.role === 'casino_manager' ? 'Upload and track campaign performance' : 'View your earnings and performance'}
            </p>
          </div>
          {user?.role === 'casino_manager' && (
            <Button className="bg-gradient-brand hover:opacity-90"><Upload className="mr-2 h-4 w-4" />Upload CSV Report</Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Commissions" value={`$${totalAmount.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
          <StatCard label="Pending" value={pendingCount} icon={<BarChart3 className="h-5 w-5" />} />
          <StatCard label="Approved" value={approvedCount} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Reports Uploaded" value={uploads?.length || 0} icon={<Upload className="h-5 w-5" />} />
        </div>

        {commissions && commissions.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold mb-4">Commission History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Campaign</th>
                    <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {commissions.map(c => (
                    <tr key={c.id}>
                      <td className="py-3 font-medium">{(c.deals as any)?.campaigns?.title || 'N/A'}</td>
                      <td className="py-3">${Number(c.amount).toLocaleString()}</td>
                      <td className="py-3"><StatusBadge status={c.status} /></td>
                      <td className="py-3 text-muted-foreground">{c.period_start || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;

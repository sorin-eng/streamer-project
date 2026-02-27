import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, BarChart3, Upload } from 'lucide-react';

const ReportsPage = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{user?.role === 'streamer' ? 'Earnings' : 'Reports'}</h1>
            <p className="text-sm text-muted-foreground">
              {user?.role === 'casino' ? 'Upload and track campaign performance' : 'View your earnings and performance'}
            </p>
          </div>
          {user?.role === 'casino' && (
            <Button className="bg-gradient-brand hover:opacity-90"><Upload className="mr-2 h-4 w-4" />Upload CSV Report</Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Revenue" value="$43,000" change="+18% vs last month" trend="up" icon={<DollarSign className="h-5 w-5" />} />
          <StatCard label="Signups" value="1,247" change="+32%" trend="up" icon={<Users className="h-5 w-5" />} />
          <StatCard label="FTDs" value="389" change="+15%" trend="up" icon={<BarChart3 className="h-5 w-5" />} />
          <StatCard label="Net Revenue" value="$28,700" change="+22%" trend="up" icon={<DollarSign className="h-5 w-5" />} />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-semibold mb-4">Performance by Campaign</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Campaign</th>
                  <th className="pb-3 font-medium text-muted-foreground">Signups</th>
                  <th className="pb-3 font-medium text-muted-foreground">FTDs</th>
                  <th className="pb-3 font-medium text-muted-foreground">Net Revenue</th>
                  <th className="pb-3 font-medium text-muted-foreground">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 font-medium">Live Casino Ambassador</td>
                  <td className="py-3">847</td>
                  <td className="py-3">256</td>
                  <td className="py-3">$18,400</td>
                  <td className="py-3 text-success">$2,760</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Summer Slots Showdown</td>
                  <td className="py-3">400</td>
                  <td className="py-3">133</td>
                  <td className="py-3">$10,300</td>
                  <td className="py-3 text-success">$1,545</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;

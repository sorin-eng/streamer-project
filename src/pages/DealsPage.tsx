import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { mockDeals } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Handshake, DollarSign, Calendar } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

const DealsPage = () => {
  const { user } = useAuth();

  const deals = user?.role === 'admin'
    ? mockDeals
    : mockDeals.filter(d => d.casinoId === user?.id || d.streamerId === user?.id);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-sm text-muted-foreground">Track and manage your partnerships</p>
        </div>

        {deals.length === 0 ? (
          <EmptyState
            icon={<Handshake className="h-6 w-6" />}
            title="No deals yet"
            description="Deals will appear here once you're matched with a partner."
            action={<Link to="/campaigns"><Button className="bg-gradient-brand hover:opacity-90">Browse Campaigns</Button></Link>}
          />
        ) : (
          <div className="space-y-4">
            {deals.map(deal => (
              <div key={deal.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <Handshake className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{deal.campaignTitle}</h3>
                      <p className="text-sm text-muted-foreground">
                        {user?.role === 'streamer' ? deal.casinoBrand : deal.streamerName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={deal.status} />
                    <StatusBadge status={deal.dealType} />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />${deal.value.toLocaleString()}</span>
                  {deal.startDate && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{deal.startDate} → {deal.endDate}</span>}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link to={`/messages?deal=${deal.id}`}>
                    <Button size="sm" variant="outline">Messages</Button>
                  </Link>
                  <Button size="sm" variant="outline">View Contract</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DealsPage;

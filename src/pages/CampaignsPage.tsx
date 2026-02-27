import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { mockCampaigns } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Megaphone, Plus, Search, Globe, Clock, DollarSign } from 'lucide-react';
import { Campaign } from '@/types';

const CampaignsPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const campaigns = mockCampaigns.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.casinoBrand.toLowerCase().includes(search.toLowerCase())
  );

  const isCasino = user?.role === 'casino';

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{isCasino ? 'My Campaigns' : 'Browse Campaigns'}</h1>
            <p className="text-sm text-muted-foreground">{isCasino ? 'Create and manage your streamer campaigns' : 'Find partnership opportunities'}</p>
          </div>
          {isCasino && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-brand hover:opacity-90"><Plus className="mr-2 h-4 w-4" />New Campaign</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); setCreateOpen(false); }}>
                  <div className="space-y-2"><Label>Title</Label><Input placeholder="e.g. Summer Slots Promotion" /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Describe the campaign requirements..." rows={3} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Budget ($)</Label><Input type="number" placeholder="50000" /></div>
                    <div className="space-y-2"><Label>Duration</Label><Input placeholder="3 months" /></div>
                  </div>
                  <div className="space-y-2"><Label>Target Geo</Label><Input placeholder="UK, DE, CA" /></div>
                  <div className="space-y-2"><Label>Requirements</Label><Textarea placeholder="Min viewers, audience requirements..." rows={2} /></div>
                  <Button type="submit" className="w-full bg-gradient-brand hover:opacity-90">Create Campaign</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search campaigns..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {campaigns.length === 0 ? (
          <EmptyState icon={<Megaphone className="h-6 w-6" />} title="No campaigns found" description="Try adjusting your search or check back later." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map(c => (
              <CampaignCard key={c.id} campaign={c} isCasino={isCasino} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

const CampaignCard: React.FC<{ campaign: Campaign; isCasino?: boolean }> = ({ campaign, isCasino }) => (
  <div className="group rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{campaign.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{campaign.casinoBrand}</p>
      </div>
      <StatusBadge status={campaign.status} />
    </div>
    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
    <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${campaign.budget.toLocaleString()}</span>
      <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{campaign.targetGeo.join(', ')}</span>
      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{campaign.duration}</span>
    </div>
    <div className="mt-4 flex items-center justify-between">
      <StatusBadge status={campaign.dealType} />
      <span className="text-xs text-muted-foreground">{campaign.applicationsCount} applications</span>
    </div>
    <div className="mt-4">
      {isCasino ? (
        <Button variant="outline" size="sm" className="w-full">Manage</Button>
      ) : (
        <Button size="sm" className="w-full bg-gradient-brand hover:opacity-90">Apply Now</Button>
      )}
    </div>
  </div>
);

export default CampaignsPage;

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { useCampaigns, useCreateCampaign, useSubmitApplication } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Megaphone, Plus, Search, Globe, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CampaignWithOrg } from '@/types/supabase-joins';

const CampaignsPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState<string | null>(null);
  const [applyMsg, setApplyMsg] = useState('');
  const [dealType, setDealType] = useState<'revshare' | 'cpa' | 'hybrid' | 'flat_fee'>('cpa');
  const { toast } = useToast();

  const { data: campaigns, isLoading } = useCampaigns(search);
  const createCampaign = useCreateCampaign();
  const submitApplication = useSubmitApplication();

  const isCasino = user?.role === 'casino_manager';

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await createCampaign.mutateAsync({
        title: fd.get('title') as string,
        description: fd.get('description') as string,
        budget: Number(fd.get('budget')),
        duration: fd.get('duration') as string,
        target_geo: (fd.get('target_geo') as string).split(',').map(s => s.trim()),
        deal_type: dealType,
        requirements: fd.get('requirements') as string,
      });
      setCreateOpen(false);
      toast({ title: 'Campaign created' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleApply = async () => {
    if (!applyOpen) return;
    try {
      await submitApplication.mutateAsync({ campaign_id: applyOpen, message: applyMsg });
      setApplyOpen(null);
      setApplyMsg('');
      toast({ title: 'Application submitted!' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

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
                <form className="space-y-4" onSubmit={handleCreate}>
                  <div className="space-y-2"><Label>Title</Label><Input name="title" placeholder="e.g. Summer Slots Promotion" required /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea name="description" placeholder="Describe the campaign requirements..." rows={3} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Budget ($)</Label><Input name="budget" type="number" placeholder="50000" /></div>
                    <div className="space-y-2"><Label>Duration</Label><Input name="duration" placeholder="3 months" /></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Deal Type</Label>
                    <Select value={dealType} onValueChange={(v) => setDealType(v as typeof dealType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cpa">CPA (Cost Per Acquisition)</SelectItem>
                        <SelectItem value="revshare">RevShare (Revenue Share)</SelectItem>
                        <SelectItem value="hybrid">Hybrid (CPA + RevShare)</SelectItem>
                        <SelectItem value="flat_fee">Flat Fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Target Geo</Label><Input name="target_geo" placeholder="UK, DE, CA" /></div>
                  <div className="space-y-2"><Label>Requirements</Label><Textarea name="requirements" placeholder="Min viewers, audience requirements..." rows={2} /></div>
                  <Button type="submit" className="w-full bg-gradient-brand hover:opacity-90" disabled={createCampaign.isPending}>
                    {createCampaign.isPending ? 'Creating...' : 'Create Campaign'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search campaigns..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {isLoading ? (
          <CampaignsSkeleton />
        ) : !campaigns?.length ? (
          <EmptyState icon={<Megaphone className="h-6 w-6" />} title="No campaigns found" description={isCasino ? "Create your first campaign to attract streamers." : "Try adjusting your search or check back later."} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((c: CampaignWithOrg) => (
              <div key={c.id} className="group rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated hover:border-primary/20 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{c.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{c.organizations?.name}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${Number(c.budget || 0).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{c.target_geo?.join(', ')}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.duration}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <StatusBadge status={c.deal_type} />
                  {isCasino ? (
                    <Button variant="outline" size="sm">Manage</Button>
                  ) : user?.role === 'streamer' && c.status === 'open' ? (
                    <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={() => setApplyOpen(c.id)}>Apply Now</Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!applyOpen} onOpenChange={open => { if (!open) setApplyOpen(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply to Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your message</Label>
              <Textarea value={applyMsg} onChange={e => setApplyMsg(e.target.value)} placeholder="Tell the casino why you're a great fit..." rows={4} />
            </div>
            <Button onClick={handleApply} className="w-full bg-gradient-brand hover:opacity-90" disabled={submitApplication.isPending}>
              {submitApplication.isPending ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CampaignsPage;

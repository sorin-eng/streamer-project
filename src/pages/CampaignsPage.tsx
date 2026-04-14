import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Megaphone, Plus, Globe, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SearchBar, PaginationControls } from '@/components/SearchPagination';
import type { CampaignWithOrg } from '@/types/supabase-joins';
import { CampaignsSkeleton } from '@/components/PageSkeletons';
import { getErrorMessage } from '@/lib/errors';

const PAGE_SIZE = 20;

const CampaignsPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState<string | null>(null);
  const [applyMsg, setApplyMsg] = useState('');
  const [dealType, setDealType] = useState<'revshare' | 'cpa' | 'hybrid' | 'flat_fee'>('cpa');
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: campaigns, isLoading } = useCampaigns(search);
  const createCampaign = useCreateCampaign();
  const submitApplication = useSubmitApplication();

  const isCasino = user?.role === 'casino_manager';

  // Client-side pagination on fetched results
  const totalCount = campaigns?.length || 0;
  const paginated = (campaigns || []).slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
      const message = getErrorMessage(err);
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
      const message = getErrorMessage(err);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{isCasino ? 'My Campaigns' : 'Browse Campaigns'}</h1>
            <p className="text-sm text-muted-foreground">
              {isCasino
                ? 'Use campaigns to collect applications, then move the real work into Deals.'
                : 'Apply when a casino is collecting interest. Once accepted, the partnership continues in Deals.'}
            </p>
          </div>
          {isCasino && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-brand hover:opacity-90"><Plus className="mr-2 h-4 w-4" />New Campaign</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Campaign</DialogTitle>
                  <DialogDescription>Define a campaign only when you want structured intake before moving the partnership into Deals.</DialogDescription>
                </DialogHeader>
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

        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5 shadow-card space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Supporting surface</p>
          <h2 className="font-semibold text-lg">Campaigns are optional intake, not the main product.</h2>
          <p className="text-sm text-muted-foreground">
            Discovery, negotiation, contracts, and execution should ultimately live in Deals. Campaigns are just a cleaner way to gather interest.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/deals')}>Open Deals</Button>
        </div>

        <SearchBar value={search} onChange={v => { setSearch(v); setPage(0); }} placeholder="Search campaigns..." />

        {isLoading ? (
          <CampaignsSkeleton />
        ) : !paginated.length ? (
          <EmptyState icon={<Megaphone className="h-6 w-6" />} title="No campaigns found" description={isCasino ? "Create your first campaign to attract streamers." : "Try adjusting your search or check back later."} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {paginated.map((c: CampaignWithOrg) => (
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
                    <Button variant="outline" size="sm" onClick={() => navigate('/deals')}>
                      Open Deals
                    </Button>
                  ) : user?.role === 'streamer' && c.status === 'open' ? (
                    <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={() => setApplyOpen(c.id)}>Apply Now</Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <PaginationControls page={page} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      <Dialog open={!!applyOpen} onOpenChange={open => { if (!open) { setApplyOpen(null); setApplyMsg(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Campaign</DialogTitle>
            <DialogDescription>Tell the casino why your audience fits, then expect the real workflow to continue inside Deals after acceptance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your message</Label>
              <Textarea value={applyMsg} onChange={e => setApplyMsg(e.target.value)} placeholder="Tell the casino why you're a great fit..." rows={4} />
            </div>
            <Button onClick={handleApply} className="w-full bg-gradient-brand hover:opacity-90" disabled={submitApplication.isPending || !applyMsg.trim()}>
              {submitApplication.isPending ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CampaignsPage;

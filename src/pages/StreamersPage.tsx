import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useBrowseStreamers, useInitiateContact } from '@/hooks/useSupabaseData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Users, Globe, DollarSign, ExternalLink, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import type { StreamerWithProfile } from '@/types/supabase-joins';
import type { Tables } from '@/integrations/supabase/types';
import { StreamersSkeleton } from '@/components/PageSkeletons';
import { PaginationControls } from '@/components/SearchPagination';

const PAGE_SIZE = 12;

const StreamersPage = () => {
  const { data: streamers, isLoading } = useBrowseStreamers();
  const initiateContact = useInitiateContact();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [contactDialog, setContactDialog] = useState<{ streamerId: string; name: string } | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [page, setPage] = useState(0);

  const filtered = (streamers || []).filter((s: StreamerWithProfile) => {
    const name = s.profiles?.display_name?.toLowerCase() || '';
    const matchesSearch = !search || name.includes(search.toLowerCase()) || s.bio?.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = !platformFilter || (s.platforms || []).includes(platformFilter);
    return matchesSearch && matchesPlatform;
  });
  const totalCount = filtered.length;
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleContact = async () => {
    if (!contactDialog) return;
    try {
      await initiateContact.mutateAsync({
        streamerId: contactDialog.streamerId,
        message: contactMessage,
      });
      toast({ title: 'Deal initiated', description: 'A negotiation thread has been created.' });
      setContactDialog(null);
      setContactMessage('');
      navigate('/deals');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const PLATFORM_FILTERS = ['Twitch', 'Kick', 'YouTube', 'TikTok'];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Browse Streamers</h1>
          <p className="text-sm text-muted-foreground">Discover streamers and view their listings</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or bio..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 flex-nowrap">
            <Button variant={platformFilter === null ? 'default' : 'outline'} size="sm" className="shrink-0" onClick={() => { setPlatformFilter(null); setPage(0); }}>All</Button>
            {PLATFORM_FILTERS.map(p => (
              <Button key={p} variant={platformFilter === p ? 'default' : 'outline'} size="sm" className="shrink-0" onClick={() => setPlatformFilter(p)}>{p}</Button>
            ))}
          </div>
        </div>

        {isLoading && <StreamersSkeleton />}

        {!isLoading && filtered.length === 0 && (
          <EmptyState icon={<Users className="h-12 w-12" />} title="No streamers found" description="Try adjusting your search or filters" />
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map((streamer: StreamerWithProfile) => (
            <div key={streamer.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all space-y-4">
              <Link to={`/streamers/${streamer.user_id}`} className="flex items-center gap-3 group">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-lg font-bold text-primary-foreground shrink-0">
                  {streamer.profiles?.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{streamer.profiles?.display_name || 'Streamer'}</h3>
                  <div className="flex items-center gap-2">
                    {streamer.verified === 'approved' && <StatusBadge status="approved" />}
                    {streamer.niche_type && <span className="text-xs text-muted-foreground">{streamer.niche_type}</span>}
                  </div>
                </div>
              </Link>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted p-2">
                  <p className="text-sm font-bold">{((streamer.follower_count || 0) / 1000).toFixed(0)}K</p>
                  <p className="text-[10px] text-muted-foreground">Followers</p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <p className="text-sm font-bold">{(streamer.avg_live_viewers || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Avg Viewers</p>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <p className="text-sm font-bold">{streamer.engagement_rate || 0}%</p>
                  <p className="text-[10px] text-muted-foreground">Engagement</p>
                </div>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {(streamer.platforms || []).map((p: string) => (
                  <span key={p} className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{p}</span>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap">
                {streamer.twitch_url && <a href={streamer.twitch_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />Twitch</a>}
                {streamer.kick_url && <a href={streamer.kick_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />Kick</a>}
                {streamer.youtube_url && <a href={streamer.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />YouTube</a>}
              </div>

              {(streamer.audience_geo || []).length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />{streamer.audience_geo.join(', ')}
                </div>
              )}

              {streamer.listings && streamer.listings.length > 0 && (
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Listings</p>
                  {streamer.listings.slice(0, 2).map((listing: Tables<'streamer_listings'>) => (
                    <div key={listing.id} className="rounded-lg bg-muted/50 p-2.5">
                      <p className="text-sm font-medium">{listing.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                          <DollarSign className="h-3 w-3" />{listing.price_amount} {listing.price_currency}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">{listing.pricing_type?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {streamer.bio && <p className="text-xs text-muted-foreground line-clamp-2">{streamer.bio}</p>}

              <Button
                className="w-full bg-gradient-brand hover:opacity-90"
                size="sm"
                onClick={() => setContactDialog({
                  streamerId: streamer.user_id,
                  name: streamer.profiles?.display_name || 'Streamer',
                })}
              >
                <MessageSquare className="mr-2 h-4 w-4" />Contact Streamer
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!contactDialog} onOpenChange={(open) => { if (!open) { setContactDialog(null); setContactMessage(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {contactDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will create a new deal negotiation thread. Introduce yourself and describe the partnership you're looking for.
            </p>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                rows={4}
                placeholder="Hi, I'm interested in partnering with you for..."
                value={contactMessage}
                onChange={e => setContactMessage(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-gradient-brand hover:opacity-90"
              onClick={handleContact}
              disabled={!contactMessage.trim() || initiateContact.isPending}
            >
              {initiateContact.isPending ? 'Sending...' : 'Start Negotiation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StreamersPage;

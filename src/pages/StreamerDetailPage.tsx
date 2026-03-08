import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { useBrowseStreamers, useInitiateContact } from '@/hooks/useSupabaseData';
import { useState } from 'react';
import {
  Users, Globe, DollarSign, ExternalLink, MessageSquare, ArrowLeft,
  Eye, TrendingUp, BarChart3, Zap
} from 'lucide-react';
import type { StreamerWithProfile } from '@/types/supabase-joins';
import type { Tables } from '@/integrations/supabase/types';

const StreamerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: streamers, isLoading } = useBrowseStreamers();
  const initiateContact = useInitiateContact();
  const { toast } = useToast();
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');

  const streamer = streamers?.find((s: StreamerWithProfile) => s.user_id === id);

  const handleContact = async () => {
    if (!streamer) return;
    try {
      await initiateContact.mutateAsync({
        streamerId: streamer.user_id,
        message: contactMessage,
      });
      toast({ title: 'Deal initiated', description: 'A negotiation thread has been created.' });
      setContactOpen(false);
      setContactMessage('');
      navigate('/deals');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      </DashboardLayout>
    );
  }

  if (!streamer) {
    return (
      <DashboardLayout>
        <EmptyState icon={<Users className="h-6 w-6" />} title="Streamer not found" description="This profile doesn't exist or has been removed." />
      </DashboardLayout>
    );
  }

  const displayName = streamer.profiles?.display_name || 'Streamer';

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-brand text-3xl font-bold text-primary-foreground shrink-0">
              {displayName[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                {streamer.verified === 'approved' && <StatusBadge status="approved" />}
                {streamer.niche_type && (
                  <span className="inline-flex items-center rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-foreground">{streamer.niche_type}</span>
                )}
              </div>
              {streamer.bio && <p className="text-sm text-muted-foreground mt-2">{streamer.bio}</p>}
            </div>
            <Button className="bg-gradient-brand hover:opacity-90 shrink-0" onClick={() => setContactOpen(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />Contact Streamer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Followers', value: ((streamer.follower_count || 0) / 1000).toFixed(0) + 'K', icon: Users },
            { label: 'Avg Viewers', value: (streamer.avg_live_viewers || 0).toLocaleString(), icon: Eye },
            { label: 'Engagement', value: `${streamer.engagement_rate || 0}%`, icon: TrendingUp },
            { label: 'Monthly Impr.', value: ((streamer.monthly_impressions || 0) / 1000).toFixed(0) + 'K', icon: BarChart3 },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center shadow-card">
              <stat.icon className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          <h2 className="font-semibold">Platforms & Links</h2>
          <div className="flex gap-2 flex-wrap">
            {(streamer.platforms || []).map((p: string) => (
              <span key={p} className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">{p}</span>
            ))}
          </div>
          <div className="flex gap-4 flex-wrap">
            {streamer.twitch_url && <a href={streamer.twitch_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5" />Twitch</a>}
            {streamer.kick_url && <a href={streamer.kick_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5" />Kick</a>}
            {streamer.youtube_url && <a href={streamer.youtube_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5" />YouTube</a>}
            {streamer.twitter_url && <a href={streamer.twitter_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5" />Twitter</a>}
            {streamer.tiktok_url && <a href={streamer.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5" />TikTok</a>}
            {streamer.instagram_url && <a href={streamer.instagram_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5" />Instagram</a>}
            {streamer.discord_url && <a href={streamer.discord_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3.5 w-3.5" />Discord</a>}
          </div>
        </div>

        {(streamer.audience_geo || []).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
            <h2 className="font-semibold flex items-center gap-2"><Globe className="h-4 w-4" />Audience Geography</h2>
            <div className="flex gap-2 flex-wrap">
              {streamer.audience_geo.map((geo: string) => (
                <span key={geo} className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">{geo}</span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Zap className="h-4 w-4" />Active Listings</h2>
          {streamer.listings && streamer.listings.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {streamer.listings.map((listing: Tables<'streamer_listings'>) => (
                <div key={listing.id} className="rounded-lg border border-border p-4 space-y-2">
                  <h3 className="font-medium">{listing.title}</h3>
                  {listing.description && <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sm font-semibold text-primary">
                      <DollarSign className="h-3.5 w-3.5" />{listing.price_amount} {listing.price_currency}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{listing.pricing_type?.replace('_', ' ')}</span>
                  </div>
                  {listing.platforms?.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {listing.platforms.map((p: string) => (
                        <span key={p} className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active listings</p>
          )}
        </div>

        {streamer.past_deals > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            {streamer.past_deals} completed deal{streamer.past_deals !== 1 ? 's' : ''} on Castreamino
          </div>
        )}
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact {displayName}</DialogTitle>
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

export default StreamerDetailPage;

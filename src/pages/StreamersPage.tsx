import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useBrowseStreamers } from '@/hooks/useSupabaseData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Search, Users, Eye, Globe, DollarSign, MessageSquare, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const StreamersPage = () => {
  const { data: streamers, isLoading } = useBrowseStreamers();
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);

  const filtered = (streamers || []).filter(s => {
    const name = (s.profiles as any)?.display_name?.toLowerCase() || '';
    const matchesSearch = !search || name.includes(search.toLowerCase()) || s.bio?.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = !platformFilter || (s.platforms || []).includes(platformFilter);
    return matchesSearch && matchesPlatform;
  });

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
          <div className="flex gap-2">
            <Button variant={platformFilter === null ? 'default' : 'outline'} size="sm" onClick={() => setPlatformFilter(null)}>All</Button>
            {PLATFORM_FILTERS.map(p => (
              <Button key={p} variant={platformFilter === p ? 'default' : 'outline'} size="sm" onClick={() => setPlatformFilter(p)}>{p}</Button>
            ))}
          </div>
        </div>

        {isLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}

        {!isLoading && filtered.length === 0 && (
          <EmptyState icon={<Users className="h-12 w-12" />} title="No streamers found" description="Try adjusting your search or filters" />
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(streamer => (
            <div key={streamer.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-brand text-lg font-bold text-primary-foreground shrink-0">
                  {(streamer.profiles as any)?.display_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{(streamer.profiles as any)?.display_name || 'Streamer'}</h3>
                  <div className="flex items-center gap-2">
                    {streamer.verified === 'approved' && <StatusBadge status="approved" />}
                    {streamer.niche_type && <span className="text-xs text-muted-foreground">{streamer.niche_type}</span>}
                  </div>
                </div>
              </div>

              {/* Stats */}
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

              {/* Platforms */}
              <div className="flex gap-1.5 flex-wrap">
                {(streamer.platforms || []).map((p: string) => (
                  <span key={p} className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{p}</span>
                ))}
              </div>

              {/* Platform links */}
              <div className="flex gap-2 flex-wrap">
                {streamer.twitch_url && <a href={streamer.twitch_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />Twitch</a>}
                {streamer.kick_url && <a href={streamer.kick_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />Kick</a>}
                {streamer.youtube_url && <a href={streamer.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />YouTube</a>}
              </div>

              {/* Geo */}
              {(streamer.audience_geo || []).length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Globe className="h-3 w-3" />{streamer.audience_geo.join(', ')}
                </div>
              )}

              {/* Active Listings */}
              {streamer.listings && streamer.listings.length > 0 && (
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Listings</p>
                  {streamer.listings.slice(0, 2).map((listing: any) => (
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

              {/* Bio */}
              {streamer.bio && <p className="text-xs text-muted-foreground line-clamp-2">{streamer.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StreamersPage;

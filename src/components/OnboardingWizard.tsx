import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Radio, ArrowRight, ArrowLeft, Check, Globe, BarChart3, Tag } from 'lucide-react';
import { useUpdateStreamerProfile, useCreateListing } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const PLATFORMS = ['Twitch', 'Kick', 'YouTube', 'TikTok'];
const PRICING_TYPES = [
  { value: 'fixed_per_stream', label: 'Fixed Per Stream' },
  { value: 'fixed_package', label: 'Fixed Package' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'negotiable', label: 'Negotiable' },
];
const CURRENCIES = ['USDT', 'BTC', 'ETH', 'USDC'];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const updateProfile = useUpdateStreamerProfile();
  const createListing = useCreateListing();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platformUrls, setPlatformUrls] = useState<Record<string, string>>({});

  // Step 2: Stats
  const [stats, setStats] = useState({ follower_count: '', avg_live_viewers: '', engagement_rate: '', bio: '' });

  // Step 3: Listing
  const [listing, setListing] = useState({ title: '', description: '', pricing_type: 'negotiable', price_amount: '', currency: 'USDT' });

  const steps = [
    { icon: <Globe className="h-5 w-5" />, label: 'Connect Platforms' },
    { icon: <BarChart3 className="h-5 w-5" />, label: 'Your Stats' },
    { icon: <Tag className="h-5 w-5" />, label: 'First Listing' },
  ];

  const progress = ((step + 1) / steps.length) * 100;
  const canGoNext =
    step === 0 ? selectedPlatforms.length > 0 :
    step === 1 ? Boolean(stats.bio.trim() || stats.follower_count || stats.avg_live_viewers) :
    true;

  const checklist = [
    { label: 'Pick at least one platform', done: selectedPlatforms.length > 0 },
    { label: 'Add a short bio or stats', done: Boolean(stats.bio.trim() || stats.follower_count || stats.avg_live_viewers) },
    { label: 'Optional: create your first listing', done: Boolean(listing.title.trim()) },
  ];

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save profile
      const urlMap: Record<string, string | null> = {
        twitch_url: platformUrls.Twitch || null,
        kick_url: platformUrls.Kick || null,
        youtube_url: platformUrls.YouTube || null,
        tiktok_url: platformUrls.TikTok || null,
      };
      await updateProfile.mutateAsync({
        platforms: selectedPlatforms,
        ...urlMap,
        bio: stats.bio || null,
        follower_count: Number(stats.follower_count) || 0,
        avg_live_viewers: Number(stats.avg_live_viewers) || 0,
        engagement_rate: Number(stats.engagement_rate) || 0,
      });

      // Create listing if filled
      if (listing.title.trim()) {
        await createListing.mutateAsync({
          title: listing.title,
          description: listing.description,
          pricing_type: listing.pricing_type,
          price_amount: Number(listing.price_amount) || 0,
          price_currency: listing.currency,
          platforms: selectedPlatforms,
        });
      }

      toast({ title: 'Welcome to Castreamino!', description: 'Your profile is set up and ready.' });
      onComplete();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
              <Radio className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Welcome, {user?.displayName}!</span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between mt-3">
            {steps.map((s, i) => (
              <div key={i} className={`flex items-center gap-1.5 text-xs font-medium ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 min-h-[300px]">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Launch checklist</p>
            <div className="space-y-1.5">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${item.done ? 'bg-primary text-primary-foreground' : 'bg-background border border-border text-muted-foreground'}`}>
                    {item.done ? <Check className="h-3 w-3" /> : '•'}
                  </span>
                  <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {step === 0 && (
            <>
              <h3 className="font-semibold text-lg">Where do you stream?</h3>
              <p className="text-sm text-muted-foreground">Select your platforms and paste your profile URLs.</p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <Button
                    key={p}
                    variant={selectedPlatforms.includes(p) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              {selectedPlatforms.map(p => (
                <div key={p} className="space-y-1">
                  <Label className="text-xs">{p} URL</Label>
                  <Input
                    placeholder={`https://${p.toLowerCase()}.com/...`}
                    value={platformUrls[p] || ''}
                    onChange={e => setPlatformUrls(prev => ({ ...prev, [p]: e.target.value }))}
                  />
                </div>
              ))}
            </>
          )}

          {step === 1 && (
            <>
              <h3 className="font-semibold text-lg">Your streaming stats</h3>
              <p className="text-sm text-muted-foreground">Help casinos understand your reach. You can update these later.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Followers</Label>
                  <Input type="number" placeholder="10000" value={stats.follower_count} onChange={e => setStats(s => ({ ...s, follower_count: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Avg Live Viewers</Label>
                  <Input type="number" placeholder="500" value={stats.avg_live_viewers} onChange={e => setStats(s => ({ ...s, avg_live_viewers: e.target.value }))} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Engagement Rate (%)</Label>
                  <Input type="number" step="0.1" placeholder="3.5" value={stats.engagement_rate} onChange={e => setStats(s => ({ ...s, engagement_rate: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Short Bio</Label>
                <Textarea placeholder="Tell casinos about your streaming style..." rows={3} value={stats.bio} onChange={e => setStats(s => ({ ...s, bio: e.target.value }))} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="font-semibold text-lg">Create your first listing</h3>
              <p className="text-sm text-muted-foreground">This is what casinos see when browsing. You can skip and create one later.</p>
              <div className="space-y-1">
                <Label className="text-xs">Listing Title</Label>
                <Input placeholder="e.g. Slots Streaming on Kick — 2hr sessions" value={listing.title} onChange={e => setListing(l => ({ ...l, title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea placeholder="What's included..." rows={2} value={listing.description} onChange={e => setListing(l => ({ ...l, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Pricing</Label>
                  <Select value={listing.pricing_type} onValueChange={v => setListing(l => ({ ...l, pricing_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRICING_TYPES.map(pt => <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price</Label>
                  <Input type="number" placeholder="500" value={listing.price_amount} onChange={e => setListing(l => ({ ...l, price_amount: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Currency</Label>
                  <Select value={listing.currency} onValueChange={v => setListing(l => ({ ...l, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6">
          <div>
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back
              </Button>
            )}
            {step === 0 && (
              <Button variant="ghost" size="sm" onClick={onComplete} className="text-muted-foreground">
                Skip setup
              </Button>
            )}
          </div>
          {step < 2 ? (
            <Button className="bg-gradient-brand hover:opacity-90" onClick={() => setStep(s => s + 1)} disabled={!canGoNext}>
              Next <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button className="bg-gradient-brand hover:opacity-90" onClick={handleFinish} disabled={saving}>
              {saving ? 'Setting up...' : 'Finish Setup'} <Check className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

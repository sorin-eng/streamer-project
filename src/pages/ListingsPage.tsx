import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStreamerListings, useCreateListing, useUpdateListing, useDeleteListing } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Plus, Edit2, Trash2, DollarSign, Tag, Pause, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/errors';

const PRICING_TYPES = [
  { value: 'fixed_per_stream', label: 'Fixed Per Stream' },
  { value: 'fixed_package', label: 'Fixed Package' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'negotiable', label: 'Negotiable' },
];

const PLATFORMS = ['Twitch', 'Kick', 'YouTube', 'TikTok'];
const CURRENCIES = ['USDT', 'BTC', 'ETH', 'USDC'];

const ListingsPage = () => {
  const { user } = useAuth();
  const { data: listings, isLoading } = useStreamerListings(user?.id);
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pricingType, setPricingType] = useState('negotiable');
  const [currency, setCurrency] = useState('USDT');

  const editListing = listings?.find(l => l.id === editingId);

  const openCreate = () => {
    setEditingId(null);
    setPricingType('negotiable');
    setCurrency('USDT');
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const listing = listings?.find(l => l.id === id);
    setEditingId(id);
    setPricingType(listing?.pricing_type || 'negotiable');
    setCurrency(listing?.price_currency || 'USDT');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const platforms = PLATFORMS.filter(p => fd.get(`platform_${p}`) === 'on');

    if (platforms.length === 0) {
      toast({ title: 'Error', description: 'Select at least one platform for the listing.', variant: 'destructive' });
      return;
    }

    const values = {
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      pricing_type: pricingType,
      price_amount: Number(fd.get('price_amount')) || 0,
      price_currency: currency,
      min_streams: Number(fd.get('min_streams')) || undefined,
      package_details: fd.get('package_details') as string || undefined,
      platforms,
    };

    try {
      if (editingId) {
        await updateListing.mutateAsync({ id: editingId, ...values, pricing_type: values.pricing_type as 'fixed_per_stream' | 'fixed_package' | 'hourly' | 'negotiable' });
        toast({ title: 'Listing updated' });
      } else {
        await createListing.mutateAsync(values);
        toast({ title: 'Listing created' });
      }
      setDialogOpen(false);
      setEditingId(null);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this listing?')) return;

    try {
      await deleteListing.mutateAsync(id);
      toast({ title: 'Listing deleted' });
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await updateListing.mutateAsync({ id, status: newStatus });
      toast({ title: `Listing ${newStatus === 'active' ? 'activated' : 'paused'}` });
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Listings</h1>
            <p className="text-sm text-muted-foreground">Create listings so casinos can find and contact you</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingId(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-brand hover:opacity-90" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Listing</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Listing' : 'Create Listing'}</DialogTitle>
                <DialogDescription>Define the offer casinos see when deciding whether to contact you.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input name="title" required defaultValue={editListing?.title || ''} placeholder="e.g. Slots Streaming on Kick — 2hr sessions" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" rows={3} defaultValue={editListing?.description || ''} placeholder="Describe your streaming offer..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pricing Type</Label>
                    <Select value={pricingType} onValueChange={setPricingType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRICING_TYPES.map(pt => (
                          <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price Amount</Label>
                    <Input name="price_amount" type="number" step="0.01" defaultValue={editListing?.price_amount || ''} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Streams (optional)</Label>
                    <Input name="min_streams" type="number" defaultValue={editListing?.min_streams || ''} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Package Details (optional)</Label>
                  <Input name="package_details" defaultValue={editListing?.package_details || ''} placeholder="e.g. 10 streams over 2 weeks" />
                </div>
                <div className="space-y-2">
                  <Label>Platforms</Label>
                  <div className="flex gap-3">
                    {PLATFORMS.map(p => (
                      <label key={p} className="flex items-center gap-1.5 text-sm">
                        <input type="checkbox" name={`platform_${p}`} defaultChecked={editListing?.platforms?.includes(p)} className="rounded" />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-brand hover:opacity-90" disabled={createListing.isPending || updateListing.isPending}>
                  {editingId ? 'Update Listing' : 'Create Listing'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}

        {!isLoading && (!listings || listings.length === 0) && (
          <EmptyState icon={<Tag className="h-12 w-12" />} title="No listings yet" description="Create your first listing to get discovered by casino partners" />
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {(listings || []).map(listing => (
            <div key={listing.id} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{listing.description}</p>
                </div>
                <StatusBadge status={listing.status} />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-primary font-semibold">
                  <DollarSign className="h-3.5 w-3.5" />
                  {listing.price_amount} {listing.price_currency}
                </span>
                <span className="text-muted-foreground capitalize">{listing.pricing_type?.replace('_', ' ')}</span>
              </div>
              <div className="flex gap-1.5">
                {(listing.platforms || []).map((p: string) => (
                  <span key={p} className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{p}</span>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" aria-label={`Edit ${listing.title}`} onClick={() => openEdit(listing.id)}>
                  <Edit2 className="mr-1 h-3 w-3" />Edit
                </Button>
                <Button size="sm" variant="outline" aria-label={`${listing.status === 'active' ? 'Pause' : 'Activate'} ${listing.title}`} onClick={() => handleToggleStatus(listing.id, listing.status)}>
                  {listing.status === 'active' ? <><Pause className="mr-1 h-3 w-3" />Pause</> : <><Play className="mr-1 h-3 w-3" />Activate</>}
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Delete ${listing.title}`} className="text-destructive hover:text-destructive" onClick={() => handleDelete(listing.id)}>
                  <Trash2 className="mr-1 h-3 w-3" />Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ListingsPage;

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { Webhook, Plus, Trash2, Eye } from 'lucide-react';
import { createWebhookEndpoint, deleteWebhookEndpoint as removeWebhookEndpoint, getWebhookDeliveries, getWebhookEndpoints, updateWebhookEndpointActive } from '@/core/services/platformService';

const AVAILABLE_EVENTS = [
  'deal.created', 'deal.state_change', 'deal.completed',
  'application.submitted', 'application.accepted', 'application.rejected',
  'commission.created', 'commission.approved', 'commission.paid',
  'contract.signed',
];

export const WebhookSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewEndpoint, setViewEndpoint] = useState<any>(null);
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const { data: endpoints } = useQuery({
    queryKey: ['webhook_endpoints', user?.organizationId],
    enabled: !!user?.organizationId,
    queryFn: async () => getWebhookEndpoints(user!.organizationId!),
  });

  const { data: deliveries } = useQuery({
    queryKey: ['webhook_deliveries', viewEndpoint?.id],
    enabled: !!viewEndpoint,
    queryFn: async () => getWebhookDeliveries(viewEndpoint!.id),
  });

  const createEndpoint = useMutation({
    mutationFn: async () => {
      if (!user?.organizationId || !newUrl.trim()) throw new Error('Missing data');
      await createWebhookEndpoint({ organizationId: user.organizationId, url: newUrl, events: selectedEvents });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhook_endpoints'] });
      setCreateOpen(false);
      setNewUrl('');
      setSelectedEvents([]);
      toast({ title: 'Webhook endpoint created' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await updateWebhookEndpointActive(id, active);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhook_endpoints'] }),
  });

  const deleteEndpoint = useMutation({
    mutationFn: async (id: string) => removeWebhookEndpoint(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhook_endpoints'] });
      toast({ title: 'Endpoint deleted' });
    },
  });

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Webhook className="h-4 w-4" /> Webhook Endpoints
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Use this only if internal tools need deal or commission events pushed out automatically.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-3 w-3" /> Add Endpoint
        </Button>
      </div>

      {(!endpoints || endpoints.length === 0) ? (
        <p className="text-sm text-muted-foreground">No webhook endpoints configured</p>
      ) : (
        <div className="space-y-3">
          {endpoints.map(ep => (
            <div key={ep.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium font-mono truncate">{ep.url}</p>
                <p className="text-xs text-muted-foreground">{ep.events.length} events · Created {new Date(ep.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <Switch
                  checked={ep.active}
                  onCheckedChange={(active) => toggleActive.mutate({ id: ep.id, active })}
                  aria-label={`Toggle ${ep.url}`}
                />
                <Button size="sm" variant="ghost" aria-label={`View deliveries for ${ep.url}`} onClick={() => setViewEndpoint(ep)}>
                  <Eye className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Delete ${ep.url}`} className="text-destructive" onClick={() => deleteEndpoint.mutate(ep.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
            <DialogDescription>Configure a callback URL for the specific events your ops stack actually needs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Endpoint URL</Label>
              <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://your-app.com/webhooks" />
            </div>
            <div className="space-y-2">
              <Label>Events to Subscribe</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {AVAILABLE_EVENTS.map(event => (
                  <label key={event} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedEvents.includes(event)} onCheckedChange={() => toggleEvent(event)} />
                    <span className="font-mono text-xs">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button
              className="w-full bg-gradient-brand hover:opacity-90"
              onClick={() => createEndpoint.mutate()}
              disabled={!newUrl.trim() || selectedEvents.length === 0 || createEndpoint.isPending}
            >
              {createEndpoint.isPending ? 'Creating...' : 'Create Endpoint'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deliveries Dialog */}
      <Dialog open={!!viewEndpoint} onOpenChange={open => { if (!open) setViewEndpoint(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Delivery History</DialogTitle>
            <DialogDescription>Inspect recent delivery attempts so failed automation is obvious instead of mysterious.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs font-mono text-muted-foreground truncate">{viewEndpoint?.url}</p>
            <p className="text-xs text-muted-foreground">Secret: <code className="bg-muted px-1 rounded">{viewEndpoint?.secret?.slice(0, 12)}...</code></p>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {(!deliveries || deliveries.length === 0) ? (
              <p className="text-sm text-muted-foreground text-center py-4">No deliveries yet</p>
            ) : deliveries.map(d => (
              <div key={d.id} className="rounded-lg border border-border p-2 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium">{d.event_type}</span>
                  <StatusBadge status={d.response_status && d.response_status < 300 ? 'approved' : 'pending'} />
                </div>
                <p className="text-muted-foreground">
                  Status: {d.response_status || '—'} · Attempts: {d.attempts} · {new Date(d.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

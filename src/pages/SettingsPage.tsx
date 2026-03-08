import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useStreamerProfile, useUpdateStreamerProfile } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Settings, Wallet, Bell, FileText, Trash2 } from 'lucide-react';
import { queryDisclaimerAcceptances, deleteDisclaimerAcceptance } from '@/lib/supabaseHelpers';
import { useQueryClient } from '@tanstack/react-query';

const CRYPTOS = ['USDT', 'BTC', 'ETH', 'USDC', 'SOL'];

interface DisclaimerAcceptance {
  id: string;
  disclaimer_type: string;
  disclaimer_version: string;
  created_at: string;
}

const SettingsPage = () => {
  const { user } = useAuth();
  const { data: profile } = useStreamerProfile(user?.id);
  const updateProfile = useUpdateStreamerProfile();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [walletAddress, setWalletAddress] = useState('');
  const [preferredCrypto, setPreferredCrypto] = useState('USDT');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [disclaimers, setDisclaimers] = useState<DisclaimerAcceptance[]>([]);

  useEffect(() => {
    if (profile) {
      setWalletAddress(profile.wallet_address || '');
      setPreferredCrypto(profile.preferred_crypto || 'USDT');
    }
  }, [profile]);

  useEffect(() => {
    if (user?.id) {
      queryDisclaimerAcceptances(user.id).then(({ data }) => {
        if (data) setDisclaimers(data as DisclaimerAcceptance[]);
      });
    }
  }, [user?.id]);

  const handleSavePayment = async () => {
    try {
      await updateProfile.mutateAsync({
        wallet_address: walletAddress || null,
        preferred_crypto: preferredCrypto,
      });
      toast({ title: 'Payment settings saved' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleRevokeDisclaimer = async (id: string) => {
    try {
      const { error } = await deleteDisclaimerAcceptance(id);
      if (error) throw error;
      setDisclaimers(prev => prev.filter(d => d.id !== id));
      qc.invalidateQueries({ queryKey: ['compliance_status'] });
      toast({ title: 'Disclaimer acceptance revoked' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" /> Settings
          </h1>
          <p className="text-sm text-muted-foreground">Manage your account preferences</p>
        </div>

        {/* Payment Settings */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Payment Settings
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <Input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x... or bc1..."
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred Crypto</Label>
              <Select value={preferredCrypto} onValueChange={setPreferredCrypto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CRYPTOS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            className="bg-gradient-brand hover:opacity-90"
            onClick={handleSavePayment}
            disabled={updateProfile.isPending}
          >
            Save Payment Settings
          </Button>
        </div>

        {/* Notification Preferences */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive deal updates and messages via email</p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">In-App Notifications</p>
              <p className="text-xs text-muted-foreground">Show notification bell alerts</p>
            </div>
            <Switch checked={true} disabled />
          </div>
        </div>

        {/* Disclaimer Acceptances */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> Legal Acceptances
          </h2>
          {disclaimers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active acceptances</p>
          ) : (
            <div className="space-y-3">
              {disclaimers.map(d => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium capitalize">{d.disclaimer_type} Policy</p>
                    <p className="text-xs text-muted-foreground">
                      v{d.disclaimer_version} · Accepted {new Date(d.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRevokeDisclaimer(d.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" /> Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;

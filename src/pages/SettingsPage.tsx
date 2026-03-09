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
import { Settings, Wallet, Bell, FileText, Trash2, Lock } from 'lucide-react';
import { queryDisclaimerAcceptances, deleteDisclaimerAcceptance, updateNotificationPreferences } from '@/lib/supabaseHelpers';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WebhookSettings } from '@/components/WebhookSettings';

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

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setWalletAddress(profile.wallet_address || '');
      setPreferredCrypto(profile.preferred_crypto || 'USDT');
    }
  }, [profile]);

  // Load notification preferences from profiles
  useEffect(() => {
    if (user?.id) {
      supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }: { data: Record<string, unknown> | null }) => {
          if (data?.notification_preferences) {
            const prefs = data.notification_preferences as Record<string, boolean>;
            setEmailNotifications(prefs.email !== false);
          }
        });
    }
  }, [user?.id]);

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

  const handleToggleEmailNotifications = async (checked: boolean) => {
    setEmailNotifications(checked);
    try {
      await updateNotificationPreferences(user!.id, { email: checked });
    } catch {
      // silent
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: 'Password too short', description: 'Minimum 8 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password updated successfully' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setChangingPassword(false);
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

        {/* Password Change */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword} variant="outline">
            {changingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </div>

        {/* Payment Settings */}
        {user?.role === 'streamer' && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Payment Settings
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Wallet Address</Label>
                <Input value={walletAddress} onChange={e => setWalletAddress(e.target.value)} placeholder="0x... or bc1..." />
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
            <Button className="bg-gradient-brand hover:opacity-90" onClick={handleSavePayment} disabled={updateProfile.isPending}>
              Save Payment Settings
            </Button>
          </div>
        )}

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
            <Switch checked={emailNotifications} onCheckedChange={handleToggleEmailNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">In-App Notifications</p>
              <p className="text-xs text-muted-foreground">Show notification bell alerts</p>
            </div>
            <Switch checked={true} disabled />
          </div>
        </div>

        {/* Webhook Settings - Casino managers only */}
        {user?.role === 'casino_manager' && <WebhookSettings />}

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
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleRevokeDisclaimer(d.id)}>
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

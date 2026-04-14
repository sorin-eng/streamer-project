import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  latestEligibleBirthDate,
  useComplianceStatus,
  useSubmitAgeVerification,
  useAcceptDisclaimer,
} from '@/hooks/useCompliance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Calendar, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface ComplianceGateProps {
  children: React.ReactNode;
  requireKyc?: boolean;
}

export const ComplianceGate: React.FC<ComplianceGateProps> = ({ children, requireKyc = false }) => {
  const { user } = useAuth();
  const { data: compliance, isLoading } = useComplianceStatus();
  const [dob, setDob] = useState('');
  const submitAge = useSubmitAgeVerification();
  const acceptDisclaimer = useAcceptDisclaimer();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <>{children}</>;

  const showAgeGate = Boolean(compliance && !compliance.age_verified);
  const showDisclaimers = Boolean(compliance && !showAgeGate && (!compliance.terms_accepted || !compliance.privacy_accepted));

  const handleAgeSubmit = async () => {
    try {
      await submitAge.mutateAsync({ date_of_birth: dob });
      toast({ title: 'Age verified' });
    } catch (err: any) {
      toast({ title: 'Age verification failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleAcceptAll = async () => {
    try {
      if (!compliance?.terms_accepted) {
        await acceptDisclaimer.mutateAsync({ disclaimer_type: 'terms', disclaimer_version: '1.0' });
      }
      if (!compliance?.privacy_accepted) {
        await acceptDisclaimer.mutateAsync({ disclaimer_type: 'privacy', disclaimer_version: '1.0' });
      }
      toast({ title: 'Disclaimers accepted' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (requireKyc && compliance?.kyc_status !== 'verified') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
          <Shield className="h-6 w-6 text-warning" />
        </div>
        <h3 className="text-lg font-semibold">Verification Required</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {compliance?.kyc_status === 'pending'
            ? 'Your verification is being reviewed. You will be notified once approved.'
            : compliance?.kyc_status === 'rejected'
              ? 'Your verification was rejected. Please submit updated documents.'
              : 'You need to complete KYC verification before accessing this feature.'}
        </p>
        <Link to="/profile" className="mt-4">
          <Button className="bg-gradient-brand hover:opacity-90">
            {compliance?.kyc_status === 'rejected' ? 'Resubmit Documents' : 'Go to Profile'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Dialog open={showAgeGate} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Age Verification Required
            </DialogTitle>
            <DialogDescription>
              Confirm your age before using features related to gambling partnerships and payouts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
              <p className="text-sm text-muted-foreground">
                <AlertTriangle className="inline h-4 w-4 text-warning mr-1" />
                This platform involves gambling-related content. You must be at least <strong>18 years old</strong> (21 in some jurisdictions) to use it.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                max={latestEligibleBirthDate(18)}
                required
              />
            </div>
            <Button
              className="w-full bg-gradient-brand hover:opacity-90"
              onClick={handleAgeSubmit}
              disabled={!dob || submitAge.isPending}
            >
              {submitAge.isPending ? 'Verifying...' : 'Confirm Age'}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By confirming, you certify your date of birth is accurate.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisclaimers && !showAgeGate} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Accept Legal Disclaimers
            </DialogTitle>
            <DialogDescription>
              Review the platform terms and compliance disclaimers before continuing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted p-4 space-y-3 max-h-60 overflow-y-auto text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Platform Disclaimer</p>
              <p>Castreamino is a B2B brokerage platform. It does NOT operate gambling services, does NOT process bets, and does NOT function as a casino.</p>
              <p>By using this platform you agree to:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>The <Link to="/terms" className="text-primary underline">Terms of Service</Link> (v1.0)</li>
                <li>The <Link to="/privacy" className="text-primary underline">Privacy Policy</Link> (v1.0)</li>
                <li>Comply with gambling advertising laws in your jurisdiction</li>
                <li>All campaigns must include responsible gambling disclaimers</li>
              </ul>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Your acceptance will be logged with timestamp and version number for compliance records.
              </p>
            </div>
            <Button
              className="w-full bg-gradient-brand hover:opacity-90"
              onClick={handleAcceptAll}
              disabled={acceptDisclaimer.isPending}
            >
              {acceptDisclaimer.isPending ? 'Recording...' : 'I Accept All Terms'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!showAgeGate && !showDisclaimers ? children : null}
    </>
  );
};

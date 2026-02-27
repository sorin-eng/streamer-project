import { complianceBypass } from '@/config/complianceBypass';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const ComplianceBypassBanner = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!complianceBypass.isEnabled || dismissed) return null;

  const handleDisable = () => {
    complianceBypass.disable();
    window.location.reload();
  };

  return (
    <div className="bg-warning/15 border-b border-warning/30 px-4 py-2 flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-warning font-medium">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Compliance Bypass Mode ACTIVE (DEV ONLY) — All gates auto-approved, events logged as bypass_applied</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {user?.role === 'admin' && (
          <button
            onClick={handleDisable}
            className="rounded bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning hover:bg-warning/30 transition-colors"
          >
            Disable Bypass
          </button>
        )}
        <button onClick={() => setDismissed(true)} className="text-warning/60 hover:text-warning">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

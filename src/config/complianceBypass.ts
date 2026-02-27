/**
 * Compliance Bypass Mode — DEV ONLY
 *
 * When enabled, auto-creates placeholder compliance records so devs
 * can test product flows without completing real age/KYC/disclaimer gates.
 *
 * Hard-blocked in production regardless of flag value.
 */

const IS_PRODUCTION = window.location.hostname.includes('.lovable.app') &&
  !window.location.hostname.includes('-preview--');

// Read from env; localStorage override for admin toggle
function getBypassFlag(): boolean {
  if (IS_PRODUCTION) return false; // HARD BLOCK

  // Admin can disable at runtime
  const adminOverride = localStorage.getItem('COMPLIANCE_BYPASS_DISABLED');
  if (adminOverride === 'true') return false;

  // Env flag (Vite)
  const envFlag = import.meta.env.VITE_COMPLIANCE_BYPASS_MODE;
  return envFlag === 'true' || envFlag === true;
}

export const complianceBypass = {
  get isEnabled(): boolean {
    return getBypassFlag();
  },
  get isProduction(): boolean {
    return IS_PRODUCTION;
  },
  disable() {
    localStorage.setItem('COMPLIANCE_BYPASS_DISABLED', 'true');
  },
  enable() {
    localStorage.removeItem('COMPLIANCE_BYPASS_DISABLED');
  },
};

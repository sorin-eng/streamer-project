/**
 * Typed helper functions that isolate `as any` casts for Supabase calls
 * not fully represented in the auto-generated types.
 */
import { supabase } from '@/integrations/supabase/client';
import { isMockMode } from '@/data/dataMode';
import {
  changeMockRole,
  deleteMockDisclaimerAcceptance,
  insertMockDisclaimerAcceptance,
  logMockComplianceEvent,
  queryMockDisclaimerAcceptance,
  queryMockDisclaimerAcceptances,
  toggleMockSuspend,
  updateMockProfileKycStatus,
  updateMockProfileNotificationPreferences,
} from '@/core/services/mock/mockAppDataService';

// ---- Compliance RPCs ----

export interface ComplianceStatus {
  age_verified: boolean;
  kyc_status: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  fully_compliant: boolean;
}

export async function rpcCheckUserCompliance(userId: string): Promise<ComplianceStatus | null> {
  if (isMockMode()) {
    return {
      age_verified: true,
      kyc_status: userId.startsWith('streamer') ? 'verified' : 'verified',
      terms_accepted: true,
      privacy_accepted: true,
      fully_compliant: true,
    };
  }

  const { data, error } = await (supabase.rpc as any)('check_user_compliance', { _user_id: userId });
  if (error) throw error;
  return data as ComplianceStatus | null;
}

export async function rpcLogComplianceEvent(params: {
  _event_type: string;
  _entity_type?: string;
  _entity_id?: string;
  _details?: Record<string, unknown>;
  _severity?: string;
}): Promise<void> {
  if (isMockMode()) {
    await logMockComplianceEvent(params);
    return;
  }

  try {
    await (supabase.rpc as any)('log_compliance_event', params);
  } catch {
    // Non-blocking
  }
}

// ---- Tables not fully typed in generated types ----

export async function upsertAgeVerification(params: {
  user_id: string;
  date_of_birth: string;
  min_age_required: number;
  jurisdiction: string | null;
}) {
  if (isMockMode()) {
    return { data: params, error: null };
  }

  return (supabase.from('age_verifications') as any).upsert(params, { onConflict: 'user_id' });
}

export async function insertDisclaimerAcceptance(params: {
  user_id: string;
  disclaimer_type: string;
  disclaimer_version: string;
}) {
  if (isMockMode()) {
    return insertMockDisclaimerAcceptance(params);
  }

  return (supabase.from('disclaimer_acceptances') as any).insert(params);
}

export async function queryDisclaimerAcceptance(userId: string, disclaimerType: string) {
  if (isMockMode()) {
    return queryMockDisclaimerAcceptance(userId, disclaimerType);
  }

  return (supabase.from('disclaimer_acceptances') as any)
    .select('id')
    .eq('user_id', userId)
    .eq('disclaimer_type', disclaimerType)
    .maybeSingle();
}

export async function queryDisclaimerAcceptances(userId: string) {
  if (isMockMode()) {
    return queryMockDisclaimerAcceptances(userId);
  }

  return (supabase.from('disclaimer_acceptances') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function deleteDisclaimerAcceptance(id: string) {
  if (isMockMode()) {
    return deleteMockDisclaimerAcceptance(id);
  }

  return (supabase.from('disclaimer_acceptances') as any)
    .delete()
    .eq('id', id);
}

export async function updateProfileKycStatus(userId: string, kycStatus: string) {
  if (isMockMode()) {
    await updateMockProfileKycStatus(userId, kycStatus);
    return { data: null, error: null };
  }

  return supabase
    .from('profiles')
    .update({ kyc_status: kycStatus } as any)
    .eq('user_id', userId);
}

// ---- Admin RPCs ----

export async function rpcAdminChangeRole(userId: string, newRole: string) {
  if (isMockMode()) {
    await changeMockRole(userId, newRole);
    return;
  }

  const { error } = await (supabase.rpc as any)('admin_change_role', {
    _user_id: userId,
    _new_role: newRole,
  });
  if (error) throw error;
}

export async function rpcAdminToggleSuspend(userId: string, suspended: boolean) {
  if (isMockMode()) {
    await toggleMockSuspend(userId, suspended);
    return;
  }

  const { error } = await (supabase.rpc as any)('admin_toggle_suspend', {
    _user_id: userId,
    _suspended: suspended,
  });
  if (error) throw error;
}

// ---- Profile helpers ----

export async function updateNotificationPreferences(userId: string, prefs: Record<string, boolean>) {
  if (isMockMode()) {
    await updateMockProfileNotificationPreferences(userId, prefs);
    return { data: null, error: null };
  }

  return supabase
    .from('profiles')
    .update({ notification_preferences: prefs } as any)
    .eq('user_id', userId);
}

/**
 * Typed helper functions that isolate `as any` casts for Supabase calls
 * not fully represented in the auto-generated types.
 */
import { supabase } from '@/integrations/supabase/client';

// ---- Compliance RPCs ----

export interface ComplianceStatus {
  age_verified: boolean;
  kyc_status: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  fully_compliant: boolean;
}

export async function rpcCheckUserCompliance(userId: string): Promise<ComplianceStatus | null> {
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
  return (supabase.from('age_verifications') as any).upsert(params, { onConflict: 'user_id' });
}

export async function insertDisclaimerAcceptance(params: {
  user_id: string;
  disclaimer_type: string;
  disclaimer_version: string;
}) {
  return (supabase.from('disclaimer_acceptances') as any).insert(params);
}

export async function queryDisclaimerAcceptance(userId: string, disclaimerType: string) {
  return (supabase.from('disclaimer_acceptances') as any)
    .select('id')
    .eq('user_id', userId)
    .eq('disclaimer_type', disclaimerType)
    .maybeSingle();
}

export async function queryDisclaimerAcceptances(userId: string) {
  return (supabase.from('disclaimer_acceptances') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function deleteDisclaimerAcceptance(id: string) {
  return (supabase.from('disclaimer_acceptances') as any)
    .delete()
    .eq('id', id);
}

export async function updateProfileKycStatus(userId: string, kycStatus: string) {
  return supabase
    .from('profiles')
    .update({ kyc_status: kycStatus } as any)
    .eq('user_id', userId);
}

import { supabase } from '@/integrations/supabase/client';
import type { Json, Tables } from '@/integrations/supabase/types';
import { isMockMode } from '@/data/dataMode';
import {
  changeMockPassword,
  computeMockCommissions,
  createMockContractDraft,
  createMockReportUpload,
  createMockWebhookEndpoint,
  deleteMockWebhookEndpoint,
  getMockProfileNotificationPreferences,
  getMockWebhookDeliveries,
  getMockWebhookEndpoints,
  updateMockProfileNotificationPreferences,
  updateMockWebhookEndpointActive,
  uploadMockAvatar,
} from '@/core/services/mock/mockAppDataService';
import { validateContractDraftInput } from '@/lib/contractValidation';
import { parseReportCsv } from '@/lib/reportCsv';

export async function getProfileNotificationPreferences(userId: string): Promise<Record<string, boolean> | null> {
  if (isMockMode()) {
    return getMockProfileNotificationPreferences(userId);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.notification_preferences as Record<string, boolean> | null) || null;
}

export async function changePassword(userId: string, password: string): Promise<void> {
  if (isMockMode()) {
    await changeMockPassword(userId, password);
    return;
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (isMockMode()) {
    return uploadMockAvatar(userId, file);
  }

  const ext = file.name.split('.').pop();
  const filePath = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('user_id', userId);
  if (profileError) throw profileError;

  return publicUrl;
}

export async function createContractDraft(params: { dealId: string; title: string; termsJson: Json }): Promise<void> {
  const validated = validateContractDraftInput({ title: params.title, termsJson: params.termsJson });

  if (isMockMode()) {
    await createMockContractDraft({
      dealId: params.dealId,
      title: validated.title,
      termsJson: params.termsJson as Tables<'contracts'>['terms_json'],
    });
    return;
  }

  const { error } = await supabase.from('contracts').upsert({
    deal_id: params.dealId,
    title: validated.title,
    terms_json: params.termsJson,
    status: 'pending_signature',
  }, {
    onConflict: 'deal_id',
  });
  if (error) throw error;

  const { error: dealError } = await supabase
    .from('deals')
    .update({ state: 'contract_pending' })
    .eq('id', params.dealId);
  if (dealError) throw dealError;
}

export async function getWebhookEndpoints(organizationId: string): Promise<Tables<'webhook_endpoints'>[]> {
  if (isMockMode()) {
    return getMockWebhookEndpoints(organizationId);
  }

  const { data, error } = await supabase
    .from('webhook_endpoints')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getWebhookDeliveries(endpointId: string): Promise<Tables<'webhook_deliveries'>[]> {
  if (isMockMode()) {
    return getMockWebhookDeliveries(endpointId);
  }

  const { data, error } = await supabase
    .from('webhook_deliveries')
    .select('*')
    .eq('endpoint_id', endpointId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
}

export async function createWebhookEndpoint(params: { organizationId: string; url: string; events: string[] }): Promise<void> {
  if (isMockMode()) {
    await createMockWebhookEndpoint(params);
    return;
  }

  const { error } = await supabase.from('webhook_endpoints').insert({
    organization_id: params.organizationId,
    url: params.url,
    events: params.events,
  });
  if (error) throw error;
}

export async function updateWebhookEndpointActive(id: string, active: boolean): Promise<void> {
  if (isMockMode()) {
    await updateMockWebhookEndpointActive(id, active);
    return;
  }

  const { error } = await supabase.from('webhook_endpoints').update({ active }).eq('id', id);
  if (error) throw error;
}

export async function deleteWebhookEndpoint(id: string): Promise<void> {
  if (isMockMode()) {
    await deleteMockWebhookEndpoint(id);
    return;
  }

  const { error } = await supabase.from('webhook_endpoints').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadPerformanceReport(params: {
  organizationId?: string;
  dealId: string;
  csvData: string;
  csvFile: File | null;
}): Promise<{ events_count: number }> {
  if (isMockMode()) {
    if (!params.organizationId) throw new Error('Organization required');
    return createMockReportUpload({
      organizationId: params.organizationId,
      uploadedBy: 'mock-casino-user',
      dealId: params.dealId,
      csvData: params.csvData,
      csvFile: params.csvFile,
    });
  }

  let fileUrl: string | null = null;
  if (params.csvFile && params.organizationId) {
    const filePath = `reports/${params.organizationId}/${Date.now()}_${params.csvFile.name}`;
    const { error: storageError } = await supabase.storage.from('documents').upload(filePath, params.csvFile);
    if (!storageError) {
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
    }
  }

  const rows = parseReportCsv(params.csvData);

  const { data, error } = await supabase.functions.invoke('report-upload', {
    body: { deal_id: params.dealId, rows, file_url: fileUrl },
  });
  if (error) throw error;
  return data.data as { events_count: number };
}

export async function computeCommissions(params: { dealId: string; periodStart?: string; periodEnd?: string }): Promise<{ commissions: unknown[]; events_processed: number }> {
  if (params.periodStart && params.periodEnd && params.periodStart > params.periodEnd) {
    throw new Error('Period start must be on or before period end.');
  }

  if (isMockMode()) {
    return computeMockCommissions(params);
  }

  const { data, error } = await supabase.functions.invoke('compute-commissions', {
    body: {
      deal_id: params.dealId,
      period_start: params.periodStart || undefined,
      period_end: params.periodEnd || undefined,
    },
  });
  if (error) throw error;
  return data.data as { commissions: unknown[]; events_processed: number };
}

export async function checkComplianceGate(params: { action: string; entity_type?: string; entity_id?: string; country?: string }) {
  if (isMockMode()) {
    return {
      allowed: true,
      reason: null,
      user_compliance: {
        age_verified: true,
        kyc_status: 'verified',
        terms_accepted: true,
        privacy_accepted: true,
        fully_compliant: true,
      },
    };
  }

  const { data, error } = await supabase.functions.invoke('check-compliance', { body: params });
  if (error) throw error;
  return data.data;
}

export async function submitKycDocument(params: { userId: string; documentType: string; file: File }): Promise<string> {
  if (isMockMode()) {
    return `mock://documents/${params.userId}/${encodeURIComponent(params.file.name)}`;
  }

  const filePath = `${params.userId}/kyc_${Date.now()}_${params.file.name}`;
  const { error: uploadErr } = await supabase.storage.from('documents').upload(filePath, params.file);
  if (uploadErr) throw uploadErr;

  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
  const fileUrl = urlData.publicUrl || filePath;

  const { error: docErr } = await supabase.from('verification_documents').insert({
    user_id: params.userId,
    document_type: params.documentType,
    file_url: fileUrl,
    status: 'pending',
  });
  if (docErr) throw docErr;

  return fileUrl;
}

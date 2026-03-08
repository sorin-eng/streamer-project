import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { complianceBypass } from '@/config/complianceBypass';
import {
  type ComplianceStatus,
  rpcCheckUserCompliance,
  rpcLogComplianceEvent,
  upsertAgeVerification,
  insertDisclaimerAcceptance,
  queryDisclaimerAcceptance,
  updateProfileKycStatus,
} from '@/lib/supabaseHelpers';

interface ComplianceGateResult {
  user_compliance: ComplianceStatus;
  geo_allowed: boolean;
  gate_passed: boolean;
  blockers: string[];
}

async function applyBypass(userId: string): Promise<ComplianceStatus> {
  await upsertAgeVerification({
    user_id: userId,
    date_of_birth: '1990-01-01',
    min_age_required: 18,
    jurisdiction: 'dev-default',
  });

  for (const dtype of ['terms', 'privacy']) {
    const { data: existing } = await queryDisclaimerAcceptance(userId, dtype);
    if (!existing) {
      await insertDisclaimerAcceptance({
        user_id: userId,
        disclaimer_type: dtype,
        disclaimer_version: 'dev-default',
      });
    }
  }

  await updateProfileKycStatus(userId, 'verified');

  await rpcLogComplianceEvent({
    _event_type: 'compliance.bypass_applied',
    _entity_type: 'user',
    _details: { bypass_mode: true },
    _severity: 'warning',
  });

  return {
    age_verified: true,
    kyc_status: 'verified',
    terms_accepted: true,
    privacy_accepted: true,
    fully_compliant: true,
  };
}

export function useComplianceStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['compliance_status', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ComplianceStatus> => {
      if (!user) throw new Error('No user');

      let compliance: ComplianceStatus | null = null;
      try {
        compliance = await rpcCheckUserCompliance(user.id);
      } catch {
        // Will be handled below
      }

      if (complianceBypass.isEnabled) {
        if (!compliance || !compliance.fully_compliant) {
          return applyBypass(user.id);
        }
      }

      if (!compliance) throw new Error('Failed to check compliance');
      return compliance;
    },
    staleTime: 30000,
  });
}

export function useComplianceGate() {
  return useMutation({
    mutationFn: async (params: {
      action: string;
      entity_type?: string;
      entity_id?: string;
      country?: string;
    }): Promise<ComplianceGateResult> => {
      if (complianceBypass.isEnabled) {
        await rpcLogComplianceEvent({
          _event_type: 'compliance.bypass_applied',
          _entity_type: params.entity_type || 'action',
          _details: { action: params.action, bypass_mode: true },
          _severity: 'warning',
        });

        return {
          user_compliance: {
            age_verified: true,
            kyc_status: 'verified',
            terms_accepted: true,
            privacy_accepted: true,
            fully_compliant: true,
          },
          geo_allowed: true,
          gate_passed: true,
          blockers: [],
        };
      }

      const { data, error } = await supabase.functions.invoke('check-compliance', {
        body: params,
      });
      if (error) throw error;
      return data.data as ComplianceGateResult;
    },
  });
}

export function useSubmitAgeVerification() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: {
      date_of_birth: string;
      jurisdiction?: string;
      min_age?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const dob = new Date(params.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      const minAge = params.min_age || 18;

      if (age < minAge) {
        await rpcLogComplianceEvent({
          _event_type: 'compliance.blocked',
          _entity_type: 'user',
          _details: { reason: 'underage', age, min_age: minAge },
          _severity: 'critical',
        });
        throw new Error(`You must be at least ${minAge} years old`);
      }

      const { error } = await upsertAgeVerification({
        user_id: user.id,
        date_of_birth: params.date_of_birth,
        min_age_required: minAge,
        jurisdiction: params.jurisdiction || null,
      });
      if (error) throw error;

      await rpcLogComplianceEvent({
        _event_type: 'compliance.verified',
        _entity_type: 'user',
        _details: { gate: 'age_verification', jurisdiction: params.jurisdiction },
        _severity: 'info',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance_status'] }),
  });
}

export function useAcceptDisclaimer() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: {
      disclaimer_type: string;
      disclaimer_version?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await insertDisclaimerAcceptance({
        user_id: user.id,
        disclaimer_type: params.disclaimer_type,
        disclaimer_version: params.disclaimer_version || '1.0',
      });
      if (error) throw error;

      await rpcLogComplianceEvent({
        _event_type: 'compliance.verified',
        _entity_type: 'user',
        _details: { gate: 'disclaimer', type: params.disclaimer_type, version: params.disclaimer_version || '1.0' },
        _severity: 'info',
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance_status'] }),
  });
}

export function useSubmitKycDocument() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (params: { document_type: string; file: File }) => {
      if (!user) throw new Error('Not authenticated');

      const filePath = `${user.id}/kyc_${Date.now()}_${params.file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(filePath, params.file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error: docErr } = await supabase
        .from('verification_documents')
        .insert({
          user_id: user.id,
          document_type: params.document_type,
          file_url: urlData.publicUrl || filePath,
          status: 'pending',
        });
      if (docErr) throw docErr;

      await updateProfileKycStatus(user.id, 'pending');

      await rpcLogComplianceEvent({
        _event_type: 'kyc.submitted',
        _entity_type: 'user',
        _details: { document_type: params.document_type },
        _severity: 'info',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance_status'] });
      qc.invalidateQueries({ queryKey: ['verification_docs'] });
    },
  });
}

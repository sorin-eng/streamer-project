import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { checkComplianceGate, submitKycDocument } from '@/core/services/platformService';

interface ComplianceGateResult {
  user_compliance: ComplianceStatus;
  geo_allowed: boolean;
  gate_passed: boolean;
  blockers: string[];
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

export function latestEligibleBirthDate(minAge: number, today: Date = new Date()): string {
  const year = today.getFullYear() - minAge;
  const monthIndex = today.getMonth();
  const maxDayInTargetMonth = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(today.getDate(), maxDayInTargetMonth);

  return `${year}-${padDatePart(monthIndex + 1)}-${padDatePart(day)}`;
}

export function calculateAgeOnDate(dateOfBirth: string, today: Date = new Date()): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
  if (!match) {
    throw new Error('Invalid date of birth');
  }

  const year = Number.parseInt(match[1]!, 10);
  const monthIndex = Number.parseInt(match[2]!, 10) - 1;
  const day = Number.parseInt(match[3]!, 10);
  const dob = new Date(year, monthIndex, day);

  if (
    Number.isNaN(dob.getTime()) ||
    dob.getFullYear() !== year ||
    dob.getMonth() !== monthIndex ||
    dob.getDate() !== day
  ) {
    throw new Error('Invalid date of birth');
  }

  let age = today.getFullYear() - year;
  const hasHadBirthdayThisYear =
    today.getMonth() > monthIndex ||
    (today.getMonth() === monthIndex && today.getDate() >= day);

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
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

      return await checkComplianceGate(params) as ComplianceGateResult;
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

      const age = calculateAgeOnDate(params.date_of_birth);
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

      await submitKycDocument({ userId: user.id, documentType: params.document_type, file: params.file });

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

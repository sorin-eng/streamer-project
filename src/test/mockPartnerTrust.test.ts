import { describe, expect, it } from 'vitest';
import { appendPartnerTrustNote, buildRepeatDealInput, getPartnerTrustSeed, getSetupSpeedComparison } from '@/lib/mockPartnerTrust';
import type { DealWithRelations } from '@/types/supabase-joins';

const baseDeal = {
  id: 'deal-2',
  application_id: null,
  campaign_id: null,
  organization_id: 'mock-org-1',
  streamer_id: 'streamer-2',
  deal_type: 'flat_fee',
  value: 4200,
  state: 'active',
  start_date: '2026-04-10',
  end_date: '2026-04-24',
  platform_fee_pct: 8,
  terms_version: 1,
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-01T00:00:00.000Z',
  campaigns: { title: 'Direct deal' },
  organizations: { name: 'Mock Casino' },
  profiles: { display_name: 'AceAfterDark' },
} as DealWithRelations;

describe('mock partner trust helpers', () => {
  it('builds a repeat-deal payload that reuses prior terms', () => {
    const payload = buildRepeatDealInput(baseDeal);

    expect(payload.application_id).toBe('renewal:deal-2');
    expect(payload.campaign_id).toBe('renewal-template');
    expect(payload.organization_id).toBe('mock-org-1');
    expect(payload.streamer_id).toBe('streamer-2');
    expect(payload.deal_type).toBe('flat_fee');
    expect(payload.value).toBe(4200);
  });

  it('prepends trust notes and keeps repeat setup faster than cold start once history exists', () => {
    const seed = getPartnerTrustSeed(baseDeal);
    const next = appendPartnerTrustNote(seed, 'Reuse the approved Swedish disclaimer block.', 'Mock Casino');
    const speed = getSetupSpeedComparison(seed);

    expect(next.operatorNotes[0]?.content).toBe('Reuse the approved Swedish disclaimer block.');
    expect(speed.coldStartSteps).toBe(4);
    expect(speed.repeatSteps).toBe(1);
    expect(speed.fasterBy).toBe(3);
  });
});

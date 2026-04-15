import type { CreateDealInput } from '@/core/services/appDataService';
import type { DealWithRelations } from '@/types/supabase-joins';

export interface PartnerTrustHistoryItem {
  id: string;
  campaignTitle: string;
  closedAt: string;
  outcome: 'completed' | 'disputed';
  payoutStatus: 'paid_on_time' | 'paid_late' | 'held';
  responseHours: number;
  summary: string;
}

export interface PartnerTrustNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface PartnerTrustRecord {
  completedDeals: number;
  disputedDeals: number;
  avgFirstResponseHours: number;
  onTimePayoutRate: number;
  geoMemory: string[];
  complianceMemory: string[];
  operatorNotes: PartnerTrustNote[];
  history: PartnerTrustHistoryItem[];
}

const STORAGE_KEY = 'castreamino-partner-trust-v1';

const TRUST_SEEDS: Record<string, PartnerTrustRecord> = {
  'mock-org-1::streamer-1': {
    completedDeals: 2,
    disputedDeals: 0,
    avgFirstResponseHours: 1.8,
    onTimePayoutRate: 100,
    geoMemory: ['Germany converts cleanly', 'Romania is strong on late-night slots', 'Keep US blocked'],
    complianceMemory: ['Needs same-day creative approval when CTA changes', 'Always keep 18+ and responsible gambling disclaimer visible'],
    operatorNotes: [
      {
        id: 'trust-note-1',
        author: 'Mock Casino',
        content: 'Reliable once terms are explicit. Fast approvals matter more than extra rate negotiation.',
        createdAt: '2026-03-22T10:00:00.000Z',
      },
    ],
    history: [
      {
        id: 'history-1',
        campaignTitle: 'Winter welcome push',
        closedAt: '2026-02-18',
        outcome: 'completed',
        payoutStatus: 'paid_on_time',
        responseHours: 2,
        summary: 'Strong slots conversion, smooth approvals, payout closed in the first batch.',
      },
      {
        id: 'history-2',
        campaignTitle: 'New year VIP reload',
        closedAt: '2026-01-11',
        outcome: 'completed',
        payoutStatus: 'paid_on_time',
        responseHours: 1.5,
        summary: 'Partner stuck to geo guardrails and reused prior CTA language without drama.',
      },
    ],
  },
  'mock-org-1::streamer-2': {
    completedDeals: 3,
    disputedDeals: 1,
    avgFirstResponseHours: 3.4,
    onTimePayoutRate: 83,
    geoMemory: ['UK and Sweden outperform broad EU pushes', 'Avoid US mentions entirely', 'Long-form table content beats short reactive clips'],
    complianceMemory: ['Keep table-game wording clean, avoid bonus overpromises', 'Needs wallet confirmed before payout window opens'],
    operatorNotes: [
      {
        id: 'trust-note-2',
        author: 'Mock Casino',
        content: 'Renew when retention is the goal. Good fit for longer-form table sessions, weaker for short clip churn.',
        createdAt: '2026-03-28T12:00:00.000Z',
      },
      {
        id: 'trust-note-3',
        author: 'Risk desk',
        content: 'One prior payout slipped because the wallet was missing, not because the traffic was bad.',
        createdAt: '2026-02-09T09:30:00.000Z',
      },
    ],
    history: [
      {
        id: 'history-3',
        campaignTitle: 'Blackjack reactivation burst',
        closedAt: '2026-03-30',
        outcome: 'completed',
        payoutStatus: 'paid_on_time',
        responseHours: 3,
        summary: 'Second run reused the prior offer and skipped cold-start negotiation.',
      },
      {
        id: 'history-4',
        campaignTitle: 'VIP retention week',
        closedAt: '2026-02-14',
        outcome: 'completed',
        payoutStatus: 'paid_late',
        responseHours: 4,
        summary: 'Content landed, payout closed late because wallet routing was missing at kickoff.',
      },
      {
        id: 'history-5',
        campaignTitle: 'Nordics table promo',
        closedAt: '2025-12-19',
        outcome: 'disputed',
        payoutStatus: 'held',
        responseHours: 5,
        summary: 'Compliance wording drifted off-script and the operator had to step in.',
      },
    ],
  },
};

function safeClone<T>(value: T): T {
  return structuredClone(value);
}

export function getPartnerTrustKey(deal: Pick<DealWithRelations, 'organization_id' | 'streamer_id'>): string {
  return `${deal.organization_id}::${deal.streamer_id}`;
}

export function getPartnerTrustSeed(deal: Pick<DealWithRelations, 'organization_id' | 'streamer_id'>): PartnerTrustRecord {
  return safeClone(TRUST_SEEDS[getPartnerTrustKey(deal)] || {
    completedDeals: 0,
    disputedDeals: 0,
    avgFirstResponseHours: 12,
    onTimePayoutRate: 0,
    geoMemory: [],
    complianceMemory: [],
    operatorNotes: [],
    history: [],
  });
}

export function loadPartnerTrustState(): Record<string, PartnerTrustRecord> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PartnerTrustRecord>;
  } catch {
    return {};
  }
}

export function savePartnerTrustState(state: Record<string, PartnerTrustRecord>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function appendPartnerTrustNote(record: PartnerTrustRecord, content: string, author: string): PartnerTrustRecord {
  const trimmed = content.trim();
  if (!trimmed) return record;

  return {
    ...record,
    operatorNotes: [
      {
        id: `trust-note-${Date.now()}`,
        author,
        content: trimmed,
        createdAt: new Date().toISOString(),
      },
      ...record.operatorNotes,
    ],
  };
}

export function buildRepeatDealInput(deal: DealWithRelations): CreateDealInput {
  return {
    application_id: `renewal:${deal.id}`,
    campaign_id: deal.campaign_id || 'renewal-template',
    organization_id: deal.organization_id,
    streamer_id: deal.streamer_id,
    deal_type: deal.deal_type,
    value: Number(deal.value),
  };
}

export function describeResponseBehavior(avgFirstResponseHours: number): string {
  if (avgFirstResponseHours <= 2) return 'Fast, usually same day';
  if (avgFirstResponseHours <= 6) return 'Reliable within a working block';
  if (avgFirstResponseHours <= 12) return 'Usable, but not urgent';
  return 'Slow enough to need operator follow-up';
}

export function describePayoutReliability(onTimePayoutRate: number): string {
  if (onTimePayoutRate >= 95) return 'Clean payout history';
  if (onTimePayoutRate >= 80) return 'Mostly reliable, watch the details';
  if (onTimePayoutRate > 0) return 'Mixed payout reliability';
  return 'No payout history yet';
}

export function getRenewalCue(record: PartnerTrustRecord): string {
  if (record.completedDeals >= 2 && record.onTimePayoutRate >= 80) {
    return 'Repeat-deal candidate, prior terms are strong enough to skip a cold restart.';
  }
  if (record.completedDeals >= 1) {
    return 'Reactivate carefully, useful history exists but trust details still need a human look.';
  }
  return 'No renewal shortcut yet, this still behaves like a first deal.';
}

export function getSetupSpeedComparison(record: PartnerTrustRecord) {
  const repeatSteps = record.completedDeals > 0 ? 1 : 4;
  return {
    coldStartSteps: 4,
    repeatSteps,
    fasterBy: Math.max(0, 4 - repeatSteps),
  };
}

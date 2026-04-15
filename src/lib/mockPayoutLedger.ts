import type { CommissionWithDeal } from '@/types/supabase-joins';

export type PayoutStage = 'expected' | 'approved' | 'pending' | 'paid';

interface UploadLike {
  id: string;
  file_name: string;
  created_at: string;
}

interface StoredPayoutLedgerEntry {
  commissionId: string;
  dealId: string;
  status: PayoutStage;
  expectedAt: string;
  approvedAt: string | null;
  pendingAt: string | null;
  paidAt: string | null;
  sourceUploadName: string | null;
  sourceUploadAt: string | null;
}

export interface PayoutLedgerRow extends StoredPayoutLedgerEntry {
  streamerId: string;
  campaignTitle: string;
  amount: number;
  commissionStatus: string;
  commissionCreatedAt: string;
  periodStart: string | null;
  flags: string[];
}

const STORAGE_KEY = 'castreamino-payout-ledger';
const DAY_MS = 24 * 60 * 60 * 1000;

export function loadPayoutLedgerState(): Record<string, StoredPayoutLedgerEntry> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredPayoutLedgerEntry>;
  } catch {
    return {};
  }
}

export function savePayoutLedgerState(state: Record<string, StoredPayoutLedgerEntry>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getLatestUpload(uploads: UploadLike[]): UploadLike | null {
  return uploads
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;
}

export function syncPayoutLedgerState(
  commissions: CommissionWithDeal[],
  uploads: UploadLike[],
): Record<string, StoredPayoutLedgerEntry> {
  const existing = loadPayoutLedgerState();
  const next: Record<string, StoredPayoutLedgerEntry> = {};
  const latestUpload = getLatestUpload(uploads);

  commissions.forEach((commission) => {
    const stored = existing[commission.id];
    next[commission.id] = stored || {
      commissionId: commission.id,
      dealId: commission.deal_id,
      status: 'expected',
      expectedAt: commission.created_at,
      approvedAt: null,
      pendingAt: null,
      paidAt: null,
      sourceUploadName: latestUpload?.file_name || null,
      sourceUploadAt: latestUpload?.created_at || null,
    };
  });

  savePayoutLedgerState(next);
  return next;
}

export function advancePayoutLedgerStatus(commissionId: string, nextStatus: PayoutStage) {
  const state = loadPayoutLedgerState();
  const current = state[commissionId];
  if (!current) return;

  const now = new Date().toISOString();
  state[commissionId] = {
    ...current,
    status: nextStatus,
    approvedAt: nextStatus === 'approved' ? now : current.approvedAt,
    pendingAt: nextStatus === 'pending' ? now : current.pendingAt,
    paidAt: nextStatus === 'paid' ? now : current.paidAt,
  };

  savePayoutLedgerState(state);
}

export function buildPayoutLedgerRows(params: {
  commissions: CommissionWithDeal[];
  uploads: UploadLike[];
  walletAddress?: string | null;
  isStreamerView: boolean;
}): PayoutLedgerRow[] {
  const state = syncPayoutLedgerState(params.commissions, params.uploads);
  const walletOnFile = Boolean(params.walletAddress?.trim());

  return params.commissions
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((commission) => {
      const stored = state[commission.id];
      const flags: string[] = [];
      const baseDate = new Date(stored.pendingAt || stored.approvedAt || stored.expectedAt).getTime();
      const ageDays = Math.floor((Date.now() - baseDate) / DAY_MS);

      if (!stored.sourceUploadName) flags.push('Missing source report link.');
      if (stored.status === 'expected') flags.push('Waiting for payout approval.');
      if (stored.status !== 'expected' && commission.status === 'pending') flags.push('Commission still pending approval in reports.');
      if (stored.status !== 'paid' && ageDays >= 7) flags.push('Overdue payout.');
      if (params.isStreamerView && !walletOnFile) flags.push('Add a payout wallet in Settings.');

      return {
        ...stored,
        streamerId: commission.streamer_id,
        campaignTitle: commission.deals?.campaigns?.title || 'Direct Deal',
        amount: Number(commission.amount || 0),
        commissionStatus: commission.status,
        commissionCreatedAt: commission.created_at,
        periodStart: commission.period_start || null,
        flags,
      };
    });
}

export function getPayoutStageCounts(rows: PayoutLedgerRow[]) {
  return rows.reduce<Record<PayoutStage, number>>((acc, row) => {
    acc[row.status] += 1;
    return acc;
  }, {
    expected: 0,
    approved: 0,
    pending: 0,
    paid: 0,
  });
}

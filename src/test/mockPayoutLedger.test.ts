import { beforeEach, describe, expect, it } from 'vitest';
import { advancePayoutLedgerStatus, buildPayoutLedgerRows, getPayoutStageCounts, loadPayoutLedgerState } from '@/lib/mockPayoutLedger';
import type { CommissionWithDeal } from '@/types/supabase-joins';

describe('mock payout ledger helpers', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('links commissions to report uploads and tracks payout state changes', () => {
    const commissions: CommissionWithDeal[] = [{
      id: 'commission-1',
      deal_id: 'deal-2',
      streamer_id: 'streamer-1',
      amount: 30,
      status: 'pending',
      period_start: '2026-04-01',
      created_at: '2026-04-15T12:00:00.000Z',
      deals: {
        id: 'deal-2',
        campaigns: { title: 'Direct Deal' },
      },
    } as CommissionWithDeal];

    const uploads = [{
      id: 'upload-1',
      file_name: 'direct-deal-report.csv',
      created_at: '2026-04-15T11:00:00.000Z',
    }];

    let rows = buildPayoutLedgerRows({
      commissions,
      uploads,
      walletAddress: '',
      isStreamerView: true,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe('expected');
    expect(rows[0]?.sourceUploadName).toBe('direct-deal-report.csv');
    expect(rows[0]?.flags).toContain('Waiting for payout approval.');
    expect(rows[0]?.flags).toContain('Add a payout wallet in Settings.');

    advancePayoutLedgerStatus('commission-1', 'approved');
    advancePayoutLedgerStatus('commission-1', 'pending');
    advancePayoutLedgerStatus('commission-1', 'paid');

    rows = buildPayoutLedgerRows({
      commissions,
      uploads,
      walletAddress: '0xmockwallet',
      isStreamerView: true,
    });

    expect(rows[0]?.status).toBe('paid');
    expect(rows[0]?.approvedAt).toBeTruthy();
    expect(rows[0]?.pendingAt).toBeTruthy();
    expect(rows[0]?.paidAt).toBeTruthy();
    expect(rows[0]?.flags).not.toContain('Add a payout wallet in Settings.');

    const counts = getPayoutStageCounts(rows);
    expect(counts.paid).toBe(1);
    expect(loadPayoutLedgerState()['commission-1']?.status).toBe('paid');
  });
});

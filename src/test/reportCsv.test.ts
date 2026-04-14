import { describe, expect, it } from 'vitest';
import { parseReportCsv } from '@/lib/reportCsv';

describe('report CSV validation', () => {
  it('parses valid report rows', () => {
    const rows = parseReportCsv('ftd,2026-04-01,100,player_001');

    expect(rows).toEqual([
      {
        event_type: 'ftd',
        event_date: '2026-04-01',
        amount: 100,
        player_id: 'player_001',
      },
    ]);
  });

  it('rejects impossible report dates', () => {
    expect(() => parseReportCsv('ftd,2026-02-30,100,player_001')).toThrow('Invalid event date at line 1. Use YYYY-MM-DD.');
  });

  it('rejects zero or missing amounts', () => {
    expect(() => parseReportCsv('ftd,2026-04-01,0,player_001')).toThrow('Invalid amount at line 1. Amount must be greater than 0.');
  });
});

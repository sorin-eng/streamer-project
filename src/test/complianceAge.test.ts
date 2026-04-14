import { describe, expect, it } from 'vitest';
import { calculateAgeOnDate, latestEligibleBirthDate } from '@/hooks/useCompliance';

describe('calculateAgeOnDate', () => {
  it('does not round up before the birthday has actually happened this year', () => {
    expect(calculateAgeOnDate('2008-12-31', new Date('2026-04-14T12:00:00Z'))).toBe(17);
  });

  it('counts the birthday day itself as reaching the new age', () => {
    expect(calculateAgeOnDate('2008-04-14', new Date('2026-04-14T12:00:00Z'))).toBe(18);
  });

  it('throws on invalid dates instead of silently producing nonsense', () => {
    expect(() => calculateAgeOnDate('not-a-date', new Date('2026-04-14T12:00:00Z'))).toThrow('Invalid date of birth');
  });

  it('rejects impossible calendar dates instead of letting Date normalize them', () => {
    expect(() => calculateAgeOnDate('2026-02-30', new Date('2026-04-14T12:00:00Z'))).toThrow('Invalid date of birth');
  });
});

describe('latestEligibleBirthDate', () => {
  it('uses exact calendar math instead of subtracting a rough day count', () => {
    expect(latestEligibleBirthDate(18, new Date('2026-04-14T12:00:00Z'))).toBe('2008-04-14');
  });

  it('clamps leap-day cutoffs to the last valid day of the target month', () => {
    expect(latestEligibleBirthDate(18, new Date('2024-02-29T12:00:00Z'))).toBe('2006-02-28');
  });
});

import { describe, expect, it } from 'vitest';
import { validateContractDraftInput } from '@/lib/contractValidation';

describe('contract draft validation', () => {
  it('accepts a sane revshare contract', () => {
    expect(validateContractDraftInput({
      title: '  Partnership Agreement  ',
      termsJson: {
        deal_type: 'revshare',
        duration: '3 months',
        commission_structure: { revshare_pct: 25 },
      },
    })).toEqual({
      title: 'Partnership Agreement',
      duration: '3 months',
    });
  });

  it('rejects revshare percentages above 100', () => {
    expect(() => validateContractDraftInput({
      title: 'Partnership Agreement',
      termsJson: {
        deal_type: 'revshare',
        duration: '3 months',
        commission_structure: { revshare_pct: 150 },
      },
    })).toThrow('Revenue share percentage must be between 0 and 100.');
  });

  it('rejects blank contract durations', () => {
    expect(() => validateContractDraftInput({
      title: 'Partnership Agreement',
      termsJson: {
        deal_type: 'flat_fee',
        duration: '   ',
        commission_structure: {},
      },
    })).toThrow('Contract duration required.');
  });
});

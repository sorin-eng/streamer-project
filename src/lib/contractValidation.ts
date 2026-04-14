export function validateContractDraftInput(params: { title: string; termsJson: unknown }) {
  const title = params.title.trim();
  if (!title) {
    throw new Error('Contract title required.');
  }

  if (!params.termsJson || typeof params.termsJson !== 'object' || Array.isArray(params.termsJson)) {
    throw new Error('Contract terms are invalid.');
  }

  const terms = params.termsJson as Record<string, unknown>;
  const duration = typeof terms.duration === 'string' ? terms.duration.trim() : '';
  if (!duration) {
    throw new Error('Contract duration required.');
  }

  const dealType = terms.deal_type;
  const commissionStructure = (terms.commission_structure && typeof terms.commission_structure === 'object' && !Array.isArray(terms.commission_structure))
    ? terms.commission_structure as Record<string, unknown>
    : {};

  if (dealType === 'cpa' || dealType === 'hybrid') {
    const cpaAmount = Number(commissionStructure.cpa_amount);
    if (!Number.isFinite(cpaAmount) || cpaAmount <= 0) {
      throw new Error('CPA amount must be greater than 0.');
    }
  }

  if (dealType === 'revshare' || dealType === 'hybrid') {
    const revsharePct = Number(commissionStructure.revshare_pct);
    if (!Number.isFinite(revsharePct) || revsharePct <= 0 || revsharePct > 100) {
      throw new Error('Revenue share percentage must be between 0 and 100.');
    }
  }

  return {
    title,
    duration,
  };
}

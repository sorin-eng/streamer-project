type MaybeCountryList = string[] | null | undefined;

export interface StreamerGeoContext {
  audience_geo?: MaybeCountryList;
  restricted_countries?: MaybeCountryList;
}

export interface CasinoProgramGeoContext {
  accepted_countries?: MaybeCountryList;
  restricted_territories?: MaybeCountryList;
  license_jurisdiction?: string | null;
}

export interface CampaignGeoContext {
  target_geo?: MaybeCountryList;
  restricted_countries?: MaybeCountryList;
}

export interface GeoGateResult {
  allowed: boolean;
  blockers: string[];
  acceptedCountries: string[];
  restrictedCountries: string[];
  audienceCountries: string[];
  effectiveAudienceCountries: string[];
  matchingCountries: string[];
}

function normalizeCountryList(values: MaybeCountryList) {
  const display = new Map<string, string>();

  for (const value of values || []) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toUpperCase();
    if (!display.has(normalized)) {
      display.set(normalized, trimmed);
    }
  }

  return {
    codes: [...display.keys()],
    codeSet: new Set(display.keys()),
    display,
  };
}

function formatCountryList(codes: string[], ...sources: Array<Map<string, string>>) {
  return codes
    .map((code) => sources.find((source) => source.has(code))?.get(code) ?? code)
    .join(', ');
}

function buildGeoGateResult(params: {
  blockers: string[];
  acceptedCountries: string[];
  restrictedCountries: string[];
  audienceCountries: string[];
  effectiveAudienceCountries: string[];
  matchingCountries: string[];
}): GeoGateResult {
  return {
    allowed: params.blockers.length === 0,
    blockers: params.blockers,
    acceptedCountries: params.acceptedCountries,
    restrictedCountries: params.restrictedCountries,
    audienceCountries: params.audienceCountries,
    effectiveAudienceCountries: params.effectiveAudienceCountries,
    matchingCountries: params.matchingCountries,
  };
}

export function evaluateInquiryGeoGate(
  streamer: StreamerGeoContext | null | undefined,
  program: CasinoProgramGeoContext | null | undefined,
): GeoGateResult {
  const audience = normalizeCountryList(streamer?.audience_geo);
  const streamerRestricted = normalizeCountryList(streamer?.restricted_countries);
  const accepted = normalizeCountryList(program?.accepted_countries);
  const restricted = normalizeCountryList(program?.restricted_territories);

  const effectiveAudience = audience.codes.filter((code) => !streamerRestricted.codeSet.has(code));
  const blockedOverlap = effectiveAudience.filter((code) => restricted.codeSet.has(code));
  const matchingCountries = accepted.codes.length
    ? effectiveAudience.filter((code) => accepted.codeSet.has(code))
    : effectiveAudience;

  const blockers: string[] = [];

  if ((accepted.codes.length > 0 || restricted.codes.length > 0) && audience.codes.length === 0) {
    blockers.push('Add audience geography to the streamer profile before sending geo-restricted inquiries.');
  }

  if (audience.codes.length > 0 && effectiveAudience.length === 0 && (accepted.codes.length > 0 || restricted.codes.length > 0)) {
    blockers.push('The streamer profile marks every audience country as restricted, so there is no compliant territory left to target.');
  }

  if (blockedOverlap.length > 0) {
    blockers.push(
      `Audience includes casino-restricted territories: ${formatCountryList(blockedOverlap, audience.display, restricted.display)}.`
    );
  }

  if (accepted.codes.length > 0 && matchingCountries.length === 0) {
    const jurisdictionSuffix = program?.license_jurisdiction
      ? ` under the ${program.license_jurisdiction} program`
      : '';
    blockers.push(
      `No compliant audience overlap with the casino's accepted countries${jurisdictionSuffix}: ${formatCountryList(accepted.codes, accepted.display)}.`
    );
  }

  return buildGeoGateResult({
    blockers,
    acceptedCountries: accepted.codes,
    restrictedCountries: restricted.codes,
    audienceCountries: audience.codes,
    effectiveAudienceCountries: effectiveAudience,
    matchingCountries,
  });
}

export function evaluateCampaignApplicationGeoGate(
  streamer: StreamerGeoContext | null | undefined,
  campaign: CampaignGeoContext | null | undefined,
): GeoGateResult {
  const audience = normalizeCountryList(streamer?.audience_geo);
  const streamerRestricted = normalizeCountryList(streamer?.restricted_countries);
  const targetGeo = normalizeCountryList(campaign?.target_geo);
  const restricted = normalizeCountryList(campaign?.restricted_countries);

  const effectiveAudience = audience.codes.filter((code) => !streamerRestricted.codeSet.has(code));
  const blockedOverlap = effectiveAudience.filter((code) => restricted.codeSet.has(code));
  const matchingCountries = targetGeo.codes.length
    ? effectiveAudience.filter((code) => targetGeo.codeSet.has(code))
    : effectiveAudience;

  const blockers: string[] = [];

  if ((targetGeo.codes.length > 0 || restricted.codes.length > 0) && audience.codes.length === 0) {
    blockers.push('Add audience geography to your streamer profile before applying to geo-scoped campaigns.');
  }

  if (audience.codes.length > 0 && effectiveAudience.length === 0 && (targetGeo.codes.length > 0 || restricted.codes.length > 0)) {
    blockers.push('Your streamer profile currently restricts every listed audience country, so this geo-scoped campaign cannot be verified.');
  }

  if (blockedOverlap.length > 0) {
    blockers.push(
      `Your audience includes campaign-restricted countries: ${formatCountryList(blockedOverlap, audience.display, restricted.display)}.`
    );
  }

  if (targetGeo.codes.length > 0 && matchingCountries.length === 0) {
    blockers.push(
      `Your audience does not overlap the campaign target geography: ${formatCountryList(targetGeo.codes, targetGeo.display)}.`
    );
  }

  return buildGeoGateResult({
    blockers,
    acceptedCountries: targetGeo.codes,
    restrictedCountries: restricted.codes,
    audienceCountries: audience.codes,
    effectiveAudienceCountries: effectiveAudience,
    matchingCountries,
  });
}

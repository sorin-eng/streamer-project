import { describe, expect, it } from 'vitest';
import { evaluateCampaignApplicationGeoGate, evaluateInquiryGeoGate } from '@/lib/geoCompliance';

describe('geo compliance helpers', () => {
  it('allows direct inquiries when streamer audience overlaps accepted countries and avoids restricted territories', () => {
    const result = evaluateInquiryGeoGate(
      {
        audience_geo: ['Germany', 'Romania', 'Canada'],
        restricted_countries: ['US'],
      },
      {
        accepted_countries: ['Germany', 'Canada'],
        restricted_territories: ['US'],
        license_jurisdiction: 'Malta',
      },
    );

    expect(result.allowed).toBe(true);
    expect(result.matchingCountries).toEqual(['GERMANY', 'CANADA']);
  });

  it('blocks direct inquiries when audience includes casino-restricted territories', () => {
    const result = evaluateInquiryGeoGate(
      {
        audience_geo: ['Germany', 'Romania', 'Canada'],
        restricted_countries: [],
      },
      {
        accepted_countries: ['Germany', 'Canada'],
        restricted_territories: ['Romania'],
        license_jurisdiction: 'Malta',
      },
    );

    expect(result.allowed).toBe(false);
    expect(result.blockers[0]).toContain('Romania');
  });

  it('blocks campaign applications when streamer audience misses the target geography entirely', () => {
    const result = evaluateCampaignApplicationGeoGate(
      {
        audience_geo: ['Germany', 'Romania', 'Canada'],
        restricted_countries: ['US'],
      },
      {
        target_geo: ['UK', 'Sweden'],
        restricted_countries: ['US'],
      },
    );

    expect(result.allowed).toBe(false);
    expect(result.blockers[0]).toContain('campaign target geography');
  });
});

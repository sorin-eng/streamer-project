import { describe, expect, it } from 'vitest';
import {
  addDealRoomProof,
  getDealRoomWorkflowSeed,
  reviewDealRoomAsset,
  submitDealRoomAsset,
  toggleDealRoomCompliance,
} from '@/lib/mockDealRoomWorkflow';

describe('deal room workflow helpers', () => {
  it('moves a mock deal from brief to submitted assets to approved assets to live proof', () => {
    let workflow = getDealRoomWorkflowSeed('deal-1');

    expect(workflow.briefHeadline).toContain('Spring slots launch');
    expect(workflow.proofs).toHaveLength(0);

    workflow = submitDealRoomAsset(
      workflow,
      'copy',
      '18+ only. Claim the welcome offer with the approved link.',
      'LunaSpin',
    );
    workflow = submitDealRoomAsset(
      workflow,
      'link',
      'https://mock.casino.example/spring-slots',
      'Mock Casino',
    );
    workflow = submitDealRoomAsset(
      workflow,
      'media',
      'https://cdn.example/mock-spring-slots.png',
      'LunaSpin',
    );

    workflow = reviewDealRoomAsset(workflow, 'copy', 'needs_revision');
    expect(workflow.assets.find((asset) => asset.id === 'copy')?.status).toBe('needs_revision');

    workflow = submitDealRoomAsset(
      workflow,
      'copy',
      '18+ only. Updated copy with the approved CTA and responsible gambling disclaimer.',
      'LunaSpin',
    );

    workflow = reviewDealRoomAsset(workflow, 'copy', 'approved');
    workflow = reviewDealRoomAsset(workflow, 'link', 'approved');
    workflow = reviewDealRoomAsset(workflow, 'media', 'approved');
    workflow = toggleDealRoomCompliance(workflow, 'disclaimer-confirmed');
    workflow = toggleDealRoomCompliance(workflow, 'geo-confirmed');
    workflow = addDealRoomProof(workflow, {
      label: 'Kick replay clip',
      url: 'https://kick.com/mock-stream/replay',
      notes: 'Replay captured right after the stream ended.',
      submittedBy: 'Mock Casino',
    });

    expect(workflow.assets.every((asset) => asset.status === 'approved')).toBe(true);
    expect(workflow.compliance.find((item) => item.id === 'disclaimer-confirmed')?.complete).toBe(true);
    expect(workflow.compliance.find((item) => item.id === 'geo-confirmed')?.complete).toBe(true);
    expect(workflow.proofs[0]?.label).toBe('Kick replay clip');
    expect(workflow.proofs[0]?.url).toBe('https://kick.com/mock-stream/replay');
  });
});

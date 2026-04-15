export type PromoAssetStatus = 'draft' | 'pending' | 'needs_revision' | 'approved' | 'rejected';
export type PromoAssetKind = 'copy' | 'link' | 'media';
export type PromoAssetOwner = 'streamer' | 'casino_manager' | 'both';

export interface DealRoomPromoAsset {
  id: string;
  kind: PromoAssetKind;
  label: string;
  helper: string;
  owner: PromoAssetOwner;
  status: PromoAssetStatus;
  content: string;
  submittedAt: string | null;
  submittedBy: string | null;
  reviewerNote: string | null;
}

export interface DealRoomComplianceItem {
  id: string;
  label: string;
  helper: string;
  manual: boolean;
  complete: boolean;
}

export interface DealRoomDeliveryProof {
  id: string;
  label: string;
  url: string;
  notes: string;
  submittedBy: string;
  createdAt: string;
}

export interface DealRoomWorkflow {
  briefHeadline: string;
  campaignAngle: string;
  promoRequirements: string[];
  requiredDisclaimers: string[];
  assets: DealRoomPromoAsset[];
  compliance: DealRoomComplianceItem[];
  proofs: DealRoomDeliveryProof[];
}

const STORAGE_KEY = 'castreamino-deal-room-workflow';

function createAsset(
  id: string,
  kind: PromoAssetKind,
  label: string,
  helper: string,
  owner: PromoAssetOwner,
  status: PromoAssetStatus = 'draft',
  content = '',
): DealRoomPromoAsset {
  return {
    id,
    kind,
    label,
    helper,
    owner,
    status,
    content,
    submittedAt: null,
    submittedBy: null,
    reviewerNote: null,
  };
}

function createWorkflowSeed(dealId: string): DealRoomWorkflow {
  if (dealId === 'deal-1') {
    return {
      briefHeadline: 'Spring slots launch, keep the tone premium and compliance-safe.',
      campaignAngle: 'Position the offer as a polished welcome campaign, not a hard-sell bonus blast.',
      promoRequirements: [
        'Mention the welcome offer in plain language, do not improvise bonus terms.',
        'Use only the approved tracking link tied to this deal.',
        'Keep talking points focused on gameplay, audience fit, and onboarding ease.',
      ],
      requiredDisclaimers: [
        '18+ only, gamble responsibly.',
        'Void where restricted and subject to local regulations.',
      ],
      assets: [
        createAsset('copy', 'copy', 'Copy draft', 'Primary caption or stream talking points for approval.', 'streamer'),
        createAsset('link', 'link', 'Tracking link', 'Final approved destination link that must go live.', 'casino_manager'),
        createAsset('media', 'media', 'Media preview', 'Thumbnail, clip frame, or promo visual reference.', 'streamer'),
      ],
      compliance: [
        {
          id: 'disclaimer-confirmed',
          label: 'Responsible gambling disclaimer confirmed',
          helper: 'Manager confirms the approved copy includes the required disclosure.',
          manual: true,
          complete: false,
        },
        {
          id: 'geo-confirmed',
          label: 'Age and geo restrictions confirmed',
          helper: 'Deal copy and targeting match the approved jurisdictions for this partner.',
          manual: true,
          complete: false,
        },
        {
          id: 'copy-approved',
          label: 'Approved copy is locked before launch',
          helper: 'The live caption or stream talking points should be approved here first.',
          manual: false,
          complete: false,
        },
        {
          id: 'link-approved',
          label: 'Approved link is the one going live',
          helper: 'Do not let unreviewed links drift into DMs or side chats.',
          manual: false,
          complete: false,
        },
        {
          id: 'proof-captured',
          label: 'Delivery proof captured in-room',
          helper: 'Once the placement is live, the proof needs to land here too.',
          manual: false,
          complete: false,
        },
      ],
      proofs: [],
    };
  }

  if (dealId === 'deal-2') {
    return {
      briefHeadline: 'Live retention push, keep it sharp and easy to verify after posting.',
      campaignAngle: 'The room should show the approved assets, disclaimers, and live proof without anyone hunting through chat.',
      promoRequirements: [
        'Keep CTA language consistent with the agreed welcome offer.',
        'Use the approved post or stream placement label when logging delivery proof.',
        'Attach any live proof link as soon as the content lands.',
      ],
      requiredDisclaimers: [
        '18+ only, gamble responsibly.',
        'Terms and jurisdiction restrictions apply.',
      ],
      assets: [
        createAsset('copy', 'copy', 'Copy draft', 'Caption or talking points used in the live placement.', 'streamer'),
        createAsset('link', 'link', 'Tracking link', 'Approved destination link for this live deal.', 'casino_manager', 'approved', 'https://mock.casino.example/deal-2'),
        createAsset('media', 'media', 'Media preview', 'Creative frame, preview image, or short clip link.', 'streamer'),
      ],
      compliance: [
        {
          id: 'disclaimer-confirmed',
          label: 'Responsible gambling disclaimer confirmed',
          helper: 'The required disclosure is present in the approved creative or talking points.',
          manual: true,
          complete: true,
        },
        {
          id: 'geo-confirmed',
          label: 'Age and geo restrictions confirmed',
          helper: 'This deal is safe to run in the approved territories only.',
          manual: true,
          complete: true,
        },
        {
          id: 'copy-approved',
          label: 'Approved copy is locked before launch',
          helper: 'The live caption or stream talking points should be approved here first.',
          manual: false,
          complete: false,
        },
        {
          id: 'link-approved',
          label: 'Approved link is the one going live',
          helper: 'Keep the exact reviewed link attached to the deal.',
          manual: false,
          complete: true,
        },
        {
          id: 'proof-captured',
          label: 'Delivery proof captured in-room',
          helper: 'Log the live post or stream proof directly against the deal record.',
          manual: false,
          complete: false,
        },
      ],
      proofs: [],
    };
  }

  return {
    briefHeadline: 'Keep the promo brief, approvals, and proof attached to the deal.',
    campaignAngle: 'If the deal goes live, the record should make compliance and proof obvious fast.',
    promoRequirements: [
      'Use only approved assets and links.',
      'Keep compliance-sensitive language inside the reviewed brief.',
    ],
    requiredDisclaimers: [
      '18+ only, gamble responsibly.',
    ],
    assets: [
      createAsset('copy', 'copy', 'Copy draft', 'Primary approved promo copy for this deal.', 'streamer'),
      createAsset('link', 'link', 'Tracking link', 'Final approved destination link.', 'casino_manager'),
      createAsset('media', 'media', 'Media preview', 'Visual asset reference or proof-ready creative.', 'streamer'),
    ],
    compliance: [
      {
        id: 'disclaimer-confirmed',
        label: 'Required disclaimers confirmed',
        helper: 'Confirm that the reviewed asset includes the required disclosure.',
        manual: true,
        complete: false,
      },
      {
        id: 'geo-confirmed',
        label: 'Age and geo restrictions confirmed',
        helper: 'Make sure the placement is allowed where this deal runs.',
        manual: true,
        complete: false,
      },
      {
        id: 'copy-approved',
        label: 'Approved copy is locked before launch',
        helper: 'Do not go live without approved copy attached here.',
        manual: false,
        complete: false,
      },
      {
        id: 'link-approved',
        label: 'Approved link is the one going live',
        helper: 'Keep the final reviewed link tied to the deal.',
        manual: false,
        complete: false,
      },
      {
        id: 'proof-captured',
        label: 'Delivery proof captured in-room',
        helper: 'This closes the loop once the placement is live.',
        manual: false,
        complete: false,
      },
    ],
    proofs: [],
  };
}

export function getDealRoomWorkflowSeed(dealId: string): DealRoomWorkflow {
  return structuredClone(createWorkflowSeed(dealId));
}

export function loadDealRoomWorkflowState(): Record<string, DealRoomWorkflow> {
  if (typeof window === 'undefined') return {};

  const defaults: Record<string, DealRoomWorkflow> = {
    'deal-1': getDealRoomWorkflowSeed('deal-1'),
    'deal-2': getDealRoomWorkflowSeed('deal-2'),
  };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Record<string, DealRoomWorkflow>;
    return {
      ...defaults,
      ...parsed,
    };
  } catch {
    return defaults;
  }
}

export function saveDealRoomWorkflowState(state: Record<string, DealRoomWorkflow>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function submitDealRoomAsset(workflow: DealRoomWorkflow, assetId: string, content: string, submittedBy: string): DealRoomWorkflow {
  return {
    ...workflow,
    assets: workflow.assets.map((asset) => asset.id === assetId
      ? {
          ...asset,
          content: content.trim(),
          status: 'pending',
          submittedAt: new Date().toISOString(),
          submittedBy,
          reviewerNote: null,
        }
      : asset),
  };
}

export function reviewDealRoomAsset(workflow: DealRoomWorkflow, assetId: string, nextStatus: 'approved' | 'needs_revision' | 'rejected'): DealRoomWorkflow {
  return {
    ...workflow,
    assets: workflow.assets.map((asset) => asset.id === assetId
      ? {
          ...asset,
          status: nextStatus,
          reviewerNote: nextStatus === 'approved'
            ? 'Approved for launch.'
            : nextStatus === 'needs_revision'
              ? 'Needs revision before this can go live.'
              : 'Rejected, do not use this version.',
        }
      : asset),
  };
}

export function toggleDealRoomCompliance(workflow: DealRoomWorkflow, itemId: string): DealRoomWorkflow {
  return {
    ...workflow,
    compliance: workflow.compliance.map((item) => item.id === itemId && item.manual
      ? { ...item, complete: !item.complete }
      : item),
  };
}

export function addDealRoomProof(
  workflow: DealRoomWorkflow,
  params: { label: string; url: string; notes?: string; submittedBy: string },
): DealRoomWorkflow {
  return {
    ...workflow,
    proofs: [{
      id: `proof-${Date.now()}`,
      label: params.label.trim(),
      url: params.url.trim(),
      notes: params.notes?.trim() || '',
      submittedBy: params.submittedBy,
      createdAt: new Date().toISOString(),
    }, ...workflow.proofs],
  };
}

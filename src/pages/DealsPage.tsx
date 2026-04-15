import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { useDeals, useApplications, useUpdateApplicationStatus, useRespondToInquiry, useCreateReview, useAcceptApplicationToDeal, useAdvanceDealState, useCancelDeal, useDisputeDeal, useContracts, useDealMessages, useCommissions, useReportUploads, useCreateDeal } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { Handshake, DollarSign, Calendar, ArrowRight, CheckCircle2, XCircle, FileText, Ban, AlertTriangle, Star, ThumbsUp, ThumbsDown, MessageSquare, ClipboardList, Link2, ImageIcon, ShieldCheck, Send } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SearchBar, PaginationControls } from '@/components/SearchPagination';
import { ContractBuilder } from '@/components/ContractBuilder';
import { StarRating } from '@/components/StarRating';
import type { DealWithRelations, ApplicationWithProfile } from '@/types/supabase-joins';
import { useQueryClient } from '@tanstack/react-query';
import { DealsSkeleton } from '@/components/PageSkeletons';
import { DashboardChartCard } from '@/components/dashboard/DashboardCharts';
import type { DealRoomWorkflow, DealRoomPromoAsset } from '@/lib/mockDealRoomWorkflow';
import { addDealRoomProof, getDealRoomWorkflowSeed, loadDealRoomWorkflowState, reviewDealRoomAsset, saveDealRoomWorkflowState, submitDealRoomAsset, toggleDealRoomCompliance } from '@/lib/mockDealRoomWorkflow';
import type { PartnerTrustRecord } from '@/lib/mockPartnerTrust';
import { appendPartnerTrustNote, buildRepeatDealInput, describePayoutReliability, describeResponseBehavior, getPartnerTrustKey, getPartnerTrustSeed, getRenewalCue, getSetupSpeedComparison, loadPartnerTrustState, savePartnerTrustState } from '@/lib/mockPartnerTrust';
import { isMockMode } from '@/data/dataMode';

const PAGE_SIZE = 20;

const NEXT_STATES: Record<string, string> = {
  active: 'completed',
};

const DEAL_STAGE_ORDER: DealWithRelations['state'][] = [
  'inquiry',
  'negotiation',
  'contract_pending',
  'active',
  'completed',
];

function getDealStageMeta(state: DealWithRelations['state']) {
  if (state === 'cancelled') return { progress: 100, tone: 'text-destructive', label: 'Deal cancelled' };
  if (state === 'disputed') return { progress: 85, tone: 'text-warning', label: 'Needs dispute resolution' };

  const index = DEAL_STAGE_ORDER.indexOf(state);
  const progress = index >= 0 ? Math.round(((index + 1) / DEAL_STAGE_ORDER.length) * 100) : 0;
  return {
    progress,
    tone: 'text-primary',
    label: `Progress: ${progress}%`,
  };
}

type DealRoomMilestoneStatus = 'done' | 'current' | 'upcoming' | 'blocked';

interface DealRoomMilestone {
  key: string;
  label: string;
  helper: string;
  owner: string;
  status: DealRoomMilestoneStatus;
}

const DEAL_ROOM_OPERATOR_PLAYBOOK: Record<string, { internalStatus: string; notes: string[] }> = {
  'deal-1': {
    internalStatus: 'Negotiation is live. Keep the partner in the room and turn verbal alignment into signed terms fast.',
    notes: [
      'Confirm clip approval turnaround before the contract draft goes out.',
      'Use the room as the source of truth instead of letting approvals drift into side chats.',
    ],
  },
  'deal-2': {
    internalStatus: 'Delivery is already underway. Reporting and payout visibility are the next trust anchors.',
    notes: [
      'Collect live proof and report inputs here before payout conversations start drifting.',
      'If this one lands cleanly, convert it into the template for the next repeat deal.',
    ],
  },
};

function buildDealRoomMilestones(deal: DealWithRelations): DealRoomMilestone[] {
  const state = deal.state;
  const base: DealRoomMilestone[] = [
    {
      key: 'inquiry',
      label: 'Inquiry logged',
      helper: 'The first outreach stays attached to the partnership record.',
      owner: 'Casino manager',
      status: 'done',
    },
    {
      key: 'negotiation',
      label: 'Negotiation in room',
      helper: 'Terms, concerns, and next steps should stay inside the platform.',
      owner: 'Both sides',
      status: state === 'inquiry' ? 'current' : DEAL_STAGE_ORDER.includes(state) && DEAL_STAGE_ORDER.indexOf(state) > 0 ? 'done' : 'upcoming',
    },
    {
      key: 'contract_pending',
      label: 'Contract and signatures',
      helper: 'The agreement gets drafted, reviewed, and signed here.',
      owner: 'Both sides',
      status: state === 'contract_pending' ? 'current' : DEAL_STAGE_ORDER.includes(state) && DEAL_STAGE_ORDER.indexOf(state) > 2 ? 'done' : 'upcoming',
    },
    {
      key: 'active',
      label: 'Live delivery and reports',
      helper: 'Execution and proof should be visible before payout talk starts.',
      owner: 'Casino manager',
      status: state === 'active' ? 'current' : state === 'completed' ? 'done' : 'upcoming',
    },
    {
      key: 'completed',
      label: 'Payout and closeout',
      helper: 'Commissions, payout state, and renewal decisions stay legible.',
      owner: 'Casino manager',
      status: state === 'completed' ? 'current' : 'upcoming',
    },
  ];

  if (state === 'cancelled') {
    return base.map((item, index) => ({
      ...item,
      status: index < 2 ? 'done' : index === 2 ? 'blocked' : 'upcoming',
    }));
  }

  if (state === 'disputed') {
    return base.map((item, index) => ({
      ...item,
      status: index < 3 ? 'done' : index === 3 ? 'blocked' : 'upcoming',
    }));
  }

  return base.map((item) => {
    if (item.key === state) return { ...item, status: 'current' };
    return item;
  });
}

function getDealRoomNextOwner(deal: DealWithRelations) {
  switch (deal.state) {
    case 'inquiry':
      return 'Streamer response needed';
    case 'negotiation':
      return 'Casino manager should draft terms';
    case 'contract_pending':
      return 'Both sides need signatures';
    case 'active':
      return 'Casino manager should collect proof and report data';
    case 'completed':
      return 'Operator should close payout and tee up renewal';
    case 'disputed':
      return 'Operator intervention needed';
    case 'cancelled':
      return 'No action, closed';
    default:
      return 'Keep the room current';
  }
}

function getDealRoomRiskFlags(deal: DealWithRelations, hasContract: boolean, hasCommissions: boolean) {
  const riskFlags: string[] = [];

  if (deal.state === 'inquiry') riskFlags.push('No committed terms yet, easy to lose off-platform.');
  if (deal.state === 'negotiation' && !hasContract) riskFlags.push('Contract draft still missing.');
  if (deal.state === 'contract_pending') riskFlags.push('Waiting on signatures before the deal can go live.');
  if ((deal.state === 'active' || deal.state === 'completed') && !hasCommissions) riskFlags.push('No payout rows logged yet.');
  if (deal.state === 'disputed') riskFlags.push('Dispute is open and needs operator review.');

  return riskFlags;
}

function getAssetOwnerLabel(owner: DealRoomPromoAsset['owner']) {
  if (owner === 'casino_manager') return 'Casino manager';
  if (owner === 'streamer') return 'Streamer';
  return 'Both sides';
}

function getAssetFieldLabel(kind: DealRoomPromoAsset['kind']) {
  if (kind === 'copy') return 'Copy draft';
  if (kind === 'link') return 'Tracking link';
  return 'Media preview';
}

const DealsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: deals, isLoading } = useDeals();
  const { data: applications } = useApplications();
  const requestedDealId = searchParams.get('deal');
  const updateAppStatus = useUpdateApplicationStatus();
  const respondToInquiry = useRespondToInquiry();
  const createReview = useCreateReview();
  const acceptApplicationToDeal = useAcceptApplicationToDeal();
  const advanceDealState = useAdvanceDealState();
  const cancelDealMutation = useCancelDeal();
  const disputeDealMutation = useDisputeDeal();
  const createDeal = useCreateDeal();
  const { data: commissions } = useCommissions();
  const { data: reportUploads } = useReportUploads();
  const { toast } = useToast();
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [showApps, setShowApps] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(requestedDealId);
  const [contractDeal, setContractDeal] = useState<DealWithRelations | null>(null);
  const [cancelDeal, setCancelDeal] = useState<DealWithRelations | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [disputeDeal, setDisputeDeal] = useState<DealWithRelations | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputing, setDisputing] = useState(false);
  const [reviewDeal, setReviewDeal] = useState<DealWithRelations | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [dealRoomWorkflows, setDealRoomWorkflows] = useState<Record<string, DealRoomWorkflow>>(() => loadDealRoomWorkflowState());
  const [partnerTrustState, setPartnerTrustState] = useState<Record<string, PartnerTrustRecord>>(() => loadPartnerTrustState());
  const [assetDrafts, setAssetDrafts] = useState<Record<string, string>>({});
  const [proofLabel, setProofLabel] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const [trustNoteDraft, setTrustNoteDraft] = useState('');
  const [creatingRepeatDeal, setCreatingRepeatDeal] = useState(false);

  type DealFilter = 'all' | 'needs_action' | DealWithRelations['state'];

  const isCasino = user?.role === 'casino_manager';
  const pendingApps = (applications || []).filter(a => a.status === 'pending');
  const [stateFilter, setStateFilter] = useState<DealFilter>('all');
  const stateOptions = useMemo(() => {
    const states = Array.from(new Set((deals || []).map((deal) => deal.state))).sort();
    return states;
  }, [deals]);

  const needsActionCount = useMemo(() => {
    if (isCasino) {
      return (deals || []).filter((deal) => deal.state === 'negotiation' || deal.state === 'contract_pending').length;
    }
    return (deals || []).filter((deal) => deal.state === 'inquiry').length;
  }, [deals, isCasino]);

  const stateCounts = useMemo(() => {
    const map: Record<string, number> = { all: (deals || []).length, needs_action: needsActionCount };
    (deals || []).forEach((deal) => {
      map[deal.state] = (map[deal.state] || 0) + 1;
    });
    return map;
  }, [deals, needsActionCount]);

  const activeCount = (deals || []).filter((deal) => deal.state === 'active').length;
  const completedCount = (deals || []).filter((deal) => deal.state === 'completed').length;
  const urgentDeals = (deals || []).filter((deal) => {
    if (isCasino) return deal.state === 'negotiation' || deal.state === 'contract_pending';
    return deal.state === 'inquiry' || deal.state === 'contract_pending';
  }).slice(0, 3);

  // Filter and paginate
  const filtered = (deals || []).filter((d: DealWithRelations) => {
    const actionRelevant = isCasino ? (d.state === 'negotiation' || d.state === 'contract_pending') : d.state === 'inquiry';
    if (stateFilter === 'needs_action' && !actionRelevant) return false;
    if (stateFilter !== 'all' && stateFilter !== 'needs_action' && d.state !== stateFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (d.campaigns?.title || '').toLowerCase().includes(s) ||
      (d.organizations?.name || '').toLowerCase().includes(s) ||
      (d.profiles?.display_name || '').toLowerCase().includes(s) ||
      d.state.toLowerCase().includes(s);
  });
  const totalCount = filtered.length;
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const selectedDeal = useMemo(
    () => (deals || []).find((deal) => deal.id === selectedDealId) || null,
    [deals, selectedDealId],
  );
  const { data: roomContracts } = useContracts(selectedDeal?.id);
  const { data: roomMessages } = useDealMessages(selectedDeal?.id || null);
  const selectedDealCommissions = useMemo(
    () => (commissions || []).filter((commission) => commission.deal_id === selectedDeal?.id),
    [commissions, selectedDeal?.id],
  );
  const latestRoomMessage = roomMessages?.[roomMessages.length - 1] || null;
  const latestRoomContract = roomContracts?.[0] || null;
  const roomMilestones = useMemo(
    () => (selectedDeal ? buildDealRoomMilestones(selectedDeal) : []),
    [selectedDeal],
  );
  const roomRiskFlags = useMemo(
    () => selectedDeal ? getDealRoomRiskFlags(selectedDeal, Boolean(latestRoomContract), selectedDealCommissions.length > 0) : [],
    [selectedDeal, latestRoomContract, selectedDealCommissions.length],
  );
  const roomPartnerName = selectedDeal
    ? (user?.role === 'streamer' ? selectedDeal.organizations?.name : selectedDeal.profiles?.display_name) || 'Partner'
    : 'Partner';
  const roomPayoutTotal = selectedDealCommissions.reduce((sum, commission) => sum + Number(commission.amount), 0);
  const roomPendingPayouts = selectedDealCommissions.filter((commission) => commission.status === 'pending').length;
  const latestReportUpload = reportUploads?.[0] || null;
  const operatorPlaybook = selectedDeal
    ? DEAL_ROOM_OPERATOR_PLAYBOOK[selectedDeal.id] || {
        internalStatus: getDealRoomNextOwner(selectedDeal),
        notes: ['Keep the deal room updated so approvals, proof, and payout context do not leak into side channels.'],
      }
    : null;
  const selectedDealWorkflow = useMemo(
    () => (selectedDeal ? dealRoomWorkflows[selectedDeal.id] || getDealRoomWorkflowSeed(selectedDeal.id) : null),
    [dealRoomWorkflows, selectedDeal],
  );
  const selectedPartnerTrust = useMemo(
    () => (selectedDeal ? partnerTrustState[getPartnerTrustKey(selectedDeal)] || getPartnerTrustSeed(selectedDeal) : null),
    [partnerTrustState, selectedDeal],
  );
  const selectedAssets = selectedDealWorkflow?.assets || [];
  const selectedProofs = selectedDealWorkflow?.proofs || [];
  const approvedAssetCount = selectedAssets.filter((asset) => asset.status === 'approved').length;
  const pendingAssetCount = selectedAssets.filter((asset) => asset.status === 'pending' || asset.status === 'needs_revision').length;
  const complianceChecklist = useMemo(() => {
    if (!selectedDealWorkflow) return [];

    const copyApproved = selectedAssets.find((asset) => asset.kind === 'copy')?.status === 'approved';
    const linkApproved = selectedAssets.find((asset) => asset.kind === 'link')?.status === 'approved';
    const proofCaptured = selectedProofs.length > 0;

    return selectedDealWorkflow.compliance.map((item) => {
      if (item.id === 'copy-approved') return { ...item, complete: copyApproved };
      if (item.id === 'link-approved') return { ...item, complete: linkApproved };
      if (item.id === 'proof-captured') return { ...item, complete: proofCaptured };
      return item;
    });
  }, [selectedAssets, selectedDealWorkflow, selectedProofs.length]);
  const incompleteComplianceCount = complianceChecklist.filter((item) => !item.complete).length;
  const workflowRiskFlags = useMemo(() => {
    if (!selectedDeal) return [];

    const flags: string[] = [];
    if (pendingAssetCount > 0) flags.push('Promo assets are still waiting on approval or revision.');
    if (incompleteComplianceCount > 0) flags.push('Compliance checklist is still incomplete.');
    if ((selectedDeal.state === 'active' || selectedDeal.state === 'completed') && selectedProofs.length === 0) {
      flags.push('Live delivery proof has not been captured yet.');
    }
    return flags;
  }, [incompleteComplianceCount, pendingAssetCount, selectedDeal, selectedProofs.length]);
  const allRiskFlags = [...roomRiskFlags, ...workflowRiskFlags];
  const trustHistoryItems = selectedPartnerTrust?.history || [];
  const renewalCue = selectedPartnerTrust ? getRenewalCue(selectedPartnerTrust) : 'No renewal shortcut yet.';
  const setupSpeed = selectedPartnerTrust ? getSetupSpeedComparison(selectedPartnerTrust) : { coldStartSteps: 4, repeatSteps: 4, fasterBy: 0 };
  const canCreateRepeatDeal = Boolean(
    isCasino
    && selectedDeal
    && selectedPartnerTrust
    && (selectedPartnerTrust.completedDeals > 0 || selectedDeal.state === 'completed' || selectedDeal.state === 'active')
    && (selectedDeal.campaign_id || isMockMode()),
  );

  useEffect(() => {
    if (requestedDealId && requestedDealId !== selectedDealId) {
      setSelectedDealId(requestedDealId);
    }
  }, [requestedDealId, selectedDealId]);

  useEffect(() => {
    if (!deals?.length) {
      setSelectedDealId(null);
      return;
    }

    if (selectedDealId && deals.some((deal) => deal.id === selectedDealId)) {
      return;
    }

    const fallbackDealId = requestedDealId && deals.some((deal) => deal.id === requestedDealId)
      ? requestedDealId
      : urgentDeals[0]?.id || deals[0]?.id || null;

    if (fallbackDealId) {
      setSelectedDealId(fallbackDealId);
    }
  }, [deals, requestedDealId, selectedDealId, urgentDeals]);

  useEffect(() => {
    saveDealRoomWorkflowState(dealRoomWorkflows);
  }, [dealRoomWorkflows]);

  useEffect(() => {
    savePartnerTrustState(partnerTrustState);
  }, [partnerTrustState]);

  useEffect(() => {
    if (!selectedDeal) return;
    if (dealRoomWorkflows[selectedDeal.id]) return;

    setDealRoomWorkflows((prev) => ({
      ...prev,
      [selectedDeal.id]: getDealRoomWorkflowSeed(selectedDeal.id),
    }));
  }, [dealRoomWorkflows, selectedDeal]);

  useEffect(() => {
    if (!selectedDeal) return;

    const trustKey = getPartnerTrustKey(selectedDeal);
    if (partnerTrustState[trustKey]) return;

    setPartnerTrustState((prev) => ({
      ...prev,
      [trustKey]: getPartnerTrustSeed(selectedDeal),
    }));
  }, [partnerTrustState, selectedDeal]);

  useEffect(() => {
    setProofLabel('');
    setProofUrl('');
    setProofNotes('');
    setTrustNoteDraft('');
  }, [selectedDealId]);

  const updateSelectedDealWorkflow = (updater: (current: DealRoomWorkflow) => DealRoomWorkflow) => {
    if (!selectedDeal) return;

    setDealRoomWorkflows((prev) => {
      const current = prev[selectedDeal.id] || getDealRoomWorkflowSeed(selectedDeal.id);
      return {
        ...prev,
        [selectedDeal.id]: updater(current),
      };
    });
  };

  const updateSelectedPartnerTrust = (updater: (current: PartnerTrustRecord) => PartnerTrustRecord) => {
    if (!selectedDeal) return;

    const trustKey = getPartnerTrustKey(selectedDeal);
    setPartnerTrustState((prev) => {
      const current = prev[trustKey] || getPartnerTrustSeed(selectedDeal);
      return {
        ...prev,
        [trustKey]: updater(current),
      };
    });
  };

  const handleSubmitAsset = (asset: DealRoomPromoAsset) => {
    if (!selectedDeal || !user) return;

    const draftKey = `${selectedDeal.id}:${asset.id}`;
    const content = (assetDrafts[draftKey] ?? asset.content).trim();

    if (!content) {
      toast({ title: 'Asset content required', description: `Add ${getAssetFieldLabel(asset.kind).toLowerCase()} content before submitting.`, variant: 'destructive' });
      return;
    }

    updateSelectedDealWorkflow((current) => submitDealRoomAsset(current, asset.id, content, user.displayName));

    toast({ title: `${asset.label} submitted`, description: 'The asset now lives in the deal room for review.' });
  };

  const handleReviewAsset = (asset: DealRoomPromoAsset, nextStatus: 'approved' | 'needs_revision' | 'rejected') => {
    updateSelectedDealWorkflow((current) => reviewDealRoomAsset(current, asset.id, nextStatus));

    toast({ title: `${asset.label} ${nextStatus === 'needs_revision' ? 'sent back for revision' : nextStatus}` });
  };

  const handleToggleCompliance = (itemId: string) => {
    updateSelectedDealWorkflow((current) => toggleDealRoomCompliance(current, itemId));
  };

  const handleAddProof = () => {
    if (!selectedDeal || !user) return;
    if (!(selectedDeal.state === 'active' || selectedDeal.state === 'completed')) {
      toast({ title: 'Proof is locked', description: 'Delivery proof only opens once the deal is live.', variant: 'destructive' });
      return;
    }
    if (!proofLabel.trim() || !proofUrl.trim()) {
      toast({ title: 'Proof details required', description: 'Add a placement label and proof URL so the record is useful.', variant: 'destructive' });
      return;
    }

    updateSelectedDealWorkflow((current) => addDealRoomProof(current, {
      label: proofLabel,
      url: proofUrl,
      notes: proofNotes,
      submittedBy: user.displayName,
    }));

    setProofLabel('');
    setProofUrl('');
    setProofNotes('');
    toast({ title: 'Delivery proof logged', description: 'The live placement now feeds the deal record directly.' });
  };

  const handleSaveTrustNote = () => {
    if (!selectedDeal || !user) return;
    if (!trustNoteDraft.trim()) {
      toast({ title: 'Trust note required', description: 'Add a real note or skip the ceremony.', variant: 'destructive' });
      return;
    }

    updateSelectedPartnerTrust((current) => appendPartnerTrustNote(current, trustNoteDraft, user.displayName));
    setTrustNoteDraft('');
    toast({ title: 'Operator note saved', description: 'This trust memory now stays attached to the partner.' });
  };

  const handleCreateRepeatDeal = async () => {
    if (!selectedDeal || !user || !selectedPartnerTrust) return;

    setCreatingRepeatDeal(true);
    try {
      const newDeal = await createDeal.mutateAsync(buildRepeatDealInput(selectedDeal));
      updateSelectedPartnerTrust((current) => appendPartnerTrustNote(
        current,
        `Renewal opened from ${selectedDeal.campaigns?.title || 'Direct Deal'} using the prior ${selectedDeal.deal_type} structure for $${Number(selectedDeal.value).toLocaleString()}.`,
        user.displayName,
      ));
      openDealRoom(newDeal.id);
      toast({
        title: 'Repeat deal created',
        description: `Started from prior terms and skipped ${setupSpeed.fasterBy} cold-start step${setupSpeed.fasterBy === 1 ? '' : 's'}.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create repeat deal';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setCreatingRepeatDeal(false);
  };

  const openDealRoom = (dealId: string) => {
    setSelectedDealId(dealId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('deal', dealId);
    setSearchParams(nextParams, { replace: true });
  };

  const handleAcceptApplication = async (app: ApplicationWithProfile) => {
    try {
      await acceptApplicationToDeal.mutateAsync(app);
      toast({ title: 'Application accepted & deal created' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleRejectApplication = async (appId: string) => {
    try {
      await updateAppStatus.mutateAsync({ id: appId, status: 'rejected' });
      toast({ title: 'Application rejected' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const qc = useQueryClient();
  const handleAdvanceState = async (dealId: string, currentState: string) => {
    const nextState = NEXT_STATES[currentState];
    if (!nextState) return;

    setTransitioning(dealId);
    try {
      await advanceDealState.mutateAsync({
        dealId,
        to_state: nextState,
        from_state: currentState,
      });
      toast({ title: `Deal moved to ${nextState.replace('_', ' ')}` });
      qc.invalidateQueries({ queryKey: ['contracts'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setTransitioning(null);
  };

  const handleCancelDeal = async () => {
    if (!cancelDeal) return;
    if (!cancelReason.trim()) {
      toast({ title: 'Cancellation reason required', description: 'Add a short reason so the audit trail is not useless.', variant: 'destructive' });
      return;
    }
    setCancelling(true);
    try {
      await cancelDealMutation.mutateAsync({
        dealId: cancelDeal.id,
        to_state: 'cancelled',
        from_state: cancelDeal.state,
        reason: cancelReason,
      });
      toast({ title: 'Deal cancelled' });
      setCancelDeal(null);
      setCancelReason('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setCancelling(false);
  };

  const handleDisputeDeal = async () => {
    if (!disputeDeal) return;
    setDisputing(true);
    try {
      await disputeDealMutation.mutateAsync({
        dealId: disputeDeal.id,
        to_state: 'disputed',
        from_state: disputeDeal.state,
        reason: disputeReason,
      });
      toast({ title: 'Deal disputed' });
      setDisputeDeal(null);
      setDisputeReason('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setDisputing(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Deals</h1>
            <p className="text-sm text-muted-foreground">Move each partnership from inquiry to signed contract to live delivery.</p>
          </div>
          {isCasino && pendingApps.length > 0 && (
            <Button variant="outline" onClick={() => setShowApps(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {pendingApps.length} Pending Application{pendingApps.length > 1 ? 's' : ''}
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 shadow-card space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Core workflow</p>
          <p className="text-sm text-muted-foreground">Accept the right opportunity, move it into contract, keep execution visible, then hand off to reporting and commissions.</p>
        </div>

        <SearchBar value={search} onChange={v => { setSearch(v); setPage(0); }} placeholder="Search deals or partners..." />

        <div className="flex flex-wrap gap-2">
          <Button
            variant={stateFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStateFilter('all'); setPage(0); }}
          >
            All ({stateCounts.all || 0})
          </Button>
          <Button
            variant={stateFilter === 'needs_action' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStateFilter('needs_action'); setPage(0); }}
          >
            Needs Action ({stateCounts.needs_action || 0})
          </Button>
          {stateOptions.map((state) => (
            <Button
              key={state}
              variant={stateFilter === state ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStateFilter(state); setPage(0); }}
            >
              {state.replace('_', ' ')} ({stateCounts[state] || 0})
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardChartCard title="Total deals" subtitle="Everything in your current pipeline">
            <p className="text-3xl font-bold">{stateCounts.all || 0}</p>
          </DashboardChartCard>
          <DashboardChartCard title="Needs action" subtitle={isCasino ? 'Negotiation and contract work waiting on you' : 'Inquiries or contracts waiting on you'}>
            <p className="text-3xl font-bold text-primary">{needsActionCount}</p>
          </DashboardChartCard>
          <DashboardChartCard title="Active" subtitle="Live partnerships currently running">
            <p className="text-3xl font-bold">{activeCount}</p>
          </DashboardChartCard>
          <DashboardChartCard title="Completed" subtitle="Finished deals you can review or reference">
            <p className="text-3xl font-bold">{completedCount}</p>
          </DashboardChartCard>
        </div>

        {urgentDeals.length > 0 && (
          <DashboardChartCard
            title="Move these next"
            subtitle={isCasino ? 'These are the closest deals to turning into signed work' : 'These are the partnerships most likely to need your response next'}
          >
            <div className="space-y-3">
              {urgentDeals.map((deal) => (
                <div key={deal.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{deal.campaigns?.title || 'Direct Deal'}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.role === 'streamer' ? deal.organizations?.name : deal.profiles?.display_name} · ${Number(deal.value).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={deal.state} />
                    {deal.state !== 'inquiry' && (
                      <Link to={`/messages?deal=${deal.id}`}>
                        <Button size="sm" variant="outline">Open</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DashboardChartCard>
        )}

        {selectedDeal && (
          <section className="rounded-xl border border-primary/20 bg-card p-5 shadow-card space-y-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Deal room</p>
                <h2 className="text-xl font-semibold">{selectedDeal.campaigns?.title || 'Direct Deal'}</h2>
                <p className="text-sm text-muted-foreground">
                  Keep contract, communication, delivery, and payout state in one place for {roomPartnerName}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selectedDeal.state} />
                <StatusBadge status={selectedDeal.deal_type} />
                <Button variant="outline" size="sm" onClick={() => openDealRoom(selectedDeal.id)}>
                  Room pinned to this deal
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Current stage</p>
                <p className="font-semibold">{selectedDeal.state.replace('_', ' ')}</p>
                <p className="text-sm text-muted-foreground">{getDealStageMeta(selectedDeal.state).label}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Next owner</p>
                <p className="font-semibold">{getDealRoomNextOwner(selectedDeal)}</p>
                <p className="text-sm text-muted-foreground">Who should move this partnership forward next.</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Latest message</p>
                <p className="font-semibold">{latestRoomMessage?.profiles?.display_name || 'No deal thread yet'}</p>
                <p className="text-sm text-muted-foreground">
                  {latestRoomMessage?.content || 'Once the partnership is active in the room, the latest message will show here.'}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Payout state</p>
                <p className="font-semibold">
                  {selectedDealCommissions.length > 0 ? `$${roomPayoutTotal.toLocaleString()}` : 'No payout rows yet'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedDealCommissions.length > 0
                    ? `${roomPendingPayouts} pending commission${roomPendingPayouts === 1 ? '' : 's'} in this room.`
                    : selectedDeal.state === 'active' || selectedDeal.state === 'completed'
                      ? 'Reports can now turn into commissions and payout tracking.'
                      : 'Payout tracking starts once the deal is live and reported.'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold">Timeline</h3>
                    <p className="text-sm text-muted-foreground">See what happened, what is blocked, and who owns the next move.</p>
                  </div>
                  <div className="space-y-3">
                    {roomMilestones.map((milestone) => {
                      const icon = milestone.status === 'done'
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        : milestone.status === 'current'
                          ? <ArrowRight className="h-4 w-4 text-primary" />
                          : milestone.status === 'blocked'
                            ? <AlertTriangle className="h-4 w-4 text-warning" />
                            : <Calendar className="h-4 w-4 text-muted-foreground" />;

                      return (
                        <div key={milestone.key} className="flex gap-3 rounded-lg border border-border bg-muted/20 p-3">
                          <div className="mt-0.5">{icon}</div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium">{milestone.label}</p>
                              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{milestone.status}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{milestone.helper}</p>
                            <p className="text-xs text-muted-foreground">Owner: {milestone.owner}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold">Execution snapshot</h3>
                    <p className="text-sm text-muted-foreground">Contract, promo approvals, proof, and payout clues that keep the room useful after the intro.</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Contract</p>
                      <p className="font-medium">{latestRoomContract ? latestRoomContract.status.replace('_', ' ') : 'Not drafted yet'}</p>
                      <p className="text-sm text-muted-foreground">
                        {latestRoomContract ? `Created ${new Date(latestRoomContract.created_at).toLocaleDateString()}` : 'Draft terms here before the partnership drifts into off-platform chaos.'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Promo assets</p>
                      <p className="font-medium">{approvedAssetCount} approved, {pendingAssetCount} waiting</p>
                      <p className="text-sm text-muted-foreground">
                        Keep copy, links, and media approvals attached here before anything goes live.
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Proof</p>
                      <p className="font-medium">
                        {selectedProofs.length > 0 ? `${selectedProofs.length} proof item${selectedProofs.length === 1 ? '' : 's'} logged` : selectedDeal.state === 'active' || selectedDeal.state === 'completed' ? 'Ready for delivery proof' : 'Locked until live'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedProofs.length > 0
                          ? `Latest proof captured ${new Date(selectedProofs[0].createdAt).toLocaleDateString()}`
                          : latestReportUpload && isCasino
                            ? `Latest org upload: ${new Date(latestReportUpload.created_at).toLocaleDateString()}`
                            : 'This room should feed cleanly into reporting instead of making people hunt for context.'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Messages</p>
                      <p className="font-medium">{roomMessages?.length || 0} update{roomMessages?.length === 1 ? '' : 's'}</p>
                      <p className="text-sm text-muted-foreground">
                        {latestRoomMessage ? 'Latest thread activity stays attached to the deal instead of disappearing into chat fog.' : 'Once the deal thread wakes up, the room becomes the memory.'}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedPartnerTrust && (
                  <div className="rounded-lg border border-border p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold">Partner history and renewal lane</h3>
                      <p className="text-sm text-muted-foreground">Completed deals, disputes, response behavior, and payout reliability stay visible so the second deal does not start from zero.</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Completed deals</p>
                        <p className="font-medium">{selectedPartnerTrust.completedDeals}</p>
                        <p className="text-sm text-muted-foreground">Past wins worth reusing instead of renegotiating from scratch.</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Disputes</p>
                        <p className="font-medium">{selectedPartnerTrust.disputedDeals}</p>
                        <p className="text-sm text-muted-foreground">Bad history should stay visible before anyone copies prior terms blindly.</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Response behavior</p>
                        <p className="font-medium">{describeResponseBehavior(selectedPartnerTrust.avgFirstResponseHours)}</p>
                        <p className="text-sm text-muted-foreground">Average first reply in {selectedPartnerTrust.avgFirstResponseHours} hours.</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Payout reliability</p>
                        <p className="font-medium">{describePayoutReliability(selectedPartnerTrust.onTimePayoutRate)}</p>
                        <p className="text-sm text-muted-foreground">{selectedPartnerTrust.onTimePayoutRate}% of prior payouts landed on time.</p>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">Relationship timeline</p>
                          <p className="text-sm text-muted-foreground">This is the memory layer that should make repeats safer than cold starts.</p>
                        </div>
                        <div className="space-y-3">
                          {trustHistoryItems.map((item) => (
                            <div key={item.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium">{item.campaignTitle}</p>
                                <StatusBadge status={item.outcome === 'completed' ? 'completed' : 'disputed'} />
                              </div>
                              <p className="text-sm text-muted-foreground">{item.summary}</p>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>Closed {new Date(item.closedAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{item.responseHours}h first response</span>
                                <span>•</span>
                                <span>{item.payoutStatus === 'paid_on_time' ? 'Paid on time' : item.payoutStatus === 'paid_late' ? 'Paid late' : 'Payout held'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-4 space-y-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Renewal cue</p>
                          <h3 className="font-semibold mt-1">Second deal should be easier</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{renewalCue}</p>
                        <div className="rounded-lg border border-border bg-background/90 p-3 space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Setup speed</p>
                          <p className="font-medium">Cold start: {setupSpeed.coldStartSteps} steps, repeat deal: {setupSpeed.repeatSteps} step{setupSpeed.repeatSteps === 1 ? '' : 's'}</p>
                          <p className="text-sm text-muted-foreground">Use prior payout, compliance, and response memory instead of reopening the same questions.</p>
                        </div>
                        {canCreateRepeatDeal && (
                          <Button className="bg-gradient-brand hover:opacity-90" onClick={handleCreateRepeatDeal} disabled={creatingRepeatDeal || createDeal.isPending}>
                            {creatingRepeatDeal || createDeal.isPending ? 'Creating repeat deal...' : 'Create repeat deal from prior terms'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedDealWorkflow && (
                  <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold">Creative brief</h3>
                        <p className="text-sm text-muted-foreground">The promo angle, required talking points, and disclaimers stay attached to this deal.</p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                        <p className="text-sm font-medium">{selectedDealWorkflow.briefHeadline}</p>
                        <p className="text-sm text-muted-foreground">{selectedDealWorkflow.campaignAngle}</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium">Promo requirements</p>
                          </div>
                          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                            {selectedDealWorkflow.promoRequirements.map((requirement) => <li key={requirement}>{requirement}</li>)}
                          </ul>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium">Required disclaimers</p>
                          </div>
                          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                            {selectedDealWorkflow.requiredDisclaimers.map((disclaimer) => <li key={disclaimer}>{disclaimer}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold">Compliance checklist</h3>
                        <p className="text-sm text-muted-foreground">Required disclaimer and approval checks tied directly to this deal.</p>
                      </div>
                      <div className="space-y-3">
                        {complianceChecklist.map((item) => (
                          <label key={item.id} className="flex gap-3 rounded-lg border border-border bg-muted/20 p-3">
                            {item.manual && isCasino ? (
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4"
                                checked={item.complete}
                                onChange={() => handleToggleCompliance(item.id)}
                                aria-label={item.label}
                              />
                            ) : (
                              <div className="mt-0.5">
                                {item.complete ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-warning" />}
                              </div>
                            )}
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium">{item.label}</p>
                                <StatusBadge status={item.complete ? 'approved' : 'pending'} />
                              </div>
                              <p className="text-sm text-muted-foreground">{item.helper}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedDealWorkflow && (
                  <div className="rounded-lg border border-border p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold">Promo asset approvals</h3>
                      <p className="text-sm text-muted-foreground">Copy, links, and media stay inside the room with clear submit, approve, revise, and reject states.</p>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-3">
                      {selectedAssets.map((asset) => {
                        const draftKey = `${selectedDeal.id}:${asset.id}`;
                        const canSubmitAsset = asset.owner === 'both' || asset.owner === user?.role;

                        return (
                          <div key={asset.id} className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {asset.kind === 'copy' ? <ClipboardList className="h-4 w-4 text-primary" /> : asset.kind === 'link' ? <Link2 className="h-4 w-4 text-primary" /> : <ImageIcon className="h-4 w-4 text-primary" />}
                                <p className="font-medium">{asset.label}</p>
                              </div>
                              <p className="text-sm text-muted-foreground">{asset.helper}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <StatusBadge status={asset.status} />
                              <span>Owner: {getAssetOwnerLabel(asset.owner)}</span>
                            </div>

                            <div className="rounded-lg border border-border bg-background/80 p-3 text-sm text-muted-foreground min-h-[88px]">
                              {asset.content || 'Nothing submitted yet.'}
                            </div>

                            {asset.submittedBy && (
                              <p className="text-xs text-muted-foreground">
                                Submitted by {asset.submittedBy}{asset.submittedAt ? ` on ${new Date(asset.submittedAt).toLocaleDateString()}` : ''}
                              </p>
                            )}

                            {asset.reviewerNote && (
                              <p className="text-xs text-muted-foreground">Review note: {asset.reviewerNote}</p>
                            )}

                            {canSubmitAsset && (
                              <div className="space-y-2">
                                <Label htmlFor={`asset-${asset.id}`}>{getAssetFieldLabel(asset.kind)}</Label>
                                {asset.kind === 'copy' ? (
                                  <Textarea
                                    id={`asset-${asset.id}`}
                                    value={assetDrafts[draftKey] ?? asset.content}
                                    onChange={(event) => setAssetDrafts((prev) => ({ ...prev, [draftKey]: event.target.value }))}
                                    placeholder={asset.kind === 'copy' ? 'Add the caption or stream talking points here' : 'Add the asset content here'}
                                    rows={4}
                                  />
                                ) : (
                                  <Input
                                    id={`asset-${asset.id}`}
                                    value={assetDrafts[draftKey] ?? asset.content}
                                    onChange={(event) => setAssetDrafts((prev) => ({ ...prev, [draftKey]: event.target.value }))}
                                    placeholder={asset.kind === 'link' ? 'https://approved-link.example' : 'https://preview.example/media'}
                                  />
                                )}
                                <Button size="sm" variant="outline" onClick={() => handleSubmitAsset(asset)}>
                                  <Send className="mr-1 h-3 w-3" />{asset.content ? `Resubmit ${asset.label}` : `Submit ${asset.label}`}
                                </Button>
                              </div>
                            )}

                            {isCasino && asset.content && (
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={() => handleReviewAsset(asset, 'approved')}>
                                  {`Approve ${asset.label}`}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleReviewAsset(asset, 'needs_revision')}>
                                  {`Request Revision ${asset.label}`}
                                </Button>
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleReviewAsset(asset, 'rejected')}>
                                  {`Reject ${asset.label}`}
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedDealWorkflow && (
                  <div className="rounded-lg border border-border p-4 space-y-4">
                    <div>
                      <h3 className="font-semibold">Delivery proof</h3>
                      <p className="text-sm text-muted-foreground">Capture live post or stream proof here so reporting and payout stay anchored to the same record.</p>
                    </div>

                    <div className="space-y-3">
                      {selectedProofs.length > 0 ? selectedProofs.map((proof) => (
                        <div key={proof.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">{proof.label}</p>
                            <p className="text-xs text-muted-foreground">Logged by {proof.submittedBy}</p>
                          </div>
                          <a href={proof.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline break-all">{proof.url}</a>
                          {proof.notes && <p className="text-sm text-muted-foreground">{proof.notes}</p>}
                        </div>
                      )) : (
                        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                          No delivery proof captured yet.
                        </div>
                      )}
                    </div>

                    {(selectedDeal.state === 'active' || selectedDeal.state === 'completed') ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="proof-label">Placement / post label</Label>
                          <Input id="proof-label" value={proofLabel} onChange={(event) => setProofLabel(event.target.value)} placeholder="Kick stream clip, X post, Twitch VOD, etc." />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="proof-url">Proof URL</Label>
                          <Input id="proof-url" value={proofUrl} onChange={(event) => setProofUrl(event.target.value)} placeholder="https://twitch.tv/... or https://x.com/..." />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="proof-notes">Proof notes</Label>
                          <Textarea id="proof-notes" value={proofNotes} onChange={(event) => setProofNotes(event.target.value)} placeholder="Optional notes, timing, or placement context" rows={3} />
                        </div>
                        <div>
                          <Button className="bg-gradient-brand hover:opacity-90" onClick={handleAddProof}>Log delivery proof</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                        Delivery proof unlocks once the deal is live.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {selectedPartnerTrust && isCasino && (
                  <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-warning">Private trust memory</p>
                      <h3 className="font-semibold mt-1">Trust memory</h3>
                      <p className="text-sm text-muted-foreground">Geo notes, compliance notes, and operator context that compounds over time.</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Geo memory</p>
                      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                        {selectedPartnerTrust.geoMemory.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Compliance memory</p>
                      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                        {selectedPartnerTrust.complianceMemory.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trust-note">New trust note</Label>
                      <Textarea
                        id="trust-note"
                        value={trustNoteDraft}
                        onChange={(event) => setTrustNoteDraft(event.target.value)}
                        rows={3}
                        placeholder="Save the thing future-you will want to know before opening the next deal."
                      />
                      <Button size="sm" variant="outline" onClick={handleSaveTrustNote}>Save operator note</Button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Saved notes</p>
                      <div className="space-y-2">
                        {selectedPartnerTrust.operatorNotes.map((note) => (
                          <div key={note.id} className="rounded-lg border border-border bg-background/80 p-3 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                              <span>{note.author}</span>
                              <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold">Continue this deal</h3>
                    <p className="text-sm text-muted-foreground">Jump to the exact next surface without losing the room context.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedDeal.state !== 'inquiry' && (
                      <Link to={`/messages?deal=${selectedDeal.id}`}>
                        <Button size="sm" variant="outline"><MessageSquare className="mr-1 h-3 w-3" />Messages</Button>
                      </Link>
                    )}
                    {selectedDeal.state !== 'inquiry' && (
                      <Link to={`/contracts?deal=${selectedDeal.id}`}>
                        <Button size="sm" variant="outline"><FileText className="mr-1 h-3 w-3" />View Contract</Button>
                      </Link>
                    )}
                    {(selectedDeal.state === 'active' || selectedDeal.state === 'completed') && (
                      <Link to={`/reports?deal=${selectedDeal.id}`}>
                        <Button size="sm" className="bg-gradient-brand hover:opacity-90"><DollarSign className="mr-1 h-3 w-3" />Open Reports</Button>
                      </Link>
                    )}
                  </div>
                </div>

                {isCasino ? (
                  <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-warning">Operator view only</p>
                      <h3 className="font-semibold mt-1">Internal status and risk flags</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Internal status</p>
                      <p className="text-sm text-muted-foreground">{operatorPlaybook?.internalStatus}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Notes</p>
                      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                        {operatorPlaybook?.notes.map((note) => <li key={note}>{note}</li>)}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Risk flags</p>
                      {allRiskFlags.length > 0 ? (
                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                          {allRiskFlags.map((flag) => <li key={flag}>{flag}</li>)}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No internal risk flags right now.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <h3 className="font-semibold">Shared room view</h3>
                    <p className="text-sm text-muted-foreground">
                      You can see contract, delivery, and payout status here without the operator-only notes leaking across the room.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {isLoading ? (
          <DealsSkeleton />
        ) : !totalCount ? (
          <EmptyState
            icon={<Handshake className="h-6 w-6" />}
            title={stateFilter === 'all' ? 'No deals yet' : 'No deals match this filter'}
            description={
              stateFilter === 'all'
                ? (isCasino
                    ? 'Start by browsing streamers and opening an inquiry.'
                    : 'Deals will appear here once a casino reaches out or you join a campaign that turns into a partnership.')
                : search || stateFilter !== 'all'
                  ? 'Try a different search term or filter.'
                  : 'No deals are currently in this state.'
            }
            action={isCasino
              ? <Link to="/streamers"><Button className="bg-gradient-brand hover:opacity-90">Browse Streamers</Button></Link>
              : <Link to="/campaigns"><Button className="bg-gradient-brand hover:opacity-90">Browse Campaigns</Button></Link>}
          />
        ) : (
          <div className="space-y-4">
            {paginated.map((deal: DealWithRelations) => {
              const nextState = NEXT_STATES[deal.state];
              const isTerminal = deal.state === 'completed' || deal.state === 'cancelled';
              const stageMeta = getDealStageMeta(deal.state);
              const nextAction =
                deal.state === 'inquiry' && user?.role === 'streamer'
                  ? 'Respond to inquiry'
                  : deal.state === 'negotiation'
                    ? 'Create contract and collect signatures'
                    : deal.state === 'contract_pending'
                      ? 'Finish signatures in the contract step'
                      : deal.state === 'active'
                        ? 'Upload delivery proof and track commissions'
                        : deal.state === 'disputed'
                          ? 'Review dispute'
                          : deal.state === 'completed'
                            ? 'Leave review'
                            : 'No action required';
              return (
                <div key={deal.id} className={`rounded-xl border bg-card p-5 shadow-card hover:shadow-elevated transition-all ${selectedDealId === deal.id ? 'border-primary/40 ring-1 ring-primary/15' : 'border-border'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Handshake className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{deal.campaigns?.title || 'Direct Deal'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {user?.role === 'streamer' ? deal.organizations?.name : deal.profiles?.display_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={deal.state} />
                      <StatusBadge status={deal.deal_type} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />${Number(deal.value).toLocaleString()}</span>
                    <span className="flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">Platform fee: {deal.platform_fee_pct}%</span>
                    {deal.start_date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{deal.start_date} → {deal.end_date}</span>}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Next step: {nextAction}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Workflow progress</span>
                      <span className={stageMeta.tone}>{stageMeta.label}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${deal.state === 'cancelled' ? 'bg-destructive' : deal.state === 'disputed' ? 'bg-warning' : 'bg-primary'}`}
                        style={{ width: `${stageMeta.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={selectedDealId === deal.id ? 'default' : 'outline'}
                      onClick={() => openDealRoom(deal.id)}
                    >
                      {selectedDealId === deal.id ? 'Viewing Room' : 'Open Deal Room'}
                    </Button>
                    {/* Inquiry accept/decline for streamers */}
                    {deal.state === 'inquiry' && user?.role === 'streamer' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-gradient-brand hover:opacity-90"
                          onClick={async () => {
                            try {
                              await respondToInquiry.mutateAsync({ dealId: deal.id, accept: true });
                              toast({ title: 'Inquiry accepted — negotiation started' });
                            } catch (err: unknown) {
                              toast({ title: 'Error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
                            }
                          }}
                          disabled={respondToInquiry.isPending}
                        >
                          <ThumbsUp className="mr-1 h-3 w-3" />Accept Inquiry
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={async () => {
                            try {
                              await respondToInquiry.mutateAsync({ dealId: deal.id, accept: false });
                              toast({ title: 'Inquiry declined' });
                            } catch (err: unknown) {
                              toast({ title: 'Error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
                            }
                          }}
                          disabled={respondToInquiry.isPending}
                        >
                          <ThumbsDown className="mr-1 h-3 w-3" />Decline
                        </Button>
                      </>
                    )}
                    {deal.state !== 'inquiry' && (
                      <Link to={`/messages?deal=${deal.id}`}>
                        <Button size="sm" variant="outline">Messages</Button>
                      </Link>
                    )}
                    {deal.state !== 'inquiry' && (
                      <Link to={`/contracts?deal=${deal.id}`}>
                        <Button size="sm" variant="outline">View Contract</Button>
                      </Link>
                    )}
                    {(deal.state === 'active' || deal.state === 'completed') && (
                      <Link to={`/reports?deal=${deal.id}`}>
                        <Button size="sm" variant="outline">Reports</Button>
                      </Link>
                    )}
                    {isCasino && deal.state === 'negotiation' && (
                      <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={() => setContractDeal(deal)}>
                        <FileText className="mr-1 h-3 w-3" />Create Contract
                      </Button>
                    )}
                    {nextState && deal.state !== 'inquiry' && (
                      <Button
                        size="sm"
                        className="bg-gradient-brand hover:opacity-90"
                        onClick={() => handleAdvanceState(deal.id, deal.state)}
                        disabled={transitioning === deal.id}
                      >
                        {transitioning === deal.id ? 'Processing...' : (
                          <>Mark Completed <ArrowRight className="ml-1 h-3.5 w-3.5" /></>
                        )}
                      </Button>
                    )}
                    {deal.state === 'contract_pending' && (
                      <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs text-primary">
                        Contract is out for signature, the deal goes live once both sides sign
                      </span>
                    )}
                    {deal.state === 'active' && (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                        Live deal, move delivery proof and payouts through reports
                      </span>
                    )}
                    {deal.state === 'disputed' && (
                      <span className="inline-flex items-center rounded-full border border-warning/20 bg-warning/10 px-2.5 py-1 text-xs text-warning">
                        Escalated, review messages and contract details
                      </span>
                    )}
                    {deal.state === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReviewDeal(deal)}
                      >
                        <Star className="mr-1 h-3 w-3" />Leave Review
                      </Button>
                    )}
                    {deal.state === 'active' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-warning hover:text-warning"
                        onClick={() => setDisputeDeal(deal)}
                      >
                        <AlertTriangle className="mr-1 h-3 w-3" />Dispute
                      </Button>
                    )}
                    {!isTerminal && deal.state !== 'inquiry' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setCancelDeal(deal)}
                      >
                        <Ban className="mr-1 h-3 w-3" />Cancel
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <PaginationControls page={page} totalCount={totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      {/* Pending Applications Dialog */}
      <Dialog open={showApps} onOpenChange={setShowApps}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Pending Applications</DialogTitle>
            <DialogDescription>Review new streamer applications and decide whether to create a deal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pendingApps.map((app: ApplicationWithProfile) => (
              <div key={app.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                      {app.profiles?.display_name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{app.profiles?.display_name || 'Streamer'}</p>
                      <p className="text-xs text-muted-foreground">
                        {app.streamer_profiles?.avg_live_viewers || 0} avg viewers · {app.streamer_profiles?.follower_count?.toLocaleString() || 0} followers
                      </p>
                    </div>
                  </div>
                </div>
                {app.message && <p className="text-sm text-muted-foreground bg-muted rounded-lg p-2">{app.message}</p>}
                <div className="flex gap-2">
                  <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={() => handleAcceptApplication(app)} disabled={acceptApplicationToDeal.isPending || updateAppStatus.isPending}>
                    <CheckCircle2 className="mr-1 h-3 w-3" />Accept & Create Deal
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRejectApplication(app.id)} disabled={acceptApplicationToDeal.isPending || updateAppStatus.isPending}>
                    <XCircle className="mr-1 h-3 w-3" />Reject
                  </Button>
                </div>
              </div>
            ))}
            {pendingApps.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pending applications</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Deal Dialog */}
      <Dialog open={!!cancelDeal} onOpenChange={open => { if (!open) { setCancelDeal(null); setCancelReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Deal</DialogTitle>
            <DialogDescription>Close this deal and optionally record why it is ending.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel this deal? This action will be logged and the other party will be notified.
            </p>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Why are you cancelling this deal?"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setCancelDeal(null); setCancelReason(''); }}>
                Keep Deal
              </Button>
              <Button variant="destructive" onClick={handleCancelDeal} disabled={cancelling || !cancelReason.trim()}>
                {cancelling ? 'Cancelling...' : 'Cancel Deal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Deal Dialog */}
      <Dialog open={!!disputeDeal} onOpenChange={open => { if (!open) { setDisputeDeal(null); setDisputeReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dispute Deal</DialogTitle>
            <DialogDescription>Flag the deal for review and notify the other side that there is an issue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Raise a dispute for this deal. The other party and platform admins will be notified.
            </p>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                placeholder="Describe the issue with this deal..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setDisputeDeal(null); setDisputeReason(''); }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDisputeDeal} disabled={disputing || !disputeReason.trim()}>
                {disputing ? 'Submitting...' : 'Submit Dispute'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract Builder */}
      {contractDeal && (
        <ContractBuilder
          open={!!contractDeal}
          onOpenChange={open => { if (!open) setContractDeal(null); }}
          dealId={contractDeal.id}
          dealType={contractDeal.deal_type}
          dealValue={Number(contractDeal.value)}
        />
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewDeal} onOpenChange={open => { if (!open) { setReviewDeal(null); setReviewRating(0); setReviewComment(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>Capture feedback once the deal is finished so trust signals stay useful.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Rate your experience with {user?.role === 'streamer' ? reviewDeal?.organizations?.name : reviewDeal?.profiles?.display_name}.
            </p>
            <div className="flex justify-center">
              <StarRating rating={reviewRating} onChange={setReviewRating} />
            </div>
            <div className="space-y-2">
              <Label>Comment (optional)</Label>
              <Textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="How was your experience?"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setReviewDeal(null); setReviewRating(0); setReviewComment(''); }}>
                Cancel
              </Button>
              <Button
                className="bg-gradient-brand hover:opacity-90"
                disabled={reviewRating === 0 || createReview.isPending}
                onClick={async () => {
                  if (!reviewDeal) return;
                  const revieweeId = user?.role === 'streamer' 
                    ? reviewDeal.organization_id 
                    : reviewDeal.streamer_id;
                  try {
                    await createReview.mutateAsync({
                      dealId: reviewDeal.id,
                      revieweeId,
                      rating: reviewRating,
                      comment: reviewComment,
                    });
                    toast({ title: 'Review submitted' });
                    setReviewDeal(null);
                    setReviewRating(0);
                    setReviewComment('');
                  } catch (err: unknown) {
                    toast({ title: 'Error', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
                  }
                }}
              >
                {createReview.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DealsPage;

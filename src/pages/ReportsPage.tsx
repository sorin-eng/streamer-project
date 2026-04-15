import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/StatCard';
import { useCommissions, useReportUploads, useDeals, useStreamerProfile } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, BarChart3, Upload, Calculator, Wallet, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { FileUpload } from '@/components/FileUpload';
import type { DealWithRelations, CommissionWithDeal } from '@/types/supabase-joins';
import { uploadPerformanceReport, computeCommissions as runCommissionCompute } from '@/core/services/platformService';
import { SearchBar } from '@/components/SearchPagination';
import { BreakdownPieChart, DashboardChartCard, TrendBarChart } from '@/components/dashboard/DashboardCharts';
import { buildCommissionStatusBreakdown, sumCommissionByMonth } from '@/components/dashboard/dashboardAnalytics';
import { advancePayoutLedgerStatus, buildPayoutLedgerRows, getPayoutStageCounts, type PayoutStage } from '@/lib/mockPayoutLedger';

const statusChipOptions = ['all', 'pending', 'approved', 'paid', 'rejected'] as const;
type StatusFilter = (typeof statusChipOptions)[number];

const ReportsPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: commissions } = useCommissions();
  const { data: uploads } = useReportUploads();
  const { data: deals } = useDeals();
  const { data: streamerProfile } = useStreamerProfile(user?.role === 'streamer' ? user?.id : undefined);
  const isCasinoManager = user?.role === 'casino_manager';
  const [uploadOpen, setUploadOpen] = useState(false);
  const [computeOpen, setComputeOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState('');
  const [computeDeal, setComputeDeal] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [csvData, setCsvData] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [computing, setComputing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [payoutVersion, setPayoutVersion] = useState(0);
  const { toast } = useToast();
  const qc = useQueryClient();

  const focusedDealId = searchParams.get('deal');

  const totalAmount = commissions?.reduce((s, c) => s + Number(c.amount), 0) || 0;
  const pendingCount = commissions?.filter(c => c.status === 'pending').length || 0;
  const approvedCount = commissions?.filter(c => c.status === 'approved').length || 0;
  const paidCount = commissions?.filter(c => c.status === 'paid').length || 0;
  const rejectedCount = commissions?.filter(c => c.status === 'rejected').length || 0;
  const needsAttentionCount = pendingCount + rejectedCount;
  const walletAddress = typeof (streamerProfile as { wallet_address?: string | null } | undefined)?.wallet_address === 'string'
    ? ((streamerProfile as { wallet_address?: string | null }).wallet_address || '').trim()
    : '';

  const filteredRows = useMemo(() => {
    const rows = (commissions || [])
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter((c) => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
          (c.deals?.campaigns?.title || 'Direct Deal').toLowerCase().includes(s) ||
          c.status.toLowerCase().includes(s)
        );
      });

    return rows;
  }, [commissions, searchTerm, statusFilter]);

  const statusChipCounts: Array<{ label: string; key: StatusFilter; count: number }> = [
    { key: 'all', label: 'All', count: commissions?.length || 0 },
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'approved', label: 'Approved', count: approvedCount },
    { key: 'paid', label: 'Paid', count: paidCount },
    { key: 'rejected', label: 'Rejected', count: rejectedCount },
  ];

  const monthlyCommissionData = useMemo(() => sumCommissionByMonth((commissions || []) as CommissionWithDeal[]), [commissions]);
  const commissionBreakdown = useMemo(() => buildCommissionStatusBreakdown((commissions || []) as CommissionWithDeal[]), [commissions]);
  const payoutRows = useMemo(() => buildPayoutLedgerRows({
    commissions: (commissions || []) as CommissionWithDeal[],
    uploads: (uploads || []) as Array<{ id: string; file_name: string; created_at: string }>,
    walletAddress,
    isStreamerView: user?.role === 'streamer',
  }), [commissions, uploads, walletAddress, user?.role, payoutVersion]);
  const payoutCounts = useMemo(() => getPayoutStageCounts(payoutRows), [payoutRows]);
  const payoutNeedsAttentionCount = payoutRows.filter((row) => row.flags.length > 0).length;
  const outstandingPayoutAmount = payoutRows.filter((row) => row.status !== 'paid').reduce((sum, row) => sum + row.amount, 0);
  const paidPayoutAmount = payoutRows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + row.amount, 0);
  const filteredPayoutRows = useMemo(() => {
    return payoutRows.filter((row) => {
      if (focusedDealId && row.dealId !== focusedDealId) return false;
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        row.campaignTitle.toLowerCase().includes(s) ||
        row.status.toLowerCase().includes(s) ||
        row.commissionStatus.toLowerCase().includes(s) ||
        row.flags.some((flag) => flag.toLowerCase().includes(s))
      );
    });
  }, [focusedDealId, payoutRows, searchTerm]);
  const reportReadyDeals = useMemo(() => {
    return (deals || [])
      .filter((deal: DealWithRelations) => deal.state === 'active' || deal.state === 'completed')
      .sort((a, b) => Number(a.state === 'active') === Number(b.state === 'active') ? 0 : a.state === 'active' ? -1 : 1);
  }, [deals]);
  const reportReadyDealIds = useMemo(() => new Set(reportReadyDeals.map((deal) => deal.id)), [reportReadyDeals]);

  useEffect(() => {
    if (uploadOpen && !selectedDeal && reportReadyDeals.length) {
      setSelectedDeal(focusedDealId && reportReadyDealIds.has(focusedDealId) ? focusedDealId : reportReadyDeals[0]!.id);
    }
  }, [uploadOpen, selectedDeal, reportReadyDeals, focusedDealId, reportReadyDealIds]);

  useEffect(() => {
    if (computeOpen && !computeDeal && reportReadyDeals.length) {
      setComputeDeal(focusedDealId && reportReadyDealIds.has(focusedDealId) ? focusedDealId : reportReadyDeals[0]!.id);
    }
  }, [computeOpen, computeDeal, reportReadyDeals, focusedDealId, reportReadyDealIds]);

  useEffect(() => {
    if (!focusedDealId || !reportReadyDealIds.has(focusedDealId)) return;
    if (!selectedDeal) setSelectedDeal(focusedDealId);
    if (!computeDeal) setComputeDeal(focusedDealId);
  }, [focusedDealId, selectedDeal, computeDeal, reportReadyDealIds]);

  const handleAdvancePayout = (commissionId: string, nextStatus: PayoutStage) => {
    advancePayoutLedgerStatus(commissionId, nextStatus);
    setPayoutVersion((value) => value + 1);
    toast({ title: `Payout ${nextStatus}` });
  };

  const handleExportCsv = () => {
    if (!filteredRows.length) {
      toast({ title: 'Nothing to export', description: 'Try loosening your filters first.', variant: 'destructive' });
      return;
    }

    const headers = ['campaign', 'amount', 'status', 'period_start', 'created_at'];
    const rows = filteredRows.map((row) => [
      row.deals?.campaigns?.title || 'Direct Deal',
      Number(row.amount || 0).toFixed(2),
      row.status,
      row.period_start || '',
      row.created_at,
    ]);

    const csv = [headers, ...rows]
      .map((cols) => cols.map((col) => `"${String(col).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commissions-${statusFilter}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (file: File) => {
    setCsvFile(file);
    const text = await file.text();
    setCsvData(text);
  };

  const handleUpload = async () => {
    if (!selectedDeal || !csvData.trim()) return;
    setUploading(true);
    try {
      const result = await uploadPerformanceReport({
        organizationId: user?.organizationId,
        dealId: selectedDeal,
        csvData,
        csvFile,
      });
      toast({ title: 'Report uploaded', description: `${result.events_count} events processed` });
      setUploadOpen(false);
      setCsvData('');
      setCsvFile(null);
      qc.invalidateQueries({ queryKey: ['report_uploads'] });
      qc.invalidateQueries({ queryKey: ['commissions'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Upload failed', description: message, variant: 'destructive' });
    }
    setUploading(false);
  };

  const handleCompute = async () => {
    if (!computeDeal) return;
    if (periodStart && periodEnd && periodStart > periodEnd) {
      toast({ title: 'Invalid period range', description: 'Period start must be on or before period end.', variant: 'destructive' });
      return;
    }
    setComputing(true);
    try {
      const result = await runCommissionCompute({
        dealId: computeDeal,
        periodStart,
        periodEnd,
      });
      toast({
        title: 'Commissions computed',
        description: `${result.commissions.length} commission(s) created from ${result.events_processed} events`,
      });
      setComputeOpen(false);
      qc.invalidateQueries({ queryKey: ['commissions'] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Computation failed', description: message, variant: 'destructive' });
    }
    setComputing(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{user?.role === 'streamer' ? 'Earnings' : 'Reports'}</h1>
            <p className="text-sm text-muted-foreground">
              {isCasinoManager ? 'Upload delivery proof, compute commissions, and close the loop on active deals.' : 'Track report outcomes, commissions, and payout progress in one place.'}
            </p>
          </div>
          {isCasinoManager && (
            <div className="flex gap-2">
              <Button className="bg-gradient-brand hover:opacity-90" onClick={() => setUploadOpen(true)} disabled={reportReadyDeals.length === 0}>
                <Upload className="mr-2 h-4 w-4" />Upload Report
              </Button>
              <Button variant="outline" onClick={() => setComputeOpen(true)} disabled={reportReadyDeals.length === 0}>
                <Calculator className="mr-2 h-4 w-4" />Compute Commissions
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4 shadow-card space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Final workflow step</p>
          <p className="text-sm text-muted-foreground">Reports prove delivery, commissions turn that proof into payout, and this page should make that status obvious fast.</p>
        </div>

        {reportReadyDeals.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
            <div>
              <h2 className="font-semibold">{isCasinoManager ? 'Deals ready for reporting' : 'Tracked partnerships'}</h2>
              <p className="text-sm text-muted-foreground">
                {isCasinoManager ? 'Use these shortcuts to move active work into proof, commissions, and payout.' : 'Keep an eye on the deals that should turn into report-backed earnings.'}
              </p>
            </div>
            <div className="space-y-3">
              {reportReadyDeals.map((deal: DealWithRelations) => (
                <div
                  key={deal.id}
                  className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${focusedDealId === deal.id ? 'border-primary bg-primary/[0.04]' : 'border-border'}`}
                >
                  <div>
                    <p className="text-sm font-medium">{deal.campaigns?.title || 'Direct Deal'}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.role === 'streamer' ? deal.organizations?.name : deal.profiles?.display_name} · ${Number(deal.value).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={deal.state} />
                    <Link to={`/contracts?deal=${deal.id}`}>
                      <Button size="sm" variant="outline">Contract</Button>
                    </Link>
                    <Link to={`/messages?deal=${deal.id}`}>
                      <Button size="sm" variant="outline">Messages</Button>
                    </Link>
                    {isCasinoManager && (
                      <>
                        <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={() => { setSelectedDeal(deal.id); setUploadOpen(true); }}>
                          Upload Report
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setComputeDeal(deal.id); setComputeOpen(true); }}>
                          Compute
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
            No deals are ready for reporting yet. Finish signatures first, then active deals will show up here.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Commissions" value={`$${totalAmount.toLocaleString()}`} icon={<DollarSign className="h-5 w-5" />} />
          <StatCard label="Pending" value={pendingCount} icon={<BarChart3 className="h-5 w-5" />} />
          <StatCard label="Approved" value={approvedCount} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Reports Uploaded" value={uploads?.length || 0} icon={<Upload className="h-5 w-5" />} />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-semibold">Payout ledger</h2>
              <p className="text-sm text-muted-foreground">
                {isCasinoManager
                  ? 'Approve, send, and close payouts without losing the report and commission context.'
                  : 'See what is expected, approved, in flight, or paid, without asking around in chat.'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground lg:max-w-sm">
              {isCasinoManager ? (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Ops note</p>
                  <p>Before marking anything paid, confirm the streamer payout destination is on file in their profile/settings.</p>
                </div>
              ) : walletAddress ? (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">Payout destination on file</p>
                  <p className="break-all">{walletAddress}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground">
                    <Wallet className="h-4 w-4 text-warning" />
                    <p className="font-medium">Wallet setup missing</p>
                  </div>
                  <p>Add your payout wallet in Settings so approved commissions do not stall.</p>
                  <Link to="/settings">
                    <Button size="sm" variant="outline">Open Settings</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardChartCard title="Expected" subtitle="Awaiting payout approval">
              <p className="text-3xl font-bold">{payoutCounts.expected}</p>
            </DashboardChartCard>
            <DashboardChartCard title="Approved" subtitle="Cleared to send">
              <p className="text-3xl font-bold">{payoutCounts.approved}</p>
            </DashboardChartCard>
            <DashboardChartCard title="Pending" subtitle="Sent or processing">
              <p className="text-3xl font-bold">{payoutCounts.pending}</p>
            </DashboardChartCard>
            <DashboardChartCard title="Paid" subtitle={`$${paidPayoutAmount.toLocaleString()} settled`}>
              <p className="text-3xl font-bold">{payoutCounts.paid}</p>
            </DashboardChartCard>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Outstanding</p>
              <p className="text-lg font-semibold">${outstandingPayoutAmount.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Amount not fully marked paid yet.</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Needs attention</p>
              <p className="text-lg font-semibold">{payoutNeedsAttentionCount}</p>
              <p className="text-sm text-muted-foreground">Overdue, missing-approval, or payout-setup flags.</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Linked reports</p>
              <p className="text-lg font-semibold">{uploads?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Upload history now has a direct payout home instead of floating loose.</p>
            </div>
          </div>

          {filteredPayoutRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No payout rows yet. Once commissions are created, the ledger will track payout status here.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayoutRows.map((row) => (
                <div key={row.commissionId} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{row.campaignTitle}</p>
                        <StatusBadge status={row.status} />
                        <StatusBadge status={row.commissionStatus} />
                      </div>
                      <p className="text-sm text-muted-foreground">${row.amount.toLocaleString()} tied to commission visibility and payout execution.</p>
                    </div>
                    {isCasinoManager && (
                      <div className="flex flex-wrap gap-2">
                        {row.status === 'expected' && (
                          <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={() => handleAdvancePayout(row.commissionId, 'approved')}>
                            Approve payout
                          </Button>
                        )}
                        {row.status === 'approved' && (
                          <Button size="sm" variant="outline" onClick={() => handleAdvancePayout(row.commissionId, 'pending')}>
                            Mark payout pending
                          </Button>
                        )}
                        {row.status === 'pending' && (
                          <Button size="sm" className="bg-gradient-brand hover:opacity-90" onClick={() => handleAdvancePayout(row.commissionId, 'paid')}>
                            Mark payout paid
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 text-sm text-muted-foreground">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em]">Source report</p>
                      <p>{row.sourceUploadName || 'No linked upload yet'}</p>
                      <p>{row.sourceUploadAt ? new Date(row.sourceUploadAt).toLocaleDateString() : 'Missing upload timestamp'}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 text-sm text-muted-foreground">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em]">Linked commission</p>
                      <p>Created {new Date(row.commissionCreatedAt).toLocaleDateString()}</p>
                      <p>Period: {row.periodStart || '—'}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 text-sm text-muted-foreground">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em]">Status dates</p>
                      <p>Expected: {new Date(row.expectedAt).toLocaleDateString()}</p>
                      <p>Approved: {row.approvedAt ? new Date(row.approvedAt).toLocaleDateString() : '—'}</p>
                      <p>Paid: {row.paidAt ? new Date(row.paidAt).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>

                  {row.flags.length > 0 && (
                    <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Payout flags
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-4">
                        {row.flags.map((flag) => <li key={flag}>{flag}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardChartCard
            title={isCasinoManager ? 'Commission creation trend' : 'Earnings trend'}
            subtitle={isCasinoManager ? 'See payout volume being generated over time' : 'Track what is actually landing month to month'}
          >
            <TrendBarChart data={monthlyCommissionData} emptyLabel="No commission trend yet" />
          </DashboardChartCard>

          <DashboardChartCard
            title="Status mix"
            subtitle="Spot what is approved versus stuck"
          >
            <BreakdownPieChart data={commissionBreakdown} emptyLabel="No commission data yet" />
          </DashboardChartCard>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Commission status</h2>
              <p className="text-xs text-muted-foreground">Needs attention: {needsAttentionCount} commission{needsAttentionCount === 1 ? '' : 's'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>Export filtered CSV</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusChipCounts.map((chip) => (
              <Button
                key={chip.key}
                size="sm"
                variant={statusFilter === chip.key ? 'default' : 'outline'}
                onClick={() => setStatusFilter(chip.key)}
              >
                {chip.label} ({chip.count})
              </Button>
            ))}
          </div>
        </div>

        <SearchBar
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
          }}
          placeholder="Search by campaign or status..."
        />

        {uploads && uploads.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold mb-4">Upload History</h2>
            <div className="space-y-3">
              {uploads.map(u => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{u.file_name}</p>
                    <p className="text-xs text-muted-foreground">{u.row_count} rows · {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {(!filteredRows || filteredRows.length === 0) ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
            {statusFilter === 'all' && !searchTerm
              ? (isCasinoManager
                  ? 'No commissions yet. Upload reports and compute commissions to populate this area.'
                  : 'Once deals are settled, payouts will appear here.')
              : 'No commissions match your filters.'}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="font-semibold mb-4">Commission History</h2>
            <div className="sm:hidden space-y-3">
              {filteredRows.map((c: CommissionWithDeal) => (
                <div key={c.id} className="rounded-lg border border-border p-3 space-y-2">
                  <p className="text-sm font-medium">{c.deals?.campaigns?.title || 'Direct Deal'}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">${Number(c.amount).toLocaleString()}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">Period: {c.period_start || '—'}</p>
                  <p className="text-xs text-muted-foreground">Created: {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Campaign</th>
                    <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    <th className="pb-3 font-medium text-muted-foreground">Period</th>
                    <th className="pb-3 font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRows.map((c: CommissionWithDeal) => (
                    <tr key={c.id}>
                      <td className="py-3 font-medium">{c.deals?.campaigns?.title || 'Direct Deal'}</td>
                      <td className="py-3">${Number(c.amount).toLocaleString()}</td>
                      <td className="py-3"><StatusBadge status={c.status} /></td>
                      <td className="py-3 text-muted-foreground">{c.period_start || '—'}</td>
                      <td className="py-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Performance Report</DialogTitle>
            <DialogDescription>Attach or paste campaign performance data for a deal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Deal</Label>
              <Select value={selectedDeal} onValueChange={setSelectedDeal}>
                <SelectTrigger><SelectValue placeholder="Choose a deal..." /></SelectTrigger>
                <SelectContent>
                  {reportReadyDeals.map((d: DealWithRelations) => (
                    <SelectItem key={d.id} value={d.id}>{d.campaigns?.title || 'Direct Deal'} — ${Number(d.value).toLocaleString()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Upload CSV File</Label>
              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".csv"
                maxSizeMB={10}
                label="Drop your CSV file here or click to browse"
                selectedFile={csvFile}
                onClear={() => { setCsvFile(null); setCsvData(''); }}
              />
            </div>
            {!csvFile && (
              <div className="space-y-2">
                <Label>Or Paste CSV Data</Label>
                <p className="text-xs text-muted-foreground">Format: event_type, event_date, amount, player_id (one per line)</p>
                <Textarea
                  value={csvData}
                  onChange={e => setCsvData(e.target.value)}
                  placeholder={`ftd,2026-02-15,100,player_001\ndeposit,2026-02-16,50,player_002`}
                  rows={4}
                  className="font-mono text-xs"
                />
              </div>
            )}
            <Button
              className="w-full bg-gradient-brand hover:opacity-90"
              onClick={handleUpload}
              disabled={uploading || !selectedDeal || !csvData.trim() || reportReadyDeals.length === 0}
            >
              {uploading ? 'Processing...' : 'Upload & Process'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={computeOpen} onOpenChange={setComputeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compute Commissions</DialogTitle>
            <DialogDescription>Turn uploaded conversion rows into commission records for the selected deal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Deal</Label>
              <Select value={computeDeal} onValueChange={setComputeDeal}>
                <SelectTrigger><SelectValue placeholder="Choose a deal..." /></SelectTrigger>
                <SelectContent>
                  {reportReadyDeals.map((d: DealWithRelations) => (
                    <SelectItem key={d.id} value={d.id}>{d.campaigns?.title || 'Direct Deal'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="compute-period-start">Period Start</Label>
                <Input id="compute-period-start" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compute-period-end">Period End</Label>
                <Input id="compute-period-end" type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Leave dates empty to compute for all conversion events.</p>
            <Button
              className="w-full bg-gradient-brand hover:opacity-90"
              onClick={handleCompute}
              disabled={computing || !computeDeal || reportReadyDeals.length === 0 || (Boolean(periodStart) && Boolean(periodEnd) && periodStart > periodEnd)}
            >
              {computing ? 'Computing...' : 'Compute Now'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ReportsPage;

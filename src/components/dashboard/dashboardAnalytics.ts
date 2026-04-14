import type { CampaignWithOrg, CommissionWithDeal, DealWithRelations } from '@/types/supabase-joins';
import type { TrendPoint, BreakdownPoint } from './DashboardCharts';

function monthKey(input?: string | null) {
  if (!input) return 'Unknown';
  const date = new Date(input);
  return date.toLocaleDateString(undefined, { month: 'short' });
}

export function groupTrendByMonth<T>(items: T[], getDate: (item: T) => string | null | undefined, getValue: (item: T) => number, fallbackMonths = 6): TrendPoint[] {
  const now = new Date();
  const order: string[] = [];
  const totals = new Map<string, number>();

  for (let i = fallbackMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString(undefined, { month: 'short' });
    order.push(label);
    totals.set(label, 0);
  }

  items.forEach((item) => {
    const label = monthKey(getDate(item));
    if (!totals.has(label)) {
      order.push(label);
      totals.set(label, 0);
    }
    totals.set(label, (totals.get(label) || 0) + getValue(item));
  });

  return order.map((label) => ({ label, value: totals.get(label) || 0 }));
}

export function buildDealStateBreakdown(deals: DealWithRelations[]): BreakdownPoint[] {
  const labels = ['inquiry', 'negotiation', 'contract_pending', 'active', 'completed', 'cancelled', 'disputed'] as const;
  return labels.map((label) => ({
    label: label.replace('_', ' '),
    value: deals.filter((deal) => deal.state === label).length,
  }));
}

export function buildCampaignStatusBreakdown(campaigns: CampaignWithOrg[]): BreakdownPoint[] {
  const labels = ['open', 'in_progress', 'paused', 'completed', 'cancelled'] as const;
  return labels.map((label) => ({
    label: label.replace('_', ' '),
    value: campaigns.filter((campaign) => campaign.status === label).length,
  }));
}

export function buildCommissionStatusBreakdown(commissions: CommissionWithDeal[]): BreakdownPoint[] {
  const labels = ['pending', 'approved', 'paid', 'rejected'] as const;
  return labels.map((label) => ({
    label,
    value: commissions.filter((commission) => commission.status === label).length,
  }));
}

export function sumDealValueByMonth(deals: DealWithRelations[]): TrendPoint[] {
  return groupTrendByMonth(deals, (deal) => deal.created_at, (deal) => Number(deal.value || 0));
}

export function countDealsByMonth(deals: DealWithRelations[]): TrendPoint[] {
  return groupTrendByMonth(deals, (deal) => deal.created_at, () => 1);
}

export function sumCampaignBudgetByMonth(campaigns: CampaignWithOrg[]): TrendPoint[] {
  return groupTrendByMonth(campaigns, (campaign) => campaign.created_at, (campaign) => Number(campaign.budget || 0));
}

export function sumCommissionByMonth(commissions: CommissionWithDeal[]): TrendPoint[] {
  return groupTrendByMonth(commissions, (commission) => commission.created_at, (commission) => Number(commission.amount || 0));
}

export function topOpenOpportunities(campaigns: CampaignWithOrg[]) {
  return [...campaigns]
    .filter((campaign) => campaign.status === 'open')
    .sort((a, b) => Number(b.budget || 0) - Number(a.budget || 0))
    .slice(0, 3);
}

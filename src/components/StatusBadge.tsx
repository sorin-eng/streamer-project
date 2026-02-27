import { cn } from '@/lib/utils';
import { CampaignStatus, DealStatus, ApplicationStatus, DealType } from '@/types';

const statusStyles: Record<string, string> = {
  open: 'bg-success/10 text-success border-success/20',
  draft: 'bg-muted text-muted-foreground border-border',
  in_progress: 'bg-info/10 text-info border-info/20',
  completed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  negotiation: 'bg-warning/10 text-warning border-warning/20',
  contract_pending: 'bg-info/10 text-info border-info/20',
  active: 'bg-success/10 text-success border-success/20',
  disputed: 'bg-destructive/10 text-destructive border-destructive/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  shortlisted: 'bg-info/10 text-info border-info/20',
  accepted: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const dealTypeLabels: Record<DealType, string> = {
  revshare: 'Rev Share',
  cpa: 'CPA',
  hybrid: 'Hybrid',
  flat_fee: 'Flat Fee',
};

interface StatusBadgeProps {
  status: CampaignStatus | DealStatus | ApplicationStatus | DealType;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const label = dealTypeLabels[status as DealType] || status.replace(/_/g, ' ');
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
      statusStyles[status] || 'bg-muted text-muted-foreground border-border',
      className,
    )}>
      {label}
    </span>
  );
};

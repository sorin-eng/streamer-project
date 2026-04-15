import { cn } from '@/lib/utils';

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
  approved: 'bg-success/10 text-success border-success/20',
  withdrawn: 'bg-muted text-muted-foreground border-border',
  paused: 'bg-warning/10 text-warning border-warning/20',
  paid: 'bg-success/10 text-success border-success/20',
  processing: 'bg-info/10 text-info border-info/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  pending_signature: 'bg-warning/10 text-warning border-warning/20',
  signed: 'bg-success/10 text-success border-success/20',
  expired: 'bg-muted text-muted-foreground border-border',
  needs_revision: 'bg-warning/10 text-warning border-warning/20',
  expected: 'bg-info/10 text-info border-info/20',
};

const dealTypeLabels: Record<string, string> = {
  revshare: 'Rev Share',
  cpa: 'CPA',
  hybrid: 'Hybrid',
  flat_fee: 'Flat Fee',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const label = dealTypeLabels[status] || status.replace(/_/g, ' ');
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

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, change, trend, icon, className }) => (
  <div className={cn("rounded-xl border border-border bg-card p-5 shadow-card animate-fade-in", className)}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-card-foreground">{value}</p>
        {change && (
          <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", {
            "text-success": trend === 'up',
            "text-destructive": trend === 'down',
            "text-muted-foreground": trend === 'neutral',
          })}>
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            {trend === 'neutral' && <Minus className="h-3 w-3" />}
            {change}
          </div>
        )}
      </div>
      {icon && <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">{icon}</div>}
    </div>
  </div>
);

import { Suspense, lazy } from 'react';
import { cn } from '@/lib/utils';

export interface TrendPoint {
  label: string;
  value: number;
}

export interface BreakdownPoint {
  label: string;
  value: number;
  color?: string;
}

const LazyTrendBarChartImpl = lazy(() => import('./TrendBarChartImpl'));
const LazyTrendLineChartImpl = lazy(() => import('./TrendLineChartImpl'));
const LazyBreakdownPieChartImpl = lazy(() => import('./BreakdownPieChartImpl'));

const ChartLoader = () => (
  <div className="h-64 w-full animate-pulse rounded-lg bg-muted/50" />
);

export const DashboardChartCard: React.FC<{
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, className, children }) => (
  <div className={cn('rounded-xl border border-border bg-card p-5 shadow-card', className)}>
    <div className="mb-4">
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export const TrendBarChart: React.FC<{ data: TrendPoint[]; color?: string; emptyLabel?: string }> = ({
  data,
  color = '#7c3aed',
  emptyLabel = 'No trend data yet',
}) => {
  if (!data.length) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;

  return (
    <Suspense fallback={<ChartLoader />}>
      <LazyTrendBarChartImpl data={data} color={color} />
    </Suspense>
  );
};

export const TrendLineChart: React.FC<{ data: TrendPoint[]; color?: string; emptyLabel?: string }> = ({
  data,
  color = '#06b6d4',
  emptyLabel = 'No trend data yet',
}) => {
  if (!data.length) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;

  return (
    <Suspense fallback={<ChartLoader />}>
      <LazyTrendLineChartImpl data={data} color={color} />
    </Suspense>
  );
};

export const BreakdownPieChart: React.FC<{ data: BreakdownPoint[]; emptyLabel?: string }> = ({
  data,
  emptyLabel = 'Nothing to break down yet',
}) => {
  if (!data.length || data.every((item) => item.value === 0)) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <Suspense fallback={<ChartLoader />}>
      <LazyBreakdownPieChartImpl data={data} />
    </Suspense>
  );
};

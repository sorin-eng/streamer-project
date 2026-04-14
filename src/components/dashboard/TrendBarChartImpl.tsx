import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrendPoint } from '@/components/dashboard/DashboardCharts';

const TrendBarChartImpl: React.FC<{ data: TrendPoint[]; color: string }> = ({ data, color }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendBarChartImpl;

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { BreakdownPoint } from '@/components/dashboard/DashboardCharts';

const DEFAULT_COLORS = ['#7c3aed', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#6366f1'];

const BreakdownPieChartImpl: React.FC<{ data: BreakdownPoint[] }> = ({ data }) => {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={80} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BreakdownPieChartImpl;

import { Bar, BarChart as ReBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { DashboardAccent } from '../../dashboards/dashboardConfigs/types';
import { chartColors } from './chartUtils';

interface DashboardBarChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  accent?: DashboardAccent;
}

export function DashboardBarChart({ data, xKey, yKey, accent = 'blue' }: DashboardBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ReBarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.28)" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Bar dataKey={yKey} fill={chartColors[accent]} radius={[8, 8, 2, 2]} />
      </ReBarChart>
    </ResponsiveContainer>
  );
}

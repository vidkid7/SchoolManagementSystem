import { ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { DashboardAccent } from '../../dashboards/dashboardConfigs/types';
import { chartColors } from './chartUtils';

interface DashboardLineChartProps {
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  accent?: DashboardAccent;
}

export function DashboardLineChart({ data, xKey, yKey, accent = 'blue' }: DashboardLineChartProps) {
  const color = chartColors[accent];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ReLineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.28)" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Line type="monotone" dataKey={yKey} stroke={color} strokeWidth={3} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} />
      </ReLineChart>
    </ResponsiveContainer>
  );
}

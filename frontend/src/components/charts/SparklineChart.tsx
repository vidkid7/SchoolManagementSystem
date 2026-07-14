import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import type { DashboardAccent } from '../../dashboards/dashboardConfigs/types';
import { chartColors } from './chartUtils';

interface SparklineChartProps {
  data: Array<Record<string, unknown>>;
  yKey: string;
  accent?: DashboardAccent;
}

export function SparklineChart({ data, yKey, accent = 'blue' }: SparklineChartProps) {
  const color = chartColors[accent];

  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data}>
        <Area type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} fill={color} fillOpacity={0.12} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

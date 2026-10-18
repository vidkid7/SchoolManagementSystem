import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { categoricalColors } from './chartUtils';

interface DashboardDonutChartProps {
  data: Array<Record<string, unknown>>;
  nameKey: string;
  valueKey: string;
  ariaLabel: string;
}

export function DashboardDonutChart({ data, nameKey, valueKey, ariaLabel }: DashboardDonutChartProps) {
  return (
    <div role="img" aria-label={ariaLabel}>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={54} outerRadius={82} paddingAngle={4} dataKey={valueKey} nameKey={nameKey}>
              {data.map((_, index) => (
                <Cell key={`donut-${index}`} fill={categoricalColors[index % categoricalColors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

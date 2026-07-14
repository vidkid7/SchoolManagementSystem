import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add,
  ArrowForward,
  AutoGraph,
  Bolt,
  CalendarMonth,
  CheckCircle,
  ErrorOutline,
  Insights,
  Inbox,
  Notifications,
  Search,
  TaskAlt,
  TrendingUp,
} from '@mui/icons-material';
import type React from 'react';
import { useMemo, useState } from 'react';
import type {
  DashboardAccent,
  DashboardActionConfig,
  DashboardTableColumn,
} from '../../dashboards/dashboardConfigs/types';
import { accentColor } from '../../dashboards/dashboardConfigs/shared';
import { DashboardBarChart } from '../charts/BarChart';
import { DashboardDonutChart } from '../charts/DonutChart';
import { DashboardLineChart } from '../charts/LineChart';
import { SparklineChart } from '../charts/SparklineChart';
import { categoricalColors } from '../charts/chartUtils';
import { getDashboardIcon } from './icons';

export function formatDashboardValue(value: unknown, format?: 'number' | 'currency' | 'percent' | 'date') {
  if (format === 'date') {
    if (!value) return '-';
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }

  const numberValue = typeof value === 'number' ? value : Number(value ?? 0);
  if (format === 'currency') return `Rs ${numberValue.toLocaleString()}`;
  if (format === 'percent') return `${numberValue.toLocaleString()}%`;
  if (format === 'number') return numberValue.toLocaleString();
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
}

function cardSx(accent: DashboardAccent = 'blue') {
  const color = accentColor[accent];
  return {
    height: '100%',
    borderRadius: 1.5,
    border: (theme: any) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.22)' : 'rgba(226,232,240,0.88)'}`,
    background: (theme: any) => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
    boxShadow: (theme: any) => theme.palette.mode === 'dark' ? '0 18px 44px rgba(0,0,0,0.32)' : '0 10px 28px rgba(15,23,42,0.055)',
    overflow: 'hidden',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      height: 3,
      background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.14)})`,
    },
    '&:hover': {
      borderColor: alpha(color, 0.25),
      boxShadow: (theme: any) => theme.palette.mode === 'dark' ? '0 22px 52px rgba(0,0,0,0.42)' : '0 16px 36px rgba(15,23,42,0.08)',
    },
  };
}

function numberFromValue(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value ?? NaN);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function compactNumber(value: number) {
  if (Math.abs(value) >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (Math.abs(value) >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
}

function MiniTrendBars({ color }: { color: string }) {
  const bars = [32, 48, 38, 64, 52, 72, 58];

  return (
    <Stack direction="row" spacing={0.35} alignItems="flex-end" sx={{ height: 24, mt: 1.25 }}>
      {bars.map((height, index) => (
        <Box
          key={index}
          sx={{
            width: 7,
            height: `${height}%`,
            borderRadius: '6px 6px 2px 2px',
            bgcolor: alpha(color, index === bars.length - 1 ? 0.9 : 0.2 + index * 0.07),
          }}
        />
      ))}
    </Stack>
  );
}

export interface DashboardHeroMetric {
  id: string;
  label: string;
  value: string;
  helper?: string;
  accent: DashboardAccent;
  icon: React.ReactNode;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
      justifyContent="space-between"
      spacing={1.5}
      sx={{ mb: 1.25 }}
    >
      <Box>
        {eyebrow && (
          <Typography variant="caption" sx={{ color: 'var(--sms-primary, #2563eb)', fontWeight: 900, letterSpacing: 0, textTransform: 'none' }}>
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h6" sx={{ color: 'var(--sms-text, #0f172a)', fontWeight: 900, lineHeight: 1.15, fontSize: '1rem' }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: 'var(--sms-muted, #64748b)', mt: 0.25 }}>
            {description}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}

export function DashboardHero({
  eyebrow,
  title,
  description,
  userName,
  role,
  metrics,
  onRefresh,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  userName: string;
  role?: string;
  metrics: DashboardHeroMetric[];
  onRefresh: () => void;
}) {
  const topMetrics = metrics.slice(0, 4);

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2.5,
        p: { xs: 2, md: 3 },
        borderRadius: 1.5,
        color: '#fff',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid rgba(148,163,184,0.22)',
        bgcolor: '#07111f',
        backgroundColor: '#07111f',
        backgroundImage:
          'linear-gradient(135deg, #07111f 0%, #0b1f3a 48%, #102a4b 100%)',
        boxShadow: '0 28px 70px rgba(2,6,23,0.22)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(37,99,235,0.16) 0%, rgba(124,58,237,0.1) 42%, rgba(22,163,74,0.08) 100%)',
          opacity: 0.65,
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={2.5} alignItems="stretch">
          <Grid item xs={12} lg={7}>
            <Stack spacing={2.4} sx={{ height: '100%', justifyContent: 'space-between' }}>
              <Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                  {eyebrow && (
                    <Chip
                      label={eyebrow}
                      size="small"
                  sx={{
                    bgcolor: 'rgba(15,23,42,0.42)',
                    color: '#eff6ff',
                    border: '1px solid rgba(191,219,254,0.34)',
                    fontWeight: 900,
                    borderRadius: 1,
                  }}
                    />
                  )}
                  <Chip
                    icon={<CheckCircle sx={{ color: '#86efac !important', fontSize: 16 }} />}
                    label="Live operations"
                    size="small"
                    sx={{
                    bgcolor: 'rgba(22,163,74,0.14)',
                      color: '#f0fdf4',
                      border: '1px solid rgba(134,239,172,0.24)',
                      fontWeight: 900,
                      borderRadius: 1,
                    }}
                  />
                </Stack>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    letterSpacing: 0,
                    lineHeight: 1.05,
                    fontSize: { xs: '1.9rem', sm: '2.35rem', md: '3rem' },
                    maxWidth: 780,
                    color: '#f8fafc',
                  }}
                >
                  {title}
                </Typography>
                {description && (
                  <Typography sx={{ mt: 1.15, color: '#dbeafe', fontSize: { xs: '0.96rem', md: '1.02rem' }, maxWidth: 720 }}>
                    {description}
                  </Typography>
                )}
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Paper
                  elevation={0}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    py: 1,
                    px: 1.25,
                    borderRadius: 1.25,
                    bgcolor: 'rgba(15,23,42,0.38)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    color: '#fff',
                    minWidth: { xs: '100%', sm: 260 },
                  }}
                >
                  <UserAvatar name={userName} role={role} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>{userName}</Typography>
                    <Typography variant="caption" sx={{ color: '#cbd5e1', textTransform: 'capitalize' }}>
                      {(role || 'role').replace(/_/g, ' ')}
                    </Typography>
                  </Box>
                </Paper>
                <Button
                  onClick={onRefresh}
                  startIcon={<Bolt />}
                  variant="contained"
                  sx={{
                    borderRadius: 1.25,
                    px: 2,
                    py: 1.05,
                    bgcolor: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 900,
                    textTransform: 'none',
                    boxShadow: '0 16px 36px rgba(15,23,42,0.22)',
                    '&:hover': { bgcolor: '#eff6ff' },
                  }}
                >
                  Refresh Pulse
                </Button>
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'rgba(15,23,42,0.34)',
                border: '1px solid rgba(255,255,255,0.16)',
                backdropFilter: 'blur(14px)',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
                <Box>
                  <Typography sx={{ color: '#ffffff', fontWeight: 900 }}>Executive Snapshot</Typography>
                  <Typography variant="caption" sx={{ color: '#bfdbfe' }}>Key metrics from active APIs</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(96,165,250,0.18)', color: '#bfdbfe', borderRadius: 1.25 }}>
                  <AutoGraph />
                </Avatar>
              </Stack>
              <Grid container spacing={1.1}>
                {topMetrics.map((metric) => {
                  const color = accentColor[metric.accent];
                  return (
                    <Grid item xs={12} sm={6} key={metric.id}>
                      <Box
                        sx={{
                          p: 1.35,
                          minHeight: 118,
                          borderRadius: 1.25,
                          bgcolor: 'rgba(15,23,42,0.34)',
                          border: `1px solid ${alpha(color, 0.34)}`,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Box sx={{ color, display: 'grid', placeItems: 'center' }}>{metric.icon}</Box>
                          <TrendingUp sx={{ color: '#94a3b8', fontSize: 18 }} />
                        </Stack>
                        <Typography sx={{ color: '#ffffff', fontWeight: 900, fontSize: '1.45rem', lineHeight: 1.05 }}>
                          {metric.value}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#dbeafe', display: 'block', mt: 0.35, fontWeight: 700 }}>
                          {metric.label}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}

export function UserAvatar({ name, role }: { name?: string; role?: string }) {
  const initials = (name || role || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <Avatar sx={{ bgcolor: '#2563eb', color: '#fff', fontWeight: 800, boxShadow: '0 8px 22px rgba(37,99,235,0.28)' }}>
      {initials || 'U'}
    </Avatar>
  );
}

export function StatusBadge({ status }: { status: unknown }) {
  const raw = String(status ?? 'unknown');
  const normalized = raw.toLowerCase();
  const color =
    normalized.includes('active') || normalized.includes('paid') || normalized.includes('complete') || normalized === 'true'
      ? 'success'
      : normalized.includes('pending') || normalized.includes('medium')
        ? 'warning'
        : normalized.includes('overdue') || normalized.includes('failed') || normalized.includes('inactive') || normalized === 'false'
          ? 'error'
          : 'info';

  return <Chip label={normalized === 'true' ? 'Active' : normalized === 'false' ? 'Inactive' : raw.replace(/_/g, ' ')} color={color} size="small" sx={{ fontWeight: 700, borderRadius: 1 }} />;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 },
        mb: 3,
        borderRadius: 2,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fbff 58%, #eef4ff 100%)',
        border: '1px solid rgba(203,213,225,0.82)',
        boxShadow: '0 18px 50px rgba(15,23,42,0.06)',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
        <Box sx={{ maxWidth: 780 }}>
          {eyebrow && (
            <Typography variant="overline" sx={{ color: '#2563eb', fontWeight: 900, letterSpacing: '0.08em' }}>
              {eyebrow}
            </Typography>
          )}
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: 0, fontSize: { xs: '1.65rem', md: '2.1rem' } }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" sx={{ color: '#64748b', mt: 0.75, maxWidth: 760 }}>
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
    </Paper>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = 'blue',
  helper,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: DashboardAccent;
  helper?: string;
  trend?: string;
}) {
  const color = accentColor[accent];

  return (
    <Card elevation={0} className="dashboard-widget-card dashboard-widget-card--stat" sx={cardSx(accent)}>
      <CardContent sx={{ p: 1.7 }}>
        <Stack direction="row" spacing={1.35} alignItems="flex-start">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.25,
              display: 'grid',
              placeItems: 'center',
              color,
              bgcolor: alpha(color, 0.11),
              border: `1px solid ${alpha(color, 0.18)}`,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="caption" sx={{ color: 'var(--sms-muted, #64748b)', fontWeight: 800, letterSpacing: 0 }}>
              {label}
            </Typography>
            <Typography variant="h4" sx={{ color: 'var(--sms-text, #0f172a)', fontWeight: 900, mt: 0.05, mb: 0.05, letterSpacing: 0, fontSize: { xs: '1.08rem', md: '1.18rem' } }}>
              {value}
            </Typography>
            <Typography variant="caption" sx={{ color, fontWeight: 800 }}>
              {trend || helper || 'Live dashboard metric'}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mt: 0.1 }}>
          <MiniTrendBars color={color} />
          <Chip
            size="small"
            label="Live"
            sx={{
              height: 22,
              borderRadius: 1,
              bgcolor: alpha(color, 0.09),
              color,
              fontWeight: 900,
              '& .MuiChip-label': { px: 0.8 },
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

export function AnalyticsCard({ title, children, accent = 'blue' }: { title: string; children: React.ReactNode; accent?: DashboardAccent }) {
  return (
    <Card elevation={0} className="dashboard-widget-card dashboard-widget-card--analytics" sx={cardSx(accent)}>
      <CardContent sx={{ p: 2.5, pl: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--sms-text, #0f172a)', mb: 2 }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

function ChartPlaceholder({ type, accent }: { type: 'line' | 'bar' | 'donut' | 'sparkline'; accent: DashboardAccent }) {
  const color = accentColor[accent];
  const bars = [58, 78, 46, 88, 66, 72, 52];

  return (
    <Box
      sx={{
        minHeight: 220,
        borderRadius: 1.25,
        border: '1px dashed var(--sms-border, rgba(148,163,184,0.55))',
        bgcolor: alpha(color, 0.035),
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 2.5,
      }}
    >
      <Stack spacing={1.8} alignItems="center" sx={{ width: '100%', maxWidth: 520 }}>
        {type === 'donut' ? (
          <Box
            sx={{
              width: 108,
              height: 108,
              borderRadius: '50%',
              background: `conic-gradient(${color} 0 42%, ${alpha(color, 0.22)} 42% 68%, var(--sms-border, #e2e8f0) 68% 100%)`,
              position: 'relative',
              boxShadow: `0 18px 35px ${alpha(color, 0.16)}`,
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 24,
                borderRadius: '50%',
                bgcolor: 'var(--sms-surface, #fff)',
                border: '1px solid var(--sms-border, rgba(226,232,240,0.9))',
              },
            }}
          />
        ) : (
          <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ height: 108, width: '100%', justifyContent: 'center' }}>
            {bars.map((height, index) => (
              <Box
                key={index}
                sx={{
                  width: { xs: 18, sm: 24 },
                  height,
                  borderRadius: '8px 8px 3px 3px',
                  background: `linear-gradient(180deg, ${alpha(color, 0.9)} 0%, ${alpha(color, 0.24)} 100%)`,
                }}
              />
            ))}
          </Stack>
        )}
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontWeight: 900, color: 'var(--sms-text, #0f172a)' }}>Analytics widget ready</Typography>
          <Typography variant="caption" sx={{ color: 'var(--sms-muted, #64748b)', maxWidth: 420, display: 'block' }}>
            This role has a configured chart; richer data will appear as soon as the connected endpoint returns rows.
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export function ChartCard({
  title,
  subtitle,
  type,
  data,
  xKey = 'label',
  yKey = 'value',
  nameKey = 'label',
  valueKey = 'value',
  accent = 'blue',
}: {
  title: string;
  subtitle?: string;
  type: 'line' | 'bar' | 'donut' | 'sparkline';
  data: Array<Record<string, unknown>>;
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
  accent?: DashboardAccent;
}) {
  const metricKey = type === 'donut' ? valueKey : yKey;
  const numericValues = data.map((row) => numberFromValue(row[metricKey])).filter((value): value is number => value !== null);
  const total = numericValues.reduce((sum, value) => sum + value, 0);
  const average = numericValues.length ? total / numericValues.length : 0;
  const peak = numericValues.length ? Math.max(...numericValues) : 0;

  return (
    <Card elevation={0} className="dashboard-widget-card dashboard-widget-card--chart" sx={cardSx(accent)}>
      <CardContent sx={{ p: 1.7 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1.2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--sms-text, #0f172a)', lineHeight: 1.15, fontSize: '0.95rem' }}>
              {title}
            </Typography>
            {subtitle && <Typography variant="caption" sx={{ color: 'var(--sms-muted, #64748b)', mt: 0.25, display: 'block' }}>{subtitle}</Typography>}
          </Box>
          <Chip
            icon={<Insights sx={{ fontSize: 16 }} />}
            label={type === 'donut' ? 'Mix' : type === 'bar' ? 'Compare' : 'Trend'}
            size="small"
            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, borderRadius: 1, fontWeight: 800, bgcolor: alpha(accentColor[accent], 0.09), color: accentColor[accent] }}
          />
        </Stack>
        {data.length > 0 && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.2 }}>
            <Chip
              size="small"
              label={`${data.length} points`}
              sx={{ height: 24, borderRadius: 1, bgcolor: 'var(--sms-surface-soft, #f8fafc)', color: 'var(--sms-muted, #475569)', fontWeight: 800 }}
            />
            {numericValues.length > 0 && (
              <Chip
                size="small"
                label={`Total ${compactNumber(total)}`}
                sx={{ height: 24, borderRadius: 1, bgcolor: alpha(accentColor[accent], 0.08), color: accentColor[accent], fontWeight: 900 }}
              />
            )}
            {numericValues.length > 1 && type !== 'donut' && (
              <Chip
                size="small"
                label={`Avg ${compactNumber(average)}`}
                sx={{ height: 24, borderRadius: 1, bgcolor: 'var(--sms-surface-tint, #eef2ff)', color: '#4f46e5', fontWeight: 900 }}
              />
            )}
            {numericValues.length > 1 && type !== 'donut' && (
              <Chip
                size="small"
                label={`Peak ${compactNumber(peak)}`}
                sx={{ height: 24, borderRadius: 1, bgcolor: 'rgba(22,163,74,0.12)', color: '#16a34a', fontWeight: 900 }}
              />
            )}
          </Stack>
        )}
        {data.length === 0 ? (
          <ChartPlaceholder type={type} accent={accent} />
        ) : type === 'line' ? (
          <DashboardLineChart data={data} xKey={xKey} yKey={yKey} accent={accent} />
        ) : type === 'bar' ? (
          <DashboardBarChart data={data} xKey={xKey} yKey={yKey} accent={accent} />
        ) : type === 'sparkline' ? (
          <SparklineChart data={data} yKey={yKey} accent={accent} />
        ) : (
          <DashboardDonutChart data={data} nameKey={nameKey} valueKey={valueKey} />
        )}
        {type === 'donut' && data.length > 0 && (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
            {data.slice(0, 5).map((row, index) => (
              <Chip
                key={String(row[nameKey] ?? index)}
                size="small"
                label={`${String(row[nameKey] ?? 'Item')} ${formatDashboardValue(row[valueKey], 'number')}`}
                sx={{
                  height: 24,
                  borderRadius: 1,
                  bgcolor: alpha(categoricalColors[index % categoricalColors.length], 0.1),
                  color: categoricalColors[index % categoricalColors.length],
                  fontWeight: 900,
                }}
              />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export function DataTable({
  title,
  subtitle,
  rows,
  columns,
  emptyLabel,
}: {
  title: string;
  subtitle?: string;
  rows: Array<Record<string, unknown>>;
  columns: DashboardTableColumn[];
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => columns.some((col) => String(row[col.key] ?? '').toLowerCase().includes(q)));
  }, [columns, query, rows]);

  const pagedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card elevation={0} className="dashboard-widget-card dashboard-widget-card--table" sx={cardSx('slate')}>
      <CardContent sx={{ p: 1.7 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--sms-text, #0f172a)', fontSize: '0.95rem' }}>{title}</Typography>
            {subtitle && <Typography variant="body2" sx={{ color: 'var(--sms-muted, #64748b)' }}>{subtitle}</Typography>}
          </Box>
          <TextField
            size="small"
            placeholder="Search table"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: '#94a3b8' }} /> }}
            sx={{
              minWidth: { xs: '100%', sm: 240 },
              '& .MuiOutlinedInput-root': { borderRadius: 1.25, bgcolor: 'var(--sms-surface-soft, #f8fafc)' },
            }}
          />
        </Stack>
        <TableContainer sx={{ border: '1px solid var(--sms-border, #e2e8f0)', borderRadius: 1.25 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'var(--sms-surface-soft, #f8fafc)' }}>
                {columns.map((column) => (
                  <TableCell key={column.key} sx={{ fontWeight: 900, color: 'var(--sms-muted, #475569)' }}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <EmptyState title={emptyLabel || 'No records'} compact />
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((row, index) => (
                  <TableRow key={String(row.id ?? row.userId ?? row.studentId ?? row.invoiceId ?? index)} hover>
                    {columns.map((column) => (
                      <TableCell key={column.key} sx={{ color: 'var(--sms-text, #334155)', borderBottomColor: 'var(--sms-border-soft, #eef2f7)' }}>
                        {column.status ? <StatusBadge status={row[column.key]} /> : formatDashboardValue(row[column.key], column.format)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredRows.length}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </CardContent>
    </Card>
  );
}

export function QuickActionCard({ action, onOpen }: { action: DashboardActionConfig; onOpen: (path: string) => void }) {
  const color = accentColor[action.accent];
  return (
    <Button
      onClick={() => onOpen(action.path)}
      fullWidth
      sx={{
        justifyContent: 'flex-start',
        textAlign: 'left',
        p: 0.9,
        height: '100%',
        borderRadius: 1.25,
        color: 'var(--sms-text, #0f172a)',
        textTransform: 'none',
        background: `linear-gradient(180deg, var(--sms-glass-strong, #ffffff) 0%, ${alpha(color, 0.045)} 100%)`,
        backdropFilter: 'blur(16px) saturate(165%)',
        border: `1px solid ${alpha(color, 0.2)}`,
        boxShadow: 'var(--sms-shadow, 0 8px 18px rgba(15,23,42,0.04))',
        transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
        '&:hover': { bgcolor: alpha(color, 0.07), borderColor: alpha(color, 0.35), transform: 'translateY(-2px)', boxShadow: 'var(--sms-shadow-hover, 0 18px 40px rgba(15,23,42,0.08))' },
      }}
    >
      <Stack direction="row" spacing={1.1} alignItems="center" sx={{ width: '100%' }}>
        <Box sx={{ width: 30, height: 30, borderRadius: 1.1, bgcolor: alpha(color, 0.12), color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          {getDashboardIcon(action.icon)}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 900, lineHeight: 1.15, fontSize: '0.8rem' }}>{action.label}</Typography>
          {action.description && (
            <Typography variant="caption" sx={{ color: 'var(--sms-muted, #64748b)', display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', whiteSpace: 'normal', lineHeight: 1.2 }}>
              {action.description}
            </Typography>
          )}
        </Box>
        <ArrowForward sx={{ color, fontSize: 16 }} />
      </Stack>
    </Button>
  );
}

export function NoticeCard({ title, body, accent = 'blue' }: { title: string; body: string; accent?: DashboardAccent }) {
  const color = accentColor[accent];
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: alpha(color, 0.08), border: `1px solid ${alpha(color, 0.18)}` }}>
      <Typography sx={{ fontWeight: 800, color: 'var(--sms-text, #0f172a)' }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: 'var(--sms-muted, #64748b)', mt: 0.5 }}>{body}</Typography>
    </Paper>
  );
}

export function EventCard({ title, date, status }: { title: string; date?: string; status?: string }) {
  return (
    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid var(--sms-border, #e2e8f0)', bgcolor: 'var(--sms-surface, #fff)' }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Avatar sx={{ bgcolor: '#eff6ff', color: '#2563eb', width: 36, height: 36 }}><CalendarMonth fontSize="small" /></Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800, color: 'var(--sms-text, #0f172a)' }}>{title}</Typography>
          {date && <Typography variant="caption" sx={{ color: 'var(--sms-muted, #64748b)' }}>{formatDashboardValue(date, 'date')}</Typography>}
        </Box>
        {status && <StatusBadge status={status} />}
      </Stack>
    </Paper>
  );
}

export function CalendarWidget({ events }: { events: Array<{ title: string; date?: string; status?: string }> }) {
  return (
    <AnalyticsCard title="Calendar" accent="purple">
      <Stack spacing={1}>
        {events.length === 0 ? <EmptyState title="No calendar events" compact /> : events.map((event, index) => <EventCard key={`${event.title}-${index}`} {...event} />)}
      </Stack>
    </AnalyticsCard>
  );
}

export function ProgressCard({ title, value, label, accent = 'blue' }: { title: string; value: number; label?: string; accent?: DashboardAccent }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const color = accentColor[accent];
  return (
    <Card elevation={0} className="dashboard-widget-card dashboard-widget-card--progress" sx={cardSx(accent)}>
      <CardContent sx={{ p: 1.7 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 34, height: 34, borderRadius: 1, bgcolor: alpha(color, 0.1), color }}>
              <TaskAlt fontSize="small" />
            </Avatar>
            <Typography sx={{ fontWeight: 900, color: 'var(--sms-text, #0f172a)' }}>{title}</Typography>
          </Stack>
          <Typography sx={{ fontWeight: 900, color }}>{safeValue}%</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={safeValue} sx={{ height: 9, borderRadius: 10, bgcolor: alpha(color, 0.12), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 10 } }} />
        {label && <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 1 }}>{label}</Typography>}
      </CardContent>
    </Card>
  );
}

export function DonutChartCard(props: Omit<React.ComponentProps<typeof ChartCard>, 'type'>) {
  return <ChartCard {...props} type="donut" />;
}

export function LineChartCard(props: Omit<React.ComponentProps<typeof ChartCard>, 'type'>) {
  return <ChartCard {...props} type="line" />;
}

export function BarChartCard(props: Omit<React.ComponentProps<typeof ChartCard>, 'type'>) {
  return <ChartCard {...props} type="bar" />;
}

export function ActivityFeed({ title, items, emptyLabel }: { title: string; items: Array<Record<string, unknown>>; emptyLabel?: string }) {
  return (
    <Card elevation={0} className="dashboard-widget-card dashboard-widget-card--activity" sx={cardSx('blue')}>
      <CardContent sx={{ p: 1.7 }}>
        <Typography variant="h6" sx={{ fontWeight: 900, color: 'var(--sms-text, #0f172a)', mb: 1.2, fontSize: '0.95rem' }}>{title}</Typography>
        {items.length === 0 ? (
          <EmptyState title={emptyLabel || 'No activity'} compact />
        ) : (
          <List disablePadding>
            {items.slice(0, 8).map((item, index) => (
              <Box key={String(item.id ?? index)}>
                <ListItem disableGutters alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#eff6ff', color: '#2563eb', borderRadius: 1.25 }}>
                      <Notifications />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography sx={{ fontWeight: 800, color: 'var(--sms-text, #0f172a)' }}>{String(item.title ?? item.description ?? item.type ?? 'Activity')}</Typography>}
                    secondary={<Typography component="span" variant="body2" sx={{ color: 'var(--sms-muted, #64748b)' }}>{String(item.message ?? item.text ?? item.createdAt ?? item.date ?? '')}</Typography>}
                  />
                </ListItem>
                {index < items.length - 1 && <Divider sx={{ borderColor: 'var(--sms-border-soft, #eef2f7)' }} />}
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

export function NotificationPanel(props: React.ComponentProps<typeof ActivityFeed>) {
  return <ActivityFeed {...props} />;
}

export function EmptyState({ title, description, compact = false }: { title: string; description?: string; compact?: boolean }) {
  return (
    <Box sx={{ py: compact ? 2 : 5, textAlign: 'center', color: 'var(--sms-muted, #64748b)' }}>
      <Inbox sx={{ fontSize: compact ? 28 : 42, color: '#cbd5e1', mb: 1 }} />
      <Typography sx={{ fontWeight: 800, color: 'var(--sms-muted, #475569)' }}>{title}</Typography>
      {description && <Typography variant="body2" sx={{ color: 'var(--sms-muted-soft, #94a3b8)', mt: 0.5 }}>{description}</Typography>}
    </Box>
  );
}

export function LoadingSkeleton() {
  return (
    <Box>
      <Skeleton variant="rounded" height={270} sx={{ borderRadius: 1.5, mb: 3 }} />
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Skeleton variant="rounded" height={142} sx={{ borderRadius: 1.5 }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: 2, textAlign: 'center', border: '1px solid #fecaca', bgcolor: '#fff1f2' }}>
      <ErrorOutline sx={{ color: '#dc2626', fontSize: 42 }} />
      <Typography variant="h6" sx={{ fontWeight: 900, color: '#991b1b', mt: 1 }}>{message}</Typography>
      {onRetry && (
        <Button startIcon={<Add />} onClick={onRetry} variant="contained" sx={{ mt: 2 }}>
          Retry
        </Button>
      )}
    </Paper>
  );
}

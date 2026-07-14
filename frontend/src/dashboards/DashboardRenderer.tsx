import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import {
  AutoGraph,
  CalendarMonth,
  ChevronRight,
  ExpandMore,
  Refresh,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import type { RootState } from '../store';
import { getDashboardConfigById, getDashboardConfigForRole } from './dashboardConfigs';
import type {
  DashboardAccent,
  DashboardActionConfig,
  DashboardChartConfig,
  DashboardConfig,
  DashboardIconKey,
  DashboardStatConfig,
} from './dashboardConfigs/types';
import { accentColor } from './dashboardConfigs/shared';
import { useDashboardLayout } from './useDashboardLayout';
import { CustomizeDashboardMenu } from './CustomizeDashboardMenu';
import { fetchDashboardData } from '../services/dashboardService';
import {
  ActivityFeed,
  BarChartCard,
  ChartCard,
  DataTable,
  DonutChartCard,
  EmptyState,
  ErrorState,
  formatDashboardValue,
  LineChartCard,
  LoadingSkeleton,
  NotificationPanel,
  ProgressCard,
  QuickActionCard,
  SectionTitle,
  StatCard,
} from '../components/dashboard/DashboardWidgets';
import { getDashboardIcon } from '../components/dashboard/icons';
import mountEverestSunrise from '../assets/dashboard/mount-everest-sunrise-real.jpg';
import sunDisk from '../assets/dashboard/nasa-sun-disk.jpg';

type DashboardData = Record<string, unknown>;

interface RoleBasedDashboardRendererProps {
  configId?: string;
}

function getPathValue(source: unknown, path?: string): unknown {
  if (!path || !source || typeof source !== 'object') return undefined;

  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

function asRows(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object') : [];
}

function toPercent(value: unknown): number {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function userDisplayName(user: RootState['auth']['user']): string {
  if (!user) return 'User';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username || 'User';
}

function greetingLabel(t: TFunction) {
  const hour = new Date().getHours();
  if (hour < 12) return t('dashboard.goodMorning', 'Good morning');
  if (hour < 17) return t('dashboard.goodAfternoon', 'Good afternoon');
  return t('dashboard.goodEvening', 'Good evening');
}

function fullDateLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function valueForStat(stat: DashboardStatConfig, data: DashboardData) {
  return formatDashboardValue(getPathValue(data, stat.valuePath), stat.format);
}

function metricForStat(stat: DashboardStatConfig, data: DashboardData) {
  return {
    id: stat.id,
    label: stat.label,
    value: valueForStat(stat, data),
    helper: stat.helper,
    accent: stat.accent,
    icon: getDashboardIcon(stat.icon),
  };
}

function chartClassName(chart: DashboardChartConfig, index: number) {
  const size = chart.type === 'line' || index === 0 ? 'dashboard-chart-tile--wide' : chart.type === 'donut' ? 'dashboard-chart-tile--compact' : '';
  return ['dashboard-chart-tile', size].filter(Boolean).join(' ');
}

function renderChart(chart: DashboardChartConfig, data: DashboardData) {
  const rows = asRows(getPathValue(data, chart.dataPath));
  const props = {
    title: chart.title,
    subtitle: chart.subtitle,
    data: rows,
    xKey: chart.xKey,
    yKey: chart.yKey,
    nameKey: chart.nameKey,
    valueKey: chart.valueKey,
    accent: chart.accent || 'blue' as DashboardAccent,
  };

  if (chart.type === 'line') return <LineChartCard {...props} />;
  if (chart.type === 'bar') return <BarChartCard {...props} />;
  if (chart.type === 'donut') return <DonutChartCard {...props} />;
  return <ChartCard {...props} type="sparkline" />;
}

function actionAllowed(action: DashboardActionConfig, role?: string) {
  return !action.permissionRoles?.length || Boolean(role && action.permissionRoles.includes(role));
}

const surfaceCardSx = {
  position: 'relative' as const,
  borderRadius: 1.5,
  border: (theme: any) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.22)' : 'rgba(226,232,240,0.9)'}`,
  background: (theme: any) => (theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, rgba(15,23,42,0.86) 0%, rgba(15,23,42,0.64) 100%)'
    : '#ffffff'),
  boxShadow: (theme: any) => (theme.palette.mode === 'dark'
    ? '0 18px 44px rgba(0,0,0,0.32)'
    : '0 10px 28px rgba(15,23,42,0.06)'),
};

interface FacetItem {
  id: string;
  label: string;
  labelKey: string;
  helper: string;
  helperKey: string;
  icon: DashboardIconKey;
  accent: DashboardAccent;
  path: string;
  valuePath: string;
}

function HeroBanner({
  config,
  data,
  userName,
  t,
}: {
  config: DashboardConfig;
  data: DashboardData;
  userName: string;
  t: TFunction;
}) {
  const stats = config.statCards.slice(0, 4);

  return (
    <Paper elevation={0} className="dashboard-hero">
      <Box className="dashboard-hero__content">
        <Typography className="dashboard-hero__eyebrow">{t('dashboard.schoolOverview', 'School Overview')}</Typography>
        <Typography className="dashboard-hero__title">
          {greetingLabel(t)}, {userName}
          <span className="dashboard-hero__star" aria-hidden="true"> ⭐</span>
        </Typography>
        <Typography className="dashboard-hero__subtitle">
          {t('dashboard.todayHappening', "Here's what's happening in your school today.")}
        </Typography>
      </Box>

      <Box className="dashboard-hero__stats">
        {stats.map((stat) => (
          <Box key={stat.id} className="dashboard-hero__stat">
            <Box className="dashboard-hero__stat-icon">{getDashboardIcon(stat.icon)}</Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography className="dashboard-hero__stat-label">{stat.label}</Typography>
              <Typography className="dashboard-hero__stat-value">{valueForStat(stat, data)}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <figure className="dashboard-hero__art" aria-hidden="true">
        <img src={mountEverestSunrise} alt="" />
        <img className="dashboard-hero__sun" src={sunDisk} alt="" />
      </figure>
    </Paper>
  );
}

function OverviewRow({
  config,
  data,
  actions,
  onOpen,
  t,
}: {
  config: DashboardConfig;
  data: DashboardData;
  actions: DashboardActionConfig[];
  onOpen: (path: string) => void;
  t: TFunction;
}) {
  const arrangementItems = [
    { label: t('dashboard.kpiCards', 'KPI Cards'), value: config.statCards.length, accent: '#2563eb' },
    { label: t('dashboard.analytics', 'Analytics'), value: config.charts?.length ?? 0, accent: '#7c3aed' },
    { label: t('dashboard.actions', 'Actions'), value: actions.length, accent: '#16a34a' },
    { label: t('dashboard.updates', 'Updates'), value: asRows(getPathValue(data, config.activityFeed?.dataPath)).length, accent: '#f97316' },
  ];

  const attendanceStat = config.progress?.[0];
  const attendanceValue = toPercent(attendanceStat ? getPathValue(data, attendanceStat.valuePath) : 0);

  return (
    <Box className="dashboard-overview-grid">
      <Paper elevation={0} className="dashboard-overview-card" sx={surfaceCardSx}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography className="dashboard-card__title">{t('dashboard.todaysArrangement', "Today's Arrangement")}</Typography>
            <Typography className="dashboard-card__subtitle">{t('dashboard.arrangementSubtitle', 'KPIs, actions, charts, and alerts in one compact view.')}</Typography>
          </Box>
          <Button
            className="dashboard-card__link"
            endIcon={<ChevronRight sx={{ fontSize: 16 }} />}
            onClick={() => onOpen('/reports')}
          >
            {t('dashboard.viewAllWidgets', 'View all widgets')}
          </Button>
        </Stack>

        <Box className="dashboard-overview__item-grid">
          {arrangementItems.map((item) => (
            <Box
              key={item.label}
              className="dashboard-overview__item"
              sx={{ background: alpha(item.accent, 0.07), borderColor: alpha(item.accent, 0.22) }}
            >
              <Typography className="dashboard-overview__item-label">{item.label}</Typography>
              <Typography className="dashboard-overview__item-value" sx={{ color: item.accent }}>{item.value}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper elevation={0} className="dashboard-overview-card dashboard-overview-card--attendance" sx={surfaceCardSx}>
        <Box>
          <Typography className="dashboard-card__title">{attendanceStat?.title || t('dashboard.attendanceHealth', 'Attendance Health')}</Typography>
          <Typography className="dashboard-card__subtitle">{t('dashboard.overallAttendance', 'Overall attendance status')}</Typography>
        </Box>
        <Typography className="dashboard-overview__big-value">{attendanceValue}%</Typography>
        <Button
          className="dashboard-overview__soft-button"
          onClick={() => onOpen('/attendance')}
        >
          {t('dashboard.viewDetails', 'View Details')}
        </Button>
      </Paper>

      <Paper elevation={0} className="dashboard-overview-card dashboard-overview-card--focus" sx={surfaceCardSx}>
        <Box>
          <Typography className="dashboard-card__title">{t('dashboard.nextBestFocus', 'Next Best Focus')}</Typography>
          <Typography className="dashboard-card__subtitle">{t('dashboard.recommendedAction', 'Recommended action for today')}</Typography>
        </Box>
        <Typography className="dashboard-overview__focus-copy">{t('dashboard.reviewAlerts', 'Review alerts, attendance, and payments.')}</Typography>
        <Button
          className="dashboard-overview__focus-button"
          startIcon={<AutoGraph sx={{ fontSize: 16 }} />}
          onClick={() => onOpen('/attendance')}
        >
          {t('dashboard.viewActionItems', 'View Action Items')}
        </Button>
      </Paper>
    </Box>
  );
}

function MetricsPeriodTabs({ t }: { t: TFunction }) {
  const periods = [
    { id: 'today', label: t('dashboard.today', 'Today') },
    { id: 'week', label: t('dashboard.thisWeek', 'This Week') },
    { id: 'month', label: t('dashboard.thisMonth', 'This Month') },
    { id: 'year', label: t('dashboard.thisYear', 'This Year') },
  ];
  const [active, setActive] = useState('today');

  return (
    <Stack direction="row" className="dashboard-metric-tabs">
      {periods.map((period) => (
        <Button
          key={period.id}
          disableRipple
          className={`dashboard-metric-tab${active === period.id ? ' is-active' : ''}`}
          onClick={() => setActive(period.id)}
        >
          {period.label}
        </Button>
      ))}
    </Stack>
  );
}

function FacetCard({
  title,
  facets,
  data,
  onOpen,
  action,
  t,
}: {
  title: string;
  facets: FacetItem[];
  data: DashboardData;
  onOpen: (path: string) => void;
  action?: React.ReactNode;
  t: TFunction;
}) {
  return (
    <Paper elevation={0} className="dashboard-facet-card" sx={surfaceCardSx}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography className="dashboard-card__title">{title}</Typography>
        {action}
      </Stack>
      <Stack spacing={0.75}>
        {facets.map((facet) => {
          const color = accentColor[facet.accent];
          return (
            <Box
              key={facet.id}
              role="button"
              tabIndex={0}
              className="dashboard-facet-row"
              onClick={() => onOpen(facet.path)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpen(facet.path);
                }
              }}
            >
              <Box className="dashboard-facet-row__icon" sx={{ color, bgcolor: alpha(color, 0.12) }}>
                {getDashboardIcon(facet.icon)}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography className="dashboard-facet-row__label">{t(facet.labelKey, facet.label)}</Typography>
                <Typography className="dashboard-facet-row__helper">{t(facet.helperKey, facet.helper)}</Typography>
              </Box>
              <Typography className="dashboard-facet-row__value">
                {formatDashboardValue(getPathValue(data, facet.valuePath), 'number')}
              </Typography>
              <ChevronRight className="dashboard-facet-row__chevron" />
            </Box>
          );
        })}
      </Stack>
    </Paper>
  );
}

function QuickActionsCard({
  actions,
  onOpen,
  t,
}: {
  actions: DashboardActionConfig[];
  onOpen: (path: string) => void;
  t: TFunction;
}) {
  const [expanded, setExpanded] = useState(false);
  const primaryActions = actions.slice(0, 5);
  const moreActions = actions.slice(5);

  return (
    <Paper elevation={0} className="dashboard-facet-card" sx={surfaceCardSx}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography className="dashboard-card__title">{t('dashboard.quickActions', 'Quick Actions')}</Typography>
        <Chip label={actions.length} size="small" className="dashboard-card__count" />
      </Stack>

      <Stack spacing={0.75}>
        {primaryActions.map((action, index) => (
          <QuickActionCard key={`${action.id}-${index}`} action={action} onOpen={onOpen} />
        ))}

        {moreActions.length > 0 && (
          <>
            <Button
              className="dashboard-quick-panel__more-button"
              onClick={() => setExpanded((value) => !value)}
              endIcon={<ExpandMore sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }} />}
            >
              {t('dashboard.moreActions', 'More actions')}
              <Chip label={moreActions.length} size="small" className="dashboard-quick-panel__more-count" />
            </Button>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Stack spacing={0.75} sx={{ mt: 0.75 }}>
                {moreActions.map((action, index) => (
                  <QuickActionCard key={`${action.id}-${index + primaryActions.length}`} action={action} onOpen={onOpen} />
                ))}
              </Stack>
            </Collapse>
          </>
        )}
      </Stack>
    </Paper>
  );
}

const academicFacets: FacetItem[] = [
  { id: 'classes', label: 'Classes', labelKey: 'dashboard.classes', helper: 'Active classes', helperKey: 'dashboard.activeClasses', icon: 'class', accent: 'blue', path: '/academic/classes', valuePath: 'summary.totalClasses' },
  { id: 'subjects', label: 'Subjects', labelKey: 'dashboard.subjects', helper: 'Offered subjects', helperKey: 'dashboard.offeredSubjects', icon: 'academic', accent: 'purple', path: '/academic/subjects', valuePath: 'summary.totalSubjects' },
  { id: 'timetable', label: 'Timetable', labelKey: 'dashboard.timetable', helper: 'Scheduled periods', helperKey: 'dashboard.scheduledPeriods', icon: 'calendar', accent: 'green', path: '/academic/timetable', valuePath: 'summary.totalPeriods' },
];

const libraryExamFacets: FacetItem[] = [
  { id: 'books', label: 'Library Books', labelKey: 'dashboard.libraryBooks', helper: 'Total books', helperKey: 'dashboard.totalBooks', icon: 'library', accent: 'pink', path: '/library', valuePath: 'summary.totalBooks' },
  { id: 'exams', label: 'Total Exams', labelKey: 'dashboard.totalExams', helper: 'Configured exams', helperKey: 'dashboard.configuredExams', icon: 'exam', accent: 'purple', path: '/examinations', valuePath: 'summary.totalExams' },
  { id: 'results', label: 'Exam Results', labelKey: 'dashboard.examResults', helper: 'Published results', helperKey: 'dashboard.publishedResults', icon: 'trend', accent: 'orange', path: '/examinations', valuePath: 'summary.publishedResults' },
];

export function RoleBasedDashboardRenderer({ configId }: RoleBasedDashboardRendererProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const config = useMemo(
    () => getDashboardConfigById(configId) ?? getDashboardConfigForRole(user?.role),
    [configId, user?.role]
  );
  const layout = useDashboardLayout(`${config.id}:${user?.role || 'guest'}`);
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchDashboardData(config);
      setData(response);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchDashboardData(config)
      .then((response) => {
        if (mounted) setData(response);
      })
      .catch((err: any) => {
        if (mounted) setError(err?.response?.data?.message || err?.message || 'Dashboard data could not be loaded.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [config]);

  const userName = userDisplayName(user);
  const actions = useMemo(
    () => (config.quickActions || []).filter((action) => actionAllowed(action, user?.role)),
    [config.quickActions, user?.role]
  );

  const openPath = useCallback(
    (path: string) => {
      const target = municipalitySlug ? `/${municipalitySlug}${path}` : path;
      navigate(target);
    },
    [municipalitySlug, navigate]
  );

  if (loading) {
    return (
      <Box className="role-dashboard">
        <LoadingSkeleton />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="role-dashboard">
        <ErrorState message={error} onRetry={loadData} />
      </Box>
    );
  }

  const primaryStats = config.statCards.slice(0, 4);
  const liveStats = config.statCards.slice(4);
  const chartConfigs = config.charts || [];
  const tableConfigs = config.tables || [];
  const activityItems = asRows(getPathValue(data, config.activityFeed?.dataPath));
  const notificationItems = asRows(getPathValue(data, config.notificationFeed?.dataPath));

  return (
    <Box className="role-dashboard">
      <Box className="role-dashboard__header">
        <Box className="role-dashboard__actions">
          <Chip
            icon={<CalendarMonth sx={{ fontSize: 16 }} />}
            label={fullDateLabel()}
            size="small"
            className="role-dashboard__date-chip"
          />
          <CustomizeDashboardMenu layout={layout} />
          <Button
            variant="contained"
            startIcon={<AutoGraph />}
            className="role-dashboard__primary-button"
            onClick={() => {
              const firstChart = document.querySelector('[data-dashboard-section="charts"]');
              firstChart?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            Analytics
          </Button>
          <IconButton className="role-dashboard__refresh-button" onClick={loadData} aria-label="Refresh dashboard">
            <Refresh sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {layout.isVisible('pulse') && (
        <>
          <HeroBanner config={config} data={data} userName={userName} t={t} />
          <OverviewRow config={config} data={data} actions={actions} onOpen={openPath} t={t} />
        </>
      )}

      {layout.isVisible('kpis') && primaryStats.length > 0 && (
        <Box className="dashboard-section">
          <SectionTitle
            title={t('dashboard.keyMetrics', 'Key Metrics')}
            description={t('dashboard.coreSignals', 'Core school signals from connected APIs.')}
            action={<MetricsPeriodTabs t={t} />}
          />
          <Box className="dashboard-kpi-grid">
            {primaryStats.map((stat) => {
              const metric = metricForStat(stat, data);
              return (
                <Box key={stat.id} className="dashboard-kpi-grid__item">
                  <StatCard
                    label={metric.label}
                    value={metric.value}
                    icon={metric.icon}
                    accent={metric.accent}
                    helper={metric.helper}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      <Box className="dashboard-grid-4">
        <FacetCard title={t('dashboard.academics', 'Academics')} facets={academicFacets} data={data} onOpen={openPath} t={t} />
        {config.activityFeed ? (
          <ActivityFeed
            title={config.activityFeed.title}
            items={activityItems}
            emptyLabel={config.activityFeed.emptyLabel}
          />
        ) : config.notificationFeed ? (
          <NotificationPanel
            title={config.notificationFeed.title}
            items={notificationItems}
            emptyLabel={config.notificationFeed.emptyLabel}
          />
        ) : (
          <FacetCard title={t('dashboard.libraryExams', 'Library & Exams')} facets={libraryExamFacets} data={data} onOpen={openPath} t={t} />
        )}
        <FacetCard title={t('dashboard.libraryExams', 'Library & Exams')} facets={libraryExamFacets} data={data} onOpen={openPath} t={t} />
        <QuickActionsCard actions={actions.length > 0 ? actions : (config.quickActions || [])} onOpen={openPath} t={t} />
      </Box>

      {layout.isVisible('liveCards') && liveStats.length > 0 && (
        <Box className="dashboard-section">
          <SectionTitle title={t('dashboard.moreMetrics', 'More Metrics')} description={t('dashboard.additionalCounters', 'Additional live counters across modules.')} />
          <Box className="dashboard-live-card-grid dashboard-live-card-grid--wide">
            {liveStats.map((stat) => {
              const metric = metricForStat(stat, data);
              return (
                <Box key={stat.id} className="dashboard-kpi-grid__item">
                  <StatCard
                    label={metric.label}
                    value={metric.value}
                    icon={metric.icon}
                    accent={metric.accent}
                    helper={metric.helper}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {layout.isVisible('charts') && chartConfigs.length > 0 && (
        <Box className="dashboard-section" data-dashboard-section="charts">
          <SectionTitle title={t('dashboard.institutionOverview', 'Institution Overview')} description={t('dashboard.institutionOverviewDesc', 'Role-specific trend, distribution, and performance analytics.')} action={<Chip label={t('dashboard.thisYear', 'This Year')} size="small" className="dashboard-section__chip" />} />
          <Box className="dashboard-chart-grid">
            {chartConfigs.map((chart, index) => (
              <Box key={chart.id} className={chartClassName(chart, index)}>
                {renderChart(chart, data)}
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {layout.isVisible('progress') && Boolean(config.progress?.length) && (
        <Box className="dashboard-section">
          <SectionTitle title={t('dashboard.performanceTrackers', 'Performance Trackers')} description={t('dashboard.performanceTrackersDesc', 'Progress cards inspired by attendance, fee, GPA, and completion widgets.')} />
          <Box className="dashboard-progress-grid">
            {config.progress!.map((progress) => (
              <Box key={progress.id} className="dashboard-progress-grid__item">
                <ProgressCard
                  title={progress.title}
                  value={toPercent(getPathValue(data, progress.valuePath))}
                  label={progress.label}
                  accent={progress.accent}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {layout.isVisible('tables') && tableConfigs.length > 0 && (
        <Box className={`dashboard-section dashboard-table-grid${tableConfigs.length > 1 ? ' dashboard-table-grid--two' : ''}`}>
          {tableConfigs.map((table) => (
            <DataTable
              key={table.id}
              title={table.title}
              subtitle={table.subtitle}
              rows={asRows(getPathValue(data, table.dataPath))}
              columns={table.columns}
              emptyLabel={table.emptyLabel}
            />
          ))}
        </Box>
      )}

      {layout.isVisible('activity') && config.notificationFeed && (
        <Box className="dashboard-section">
          <SectionTitle title={t('dashboard.notices', 'Notices')} description={t('dashboard.noticesDesc', 'Recent role-specific alerts and communication signals.')} />
          <Box className="dashboard-feed-grid dashboard-feed-grid--single">
            <NotificationPanel
              title={config.notificationFeed.title}
              items={notificationItems}
              emptyLabel={config.notificationFeed.emptyLabel}
            />
          </Box>
        </Box>
      )}

      {!config.statCards.length && !chartConfigs.length && !actions.length && (
        <EmptyState title="No dashboard widgets configured" description="This role is connected, but no widgets have been assigned yet." />
      )}
    </Box>
  );
}

export default RoleBasedDashboardRenderer;

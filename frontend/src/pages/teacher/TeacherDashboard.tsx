/**
 * Teacher Dashboard
 * 
 * Main dashboard for teachers with today's schedule, pending tasks, and class performance.
 * All data is fetched from /api/v1/teachers/dashboard — no hardcoded mock data.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  Notifications as NotificationsIcon,
  Inbox as InboxIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface ScheduleItem {
  period: number;
  time: string;
  subject: string;
  class: string;
  room: string;
  status: string;
}

interface TaskItem {
  type: string;
  title: string;
  priority: string;
  count: number;
}

interface PerformanceItem {
  class: string;
  attendance: number;
  avgGrade: number;
  assignments: number;
}

interface TrendItem {
  week: string;
  rate: number;
}

interface NotificationItem {
  icon: React.ReactNode;
  text: string;
  time: string;
}

interface DashboardStats {
  classesToday: number;
  pendingTasksCount: number;
  totalStudents: number;
  avgAttendance: number;
  currentPeriod: number;
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  event: <EventIcon color="primary" />,
  warning: <WarningIcon color="warning" />,
  success: <CheckCircleIcon color="success" />,
};

/** Renders centered empty-state message */
const EmptyState = ({ message }: { message: string }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, color: 'text.secondary' }}>
    <InboxIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
    <Typography variant="body2">{message}</Typography>
  </Box>
);

export const TeacherDashboard = () => {
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [pendingTasks, setPendingTasks] = useState<TaskItem[]>([]);
  const [classPerformanceData, setClassPerformanceData] = useState<PerformanceItem[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<TrendItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    classesToday: 0,
    pendingTasksCount: 0,
    totalStudents: 0,
    avgAttendance: 0,
    currentPeriod: 0,
  });

  useEffect(() => {
    let cancelled = false;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/v1/teachers/dashboard');
        if (cancelled) return;
        const d = res.data?.data || {};

        if (d.schedule?.length) setTodaySchedule(d.schedule);
        if (d.tasks?.length) setPendingTasks(d.tasks);
        if (d.performances?.length) setClassPerformanceData(d.performances);
        if (d.trend?.length) setAttendanceTrend(d.trend);
        if (d.notifications?.length) {
          setNotifications(
            d.notifications.map((n: any) => ({
              icon: NOTIFICATION_ICONS[n.type] ?? NOTIFICATION_ICONS.event,
              text: n.title || n.text,
              time: n.time || n.date || '',
            })),
          );
        }

        setStats({
          classesToday: d.classesToday ?? d.schedule?.length ?? 0,
          pendingTasksCount: d.pendingTasksCount ?? d.tasks?.length ?? 0,
          totalStudents: d.totalStudents ?? 0,
          avgAttendance: d.avgAttendance ?? 0,
          currentPeriod: d.currentPeriod ?? 0,
        });
      } catch {
        // Data stays empty — empty states will be shown
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { cancelled = true; };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'ongoing':
        return 'primary';
      case 'upcoming':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: { xs: 7, sm: 8 } }}>
      {/* Header */}
      <Box sx={{ ...S.PAGE_HEADER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('portal.dashboard')}
          </Typography>
          {stats.currentPeriod > 0 && (
            <Typography variant="body1" color="text.secondary">
              {t('attendance.period')}: {stats.currentPeriod}
            </Typography>
          )}
        </Box>
        <Button sx={{ ...S.BTN_PRIMARY, borderRadius: R.sm }} startIcon={<ScheduleIcon />}>
          {t('portal.todaysSchedule')}
        </Button>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={S.STAT_CARD(C.primary)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={S.ICON_BOX(C.primary, 44)}>
                  <SchoolIcon />
                </Box>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h4">{stats.classesToday}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('portal.todaysClasses')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={S.STAT_CARD(C.warning)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={S.ICON_BOX(C.warning, 44)}>
                  <AssignmentIcon />
                </Box>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h4">{stats.pendingTasksCount}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('portal.pendingTasks')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={S.STAT_CARD(C.success)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={S.ICON_BOX(C.success, 44)}>
                  <PeopleIcon />
                </Box>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h4">{stats.totalStudents}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('portal.totalStudentsCount')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={S.STAT_CARD(C.info)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={S.ICON_BOX(C.info, 44)}>
                  <TrendingUpIcon />
                </Box>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h4">
                    {stats.avgAttendance > 0 ? `${stats.avgAttendance}%` : '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('dashboard.attendanceRate')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Today's Schedule */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ ...S.GLASS, borderRadius: R.md, p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('portal.todaysSchedule')}
            </Typography>
            {todaySchedule.length === 0 ? (
              <EmptyState message={t('portal.noClassesScheduled')} />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: S.TH_BG }}>
                      <TableCell sx={S.TD}>{t('attendance.period')}</TableCell>
                      <TableCell sx={S.TD}>{t('portal.time')}</TableCell>
                      <TableCell sx={S.TD}>{t('portal.subject')}</TableCell>
                      <TableCell sx={S.TD}>{t('portal.class')}</TableCell>
                      <TableCell sx={S.TD}>{t('portal.room')}</TableCell>
                      <TableCell sx={S.TD}>{t('common.status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {todaySchedule.map((period) => (
                      <TableRow
                        key={period.period}
                        sx={{
                          ...S.TR_HOVER,
                          bgcolor: period.status === 'ongoing'
                            ? (theme.palette.mode === 'dark' ? 'rgba(0,122,255,0.08)' : 'rgba(0,122,255,0.05)')
                            : 'inherit',
                        }}
                      >
                        <TableCell sx={S.TD}>{period.period}</TableCell>
                        <TableCell sx={S.TD}>{period.time}</TableCell>
                        <TableCell sx={S.TD}>{period.subject}</TableCell>
                        <TableCell sx={S.TD}>{period.class}</TableCell>
                        <TableCell sx={S.TD}>{period.room}</TableCell>
                        <TableCell sx={S.TD}>
                          <Chip
                            label={period.status}
                            size="small"
                            color={getStatusColor(period.status)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Class Performance */}
          <Paper sx={{ ...S.GLASS, borderRadius: R.md, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('portal.classPerformance')}
            </Typography>
            {classPerformanceData.length === 0 ? (
              <EmptyState message={t('portal.noData')} />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: S.TH_BG }}>
                      <TableCell sx={S.TD}>{t('portal.class')}</TableCell>
                      <TableCell sx={S.TD} align="center">{t('portal.attendance')}</TableCell>
                      <TableCell sx={S.TD} align="center">{t('portal.avgScore')}</TableCell>
                      <TableCell sx={S.TD} align="center">{t('portal.assignments')}</TableCell>
                      <TableCell sx={S.TD} align="center">{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classPerformanceData.map((cls) => (
                      <TableRow key={cls.class} sx={S.TR_HOVER}>
                        <TableCell sx={S.TD}>{cls.class}</TableCell>
                        <TableCell sx={S.TD} align="center">
                          <Chip
                            label={`${cls.attendance}%`}
                            size="small"
                            color={cls.attendance >= 90 ? 'success' : cls.attendance >= 80 ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell sx={S.TD} align="center">{cls.avgGrade.toFixed(1)}</TableCell>
                        <TableCell sx={S.TD} align="center">{cls.assignments}%</TableCell>
                        <TableCell sx={S.TD} align="center">
                          <Button
                            size="small"
                            sx={{ ...S.BTN_OUTLINE, borderRadius: R.sm }}
                            onClick={() => navigate(`/teacher/class/${cls.class}`)}
                          >
                            {t('dashboard.viewDetails')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Pending Tasks */}
          <Paper sx={{ ...S.GLASS, borderRadius: R.md, p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('portal.pendingTasks')}
            </Typography>
            {pendingTasks.length === 0 ? (
              <EmptyState message={t('portal.noTasksPending')} />
            ) : (
              <List>
                {pendingTasks.map((task, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      px: 0,
                      borderBottom: index < pendingTasks.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: `${getPriorityColor(task.priority)}.main` }}>
                        {task.count}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <Box component="span" sx={{ display: 'inline-block', mt: 0.5 }}>
                          <Chip
                            label={task.priority}
                            size="small"
                            color={getPriorityColor(task.priority)}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
            <Button fullWidth sx={{ ...S.BTN_PRIMARY, borderRadius: R.sm, mt: 2 }}>
              {t('portal.myTasks')}
            </Button>
          </Paper>

          {/* Attendance Trend */}
          <Paper sx={{ ...S.GLASS, borderRadius: R.md, p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('dashboard.attendanceTrendTitle')}
            </Typography>
            {attendanceTrend.length === 0 ? (
              <EmptyState message={t('portal.noData')} />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="week" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      color: theme.palette.text.primary,
                    }}
                  />
                  <Line type="monotone" dataKey="rate" stroke={C.primary} strokeWidth={2} dot={{ fill: C.primary }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>

          {/* Notifications */}
          <Paper sx={{ ...S.GLASS, borderRadius: R.md, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
              <Typography variant="h6">
                {t('notifications.title')}
              </Typography>
            </Box>
            {notifications.length === 0 ? (
              <EmptyState message={t('notifications.noNotifications')} />
            ) : (
              <List>
                {notifications.map((notification, index) => (
                  <Box key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>{notification.icon}</ListItemIcon>
                      <ListItemText
                        primary={notification.text}
                        secondary={notification.time}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            )}
            <Button fullWidth sx={{ ...S.BTN_OUTLINE, borderRadius: R.sm, mt: 2 }}>
              {t('notifications.viewAll')}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

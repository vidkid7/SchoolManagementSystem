import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme,
} from '@mui/material';
import { C, useAdminStyles } from '../../theme/designTokens';
import {
  MenuBook as TeacherIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  Description as DocIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as DoneIcon,
  School as ClassIcon,
  EditNote as LessonIcon,
  Grading as GradeIcon,
  People as StudentsIcon,
  Task as TaskIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';
import { useTranslation } from 'react-i18next';

interface ScheduleEntry {
  period?: number;
  time?: string;
  subject?: string;
  class?: string;
  room?: string;
}

interface TaskEntry {
  id: number;
  title: string;
  description?: string;
  status: string;
  dueDate?: string | null;
}

interface PerformanceEntry {
  class?: string;
  subject?: string;
  students?: number;
  avgScore?: number;
}

interface DashboardData {
  schedule?: ScheduleEntry[];
  tasks?: TaskEntry[];
  performances?: PerformanceEntry[];
  stats?: {
    todayClasses?: number;
    pendingTasks?: number;
    totalStudents?: number;
    completedLessons?: number;
  };
  profile?: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: string;
    status?: string;
  };
}

interface Notification {
  id: number;
  title: string;
  message: string;
  date?: string;
  read?: boolean;
}

const authHdr = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>;
}

export const TeacherPortal: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const [dashRes, notifRes] = await Promise.all([
        apiClient.get('/api/v1/teachers/dashboard', authHdr(accessToken)),
        apiClient.get('/api/v1/teachers/notifications', authHdr(accessToken))
          .catch(() => ({ data: { data: { notifications: [] } } })),
      ]);
      setData(dashRes.data?.data ?? dashRes.data ?? {});
      const notifList = notifRes.data?.data;
      setNotifications(Array.isArray(notifList) ? notifList : notifList?.notifications ?? []);
    } catch {
      setError(t('portal.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  const stats = data?.stats ?? {};
  const schedule = data?.schedule ?? [];
  const tasks = data?.tasks ?? [];
  const performances = data?.performances ?? [];
  const profile = data?.profile;

  return (
    <Box sx={{ p: 3, mt: { xs: 7, sm: 8 } }}>
      {/* Header */}
      <Paper sx={S.PAGE_HEADER}>
        <Box display="flex" alignItems="center" gap={2}>
          <TeacherIcon sx={{ fontSize: 32, color: C.primary }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{t('menu.teacherPortal')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('portal.welcome')}, {user?.firstName || user?.username} — {t('roles.teacher')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: t('portal.todaysClasses'), value: stats.todayClasses ?? 0, icon: <ScheduleIcon />, color: C.primary },
          { label: t('portal.pendingTasksCount'), value: stats.pendingTasks ?? 0, icon: <TaskIcon />, color: C.warning },
          { label: t('dashboard.totalStudents'), value: stats.totalStudents ?? 0, icon: <StudentsIcon />, color: C.info },
          { label: t('portal.completedLessons'), value: stats.completedLessons ?? 0, icon: <DoneIcon />, color: C.success },
        ].map(stat => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Box sx={S.STAT_CARD(stat.color)}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={S.ICON_BOX(stat.color, 36)}>{stat.icon}</Box>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} TabIndicatorProps={{ sx: S.TAB_INDICATOR }}>
        <Tab icon={<TeacherIcon />} iconPosition="start" label={t('portal.dashboard')} sx={S.TAB_ACTIVE} />
        <Tab icon={<ScheduleIcon />} iconPosition="start" label={t('portal.todaysSchedule')} sx={S.TAB_ACTIVE} />
        <Tab icon={<ClassIcon />} iconPosition="start" label={t('portal.myClasses')} sx={S.TAB_ACTIVE} />
        <Tab icon={<LessonIcon />} iconPosition="start" label={t('portal.lessonPlans')} sx={S.TAB_ACTIVE} />
        <Tab icon={<AssignmentIcon />} iconPosition="start" label={t('portal.assignments')} sx={S.TAB_ACTIVE} />
        <Tab icon={<PersonIcon />} iconPosition="start" label={t('portal.profileAndLinks')} sx={S.TAB_ACTIVE} />
      </Tabs>

      {/* DASHBOARD */}
      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.todaysSchedule')}</Typography>
            <TableContainer component={Paper} sx={S.GLASS}>
              <Table size="small">
                <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
                  <TableCell>{t('portal.period')}</TableCell><TableCell>{t('portal.time')}</TableCell><TableCell>{t('portal.subject')}</TableCell>
                  <TableCell>{t('portal.class')}</TableCell><TableCell>{t('portal.room')}</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {schedule.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noClassesScheduled')}</Typography>
                    </TableCell></TableRow>
                  ) : schedule.map((s, i) => (
                    <TableRow key={i} hover sx={S.TR_HOVER}>
                      <TableCell sx={S.TD}>{s.period ?? i + 1}</TableCell>
                      <TableCell sx={S.TD}>{s.time ?? '—'}</TableCell>
                      <TableCell sx={S.TD}><strong>{s.subject ?? '—'}</strong></TableCell>
                      <TableCell sx={S.TD}>{s.class ?? '—'}</TableCell>
                      <TableCell sx={S.TD}>{s.room ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.pendingTasks')}</Typography>
            <Paper sx={S.GLASS}>
              <List>
                {tasks.filter(tk => tk.status !== 'completed').length === 0 ? (
                  <ListItem><ListItemText primary={t('portal.noTasksPending')} /></ListItem>
                ) : tasks.filter(tk => tk.status !== 'completed').map(tk => (
                  <ListItem key={tk.id} divider sx={S.TR_HOVER}>
                    <ListItemIcon><TaskIcon color="warning" /></ListItemIcon>
                    <ListItemText
                      primary={tk.title}
                      secondary={tk.dueDate ? `${t('portal.due')}: ${new Date(tk.dueDate).toLocaleDateString()}` : tk.description || '—'}
                    />
                    <Chip label={tk.status} size="small" color={tk.status === 'in_progress' ? 'warning' : 'default'} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* TODAY'S SCHEDULE */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.todaysSchedule')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('portal.period')}</TableCell><TableCell>{t('portal.time')}</TableCell><TableCell>{t('portal.subject')}</TableCell>
              <TableCell>{t('portal.class')}</TableCell><TableCell>{t('portal.room')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {schedule.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noClassesScheduled')}</Typography>
                </TableCell></TableRow>
              ) : schedule.map((s, i) => (
                <TableRow key={i} hover sx={S.TR_HOVER}>
                  <TableCell sx={S.TD}>{s.period ?? i + 1}</TableCell>
                  <TableCell sx={S.TD}>{s.time ?? '—'}</TableCell>
                  <TableCell sx={S.TD}><strong>{s.subject ?? '—'}</strong></TableCell>
                  <TableCell sx={S.TD}>{s.class ?? '—'}</TableCell>
                  <TableCell sx={S.TD}>{s.room ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* MY CLASSES */}
      <TabPanel value={tab} index={2}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.classPerformance')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('portal.class')}</TableCell><TableCell>{t('portal.subject')}</TableCell><TableCell>{t('portal.students')}</TableCell>
              <TableCell>{t('portal.avgScore')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {performances.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noClassData')}</Typography>
                </TableCell></TableRow>
              ) : performances.map((p, i) => (
                <TableRow key={i} hover sx={S.TR_HOVER}>
                  <TableCell sx={S.TD}><strong>{p.class ?? '—'}</strong></TableCell>
                  <TableCell sx={S.TD}>{p.subject ?? '—'}</TableCell>
                  <TableCell sx={S.TD}>{p.students ?? '—'}</TableCell>
                  <TableCell sx={S.TD}>
                    {p.avgScore != null ? (
                      <Chip label={`${p.avgScore}%`} size="small" color={p.avgScore >= 60 ? 'success' : 'warning'} />
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* LESSON PLANS */}
      <TabPanel value={tab} index={3}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.lessonPlans')}</Typography>
        <Box sx={{ ...S.GLASS, p: 3, mb: 3 }}>
          <Typography variant="body1" gutterBottom>{t('portal.lessonPlanningDesc')}</Typography>
          <Button sx={{ ...S.BTN_PRIMARY, mt: 1 }} startIcon={<LessonIcon />} onClick={() => navigate('/teacher/lesson-planning')}>
            {t('portal.openLessonPlanning')}
          </Button>
        </Box>
      </TabPanel>

      {/* ASSIGNMENTS */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.assignments')}</Typography>
        <Box sx={{ ...S.GLASS, p: 3, mb: 3 }}>
          <Typography variant="body1" gutterBottom>{t('portal.assignmentDesc')}</Typography>
          <Button sx={{ ...S.BTN_PRIMARY, mt: 1 }} startIcon={<AssignmentIcon />} onClick={() => navigate('/teacher/assignments')}>
            {t('portal.openAssignmentMgmt')}
          </Button>
        </Box>
      </TabPanel>

      {/* PROFILE & LINKS */}
      <TabPanel value={tab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={600}>{t('portal.myProfile')}</Typography>
                <Chip label={profile?.role || t('roles.teacher')} color="primary" size="small" />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2"><strong>{t('portal.name')}:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
              <Typography variant="body2" mt={1}><strong>{t('portal.username')}:</strong> {profile?.username ?? user?.username}</Typography>
              <Typography variant="body2" mt={1}><strong>{t('portal.email')}:</strong> {profile?.email ?? user?.email ?? '—'}</Typography>
              <Typography variant="body2" mt={1}><strong>{t('portal.phoneLabel')}:</strong> {profile?.phoneNumber || '—'}</Typography>
              <Box mt={2}>
                <Button sx={S.BTN_OUTLINE} size="small" onClick={() => navigate('/communication/messages')}>{t('portal.contactAdmin')}</Button>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>{t('portal.quickLinks')}</Typography>
              <Divider sx={{ mb: 1 }} />
              <List dense>
                {[
                  { label: t('portal.openLessonPlanning'), path: '/teacher/lesson-planning', icon: <LessonIcon color="primary" /> },
                  { label: t('portal.assignments'), path: '/teacher/assignments', icon: <AssignmentIcon color="primary" /> },
                  { label: t('portal.gradeEntry'), path: '/examinations/grades', icon: <GradeIcon color="primary" /> },
                  { label: t('communication.messages'), path: '/communication/messages', icon: <MessageIcon color="primary" /> },
                  { label: t('menu.calendar'), path: '/calendar', icon: <CalendarIcon color="primary" /> },
                  { label: t('menu.documents'), path: '/documents', icon: <DocIcon color="primary" /> },
                ].map(l => (
                  <ListItem key={l.path} button onClick={() => navigate(l.path)} sx={S.TR_HOVER}>
                    <ListItemIcon>{l.icon}</ListItemIcon>
                    <ListItemText primary={l.label} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default TeacherPortal;

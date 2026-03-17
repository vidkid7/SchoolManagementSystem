import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip, useTheme,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  Description as DocIcon,
  Notifications as AnnouncementIcon,
  Person as PersonIcon,
  CheckCircle as PresentIcon,
  EventNote as AttendanceIcon,
  Assignment as AssignmentIcon,
  MenuBook as LessonIcon,
  Schedule as ScheduleIcon,
  TrendingUp as PerformanceIcon,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';
import { C, useAdminStyles } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';

interface DashboardData {
  totalStudents?: number;
  presentToday?: number;
  averageAttendance?: number;
  pendingTasks?: number;
  classes?: Array<{ id: number; name: string; section: string; studentCount: number }>;
  recentActivity?: Array<{ id: number; type: string; description: string; date: string }>;
}

interface ClassPerformance {
  className?: string;
  section?: string;
  averageScore?: number;
  topPerformer?: string;
  subjectWise?: Array<{ subject: string; average: number }>;
}

interface ScheduleEntry {
  id?: number;
  period?: number;
  subject?: string;
  className?: string;
  section?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
}

interface PendingTask {
  id: number;
  title: string;
  type: string;
  dueDate: string;
  status: string;
  priority?: string;
}

interface ProfileData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  status: string;
}

const authHdr = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>;
}

const ClassTeacherPortal: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [performance, setPerformance] = useState<ClassPerformance[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [dashRes, perfRes, schedRes, tasksRes] = await Promise.all([
        apiClient.get('/api/v1/teachers/dashboard', authHdr(accessToken)).catch(() => ({ data: { data: {} } })),
        apiClient.get('/api/v1/teachers/classes/performance', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/teachers/schedule/today', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/teachers/tasks/pending', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
      ]);
      const d = dashRes.data?.data;
      setDashboard(d || {});
      const perf = perfRes.data?.data;
      setPerformance(Array.isArray(perf) ? perf : perf?.classes ?? []);
      const sched = schedRes.data?.data;
      setSchedule(Array.isArray(sched) ? sched : sched?.schedule ?? []);
      const tasks = tasksRes.data?.data;
      setPendingTasks(Array.isArray(tasks) ? tasks : tasks?.tasks ?? []);
      // Try to get profile
      try {
        const profileRes = await apiClient.get('/api/v1/auth/me', authHdr(accessToken));
        setProfile(profileRes.data?.data ?? null);
      } catch { /* ignore */ }
    } catch {
      setError(t('portal.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  const totalStudents = dashboard.totalStudents ?? dashboard.classes?.reduce((s, c) => s + (c.studentCount || 0), 0) ?? 0;
  const presentToday = dashboard.presentToday ?? 0;
  const avgAttendance = dashboard.averageAttendance ?? 0;
  const pendingCount = dashboard.pendingTasks ?? pendingTasks.length;

  return (
    <Box sx={{ p: 3, mt: { xs: 7, sm: 8 } }}>
      <Paper sx={S.PAGE_HEADER}>
        <Box display="flex" alignItems="center" gap={2}>
          <SchoolIcon sx={{ fontSize: 32, color: C.primary }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{t('portal.classTeacherPortal')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('portal.welcome')}, {user?.firstName || user?.username} — {t('portal.classTeacher')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: t('portal.myStudents'), value: totalStudents, icon: <PeopleIcon />, color: C.primary },
          { label: t('portal.presentToday'), value: presentToday, icon: <PresentIcon />, color: C.success },
          { label: t('portal.averageAttendance'), value: `${avgAttendance}%`, icon: <AttendanceIcon />, color: C.info },
          { label: t('portal.pendingTasksCount'), value: pendingCount, icon: <PendingIcon />, color: C.warning },
        ].map(stat => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Box sx={S.STAT_CARD(stat.color)}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={S.ICON_BOX(stat.color, 36)}>{stat.icon}</Box>
                <Typography variant="h4" fontWeight={700}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<SchoolIcon />} iconPosition="start" label={t('portal.classOverview')} />
        <Tab icon={<AttendanceIcon />} iconPosition="start" label={t('portal.attendanceOverview')} />
        <Tab icon={<AssignmentIcon />} iconPosition="start" label={t('portal.assignments')} />
        <Tab icon={<LessonIcon />} iconPosition="start" label={t('portal.lessonPlans')} />
        <Tab icon={<MessageIcon />} iconPosition="start" label={t('communication.messages')} />
        <Tab icon={<PersonIcon />} iconPosition="start" label={t('portal.profileAndLinks')} />
      </Tabs>

      {/* Class Overview */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.classPerformance')}</Typography>
        {performance.length > 0 ? (
          <TableContainer component={Paper} sx={{ ...S.GLASS, mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: S.TH_BG }}>
                  <TableCell>{t('common.class')}</TableCell>
                  <TableCell>{t('common.section')}</TableCell>
                  <TableCell>{t('portal.averageScore')}</TableCell>
                  <TableCell>{t('portal.topPerformer')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {performance.map((p, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{p.className || '—'}</TableCell>
                    <TableCell>{p.section || '—'}</TableCell>
                    <TableCell><Chip label={`${p.averageScore ?? 0}%`} size="small" color={Number(p.averageScore) >= 70 ? 'success' : 'warning'} /></TableCell>
                    <TableCell>{p.topPerformer || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>{t('portal.noClassPerformanceData')}</Alert>
        )}

        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.todaysSchedule')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell>{t('portal.period')}</TableCell>
                <TableCell>{t('common.subject')}</TableCell>
                <TableCell>{t('common.class')}</TableCell>
                <TableCell>{t('common.time')}</TableCell>
                <TableCell>{t('portal.room')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedule.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noClassesScheduledToday')}</Typography></TableCell></TableRow>
              ) : schedule.map((s, i) => (
                <TableRow key={i} hover>
                  <TableCell>{s.period || i + 1}</TableCell>
                  <TableCell><strong>{s.subject || '—'}</strong></TableCell>
                  <TableCell>{s.className || '—'} {s.section || ''}</TableCell>
                  <TableCell>{s.startTime || '—'} - {s.endTime || '—'}</TableCell>
                  <TableCell>{s.room || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Attendance */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.attendanceOverview')}</Typography>
        <Box sx={{ ...S.GLASS, p: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">{t('portal.totalStudents')}</Typography>
                <Typography variant="h5" fontWeight={700}>{totalStudents}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">{t('portal.presentToday')}</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">{presentToday}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">{t('portal.absentToday')}</Typography>
                <Typography variant="h5" fontWeight={700} color="error.main">{totalStudents - presentToday}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">{t('portal.avgAttendance')}</Typography>
                <Typography variant="h5" fontWeight={700} color="info.main">{avgAttendance}%</Typography>
              </Grid>
            </Grid>
        </Box>
        <Button sx={S.BTN_PRIMARY} startIcon={<AttendanceIcon />} onClick={() => navigate('/attendance/mark')}>
          {t('portal.markAttendance')}
        </Button>
      </TabPanel>

      {/* Assignments */}
      <TabPanel value={tab} index={2}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.assignments')}</Typography>
        <Box sx={{ ...S.GLASS, p: 3, mb: 3 }}>
            <Typography variant="body1" mb={2}>
              {t('portal.assignmentsDesc')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t('portal.pendingTasksCount')}: <strong>{pendingTasks.filter(t => t.type === 'assignment').length}</strong> {t('portal.assignmentsToReview')}
            </Typography>
            <Button sx={S.BTN_PRIMARY} startIcon={<AssignmentIcon />} onClick={() => navigate('/teacher/assignments')}>
              {t('portal.goToAssignments')}
            </Button>
        </Box>
        {pendingTasks.filter(t => t.type === 'assignment').length > 0 && (
          <TableContainer component={Paper} sx={S.GLASS}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: S.TH_BG }}>
                  <TableCell>{t('common.title')}</TableCell>
                  <TableCell>{t('portal.dueDate')}</TableCell>
                  <TableCell>{t('common.priority')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingTasks.filter(t => t.type === 'assignment').map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell><strong>{t.title}</strong></TableCell>
                    <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell>
                      <Chip label={t.priority || 'normal'} size="small"
                        color={t.priority === 'high' ? 'error' : t.priority === 'medium' ? 'warning' : 'default'} />
                    </TableCell>
                    <TableCell><Chip label={t.status} size="small" color="warning" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Lesson Plans */}
      <TabPanel value={tab} index={3}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.lessonPlans')}</Typography>
        <Box sx={{ ...S.GLASS, p: 3, mb: 3 }}>
            <Typography variant="body1" mb={2}>
              {t('portal.lessonPlansDesc')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t('portal.lessonPlansCoverageHint')}
            </Typography>
            <Button sx={S.BTN_PRIMARY} startIcon={<LessonIcon />} onClick={() => navigate('/teacher/lesson-planning')}>
              {t('portal.goToLessonPlanning')}
            </Button>
        </Box>
      </TabPanel>

      {/* Communication */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.communication')}</Typography>
        <Grid container spacing={2}>
          {[
            { label: t('communication.messages'), desc: t('portal.messagesDesc'), path: '/communication/messages', icon: <MessageIcon sx={{ fontSize: 40, color: C.primary }} /> },
            { label: t('communication.announcements'), desc: t('portal.announcementsDesc'), path: '/communication/announcements', icon: <AnnouncementIcon sx={{ fontSize: 40, color: C.primary }} /> },
          ].map(item => (
            <Grid item xs={12} sm={6} key={item.label}>
              <Box sx={{ ...S.GLASS, p: 3, cursor: 'pointer', textAlign: 'center' }} onClick={() => navigate(item.path)}>
                  {item.icon}
                  <Typography variant="subtitle1" fontWeight={600} mt={1}>{item.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Profile & Links */}
      <TabPanel value={tab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>{t('portal.myProfile')}</Typography>
                  <Chip label={profile?.role || t('portal.classTeacher')} color="primary" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>{t('common.name')}:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.username')}:</strong> {profile?.username ?? user?.username}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.email')}:</strong> {profile?.email ?? user?.email ?? '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.phone')}:</strong> {profile?.phoneNumber || '—'}</Typography>
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
                    { label: t('portal.myClasses'), path: '/teacher/classes', icon: <SchoolIcon color="primary" /> },
                    { label: t('portal.attendance'), path: '/attendance/mark', icon: <AttendanceIcon color="primary" /> },
                    { label: t('portal.assignments'), path: '/teacher/assignments', icon: <AssignmentIcon color="primary" /> },
                    { label: t('portal.lessonPlans'), path: '/teacher/lesson-planning', icon: <LessonIcon color="primary" /> },
                    { label: t('communication.messages'), path: '/communication/messages', icon: <MessageIcon color="primary" /> },
                    { label: t('menu.calendar'), path: '/calendar', icon: <CalendarIcon color="primary" /> },
                  ].map(l => (
                    <ListItem key={l.path} button onClick={() => navigate(l.path)}>
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

export default ClassTeacherPortal;

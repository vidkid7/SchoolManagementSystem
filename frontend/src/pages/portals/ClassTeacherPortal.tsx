import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip,
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
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';

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
  const [tab, setTab] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [performance, setPerformance] = useState<ClassPerformance[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

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
        const profileRes = await apiClient.get('/api/v1/users/me', authHdr(accessToken));
        setProfile(profileRes.data?.data ?? null);
      } catch { /* ignore */ }
    } catch {
      setError('Failed to load class teacher dashboard');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  const totalStudents = dashboard.totalStudents ?? dashboard.classes?.reduce((s, c) => s + (c.studentCount || 0), 0) ?? 0;
  const presentToday = dashboard.presentToday ?? 0;
  const avgAttendance = dashboard.averageAttendance ?? 0;
  const pendingCount = dashboard.pendingTasks ?? pendingTasks.length;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          <SchoolIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>Class Teacher Portal</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user?.firstName || user?.username} — Class Teacher
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'My Students', value: totalStudents, icon: <PeopleIcon />, color: 'primary.main' },
          { label: 'Present Today', value: presentToday, icon: <PresentIcon />, color: 'success.main' },
          { label: 'Average Attendance', value: `${avgAttendance}%`, icon: <AttendanceIcon />, color: 'info.main' },
          { label: 'Pending Tasks', value: pendingCount, icon: <PendingIcon />, color: 'warning.main' },
        ].map(stat => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ color: stat.color, fontSize: 32 }}>{stat.icon}</Box>
                <Typography variant="h4" fontWeight={700}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<SchoolIcon />} iconPosition="start" label="Class Overview" />
        <Tab icon={<AttendanceIcon />} iconPosition="start" label="Attendance" />
        <Tab icon={<AssignmentIcon />} iconPosition="start" label="Assignments" />
        <Tab icon={<LessonIcon />} iconPosition="start" label="Lesson Plans" />
        <Tab icon={<MessageIcon />} iconPosition="start" label="Communication" />
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile & Links" />
      </Tabs>

      {/* Class Overview */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>Class Performance</Typography>
        {performance.length > 0 ? (
          <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Class</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Average Score</TableCell>
                  <TableCell>Top Performer</TableCell>
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
          <Alert severity="info" sx={{ mb: 3 }}>No class performance data available.</Alert>
        )}

        <Typography variant="h6" fontWeight={600} mb={2}>Today&apos;s Schedule</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Period</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Room</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedule.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No classes scheduled for today.</Typography></TableCell></TableRow>
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
        <Typography variant="h6" fontWeight={600} mb={2}>Attendance Overview</Typography>
        <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Total Students</Typography>
                <Typography variant="h5" fontWeight={700}>{totalStudents}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Present Today</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">{presentToday}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Absent Today</Typography>
                <Typography variant="h5" fontWeight={700} color="error.main">{totalStudents - presentToday}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Avg Attendance</Typography>
                <Typography variant="h5" fontWeight={700} color="info.main">{avgAttendance}%</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Button variant="contained" startIcon={<AttendanceIcon />} onClick={() => navigate('/attendance/marking')}>
          Mark Attendance
        </Button>
      </TabPanel>

      {/* Assignments */}
      <TabPanel value={tab} index={2}>
        <Typography variant="h6" fontWeight={600} mb={2}>Assignments</Typography>
        <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
          <CardContent>
            <Typography variant="body1" mb={2}>
              Manage and track student assignments, submissions, and grading.
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Pending tasks: <strong>{pendingTasks.filter(t => t.type === 'assignment').length}</strong> assignments to review
            </Typography>
            <Button variant="contained" startIcon={<AssignmentIcon />} onClick={() => navigate('/teacher/assignments')}>
              Go to Assignments
            </Button>
          </CardContent>
        </Card>
        {pendingTasks.filter(t => t.type === 'assignment').length > 0 && (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Title</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
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
        <Typography variant="h6" fontWeight={600} mb={2}>Lesson Plans</Typography>
        <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
          <CardContent>
            <Typography variant="body1" mb={2}>
              Create, manage, and organize lesson plans for your classes.
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Plan ahead and ensure curriculum coverage for all subjects.
            </Typography>
            <Button variant="contained" startIcon={<LessonIcon />} onClick={() => navigate('/teacher/lesson-planning')}>
              Go to Lesson Planning
            </Button>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Communication */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={600} mb={2}>Communication</Typography>
        <Grid container spacing={2}>
          {[
            { label: 'Messages', desc: 'Send and receive messages from parents, staff, and admin', path: '/communication/messages', icon: <MessageIcon sx={{ fontSize: 40, color: 'primary.main' }} /> },
            { label: 'Announcements', desc: 'View and create class announcements', path: '/communication/announcements', icon: <AnnouncementIcon sx={{ fontSize: 40, color: 'primary.main' }} /> },
          ].map(item => (
            <Grid item xs={12} sm={6} key={item.label}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, cursor: 'pointer' }} onClick={() => navigate(item.path)}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  {item.icon}
                  <Typography variant="subtitle1" fontWeight={600} mt={1}>{item.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Profile & Links */}
      <TabPanel value={tab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>My Profile</Typography>
                  <Chip label={profile?.role || 'Class Teacher'} color="primary" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>Name:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>Username:</strong> {profile?.username ?? user?.username}</Typography>
                <Typography variant="body2" mt={1}><strong>Email:</strong> {profile?.email ?? user?.email ?? '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>Phone:</strong> {profile?.phoneNumber || '—'}</Typography>
                <Box mt={2}>
                  <Button variant="outlined" color="primary" size="small" onClick={() => navigate('/communication/messages')}>Contact Admin</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Quick Links</Typography>
                <Divider sx={{ mb: 1 }} />
                <List dense>
                  {[
                    { label: 'My Classes', path: '/teacher/classes', icon: <SchoolIcon color="primary" /> },
                    { label: 'Attendance', path: '/attendance/marking', icon: <AttendanceIcon color="primary" /> },
                    { label: 'Assignments', path: '/teacher/assignments', icon: <AssignmentIcon color="primary" /> },
                    { label: 'Lesson Plans', path: '/teacher/lesson-planning', icon: <LessonIcon color="primary" /> },
                    { label: 'Messages', path: '/communication/messages', icon: <MessageIcon color="primary" /> },
                    { label: 'Calendar', path: '/calendar', icon: <CalendarIcon color="primary" /> },
                  ].map(l => (
                    <ListItem key={l.path} button onClick={() => navigate(l.path)}>
                      <ListItemIcon>{l.icon}</ListItemIcon>
                      <ListItemText primary={l.label} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default ClassTeacherPortal;

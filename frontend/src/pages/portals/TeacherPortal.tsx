import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
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
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';

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
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

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
      setError('Failed to load teacher dashboard');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  const stats = data?.stats ?? {};
  const schedule = data?.schedule ?? [];
  const tasks = data?.tasks ?? [];
  const performances = data?.performances ?? [];
  const profile = data?.profile;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          <TeacherIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>Teacher Portal</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user?.firstName || user?.username} — Teacher
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Today's Classes", value: stats.todayClasses ?? 0, icon: <ScheduleIcon />, color: 'primary.main' },
          { label: 'Pending Tasks', value: stats.pendingTasks ?? 0, icon: <TaskIcon />, color: 'warning.main' },
          { label: 'Total Students', value: stats.totalStudents ?? 0, icon: <StudentsIcon />, color: 'info.main' },
          { label: 'Completed Lessons', value: stats.completedLessons ?? 0, icon: <DoneIcon />, color: 'success.main' },
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
        <Tab icon={<TeacherIcon />} iconPosition="start" label="Dashboard" />
        <Tab icon={<ScheduleIcon />} iconPosition="start" label="Today's Schedule" />
        <Tab icon={<ClassIcon />} iconPosition="start" label="My Classes" />
        <Tab icon={<LessonIcon />} iconPosition="start" label="Lesson Plans" />
        <Tab icon={<AssignmentIcon />} iconPosition="start" label="Assignments" />
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile & Links" />
      </Tabs>

      {/* DASHBOARD */}
      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Typography variant="h6" fontWeight={600} mb={2}>Today's Schedule</Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Period</TableCell><TableCell>Time</TableCell><TableCell>Subject</TableCell>
                  <TableCell>Class</TableCell><TableCell>Room</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {schedule.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No classes scheduled for today.</Typography>
                    </TableCell></TableRow>
                  ) : schedule.map((s, i) => (
                    <TableRow key={i} hover>
                      <TableCell>{s.period ?? i + 1}</TableCell>
                      <TableCell>{s.time ?? '—'}</TableCell>
                      <TableCell><strong>{s.subject ?? '—'}</strong></TableCell>
                      <TableCell>{s.class ?? '—'}</TableCell>
                      <TableCell>{s.room ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography variant="h6" fontWeight={600} mb={2}>Pending Tasks</Typography>
            <Paper sx={{ borderRadius: 2 }}>
              <List>
                {tasks.filter(t => t.status !== 'completed').length === 0 ? (
                  <ListItem><ListItemText primary="No pending tasks." /></ListItem>
                ) : tasks.filter(t => t.status !== 'completed').map(t => (
                  <ListItem key={t.id} divider>
                    <ListItemIcon><TaskIcon color="warning" /></ListItemIcon>
                    <ListItemText
                      primary={t.title}
                      secondary={t.dueDate ? `Due: ${new Date(t.dueDate).toLocaleDateString()}` : t.description || '—'}
                    />
                    <Chip label={t.status} size="small" color={t.status === 'in_progress' ? 'warning' : 'default'} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* TODAY'S SCHEDULE */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>Today's Schedule</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Period</TableCell><TableCell>Time</TableCell><TableCell>Subject</TableCell>
              <TableCell>Class</TableCell><TableCell>Room</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {schedule.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No classes scheduled for today.</Typography>
                </TableCell></TableRow>
              ) : schedule.map((s, i) => (
                <TableRow key={i} hover>
                  <TableCell>{s.period ?? i + 1}</TableCell>
                  <TableCell>{s.time ?? '—'}</TableCell>
                  <TableCell><strong>{s.subject ?? '—'}</strong></TableCell>
                  <TableCell>{s.class ?? '—'}</TableCell>
                  <TableCell>{s.room ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* MY CLASSES */}
      <TabPanel value={tab} index={2}>
        <Typography variant="h6" fontWeight={600} mb={2}>Class Performance</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Class</TableCell><TableCell>Subject</TableCell><TableCell>Students</TableCell>
              <TableCell>Avg Score</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {performances.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No class data available.</Typography>
                </TableCell></TableRow>
              ) : performances.map((p, i) => (
                <TableRow key={i} hover>
                  <TableCell><strong>{p.class ?? '—'}</strong></TableCell>
                  <TableCell>{p.subject ?? '—'}</TableCell>
                  <TableCell>{p.students ?? '—'}</TableCell>
                  <TableCell>
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
        <Typography variant="h6" fontWeight={600} mb={2}>Lesson Plans</Typography>
        <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
          <CardContent>
            <Typography variant="body1" gutterBottom>
              Create and manage your lesson plans with syllabus tracking.
            </Typography>
            <Button variant="contained" startIcon={<LessonIcon />} onClick={() => navigate('/teacher/lesson-planning')} sx={{ mt: 1 }}>
              Open Lesson Planning
            </Button>
          </CardContent>
        </Card>
      </TabPanel>

      {/* ASSIGNMENTS */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={600} mb={2}>Assignments</Typography>
        <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
          <CardContent>
            <Typography variant="body1" gutterBottom>
              Create assignments, view submissions, and grade student work.
            </Typography>
            <Button variant="contained" startIcon={<AssignmentIcon />} onClick={() => navigate('/teacher/assignments')} sx={{ mt: 1 }}>
              Open Assignment Management
            </Button>
          </CardContent>
        </Card>
      </TabPanel>

      {/* PROFILE & LINKS */}
      <TabPanel value={tab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>My Profile</Typography>
                  <Chip label={profile?.role || 'Teacher'} color="primary" size="small" />
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
                    { label: 'Lesson Planning', path: '/teacher/lesson-planning', icon: <LessonIcon color="primary" /> },
                    { label: 'Assignments', path: '/teacher/assignments', icon: <AssignmentIcon color="primary" /> },
                    { label: 'Grade Entry', path: '/examinations/grades', icon: <GradeIcon color="primary" /> },
                    { label: 'Messages', path: '/communication/messages', icon: <MessageIcon color="primary" /> },
                    { label: 'Calendar', path: '/calendar', icon: <CalendarIcon color="primary" /> },
                    { label: 'Documents', path: '/documents', icon: <DocIcon color="primary" /> },
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

export default TeacherPortal;

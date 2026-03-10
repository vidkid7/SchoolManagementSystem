import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip,
} from '@mui/material';
import {
  Business as DeptIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  Description as DocIcon,
  Notifications as AnnouncementIcon,
  Person as PersonIcon,
  TrendingUp as PerformanceIcon,
  MenuBook as LessonIcon,
  Assessment as ReportIcon,
  School as ClassIcon,
  PendingActions as PendingIcon,
  SupervisorAccount as TeacherIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';

interface DashboardData {
  departmentTeachers?: number;
  totalClasses?: number;
  avgPerformance?: number;
  pendingReviews?: number;
  teachers?: Array<{ id: number; name: string; firstName?: string; lastName?: string; subject?: string; classes?: number; status?: string }>;
  department?: { name: string; head?: string };
}

interface TeacherStats {
  totalTeachers?: number;
  activeTeachers?: number;
  onLeave?: number;
}

interface ClassPerformance {
  className?: string;
  section?: string;
  subject?: string;
  averageScore?: number;
  teacher?: string;
  studentCount?: number;
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

const DepartmentHeadPortal: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [teacherStats, setTeacherStats] = useState<TeacherStats>({});
  const [performance, setPerformance] = useState<ClassPerformance[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [dashRes, statsRes, perfRes] = await Promise.all([
        apiClient.get('/api/v1/teachers/dashboard', authHdr(accessToken)).catch(() => ({ data: { data: {} } })),
        apiClient.get('/api/v1/teachers/stats', authHdr(accessToken)).catch(() => ({ data: { data: {} } })),
        apiClient.get('/api/v1/teachers/classes/performance', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
      ]);
      const d = dashRes.data?.data;
      setDashboard(d || {});
      const s = statsRes.data?.data;
      setTeacherStats(s || {});
      const perf = perfRes.data?.data;
      setPerformance(Array.isArray(perf) ? perf : perf?.classes ?? []);
      // Try to get profile
      try {
        const profileRes = await apiClient.get('/api/v1/users/me', authHdr(accessToken));
        setProfile(profileRes.data?.data ?? null);
      } catch { /* ignore */ }
    } catch {
      setError('Failed to load department dashboard');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  const deptTeachers = dashboard.departmentTeachers ?? teacherStats.totalTeachers ?? dashboard.teachers?.length ?? 0;
  const totalClasses = dashboard.totalClasses ?? 0;
  const avgPerf = dashboard.avgPerformance ?? 0;
  const pendingReviews = dashboard.pendingReviews ?? 0;
  const teachers = dashboard.teachers ?? [];

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
          <DeptIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>Department Head Portal</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user?.firstName || user?.username} — {dashboard.department?.name || 'Department Head'}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Department Teachers', value: deptTeachers, icon: <TeacherIcon />, color: 'secondary.main' },
          { label: 'Total Classes', value: totalClasses, icon: <ClassIcon />, color: 'primary.main' },
          { label: 'Avg Performance', value: `${avgPerf}%`, icon: <PerformanceIcon />, color: 'success.main' },
          { label: 'Pending Reviews', value: pendingReviews, icon: <PendingIcon />, color: 'warning.main' },
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
        <Tab icon={<DeptIcon />} iconPosition="start" label="Department Overview" />
        <Tab icon={<TeacherIcon />} iconPosition="start" label="Teachers" />
        <Tab icon={<PerformanceIcon />} iconPosition="start" label="Performance" />
        <Tab icon={<LessonIcon />} iconPosition="start" label="Lesson Plans" />
        <Tab icon={<MessageIcon />} iconPosition="start" label="Communication" />
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile & Links" />
      </Tabs>

      {/* Department Overview */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>Department Summary</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Staff Overview</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>Total Teachers:</strong> {teacherStats.totalTeachers ?? deptTeachers}</Typography>
                <Typography variant="body2" mt={1}><strong>Active:</strong> {teacherStats.activeTeachers ?? deptTeachers}</Typography>
                <Typography variant="body2" mt={1}><strong>On Leave:</strong> {teacherStats.onLeave ?? 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Quick Actions</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button variant="outlined" size="small" onClick={() => navigate('/staff')}>View All Staff</Button>
                  <Button variant="outlined" size="small" onClick={() => navigate('/reports')}>Department Reports</Button>
                  <Button variant="outlined" size="small" onClick={() => navigate('/teacher/lesson-planning')}>Review Lesson Plans</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {teachers.length > 0 && (
          <>
            <Typography variant="h6" fontWeight={600} mb={2}>Department Teachers</Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>Name</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Classes</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teachers.map(t => (
                    <TableRow key={t.id} hover>
                      <TableCell><strong>{t.name || `${t.firstName || ''} ${t.lastName || ''}`}</strong></TableCell>
                      <TableCell>{t.subject || '—'}</TableCell>
                      <TableCell>{t.classes ?? '—'}</TableCell>
                      <TableCell>
                        <Chip label={t.status || 'active'} size="small"
                          color={t.status === 'active' || !t.status ? 'success' : 'default'} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </TabPanel>

      {/* Teachers */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>Department Teachers</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Name</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Classes</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No teacher data available.</Typography></TableCell></TableRow>
              ) : teachers.map(t => (
                <TableRow key={t.id} hover>
                  <TableCell><strong>{t.name || `${t.firstName || ''} ${t.lastName || ''}`}</strong></TableCell>
                  <TableCell>{t.subject || '—'}</TableCell>
                  <TableCell>{t.classes ?? '—'}</TableCell>
                  <TableCell>
                    <Chip label={t.status || 'active'} size="small"
                      color={t.status === 'active' || !t.status ? 'success' : 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Performance */}
      <TabPanel value={tab} index={2}>
        <Typography variant="h6" fontWeight={600} mb={2}>Class Performance</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Class</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Average Score</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Students</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {performance.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No performance data available.</Typography></TableCell></TableRow>
              ) : performance.map((p, i) => (
                <TableRow key={i} hover>
                  <TableCell>{p.className || '—'}</TableCell>
                  <TableCell>{p.section || '—'}</TableCell>
                  <TableCell>{p.subject || '—'}</TableCell>
                  <TableCell>
                    <Chip label={`${p.averageScore ?? 0}%`} size="small"
                      color={Number(p.averageScore) >= 70 ? 'success' : Number(p.averageScore) >= 50 ? 'warning' : 'error'} />
                  </TableCell>
                  <TableCell>{p.teacher || '—'}</TableCell>
                  <TableCell>{p.studentCount ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Lesson Plans */}
      <TabPanel value={tab} index={3}>
        <Typography variant="h6" fontWeight={600} mb={2}>Lesson Plans Review</Typography>
        <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
          <CardContent>
            <Typography variant="body1" mb={2}>
              Review and approve lesson plans submitted by department teachers.
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Ensure curriculum alignment and quality of lesson planning across the department.
            </Typography>
            <Button variant="contained" startIcon={<LessonIcon />} onClick={() => navigate('/teacher/lesson-planning')}>
              Review Lesson Plans
            </Button>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Communication */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={600} mb={2}>Communication</Typography>
        <Grid container spacing={2}>
          {[
            { label: 'Messages', desc: 'Communicate with teachers, staff, and admin', path: '/communication/messages', icon: <MessageIcon sx={{ fontSize: 40, color: 'secondary.main' }} /> },
            { label: 'Announcements', desc: 'View and create department announcements', path: '/communication/announcements', icon: <AnnouncementIcon sx={{ fontSize: 40, color: 'secondary.main' }} /> },
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
                  <Chip label={profile?.role || 'Department Head'} color="secondary" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>Name:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>Username:</strong> {profile?.username ?? user?.username}</Typography>
                <Typography variant="body2" mt={1}><strong>Email:</strong> {profile?.email ?? user?.email ?? '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>Phone:</strong> {profile?.phoneNumber || '—'}</Typography>
                <Box mt={2}>
                  <Button variant="outlined" color="secondary" size="small" onClick={() => navigate('/communication/messages')}>Contact Admin</Button>
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
                    { label: 'Staff', path: '/staff', icon: <TeacherIcon color="secondary" /> },
                    { label: 'Reports', path: '/reports', icon: <ReportIcon color="secondary" /> },
                    { label: 'Messages', path: '/communication/messages', icon: <MessageIcon color="secondary" /> },
                    { label: 'Calendar', path: '/calendar', icon: <CalendarIcon color="secondary" /> },
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

export default DepartmentHeadPortal;

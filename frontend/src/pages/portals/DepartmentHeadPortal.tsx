import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip, useTheme,
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
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';
import { C, useAdminStyles } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardData>({});
  const [teacherStats, setTeacherStats] = useState<TeacherStats>({});
  const [performance, setPerformance] = useState<ClassPerformance[]>([]);
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
          <Typography variant="h4" fontWeight={700}>{t('portal.departmentHeadPortal')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('portal.welcome')}, {user?.firstName || user?.username} — {dashboard.department?.name || t('portal.departmentHead')}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: t('portal.totalTeachers'), value: deptTeachers, icon: <TeacherIcon />, color: C.purple },
          { label: t('portal.totalClasses'), value: totalClasses, icon: <ClassIcon />, color: C.primary },
          { label: t('portal.avgPerformance'), value: `${avgPerf}%`, icon: <PerformanceIcon />, color: C.success },
          { label: t('portal.pendingReviews'), value: pendingReviews, icon: <PendingIcon />, color: C.warning },
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
        <Tab icon={<DeptIcon />} iconPosition="start" label={t('portal.departmentOverview')} />
        <Tab icon={<TeacherIcon />} iconPosition="start" label={t('portal.teachers')} />
        <Tab icon={<PerformanceIcon />} iconPosition="start" label={t('portal.performance')} />
        <Tab icon={<LessonIcon />} iconPosition="start" label={t('portal.lessonPlans')} />
        <Tab icon={<MessageIcon />} iconPosition="start" label={t('communication.messages')} />
        <Tab icon={<PersonIcon />} iconPosition="start" label={t('portal.profileAndLinks')} />
      </Tabs>

      {/* Department Overview */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.departmentSummary')}</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>{t('portal.staffOverview')}</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>{t('portal.totalTeachers')}:</strong> {teacherStats.totalTeachers ?? deptTeachers}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.active')}:</strong> {teacherStats.activeTeachers ?? deptTeachers}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.onLeave')}:</strong> {teacherStats.onLeave ?? 0}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>{t('portal.quickActions')}</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button sx={S.BTN_OUTLINE} size="small" onClick={() => navigate('/staff')}>{t('portal.viewAllStaff')}</Button>
                  <Button sx={S.BTN_OUTLINE} size="small" onClick={() => navigate('/reports')}>{t('portal.departmentReports')}</Button>
                  <Button sx={S.BTN_OUTLINE} size="small" onClick={() => navigate('/teacher/lesson-planning')}>{t('portal.reviewLessonPlans')}</Button>
                </Box>
            </Box>
          </Grid>
        </Grid>

        {teachers.length > 0 && (
          <>
            <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.departmentTeachers')}</Typography>            <TableContainer component={Paper} sx={S.GLASS}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: S.TH_BG }}>
                    <TableCell>{t('common.name')}</TableCell>
                    <TableCell>{t('common.subject')}</TableCell>
                    <TableCell>{t('portal.classes')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
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
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.departmentTeachers')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell>{t('common.name')}</TableCell>
                <TableCell>{t('common.subject')}</TableCell>
                <TableCell>{t('portal.classes')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noTeacherData')}</Typography></TableCell></TableRow>
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
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.classPerformance')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell>{t('common.class')}</TableCell>
                <TableCell>{t('common.section')}</TableCell>
                <TableCell>{t('common.subject')}</TableCell>
                <TableCell>{t('portal.averageScore')}</TableCell>
                <TableCell>{t('portal.teacher')}</TableCell>
                <TableCell>{t('portal.students')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {performance.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noPerformanceData')}</Typography></TableCell></TableRow>
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
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.lessonPlansReview')}</Typography>
        <Box sx={{ ...S.GLASS, p: 3, mb: 3 }}>
            <Typography variant="body1" mb={2}>
              {t('portal.lessonPlansReviewDesc')}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t('portal.lessonPlansReviewHint')}
            </Typography>
            <Button sx={S.BTN_PRIMARY} startIcon={<LessonIcon />} onClick={() => navigate('/teacher/lesson-planning')}>
              {t('portal.reviewLessonPlans')}
            </Button>
        </Box>
      </TabPanel>

      {/* Communication */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.communication')}</Typography>
        <Grid container spacing={2}>
          {[
            { label: t('communication.messages'), desc: t('portal.deptMessagesDesc'), path: '/communication/messages', icon: <MessageIcon sx={{ fontSize: 40, color: C.purple }} /> },
            { label: t('communication.announcements'), desc: t('portal.deptAnnouncementsDesc'), path: '/communication/announcements', icon: <AnnouncementIcon sx={{ fontSize: 40, color: C.purple }} /> },
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
                  <Chip label={profile?.role || t('portal.departmentHead')} color="secondary" size="small" />
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
                    { label: t('portal.staff'), path: '/staff', icon: <TeacherIcon color="secondary" /> },
                    { label: t('portal.reports'), path: '/reports', icon: <ReportIcon color="secondary" /> },
                    { label: t('communication.messages'), path: '/communication/messages', icon: <MessageIcon color="secondary" /> },
                    { label: t('menu.calendar'), path: '/calendar', icon: <CalendarIcon color="secondary" /> },
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

export default DepartmentHeadPortal;

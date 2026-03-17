import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip, useTheme,
} from '@mui/material';
import {
  Palette as ECAIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  Event as EventIcon,
  EmojiEvents as AchievementIcon,
  GroupAdd as EnrollIcon,
  Category as ActivityIcon,
  Notifications as AnnouncementIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';
import { C, useAdminStyles } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';

interface ECAStats {
  activeActivities: number;
  enrolledStudents: number;
  upcomingEvents: number;
  achievements: number;
}

interface Activity {
  id: number;
  name: string;
  category?: string;
  status?: string;
  enrolledCount?: number;
  description?: string;
  schedule?: string;
  instructor?: string;
}

interface ECAEvent {
  id: number;
  title: string;
  activity?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  status?: string;
  description?: string;
}

interface Achievement {
  id: number;
  title: string;
  activity?: string;
  student?: string;
  date?: string;
  category?: string;
  description?: string;
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

const ECACoordinatorPortal: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<ECAStats>({ activeActivities: 0, enrolledStudents: 0, upcomingEvents: 0, achievements: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<ECAEvent[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);

  const loadData = useCallback(async () => {
    if (!accessToken) { setLoading(false); return; }
    try {
      const [statsRes, activitiesRes, eventsRes, achievementsRes, profileRes] = await Promise.all([
        apiClient.get('/api/v1/eca/statistics', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
        apiClient.get('/api/v1/eca?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/eca/events?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/eca/achievements?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/auth/me', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
      ]);
      const s = statsRes.data?.data;
      if (s) {
        setStats({
          activeActivities: s.activeActivities ?? s.totalActivities ?? 0,
          enrolledStudents: s.enrolledStudents ?? s.totalStudents ?? 0,
          upcomingEvents: s.upcomingEvents ?? 0,
          achievements: s.achievements ?? s.totalAchievements ?? 0,
        });
      }
      const act = activitiesRes.data?.data;
      setActivities(Array.isArray(act) ? act : act?.activities ?? []);
      const ev = eventsRes.data?.data;
      setEvents(Array.isArray(ev) ? ev : ev?.events ?? []);
      const ac = achievementsRes.data?.data;
      setAchievements(Array.isArray(ac) ? ac : ac?.achievements ?? []);
      setProfile(profileRes.data?.data ?? null);
    } catch {
      setError(t('portal.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, mt: { xs: 7, sm: 8 } }}>
      {/* Header */}
      <Paper sx={S.PAGE_HEADER}>
        <Box display="flex" alignItems="center" gap={2}>
          <ECAIcon sx={{ fontSize: 32, color: C.info }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{t('portal.ecaCoordinatorPortal')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('portal.welcome')}, {user?.firstName || user?.username} — {t('portal.extraCurricularActivities')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: t('portal.activeActivities'), value: stats.activeActivities, icon: <ActivityIcon />, color: C.info },
          { label: t('portal.enrolledStudents'), value: stats.enrolledStudents, icon: <PeopleIcon />, color: C.primary },
          { label: t('portal.upcomingEventsCount'), value: stats.upcomingEvents, icon: <EventIcon />, color: C.warning },
          { label: t('portal.achievementsCount'), value: stats.achievements, icon: <AchievementIcon />, color: C.success },
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
        <Tab icon={<ECAIcon />} iconPosition="start" label={t('portal.dashboard')} />
        <Tab icon={<ActivityIcon />} iconPosition="start" label={t('portal.activities')} />
        <Tab icon={<EnrollIcon />} iconPosition="start" label={t('portal.enrolledStudents')} />
        <Tab icon={<EventIcon />} iconPosition="start" label={t('portal.events')} />
        <Tab icon={<AchievementIcon />} iconPosition="start" label={t('portal.achievementsCount')} />
        <Tab icon={<PersonIcon />} iconPosition="start" label={t('portal.profileAndLinks')} />
      </Tabs>

      {/* Dashboard */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.ecaOverview')}</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>{t('portal.recentActivities')}</Typography>
                <Divider sx={{ mb: 2 }} />
                {activities.slice(0, 5).length > 0 ? activities.slice(0, 5).map(a => (
                  <Box key={a.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box>
                      <Typography variant="body2"><strong>{a.name}</strong></Typography>
                      <Typography variant="caption" color="text.secondary">{a.category || 'General'}</Typography>
                    </Box>
                    <Chip label={a.status || 'active'} size="small"
                      color={a.status === 'active' || !a.status ? 'success' : 'default'} />
                  </Box>
                )) : (
                  <Typography variant="body2" color="text.secondary">{t('portal.noActivitiesData')}</Typography>
                )}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>{t('portal.upcomingEvents')}</Typography>
                <Divider sx={{ mb: 2 }} />
                {events.slice(0, 5).length > 0 ? events.slice(0, 5).map(e => (
                  <Box key={e.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box>
                      <Typography variant="body2"><strong>{e.title}</strong></Typography>
                      <Typography variant="caption" color="text.secondary">
                        {e.date ? new Date(e.date).toLocaleDateString() : '—'}
                      </Typography>
                    </Box>
                    <Chip label={e.status || 'upcoming'} size="small"
                      color={e.status === 'ongoing' ? 'warning' : e.status === 'completed' ? 'success' : 'info'} />
                  </Box>
                )) : (
                  <Typography variant="body2" color="text.secondary">{t('portal.noUpcomingEvents')}</Typography>
                )}
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Activities */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.activities')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell>{t('common.name')}</TableCell>
                <TableCell>{t('common.category')}</TableCell>
                <TableCell>{t('portal.instructor')}</TableCell>
                <TableCell>{t('portal.schedule')}</TableCell>
                <TableCell>{t('portal.enrolled')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noActivitiesFound')}</Typography></TableCell></TableRow>
              ) : activities.map(a => (
                <TableRow key={a.id} hover>
                  <TableCell><strong>{a.name}</strong></TableCell>
                  <TableCell>{a.category || '—'}</TableCell>
                  <TableCell>{a.instructor || '—'}</TableCell>
                  <TableCell>{a.schedule || '—'}</TableCell>
                  <TableCell>{a.enrolledCount ?? '—'}</TableCell>
                  <TableCell>
                    <Chip label={a.status || 'active'} size="small"
                      color={a.status === 'active' || !a.status ? 'success' : 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Enrollment */}
      <TabPanel value={tab} index={2}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.enrollmentOverview')}</Typography>
        <Box sx={{ ...S.GLASS, p: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">{t('portal.totalActivities')}</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.activeActivities}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">{t('portal.enrolledStudents')}</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">{stats.enrolledStudents}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">{t('portal.avgPerActivity')}</Typography>
                <Typography variant="h5" fontWeight={700} color="info.main">
                  {stats.activeActivities > 0 ? Math.round(stats.enrolledStudents / stats.activeActivities) : 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">{t('portal.achievements')}</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">{stats.achievements}</Typography>
              </Grid>
            </Grid>
        </Box>
        {activities.length > 0 && (
          <TableContainer component={Paper} sx={S.GLASS}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: S.TH_BG }}>
                  <TableCell>{t('portal.activity')}</TableCell>
                  <TableCell>{t('common.category')}</TableCell>
                  <TableCell>{t('portal.enrolled')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map(a => (
                  <TableRow key={a.id} hover>
                    <TableCell><strong>{a.name}</strong></TableCell>
                    <TableCell>{a.category || '—'}</TableCell>
                    <TableCell>{a.enrolledCount ?? '—'}</TableCell>
                    <TableCell>
                      <Chip label={a.status || 'active'} size="small"
                        color={a.status === 'active' || !a.status ? 'success' : 'default'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Events */}
      <TabPanel value={tab} index={3}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.events')}</Typography>        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell>{t('common.title')}</TableCell>
                <TableCell>{t('portal.activity')}</TableCell>
                <TableCell>{t('common.date')}</TableCell>
                <TableCell>{t('common.time')}</TableCell>
                <TableCell>{t('portal.venue')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noEventsFound')}</Typography></TableCell></TableRow>
              ) : events.map(e => (
                <TableRow key={e.id} hover>
                  <TableCell><strong>{e.title}</strong></TableCell>
                  <TableCell>{e.activity || '—'}</TableCell>
                  <TableCell>{e.date ? new Date(e.date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{e.startTime || '—'}{e.endTime ? ` - ${e.endTime}` : ''}</TableCell>
                  <TableCell>{e.venue || '—'}</TableCell>
                  <TableCell>
                    <Chip label={e.status || 'upcoming'} size="small"
                      color={e.status === 'ongoing' ? 'warning' : e.status === 'completed' ? 'success' : 'info'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Achievements */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.achievements')}</Typography>        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell>{t('common.title')}</TableCell>
                <TableCell>{t('portal.activity')}</TableCell>
                <TableCell>{t('portal.student')}</TableCell>
                <TableCell>{t('common.date')}</TableCell>
                <TableCell>{t('common.category')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {achievements.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noAchievementsRecorded')}</Typography></TableCell></TableRow>
              ) : achievements.map(a => (
                <TableRow key={a.id} hover>
                  <TableCell><strong>{a.title}</strong></TableCell>
                  <TableCell>{a.activity || '—'}</TableCell>
                  <TableCell>{a.student || '—'}</TableCell>
                  <TableCell>{a.date ? new Date(a.date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{a.category ? <Chip label={a.category} size="small" color="info" /> : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Profile & Links */}
      <TabPanel value={tab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>{t('portal.myProfile')}</Typography>
                  <Chip label={profile?.role || t('portal.ecaCoordinator')} color="info" size="small" />
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
                    { label: t('portal.ecaDashboard'), path: '/eca', icon: <ECAIcon color="info" /> },
                    { label: t('communication.messages'), path: '/communication/messages', icon: <MessageIcon color="info" /> },
                    { label: t('menu.calendar'), path: '/calendar', icon: <CalendarIcon color="info" /> },
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

export default ECACoordinatorPortal;

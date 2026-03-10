import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip,
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
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';

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
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<ECAStats>({ activeActivities: 0, enrolledStudents: 0, upcomingEvents: 0, achievements: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<ECAEvent[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [statsRes, activitiesRes, eventsRes, achievementsRes, profileRes] = await Promise.all([
        apiClient.get('/api/v1/eca/statistics', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
        apiClient.get('/api/v1/eca?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/eca/events?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/eca/achievements?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/users/me', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
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
      setError('Failed to load ECA dashboard');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
          <ECAIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>ECA Coordinator Portal</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user?.firstName || user?.username} — Extra-Curricular Activities
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Active Activities', value: stats.activeActivities, icon: <ActivityIcon />, color: 'info.main' },
          { label: 'Enrolled Students', value: stats.enrolledStudents, icon: <PeopleIcon />, color: 'primary.main' },
          { label: 'Upcoming Events', value: stats.upcomingEvents, icon: <EventIcon />, color: 'warning.main' },
          { label: 'Achievements', value: stats.achievements, icon: <AchievementIcon />, color: 'success.main' },
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
        <Tab icon={<ECAIcon />} iconPosition="start" label="Dashboard" />
        <Tab icon={<ActivityIcon />} iconPosition="start" label="Activities" />
        <Tab icon={<EnrollIcon />} iconPosition="start" label="Enrollment" />
        <Tab icon={<EventIcon />} iconPosition="start" label="Events" />
        <Tab icon={<AchievementIcon />} iconPosition="start" label="Achievements" />
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile & Links" />
      </Tabs>

      {/* Dashboard */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>ECA Overview</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Recent Activities</Typography>
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
                  <Typography variant="body2" color="text.secondary">No activities data available.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Upcoming Events</Typography>
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
                  <Typography variant="body2" color="text.secondary">No upcoming events.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Activities */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>Activities</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Instructor</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Enrolled</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No activities found.</Typography></TableCell></TableRow>
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
        <Typography variant="h6" fontWeight={600} mb={2}>Enrollment Overview</Typography>
        <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Total Activities</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.activeActivities}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Enrolled Students</Typography>
                <Typography variant="h5" fontWeight={700} color="primary.main">{stats.enrolledStudents}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Avg per Activity</Typography>
                <Typography variant="h5" fontWeight={700} color="info.main">
                  {stats.activeActivities > 0 ? Math.round(stats.enrolledStudents / stats.activeActivities) : 0}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Achievements</Typography>
                <Typography variant="h5" fontWeight={700} color="success.main">{stats.achievements}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        {activities.length > 0 && (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Activity</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Enrolled</TableCell>
                  <TableCell>Status</TableCell>
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
        <Typography variant="h6" fontWeight={600} mb={2}>Events</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Title</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No events found.</Typography></TableCell></TableRow>
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
        <Typography variant="h6" fontWeight={600} mb={2}>Achievements</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Title</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {achievements.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No achievements recorded.</Typography></TableCell></TableRow>
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
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>My Profile</Typography>
                  <Chip label={profile?.role || 'ECA Coordinator'} color="info" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>Name:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>Username:</strong> {profile?.username ?? user?.username}</Typography>
                <Typography variant="body2" mt={1}><strong>Email:</strong> {profile?.email ?? user?.email ?? '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>Phone:</strong> {profile?.phoneNumber || '—'}</Typography>
                <Box mt={2}>
                  <Button variant="outlined" color="info" size="small" onClick={() => navigate('/communication/messages')}>Contact Admin</Button>
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
                    { label: 'ECA Dashboard', path: '/eca', icon: <ECAIcon color="info" /> },
                    { label: 'Messages', path: '/communication/messages', icon: <MessageIcon color="info" /> },
                    { label: 'Calendar', path: '/calendar', icon: <CalendarIcon color="info" /> },
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

export default ECACoordinatorPortal;

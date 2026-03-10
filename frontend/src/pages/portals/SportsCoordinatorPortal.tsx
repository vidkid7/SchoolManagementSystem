import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip,
} from '@mui/material';
import {
  EmojiEvents as SportsIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  SportsScore as ScoreIcon,
  Groups as TeamIcon,
  Event as EventIcon,
  MilitaryTech as AchievementIcon,
  FitnessCenter as ActiveIcon,
  Notifications as AnnouncementIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';

interface SportsStats {
  activeSports: number;
  totalAthletes: number;
  upcomingEvents: number;
  achievements: number;
}

interface Sport {
  id: number;
  name: string;
  category?: string;
  status?: string;
  enrolledCount?: number;
  description?: string;
}

interface Team {
  id: number;
  name: string;
  sport?: string;
  coach?: string;
  memberCount?: number;
  status?: string;
}

interface Tournament {
  id: number;
  name: string;
  sport?: string;
  startDate?: string;
  endDate?: string;
  venue?: string;
  status?: string;
  participants?: number;
}

interface Achievement {
  id: number;
  title: string;
  sport?: string;
  student?: string;
  team?: string;
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

const SportsCoordinatorPortal: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<SportsStats>({ activeSports: 0, totalAthletes: 0, upcomingEvents: 0, achievements: 0 });
  const [sports, setSports] = useState<Sport[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [statsRes, sportsRes, teamsRes, tournamentsRes, achievementsRes, profileRes] = await Promise.all([
        apiClient.get('/api/v1/sports/statistics', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
        apiClient.get('/api/v1/sports?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/sports/teams?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/sports/tournaments?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/sports/achievements?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/users/me', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
      ]);
      const s = statsRes.data?.data;
      if (s) {
        setStats({
          activeSports: s.activeSports ?? s.totalSports ?? 0,
          totalAthletes: s.totalAthletes ?? s.totalStudents ?? 0,
          upcomingEvents: s.upcomingEvents ?? s.upcomingTournaments ?? 0,
          achievements: s.achievements ?? s.totalAchievements ?? 0,
        });
      }
      const sp = sportsRes.data?.data;
      setSports(Array.isArray(sp) ? sp : sp?.sports ?? []);
      const tm = teamsRes.data?.data;
      setTeams(Array.isArray(tm) ? tm : tm?.teams ?? []);
      const tr = tournamentsRes.data?.data;
      setTournaments(Array.isArray(tr) ? tr : tr?.tournaments ?? []);
      const ac = achievementsRes.data?.data;
      setAchievements(Array.isArray(ac) ? ac : ac?.achievements ?? []);
      setProfile(profileRes.data?.data ?? null);
    } catch {
      setError('Failed to load sports dashboard');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
          <SportsIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>Sports Coordinator Portal</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user?.firstName || user?.username} — Sports & Athletics
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Active Sports', value: stats.activeSports, icon: <ActiveIcon />, color: 'warning.main' },
          { label: 'Total Athletes', value: stats.totalAthletes, icon: <PeopleIcon />, color: 'primary.main' },
          { label: 'Upcoming Events', value: stats.upcomingEvents, icon: <EventIcon />, color: 'info.main' },
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
        <Tab icon={<SportsIcon />} iconPosition="start" label="Dashboard" />
        <Tab icon={<ActiveIcon />} iconPosition="start" label="Sports" />
        <Tab icon={<TeamIcon />} iconPosition="start" label="Teams" />
        <Tab icon={<EventIcon />} iconPosition="start" label="Tournaments" />
        <Tab icon={<AchievementIcon />} iconPosition="start" label="Achievements" />
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile & Links" />
      </Tabs>

      {/* Dashboard */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>Sports Overview</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Recent Sports Activity</Typography>
                <Divider sx={{ mb: 2 }} />
                {sports.slice(0, 5).length > 0 ? sports.slice(0, 5).map(s => (
                  <Box key={s.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">{s.name}</Typography>
                    <Chip label={s.status || 'active'} size="small"
                      color={s.status === 'active' || !s.status ? 'success' : 'default'} />
                  </Box>
                )) : (
                  <Typography variant="body2" color="text.secondary">No sports data available.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Upcoming Tournaments</Typography>
                <Divider sx={{ mb: 2 }} />
                {tournaments.slice(0, 5).length > 0 ? tournaments.slice(0, 5).map(t => (
                  <Box key={t.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box>
                      <Typography variant="body2"><strong>{t.name}</strong></Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.startDate ? new Date(t.startDate).toLocaleDateString() : '—'}
                      </Typography>
                    </Box>
                    <Chip label={t.status || 'upcoming'} size="small"
                      color={t.status === 'ongoing' ? 'warning' : t.status === 'completed' ? 'success' : 'info'} />
                  </Box>
                )) : (
                  <Typography variant="body2" color="text.secondary">No upcoming tournaments.</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Sports */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>Active Sports</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Enrolled</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sports.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No sports found.</Typography></TableCell></TableRow>
              ) : sports.map(s => (
                <TableRow key={s.id} hover>
                  <TableCell><strong>{s.name}</strong></TableCell>
                  <TableCell>{s.category || '—'}</TableCell>
                  <TableCell>
                    <Chip label={s.status || 'active'} size="small"
                      color={s.status === 'active' || !s.status ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell>{s.enrolledCount ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Teams */}
      <TabPanel value={tab} index={2}>
        <Typography variant="h6" fontWeight={600} mb={2}>Teams</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Team Name</TableCell>
                <TableCell>Sport</TableCell>
                <TableCell>Coach</TableCell>
                <TableCell>Members</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No teams found.</Typography></TableCell></TableRow>
              ) : teams.map(t => (
                <TableRow key={t.id} hover>
                  <TableCell><strong>{t.name}</strong></TableCell>
                  <TableCell>{t.sport || '—'}</TableCell>
                  <TableCell>{t.coach || '—'}</TableCell>
                  <TableCell>{t.memberCount ?? '—'}</TableCell>
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

      {/* Tournaments */}
      <TabPanel value={tab} index={3}>
        <Typography variant="h6" fontWeight={600} mb={2}>Tournaments</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Tournament</TableCell>
                <TableCell>Sport</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Participants</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tournaments.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No tournaments found.</Typography></TableCell></TableRow>
              ) : tournaments.map(t => (
                <TableRow key={t.id} hover>
                  <TableCell><strong>{t.name}</strong></TableCell>
                  <TableCell>{t.sport || '—'}</TableCell>
                  <TableCell>{t.startDate ? new Date(t.startDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{t.endDate ? new Date(t.endDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{t.venue || '—'}</TableCell>
                  <TableCell>
                    <Chip label={t.status || 'upcoming'} size="small"
                      color={t.status === 'ongoing' ? 'warning' : t.status === 'completed' ? 'success' : 'info'} />
                  </TableCell>
                  <TableCell>{t.participants ?? '—'}</TableCell>
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
                <TableCell>Sport</TableCell>
                <TableCell>Student / Team</TableCell>
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
                  <TableCell>{a.sport || '—'}</TableCell>
                  <TableCell>{a.student || a.team || '—'}</TableCell>
                  <TableCell>{a.date ? new Date(a.date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{a.category ? <Chip label={a.category} size="small" color="warning" /> : '—'}</TableCell>
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
                  <Chip label={profile?.role || 'Sports Coordinator'} color="warning" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>Name:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>Username:</strong> {profile?.username ?? user?.username}</Typography>
                <Typography variant="body2" mt={1}><strong>Email:</strong> {profile?.email ?? user?.email ?? '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>Phone:</strong> {profile?.phoneNumber || '—'}</Typography>
                <Box mt={2}>
                  <Button variant="outlined" color="warning" size="small" onClick={() => navigate('/communication/messages')}>Contact Admin</Button>
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
                    { label: 'Sports Dashboard', path: '/sports', icon: <SportsIcon color="warning" /> },
                    { label: 'Messages', path: '/communication/messages', icon: <MessageIcon color="warning" /> },
                    { label: 'Calendar', path: '/calendar', icon: <CalendarIcon color="warning" /> },
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

export default SportsCoordinatorPortal;

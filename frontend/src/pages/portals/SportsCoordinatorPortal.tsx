import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip, useTheme,
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
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';
import { C, useAdminStyles } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [statsRes, sportsRes, teamsRes, tournamentsRes, achievementsRes, profileRes] = await Promise.all([
        apiClient.get('/api/v1/sports/statistics', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
        apiClient.get('/api/v1/sports?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/sports/teams?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/sports/tournaments?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/sports/achievements?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/auth/me', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
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
      setError(t('portal.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, mt: { xs: 7, sm: 8 } }}>
      <Paper sx={S.PAGE_HEADER}>
        <Box display="flex" alignItems="center" gap={2}>
          <SportsIcon sx={{ fontSize: 32, color: C.warning }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{t('portal.sportsCoordinatorPortal')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('portal.welcome')}, {user?.firstName || user?.username} — {t('portal.sportsAndAthletics')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: t('portal.activeSports'), value: stats.activeSports, icon: <ActiveIcon />, color: C.warning },
          { label: t('portal.totalAthletes'), value: stats.totalAthletes, icon: <PeopleIcon />, color: C.primary },
          { label: t('portal.upcomingEventsCount'), value: stats.upcomingEvents, icon: <EventIcon />, color: C.info },
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
        <Tab icon={<SportsIcon />} iconPosition="start" label={t('portal.dashboard')} />
        <Tab icon={<ActiveIcon />} iconPosition="start" label={t('portal.sports')} />
        <Tab icon={<TeamIcon />} iconPosition="start" label={t('portal.teams')} />
        <Tab icon={<EventIcon />} iconPosition="start" label={t('portal.tournaments')} />
        <Tab icon={<AchievementIcon />} iconPosition="start" label={t('portal.achievementsCount')} />
        <Tab icon={<PersonIcon />} iconPosition="start" label={t('portal.profileAndLinks')} />
      </Tabs>

      {/* Dashboard */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.sportsOverview')}</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>{t('portal.recentSportsActivity')}</Typography>
                <Divider sx={{ mb: 2 }} />
                {sports.slice(0, 5).length > 0 ? sports.slice(0, 5).map(s => (
                  <Box key={s.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">{s.name}</Typography>
                    <Chip label={s.status || 'active'} size="small"
                      color={s.status === 'active' || !s.status ? 'success' : 'default'} />
                  </Box>
                )) : (
                  <Typography variant="body2" color="text.secondary">{t('portal.noSportsData')}</Typography>
                )}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>{t('portal.upcomingTournaments')}</Typography>
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
                  <Typography variant="body2" color="text.secondary">{t('portal.noUpcomingTournaments')}</Typography>
                )}
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Sports */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.activeSports')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell>{t('common.name')}</TableCell>
                <TableCell>{t('common.category')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('portal.enrolled')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sports.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noSportsFound')}</Typography></TableCell></TableRow>
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
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.teams')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell>{t('portal.teamName')}</TableCell>
                <TableCell>{t('portal.sport')}</TableCell>
                <TableCell>{t('portal.coach')}</TableCell>
                <TableCell>{t('portal.members')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noTeamsFound')}</Typography></TableCell></TableRow>
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
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.tournaments')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell>{t('portal.tournament')}</TableCell>
                <TableCell>{t('portal.sport')}</TableCell>
                <TableCell>{t('common.startDate')}</TableCell>
                <TableCell>{t('common.endDate')}</TableCell>
                <TableCell>{t('portal.venue')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('portal.participants')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tournaments.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noTournamentsFound')}</Typography></TableCell></TableRow>
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
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.achievements')}</Typography>        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell>{t('common.title')}</TableCell>
                <TableCell>{t('portal.sport')}</TableCell>
                <TableCell>{t('portal.studentTeam')}</TableCell>
                <TableCell>{t('common.date')}</TableCell>
                <TableCell>{t('common.category')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {achievements.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noAchievementsRecorded')}</Typography></TableCell></TableRow>              ) : achievements.map(a => (
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
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>{t('portal.myProfile')}</Typography>
                  <Chip label={profile?.role || t('portal.sportsCoordinator')} color="warning" size="small" />
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
                    { label: t('portal.sportsDashboard'), path: '/sports', icon: <SportsIcon color="warning" /> },
                    { label: t('communication.messages'), path: '/communication/messages', icon: <MessageIcon color="warning" /> },
                    { label: t('menu.calendar'), path: '/calendar', icon: <CalendarIcon color="warning" /> },
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

export default SportsCoordinatorPortal;

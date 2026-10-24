/**
 * Sports Dashboard - Sports Management Overview
 */

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { Box, Grid, Paper, Typography, Card, CardContent, Button, List, ListItem, ListItemText, Chip } from '@mui/material';
import { Add as AddIcon, EmojiEvents as TrophyIcon, Groups as TeamIcon, SportsScore as MatchIcon } from '@mui/icons-material';
import apiClient from '../../services/apiClient';

import { useTranslation } from 'react-i18next';

interface RecentMatch {
  id: number | string;
  team1?: string;
  team2?: string;
  homeTeam?: string;
  home_team?: string;
  awayTeam?: string;
  away_team?: string;
  sport?: string;
  date: string;
  result?: string;
}

export function SportsDashboard() {
  const navigate = useSlugNavigate();
  const goToManagement = (tab: number) => navigate(`/sports/management?tab=${tab}`);
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalSports: 0, activeSports: 0, totalTeams: 0, upcomingMatches: 0, totalPlayers: 0 });
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);

  useEffect(() => {
    Promise.all([
      apiClient.get('/sports/statistics').catch(() => ({ data: { data: null } })),
      apiClient.get('/sports/recent-matches?limit=5').catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, matchesRes]) => {
      if (statsRes.data?.data) setStats(statsRes.data.data);
      setRecentMatches(matchesRes.data?.data || []);
    });
  }, []);

  const statCards = [
    { title: t('sports.totalSports'), value: stats.totalSports, icon: <MatchIcon sx={{ fontSize: 32 }} />, color: C.primary, bgColor: C.primaryBg, action: () => goToManagement(0) },
    { title: t('sports.totalTeams'), value: stats.totalTeams, icon: <TeamIcon sx={{ fontSize: 32 }} />, color: C.success, bgColor: C.successBg, action: () => goToManagement(1) },
    { title: t('sports.totalPlayers'), value: stats.totalPlayers, icon: <TeamIcon sx={{ fontSize: 32 }} />, color: C.info, bgColor: C.infoBg, action: () => goToManagement(4) },
    { title: t('sports.upcomingMatches'), value: stats.upcomingMatches, icon: <TrophyIcon sx={{ fontSize: 32 }} />, color: C.warning, bgColor: C.warningBg, action: () => goToManagement(2) },
  ];

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <MatchIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{t('sports.dashboardTitle')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('sports.subtitle')}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => goToManagement(0)} sx={S.BTN_PRIMARY}>{t('sports.newSport')}</Button>
            <Button variant="outlined" sx={S.BTN_OUTLINE} startIcon={<TeamIcon />} onClick={() => goToManagement(1)}>{t('sports.createTeam')}</Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {statCards.map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card
              component="button"
              type="button"
              aria-label={`${card.title}: ${card.value}`}
              sx={{ ...S.GLASS, cursor: 'pointer', width: '100%', textAlign: 'left', font: 'inherit', color: 'inherit', border: 0, p: 0, '&:hover': { transform: 'translateY(-4px)' }, transition: 'transform 0.2s' }}
              onClick={card.action}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>{card.title}</Typography>
                    <Typography variant="h4" fontWeight={600}>{card.value}</Typography>
                  </Box>
                  <Box sx={{ backgroundColor: card.bgColor, color: card.color, p: 1.5, borderRadius: R.lg, display: 'flex', alignItems: 'center' }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ ...S.GLASS, p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>{t('sports.recentMatches')}</Typography>
            {recentMatches.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>{t('sports.noRecentMatches')}</Typography>
            ) : (
              <List>
                {recentMatches.map((match) => (
                  <ListItem key={match.id}>
                    <ListItemText primary={`${match.team1 || match.homeTeam || match.home_team || t('sports.homeTeam')} vs ${match.team2 || match.awayTeam || match.away_team || t('sports.awayTeam')}`} secondary={`${match.sport} • ${new Date(match.date).toLocaleDateString()}`} />
                    <Chip label={match.result || 'Upcoming'} size="small" />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...S.GLASS, p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>{t('sports.quickActions')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" sx={S.BTN_OUTLINE} fullWidth onClick={() => goToManagement(0)}>{t('sports.manageSports')}</Button>
              <Button variant="outlined" sx={S.BTN_OUTLINE} fullWidth onClick={() => goToManagement(1)}>{t('sports.manageTeams')}</Button>
              <Button variant="outlined" sx={S.BTN_OUTLINE} fullWidth onClick={() => goToManagement(2)}>{t('sports.tournaments')}</Button>
              <Button variant="outlined" sx={S.BTN_OUTLINE} fullWidth onClick={() => goToManagement(4)}>{t('sports.markAttendance')}</Button>
              <Button variant="outlined" sx={S.BTN_OUTLINE} fullWidth onClick={() => goToManagement(3)}>{t('sports.recordAchievements')}</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SportsDashboard;

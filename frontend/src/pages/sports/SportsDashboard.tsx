/**
 * Sports Dashboard - Sports Management Overview
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, Card, CardContent, Button, List, ListItem, ListItemText, Chip } from '@mui/material';
import { Add as AddIcon, EmojiEvents as TrophyIcon, Groups as TeamIcon, SportsScore as MatchIcon } from '@mui/icons-material';
import api from '../../config/api';

export function SportsDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalSports: 0, activeSports: 0, totalTeams: 0, upcomingMatches: 0, totalPlayers: 0 });
  const [recentMatches, setRecentMatches] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/sports/statistics').catch(() => ({ data: { data: null } })),
      api.get('/sports/recent-matches?limit=5').catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, matchesRes]) => {
      if (statsRes.data?.data) setStats(statsRes.data.data);
      setRecentMatches(matchesRes.data?.data || []);
    });
  }, []);

  const statCards = [
    { title: 'Total Sports', value: stats.totalSports, icon: <MatchIcon sx={{ fontSize: 40, color: 'primary.main' }} />, action: () => navigate('/sports/list') },
    { title: 'Active Teams', value: stats.totalTeams, icon: <TeamIcon sx={{ fontSize: 40, color: 'success.main' }} />, action: () => navigate('/sports/teams') },
    { title: 'Total Players', value: stats.totalPlayers, icon: <TeamIcon sx={{ fontSize: 40, color: 'info.main' }} />, action: () => navigate('/sports/players') },
    { title: 'Upcoming Matches', value: stats.upcomingMatches, icon: <TrophyIcon sx={{ fontSize: 40, color: 'warning.main' }} />, action: () => navigate('/sports/tournaments') },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>Sports Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/sports/new')}>New Sport</Button>
          <Button variant="outlined" startIcon={<TeamIcon />} onClick={() => navigate('/sports/teams/new')}>Create Team</Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {statCards.map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)' }, transition: 'transform 0.2s' }} onClick={card.action}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box><Typography color="text.secondary" variant="body2">{card.title}</Typography><Typography variant="h4" fontWeight={600}>{card.value}</Typography></Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Recent Matches</Typography>
            {recentMatches.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>No recent matches</Typography>
            ) : (
              <List>
                {recentMatches.map((match: any) => (
                  <ListItem key={match.id}>
                    <ListItemText primary={`${match.team1} vs ${match.team2}`} secondary={`${match.sport} • ${new Date(match.date).toLocaleDateString()}`} />
                    <Chip label={match.result || 'Upcoming'} size="small" />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" fullWidth onClick={() => navigate('/sports/list')}>Manage Sports</Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/sports/teams')}>Manage Teams</Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/sports/tournaments')}>Tournaments</Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/sports/attendance')}>Mark Attendance</Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/sports/achievements')}>Record Achievements</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SportsDashboard;

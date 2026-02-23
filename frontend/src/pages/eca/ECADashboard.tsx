/**
 * ECA Dashboard - Extra-Curricular Activities Overview
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, Card, CardContent, Button, List, ListItem, ListItemText, Chip } from '@mui/material';
import { Add as AddIcon, Event as EventIcon, EmojiEvents as AchievementIcon, Groups as GroupsIcon } from '@mui/icons-material';
import api from '../../config/api';

export function ECADashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalECAs: 0, activeECAs: 0, totalStudents: 0, upcomingEvents: 0 });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/eca/statistics').catch(() => ({ data: { data: null } })),
      api.get('/eca/recent-activities?limit=5').catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, activitiesRes]) => {
      if (statsRes.data?.data) setStats(statsRes.data.data);
      setRecentActivities(activitiesRes.data?.data || []);
    });
  }, []);

  const statCards = [
    { title: 'Total ECAs', value: stats.totalECAs, icon: <GroupsIcon sx={{ fontSize: 40, color: 'primary.main' }} />, action: () => navigate('/eca/list') },
    { title: 'Active ECAs', value: stats.activeECAs, icon: <EventIcon sx={{ fontSize: 40, color: 'success.main' }} />, action: () => navigate('/eca/list?status=active') },
    { title: 'Enrolled Students', value: stats.totalStudents, icon: <GroupsIcon sx={{ fontSize: 40, color: 'info.main' }} />, action: () => navigate('/eca/enrollments') },
    { title: 'Upcoming Events', value: stats.upcomingEvents, icon: <AchievementIcon sx={{ fontSize: 40, color: 'warning.main' }} />, action: () => navigate('/eca/events') },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>ECA Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/eca/new')}>New ECA</Button>
          <Button variant="outlined" startIcon={<EventIcon />} onClick={() => navigate('/eca/events/new')}>Create Event</Button>
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
            <Typography variant="h6" fontWeight={600} gutterBottom>Recent Activities</Typography>
            {recentActivities.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>No recent activities</Typography>
            ) : (
              <List>
                {recentActivities.map((activity: any) => (
                  <ListItem key={activity.id}>
                    <ListItemText primary={activity.title} secondary={activity.description} />
                    <Chip label={activity.type} size="small" />
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
              <Button variant="outlined" fullWidth onClick={() => navigate('/eca/list')}>Manage ECAs</Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/eca/enrollments')}>Student Enrollments</Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/eca/attendance')}>Mark Attendance</Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/eca/achievements')}>Record Achievements</Button>
              <Button variant="outlined" fullWidth onClick={() => navigate('/eca/events')}>ECA Events</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ECADashboard;

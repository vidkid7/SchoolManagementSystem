/**
 * ECA Dashboard - Extra-Curricular Activities Overview
 */

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { Box, Grid, Paper, Typography, Card, CardContent, Button, List, ListItem, ListItemText, Chip } from '@mui/material';
import { Add as AddIcon, Event as EventIcon, EmojiEvents as AchievementIcon, Groups as GroupsIcon } from '@mui/icons-material';
import apiClient from '../../services/apiClient';

import { useTranslation } from 'react-i18next';

export function ECADashboard() {
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalECAs: 0, activeECAs: 0, totalStudents: 0, upcomingEvents: 0 });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      apiClient.get('/eca/statistics').catch(() => ({ data: { data: null } })),
      apiClient.get('/eca/recent-activities?limit=5').catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, activitiesRes]) => {
      if (statsRes.data?.data) setStats(statsRes.data.data);
      setRecentActivities(activitiesRes.data?.data || []);
    });
  }, []);

  const statCards = [
    { title: t('eca.totalEcas'), value: stats.totalECAs, icon: <GroupsIcon sx={{ fontSize: 32 }} />, color: C.primary, bgColor: C.primaryBg, action: () => navigate('/eca/list') },
    { title: t('eca.activeEcas'), value: stats.activeECAs, icon: <EventIcon sx={{ fontSize: 32 }} />, color: C.success, bgColor: C.successBg, action: () => navigate('/eca/list?status=active') },
    { title: t('eca.enrolledStudents'), value: stats.totalStudents, icon: <GroupsIcon sx={{ fontSize: 32 }} />, color: C.info, bgColor: C.infoBg, action: () => navigate('/eca/enrollments') },
    { title: t('eca.upcomingEvents'), value: stats.upcomingEvents, icon: <AchievementIcon sx={{ fontSize: 32 }} />, color: C.warning, bgColor: C.warningBg, action: () => navigate('/eca/events') },
  ];

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GroupsIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{t('eca.dashboardTitle')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('eca.subtitle')}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/eca/new')} sx={S.BTN_PRIMARY}>{t('eca.newEca')}</Button>
            <Button variant="outlined" sx={S.BTN_OUTLINE} startIcon={<EventIcon />} onClick={() => navigate('/eca/events/new')}>{t('eca.createEvent')}</Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {statCards.map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ ...S.GLASS, cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)' }, transition: 'transform 0.2s' }} onClick={card.action}>
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
            <Typography variant="h6" fontWeight={600} gutterBottom>{t('eca.recentActivities')}</Typography>
            {recentActivities.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>{t('eca.noRecentActivities')}</Typography>
            ) : (
              <List>
                {recentActivities.map((activity: any) => (
                  <ListItem key={activity.id}>
                    <ListItemText 
                      primary={activity.title || activity.name || activity.ecaName || `${activity.type} Activity`} 
                      secondary={activity.description || activity.studentName || activity.student_name || activity.date ? new Date(activity.date).toLocaleDateString() : ''} 
                    />
                    <Chip label={activity.type} size="small" />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ ...S.GLASS, p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>{t('eca.quickActions')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" sx={S.BTN_OUTLINE} fullWidth onClick={() => navigate('/eca/list')}>{t('eca.manageEcas')}</Button>
              <Button variant="outlined" sx={S.BTN_OUTLINE} fullWidth onClick={() => navigate('/eca/enrollments')}>{t('eca.studentEnrollments')}</Button>
              <Button variant="outlined" sx={S.BTN_OUTLINE} fullWidth onClick={() => navigate('/eca/attendance')}>{t('eca.markAttendance')}</Button>
              <Button variant="outlined" sx={S.BTN_OUTLINE} fullWidth onClick={() => navigate('/eca/achievements')}>{t('eca.recordAchievements')}</Button>
              <Button variant="outlined" sx={S.BTN_OUTLINE} fullWidth onClick={() => navigate('/eca/events')}>{t('eca.ecaEvents')}</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ECADashboard;

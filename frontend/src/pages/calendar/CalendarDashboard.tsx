/**
 * Calendar Dashboard
 * 
 * Overview of upcoming events, holidays, and calendar management
 * 
 * Requirements: 31.1, 31.2, 31.5
 */

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { C, useAdminStyles } from '../../theme/designTokens';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Event as EventIcon,
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  School as SchoolIcon,
  SportsBasketball as SportsIcon,
  TheaterComedy as CulturalIcon,
  BeachAccess as HolidayIcon,
  MenuBook as ExamIcon,
  Groups as MeetingIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';

interface CalendarStats {
  totalEvents: number;
  upcomingEvents: number;
  holidaysThisMonth: number;
  eventsThisWeek: number;
  eventsByCategory: Record<string, number>;
  upcomingEventsList: Array<{
    eventId: number;
    title: string;
    titleNp?: string;
    category: string;
    startDate: string;
    startDateBS?: string;
    isHoliday: boolean;
  }>;
  upcomingHolidays: Array<{
    eventId: number;
    title: string;
    titleNp?: string;
    startDate: string;
    startDateBS?: string;
    isNepalGovernmentHoliday: boolean;
  }>;
}

export const CalendarDashboard = () => {
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t, i18n } = useTranslation();
  const isNepali = i18n.language === 'ne';
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categoryConfig: Record<string, { color: string; icon: JSX.Element; label: string }> = {
    academic: { color: C.primary, icon: <SchoolIcon />, label: t('calendar.categories.academic') },
    sports: { color: C.primary, icon: <SportsIcon />, label: t('calendar.categories.sports') },
    cultural: { color: C.neutral, icon: <CulturalIcon />, label: t('calendar.categories.cultural') },
    holiday: { color: C.danger, icon: <HolidayIcon />, label: t('calendar.categories.holiday') },
    exam: { color: C.neutral, icon: <ExamIcon />, label: t('calendar.categories.exam') },
    meeting: { color: C.neutral, icon: <MeetingIcon />, label: t('calendar.categories.meeting') },
    other: { color: C.neutral, icon: <EventIcon />, label: t('calendar.categories.other') },
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/api/v1/calendar/events/stats');
      setStats(response.data.data);
    } catch (err: any) {
      console.error('Failed to fetch calendar stats:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to load statistics';
      setError(errorMessage);
      // Set default empty stats on error
      setStats({
        totalEvents: 0,
        upcomingEvents: 0,
        holidaysThisMonth: 0,
        eventsThisWeek: 0,
        eventsByCategory: {},
        upcomingEventsList: [],
        upcomingHolidays: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          {t('calendar.dashboardTitle')}
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <br />
          <Typography variant="caption">
            {t('calendar.backendError')}
          </Typography>
        </Alert>
        <Button variant="outlined" onClick={fetchStats} sx={{ ...S.BTN_OUTLINE,  mt: 2 }}>
          {t('calendar.retry')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CalendarIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{t('calendar.dashboardTitle')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('calendar.subtitle')}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined" sx={S.BTN_OUTLINE}
              startIcon={<CalendarIcon />}
              onClick={() => navigate('/calendar')}
            >
              {t('calendar.viewCalendar')}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/calendar?action=create')}
              sx={S.BTN_PRIMARY}
            >
              {t('calendar.addEvent')}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    {t('calendar.totalEvents')}
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {stats?.totalEvents || 0}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: C.primaryBg, color: C.primary, p: 1.5, borderRadius: 2, display: 'flex' }}>
                  <EventIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    {t('calendar.upcomingEvents')}
                  </Typography>
                  <Typography variant="h4" fontWeight={600} color="info.main">
                    {stats?.upcomingEvents || 0}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: C.infoBg, color: C.info, p: 1.5, borderRadius: 2, display: 'flex' }}>
                  <TrendingUpIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    {t('calendar.thisWeek')}
                  </Typography>
                  <Typography variant="h4" fontWeight={600} color="success.main">
                    {stats?.eventsThisWeek || 0}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: C.successBg, color: C.success, p: 1.5, borderRadius: 2, display: 'flex' }}>
                  <CalendarIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    {t('calendar.holidaysThisMonth')}
                  </Typography>
                  <Typography variant="h4" fontWeight={600} color="error.main">
                    {stats?.holidaysThisMonth || 0}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: C.dangerBg, color: C.danger, p: 1.5, borderRadius: 2, display: 'flex' }}>
                  <HolidayIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Events by Category */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('calendar.eventsByCategory')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {stats?.eventsByCategory && Object.entries(stats.eventsByCategory).map(([category, count]) => (
                  <Box
                    key={category}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      {categoryConfig[category]?.icon}
                      <Typography>{categoryConfig[category]?.label || category}</Typography>
                    </Box>
                    <Chip
                      label={count}
                      size="small"
                      sx={{
                        bgcolor: categoryConfig[category]?.color || C.neutral,
                        color: 'white',
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Holidays */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('calendar.upcomingHolidays')}
              </Typography>
              <List>
                {stats?.upcomingHolidays && stats.upcomingHolidays.length > 0 ? (
                  stats.upcomingHolidays.map((holiday, index) => (
                    <Box key={holiday.eventId}>
                      <ListItem>
                        <ListItemIcon>
                          <HolidayIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography>
                                {isNepali && holiday.titleNp ? holiday.titleNp : holiday.title}
                              </Typography>
                              {holiday.isNepalGovernmentHoliday && (
                                <Chip label={t('calendar.govtHoliday')} size="small" color="error" />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              {holiday.startDateBS && `${holiday.startDateBS} BS`}
                              {' • '}
                              {new Date(holiday.startDate).toLocaleDateString()}
                            </>
                          }
                        />
                      </ListItem>
                      {index < stats.upcomingHolidays.length - 1 && <Divider />}
                    </Box>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary={t('calendar.noHolidays')}
                      secondary={t('calendar.noHolidaysScheduled')}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('calendar.upcomingEvents')}
              </Typography>
              <List>
                {stats?.upcomingEventsList && stats.upcomingEventsList.length > 0 ? (
                  stats.upcomingEventsList.map((event, index) => (
                    <Box key={event.eventId}>
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/calendar?date=${event.startDate}`)}
                      >
                        <ListItemIcon>
                          {categoryConfig[event.category]?.icon || <EventIcon />}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography>
                                {isNepali && event.titleNp ? event.titleNp : event.title}
                              </Typography>
                              <Chip
                                label={categoryConfig[event.category]?.label || event.category}
                                size="small"
                                sx={{
                                  bgcolor: categoryConfig[event.category]?.color || C.neutral,
                                  color: 'white',
                                }}
                              />
                              {event.isHoliday && (
                                <Chip label={t('calendar.categories.holiday')} size="small" color="error" />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              {event.startDateBS && `${event.startDateBS} BS`}
                              {' • '}
                              {new Date(event.startDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </>
                          }
                        />
                      </ListItem>
                      {index < stats.upcomingEventsList.length - 1 && <Divider />}
                    </Box>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary={t('calendar.noEvents')}
                      secondary={t('calendar.noEventsScheduled')}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('calendar.quickActions')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined" sx={S.BTN_OUTLINE}
                  startIcon={<CalendarIcon />}
                  onClick={() => navigate('/calendar')}
                >
                  {t('calendar.viewFullCalendar')}
                </Button>
                <Button
                  variant="outlined" sx={S.BTN_OUTLINE}
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/calendar?action=create')}
                >
                  {t('calendar.createEvent')}
                </Button>
                <Button
                  variant="outlined" sx={S.BTN_OUTLINE}
                  startIcon={<HolidayIcon />}
                  onClick={() => navigate('/calendar?filter=holiday')}
                >
                  {t('calendar.viewHolidays')}
                </Button>
                <Button
                  variant="outlined" sx={S.BTN_OUTLINE}
                  startIcon={<ExamIcon />}
                  onClick={() => navigate('/calendar?filter=exam')}
                >
                  {t('calendar.examSchedule')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

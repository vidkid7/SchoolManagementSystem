/**
 * Calendar Dashboard
 * 
 * Overview of upcoming events, holidays, and calendar management
 * 
 * Requirements: 31.1, 31.2, 31.5
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
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
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNepali = i18n.language === 'ne';
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categoryConfig: Record<string, { color: string; icon: JSX.Element; label: string }> = {
    academic: { color: '#1976d2', icon: <SchoolIcon />, label: 'Academic' },
    sports: { color: '#2e7d32', icon: <SportsIcon />, label: 'Sports' },
    cultural: { color: '#9c27b0', icon: <CulturalIcon />, label: 'Cultural' },
    holiday: { color: '#d32f2f', icon: <HolidayIcon />, label: 'Holiday' },
    exam: { color: '#ed6c02', icon: <ExamIcon />, label: 'Exam' },
    meeting: { color: '#0288d1', icon: <MeetingIcon />, label: 'Meeting' },
    other: { color: '#757575', icon: <EventIcon />, label: 'Other' },
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
          {isNepali ? 'पात्रो ड्यासबोर्ड' : 'Calendar Dashboard'}
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <br />
          <Typography variant="caption">
            Please ensure the backend server is running and the API endpoints are accessible.
          </Typography>
        </Alert>
        <Button variant="outlined" onClick={fetchStats} sx={{ mt: 2 }}>
          {isNepali ? 'पुन: प्रयास गर्नुहोस्' : 'Retry'}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isNepali ? 'पात्रो ड्यासबोर्ड' : 'Calendar Dashboard'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CalendarIcon />}
            onClick={() => navigate('/calendar')}
          >
            {isNepali ? 'पात्रो हेर्नुहोस्' : 'View Calendar'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/calendar?action=create')}
          >
            {isNepali ? 'कार्यक्रम थप्नुहोस्' : 'Add Event'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {isNepali ? 'कुल कार्यक्रम' : 'Total Events'}
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalEvents || 0}
                  </Typography>
                </Box>
                <EventIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {isNepali ? 'आगामी कार्यक्रम' : 'Upcoming Events'}
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats?.upcomingEvents || 0}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {isNepali ? 'यो हप्ता' : 'This Week'}
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats?.eventsThisWeek || 0}
                  </Typography>
                </Box>
                <CalendarIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {isNepali ? 'यो महिना बिदा' : 'Holidays This Month'}
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats?.holidaysThisMonth || 0}
                  </Typography>
                </Box>
                <HolidayIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Events by Category */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {isNepali ? 'प्रकार अनुसार कार्यक्रम' : 'Events by Category'}
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
                      borderBottom: '1px solid #e0e0e0',
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
                        bgcolor: categoryConfig[category]?.color || '#757575',
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
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {isNepali ? 'आगामी बिदाहरू' : 'Upcoming Holidays'}
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
                                <Chip label="Govt" size="small" color="error" />
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
                      primary={isNepali ? 'कुनै आगामी बिदा छैन' : 'No upcoming holidays'}
                      secondary={isNepali ? 'अर्को बिदा अझै तोकिएको छैन' : 'No holidays scheduled yet'}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {isNepali ? 'आगामी कार्यक्रमहरू' : 'Upcoming Events'}
              </Typography>
              <List>
                {stats?.upcomingEventsList && stats.upcomingEventsList.length > 0 ? (
                  stats.upcomingEventsList.map((event, index) => (
                    <Box key={event.eventId}>
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#f5f5f5' },
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
                                  bgcolor: categoryConfig[event.category]?.color || '#757575',
                                  color: 'white',
                                }}
                              />
                              {event.isHoliday && (
                                <Chip label={isNepali ? 'बिदा' : 'Holiday'} size="small" color="error" />
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
                      primary={isNepali ? 'कुनै आगामी कार्यक्रम छैन' : 'No upcoming events'}
                      secondary={isNepali ? 'अर्को कार्यक्रम अझै तोकिएको छैन' : 'No events scheduled yet'}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {isNepali ? 'द्रुत कार्यहरू' : 'Quick Actions'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<CalendarIcon />}
                  onClick={() => navigate('/calendar')}
                >
                  {isNepali ? 'पूर्ण पात्रो हेर्नुहोस्' : 'View Full Calendar'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/calendar?action=create')}
                >
                  {isNepali ? 'कार्यक्रम सिर्जना गर्नुहोस्' : 'Create Event'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HolidayIcon />}
                  onClick={() => navigate('/calendar?filter=holiday')}
                >
                  {isNepali ? 'बिदाहरू हेर्नुहोस्' : 'View Holidays'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ExamIcon />}
                  onClick={() => navigate('/calendar?filter=exam')}
                >
                  {isNepali ? 'परीक्षा तालिका' : 'Exam Schedule'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

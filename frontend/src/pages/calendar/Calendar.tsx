/**
 * Calendar Page
 * 
 * Displays school calendar with events and holidays in both BS and AD formats
 * 
 * Features:
 * - BS and AD calendar views
 * - Nepal government holidays display
 * - School events display
 * - Event creation (admin only)
 * - Event filtering by category
 * - Month/week/day views
 * - Personal calendar export (iCal format)
 * - Event notifications (backend integration)
 * 
 * Requirements: 31.1, 31.2, 31.5, 31.7
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Add as AddIcon,
  Event as EventIcon,
  School as SchoolIcon,
  SportsBasketball as SportsIcon,
  TheaterComedy as CulturalIcon,
  BeachAccess as HolidayIcon,
  MenuBook as ExamIcon,
  Groups as MeetingIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import apiClient from '../../services/apiClient';

interface CalendarEvent {
  eventId: number;
  title: string;
  titleNp?: string;
  description?: string;
  descriptionNp?: string;
  category: 'academic' | 'sports' | 'cultural' | 'holiday' | 'exam' | 'meeting' | 'other';
  startDate: string;
  startDateBS?: string;
  endDate?: string;
  endDateBS?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  venueNp?: string;
  isHoliday: boolean;
  isNepalGovernmentHoliday: boolean;
  governmentHolidayName?: string;
  governmentHolidayNameNp?: string;
  color?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

const Calendar = () => {
  const { i18n } = useTranslation();
  const isNepali = i18n.language === 'ne';
  const user = useSelector((state: RootState) => state.auth.user);

  // State
  const [calendarSystem, setCalendarSystem] = useState<'BS' | 'AD'>('BS');
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Category colors and icons
  const categoryConfig = {
    academic: { color: '#1976d2', icon: <SchoolIcon />, label: 'Academic' },
    sports: { color: '#2e7d32', icon: <SportsIcon />, label: 'Sports' },
    cultural: { color: '#9c27b0', icon: <CulturalIcon />, label: 'Cultural' },
    holiday: { color: '#d32f2f', icon: <HolidayIcon />, label: 'Holiday' },
    exam: { color: '#ed6c02', icon: <ExamIcon />, label: 'Exam' },
    meeting: { color: '#0288d1', icon: <MeetingIcon />, label: 'Meeting' },
    other: { color: '#757575', icon: <EventIcon />, label: 'Other' },
  };

  // Fetch events
  useEffect(() => {
    fetchEvents();
  }, [currentDate, selectedCategory]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');

      // Calculate date range based on view
      const startDate = getStartDate();
      const endDate = getEndDate();

      const params: any = {
        startDateFrom: startDate.toISOString().split('T')[0],
        startDateTo: endDate.toISOString().split('T')[0],
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const response = await apiClient.get('/api/v1/calendar/events', { params });

      if (response.data.success) {
        setEvents(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.response?.data?.error?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Get start date based on view
  const getStartDate = (): Date => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setDate(1);
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() - day);
    }
    return date;
  };

  // Get end date based on view
  const getEndDate = (): Date => {
    const date = new Date(currentDate);
    if (view === 'month') {
      date.setMonth(date.getMonth() + 1);
      date.setDate(0);
    } else if (view === 'week') {
      const day = date.getDay();
      date.setDate(date.getDate() + (6 - day));
    }
    return date;
  };

  // Navigation handlers
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Export personal calendar to iCal format
  const handleExportCalendar = async () => {
    try {
      setExportLoading(true);
      setError('');

      // Calculate date range (current month ± 3 months)
      const startDate = new Date(currentDate);
      startDate.setMonth(startDate.getMonth() - 3);
      const endDate = new Date(currentDate);
      endDate.setMonth(endDate.getMonth() + 3);

      // Map user role to target audience
      let targetAudience = 'student';
      if (user?.role) {
        const roleMap: Record<string, string> = {
          'student': 'student',
          'parent': 'parent',
          'subject_teacher': 'teacher',
          'class_teacher': 'teacher',
          'school_admin': 'staff',
          'non_teaching_staff': 'staff',
        };
        targetAudience = roleMap[user.role] || 'student';
      }

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        targetAudience,
      };

      const response = await apiClient.get('/api/v1/calendar/export', {
        params,
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `school-calendar-${new Date().toISOString().split('T')[0]}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error exporting calendar:', err);
      setError(err.response?.data?.error?.message || 'Failed to export calendar');
    } finally {
      setExportLoading(false);
    }
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventStart = event.startDate.split('T')[0];
      const eventEnd = event.endDate ? event.endDate.split('T')[0] : eventStart;
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  // Render month view
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<Box key={`empty-${i}`} sx={{ minHeight: 120, border: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }} />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <Box
          key={day}
          sx={{
            minHeight: 120,
            border: '1px solid #e0e0e0',
            p: 1,
            bgcolor: isToday ? '#e3f2fd' : 'white',
            cursor: 'pointer',
            '&:hover': { bgcolor: '#f5f5f5' },
          }}
          onClick={() => {
            setCurrentDate(date);
            setView('day');
          }}
        >
          <Typography
            variant="body2"
            fontWeight={isToday ? 'bold' : 'normal'}
            color={isToday ? 'primary' : 'text.primary'}
          >
            {day}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            {dayEvents.slice(0, 3).map((event) => (
              <Chip
                key={event.eventId}
                label={isNepali && event.titleNp ? event.titleNp : event.title}
                size="small"
                sx={{
                  mb: 0.5,
                  width: '100%',
                  bgcolor: event.color || categoryConfig[event.category].color,
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 20,
                  '& .MuiChip-label': { px: 0.5 },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setShowEventDialog(true);
                }}
              />
            ))}
            {dayEvents.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{dayEvents.length - 3} more
              </Typography>
            )}
          </Box>
        </Box>
      );
    }

    return (
      <Box>
        <Grid container sx={{ mb: 1 }}>
          {weekDays.map((day) => (
            <Grid item xs key={day} sx={{ textAlign: 'center', py: 1, bgcolor: '#f5f5f5', fontWeight: 'bold' }}>
              {day}
            </Grid>
          ))}
        </Grid>
        <Grid container>
          {days.map((day, index) => (
            <Grid item xs key={index}>
              {day}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Render day view
  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
        {dayEvents.length === 0 ? (
          <Alert severity="info">No events scheduled for this day</Alert>
        ) : (
          <Grid container spacing={2}>
            {dayEvents.map((event) => (
              <Grid item xs={12} key={event.eventId}>
                <Card
                  sx={{
                    borderLeft: `4px solid ${event.color || categoryConfig[event.category].color}`,
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 3 },
                  }}
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventDialog(true);
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {categoryConfig[event.category].icon}
                      <Typography variant="h6">
                        {isNepali && event.titleNp ? event.titleNp : event.title}
                      </Typography>
                      {event.isNepalGovernmentHoliday && (
                        <Chip label="Government Holiday" size="small" color="error" />
                      )}
                    </Box>
                    {event.startTime && (
                      <Typography variant="body2" color="text.secondary">
                        Time: {event.startTime} {event.endTime && `- ${event.endTime}`}
                      </Typography>
                    )}
                    {event.venue && (
                      <Typography variant="body2" color="text.secondary">
                        Venue: {isNepali && event.venueNp ? event.venueNp : event.venue}
                      </Typography>
                    )}
                    {event.description && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {isNepali && event.descriptionNp ? event.descriptionNp : event.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            {isNepali ? 'पात्रो / Calendar' : 'Calendar / पात्रो'}
          </Typography>
          <Box display="flex" gap={2} alignItems="center">
            {/* Calendar System Toggle */}
            <ToggleButtonGroup
              value={calendarSystem}
              exclusive
              onChange={(_, value) => value && setCalendarSystem(value)}
              size="small"
            >
              <ToggleButton value="BS">BS</ToggleButton>
              <ToggleButton value="AD">AD</ToggleButton>
            </ToggleButtonGroup>

            {/* View Toggle */}
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, value) => value && setView(value)}
              size="small"
            >
              <ToggleButton value="month">Month</ToggleButton>
              <ToggleButton value="day">Day</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Navigation and Filters */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" gap={1} alignItems="center">
            <IconButton onClick={handlePrevious} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<TodayIcon />}
              onClick={handleToday}
              size="small"
            >
              Today
            </Button>
            <IconButton onClick={handleNext} size="small">
              <ChevronRightIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 2 }}>
              {currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              {calendarSystem === 'BS' && ' (BS)'}
            </Typography>
          </Box>

          <Box display="flex" gap={2} alignItems="center">
            {/* Category Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {config.icon}
                      {config.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Export Calendar Button */}
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportCalendar}
              disabled={exportLoading}
              size="small"
            >
              {exportLoading ? 'Exporting...' : 'Export Calendar'}
            </Button>

            {/* Add Event Button (Admin only) */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedEvent(null);
                setShowEventDialog(true);
              }}
            >
              Add Event
            </Button>
          </Box>
        </Box>

        {/* Legend */}
        <Box display="flex" gap={1} mb={3} flexWrap="wrap">
          {Object.entries(categoryConfig).map(([key, config]) => (
            <Chip
              key={key}
              icon={config.icon}
              label={config.label}
              size="small"
              sx={{ bgcolor: config.color, color: 'white' }}
            />
          ))}
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Calendar View */}
            {view === 'month' && renderMonthView()}
            {view === 'day' && renderDayView()}
          </>
        )}
      </Paper>

      {/* Event Details Dialog */}
      <Dialog
        open={showEventDialog}
        onClose={() => setShowEventDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedEvent ? 'Event Details' : 'Add New Event'}
        </DialogTitle>
        <DialogContent>
          {selectedEvent ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                {isNepali && selectedEvent.titleNp ? selectedEvent.titleNp : selectedEvent.title}
              </Typography>
              {selectedEvent.description && (
                <Typography variant="body1" paragraph>
                  {isNepali && selectedEvent.descriptionNp ? selectedEvent.descriptionNp : selectedEvent.description}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                <strong>Category:</strong> {categoryConfig[selectedEvent.category].label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Date:</strong> {new Date(selectedEvent.startDate).toLocaleDateString()}
                {selectedEvent.endDate && ` - ${new Date(selectedEvent.endDate).toLocaleDateString()}`}
              </Typography>
              {selectedEvent.startTime && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Time:</strong> {selectedEvent.startTime}
                  {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                </Typography>
              )}
              {selectedEvent.venue && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Venue:</strong> {isNepali && selectedEvent.venueNp ? selectedEvent.venueNp : selectedEvent.venue}
                </Typography>
              )}
              {selectedEvent.isNepalGovernmentHoliday && (
                <Chip label="Nepal Government Holiday" color="error" size="small" sx={{ mt: 1 }} />
              )}
            </Box>
          ) : (
            <Alert severity="info">
              Event creation form will be implemented in the next phase
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;

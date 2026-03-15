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
  useTheme,
  TextField,
  FormControlLabel,
  Checkbox,
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
import NepaliDate from 'nepali-date-converter';

import { C, useAdminStyles, R } from '../../theme/designTokens';

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

// Nepali month names
const NEPALI_MONTHS = [
  { en: 'Baisakh', np: 'बैशाख' },
  { en: 'Jestha', np: 'जेठ' },
  { en: 'Asar', np: 'असार' },
  { en: 'Shrawan', np: 'श्रावण' },
  { en: 'Bhadra', np: 'भाद्र' },
  { en: 'Aswin', np: 'आश्विन' },
  { en: 'Kartik', np: 'कार्तिक' },
  { en: 'Mangsir', np: 'मंसिर' },
  { en: 'Poush', np: 'पौष' },
  { en: 'Magh', np: 'माघ' },
  { en: 'Falgun', np: 'फाल्गुन' },
  { en: 'Chaitra', np: 'चैत्र' }
];

const Calendar = () => {
  const { i18n, t } = useTranslation();
  const isNepali = i18n.language === 'ne';
  const user = useSelector((state: RootState) => state.auth.user);
  const theme = useTheme();
  const S = useAdminStyles(theme);

  // State
  const [calendarSystem, setCalendarSystem] = useState<'BS' | 'AD'>('BS');
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentNepaliDate, setCurrentNepaliDate] = useState(() => new NepaliDate());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    titleNp: '',
    description: '',
    descriptionNp: '',
    category: 'academic' as CalendarEvent['category'],
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    venue: '',
    venueNp: '',
    isHoliday: false,
  });

  // Auto-detect academic year based on Nepali calendar
  // Academic year in Nepal typically runs from Baisakh (April/May) to Chaitra (March/April)
  useEffect(() => {
    const nepaliDate = new NepaliDate();
    const bsYear = nepaliDate.getYear();
    const bsMonth = nepaliDate.getMonth(); // 0-indexed
    
    // If current month is Baisakh (0) to Chaitra (11), academic year is current BS year
    // Academic year format: "2081" (starts in Baisakh 2081, ends in Chaitra 2082)
    const academicYear = `${bsYear}`;
    setCurrentAcademicYear(academicYear);
  }, []);

  // Sync Nepali date when AD date changes
  useEffect(() => {
    try {
      setCurrentNepaliDate(new NepaliDate(currentDate));
    } catch (error) {
      console.error('Error converting to Nepali date:', error);
    }
  }, [currentDate]);

  // Category colors and icons
  const categoryConfig = {
    academic: { color: '#4a5568', icon: <SchoolIcon />, label: 'Academic' },
    sports: { color: '#4a5568', icon: <SportsIcon />, label: 'Sports' },
    cultural: { color: '#6b7280', icon: <CulturalIcon />, label: 'Cultural' },
    holiday: { color: '#8b5a5a', icon: <HolidayIcon />, label: 'Holiday' },
    exam: { color: '#6b7280', icon: <ExamIcon />, label: 'Exam' },
    meeting: { color: '#6b7280', icon: <MeetingIcon />, label: 'Meeting' },
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
    if (calendarSystem === 'BS') {
      // Navigate BS calendar
      const newNepaliDate = new NepaliDate(
        currentNepaliDate.getYear(),
        currentNepaliDate.getMonth() - (view === 'month' ? 1 : view === 'week' ? 0 : 0),
        view === 'day' ? currentNepaliDate.getDate() - 1 : 1
      );
      setCurrentNepaliDate(newNepaliDate);
      setCurrentDate(newNepaliDate.toJsDate());
    } else {
      // Navigate AD calendar
      const newDate = new Date(currentDate);
      if (view === 'month') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (view === 'week') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (calendarSystem === 'BS') {
      // Navigate BS calendar
      const newNepaliDate = new NepaliDate(
        currentNepaliDate.getYear(),
        currentNepaliDate.getMonth() + (view === 'month' ? 1 : view === 'week' ? 0 : 0),
        view === 'day' ? currentNepaliDate.getDate() + 1 : 1
      );
      setCurrentNepaliDate(newNepaliDate);
      setCurrentDate(newNepaliDate.toJsDate());
    } else {
      // Navigate AD calendar
      const newDate = new Date(currentDate);
      if (view === 'month') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (view === 'week') {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      setCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setCurrentNepaliDate(new NepaliDate(today));
  };

  // Handle event form changes
  const handleEventFormChange = (field: string, value: any) => {
    setEventForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle event form submission
  const handleSaveEvent = async () => {
    try {
      setSaveLoading(true);
      setError('');

      // Validate required fields
      if (!eventForm.title || !eventForm.startDate || !eventForm.category) {
        setError(t('calendar.fillRequiredFields'));
        return;
      }

      const eventData = {
        ...eventForm,
        status: 'scheduled' as const,
      };

      const response = await apiClient.post('/api/v1/calendar/events', eventData);

      if (response.data.success) {
        // Refresh events
        await fetchEvents();
        // Close dialog and reset form
        setShowEventDialog(false);
        setEventForm({
          title: '',
          titleNp: '',
          description: '',
          descriptionNp: '',
          category: 'academic',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
          venue: '',
          venueNp: '',
          isHoliday: false,
        });
      }
    } catch (err: any) {
      console.error('Error saving event:', err);
      setError(err.response?.data?.error?.message || t('calendar.failedToSaveEvent'));
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle opening add event dialog
  const handleOpenAddEvent = () => {
    setSelectedEvent(null);
    setEventForm({
      title: '',
      titleNp: '',
      description: '',
      descriptionNp: '',
      category: 'academic',
      startDate: currentDate.toISOString().split('T')[0],
      endDate: '',
      startTime: '',
      endTime: '',
      venue: '',
      venueNp: '',
      isHoliday: false,
    });
    setShowEventDialog(true);
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
    if (calendarSystem === 'BS') {
      return renderBSMonthView();
    } else {
      return renderADMonthView();
    }
  };

  // Render BS month view
  const renderBSMonthView = () => {
    const bsYear = currentNepaliDate.getYear();
    const bsMonth = currentNepaliDate.getMonth();
    
    // Get days in current BS month
    let daysInMonth = 30;
    try {
      const nextMonth = bsMonth === 11 ? 0 : bsMonth + 1;
      const nextYear = bsMonth === 11 ? bsYear + 1 : bsYear;
      const nextMonthFirst = new NepaliDate(nextYear, nextMonth, 1);
      const currentMonthLast = new Date(nextMonthFirst.toJsDate().getTime() - 24 * 60 * 60 * 1000);
      const lastDayNepali = new NepaliDate(currentMonthLast);
      daysInMonth = lastDayNepali.getDate();
    } catch (error) {
      // Fallback
      for (let testDay = 32; testDay >= 29; testDay--) {
        try {
          new NepaliDate(bsYear, bsMonth, testDay);
          daysInMonth = testDay;
          break;
        } catch {
          continue;
        }
      }
    }

    const firstDayOfMonth = new NepaliDate(bsYear, bsMonth, 1);
    const startingDayOfWeek = firstDayOfMonth.toJsDate().getDay();

    const days = [];
    const weekDays = isNepali 
      ? ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <Box 
          key={`empty-${i}`} 
          sx={{ 
            minHeight: 120, 
            border: `1px solid ${theme.palette.divider}`, 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f5f5f5' 
          }} 
        />
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      try {
        const nepaliDate = new NepaliDate(bsYear, bsMonth, day);
        const date = nepaliDate.toJsDate();
        const dayEvents = getEventsForDate(date);
        const isToday = date.toDateString() === new Date().toDateString();

        days.push(
          <Box
            key={day}
            sx={{
              minHeight: 120,
              border: `1px solid ${theme.palette.divider}`,
              p: 1,
              bgcolor: isToday 
                ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : '#e3f2fd')
                : theme.palette.background.paper,
              cursor: 'pointer',
              '&:hover': { 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5' 
              },
            }}
            onClick={() => {
              setCurrentDate(date);
              setCurrentNepaliDate(nepaliDate);
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
                  +{dayEvents.length - 3} {t('calendar.more')}
                </Typography>
              )}
            </Box>
          </Box>
        );
      } catch (error) {
        // Skip invalid days
        break;
      }
    }

    return (
      <Box>
        <Grid container sx={{ mb: 1 }}>
          {weekDays.map((day) => (
            <Grid 
              item 
              xs 
              key={day} 
              sx={{ 
                textAlign: 'center', 
                py: 1, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5',
                fontWeight: 'bold',
                color: theme.palette.text.primary
              }}
            >
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

  // Render AD month view
  const renderADMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    const weekDays = isNepali 
      ? ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <Box 
          key={`empty-${i}`} 
          sx={{ 
            minHeight: 120, 
            border: `1px solid ${theme.palette.divider}`, 
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f5f5f5' 
          }} 
        />
      );
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
            border: `1px solid ${theme.palette.divider}`,
            p: 1,
            bgcolor: isToday 
              ? (theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : '#e3f2fd')
              : theme.palette.background.paper,
            cursor: 'pointer',
            '&:hover': { 
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5' 
            },
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
                +{dayEvents.length - 3} {t('calendar.more')}
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
            <Grid 
              item 
              xs 
              key={day} 
              sx={{ 
                textAlign: 'center', 
                py: 1, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5',
                fontWeight: 'bold',
                color: theme.palette.text.primary
              }}
            >
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
          <Alert severity="info">{t('calendar.noEvents')}</Alert>
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
                        <Chip label={t('calendar.governmentHoliday')} size="small" color="error" />
                      )}
                    </Box>
                    {event.startTime && (
                      <Typography variant="body2" color="text.secondary">
                        {t('calendar.time')}: {event.startTime} {event.endTime && `- ${event.endTime}`}
                      </Typography>
                    )}
                    {event.venue && (
                      <Typography variant="body2" color="text.secondary">
                        {t('calendar.venue')}: {isNepali && event.venueNp ? event.venueNp : event.venue}
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
      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            {t('calendar.title')}
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
              <ToggleButton value="month">{t('calendar.month')}</ToggleButton>
              <ToggleButton value="day">{t('calendar.day')}</ToggleButton>
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
              {t('calendar.today')}
            </Button>
            <IconButton onClick={handleNext} size="small">
              <ChevronRightIcon />
            </IconButton>
            <Box sx={{ ml: 2 }}>
              <Typography variant="h6">
                {calendarSystem === 'BS' ? (
                  <>
                    {NEPALI_MONTHS[currentNepaliDate.getMonth()].np} / {NEPALI_MONTHS[currentNepaliDate.getMonth()].en} {currentNepaliDate.getDate()}, {currentNepaliDate.getYear()} (BS)
                  </>
                ) : (
                  <>
                    {currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} (AD)
                  </>
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {calendarSystem === 'BS' ? (
                  <>
                    {currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} AD
                    {currentAcademicYear && ` • ${t('calendar.academicYear')}: ${currentAcademicYear}`}
                  </>
                ) : (
                  <>
                    {NEPALI_MONTHS[currentNepaliDate.getMonth()].np} / {NEPALI_MONTHS[currentNepaliDate.getMonth()].en} {currentNepaliDate.getDate()}, {currentNepaliDate.getYear()} BS
                    {currentAcademicYear && ` • ${t('calendar.academicYear')}: ${currentAcademicYear}`}
                  </>
                )}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" gap={2} alignItems="center">
            {/* Category Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{t('calendar.category')}</InputLabel>
              <Select
                value={selectedCategory}
                label={t('calendar.category')}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="all">{t('calendar.allCategories')}</MenuItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {config.icon}
                      {t(`calendar.categories.${key}`)}
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
              {exportLoading ? t('calendar.exporting') : t('calendar.exportCalendar')}
            </Button>

            {/* Add Event Button (Admin only) */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddEvent}
            >
              {t('calendar.addEvent')}
            </Button>
          </Box>
        </Box>

        {/* Legend */}
        <Box display="flex" gap={1} mb={3} flexWrap="wrap">
          {Object.entries(categoryConfig).map(([key, config]) => (
            <Chip
              key={key}
              icon={config.icon}
              label={t(`calendar.categories.${key}`)}
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

      {/* Event Details/Create Dialog */}
      <Dialog
        open={showEventDialog}
        onClose={() => setShowEventDialog(false)}
        maxWidth="md"
        fullWidth
        disableEnforceFocus
        disableAutoFocus
      >
        <DialogTitle>
          {selectedEvent ? t('calendar.eventDetails') : t('calendar.addNewEvent')}
        </DialogTitle>
        <DialogContent>
          {selectedEvent ? (
            // View Event Details
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
                <strong>{t('calendar.category')}:</strong> {t(`calendar.categories.${selectedEvent.category}`)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>{t('calendar.date')}:</strong> {new Date(selectedEvent.startDate).toLocaleDateString()}
                {selectedEvent.endDate && ` - ${new Date(selectedEvent.endDate).toLocaleDateString()}`}
              </Typography>
              {selectedEvent.startTime && (
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('calendar.time')}:</strong> {selectedEvent.startTime}
                  {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                </Typography>
              )}
              {selectedEvent.venue && (
                <Typography variant="body2" color="text.secondary">
                  <strong>{t('calendar.venue')}:</strong> {isNepali && selectedEvent.venueNp ? selectedEvent.venueNp : selectedEvent.venue}
                </Typography>
              )}
              {selectedEvent.isNepalGovernmentHoliday && (
                <Chip label={t('calendar.governmentHoliday')} color="error" size="small" sx={{ mt: 1 }} />
              )}
            </Box>
          ) : (
            // Create New Event Form
            <Box sx={{ mt: 2 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Grid container spacing={2}>
                {/* Title (English) */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label={t('calendar.form.titleEn')}
                    value={eventForm.title}
                    onChange={(e) => handleEventFormChange('title', e.target.value)}
                  />
                </Grid>

                {/* Title (Nepali) */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('calendar.form.titleNp')}
                    value={eventForm.titleNp}
                    onChange={(e) => handleEventFormChange('titleNp', e.target.value)}
                  />
                </Grid>

                {/* Description (English) */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label={t('calendar.form.descriptionEn')}
                    value={eventForm.description}
                    onChange={(e) => handleEventFormChange('description', e.target.value)}
                  />
                </Grid>

                {/* Description (Nepali) */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label={t('calendar.form.descriptionNp')}
                    value={eventForm.descriptionNp}
                    onChange={(e) => handleEventFormChange('descriptionNp', e.target.value)}
                  />
                </Grid>

                {/* Category */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('calendar.category')}</InputLabel>
                    <Select
                      value={eventForm.category}
                      label={t('calendar.category')}
                      onChange={(e) => handleEventFormChange('category', e.target.value)}
                    >
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <MenuItem key={key} value={key}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {config.icon}
                            {t(`calendar.categories.${key}`)}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Is Holiday */}
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={eventForm.isHoliday}
                        onChange={(e) => handleEventFormChange('isHoliday', e.target.checked)}
                      />
                    }
                    label={t('calendar.form.isHoliday')}
                  />
                </Grid>

                {/* Start Date */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label={t('calendar.form.startDate')}
                    value={eventForm.startDate}
                    onChange={(e) => handleEventFormChange('startDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* End Date */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label={t('calendar.form.endDate')}
                    value={eventForm.endDate}
                    onChange={(e) => handleEventFormChange('endDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText={t('calendar.form.endDateOptional')}
                  />
                </Grid>

                {/* Start Time */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label={t('calendar.form.startTime')}
                    value={eventForm.startTime}
                    onChange={(e) => handleEventFormChange('startTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* End Time */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="time"
                    label={t('calendar.form.endTime')}
                    value={eventForm.endTime}
                    onChange={(e) => handleEventFormChange('endTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Venue (English) */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('calendar.form.venueEn')}
                    value={eventForm.venue}
                    onChange={(e) => handleEventFormChange('venue', e.target.value)}
                  />
                </Grid>

                {/* Venue (Nepali) */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('calendar.form.venueNp')}
                    value={eventForm.venueNp}
                    onChange={(e) => handleEventFormChange('venueNp', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventDialog(false)}>{t('common.close')}</Button>
          {!selectedEvent && (
            <Button
              variant="contained"
              onClick={handleSaveEvent}
              disabled={saveLoading}
            >
              {saveLoading ? t('common.saving') : t('common.save')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;

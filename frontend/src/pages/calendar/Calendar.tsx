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

import { useRef, useState, useEffect } from 'react';
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
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import apiClient from '../../services/apiClient';
import NepaliDate from 'nepali-date-converter';
import { YearSelectableDatePicker, parseDateOnly, formatDateOnly } from '../../components/YearSelectableDatePicker/YearSelectableDatePicker';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const isNepali = i18n.language === 'ne';
  const user = useSelector((state: RootState) => state.auth.user);
  const canEditEvents = ['School_Admin', 'ECA_Coordinator', 'Sports_Coordinator'].includes(user?.role || '');
  const canDeleteEvents = user?.role === 'School_Admin';
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
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>('');
  const [saveLoading, setSaveLoading] = useState(false);
  const dialogOpenerRef = useRef<HTMLElement | null>(null);

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

  // Keep the academic-year label in sync with the displayed Nepali calendar year.
  useEffect(() => {
    setCurrentAcademicYear(`${currentNepaliDate.getYear()}`);
  }, [currentNepaliDate]);

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
    academic: { color: C.neutral, icon: <SchoolIcon />, label: 'Academic' },
    sports: { color: C.neutral, icon: <SportsIcon />, label: 'Sports' },
    cultural: { color: C.neutral, icon: <CulturalIcon />, label: 'Cultural' },
    holiday: { color: C.danger, icon: <HolidayIcon />, label: 'Holiday' },
    exam: { color: C.neutral, icon: <ExamIcon />, label: 'Exam' },
    meeting: { color: C.neutral, icon: <MeetingIcon />, label: 'Meeting' },
    other: { color: C.neutral, icon: <EventIcon />, label: 'Other' },
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
        startDateFrom: formatDateOnly(startDate),
        startDateTo: formatDateOnly(endDate),
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

  const handleCalendarYearChange = (year: number) => {
    if (calendarSystem === 'BS') {
      const newNepaliDate = new NepaliDate(year, currentNepaliDate.getMonth(), 1);
      setCurrentNepaliDate(newNepaliDate);
      setCurrentDate(newNepaliDate.toJsDate());
      return;
    }

    const newDate = new Date(year, currentDate.getMonth(), 1);
    setCurrentDate(newDate);
    setCurrentNepaliDate(new NepaliDate(newDate));
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

      const response = selectedEvent && isEditingEvent
        ? await apiClient.put(`/api/v1/calendar/events/${selectedEvent.eventId}`, eventData)
        : await apiClient.post('/api/v1/calendar/events', eventData);

      if (response.data.success) {
        // Refresh events
        await fetchEvents();
        if (selectedEvent && isEditingEvent) {
          setSelectedEvent({ ...selectedEvent, ...eventData });
          setIsEditingEvent(false);
          return;
        }
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
  const handleOpenAddEvent = (initialDate = currentDate) => {
    setSelectedEvent(null);
    setIsEditingEvent(false);
    setEventForm({
      title: '',
      titleNp: '',
      description: '',
      descriptionNp: '',
      category: 'academic',
      startDate: formatDateOnly(initialDate),
      endDate: '',
      startTime: '',
      endTime: '',
      venue: '',
      venueNp: '',
      isHoliday: false,
    });
    setShowEventDialog(true);
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;
    setEventForm({
      title: selectedEvent.title,
      titleNp: selectedEvent.titleNp || '',
      description: selectedEvent.description || '',
      descriptionNp: selectedEvent.descriptionNp || '',
      category: selectedEvent.category,
      startDate: formatDateOnly(parseDateOnly(selectedEvent.startDate)),
      endDate: formatDateOnly(parseDateOnly(selectedEvent.endDate)),
      startTime: selectedEvent.startTime || '',
      endTime: selectedEvent.endTime || '',
      venue: selectedEvent.venue || '',
      venueNp: selectedEvent.venueNp || '',
      isHoliday: selectedEvent.isHoliday,
    });
    setIsEditingEvent(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    try {
      setDeleteLoading(true);
      setError('');
      await apiClient.delete(`/api/v1/calendar/events/${selectedEvent.eventId}`);
      await fetchEvents();
      setShowDeleteConfirmation(false);
      setShowEventDialog(false);
      setSelectedEvent(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('calendar.failedToDeleteEvent'));
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    const action = searchParams.get('action');
    const date = parseDateOnly(searchParams.get('date'));
    const filter = searchParams.get('filter');
    const validCategories = ['all', 'academic', 'sports', 'cultural', 'holiday', 'exam', 'meeting', 'other'];
    let shouldReplaceQuery = false;

    if (date) {
      setCurrentDate(date);
      searchParams.delete('date');
      shouldReplaceQuery = true;
    }
    if (filter && validCategories.includes(filter)) {
      setSelectedCategory(filter);
      searchParams.delete('filter');
      shouldReplaceQuery = true;
    }
    if (action === 'create') {
      handleOpenAddEvent(date ?? currentDate);
      searchParams.delete('action');
      shouldReplaceQuery = true;
    }
    if (shouldReplaceQuery) {
      setSearchParams(new URLSearchParams(searchParams), { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
        const normalizedRole = user.role.toLowerCase();
        const roleMap: Record<string, string> = {
          'student': 'student',
          'parent': 'parent',
          'subject_teacher': 'teacher',
          'class_teacher': 'teacher',
          'school_admin': 'staff',
          'non_teaching_staff': 'staff',
        };
        targetAudience = roleMap[normalizedRole] || 'student';
      }

      const params = {
        startDate: formatDateOnly(startDate),
        endDate: formatDateOnly(endDate),
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
      link.setAttribute('download', `school-calendar-${formatDateOnly(new Date())}.ics`);
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
    const dateStr = formatDateOnly(date);
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
                    dialogOpenerRef.current = e.currentTarget;
                    setSelectedEvent(event);
                    setIsEditingEvent(false);
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
                  dialogOpenerRef.current = e.currentTarget;
                  setSelectedEvent(event);
                  setIsEditingEvent(false);
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
                  onClick={(e) => {
                    dialogOpenerRef.current = e.currentTarget;
                    setSelectedEvent(event);
                    setIsEditingEvent(false);
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
      <Paper sx={{ ...S.GLASS, p: { xs: 1, sm: 3 }, mb: 3, minWidth: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 1, mb: 3, minWidth: 0 }}>
          <Typography variant="h4">
            {t('calendar.title')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', lg: 'center' }, gap: 2, mb: 3, minWidth: 0 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
            <IconButton
              onClick={handlePrevious}
              size="small"
              aria-label={`${t('common.previous')} ${t(view === 'day' ? 'calendar.day' : 'calendar.month')}`}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Button
              variant="outlined" sx={{ ...S.BTN_OUTLINE, flex: { xs: 1, sm: '0 0 auto' } }}
              startIcon={<TodayIcon />}
              onClick={handleToday}
              size="small"
            >
              {t('calendar.today')}
            </Button>
            <IconButton
              onClick={handleNext}
              size="small"
              aria-label={`${t('common.next')} ${t(view === 'day' ? 'calendar.day' : 'calendar.month')}`}
            >
              <ChevronRightIcon />
            </IconButton>
            <Box sx={{ ml: { xs: 0, sm: 1 }, flex: '1 1 180px', minWidth: 0 }}>
              <Typography variant="h6" component="h5">
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
            <Select
              value={calendarSystem === 'BS' ? currentNepaliDate.getYear() : currentDate.getFullYear()}
              size="small"
              inputProps={{ 'aria-label': 'Select year' }}
              onChange={(event) => handleCalendarYearChange(Number(event.target.value))}
              sx={{ minWidth: 100 }}
            >
              {Array.from(
                { length: 91 },
                (_, index) => (calendarSystem === 'BS' ? 2000 : 1943) + index
              ).map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
            {/* Category Filter */}
            <FormControl size="small" sx={{ minWidth: { xs: 120, sm: 150 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
              <InputLabel id="calendar-category-label">{t('calendar.category')}</InputLabel>
              <Select
                labelId="calendar-category-label"
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
              variant="outlined" sx={S.BTN_OUTLINE}
              startIcon={<FileDownloadIcon />}
              onClick={handleExportCalendar}
              disabled={exportLoading}
              size="small"
            >
              {exportLoading ? t('calendar.exporting') : t('calendar.exportCalendar')}
            </Button>

            {/* Add Event Button (Admin only) */}
            <Button
              variant="contained" sx={{ ...S.BTN_PRIMARY, flex: { xs: 1, sm: '0 0 auto' } }}
              startIcon={<AddIcon />}
              onClick={(event) => {
                dialogOpenerRef.current = event.currentTarget;
                handleOpenAddEvent();
              }}
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
        disableRestoreFocus
        TransitionProps={{
          onExited: () => {
            window.requestAnimationFrame(() => {
              window.requestAnimationFrame(() => {
                const opener = dialogOpenerRef.current;
                if (opener?.isConnected) opener.focus();
              });
            });
          },
        }}
      >
        <DialogTitle>
          {selectedEvent ? (isEditingEvent ? t('calendar.editEvent') : t('calendar.eventDetails')) : t('calendar.addNewEvent')}
        </DialogTitle>
        <DialogContent>
          {selectedEvent && !isEditingEvent ? (
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
                    autoFocus
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
                  <YearSelectableDatePicker
                    label={t('calendar.form.startDate')}
                    value={parseDateOnly(eventForm.startDate)}
                    onChange={(date) => handleEventFormChange('startDate', formatDateOnly(date))}
                    required
                  />
                </Grid>

                {/* End Date */}
                <Grid item xs={12} md={6}>
                  <YearSelectableDatePicker
                    label={t('calendar.form.endDate')}
                    value={parseDateOnly(eventForm.endDate)}
                    onChange={(date) => handleEventFormChange('endDate', formatDateOnly(date))}
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
          <Button onClick={() => {
            setShowEventDialog(false);
            setIsEditingEvent(false);
          }}>{t('common.close')}</Button>
          {selectedEvent && !isEditingEvent && canEditEvents && (
            <Button startIcon={<EditIcon />} onClick={handleEditEvent}>
              {t('calendar.editEvent')}
            </Button>
          )}
          {selectedEvent && !isEditingEvent && canDeleteEvents && (
            <Button color="error" startIcon={<DeleteIcon />} onClick={() => {
              setError('');
              setShowDeleteConfirmation(true);
            }}>
              {t('calendar.deleteEvent')}
            </Button>
          )}
          {(!selectedEvent || isEditingEvent) && (
            <Button
              variant="contained" sx={S.BTN_PRIMARY}
              onClick={handleSaveEvent}
              disabled={saveLoading}
            >
              {saveLoading ? t('common.saving') : isEditingEvent ? t('calendar.saveChanges') : t('common.save')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={showDeleteConfirmation} onClose={() => !deleteLoading && setShowDeleteConfirmation(false)}>
        <DialogTitle>{t('calendar.deleteEvent')}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography>
            {t('calendar.confirmDelete')} {selectedEvent?.title}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirmation(false)} disabled={deleteLoading}>
            {t('common.cancel')}
          </Button>
          <Button color="error" variant="contained" onClick={handleDeleteEvent} disabled={deleteLoading}>
            {deleteLoading ? t('calendar.deleting') : t('calendar.deleteEvent')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;

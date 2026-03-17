/**
 * Event Management Page
 * 
 * Full CRUD operations for calendar events
 * 
 * Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Switch,
  useTheme,
} from '@mui/material';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';

const EVENT_CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'sports', label: 'Sports' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'exam', label: 'Exam' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
];

const TARGET_AUDIENCES = [
  { value: 'all', label: 'All' },
  { value: 'students', label: 'Students' },
  { value: 'parents', label: 'Parents' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'staff', label: 'Staff' },
];

const RECURRENCE_PATTERNS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

interface Event {
  eventId: number;
  title: string;
  titleNp?: string;
  description?: string;
  category: string;
  startDate: string;
  startDateBS?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  targetAudience: string;
  isHoliday: boolean;
  isNepalGovernmentHoliday: boolean;
  status: string;
}

export const EventManagement = () => {
  const { i18n, t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const isNepali = i18n.language === 'ne';

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    titleNp: '',
    description: '',
    descriptionNp: '',
    category: 'academic',
    startDate: '',
    startDateBS: '',
    endDate: '',
    endDateBS: '',
    startTime: '',
    endTime: '',
    venue: '',
    venueNp: '',
    isRecurring: false,
    recurrencePattern: '',
    recurrenceEndDate: '',
    targetAudience: 'all',
    targetClasses: [] as number[],
    isHoliday: false,
    isNepalGovernmentHoliday: false,
    governmentHolidayName: '',
    governmentHolidayNameNp: '',
    color: C.neutral,
  });

  useEffect(() => {
    fetchEvents();
  }, [page, rowsPerPage, search, categoryFilter, statusFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const response = await apiClient.get(`/api/v1/calendar/events?${params}`);
      setEvents(response.data.data);
      setTotalCount(response.data.pagination?.total || 0);
    } catch (error: any) {
      console.error('Failed to fetch events:', error);
      setError(error.response?.data?.error?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setSelectedEvent(event);
      setFormData({
        title: event.title,
        titleNp: event.titleNp || '',
        description: event.description || '',
        descriptionNp: '',
        category: event.category,
        startDate: event.startDate.split('T')[0],
        startDateBS: event.startDateBS || '',
        endDate: event.endDate ? event.endDate.split('T')[0] : '',
        endDateBS: '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        venue: event.venue || '',
        venueNp: '',
        isRecurring: event.isRecurring,
        recurrencePattern: event.recurrencePattern || '',
        recurrenceEndDate: '',
        targetAudience: event.targetAudience,
        targetClasses: [],
        isHoliday: event.isHoliday,
        isNepalGovernmentHoliday: event.isNepalGovernmentHoliday,
        governmentHolidayName: '',
        governmentHolidayNameNp: '',
        color: C.primary,
      });
    } else {
      setSelectedEvent(null);
      setFormData({
        title: '',
        titleNp: '',
        description: '',
        descriptionNp: '',
        category: 'academic',
        startDate: '',
        startDateBS: '',
        endDate: '',
        endDateBS: '',
        startTime: '',
        endTime: '',
        venue: '',
        venueNp: '',
        isRecurring: false,
        recurrencePattern: '',
        recurrenceEndDate: '',
        targetAudience: 'all',
        targetClasses: [],
        isHoliday: false,
        isNepalGovernmentHoliday: false,
        governmentHolidayName: '',
        governmentHolidayNameNp: '',
        color: C.primary,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEvent(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setError('');
      if (selectedEvent) {
        await apiClient.put(`/api/v1/calendar/events/${selectedEvent.eventId}`, formData);
        setSuccess(t('calendar.eventUpdated'));
      } else {
        await apiClient.post('/api/v1/calendar/events', formData);
        setSuccess(t('calendar.eventCreated'));
      }
      handleCloseDialog();
      fetchEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to save event:', error);
      setError(error.response?.data?.error?.message || 'Failed to save event');
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!window.confirm(t('calendar.confirmDelete'))) return;

    try {
      await apiClient.delete(`/api/v1/calendar/events/${eventId}`);
      setSuccess(t('calendar.eventDeleted'));
      fetchEvents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      setError(error.response?.data?.error?.message || 'Failed to delete event');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      academic: 'primary',
      sports: 'success',
      cultural: 'secondary',
      holiday: 'error',
      exam: 'warning',
      meeting: 'info',
      other: 'default',
    };
    return colors[category] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'info',
      ongoing: 'success',
      completed: 'default',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EventIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{t('calendar.eventManagement')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('calendar.eventManagementSubtitle')}</Typography>
            </Box>
          </Box>
          <Button
            sx={S.BTN_PRIMARY}
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            {t('calendar.addEvent')}
          </Button>
        </Box>
      </Paper>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ ...S.GLASS, p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label={t('calendar.search')}
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              endAdornment: <SearchIcon />,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('calendar.category')}</InputLabel>
            <Select
              value={categoryFilter}
              label={t('calendar.category')}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">{t('calendar.audienceAll')}</MenuItem>
              {EVENT_CATEGORIES.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('calendar.status')}</InputLabel>
            <Select
              value={statusFilter}
              label={t('calendar.status')}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">{t('calendar.audienceAll')}</MenuItem>
              <MenuItem value="scheduled">{t('calendar.scheduled')}</MenuItem>
              <MenuItem value="ongoing">{t('calendar.ongoing')}</MenuItem>
              <MenuItem value="completed">{t('calendar.completed')}</MenuItem>
              <MenuItem value="cancelled">{t('calendar.cancelled')}</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined" sx={S.BTN_OUTLINE}
            startIcon={<RefreshIcon />}
            onClick={fetchEvents}
          >
            {t('calendar.refresh')}
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={S.GLASS}>
        <Table>
          <TableHead sx={{ bgcolor: S.TH_BG }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>{t('calendar.eventTitle')}</TableCell>
              <TableCell>{t('calendar.category')}</TableCell>
              <TableCell>{t('calendar.date')}</TableCell>
              <TableCell>{t('calendar.time')}</TableCell>
              <TableCell>{t('calendar.venue')}</TableCell>
              <TableCell>{t('calendar.status')}</TableCell>
              <TableCell align="right">{t('calendar.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow sx={S.TR_HOVER}>
                <TableCell colSpan={8} align="center" sx={S.TD}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow sx={S.TR_HOVER}>
                <TableCell colSpan={8} align="center" sx={S.TD}>
                  {t('calendar.noEventsFound')}
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.eventId} hover sx={S.TR_HOVER}>
                  <TableCell sx={S.TD}>{event.eventId}</TableCell>
                  <TableCell sx={S.TD}>
                    <Box>
                      <Typography variant="body2">
                        {isNepali && event.titleNp ? event.titleNp : event.title}
                      </Typography>
                      {event.isHoliday && (
                        <Chip label={t('calendar.categories.holiday')} size="small" color="error" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={S.TD}>
                    <Chip
                      label={event.category}
                      size="small"
                      color={getCategoryColor(event.category) as any}
                    />
                  </TableCell>
                  <TableCell sx={S.TD}>
                    {event.startDateBS && `${event.startDateBS} BS`}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(event.startDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell sx={S.TD}>
                    {event.startTime || '-'}
                    {event.endTime && ` - ${event.endTime}`}
                  </TableCell>
                  <TableCell sx={S.TD}>{event.venue || '-'}</TableCell>
                  <TableCell sx={S.TD}>
                    <Chip
                      label={event.status}
                      size="small"
                      color={getStatusColor(event.status) as any}
                    />
                  </TableCell>
                  <TableCell align="right" sx={S.TD}>
                    <IconButton
                      size="small"
                      title="Edit"
                      onClick={() => handleOpenDialog(event)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Delete"
                      color="error"
                      onClick={() => handleDelete(event.eventId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Create/Edit Event Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedEvent
            ? t('calendar.editEvent')
            : t('calendar.addNewEvent')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('calendar.form.titleEn')}
                  fullWidth
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('calendar.form.titleNp')}
                  fullWidth
                  value={formData.titleNp}
                  onChange={(e) => setFormData({ ...formData, titleNp: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('calendar.description')}
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('calendar.category')}</InputLabel>
                  <Select
                    value={formData.category}
                    label={t('calendar.category')}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {EVENT_CATEGORIES.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {t(`calendar.categories.${cat.value}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('calendar.targetAudience')}</InputLabel>
                  <Select
                    value={formData.targetAudience}
                    label={t('calendar.targetAudience')}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  >
                    {TARGET_AUDIENCES.map((aud) => (
                      <MenuItem key={aud.value} value={aud.value}>
                        {t(`calendar.audience${aud.value.charAt(0).toUpperCase() + aud.value.slice(1)}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('calendar.form.startDate')}
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('calendar.form.endDate')}
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('calendar.form.startTime')}
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('calendar.form.endTime')}
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('calendar.form.venueEn')}
                  fullWidth
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('calendar.color')}
                  type="color"
                  fullWidth
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isHoliday}
                      onChange={(e) => setFormData({ ...formData, isHoliday: e.target.checked })}
                    />
                  }
                  label={t('calendar.isHoliday')}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isNepalGovernmentHoliday}
                      onChange={(e) => setFormData({ ...formData, isNepalGovernmentHoliday: e.target.checked })}
                    />
                  }
                  label={t('calendar.isGovtHoliday')}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    />
                  }
                  label={t('calendar.recurring')}
                />
              </Grid>
              {formData.isRecurring && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('calendar.recurrencePattern')}</InputLabel>
                    <Select
                      value={formData.recurrencePattern}
                      label={t('calendar.recurrencePattern')}
                      onChange={(e) => setFormData({ ...formData, recurrencePattern: e.target.value })}
                    >
                      {RECURRENCE_PATTERNS.map((pattern) => (
                        <MenuItem key={pattern.value} value={pattern.value}>
                          {t(`calendar.recurrencePatterns.${pattern.value}`)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('common.cancel')}
          </Button>
          <Button sx={S.BTN_PRIMARY} onClick={handleSubmit}>
            {selectedEvent ? t('common.save') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

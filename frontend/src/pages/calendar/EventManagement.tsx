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
} from '@mui/material';
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
  const { i18n } = useTranslation();
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
    color: '#1976d2',
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
        color: '#1976d2',
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
        color: '#1976d2',
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
        setSuccess('Event updated successfully');
      } else {
        await apiClient.post('/api/v1/calendar/events', formData);
        setSuccess('Event created successfully');
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
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await apiClient.delete(`/api/v1/calendar/events/${eventId}`);
      setSuccess('Event deleted successfully');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isNepali ? 'कार्यक्रम व्यवस्थापन' : 'Event Management'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {isNepali ? 'कार्यक्रम थप्नुहोस्' : 'Add Event'}
        </Button>
      </Box>

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

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label={isNepali ? 'खोज्नुहोस्' : 'Search'}
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
            <InputLabel>{isNepali ? 'प्रकार' : 'Category'}</InputLabel>
            <Select
              value={categoryFilter}
              label={isNepali ? 'प्रकार' : 'Category'}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">{isNepali ? 'सबै' : 'All'}</MenuItem>
              {EVENT_CATEGORIES.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{isNepali ? 'स्थिति' : 'Status'}</InputLabel>
            <Select
              value={statusFilter}
              label={isNepali ? 'स्थिति' : 'Status'}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">{isNepali ? 'सबै' : 'All'}</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="ongoing">Ongoing</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEvents}
          >
            {isNepali ? 'ताजा गर्नुहोस्' : 'Refresh'}
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>{isNepali ? 'शीर्षक' : 'Title'}</TableCell>
              <TableCell>{isNepali ? 'प्रकार' : 'Category'}</TableCell>
              <TableCell>{isNepali ? 'मिति' : 'Date'}</TableCell>
              <TableCell>{isNepali ? 'समय' : 'Time'}</TableCell>
              <TableCell>{isNepali ? 'स्थान' : 'Venue'}</TableCell>
              <TableCell>{isNepali ? 'स्थिति' : 'Status'}</TableCell>
              <TableCell align="right">{isNepali ? 'कार्यहरू' : 'Actions'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {isNepali ? 'कुनै कार्यक्रम फेला परेन' : 'No events found'}
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.eventId} hover>
                  <TableCell>{event.eventId}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {isNepali && event.titleNp ? event.titleNp : event.title}
                      </Typography>
                      {event.isHoliday && (
                        <Chip label="Holiday" size="small" color="error" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.category}
                      size="small"
                      color={getCategoryColor(event.category) as any}
                    />
                  </TableCell>
                  <TableCell>
                    {event.startDateBS && `${event.startDateBS} BS`}
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(event.startDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {event.startTime || '-'}
                    {event.endTime && ` - ${event.endTime}`}
                  </TableCell>
                  <TableCell>{event.venue || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={event.status}
                      size="small"
                      color={getStatusColor(event.status) as any}
                    />
                  </TableCell>
                  <TableCell align="right">
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
            ? isNepali ? 'कार्यक्रम सम्पादन गर्नुहोस्' : 'Edit Event'
            : isNepali ? 'नयाँ कार्यक्रम थप्नुहोस्' : 'Add New Event'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label={isNepali ? 'शीर्षक (अंग्रेजी)' : 'Title (English)'}
                  fullWidth
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={isNepali ? 'शीर्षक (नेपाली)' : 'Title (Nepali)'}
                  fullWidth
                  value={formData.titleNp}
                  onChange={(e) => setFormData({ ...formData, titleNp: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={isNepali ? 'विवरण' : 'Description'}
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{isNepali ? 'प्रकार' : 'Category'}</InputLabel>
                  <Select
                    value={formData.category}
                    label={isNepali ? 'प्रकार' : 'Category'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {EVENT_CATEGORIES.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>{isNepali ? 'लक्षित दर्शक' : 'Target Audience'}</InputLabel>
                  <Select
                    value={formData.targetAudience}
                    label={isNepali ? 'लक्षित दर्शक' : 'Target Audience'}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  >
                    {TARGET_AUDIENCES.map((aud) => (
                      <MenuItem key={aud.value} value={aud.value}>
                        {aud.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={isNepali ? 'सुरु मिति' : 'Start Date'}
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
                  label={isNepali ? 'अन्त्य मिति' : 'End Date'}
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={isNepali ? 'सुरु समय' : 'Start Time'}
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={isNepali ? 'अन्त्य समय' : 'End Time'}
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={isNepali ? 'स्थान' : 'Venue'}
                  fullWidth
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={isNepali ? 'रंग' : 'Color'}
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
                  label={isNepali ? 'बिदा हो' : 'Is Holiday'}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isNepalGovernmentHoliday}
                      onChange={(e) => setFormData({ ...formData, isNepalGovernmentHoliday: e.target.checked })}
                    />
                  }
                  label={isNepali ? 'सरकारी बिदा हो' : 'Is Government Holiday'}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    />
                  }
                  label={isNepali ? 'दोहोरिने' : 'Recurring'}
                />
              </Grid>
              {formData.isRecurring && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{isNepali ? 'दोहोरिने ढाँचा' : 'Recurrence Pattern'}</InputLabel>
                    <Select
                      value={formData.recurrencePattern}
                      label={isNepali ? 'दोहोरिने ढाँचा' : 'Recurrence Pattern'}
                      onChange={(e) => setFormData({ ...formData, recurrencePattern: e.target.value })}
                    >
                      {RECURRENCE_PATTERNS.map((pattern) => (
                        <MenuItem key={pattern.value} value={pattern.value}>
                          {pattern.label}
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
            {isNepali ? 'रद्द गर्नुहोस्' : 'Cancel'}
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedEvent
              ? isNepali ? 'अद्यावधिक गर्नुहोस्' : 'Update'
              : isNepali ? 'सिर्जना गर्नुहोस्' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

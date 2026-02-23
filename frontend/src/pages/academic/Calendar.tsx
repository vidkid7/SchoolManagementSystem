/**
 * Academic Calendar Page
 * 
 * View and manage school events and holidays
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface Event {
  eventId: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  category: string;
  targetAudience: string;
  venue?: string;
  isHoliday: boolean;
  status: string;
}

export const Calendar = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    category: 'academic',
    targetAudience: 'all',
    venue: '',
    isHoliday: false,
  });

  useEffect(() => {
    fetchEvents();
  }, [selectedMonth, selectedYear]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startDate = new Date(selectedYear, selectedMonth, 1).toISOString();
      const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString();
      
      const response = await api.get(`/calendar/events/range?startDate=${startDate}&endDate=${endDate}`);
      const eventsData = response.data?.data || response.data;
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (event?: Event) => {
    setEditMode(!!event);
    if (event) {
      setEditId(event.eventId);
      setEventForm({
        title: event.title,
        description: event.description || '',
        startDate: event.startDate.split('T')[0],
        endDate: event.endDate.split('T')[0],
        category: event.category,
        targetAudience: event.targetAudience,
        venue: event.venue || '',
        isHoliday: event.isHoliday,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setEditId(null);
    setEventForm({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      category: 'academic',
      targetAudience: 'all',
      venue: '',
      isHoliday: false,
    });
  };

  const handleSaveEvent = async () => {
    try {
      if (editMode && editId) {
        await api.put(`/calendar/events/${editId}`, eventForm);
      } else {
        await api.post('/calendar/events', eventForm);
      }
      handleCloseDialog();
      fetchEvents();
    } catch (error: any) {
      console.error('Failed to save event:', error);
      setError(error.response?.data?.message || 'Failed to save event');
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await api.delete(`/calendar/events/${id}`);
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      setError('Failed to delete event');
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, any> = {
      academic: 'primary',
      sports: 'success',
      cultural: 'secondary',
      exam: 'error',
      holiday: 'warning',
    };
    return colors[category] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Academic Calendar
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Event
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Month/Year Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Month</InputLabel>
              <Select
                value={selectedMonth}
                label="Month"
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {months.map((month, index) => (
                  <MenuItem key={index} value={index}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[2023, 2024, 2025, 2026, 2027].map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" textAlign="center">
              {months[selectedMonth]} {selectedYear}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Events Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h3" fontWeight={700}>
                    {events.length}
                  </Typography>
                  <Typography variant="body2">Total Events</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h3" fontWeight={700}>
                    {events.filter(e => e.isHoliday).length}
                  </Typography>
                  <Typography variant="body2">Holidays</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h3" fontWeight={700}>
                    {events.filter(e => e.category === 'exam').length}
                  </Typography>
                  <Typography variant="body2">Examinations</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Events List */}
      <Paper sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={600}>
            Events in {months[selectedMonth]} {selectedYear}
          </Typography>
        </Box>
        <List>
          {loading ? (
            <ListItem>
              <ListItemText primary="Loading events..." />
            </ListItem>
          ) : events.length === 0 ? (
            <ListItem>
              <ListItemText primary="No events found for this month" />
            </ListItem>
          ) : (
            events.map((event) => (
              <ListItem
                key={event.eventId}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 0 },
                }}
                secondaryAction={
                  <Box>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(event)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteEvent(event.eventId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {event.title}
                      </Typography>
                      <Chip
                        label={event.category}
                        size="small"
                        color={getCategoryColor(event.category)}
                      />
                      {event.isHoliday && (
                        <Chip label="Holiday" size="small" color="warning" />
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{ component: 'div' }}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                      </Typography>
                      {event.description && (
                        <Typography variant="body2" color="text.secondary">
                          {event.description}
                        </Typography>
                      )}
                      {event.venue && (
                        <Typography variant="body2" color="text.secondary">
                          Venue: {event.venue}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* Event Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editMode ? 'Edit Event' : 'Add Event'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Event Title"
                fullWidth
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={eventForm.startDate}
                onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={eventForm.endDate}
                onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={eventForm.category}
                  label="Category"
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                >
                  <MenuItem value="academic">Academic</MenuItem>
                  <MenuItem value="sports">Sports</MenuItem>
                  <MenuItem value="cultural">Cultural</MenuItem>
                  <MenuItem value="exam">Examination</MenuItem>
                  <MenuItem value="holiday">Holiday</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Target Audience</InputLabel>
                <Select
                  value={eventForm.targetAudience}
                  label="Target Audience"
                  onChange={(e) => setEventForm({ ...eventForm, targetAudience: e.target.value })}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="students">Students</MenuItem>
                  <MenuItem value="teachers">Teachers</MenuItem>
                  <MenuItem value="parents">Parents</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Venue"
                fullWidth
                value={eventForm.venue}
                onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEvent}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

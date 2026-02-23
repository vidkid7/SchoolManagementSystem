/**
 * Timetable Management Page
 * 
 * Manage class timetables and periods
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface Class {
  classId: number;
  gradeLevel: number;
  section: string;
}

interface Subject {
  subjectId: number;
  nameEn: string;
  code: string;
}

interface Teacher {
  staffId: number;
  firstName: string;
  lastName: string;
}

interface Period {
  periodId: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId: number;
  teacherId?: number;
  roomNumber?: string;
  subject?: Subject;
  teacher?: Teacher;
}

interface Timetable {
  timetableId: number;
  classId: number;
  dayOfWeek: number;
  periods: Period[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [
  { number: 1, start: '08:00', end: '08:45' },
  { number: 2, start: '08:45', end: '09:30' },
  { number: 3, start: '09:30', end: '10:15' },
  { number: 4, start: '10:30', end: '11:15' },
  { number: 5, start: '11:15', end: '12:00' },
  { number: 6, start: '12:00', end: '12:45' },
  { number: 7, start: '13:00', end: '13:45' },
];

export const Timetable = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');
  
  const [periodForm, setPeriodForm] = useState({
    dayOfWeek: 0,
    periodNumber: 1,
    startTime: '08:00',
    endTime: '08:45',
    subjectId: '',
    teacherId: '',
    roomNumber: '',
  });

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/academic/classes');
      const classesData = response.data?.data || response.data;
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/academic/subjects');
      const subjectsData = response.data?.data || response.data;
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/staff?role=subject_teacher');
      const teachersData = response.data?.data || response.data;
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  };

  const fetchTimetable = async () => {
    if (!selectedClass) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/academic/timetable/${selectedClass}`);
      const timetableData = response.data?.data || response.data;
      setTimetables(Array.isArray(timetableData) ? timetableData : []);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (dayIndex: number, periodNumber: number) => {
    const period = PERIODS.find(p => p.number === periodNumber);
    // Convert dayIndex to dayOfWeek (0=Sunday, 1=Monday, etc.)
    // DAYS array: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    // So dayIndex 0 = Monday = dayOfWeek 1
    const dayOfWeek = dayIndex + 1;
    
    // Check if period already exists
    const existingPeriod = getPeriodForSlot(dayIndex, periodNumber);
    
    if (existingPeriod) {
      // If period exists, show a message or allow editing
      setError('This period already has a subject assigned. Delete it first to reassign.');
      return;
    }
    
    setPeriodForm({
      dayOfWeek,
      periodNumber,
      startTime: period?.start || '08:00',
      endTime: period?.end || '08:45',
      subjectId: '',
      teacherId: '',
      roomNumber: '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setPeriodForm({
      dayOfWeek: 0,
      periodNumber: 1,
      startTime: '08:00',
      endTime: '08:45',
      subjectId: '',
      teacherId: '',
      roomNumber: '',
    });
  };

  const handleSavePeriod = async () => {
    if (!selectedClass) return;

    try {
      // First, create or get timetable for the day
      const timetable = timetables.find(t => t.dayOfWeek === periodForm.dayOfWeek);
      
      let timetableId = timetable?.timetableId;
      
      console.log('Current timetables:', timetables);
      console.log('Looking for dayOfWeek:', periodForm.dayOfWeek);
      console.log('Found timetable:', timetable);
      
      if (!timetableId) {
        const timetablePayload = {
          classId: selectedClass,
          academicYearId: 1, // Should get current academic year
          dayOfWeek: periodForm.dayOfWeek,
        };
        console.log('Creating timetable with payload:', timetablePayload);
        const response = await api.post('/academic/timetable', timetablePayload);
        console.log('Timetable creation response:', response.data);
        console.log('Response structure:', JSON.stringify(response.data, null, 2));
        
        // Extract timetableId from response
        const createdTimetable = response.data?.data;
        console.log('Created timetable object:', createdTimetable);
        
        if (!createdTimetable || !createdTimetable.timetableId) {
          console.error('Invalid response structure. Full response:', response);
          throw new Error(`Failed to create timetable: Invalid response structure. Response: ${JSON.stringify(response.data)}`);
        }
        timetableId = createdTimetable.timetableId;
        console.log('Extracted timetableId:', timetableId);
        
        // Refresh timetables list to include the newly created timetable
        console.log('Refreshing timetables list...');
        await fetchTimetable();
        console.log('Timetables after refresh:', timetables);
      }

      // Verify we have a valid timetableId before adding period
      if (!timetableId) {
        throw new Error('No timetable ID available');
      }

      // Add period to timetable
      const periodPayload = {
        timetableId,
        periodNumber: periodForm.periodNumber,
        startTime: periodForm.startTime,
        endTime: periodForm.endTime,
        subjectId: parseInt(periodForm.subjectId),
        teacherId: periodForm.teacherId ? parseInt(periodForm.teacherId) : undefined,
        roomNumber: periodForm.roomNumber || undefined,
      };
      console.log('Adding period with payload:', periodPayload);
      await api.post('/academic/timetable', periodPayload);

      handleCloseDialog();
      fetchTimetable();
    } catch (error: any) {
      console.error('Failed to save period:', error);
      console.error('Error response:', error.response?.data);
      console.error('Validation errors:', error.response?.data?.errors);
      
      // Check for specific error messages
      const errorMessage = error.response?.data?.message || error.response?.data?.error;
      
      // Display validation errors if available
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        setError(errorMessages);
      } else if (errorMessage) {
        setError(errorMessage);
      } else {
        setError('Failed to save period');
      }
    }
  };

  const getPeriodForSlot = (dayIndex: number, periodNumber: number): Period | undefined => {
    // Convert dayIndex (0-4 for Mon-Fri) to dayOfWeek (1-5 for Mon-Fri)
    const dayOfWeek = dayIndex + 1;
    const timetable = timetables.find(t => t.dayOfWeek === dayOfWeek);
    return timetable?.periods?.find(p => p.periodNumber === periodNumber);
  };

  const selectedClassInfo = classes.find(c => c.classId === selectedClass);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Timetable Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Class Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedClass || ''}
                label="Select Class"
                onChange={(e) => setSelectedClass(Number(e.target.value))}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls.classId} value={cls.classId}>
                    Class {cls.gradeLevel} - Section {cls.section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {selectedClassInfo && (
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ScheduleIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">
                    Class {selectedClassInfo.gradeLevel} - {selectedClassInfo.section}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {timetables.length} days scheduled
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Timetable Grid */}
      {selectedClass && (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600, minWidth: 100 }}>
                    Period / Day
                  </TableCell>
                  {DAYS.map((day, index) => (
                    <TableCell key={index} align="center" sx={{ color: 'white', fontWeight: 600 }}>
                      {day}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {PERIODS.map((period) => (
                  <TableRow key={period.number} hover>
                    <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 600 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Period {period.number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {period.start} - {period.end}
                        </Typography>
                      </Box>
                    </TableCell>
                    {DAYS.map((_, dayIndex) => {
                      const periodData = getPeriodForSlot(dayIndex, period.number);
                      return (
                        <TableCell
                          key={dayIndex}
                          align="center"
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' },
                            p: 1,
                          }}
                          onClick={() => handleOpenDialog(dayIndex, period.number)}
                        >
                          {periodData ? (
                            <Box>
                              <Chip
                                label={periodData.subject?.code || 'Subject'}
                                size="small"
                                color="primary"
                                sx={{ mb: 0.5 }}
                              />
                              {periodData.teacher && (
                                <Typography variant="caption" display="block">
                                  {periodData.teacher.firstName} {periodData.teacher.lastName}
                                </Typography>
                              )}
                              {periodData.roomNumber && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Room {periodData.roomNumber}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <IconButton size="small" color="primary">
                              <AddIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {!selectedClass && (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <ScheduleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Select a class to view and manage timetable
          </Typography>
        </Paper>
      )}

      {/* Add/Edit Period Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Add Period - {DAYS[periodForm.dayOfWeek - 1]} Period {periodForm.periodNumber}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={periodForm.subjectId}
                  label="Subject"
                  onChange={(e) => setPeriodForm({ ...periodForm, subjectId: e.target.value })}
                >
                  {subjects.map((subject) => (
                    <MenuItem key={subject.subjectId} value={subject.subjectId}>
                      {subject.code} - {subject.nameEn}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Teacher (Optional)</InputLabel>
                <Select
                  value={periodForm.teacherId}
                  label="Teacher (Optional)"
                  onChange={(e) => setPeriodForm({ ...periodForm, teacherId: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.staffId} value={teacher.staffId}>
                      {teacher.firstName} {teacher.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Start Time"
                type="time"
                fullWidth
                value={periodForm.startTime}
                onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="End Time"
                type="time"
                fullWidth
                value={periodForm.endTime}
                onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Room Number (Optional)"
                fullWidth
                value={periodForm.roomNumber}
                onChange={(e) => setPeriodForm({ ...periodForm, roomNumber: e.target.value })}
                placeholder="e.g., 101, Lab-A"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePeriod}>
            Save Period
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/**
 * Attendance Marking Page
 * 
 * Period-wise attendance marking with offline support
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
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  EventAvailable as ExcusedIcon,
  CloudDone as SyncedIcon,
  CloudOff as OfflineIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  roll_number: number;
  photo_url?: string;
  attendance_status?: 'present' | 'absent' | 'late' | 'excused';
}

export const AttendanceMarking = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/academic/classes');
      const classesData = response.data?.data || [];
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/students', {
        params: {
          classLevel: selectedClass,
          section: selectedSection,
          status: 'active',
        },
      });
      
      // Initialize all students as present by default
      const studentsData = response.data?.data?.students || response.data?.data || response.data || [];
      const studentsWithStatus = Array.isArray(studentsData) 
        ? studentsData.map((student: any) => ({
            id: student.studentId || student.id,
            student_id: student.studentId || student.id,
            first_name: student.firstNameEn || student.first_name || '',
            last_name: student.lastNameEn || student.last_name || '',
            roll_number: student.rollNumber || student.roll_number || 0,
            photo_url: student.photoUrl || student.photo_url,
            attendance_status: 'present' as const,
          }))
        : [];
      
      setStudents(studentsWithStatus);
      
      if (studentsWithStatus.length === 0) {
        setError('No students found for the selected class and section');
      }
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      setError(error.response?.data?.message || 'Failed to load students. Please try again.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: number, status: 'present' | 'absent' | 'late' | 'excused') => {
    setStudents(students.map(student =>
      student.id === studentId
        ? { ...student, attendance_status: status }
        : student
    ));
  };

  const handleMarkAllPresent = () => {
    setStudents(students.map(student => ({
      ...student,
      attendance_status: 'present' as const,
    })));
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSection || !selectedPeriod) {
      setError('Please select class, section, and period');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (isOnline) {
        // Get the class ID - we need to find it from the classes array
        const selectedClassData = Array.isArray(classes) 
          ? classes.find(c => c.classLevel?.toString() === selectedClass)
          : null;
        const classId = selectedClassData?.classId || parseInt(selectedClass);

        // Get today's date in ISO format (YYYY-MM-DD)
        const today = new Date();
        const dateISO = today.toISOString().split('T')[0] + 'T00:00:00.000Z';

        // Save each student's attendance individually
        const promises = students.map(student =>
          api.post('/attendance/student/mark', {
            studentId: student.id,
            classId: classId,
            date: dateISO,
            status: student.attendance_status,
            periodNumber: parseInt(selectedPeriod),
            remarks: '',
          })
        );

        await Promise.all(promises);
        setShowSuccess(true);
        setError('');
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        // Save to localStorage for offline sync
        localStorage.setItem('pending_attendance', JSON.stringify({
          classId: selectedClass,
          section: selectedSection,
          students: students.map(s => ({
            studentId: s.id,
            status: s.attendance_status,
          })),
          date: new Date().toISOString(),
          periodNumber: parseInt(selectedPeriod),
          timestamp: new Date().toISOString(),
        }));
        setShowSuccess(true);
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Failed to save attendance:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save attendance. Please try again.';
      setError(errorMessage);
      setShowSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Mark Attendance / उपस्थिति चिन्ह लगाउनुहोस्
        </Typography>
        <Chip
          icon={isOnline ? <SyncedIcon /> : <OfflineIcon />}
          label={isOnline ? 'Online / अनलाइन' : 'Offline / अफलाइन'}
          color={isOnline ? 'success' : 'warning'}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setShowSuccess(false)}>
          Attendance saved successfully! / उपस्थिति सफलतापूर्वक बचत भयो!
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Class / कक्षा</InputLabel>
              <Select
                value={selectedClass}
                label="Class / कक्षा"
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setStudents([]);
                }}
              >
                {classes.length > 0 ? (
                  classes.map((cls) => (
                    <MenuItem key={cls.classId} value={cls.classLevel?.toString() || cls.classId?.toString()}>
                      Class {cls.classLevel || cls.classId} {cls.className ? `- ${cls.className}` : ''}
                    </MenuItem>
                  ))
                ) : (
                  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                    <MenuItem key={cls} value={cls.toString()}>
                      Class {cls}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Section / खण्ड</InputLabel>
              <Select
                value={selectedSection}
                label="Section / खण्ड"
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setStudents([]);
                }}
              >
                <MenuItem value="A">Section A</MenuItem>
                <MenuItem value="B">Section B</MenuItem>
                <MenuItem value="C">Section C</MenuItem>
                <MenuItem value="D">Section D</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Period / अवधि</InputLabel>
              <Select
                value={selectedPeriod}
                label="Period / अवधि"
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                  <MenuItem key={period} value={period.toString()}>
                    Period {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleMarkAllPresent}
              disabled={students.length === 0}
              sx={{ height: '56px' }}
            >
              Mark All Present / सबै उपस्थित
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Student List */}
      {loading ? (
        <Paper sx={{ p: 3 }}>
          <Typography align="center">Loading students... / विद्यार्थीहरू लोड हुँदैछ...</Typography>
        </Paper>
      ) : students.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {selectedClass && selectedSection 
              ? 'No students found / कुनै विद्यार्थी फेला परेन'
              : 'Please select class, section, and period / कृपया कक्षा, खण्ड र अवधि चयन गर्नुहोस्'
            }
          </Typography>
          {selectedClass && selectedSection && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No students are enrolled in Class {selectedClass} Section {selectedSection}.
              <br />
              Please check if students are added to this class or try a different class/section.
            </Typography>
          )}
          {!selectedClass && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Step 1: Select a class from the dropdown above
              <br />
              Step 2: Select a section
              <br />
              Step 3: Select a period
              <br />
              Step 4: Students will appear below for attendance marking
            </Typography>
          )}
        </Paper>
      ) : (
        <>
          <Grid container spacing={2}>
            {students.map((student) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={student.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={student.photo_url}
                        sx={{ width: 50, height: 50, mr: 2 }}
                      >
                        {student.first_name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {`${student.first_name} ${student.last_name}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Roll: {student.roll_number}
                        </Typography>
                      </Box>
                    </Box>

                    <ToggleButtonGroup
                      value={student.attendance_status}
                      exclusive
                      onChange={(_e, value) => value && handleStatusChange(student.id, value)}
                      fullWidth
                      size="small"
                    >
                      <Tooltip title="Present / उपस्थित" arrow>
                        <ToggleButton value="present" color="success">
                          <PresentIcon fontSize="small" />
                        </ToggleButton>
                      </Tooltip>
                      <Tooltip title="Absent / अनुपस्थित" arrow>
                        <ToggleButton value="absent" color="error">
                          <AbsentIcon fontSize="small" />
                        </ToggleButton>
                      </Tooltip>
                      <Tooltip title="Late / ढिलो" arrow>
                        <ToggleButton value="late" color="warning">
                          <LateIcon fontSize="small" />
                        </ToggleButton>
                      </Tooltip>
                      <Tooltip title="Excused / माफी" arrow>
                        <ToggleButton value="excused" color="info">
                          <ExcusedIcon fontSize="small" />
                        </ToggleButton>
                      </Tooltip>
                    </ToggleButtonGroup>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Tooltip 
              title="Click to save all attendance records to the database. Make sure you have selected class, section, and period, and marked attendance for all students."
              arrow
            >
              <span>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSave}
                  disabled={saving || students.length === 0}
                  sx={{ minWidth: 200 }}
                >
                  {saving ? 'Saving... / बचत गर्दै...' : 'Save Attendance / उपस्थिति बचत गर्नुहोस्'}
                </Button>
              </span>
            </Tooltip>
          </Box>

          {/* Legend */}
          <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Legend / किंवदंती
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PresentIcon color="success" />
                <Typography variant="body2">Present / उपस्थित</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AbsentIcon color="error" />
                <Typography variant="body2">Absent / अनुपस्थित</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LateIcon color="warning" />
                <Typography variant="body2">Late / ढिलो</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ExcusedIcon color="info" />
                <Typography variant="body2">Excused / माफी</Typography>
              </Box>
            </Box>
          </Paper>
        </>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        message={isOnline ? 'Attendance saved successfully / उपस्थिति सफलतापूर्वक बचत भयो' : 'Attendance saved offline. Will sync when online / उपस्थिति अफलाइन बचत भयो'}
      />
    </Box>
  );
};

/**
 * Class-Subject Assignment Page
 * 
 * Assign subjects to classes and manage teachers
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
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
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
  nameNp: string;
  code: string;
  type: string;
}

interface Teacher {
  staffId: number;
  firstName: string;
  lastName: string;
}

interface ClassSubject {
  classSubjectId: number;
  classId: number;
  subjectId: number;
  teacherId?: number;
  subject: Subject;
  teacher?: Teacher;
}

export const ClassSubjects = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');

  const [assignmentForm, setAssignmentForm] = useState({
    subjectId: '',
    teacherId: '',
  });

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassSubjects();
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

  const fetchClassSubjects = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      const response = await api.get(`/academic/classes/${selectedClass}/subjects`);
      const classSubjectsData = response.data?.data || response.data;
      setClassSubjects(Array.isArray(classSubjectsData) ? classSubjectsData : []);
    } catch (error) {
      console.error('Failed to fetch class subjects:', error);
      setError('Failed to load class subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setAssignmentForm({
      subjectId: '',
      teacherId: '',
    });
  };

  const handleAssignSubject = async () => {
    if (!selectedClass || !assignmentForm.subjectId) return;

    try {
      await api.post(`/academic/classes/${selectedClass}/subjects`, {
        subjectId: parseInt(assignmentForm.subjectId),
        teacherId: assignmentForm.teacherId ? parseInt(assignmentForm.teacherId) : undefined,
      });
      handleCloseDialog();
      fetchClassSubjects();
    } catch (error: any) {
      console.error('Failed to assign subject:', error);
      setError(error.response?.data?.message || 'Failed to assign subject');
    }
  };

  const handleRemoveSubject = async (subjectId: number) => {
    if (!selectedClass) return;
    if (!confirm('Are you sure you want to remove this subject from the class?')) return;

    try {
      await api.delete(`/academic/classes/${selectedClass}/subjects/${subjectId}`);
      fetchClassSubjects();
    } catch (error) {
      console.error('Failed to remove subject:', error);
      setError('Failed to remove subject');
    }
  };

  const getAvailableSubjects = () => {
    const assignedSubjectIds = classSubjects.map(cs => cs.subjectId);
    return subjects.filter(s => !assignedSubjectIds.includes(s.subjectId));
  };

  const selectedClassInfo = classes.find(c => c.classId === selectedClass);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Class-Subject Assignment
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
                <AssignmentIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6">
                    Class {selectedClassInfo.gradeLevel} - {selectedClassInfo.section}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {classSubjects.length} subjects assigned
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Assigned Subjects Table */}
      {selectedClass && (
        <Paper sx={{ borderRadius: 2 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Assigned Subjects
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              disabled={getAvailableSubjects().length === 0}
            >
              Assign Subject
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Subject Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subject Name (English)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subject Name (Nepali)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Assigned Teacher</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : classSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No subjects assigned to this class
                    </TableCell>
                  </TableRow>
                ) : (
                  classSubjects.map((cs) => (
                    <TableRow key={cs.classSubjectId} hover>
                      <TableCell>
                        <Chip label={cs.subject.code} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{cs.subject.nameEn}</TableCell>
                      <TableCell>{cs.subject.nameNp}</TableCell>
                      <TableCell>
                        <Chip
                          label={cs.subject.type === 'compulsory' ? 'Compulsory' : 'Optional'}
                          size="small"
                          color={cs.subject.type === 'compulsory' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {cs.teacher ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {cs.teacher.firstName} {cs.teacher.lastName}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not assigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveSubject(cs.subjectId)}
                          title="Remove subject"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {!selectedClass && (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <AssignmentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Select a class to manage subject assignments
          </Typography>
        </Paper>
      )}

      {/* Assign Subject Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Assign Subject to Class {selectedClassInfo?.gradeLevel}-{selectedClassInfo?.section}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={assignmentForm.subjectId}
                  label="Subject"
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, subjectId: e.target.value })}
                >
                  {getAvailableSubjects().map((subject) => (
                    <MenuItem key={subject.subjectId} value={subject.subjectId}>
                      {subject.code} - {subject.nameEn} ({subject.nameNp})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Teacher (Optional)</InputLabel>
                <Select
                  value={assignmentForm.teacherId}
                  label="Teacher (Optional)"
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, teacherId: e.target.value })}
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
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignSubject}
            disabled={!assignmentForm.subjectId}
          >
            Assign Subject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

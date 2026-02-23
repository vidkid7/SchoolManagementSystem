/**
 * Staff Assignments Page
 * 
 * Manage teacher assignments to subjects and classes
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  alpha,
  useTheme,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

interface Assignment {
  assignmentId: number;
  staffId: number;
  academicYearId: number;
  assignmentType: 'class_teacher' | 'subject_teacher';
  classId?: number;
  subjectId?: number;
  section?: string;
  department?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  className?: string;
  subjectName?: string;
}

interface StaffInfo {
  staffId: number;
  firstNameEn: string;
  lastNameEn: string;
  firstNameNp: string;
  lastNameNp: string;
  position?: string;
  department?: string;
  photoUrl?: string;
}

interface ClassInfo {
  classId: number;
  className: string;
}

interface SubjectInfo {
  subjectId: number;
  subjectName: string;
  subjectNameNp: string;
}

const CLASSES: ClassInfo[] = [
  { classId: 1, className: 'Class 1' },
  { classId: 2, className: 'Class 2' },
  { classId: 3, className: 'Class 3' },
  { classId: 4, className: 'Class 4' },
  { classId: 5, className: 'Class 5' },
  { classId: 6, className: 'Class 6' },
  { classId: 7, className: 'Class 7' },
  { classId: 8, className: 'Class 8' },
  { classId: 9, className: 'Class 9' },
  { classId: 10, className: 'Class 10' },
  { classId: 11, className: 'Class 11' },
  { classId: 12, className: 'Class 12' },
];

const SUBJECTS: SubjectInfo[] = [
  { subjectId: 1, subjectName: 'Mathematics', subjectNameNp: 'गणित' },
  { subjectId: 2, subjectName: 'Science', subjectNameNp: 'विज्ञान' },
  { subjectId: 3, subjectName: 'English', subjectNameNp: 'अंग्रेजी' },
  { subjectId: 4, subjectName: 'Nepali', subjectNameNp: 'नेपाली' },
  { subjectId: 5, subjectName: 'Social Studies', subjectNameNp: 'सामाजिक अध्ययन' },
  { subjectId: 6, subjectName: 'Computer Science', subjectNameNp: 'कम्प्युटर विज्ञान' },
  { subjectId: 7, subjectName: 'Health', subjectNameNp: 'स्वास्थ्य' },
  { subjectId: 8, subjectName: 'Physical Education', subjectNameNp: 'शारीरिक शिक्षा' },
];

const SECTIONS = ['A', 'B', 'C', 'D'];

export const StaffAssignments = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isNepali = i18n.language === 'ne';

  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assignmentType, setAssignmentType] = useState<'class_teacher' | 'subject_teacher'>('subject_teacher');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchStaffAndAssignments();
  }, [id]);

  const fetchStaffAndAssignments = async () => {
    try {
      setLoading(true);
      const [staffResponse, assignmentsResponse] = await Promise.all([
        apiClient.get(`/api/v1/staff/${id}`),
        apiClient.get(`/api/v1/staff/${id}/assignments`),
      ]);
      setStaff(staffResponse.data.data);
      setAssignments(assignmentsResponse.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedClass('');
    setSelectedSection('');
    setSelectedSubject('');
    setAssignmentType('subject_teacher');
    setIsActive(true);
    setEditingAssignment(null);
    setEditMode(false);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setSelectedClass(assignment.classId?.toString() || '');
    setSelectedSection(assignment.section || '');
    setSelectedSubject(assignment.subjectId?.toString() || '');
    setAssignmentType(assignment.assignmentType);
    setIsActive(assignment.isActive);
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSection) {
      setError(t('validation.required'));
      return;
    }

    try {
      const payload = {
        staffId: parseInt(id as string),
        academicYearId: 1,
        assignmentType,
        classId: parseInt(selectedClass),
        subjectId: selectedSubject ? parseInt(selectedSubject) : null,
        section: selectedSection,
        isActive,
        startDate: new Date().toISOString(),
      };

      if (editMode && editingAssignment) {
        // For edit mode, we need to end the old assignment and create a new one
        // Since there's no direct update endpoint
        await apiClient.put(`/api/v1/staff/assignments/${editingAssignment.assignmentId}/end`, {
          endDate: new Date().toISOString()
        });
        await apiClient.post(`/api/v1/staff/${id}/assign`, payload);
        setSuccess(t('staff.form.assignmentUpdated'));
      } else {
        await apiClient.post(`/api/v1/staff/${id}/assign`, payload);
        setSuccess(t('staff.form.assignmentAdded'));
      }

      handleCloseDialog();
      fetchStaffAndAssignments();
      setSnackbarOpen(true);
    } catch (error: any) {
      console.error('Failed to save assignment:', error);
      setError(error.response?.data?.message || t('messages.error'));
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!window.confirm(t('staff.form.confirmRemoveAssignment'))) {
      return;
    }

    try {
      await apiClient.delete(`/api/v1/staff/assignments/${assignmentId}`);
      setSuccess(t('staff.form.assignmentDeleted'));
      setSnackbarOpen(true);
      fetchStaffAndAssignments();
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      setError(t('messages.error'));
    }
  };

  const handleToggleActive = async (assignment: Assignment) => {
    try {
      if (assignment.isActive) {
        // Deactivate by ending the assignment
        await apiClient.put(`/api/v1/staff/assignments/${assignment.assignmentId}/end`, {
          endDate: new Date().toISOString()
        });
      } else {
        // Cannot reactivate an ended assignment - would need to create a new one
        setError('Cannot reactivate an ended assignment. Please create a new assignment instead.');
        return;
      }
      fetchStaffAndAssignments();
    } catch (error) {
      console.error('Failed to toggle assignment status:', error);
      setError(t('messages.error'));
    }
  };

  const getSubjectName = (subjectId: number | undefined) => {
    if (!subjectId) return '-';
    const subject = SUBJECTS.find(s => s.subjectId === subjectId);
    return subject ? (isNepali ? subject.subjectNameNp : subject.subjectName) : `-`;
  };

  const getClassName = (classId: number | undefined) => {
    if (!classId) return '-';
    const cls = CLASSES.find(c => c.classId === classId);
    return cls ? cls.className : `Class ${classId}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Typography>{t('common.loading')}</Typography>
      </Box>
    );
  }

  if (!staff) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">{t('staff.noStaffFound')}</Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/staff')} sx={{ mt: 2 }}>
          {t('common.back')}
        </Button>
      </Box>
    );
  }

  const activeCount = assignments.filter(a => a.isActive).length;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/staff')}
          sx={{ mb: 2 }}
          variant="text"
        >
          {t('staff.staffList')}
        </Button>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              {t('staff.form.teacherAssignments')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="action" fontSize="small" />
              <Typography variant="h6" color="text.secondary">
                {isNepali 
                  ? `${staff.firstNameNp || ''} ${staff.lastNameNp || ''}`.trim()
                  : `${staff.firstNameEn} ${staff.lastNameEn}`
                }
              </Typography>
              {staff.position && (
                <Chip 
                  label={staff.position} 
                  size="small" 
                  sx={{ ml: 1 }}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAddDialog}
              size="large"
            >
              {t('staff.form.addAssignment')}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1 }}>
                  {assignments.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('staff.form.totalAssignments')}
                </Typography>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: alpha('#10b981', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ActiveIcon sx={{ fontSize: 32, color: '#10b981' }} />
              </Box>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1, color: '#10b981' }}>
                  {activeCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('staff.form.activeAssignments')}
                </Typography>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: alpha('#6b7280', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <InactiveIcon sx={{ fontSize: 32, color: '#6b7280' }} />
              </Box>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700, lineHeight: 1, color: '#6b7280' }}>
                  {assignments.length - activeCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('staff.form.inactive')}
                </Typography>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Assignments Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
              <TableCell sx={{ fontWeight: 600 }}>{t('staff.form.assignmentType')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('menu.students')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('students.section')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('examinations.subject')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('staff.form.assignedDate')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('common.status')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {t('staff.form.noAssignments')}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={openAddDialog}
                      sx={{ mt: 2 }}
                    >
                      {t('staff.form.addAssignment')}
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.assignmentId} hover>
                  <TableCell>
                    <Chip 
                      label={assignment.assignmentType === 'class_teacher' 
                        ? t('staff.form.classTeacher') 
                        : t('staff.form.subjectTeacher')
                      } 
                      size="small" 
                      color={assignment.assignmentType === 'class_teacher' ? 'primary' : 'secondary'}
                      variant={assignment.isActive ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon fontSize="small" color="action" />
                      {getClassName(assignment.classId)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={assignment.section || '-'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {assignment.assignmentType === 'class_teacher' ? (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    ) : (
                      getSubjectName(assignment.subjectId)
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon fontSize="small" color="action" />
                      {new Date(assignment.startDate).toLocaleDateString(isNepali ? 'ne-NP' : 'en-US')}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={assignment.isActive ? t('common.active') : t('staff.form.inactive')} 
                      size="small" 
                      color={assignment.isActive ? 'success' : 'default'}
                      variant={assignment.isActive ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Tooltip title={assignment.isActive ? t('staff.form.inactive') : t('common.active')}>
                        <Switch
                          size="small"
                          checked={assignment.isActive}
                          onChange={() => handleToggleActive(assignment)}
                          color="success"
                        />
                      </Tooltip>
                      <Tooltip title={t('common.edit')}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openEditDialog(assignment)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteAssignment(assignment.assignmentId)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Assignment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editMode ? <EditIcon /> : <AddIcon />}
            {editMode ? t('staff.form.editAssignment') : t('staff.form.addNewAssignment')}
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('staff.form.assignmentType')}</InputLabel>
                <Select
                  value={assignmentType}
                  label={t('staff.form.assignmentType')}
                  onChange={(e) => setAssignmentType(e.target.value as 'class_teacher' | 'subject_teacher')}
                >
                  <MenuItem value="class_teacher">
                    {t('staff.form.classTeacher')}
                  </MenuItem>
                  <MenuItem value="subject_teacher">
                    {t('staff.form.subjectTeacher')}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('menu.students')}</InputLabel>
                <Select
                  value={selectedClass}
                  label={t('menu.students')}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {CLASSES.map((cls) => (
                    <MenuItem key={cls.classId} value={cls.classId.toString()}>
                      {cls.className}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('students.section')}</InputLabel>
                <Select
                  value={selectedSection}
                  label={t('students.section')}
                  onChange={(e) => setSelectedSection(e.target.value)}
                >
                  {SECTIONS.map((section) => (
                    <MenuItem key={section} value={section}>
                      Section {section}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {assignmentType === 'subject_teacher' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('examinations.subject')}</InputLabel>
                  <Select
                    value={selectedSubject}
                    label={t('examinations.subject')}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    {SUBJECTS.map((subject) => (
                      <MenuItem key={subject.subjectId} value={subject.subjectId.toString()}>
                        {isNepali ? subject.subjectNameNp : subject.subjectName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    color="success"
                  />
                }
                label={t('common.active')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!selectedClass || !selectedSection}
          >
            {editMode ? t('common.save') : t('staff.form.addAssignment')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for success/error messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {success || error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

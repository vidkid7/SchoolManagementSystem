/**
 * Class-Subject Assignment Page
 * 
 * Assign subjects to classes and manage teachers
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
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
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

import { C, useAdminStyles, R } from '../../theme/designTokens';

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
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams();
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
      const response = await apiClient.get('/academic/classes');
      const classesData = response.data?.data || response.data;
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await apiClient.get('/academic/subjects');
      const subjectsData = response.data?.data || response.data;
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await apiClient.get('/staff?role=subject_teacher');
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
      const response = await apiClient.get(`/academic/classes/${selectedClass}/subjects`);
      const classSubjectsData = response.data?.data || response.data;
      setClassSubjects(Array.isArray(classSubjectsData) ? classSubjectsData : []);
    } catch (error) {
      console.error('Failed to fetch class subjects:', error);
      setError(t('classSubjects.loadError'));
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
      await apiClient.post(`/academic/classes/${selectedClass}/subjects`, {
        subjectId: parseInt(assignmentForm.subjectId),
        teacherId: assignmentForm.teacherId ? parseInt(assignmentForm.teacherId) : undefined,
      });
      handleCloseDialog();
      fetchClassSubjects();
    } catch (error: any) {
      console.error('Failed to assign subject:', error);
      setError(error.response?.data?.message || t('classSubjects.assignError'));
    }
  };

  const handleRemoveSubject = async (subjectId: number) => {
    if (!selectedClass) return;
    if (!confirm(t('classSubjects.confirmRemove'))) return;

    try {
      await apiClient.delete(`/academic/classes/${selectedClass}/subjects/${subjectId}`);
      fetchClassSubjects();
    } catch (error) {
      console.error('Failed to remove subject:', error);
      setError(t('classSubjects.removeError'));
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate(`/academic`)}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight={600}>
            {t('classSubjects.title')}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Class Selector */}
      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>{t('classSubjects.selectClass')}</InputLabel>
              <Select
                value={selectedClass || ''}
                label={t('classSubjects.selectClass')}
                onChange={(e) => setSelectedClass(Number(e.target.value))}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls.classId} value={cls.classId}>
                    {t('classSubjects.classLabel')} {cls.gradeLevel} - {t('classSubjects.sectionLabel')} {cls.section}
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
                    {t('classSubjects.classLabel')} {selectedClassInfo.gradeLevel} - {selectedClassInfo.section}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {classSubjects.length} {t('classSubjects.subjectsAssigned')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Assigned Subjects Table */}
      {selectedClass && (
        <Paper sx={{ ...S.GLASS }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {t('classSubjects.assignedSubjects')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              disabled={getAvailableSubjects().length === 0}
            >
              {t('classSubjects.assignSubject')}
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t('classSubjects.subjectCode')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('classSubjects.subjectNameEn')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('classSubjects.subjectNameNp')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('classSubjects.type')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('classSubjects.assignedTeacher')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {t('common.loading')}
                    </TableCell>
                  </TableRow>
                ) : classSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {t('classSubjects.noSubjectsAssigned')}
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
                          label={cs.subject.type === 'compulsory' ? t('classSubjects.compulsory') : t('classSubjects.optional')}
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
                            {t('classSubjects.notAssigned')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveSubject(cs.subjectId)}
                          title={t('classSubjects.removeSubject')}
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
        <Paper sx={{ ...S.GLASS, p: 5, textAlign: 'center' }}>
          <AssignmentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('classSubjects.selectClassPrompt')}
          </Typography>
        </Paper>
      )}

      {/* Assign Subject Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {t('classSubjects.assignSubjectTo')} {selectedClassInfo?.gradeLevel}-{selectedClassInfo?.section}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('classSubjects.subject')}</InputLabel>
                <Select
                  value={assignmentForm.subjectId}
                  label={t('classSubjects.subject')}
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
                <InputLabel>{t('classSubjects.teacherOptional')}</InputLabel>
                <Select
                  value={assignmentForm.teacherId}
                  label={t('classSubjects.teacherOptional')}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, teacherId: e.target.value })}
                >
                  <MenuItem value="">{t('classSubjects.none')}</MenuItem>
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
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleAssignSubject}
            disabled={!assignmentForm.subjectId}
          >
            {t('classSubjects.assignSubject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

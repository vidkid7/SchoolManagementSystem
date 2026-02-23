/**
 * Class Management Page
 * 
 * Manage classes, sections, and subjects
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Alert,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  MenuBook as MenuBookIcon,
  People as PeopleIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface Class {
  class_id?: number;  // Database field name
  id?: number;        // Model field name (fallback)
  classId?: number;   // Alternative model field name
  grade_level: number;
  gradeLevel?: number;
  section: string;
  capacity: number;
  current_strength: number;
  currentStrength?: number;
  class_teacher_name?: string;
  classTeacherName?: string;
}

interface Subject {
  subject_id?: number;  // Database field name
  id?: number;          // Model field name (fallback)
  subjectId?: number;   // Alternative model field name
  code: string;
  name_en: string;
  nameEn?: string;
  name_np: string;
  nameNp?: string;
  type: 'compulsory' | 'optional';
  credit_hours: number;
  creditHours?: number;
  full_marks: number;
  fullMarks?: number;
}

export const ClassManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'class' | 'subject'>('class');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Class form
  const [classForm, setClassForm] = useState({
    grade_level: '',
    section: '',
    capacity: '',
  });

  // Subject form
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name_en: '',
    name_np: '',
    type: 'compulsory',
    credit_hours: '',
    full_marks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesResponse, subjectsResponse, studentsResponse] = await Promise.all([
        api.get('/academic/classes'),
        api.get('/academic/subjects'),
        api.get('/students?limit=1'), // Just get count, not all students
      ]);
      // API returns { success: true, data: [...] }, so we need response.data.data
      const classesData = classesResponse.data?.data || classesResponse.data;
      const subjectsData = subjectsResponse.data?.data || subjectsResponse.data;
      
      setClasses(Array.isArray(classesData) ? classesData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      
      // Get total student count from pagination info
      const studentCount = studentsResponse.data?.pagination?.total || studentsResponse.data?.total || 0;
      setTotalStudents(studentCount);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(t('academic.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type: 'class' | 'subject', item?: Class | Subject) => {
    setDialogType(type);
    setEditMode(!!item);
    
    if (item) {
      // Handle both snake_case and camelCase field names
      const itemId = (item as any).class_id || (item as any).classId || (item as any).subject_id || (item as any).subjectId || item.id;
      setEditId(itemId);
      
      if (type === 'class') {
        const cls = item as Class;
        setClassForm({
          grade_level: (cls.grade_level || cls.gradeLevel || 0).toString(),
          section: cls.section,
          capacity: cls.capacity.toString(),
        });
      } else {
        const subj = item as Subject;
        setSubjectForm({
          code: subj.code,
          name_en: subj.name_en || subj.nameEn || '',
          name_np: subj.name_np || subj.nameNp || '',
          type: subj.type,
          credit_hours: (subj.credit_hours || subj.creditHours || 0).toString(),
          full_marks: (subj.full_marks || subj.fullMarks || 0).toString(),
        });
      }
    }
    
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setEditId(null);
    setClassForm({ grade_level: '', section: '', capacity: '' });
    setSubjectForm({ code: '', name_en: '', name_np: '', type: 'compulsory', credit_hours: '', full_marks: '' });
  };

  const handleSaveClass = async () => {
    try {
      // Get the current academic year (you might want to fetch this from an API or state)
      // For now, we'll use academicYearId = 1 as default
      const academicYearId = 1; // TODO: Get from context or API
      
      const payload = {
        academicYearId,
        gradeLevel: parseInt(classForm.grade_level),
        section: classForm.section,
        capacity: parseInt(classForm.capacity),
      };

      if (editMode && editId) {
        await api.put('/academic/classes', { classId: editId, ...payload });
      } else {
        await api.post('/academic/classes', payload);
      }
      
      handleCloseDialog();
      fetchData();
    } catch (error: any) {
      console.error('Failed to save class:', error);
      setError(error.response?.data?.message || 'Failed to save class');
    }
  };

  const handleSaveSubject = async () => {
    try {
      const payload = {
        code: subjectForm.code,
        name_en: subjectForm.name_en,
        name_np: subjectForm.name_np,
        type: subjectForm.type,
        credit_hours: parseInt(subjectForm.credit_hours),
        full_marks: parseInt(subjectForm.full_marks),
      };

      if (editMode && editId) {
        await api.put('/academic/subjects', { subjectId: editId, ...payload });
      } else {
        await api.post('/academic/subjects', payload);
      }
      
      handleCloseDialog();
      fetchData();
    } catch (error: any) {
      console.error('Failed to save subject:', error);
      setError(error.response?.data?.message || 'Failed to save subject');
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm(t('academic.confirmDeleteClass'))) {
      return;
    }

    try {
      await api.delete(`/academic/classes/${id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete class:', error);
      setError(t('academic.failedToLoad'));
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm(t('academic.confirmDeleteSubject'))) {
      return;
    }

    try {
      await api.delete(`/academic/subjects/${id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete subject:', error);
      setError(t('academic.failedToLoad'));
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/academic')}
          sx={{ mb: 2 }}
          variant="text"
        >
          {t('common.back')}
        </Button>
        
        <Typography variant="h4" fontWeight={600}>
          {t('academic.title')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Fade in timeout={300}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex'
                }}>
                  <SchoolIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700}>
                    {classes.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {t('academic.totalClasses')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
        <Grid item xs={12} md={4}>
          <Fade in timeout={500}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex'
                }}>
                  <MenuBookIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700}>
                    {subjects.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {t('academic.totalSubjects')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
        <Grid item xs={12} md={4}>
          <Fade in timeout={700}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex'
                }}>
                  <PeopleIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h3" fontWeight={700}>
                    {totalStudents}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {t('academic.totalStudents')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)} sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          '& .MuiTab-root': { fontWeight: 500 }
        }}>
          <Tab label={t('academic.classes')} />
          <Tab label={t('academic.subjects')} />
        </Tabs>

        {/* Classes Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('class')}
            >
              {t('academic.addClass')}
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academic.class')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academic.section')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academic.capacity')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academic.currentStrength')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academic.classTeacher')}</TableCell>
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
                ) : classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {t('academic.noClassesFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((cls) => {
                    const classId = cls.class_id || cls.classId || cls.id;
                    const gradeLevel = cls.grade_level || cls.gradeLevel;
                    return (
                    <TableRow key={classId} hover>
                      <TableCell>
                        <Chip label={`${t('academic.class')} ${gradeLevel}`} color="primary" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={cls.section} size="small" />
                      </TableCell>
                      <TableCell>{cls.capacity}</TableCell>
                      <TableCell>
                        <Typography
                          color={(cls.current_strength || cls.currentStrength || 0) >= cls.capacity ? 'error' : 'inherit'}
                          fontWeight={(cls.current_strength || cls.currentStrength || 0) >= cls.capacity ? 600 : 400}
                        >
                          {cls.current_strength || cls.currentStrength || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {(cls.class_teacher_name || cls.classTeacherName) ? (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                              const classId = cls.class_id || cls.classId || cls.id;
                              window.location.href = `/academic/classes/${classId}/teacher`;
                            }}
                            sx={{ textTransform: 'none' }}
                          >
                            {cls.class_teacher_name || cls.classTeacherName}
                          </Button>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {t('academic.noClassTeacher')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          title={t('common.edit')}
                          onClick={() => handleOpenDialog('class', cls)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClass(cls.class_id || cls.classId || cls.id!)}
                          title={t('common.delete')}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Subjects Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('subject')}
            >
              {t('academic.addSubject')}
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academic.subjectCode')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academic.subjectNameEnglish')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academic.subjectNameNepali')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academic.subjectType')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academic.creditHours')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academic.fullMarks')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {t('common.loading')}
                    </TableCell>
                  </TableRow>
                ) : subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {t('academic.noSubjectsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((subject) => {
                    const subjectId = subject.subject_id || subject.subjectId || subject.id;
                    return (
                    <TableRow key={subjectId} hover>
                      <TableCell>
                        <Chip label={subject.code} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{subject.name_en}</TableCell>
                      <TableCell>{subject.name_np}</TableCell>
                      <TableCell>
                        <Chip
                          label={subject.type === 'compulsory' ? t('academic.compulsory') : t('academic.optional')}
                          color={subject.type === 'compulsory' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{subject.credit_hours}</TableCell>
                      <TableCell>{subject.full_marks}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            if (!subjectId || subjectId === undefined) {
                              alert('Error: Subject ID is undefined. Please refresh the page and try again.');
                              return;
                            }
                            window.location.href = `/academic/classes/1/subjects/${subjectId}/teachers`;
                          }}
                          sx={{ mr: 1, textTransform: 'none' }}
                        >
                          {t('academic.viewTeachers')}
                        </Button>
                        <IconButton 
                          size="small" 
                          color="primary" 
                          title={t('common.edit')}
                          onClick={() => handleOpenDialog('subject', subject)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteSubject(subject.subject_id || subject.subjectId || subject.id!)}
                          title={t('common.delete')}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editMode 
            ? (dialogType === 'class' ? t('academic.editClass') : t('academic.editSubject'))
            : (dialogType === 'class' ? t('academic.addClass') : t('academic.addSubject'))
          }
        </DialogTitle>
        <DialogContent>
          {dialogType === 'class' ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('academic.class')}</InputLabel>
                  <Select
                    value={classForm.grade_level}
                    label={t('academic.class')}
                    onChange={(e) => setClassForm({ ...classForm, grade_level: e.target.value })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                      <MenuItem key={cls} value={cls.toString()}>
                        {t('academic.class')} {cls}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('academic.section')}</InputLabel>
                  <Select
                    value={classForm.section}
                    label={t('academic.section')}
                    onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                  >
                    <MenuItem value="A">{t('academic.sectionA')}</MenuItem>
                    <MenuItem value="B">{t('academic.sectionB')}</MenuItem>
                    <MenuItem value="C">{t('academic.sectionC')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('academic.capacity')}
                  type="number"
                  fullWidth
                  value={classForm.capacity}
                  onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label={t('academic.subjectCode')}
                  fullWidth
                  value={subjectForm.code}
                  onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('academic.subjectNameEnglish')}
                  fullWidth
                  value={subjectForm.name_en}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name_en: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('academic.subjectNameNepali')}
                  fullWidth
                  value={subjectForm.name_np}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name_np: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('academic.subjectType')}</InputLabel>
                  <Select
                    value={subjectForm.type}
                    label={t('academic.subjectType')}
                    onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value as 'compulsory' | 'optional' })}
                  >
                    <MenuItem value="compulsory">{t('academic.compulsory')}</MenuItem>
                    <MenuItem value="optional">{t('academic.optional')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={t('academic.creditHours')}
                  type="number"
                  fullWidth
                  value={subjectForm.credit_hours}
                  onChange={(e) => setSubjectForm({ ...subjectForm, credit_hours: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={t('academic.fullMarks')}
                  type="number"
                  fullWidth
                  value={subjectForm.full_marks}
                  onChange={(e) => setSubjectForm({ ...subjectForm, full_marks: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={dialogType === 'class' ? handleSaveClass : handleSaveSubject}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

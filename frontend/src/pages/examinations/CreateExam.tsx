/**
 * Create/Edit Exam Form
 * Create or edit examination details
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  SelectChangeEvent,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { useCurrentAcademicYear } from '../../hooks/useCurrentAcademicYear';
import { C, useAdminStyles, R } from '../../theme/designTokens';

const examTypes = [
  { value: 'unit_test', label: 'examinations.unitTest' },
  { value: 'first_terminal', label: 'examinations.firstTerminal' },
  { value: 'second_terminal', label: 'examinations.secondTerminal' },
  { value: 'final', label: 'examinations.final' },
  { value: 'practical', label: 'examinations.practical' },
  { value: 'project', label: 'examinations.project' },
];

export function CreateExam() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { id } = useParams();
  const navigate = useSlugNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const { currentYear } = useCurrentAcademicYear();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([
    { termId: 1, name: 'examinations.firstTerm' },
    { termId: 2, name: 'examinations.secondTerm' },
    { termId: 3, name: 'examinations.thirdTerm' },
  ]);
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    classId: '',
    subjectId: '',
    academicYearId: '',
    termId: '1',
    examDate: '',
    duration: '180',
    fullMarks: '100',
    passMarks: '35',
    theoryMarks: '75',
    practicalMarks: '25',
    weightage: '100',
    isInternal: false,
  });

  // Auto-set academicYearId when current year is loaded
  useEffect(() => {
    if (currentYear && !formData.academicYearId) {
      setFormData(prev => ({ ...prev, academicYearId: String(currentYear.academicYearId) }));
    }
  }, [currentYear]);

  useEffect(() => {
    fetchDropdownData();
    if (id) {
      fetchExam();
    }
  }, [id]);

  const fetchDropdownData = async () => {
    try {
      const [subjectsRes, classesRes] = await Promise.all([
        apiClient.get('/academic/subjects').catch(() => { 
          return { data: { data: [
            { subjectId: 1, nameEn: 'Mathematics', nameNp: 'गणित' },
            { subjectId: 2, nameEn: 'Science', nameNp: 'विज्ञान' },
            { subjectId: 3, nameEn: 'English', nameNp: 'अंग्रेजी' },
            { subjectId: 4, nameEn: 'Nepali', nameNp: 'नेपाली' },
            { subjectId: 5, nameEn: 'Social Studies', nameNp: 'सामाजिक अध्ययन' },
          ] } }; 
        }),
        apiClient.get('/academic/classes').catch(() => { 
          const fallbackClasses = [];
          for (let grade = 1; grade <= 12; grade++) {
            for (const section of ['A', 'B', 'C']) {
              fallbackClasses.push({
                classId: (grade - 1) * 3 + ['A', 'B', 'C'].indexOf(section) + 1,
                gradeLevel: grade,
                section: section,
              });
            }
          }
          return { data: { data: fallbackClasses } }; 
        }),
      ]);
      
      setSubjects(subjectsRes.data?.data || []);
      setClasses(classesRes.data?.data || []);
      
      setTerms([
        { termId: 1, name: 'examinations.firstTerm' },
        { termId: 2, name: 'examinations.secondTerm' },
        { termId: 3, name: 'examinations.thirdTerm' },
      ]);
    } catch (error) {
      // Silently handle any unexpected errors
    }
  };

  const fetchExam = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/examinations/${id}`);
      const exam = response.data?.data;
      
      if (exam) {
        setFormData({
          name: exam.name || '',
          type: exam.type || '',
          classId: exam.classId?.toString() || '',
          subjectId: exam.subjectId?.toString() || '',
          academicYearId: exam.academicYearId?.toString() || '',
          termId: exam.termId?.toString() || '',
          examDate: exam.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : '',
          duration: exam.duration?.toString() || '180',
          fullMarks: exam.fullMarks?.toString() || '100',
          passMarks: exam.passMarks?.toString() || '35',
          theoryMarks: exam.theoryMarks?.toString() || '75',
          practicalMarks: exam.practicalMarks?.toString() || '25',
          weightage: exam.weightage?.toString() || '100',
          isInternal: exam.isInternal || false,
        });
      }
    } catch (error: any) {
      console.error('Failed to load exam:', error);
      setError(t('examinations.failedToLoadExamDetails'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    
    // Handle checkbox separately
    if ('checked' in e.target && (e.target as HTMLInputElement).type === 'checkbox') {
      setFormData({
        ...formData,
        [name as string]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name as string]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        ...formData,
        classId: parseInt(formData.classId),
        subjectId: parseInt(formData.subjectId),
        academicYearId: parseInt(formData.academicYearId),
        termId: parseInt(formData.termId),
        duration: parseInt(formData.duration),
        fullMarks: parseInt(formData.fullMarks),
        passMarks: parseInt(formData.passMarks),
        theoryMarks: parseInt(formData.theoryMarks),
        practicalMarks: parseInt(formData.practicalMarks),
        weightage: parseFloat(formData.weightage),
      };
      
      if (id) {
        await apiClient.put(`/examinations/${id}`, payload);
        setSuccess(t('examinations.examUpdatedSuccessfully'));
      } else {
        await apiClient.post('/examinations', payload);
        setSuccess(t('examinations.examCreatedSuccessfully'));
      }
      
      setTimeout(() => {
        navigate('/examinations/list');
      }, 1500);
    } catch (error: any) {
      console.error('Failed to save exam:', error);
      setError(error.response?.data?.message || t('examinations.failedToSaveExam'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/examinations/list')}
            sx={S.BTN_GHOST}
          >
            {t('common.back')}
          </Button>
          <Typography variant="h5" fontWeight={600}>
            {id ? t('examinations.editExam') : t('examinations.createNewExam')}
          </Typography>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            {t('examinations.basicInformation')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={t('examinations.examName')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('examinations.examNamePlaceholder')}
                sx={S.TF}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label={t('examinations.examType')}
                name="type"
                value={formData.type}
                onChange={handleChange}
                sx={S.TF}
              >
                {examTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {t(type.label)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label={t('common.subject')}
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                sx={S.TF}
              >
                {subjects.length === 0 ? (
                  <MenuItem value="" disabled>{t('common.loading')}...</MenuItem>
                ) : (
                  subjects.map((subject) => (
                    <MenuItem key={subject.subjectId} value={subject.subjectId}>
                      {subject.nameEn}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label={t('common.class')}
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                sx={S.TF}
              >
                {classes.length === 0 ? (
                  <MenuItem value="" disabled>{t('common.loading')}...</MenuItem>
                ) : (
                  classes.map((cls) => (
                    <MenuItem key={cls.classId} value={cls.classId}>
                      {t('common.class')} {cls.gradeLevel}{cls.section}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="date"
                label={t('examinations.examDate')}
                name="examDate"
                value={formData.examDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                sx={S.TF}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label={t('examinations.durationMinutes')}
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                sx={S.TF}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            {t('examinations.marksConfiguration')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                type="number"
                label={t('examinations.fullMarks')}
                name="fullMarks"
                value={formData.fullMarks}
                onChange={handleChange}
                sx={S.TF}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                type="number"
                label={t('examinations.passMarks')}
                name="passMarks"
                value={formData.passMarks}
                onChange={handleChange}
                sx={S.TF}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                type="number"
                label={t('examinations.theoryMarks')}
                name="theoryMarks"
                value={formData.theoryMarks}
                onChange={handleChange}
                sx={S.TF}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                required
                type="number"
                label={t('examinations.practicalMarks')}
                name="practicalMarks"
                value={formData.practicalMarks}
                onChange={handleChange}
                sx={S.TF}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                type="number"
                label={t('examinations.weightagePercent')}
                name="weightage"
                value={formData.weightage}
                onChange={handleChange}
                helperText={t('examinations.weightageHelper')}
                sx={S.TF}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isInternal}
                    onChange={handleChange}
                    name="isInternal"
                  />
                }
                label={t('examinations.internalAssessment')}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            {t('examinations.academicDetails')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('academic.academicYear')}
                value={currentYear ? `AY ${currentYear.name.replace('-', '/')}` : `${t('common.loading')}...`}
                InputProps={{ readOnly: true }}
                helperText={t('examinations.autoDetectedFromCalendar')}
                sx={S.TF}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                select
                label={t('examinations.term')}
                name="termId"
                value={formData.termId}
                onChange={handleChange}
                sx={S.TF}
              >
                {terms.map((term) => (
                  <MenuItem key={term.termId} value={term.termId.toString()}>
                    {t(term.name)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/examinations/list')}
              disabled={loading}
              sx={S.BTN_OUTLINE}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
              sx={S.BTN_PRIMARY}
            >
              {id ? t('examinations.updateExam') : t('examinations.createExam')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default CreateExam;

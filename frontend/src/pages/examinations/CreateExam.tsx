import { YearSelectableDateField } from '../../components/YearSelectableDatePicker/YearSelectableDatePicker';
/**
 * Create/Edit Exam Form
 * Create or edit examination details
 */

import { useState, useEffect, useCallback } from 'react';
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
import { useAdminStyles } from '../../theme/designTokens';

interface ExamSubject {
  subjectId: number;
  nameEn: string;
  nameNp?: string;
}

interface ExamClass {
  classId: number;
  gradeLevel: number;
  section: string;
}

interface AcademicTerm {
  termId: number;
  name: string;
}

interface ExamRecord {
  name: string;
  type: string;
  classId: number;
  subjectId: number;
  academicYearId: number;
  termId: number;
  examDate: string;
  duration: number;
  fullMarks: number;
  passMarks: number;
  theoryMarks: number;
  practicalMarks: number;
  weightage: number;
  isInternal: boolean;
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const response = (error as { response?: { data?: { message?: unknown } } } | null)?.response;
  return typeof response?.data?.message === 'string' ? response.data.message : fallback;
};

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

  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [classes, setClasses] = useState<ExamClass[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    classId: '',
    subjectId: '',
    academicYearId: '',
    termId: '',
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
      // Synchronize the fetched current academic year into this form.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({ ...prev, academicYearId: String(currentYear.academicYearId) }));
    }
  }, [currentYear, formData.academicYearId]);

  useEffect(() => {
    if (!formData.academicYearId) {
      return;
    }

    let active = true;
    const fetchTerms = async () => {
      setTermsLoading(true);
      setTermsError('');
      try {
        const response = await apiClient.get(`/academic/terms?academicYearId=${formData.academicYearId}`);
        if (!active) return;
        const availableTerms: AcademicTerm[] = Array.isArray(response.data?.data) ? response.data.data : [];
        setTerms(availableTerms);
        setFormData(prev => ({
          ...prev,
          termId: availableTerms.some((term) => String(term.termId) === prev.termId) ? prev.termId : '',
        }));
      } catch {
        if (!active) return;
        setTerms([]);
        setTermsError(t('examinations.failedToLoadTerms'));
      } finally {
        if (active) setTermsLoading(false);
      }
    };

    void fetchTerms();
    return () => { active = false; };
  }, [formData.academicYearId, t]);

  const fetchDropdownData = useCallback(async () => {
    setDropdownsLoading(true);
    try {
      const [subjectsRes, classesRes] = await Promise.all([
        apiClient.get('/academic/subjects'),
        apiClient.get('/academic/classes'),
      ]);
      setSubjects(Array.isArray(subjectsRes.data?.data) ? subjectsRes.data.data as ExamSubject[] : []);
      setClasses(Array.isArray(classesRes.data?.data) ? classesRes.data.data as ExamClass[] : []);
    } catch {
      setSubjects([]);
      setClasses([]);
      setError(t('examinations.failedToLoadDropdowns'));
    } finally {
      setDropdownsLoading(false);
    }
  }, [t]);

  const fetchExam = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/examinations/${id}`);
      const exam = response.data?.data as ExamRecord | undefined;
      
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
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, t('examinations.failedToLoadExamDetails')));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    // Load the reference lists and optional exam record when the route changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDropdownData();
    if (id) {
      void fetchExam();
    }
  }, [fetchDropdownData, fetchExam, id]);

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

    if (!formData.termId) {
      setError(terms.length === 0
        ? t('examinations.noTermsConfigured')
        : t('examinations.termRequired'));
      return;
    }
    
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
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, t('examinations.failedToSaveExam')));
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
                {dropdownsLoading ? (
                  <MenuItem value="" disabled>{t('common.loading')}...</MenuItem>
                ) : subjects.length === 0 ? (
                  <MenuItem value="" disabled>{t('examinations.noSubjectsAvailable')}</MenuItem>
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
                {dropdownsLoading ? (
                  <MenuItem value="" disabled>{t('common.loading')}...</MenuItem>
                ) : classes.length === 0 ? (
                  <MenuItem value="" disabled>{t('examinations.noClassesAvailable')}</MenuItem>
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
              <YearSelectableDateField
                fullWidth
                required
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
                error={Boolean(termsError)}
                helperText={termsError || (terms.length === 0 && !termsLoading ? t('examinations.noTermsConfigured') : undefined)}
                sx={S.TF}
              >
                {termsLoading ? (
                  <MenuItem value="" disabled>{t('common.loading')}...</MenuItem>
                ) : terms.length === 0 ? (
                  <MenuItem value="" disabled>{t('examinations.noTermsConfigured')}</MenuItem>
                ) : terms.map((term) => (
                    <MenuItem key={term.termId} value={String(term.termId)}>
                      {term.name}
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
              disabled={loading || dropdownsLoading || subjects.length === 0 || classes.length === 0 || termsLoading || terms.length === 0 || !formData.termId}
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

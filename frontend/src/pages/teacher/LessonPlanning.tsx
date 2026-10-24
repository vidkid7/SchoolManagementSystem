import { YearSelectableDateField } from '../../components/YearSelectableDatePicker/YearSelectableDatePicker';
/**
 * Lesson Planning Page
 * 
 * Create and manage lesson plans with syllabus tracking
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachFile as AttachFileIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';
import { useTheme } from '@mui/material/styles';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const authHdr = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

const toArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.lessonPlans)) return value.lessonPlans;
  if (Array.isArray(value?.syllabusProgress)) return value.syllabusProgress;
  if (Array.isArray(value?.progress)) return value.progress;
  if (Array.isArray(value?.classes)) return value.classes;
  if (Array.isArray(value?.subjects)) return value.subjects;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const getSubjectName = (subject: any): string => {
  if (typeof subject === 'string') return subject.trim();
  return String(subject?.nameEn ?? subject?.name_en ?? subject?.name ?? subject?.code ?? '').trim();
};

const getClassName = (schoolClass: any): string => {
  if (typeof schoolClass === 'string') return schoolClass.trim();
  const explicitName = schoolClass?.className ?? schoolClass?.class_name ?? schoolClass?.name;
  if (explicitName) return String(explicitName).trim();
  const gradeLevel = schoolClass?.gradeLevel ?? schoolClass?.grade_level;
  const section = String(schoolClass?.section ?? '').trim();
  if (gradeLevel === undefined || gradeLevel === null || gradeLevel === '') return '';
  return `Class ${gradeLevel}${section ? ` - Section ${section}` : ''}`;
};

type LessonPlanFormState = {
  subject: string;
  className: string;
  topic: string;
  date: string;
  duration: string;
  objectives: string;
  methodology: string;
  assessment: string;
};

export const buildLessonPlanPayload = (form: LessonPlanFormState, status: string) => ({
  ...form,
  topic: form.topic.trim(),
  duration: form.duration ? Number(form.duration) : 45,
  objectives: form.objectives.split(/\r?\n/).map((objective) => objective.trim()).filter(Boolean),
  status,
});

export const LessonPlanning = () => {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [syllabusTopics, setSyllabusTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ subject?: string; topic?: string; duration?: string }>({});
  const [lessonPlanForm, setLessonPlanForm] = useState<LessonPlanFormState>({
    subject: '',
    className: '',
    topic: '',
    date: '',
    duration: '45',
    objectives: '',
    methodology: '',
    assessment: '',
  });

  const loadData = useCallback(async () => {
    if (!accessToken) {
      setLessonPlans([]);
      setSyllabusTopics([]);
      setError(t('portal.failedToLoadData'));
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [plansRes, progressRes, subjectsRes, classesRes] = await Promise.all([
        apiClient.get('/api/v1/lesson-plans', { ...authHdr(accessToken), params: { limit: 50 } })
          .catch(() => {
            setError(t('portal.failedToLoadData'));
            return { data: { data: { lessonPlans: [] } } };
          }),
        apiClient.get('/api/v1/lesson-plans/syllabus-progress', { ...authHdr(accessToken), params: { limit: 50 } })
          .catch(() => {
            setError(t('portal.failedToLoadData'));
            return { data: { data: { progress: [] } } };
          }),
        apiClient.get('/api/v1/academic/subjects', authHdr(accessToken))
          .catch(() => {
            setError(t('portal.failedToLoadData'));
            return { data: { data: { subjects: [] } } };
          }),
        apiClient.get('/api/v1/academic/classes', authHdr(accessToken))
          .catch(() => {
            setError(t('portal.failedToLoadData'));
            return { data: { data: { classes: [] } } };
          }),
      ]);
      setLessonPlans(toArray(plansRes.data?.data));
      setSyllabusTopics(toArray(progressRes.data?.data));
      setSubjects(toArray(subjectsRes.data?.data));
      setClasses(toArray(classesRes.data?.data));
    } catch {
      setError(t('portal.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => { loadData(); }, [loadData]);

  const availableSubjects = subjects.map(getSubjectName).filter(Boolean);
  const availableClasses = classes.map(getClassName).filter(Boolean);
  const filteredLessonPlans = lessonPlans.filter((plan) => {
    const planSubject = getSubjectName(plan.subject ?? plan.subjectName ?? plan.subject_name);
    const planClass = getClassName(plan.className ?? plan.class_name ?? plan.class);
    return (!selectedSubject || planSubject === selectedSubject)
      && (!selectedClass || planClass === selectedClass);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'scheduled':
        return 'primary';
      case 'draft':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSyllabusStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'not_started':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleCreatePlan = () => {
    setError(null);
    setFormErrors({});
    setLessonPlanForm({
      subject: '',
      className: '',
      topic: '',
      date: '',
      duration: '45',
      objectives: '',
      methodology: '',
      assessment: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormErrors({});
  };

  const handleSavePlan = async (status: string = 'draft') => {
    if (!accessToken) return;
    const nextErrors: typeof formErrors = {};
    if (!lessonPlanForm.subject) nextErrors.subject = t('teacher.subjectRequired');
    if (!lessonPlanForm.topic.trim()) nextErrors.topic = t('teacher.topicRequired');
    if (lessonPlanForm.duration && (!Number.isSafeInteger(Number(lessonPlanForm.duration)) || Number(lessonPlanForm.duration) <= 0)) {
      nextErrors.duration = t('teacher.durationMustBePositiveInteger');
    }
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await apiClient.post('/api/v1/lesson-plans', buildLessonPlanPayload(lessonPlanForm, status), authHdr(accessToken));
      setOpenDialog(false);
      loadData();
    } catch {
      setError(t('portal.failedToLoadData'));
    }
  };

  const updateLessonPlanForm = (field: keyof typeof lessonPlanForm, value: string) => {
    setLessonPlanForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleDeletePlan= async (planId: number | string) => {
    if (!accessToken) return;
    try {
      await apiClient.delete(`/api/v1/lesson-plans/${planId}`, authHdr(accessToken));
      setLessonPlans(prev => prev.filter((p: any) => p.id !== planId));
    } catch {
      setError(t('portal.failedToLoadData'));
    }
  };

  const handleStatusChange= async (planId: number | string, newStatus: string) => {
    if (!accessToken) return;
    try {
      await apiClient.patch(`/api/v1/lesson-plans/${planId}/status`, { status: newStatus }, authHdr(accessToken));
      setLessonPlans(prev => prev.map((p: any) => p.id === planId ? { ...p, status: newStatus } : p));
    } catch {
      setError(t('portal.failedToLoadData'));
    }
  };

  if (loading)return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ mt: { xs: 7, sm: 8 } }}>
      {/* Header */}
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ScheduleIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{t('teacher.lessonPlanning')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('teacher.lessonPlanningSubtitle')}</Typography>
            </Box>
          </Box>
          <Button
            variant="contained" sx={S.BTN_PRIMARY}
            startIcon={<AddIcon />}
            onClick={handleCreatePlan}
          >
            {t('teacher.createLessonPlan')}
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="lesson-filter-subject-label">{t('common.subject')}</InputLabel>
              <Select
                id="lesson-filter-subject"
                name="lessonFilterSubject"
                labelId="lesson-filter-subject-label"
                value={selectedSubject}
                label={t('common.subject')}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <MenuItem value="">{t('common.all')} {t('common.subject')}</MenuItem>
                {availableSubjects.map((subject) => <MenuItem key={subject} value={subject}>{subject}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="lesson-filter-class-label">{t('common.class')}</InputLabel>
              <Select
                id="lesson-filter-class"
                name="lessonFilterClass"
                labelId="lesson-filter-class-label"
                value={selectedClass}
                label={t('common.class')}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <MenuItem value="">{t('common.allClasses')}</MenuItem>
                {availableClasses.map((schoolClass) => <MenuItem key={schoolClass} value={schoolClass}>{schoolClass}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              fullWidth
              sx={{ ...S.BTN_OUTLINE,  height: '56px' }}
              startIcon={<ViewIcon />}
              onClick={() => navigate(`/${municipalitySlug}/calendar`)}
            >
              {t('teacher.viewCalendar')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)}>
          <Tab label={t('portal.lessonPlans')} />
          <Tab label={t('teacher.syllabusProgress')} />
        </Tabs>

        {/* Lesson Plans Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {filteredLessonPlans.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">{t('portal.noData')}</Alert>
              </Grid>
            ) : filteredLessonPlans.map((plan) => (
              <Grid item xs={12} md={6} lg={4} key={plan.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {plan.topic}
                      </Typography>
                      <Chip
                        label={plan.status}
                        size="small"
                        color={getStatusColor(plan.status)}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {plan.subject} - {plan.className ?? plan.class}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                      <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {plan.date} | {plan.duration}
                      </Typography>
                    </Box>

                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                      {t('teacher.learningObjectives')}:
                    </Typography>
                    <List dense>
                      {(plan.objectives ?? []).map((obj: string, index: number) => (
                        <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                          <CheckCircleIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
                          <ListItemText
                            primary={obj}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>

                  <CardActions>
                    <IconButton size="small" color="primary" onClick={() => handleStatusChange(plan.id, plan.status === 'draft' ? 'scheduled' : 'completed')}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeletePlan(plan.id)}>
                      <DeleteIcon />
                    </IconButton>
                    <Button size="small" startIcon={<AttachFileIcon />} sx={{ ml: 'auto' }}>
                      {t('teacher.materials')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Syllabus Progress Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('teacher.overallProgress')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1, mr: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={syllabusTopics.length > 0 ? Math.round(syllabusTopics.reduce((sum: number, t: any) => sum + (t.progress ?? 0), 0) / syllabusTopics.length) : 0}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {syllabusTopics.length > 0 ? Math.round(syllabusTopics.reduce((sum: number, t: any) => sum + (t.progress ?? 0), 0) / syllabusTopics.length) : 0}% {t('teacher.complete')}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {syllabusTopics.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">{t('portal.noData')}</Alert>
              </Grid>
            ) : syllabusTopics.map((topic) => (
              <Grid item xs={12} key={topic.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {topic.unit}
                        </Typography>
                        <Typography variant="h6" gutterBottom>
                          {topic.topic}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                          <Box sx={{ flexGrow: 1, mr: 2 }}>
                            <LinearProgress
                              variant="determinate"
                              value={topic.progress}
                              color={topic.status === 'completed' ? 'success' : 'primary'}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {topic.progress ?? 0}%
                          </Typography>
                        </Box>
                      </Box>

                      <Chip
                        label={String(topic.status ?? 'not_started').replace('_', ' ')}
                        size="small"
                        color={getSyllabusStatusColor(topic.status)}
                        sx={{ ml: 2 }}
                      />
                    </Box>
                  </CardContent>

                  <CardActions>
                    <Button size="small" startIcon={<EditIcon />}>
                      {t('teacher.updateProgress')}
                    </Button>
                    <Button size="small" startIcon={<ViewIcon />}>
                      {t('common.details')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Create Lesson Plan Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{t('teacher.createLessonPlan')}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="lesson-form-subject-label">{t('common.subject')}</InputLabel>
                <Select
                  id="lesson-form-subject"
                  name="lessonSubject"
                  labelId="lesson-form-subject-label"
                  label={t('common.subject')}
                  value={lessonPlanForm.subject}
                  error={Boolean(formErrors.subject)}
                  onChange={(event) => updateLessonPlanForm('subject', event.target.value)}
                >
                  {availableSubjects.map((subject) => <MenuItem key={subject} value={subject}>{subject}</MenuItem>)}
                </Select>
                {formErrors.subject && <Typography variant="caption" color="error">{formErrors.subject}</Typography>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="lesson-form-class-label">{t('common.class')}</InputLabel>
                <Select
                  id="lesson-form-class"
                  name="lessonClass"
                  labelId="lesson-form-class-label"
                  label={t('common.class')}
                  value={lessonPlanForm.className}
                  onChange={(event) => updateLessonPlanForm('className', event.target.value)}
                >
                  {availableClasses.map((schoolClass) => <MenuItem key={schoolClass} value={schoolClass}>{schoolClass}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Topic / शीर्षक"
                placeholder="Enter lesson topic"
                value={lessonPlanForm.topic}
                onChange={(event) => updateLessonPlanForm('topic', event.target.value)}
                required
                error={Boolean(formErrors.topic)}
                helperText={formErrors.topic}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <YearSelectableDateField
                fullWidth
                label={t('common.date')}
                InputLabelProps={{ shrink: true }}
                value={lessonPlanForm.date}
                onChange={(event) => updateLessonPlanForm('date', event.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('teacher.duration')}
                placeholder={t('teacher.duration')}
                type="number"
                value={lessonPlanForm.duration}
                onChange={(event) => updateLessonPlanForm('duration', event.target.value)}
                error={Boolean(formErrors.duration)}
                helperText={formErrors.duration}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('teacher.learningObjectives')}
                placeholder={t('teacher.learningObjectives')}
                value={lessonPlanForm.objectives}
                onChange={(event) => updateLessonPlanForm('objectives', event.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={t('teacher.teachingActivities')}
                placeholder={t('teacher.teachingActivities')}
                value={lessonPlanForm.methodology}
                onChange={(event) => updateLessonPlanForm('methodology', event.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('teacher.assessmentMethods')}
                placeholder={t('teacher.assessmentMethods')}
                value={lessonPlanForm.assessment}
                onChange={(event) => updateLessonPlanForm('assessment', event.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                startIcon={<AttachFileIcon />}
                component="label"
              >
                {t('teacher.uploadMaterials')}
                <input type="file" hidden multiple />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={() => handleSavePlan('draft')} variant="contained" sx={S.BTN_PRIMARY}>
            {t('teacher.saveAsDraft')}
          </Button>
          <Button onClick={() => handleSavePlan('scheduled')} variant="contained" sx={S.BTN_PRIMARY} color="success">
            {t('teacher.saveAndSchedule')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

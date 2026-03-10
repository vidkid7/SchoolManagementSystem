/**
 * Lesson Planning Page
 * 
 * Create and manage lesson plans with syllabus tracking
 */

import { useState, useEffect, useCallback } from 'react';
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const authHdr = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const LessonPlanning = () => {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedClass, setSelectedClass] = useState('Class 10 A');
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [syllabusTopics, setSyllabusTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const [plansRes, progressRes] = await Promise.all([
        apiClient.get('/api/v1/lesson-plans', { ...authHdr(accessToken), params: { limit: 50 } })
          .catch(() => ({ data: { data: { lessonPlans: [] } } })),
        apiClient.get('/api/v1/lesson-plans/syllabus-progress', { ...authHdr(accessToken), params: { limit: 50 } })
          .catch(() => ({ data: { data: { progress: [] } } })),
      ]);
      setLessonPlans(plansRes.data?.data?.lessonPlans ?? plansRes.data?.data ?? []);
      setSyllabusTopics(progressRes.data?.data?.progress ?? progressRes.data?.data ?? []);
    } catch {
      setError('Failed to load lesson plans');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadData(); }, [loadData]);

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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSavePlan = async (status: string = 'draft') => {
    if (!accessToken) return;
    try {
      const formEl = document.querySelector('#lesson-plan-form') as HTMLFormElement | null;
      const formData: any = {};
      if (formEl) {
        const inputs = formEl.querySelectorAll('input, textarea, select');
        inputs.forEach((el: any) => {
          if (el.name) formData[el.name] = el.value;
        });
      }
      formData.status = status;
      await apiClient.post('/api/v1/lesson-plans', formData, authHdr(accessToken));
      setOpenDialog(false);
      loadData();
    } catch {
      setError('Failed to create lesson plan');
      setOpenDialog(false);
    }
  };

  const handleDeletePlan = async (planId: number | string) => {
    if (!accessToken) return;
    try {
      await apiClient.delete(`/api/v1/lesson-plans/${planId}`, authHdr(accessToken));
      setLessonPlans(prev => prev.filter((p: any) => p.id !== planId));
    } catch {
      setError('Failed to delete lesson plan');
    }
  };

  const handleStatusChange = async (planId: number | string, newStatus: string) => {
    if (!accessToken) return;
    try {
      await apiClient.patch(`/api/v1/lesson-plans/${planId}/status`, { status: newStatus }, authHdr(accessToken));
      setLessonPlans(prev => prev.map((p: any) => p.id === planId ? { ...p, status: newStatus } : p));
    } catch {
      setError('Failed to update lesson plan status');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Lesson Planning / पाठ योजना
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreatePlan}
        >
          Create Lesson Plan / नयाँ योजना
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Subject / विषय</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject / विषय"
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <MenuItem value="Mathematics">Mathematics / गणित</MenuItem>
                <MenuItem value="Physics">Physics / भौतिक विज्ञान</MenuItem>
                <MenuItem value="Chemistry">Chemistry / रसायन विज्ञान</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Class / कक्षा</InputLabel>
              <Select
                value={selectedClass}
                label="Class / कक्षा"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <MenuItem value="Class 10 A">Class 10 A</MenuItem>
                <MenuItem value="Class 10 B">Class 10 B</MenuItem>
                <MenuItem value="Class 11 Science">Class 11 Science</MenuItem>
                <MenuItem value="Class 12 Science">Class 12 Science</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              fullWidth
              sx={{ height: '56px' }}
              startIcon={<ViewIcon />}
            >
              View Calendar / पात्रो हेर्नुहोस्
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)}>
          <Tab label="Lesson Plans / पाठ योजना" />
          <Tab label="Syllabus Progress / पाठ्यक्रम प्रगति" />
        </Tabs>

        {/* Lesson Plans Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {lessonPlans.map((plan) => (
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
                      {plan.subject} - {plan.class}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                      <ScheduleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {plan.date} | {plan.duration}
                      </Typography>
                    </Box>

                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                      Learning Objectives:
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
                      Materials (3)
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
              Overall Progress / समग्र प्रगति
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
                {syllabusTopics.length > 0 ? Math.round(syllabusTopics.reduce((sum: number, t: any) => sum + (t.progress ?? 0), 0) / syllabusTopics.length) : 0}% Complete
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {syllabusTopics.map((topic) => (
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
                            {topic.progress}%
                          </Typography>
                        </Box>
                      </Box>

                      <Chip
                        label={topic.status.replace('_', ' ')}
                        size="small"
                        color={getSyllabusStatusColor(topic.status)}
                        sx={{ ml: 2 }}
                      />
                    </Box>
                  </CardContent>

                  <CardActions>
                    <Button size="small" startIcon={<EditIcon />}>
                      Update Progress
                    </Button>
                    <Button size="small" startIcon={<ViewIcon />}>
                      View Details
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
        <DialogTitle>Create Lesson Plan / नयाँ पाठ योजना</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Subject / विषय</InputLabel>
                <Select label="Subject / विषय" defaultValue="">
                  <MenuItem value="Mathematics">Mathematics / गणित</MenuItem>
                  <MenuItem value="Physics">Physics / भौतिक विज्ञान</MenuItem>
                  <MenuItem value="Chemistry">Chemistry / रसायन विज्ञान</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Class / कक्षा</InputLabel>
                <Select label="Class / कक्षा" defaultValue="">
                  <MenuItem value="Class 10 A">Class 10 A</MenuItem>
                  <MenuItem value="Class 10 B">Class 10 B</MenuItem>
                  <MenuItem value="Class 11 Science">Class 11 Science</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Topic / शीर्षक"
                placeholder="Enter lesson topic"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date / मिति"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration / अवधि"
                placeholder="e.g., 45 mins"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Learning Objectives / सिकाइ उद्देश्य"
                placeholder="Enter learning objectives (one per line)"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Teaching Activities / शिक्षण गतिविधि"
                placeholder="Describe teaching activities and methods"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Assessment Methods / मूल्याङ्कन विधि"
                placeholder="How will you assess student learning?"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<AttachFileIcon />}
                component="label"
              >
                Upload Teaching Materials
                <input type="file" hidden multiple />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel / रद्द गर्नुहोस्</Button>
          <Button onClick={() => handleSavePlan('draft')} variant="contained">
            Save as Draft / ड्राफ्ट सुरक्षित गर्नुहोस्
          </Button>
          <Button onClick={() => handleSavePlan('scheduled')} variant="contained" color="success">
            Save & Schedule / सुरक्षित र तालिका
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/**
 * Syllabus Management Page
 * 
 * Manage subject syllabus and topics
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MenuBook as BookIcon,
  CheckCircle as CheckIcon,
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

interface Topic {
  topicId: number;
  title: string;
  description?: string;
  estimatedHours: number;
  completedHours: number;
  orderIndex: number;
}

interface Syllabus {
  syllabusId: number;
  subjectId: number;
  classId: number;
  academicYearId: number;
  topics: Topic[];
}

export const Syllabus = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const [topicForm, setTopicForm] = useState({
    title: '',
    description: '',
    estimatedHours: '',
  });

  const [progressForm, setProgressForm] = useState({
    completedHours: '',
  });

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchClasses(), fetchSubjects()]);
      
      // Load selections from URL after data is loaded
      const classIdParam = searchParams.get('classId');
      const subjectIdParam = searchParams.get('subjectId');
      
      if (classIdParam) {
        setSelectedClass(Number(classIdParam));
      }
      if (subjectIdParam) {
        setSelectedSubject(Number(subjectIdParam));
      }
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      // Update URL with selections
      setSearchParams({ 
        classId: selectedClass.toString(), 
        subjectId: selectedSubject.toString() 
      });
      fetchSyllabus();
    }
  }, [selectedClass, selectedSubject]);

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

  const fetchSyllabus = async () => {
    if (!selectedClass || !selectedSubject) return;

    try {
      setLoading(true);
      const response = await api.get(
        `/academic/syllabus?classId=${selectedClass}&subjectId=${selectedSubject}`
      );
      console.log('Fetched syllabus response:', response.data);
      const syllabusData = response.data?.data || response.data;
      console.log('Syllabus data:', syllabusData);
      console.log('Topics:', syllabusData?.topics);
      setSyllabus(syllabusData);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSyllabus(null);
      } else {
        console.error('Failed to fetch syllabus:', error);
        setError('Failed to load syllabus');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSyllabus = async () => {
    if (!selectedClass || !selectedSubject) return;

    try {
      await api.post('/academic/syllabus', {
        classId: selectedClass,
        subjectId: selectedSubject,
        academicYearId: 1, // Should get current academic year
      });
      fetchSyllabus();
    } catch (error: any) {
      console.error('Failed to create syllabus:', error);
      setError(error.response?.data?.message || 'Failed to create syllabus');
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTopicForm({
      title: '',
      description: '',
      estimatedHours: '',
    });
  };

  const handleOpenProgressDialog = (topic: Topic) => {
    setSelectedTopic(topic);
    setProgressForm({
      completedHours: topic.completedHours.toString(),
    });
    setProgressDialogOpen(true);
  };

  const handleCloseProgressDialog = () => {
    setProgressDialogOpen(false);
    setSelectedTopic(null);
    setProgressForm({ completedHours: '' });
  };

  const handleSaveTopic = async () => {
    if (!syllabus) return;

    try {
      const estimatedHours = parseInt(topicForm.estimatedHours);
      
      // Validate input
      if (!topicForm.title.trim()) {
        setError('Topic title is required');
        return;
      }
      
      if (isNaN(estimatedHours) || estimatedHours < 1) {
        setError('Estimated hours must be at least 1');
        return;
      }

      console.log('Saving topic with data:', {
        syllabusId: syllabus.syllabusId,
        title: topicForm.title,
        description: topicForm.description,
        estimatedHours
      });

      const response = await api.post('/academic/syllabus', {
        syllabusId: syllabus.syllabusId,
        title: topicForm.title,
        description: topicForm.description,
        estimatedHours,
      });
      
      console.log('Topic saved successfully:', response.data);
      handleCloseDialog();
      fetchSyllabus();
    } catch (error: any) {
      console.error('Failed to save topic:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to save topic');
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedTopic) return;

    try {
      await api.put('/academic/syllabus', {
        topicId: selectedTopic.topicId,
        completedHours: parseInt(progressForm.completedHours),
      });
      handleCloseProgressDialog();
      fetchSyllabus();
    } catch (error: any) {
      console.error('Failed to update progress:', error);
      setError(error.response?.data?.message || 'Failed to update progress');
    }
  };

  const calculateProgress = () => {
    if (!syllabus?.topics || syllabus.topics.length === 0) return 0;
    
    const totalEstimated = syllabus.topics.reduce((sum, t) => sum + Number(t.estimatedHours), 0);
    const totalCompleted = syllabus.topics.reduce((sum, t) => sum + Number(t.completedHours), 0);
    
    console.log('Progress calculation:', { totalEstimated, totalCompleted, percentage: totalEstimated > 0 ? (totalCompleted / totalEstimated) * 100 : 0 });
    
    return totalEstimated > 0 ? (totalCompleted / totalEstimated) * 100 : 0;
  };

  const selectedClassInfo = classes.find(c => c.classId === selectedClass);
  const selectedSubjectInfo = subjects.find(s => s.subjectId === selectedSubject);
  const progress = calculateProgress();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Syllabus Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Class & Subject Selector */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
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
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Select Subject</InputLabel>
              <Select
                value={selectedSubject || ''}
                label="Select Subject"
                onChange={(e) => setSelectedSubject(Number(e.target.value))}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject.subjectId} value={subject.subjectId}>
                    {subject.code} - {subject.nameEn}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Syllabus Content */}
      {selectedClass && selectedSubject && (
        <>
          {syllabus ? (
            <Paper sx={{ borderRadius: 2 }}>
              {/* Header */}
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedSubjectInfo?.nameEn} - Class {selectedClassInfo?.gradeLevel}{selectedClassInfo?.section}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {syllabus.topics?.length || 0} topics
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenDialog}
                  >
                    Add Topic
                  </Button>
                </Box>

                {/* Progress Bar */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Overall Progress
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {progress.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              </Box>

              {/* Topics List */}
              <List>
                {syllabus.topics && syllabus.topics.length > 0 ? (
                  syllabus.topics.map((topic) => {
                    const topicProgress = topic.estimatedHours > 0
                      ? (topic.completedHours / topic.estimatedHours) * 100
                      : 0;
                    const isCompleted = topic.completedHours >= topic.estimatedHours;

                    return (
                      <ListItem
                        key={topic.topicId}
                        sx={{
                          borderBottom: 1,
                          borderColor: 'divider',
                          '&:last-child': { borderBottom: 0 },
                        }}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenProgressDialog(topic)}
                            >
                              Update Progress
                            </Button>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {isCompleted && <CheckIcon color="success" fontSize="small" />}
                              <Typography variant="subtitle1" fontWeight={600}>
                                {topic.title}
                              </Typography>
                              <Chip
                                label={`${topic.completedHours}/${topic.estimatedHours} hrs`}
                                size="small"
                                color={isCompleted ? 'success' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              {topic.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                  {topic.description}
                                </Typography>
                              )}
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(topicProgress, 100)}
                                sx={{ height: 6, borderRadius: 1 }}
                                color={isCompleted ? 'success' : 'primary'}
                              />
                            </>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                    );
                  })
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No topics added yet"
                      secondary="Click 'Add Topic' to start building the syllabus"
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          ) : (
            <Paper sx={{ p: 5, textAlign: 'center' }}>
              <BookIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No syllabus found for this class-subject combination
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateSyllabus}
                sx={{ mt: 2 }}
              >
                Create Syllabus
              </Button>
            </Paper>
          )}
        </>
      )}

      {!selectedClass || !selectedSubject ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <BookIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Select a class and subject to manage syllabus
          </Typography>
        </Paper>
      ) : null}

      {/* Add Topic Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Add Topic</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Topic Title"
                fullWidth
                value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                placeholder="e.g., Introduction to Algebra"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Estimated Hours"
                type="number"
                fullWidth
                value={topicForm.estimatedHours}
                onChange={(e) => setTopicForm({ ...topicForm, estimatedHours: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTopic}>
            Add Topic
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={progressDialogOpen} onClose={handleCloseProgressDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Update Progress</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Topic: {selectedTopic?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Estimated Hours: {selectedTopic?.estimatedHours}
            </Typography>
            <TextField
              label="Completed Hours"
              type="number"
              fullWidth
              value={progressForm.completedHours}
              onChange={(e) => setProgressForm({ completedHours: e.target.value })}
              sx={{ mt: 2 }}
              inputProps={{ min: 0, max: selectedTopic?.estimatedHours }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseProgressDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateProgress}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

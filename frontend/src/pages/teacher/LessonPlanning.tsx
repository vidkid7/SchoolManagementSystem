/**
 * Lesson Planning Page
 * 
 * Create and manage lesson plans with syllabus tracking
 */

import { useState } from 'react';
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

// Sample lesson plans
const lessonPlans = [
  {
    id: 1,
    subject: 'Mathematics',
    class: 'Class 10 A',
    topic: 'Quadratic Equations',
    date: '2081-10-26 BS',
    duration: '45 mins',
    status: 'draft',
    objectives: ['Understand quadratic formula', 'Solve quadratic equations'],
  },
  {
    id: 2,
    subject: 'Physics',
    class: 'Class 11 Science',
    topic: "Newton's Laws of Motion",
    date: '2081-10-25 BS',
    duration: '45 mins',
    status: 'completed',
    objectives: ['Understand three laws', 'Apply to real-world problems'],
  },
  {
    id: 3,
    subject: 'Mathematics',
    class: 'Class 10 B',
    topic: 'Trigonometry Basics',
    date: '2081-10-27 BS',
    duration: '45 mins',
    status: 'scheduled',
    objectives: ['Learn sine, cosine, tangent', 'Solve basic problems'],
  },
];

// Sample syllabus topics
const syllabusTopics = [
  { id: 1, unit: 'Unit 1: Algebra', topic: 'Linear Equations', status: 'completed', progress: 100 },
  { id: 2, unit: 'Unit 1: Algebra', topic: 'Quadratic Equations', status: 'in_progress', progress: 60 },
  { id: 3, unit: 'Unit 1: Algebra', topic: 'Polynomials', status: 'not_started', progress: 0 },
  { id: 4, unit: 'Unit 2: Geometry', topic: 'Triangles', status: 'not_started', progress: 0 },
  { id: 5, unit: 'Unit 2: Geometry', topic: 'Circles', status: 'not_started', progress: 0 },
];

export const LessonPlanning = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedClass, setSelectedClass] = useState('Class 10 A');

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

  const handleSavePlan = () => {
    // Save lesson plan logic
    setOpenDialog(false);
  };

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
                      {plan.objectives.map((obj, index) => (
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
                    <IconButton size="small" color="primary">
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
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
                  value={32}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                32% Complete
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
          <Button onClick={handleSavePlan} variant="contained">
            Save as Draft / ड्राफ्ट सुरक्षित गर्नुहोस्
          </Button>
          <Button onClick={handleSavePlan} variant="contained" color="success">
            Save & Schedule / सुरक्षित र तालिका
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

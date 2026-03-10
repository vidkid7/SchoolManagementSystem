/**
 * Assignment Management Page
 * 
 * Create assignments, view submissions, and grade student work
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Grade as GradeIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
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

export const AssignmentManagement = () => {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openGradeDialog, setOpenGradeDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradeMarks, setGradeMarks] = useState<string>('');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  const loadAssignments = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/api/v1/assignments', { ...authHdr(accessToken), params: { limit: 50 } })
        .catch(() => ({ data: { data: { assignments: [] } } }));
      setAssignments(res.data?.data?.assignments ?? res.data?.data ?? []);
    } catch {
      setError('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const loadSubmissions = useCallback(async (assignmentId: number | string) => {
    if (!accessToken) return;
    try {
      const res = await apiClient.get(`/api/v1/assignments/${assignmentId}/submissions`, authHdr(accessToken))
        .catch(() => ({ data: { data: { submissions: [] } } }));
      setSubmissions(res.data?.data?.submissions ?? res.data?.data ?? []);
    } catch {
      setSubmissions([]);
    }
  }, [accessToken]);

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'grading':
        return 'warning';
      case 'upcoming':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'success';
      case 'submitted':
        return 'primary';
      case 'late':
        return 'warning';
      case 'pending':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleCreateAssignment = () => {
    setOpenCreateDialog(true);
  };

  const handleViewSubmissions = (assignment: any) => {
    setSelectedAssignment(assignment);
    setTabValue(1);
    loadSubmissions(assignment.id);
  };

  const handleGradeSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setGradeMarks(submission.marks != null ? String(submission.marks) : '');
    setGradeFeedback(submission.feedback || '');
    setOpenGradeDialog(true);
  };

  const handleSaveAssignment = async () => {
    if (!accessToken) return;
    try {
      const formEl = document.querySelector('#assignment-form') as HTMLFormElement | null;
      const formData: any = {};
      if (formEl) {
        const inputs = formEl.querySelectorAll('input, textarea, select');
        inputs.forEach((el: any) => {
          if (el.name) formData[el.name] = el.value;
        });
      }
      await apiClient.post('/api/v1/assignments', formData, authHdr(accessToken));
      setOpenCreateDialog(false);
      loadAssignments();
    } catch {
      setError('Failed to create assignment');
      setOpenCreateDialog(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number | string) => {
    if (!accessToken) return;
    try {
      await apiClient.delete(`/api/v1/assignments/${assignmentId}`, authHdr(accessToken));
      setAssignments(prev => prev.filter((a: any) => a.id !== assignmentId));
    } catch {
      setError('Failed to delete assignment');
    }
  };

  const handleSaveGrade = async () => {
    if (!accessToken || !selectedSubmission) return;
    try {
      await apiClient.put(
        `/api/v1/assignments/submissions/${selectedSubmission.id}/grade`,
        { marks: Number(gradeMarks), feedback: gradeFeedback },
        authHdr(accessToken),
      );
      setSubmissions(prev => prev.map((s: any) =>
        s.id === selectedSubmission.id ? { ...s, marks: Number(gradeMarks), feedback: gradeFeedback, status: 'graded' } : s
      ));
      setOpenGradeDialog(false);
    } catch {
      setError('Failed to save grade');
      setOpenGradeDialog(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Assignment Management / असाइनमेन्ट व्यवस्थापन
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateAssignment}
        >
          Create Assignment / नयाँ असाइनमेन्ट
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                  <AttachFileIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{assignments.filter((a: any) => a.status === 'active').length}</Typography>
                  <Typography variant="caption">Active Assignments / सक्रिय</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#ed6c02', mr: 2 }}>
                  <ScheduleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{assignments.filter((a: any) => a.status === 'grading').length}</Typography>
                  <Typography variant="caption">Pending Grading / ग्रेडिङ बाँकी</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#2e7d32', mr: 2 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{assignments.filter((a: any) => a.status === 'completed').length}</Typography>
                  <Typography variant="caption">Graded / ग्रेड गरिएको</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#d32f2f', mr: 2 }}>
                  <WarningIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{assignments.filter((a: any) => a.status === 'overdue').length}</Typography>
                  <Typography variant="caption">Overdue / म्याद नाघेको</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)}>
          <Tab label="All Assignments / सबै असाइनमेन्ट" />
          <Tab
            label={
              <Badge badgeContent={submissions.length} color="error">
                <span>Submissions / पेश गरिएको</span>
              </Badge>
            }
          />
        </Tabs>

        {/* Assignments Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {assignments.map((assignment) => (
              <Grid item xs={12} key={assignment.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6">
                            {assignment.title}
                          </Typography>
                          <Chip
                            label={assignment.status}
                            size="small"
                            color={getStatusColor(assignment.status)}
                            sx={{ ml: 2 }}
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {assignment.subject} - {assignment.class}
                        </Typography>

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              Due Date / म्याद
                            </Typography>
                            <Typography variant="body2">
                              {assignment.dueDate}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              Total Marks / कुल अंक
                            </Typography>
                            <Typography variant="body2">
                              {assignment.totalMarks}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              Submissions / पेश
                            </Typography>
                            <Typography variant="body2">
                              {assignment.submissions}/{assignment.totalStudents}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={(assignment.submissions / assignment.totalStudents) * 100}
                              sx={{ mt: 0.5 }}
                            />
                          </Grid>

                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              Graded / ग्रेड गरिएको
                            </Typography>
                            <Typography variant="body2">
                              {assignment.graded}/{assignment.submissions}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={assignment.submissions > 0 ? (assignment.graded / assignment.submissions) * 100 : 0}
                              color="success"
                              sx={{ mt: 0.5 }}
                            />
                          </Grid>
                        </Grid>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                        <IconButton size="small" color="primary">
                          <ViewIcon />
                        </IconButton>
                        <IconButton size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteAssignment(assignment.id)}>
                          <DeleteIcon />
                        </IconButton>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<GradeIcon />}
                          onClick={() => handleViewSubmissions(assignment)}
                        >
                          View Submissions
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Submissions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {selectedAssignment?.title || 'Select an assignment to view submissions'}
            </Typography>
            {selectedAssignment && (
              <Typography variant="body2" color="text.secondary">
                {selectedAssignment.subject} - {selectedAssignment.class}
              </Typography>
            )}
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID / विद्यार्थी ID</TableCell>
                  <TableCell>Student Name / नाम</TableCell>
                  <TableCell>Submitted Date / पेश मिति</TableCell>
                  <TableCell>Status / स्थिति</TableCell>
                  <TableCell align="center">Marks / अंक</TableCell>
                  <TableCell align="center">Actions / कार्य</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{submission.studentId}</TableCell>
                    <TableCell>{submission.studentName}</TableCell>
                    <TableCell>{submission.submittedDate || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={submission.status}
                        size="small"
                        color={getSubmissionStatusColor(submission.status)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {submission.marks !== null
                        ? `${submission.marks}/${submission.totalMarks}`
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={submission.status === 'pending'}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={submission.status === 'pending'}
                        onClick={() => handleGradeSubmission(submission)}
                      >
                        <GradeIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Create Assignment Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Assignment / नयाँ असाइनमेन्ट</DialogTitle>
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
                label="Assignment Title / शीर्षक"
                placeholder="Enter assignment title"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description / विवरण"
                placeholder="Enter assignment description and instructions"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Due Date / म्याद"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Total Marks / कुल अंक"
                placeholder="Enter total marks"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<AttachFileIcon />}
                component="label"
              >
                Attach Files / फाइल संलग्न गर्नुहोस्
                <input type="file" hidden multiple />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel / रद्द गर्नुहोस्</Button>
          <Button variant="contained" onClick={handleSaveAssignment}>
            Create Assignment / असाइनमेन्ट सिर्जना गर्नुहोस्
          </Button>
        </DialogActions>
      </Dialog>

      {/* Grade Submission Dialog */}
      <Dialog open={openGradeDialog} onClose={() => setOpenGradeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Grade Submission / ग्रेड दिनुहोस्</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Student:</strong> {selectedSubmission.studentName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Student ID:</strong> {selectedSubmission.studentId}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Submitted:</strong> {selectedSubmission.submittedDate}
              </Typography>

              <TextField
                fullWidth
                type="number"
                label="Marks Obtained / प्राप्त अंक"
                placeholder={`Out of ${selectedSubmission.totalMarks}`}
                sx={{ mt: 3 }}
                inputProps={{ min: 0, max: selectedSubmission.totalMarks }}
                value={gradeMarks}
                onChange={(e) => setGradeMarks(e.target.value)}
              />

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Feedback / प्रतिक्रिया"
                placeholder="Enter feedback for the student"
                sx={{ mt: 2 }}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGradeDialog(false)}>Cancel / रद्द गर्नुहोस्</Button>
          <Button variant="contained" onClick={handleSaveGrade}>
            Save Grade / ग्रेड सुरक्षित गर्नुहोस्
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/**
 * Assignment Management Page
 * 
 * Create assignments, view submissions, and grade student work
 */

import { useState, useEffect, useCallback } from 'react';
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
  useTheme,
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
import { C, useAdminStyles, R } from '../../theme/designTokens';

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
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
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
      setError(t('portal.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  const loadSubmissions = useCallback(async (assignmentId: number | string) => {
    if (!accessToken) return;
    try {
      const res = await apiClient.get(`/api/v1/assignments/${assignmentId}/submissions`, authHdr(accessToken))
        .catch(() => ({ data: { data: { submissions: [] } } }));
      setSubmissions(res.data?.data?.submissions ?? res.data?.data ?? []);
    } catch {
      setSubmissions([]);
    }
  }, [accessToken, t]);

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
      setError(t('portal.failedToLoadData'));
      setOpenCreateDialog(false);
    }
  };

  const handleDeleteAssignment= async (assignmentId: number | string) => {
    if (!accessToken) return;
    try {
      await apiClient.delete(`/api/v1/assignments/${assignmentId}`, authHdr(accessToken));
      setAssignments(prev => prev.filter((a: any) => a.id !== assignmentId));
    } catch {
      setError(t('portal.failedToLoadData'));
    }
  };

  const handleSaveGrade= async () => {
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
      setError(t('portal.failedToLoadData'));
      setOpenGradeDialog(false);
    }
  };

  if (loading)return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ mt: { xs: 7, sm: 8 } }}>
      {/* Header */}
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GradeIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{t('teacher.assignmentManagement')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('teacher.assignmentManagementSubtitle')}</Typography>
            </Box>
          </Box>
          <Button
            sx={S.BTN_PRIMARY}
            startIcon={<AddIcon />}
            onClick={handleCreateAssignment}
          >
            {t('teacher.createAssignment')}
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: C.neutral, mr: 2 }}>
                  <AttachFileIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{assignments.filter((a: any) => a.status === 'active').length}</Typography>
                  <Typography variant="caption">{t('teacher.activeAssignments')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: C.neutral, mr: 2 }}>
                  <ScheduleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{assignments.filter((a: any) => a.status === 'grading').length}</Typography>
                  <Typography variant="caption">{t('teacher.pendingGrading')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: C.neutral, mr: 2 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{assignments.filter((a: any) => a.status === 'completed').length}</Typography>
                  <Typography variant="caption">{t('teacher.graded')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: C.danger, mr: 2 }}>
                  <WarningIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{assignments.filter((a: any) => a.status === 'overdue').length}</Typography>
                  <Typography variant="caption">{t('teacher.overdue')}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={S.GLASS}>
        <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)}>
          <Tab label={t('teacher.allAssignments')} />
          <Tab
            label={
              <Badge badgeContent={submissions.length} color="error">
                <span>{t('teacher.submissions')}</span>
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
                              {t('teacher.dueDate')}
                            </Typography>
                            <Typography variant="body2">
                              {assignment.dueDate}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              {t('teacher.totalMarks')}
                            </Typography>
                            <Typography variant="body2">
                              {assignment.totalMarks}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="caption" color="text.secondary">
                              {t('teacher.submissions')}
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
                              {t('teacher.graded')}
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
                          sx={S.BTN_PRIMARY}
                          startIcon={<GradeIcon />}
                          onClick={() => handleViewSubmissions(assignment)}
                        >
                          {t('teacher.viewSubmissions')}
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
              {selectedAssignment?.title || t('teacher.selectAssignment')}
            </Typography>
            {selectedAssignment && (
              <Typography variant="body2" color="text.secondary">
                {selectedAssignment.subject} - {selectedAssignment.class}
              </Typography>
            )}
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('teacher.studentId')}</TableCell>
                  <TableCell>{t('teacher.studentName')}</TableCell>
                  <TableCell>{t('teacher.submittedDate')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell align="center">{t('teacher.marks')}</TableCell>
                  <TableCell align="center">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{submission.studentId}</TableCell>
                    <TableCell sx={S.TD}>{submission.studentName}</TableCell>
                    <TableCell sx={S.TD}>{submission.submittedDate || '-'}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip
                        label={submission.status}
                        size="small"
                        color={getSubmissionStatusColor(submission.status)}
                      />
                    </TableCell>
                    <TableCell align="center" sx={S.TD}>
                      {submission.marks !== null
                        ? `${submission.marks}/${submission.totalMarks}`
                        : '-'}
                    </TableCell>
                    <TableCell align="center" sx={S.TD}>
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
        <DialogTitle>{t('teacher.createAssignment')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('common.subject')}</InputLabel>
                <Select label={t('common.subject')} defaultValue="">
                  <MenuItem value="Mathematics">Mathematics</MenuItem>
                  <MenuItem value="Physics">Physics</MenuItem>
                  <MenuItem value="Chemistry">Chemistry</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('common.class')}</InputLabel>
                <Select label={t('common.class')} defaultValue="">
                  <MenuItem value="Class 10 A">Class 10 A</MenuItem>
                  <MenuItem value="Class 10 B">Class 10 B</MenuItem>
                  <MenuItem value="Class 11 Science">Class 11 Science</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('teacher.assignmentTitle')}
                placeholder={t('teacher.assignmentTitle')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={t('common.description')}
                placeholder={t('common.description')}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('teacher.dueDate')}
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label={t('teacher.totalMarks')}
                placeholder={t('teacher.totalMarks')}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                startIcon={<AttachFileIcon />}
                component="label"
              >
                {t('teacher.attachFiles')}
                <input type="file" hidden multiple />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>{t('common.cancel')}</Button>
          <Button sx={S.BTN_PRIMARY} onClick={handleSaveAssignment}>
            {t('teacher.createAssignment')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Grade Submission Dialog */}
      <Dialog open={openGradeDialog} onClose={() => setOpenGradeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('teacher.gradeSubmission')}</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>{t('portal.student')}:</strong> {selectedSubmission.studentName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>{t('teacher.studentId')}:</strong> {selectedSubmission.studentId}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>{t('teacher.submitted')}:</strong> {selectedSubmission.submittedDate}
              </Typography>

              <TextField
                fullWidth
                type="number"
                label={t('teacher.marksObtained')}
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
                label={t('teacher.feedback')}
                placeholder={t('teacher.feedback')}
                sx={{ mt: 2 }}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGradeDialog(false)}>{t('common.cancel')}</Button>
          <Button sx={S.BTN_PRIMARY} onClick={handleSaveGrade}>
            {t('teacher.saveGrade')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/**
 * Admission Detail Page
 * View and manage individual admission with workflow actions
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface AdmissionDetail {
  admissionId: number;
  temporaryId: string;
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  dateOfBirthAD?: string;
  gender?: string;
  phone?: string;
  email?: string;
  addressEn?: string;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  guardianName?: string;
  guardianPhone?: string;
  applyingForClass: number;
  previousSchool?: string;
  previousClass?: number;
  status: string;
  inquiryDate: string;
  inquirySource?: string;
  inquiryNotes?: string;
  applicationDate?: string;
  admissionTestDate?: string;
  admissionTestScore?: number;
  interviewDate?: string;
  interviewFeedback?: string;
  admissionDate?: string;
  enrollmentDate?: string;
  rejectionReason?: string;
}

const statusLabels: Record<string, string> = {
  inquiry: 'Inquiry',
  applied: 'Applied',
  test_scheduled: 'Test Scheduled',
  tested: 'Tested',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  admitted: 'Admitted',
  enrolled: 'Enrolled',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export function AdmissionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [admission, setAdmission] = useState<AdmissionDetail | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Dialog states
  const [convertDialog, setConvertDialog] = useState(false);
  const [testDialog, setTestDialog] = useState(false);
  const [interviewDialog, setInterviewDialog] = useState(false);
  const [admitDialog, setAdmitDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [enrollDialog, setEnrollDialog] = useState(false);
  
  // Form states
  const [testDate, setTestDate] = useState('');
  const [testScore, setTestScore] = useState('');
  const [testRemarks, setTestRemarks] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewFeedback, setInterviewFeedback] = useState('');
  const [interviewScore, setInterviewScore] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchAdmission();
  }, [id]);

  const fetchAdmission = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admissions/${id}`);
      setAdmission(response.data?.data);
    } catch (error: any) {
      console.error('Failed to fetch admission:', error);
      setError('Failed to load admission details');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToApplication = async () => {
    try {
      await api.post(`/admissions/${id}/apply`);
      setSuccess('Converted to application successfully!');
      setConvertDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to convert to application');
    }
  };

  const handleScheduleTest = async () => {
    try {
      await api.post(`/admissions/${id}/schedule-test`, {
        admissionTestDate: testDate,
      });
      setSuccess('Test scheduled successfully!');
      setTestDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to schedule test');
    }
  };

  const handleRecordTestScore = async () => {
    try {
      await api.post(`/admissions/${id}/record-test-score`, {
        admissionTestScore: parseFloat(testScore),
        admissionTestRemarks: testRemarks,
      });
      setSuccess('Test score recorded successfully!');
      setTestDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to record test score');
    }
  };

  const handleScheduleInterview = async () => {
    try {
      await api.post(`/admissions/${id}/schedule-interview`, {
        interviewDate,
      });
      setSuccess('Interview scheduled successfully!');
      setInterviewDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to schedule interview');
    }
  };

  const handleRecordInterview = async () => {
    try {
      await api.post(`/admissions/${id}/record-interview`, {
        interviewFeedback,
        interviewScore: interviewScore ? parseInt(interviewScore) : undefined,
      });
      setSuccess('Interview feedback recorded successfully!');
      setInterviewDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to record interview');
    }
  };

  const handleAdmit = async () => {
    try {
      await api.post(`/admissions/${id}/admit`);
      setSuccess('Student admitted successfully!');
      setAdmitDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to admit student');
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/admissions/${id}/reject`, {
        rejectionReason,
      });
      setSuccess('Application rejected');
      setRejectDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reject application');
    }
  };

  const handleEnroll = async () => {
    try {
      await api.post(`/admissions/${id}/enroll`);
      setSuccess('Student enrolled successfully!');
      setEnrollDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to enroll student');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!admission) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">Admission not found</Alert>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate('/admissions/list')}
            >
              Back
            </Button>
            <Typography variant="h5" fontWeight={600}>
              Admission Details
            </Typography>
          </Box>
          <Chip
            label={statusLabels[admission.status]}
            color={admission.status === 'enrolled' ? 'success' : 'primary'}
          />
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Student Information</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Temporary ID</Typography>
              <Typography variant="body1">{admission.temporaryId}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Full Name</Typography>
              <Typography variant="body1">
                {`${admission.firstNameEn} ${admission.middleNameEn || ''} ${admission.lastNameEn}`}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
              <Typography variant="body1">
                {admission.dateOfBirthAD ? new Date(admission.dateOfBirthAD).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Gender</Typography>
              <Typography variant="body1">{admission.gender || 'N/A'}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Applying for Class</Typography>
              <Typography variant="body1">Class {admission.applyingForClass}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Contact Information</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Phone</Typography>
              <Typography variant="body1">{admission.phone || 'N/A'}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Email</Typography>
              <Typography variant="body1">{admission.email || 'N/A'}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Address</Typography>
              <Typography variant="body1">{admission.addressEn || 'N/A'}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Parent/Guardian Information</Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Father's Name</Typography>
              <Typography variant="body1">{admission.fatherName || 'N/A'}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Father's Phone</Typography>
              <Typography variant="body1">{admission.fatherPhone || 'N/A'}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Mother's Name</Typography>
              <Typography variant="body1">{admission.motherName || 'N/A'}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Mother's Phone</Typography>
              <Typography variant="body1">{admission.motherPhone || 'N/A'}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Guardian's Name</Typography>
              <Typography variant="body1">{admission.guardianName || 'N/A'}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Guardian's Phone</Typography>
              <Typography variant="body1">{admission.guardianPhone || 'N/A'}</Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {admission.status === 'inquiry' && (
            <Button variant="contained" onClick={() => setConvertDialog(true)}>
              Convert to Application
            </Button>
          )}
          {admission.status === 'applied' && (
            <>
              <Button variant="contained" onClick={() => setTestDialog(true)}>
                Schedule Test
              </Button>
              <Button variant="contained" onClick={() => setInterviewDialog(true)}>
                Schedule Interview
              </Button>
              <Button variant="contained" color="success" onClick={() => setAdmitDialog(true)}>
                Admit Directly
              </Button>
            </>
          )}
          {admission.status === 'test_scheduled' && (
            <Button variant="contained" onClick={() => setTestDialog(true)}>
              Record Test Score
            </Button>
          )}
          {(admission.status === 'tested' || admission.status === 'interviewed') && (
            <Button variant="contained" color="success" onClick={() => setAdmitDialog(true)}>
              Admit Student
            </Button>
          )}
          {admission.status === 'interview_scheduled' && (
            <Button variant="contained" onClick={() => setInterviewDialog(true)}>
              Record Interview
            </Button>
          )}
          {admission.status === 'admitted' && (
            <Button variant="contained" color="success" onClick={() => setEnrollDialog(true)}>
              Enroll Student
            </Button>
          )}
          {!['enrolled', 'rejected', 'withdrawn'].includes(admission.status) && (
            <Button variant="outlined" color="error" onClick={() => setRejectDialog(true)}>
              Reject
            </Button>
          )}
        </Box>
      </Paper>

      {/* Convert Dialog */}
      <Dialog open={convertDialog} onClose={() => setConvertDialog(false)}>
        <DialogTitle>Convert to Application</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to convert this inquiry to an application?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConvertToApplication}>
            Convert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialog} onClose={() => setTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {admission.status === 'applied' ? 'Schedule Test' : 'Record Test Score'}
        </DialogTitle>
        <DialogContent>
          {admission.status === 'applied' ? (
            <TextField
              fullWidth
              type="datetime-local"
              label="Test Date & Time"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />
          ) : (
            <>
              <TextField
                fullWidth
                type="number"
                label="Test Score"
                value={testScore}
                onChange={(e) => setTestScore(e.target.value)}
                sx={{ mt: 2, mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Remarks"
                value={testRemarks}
                onChange={(e) => setTestRemarks(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={admission.status === 'applied' ? handleScheduleTest : handleRecordTestScore}
          >
            {admission.status === 'applied' ? 'Schedule' : 'Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Interview Dialog */}
      <Dialog open={interviewDialog} onClose={() => setInterviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {admission.status === 'applied' || admission.status === 'tested' ? 'Schedule Interview' : 'Record Interview'}
        </DialogTitle>
        <DialogContent>
          {admission.status === 'applied' || admission.status === 'tested' ? (
            <TextField
              fullWidth
              type="datetime-local"
              label="Interview Date & Time"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />
          ) : (
            <>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Interview Feedback"
                value={interviewFeedback}
                onChange={(e) => setInterviewFeedback(e.target.value)}
                sx={{ mt: 2, mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Interview Score (Optional)"
                value={interviewScore}
                onChange={(e) => setInterviewScore(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterviewDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={admission.status === 'interview_scheduled' ? handleRecordInterview : handleScheduleInterview}
          >
            {admission.status === 'interview_scheduled' ? 'Record' : 'Schedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admit Dialog */}
      <Dialog open={admitDialog} onClose={() => setAdmitDialog(false)}>
        <DialogTitle>Admit Student</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to admit this student?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdmitDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleAdmit}>
            Admit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={enrollDialog} onClose={() => setEnrollDialog(false)}>
        <DialogTitle>Enroll Student</DialogTitle>
        <DialogContent>
          <Typography>
            This will create a student record and enroll the student. Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleEnroll}>
            Enroll
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Application</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdmissionDetail;

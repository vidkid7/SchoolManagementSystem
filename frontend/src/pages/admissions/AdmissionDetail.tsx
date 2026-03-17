/**
 * Admission Detail Page
 * View and manage individual admission with workflow actions
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
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
  useTheme,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import api from '../../config/api';
import { useTranslation } from 'react-i18next';

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

const statusKeyMap: Record<string, string> = {
  inquiry: 'admissions.inquiry',
  applied: 'admissions.applied',
  test_scheduled: 'admissions.testScheduled',
  tested: 'admissions.tested',
  interview_scheduled: 'admissions.interviewScheduled',
  interviewed: 'admissions.interviewed',
  admitted: 'admissions.admitted',
  enrolled: 'admissions.enrolled',
  rejected: 'admissions.rejected',
  withdrawn: 'admissions.withdrawn',
};

export function AdmissionDetail() {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useSlugNavigate();
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
      setError(t('admissions.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToApplication = async () => {
    try {
      await api.post(`/admissions/${id}/apply`);
      setSuccess(t('admissions.convertedSuccessfully'));
      setConvertDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || t('admissions.failedToConvert'));
    }
  };

  const handleScheduleTest = async () => {
    try {
      await api.post(`/admissions/${id}/schedule-test`, {
        admissionTestDate: testDate,
      });
      setSuccess(t('admissions.testScheduledSuccessfully'));
      setTestDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || t('admissions.failedToScheduleTest'));
    }
  };

  const handleRecordTestScore = async () => {
    try {
      await api.post(`/admissions/${id}/record-test-score`, {
        admissionTestScore: parseFloat(testScore),
        admissionTestRemarks: testRemarks,
      });
      setSuccess(t('admissions.testScoreRecordedSuccessfully'));
      setTestDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || t('admissions.failedToRecordTestScore'));
    }
  };

  const handleScheduleInterview = async () => {
    try {
      await api.post(`/admissions/${id}/schedule-interview`, {
        interviewDate,
      });
      setSuccess(t('admissions.interviewScheduledSuccessfully'));
      setInterviewDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || t('admissions.failedToScheduleInterview'));
    }
  };

  const handleRecordInterview = async () => {
    try {
      await api.post(`/admissions/${id}/record-interview`, {
        interviewFeedback,
        interviewScore: interviewScore ? parseInt(interviewScore) : undefined,
      });
      setSuccess(t('admissions.interviewRecordedSuccessfully'));
      setInterviewDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || t('admissions.failedToRecordInterview'));
    }
  };

  const handleAdmit = async () => {
    try {
      await api.post(`/admissions/${id}/admit`);
      setSuccess(t('admissions.admittedSuccessfully'));
      setAdmitDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || t('admissions.failedToAdmit'));
    }
  };

  const handleReject = async () => {
    try {
      await api.post(`/admissions/${id}/reject`, {
        rejectionReason,
      });
      setSuccess(t('admissions.applicationRejected'));
      setRejectDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || t('admissions.failedToReject'));
    }
  };

  const handleEnroll = async () => {
    try {
      await api.post(`/admissions/${id}/enroll`);
      setSuccess(t('admissions.enrolledSuccessfully'));
      setEnrollDialog(false);
      fetchAdmission();
    } catch (error: any) {
      setError(error.response?.data?.message || t('admissions.failedToEnroll'));
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
      <Paper sx={{ ...S.GLASS, p: 3 }}>
        <Alert severity="error">{t('admissions.notFound')}</Alert>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate('/admissions/list')}
            >
              {t('common.back')}
            </Button>
            <Typography variant="h5" fontWeight={600}>
              {t('admissions.admissionDetails')}
            </Typography>
          </Box>
          <Chip
            label={t(statusKeyMap[admission.status] || admission.status)}
            color={admission.status === 'enrolled' ? 'success' : 'primary'}
          />
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>{t('admissions.studentInformation')}</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.temporaryId')}</Typography>
              <Typography variant="body1">{admission.temporaryId}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.fullName')}</Typography>
              <Typography variant="body1">
                {`${admission.firstNameEn} ${admission.middleNameEn || ''} ${admission.lastNameEn}`}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.dateOfBirth')}</Typography>
              <Typography variant="body1">
                {admission.dateOfBirthAD ? new Date(admission.dateOfBirthAD).toLocaleDateString() : t('common.na')}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.gender')}</Typography>
              <Typography variant="body1">{admission.gender || t('common.na')}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.applyingForClass')}</Typography>
              <Typography variant="body1">{t('common.class')} {admission.applyingForClass}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>{t('admissions.contactInformation')}</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.phone')}</Typography>
              <Typography variant="body1">{admission.phone || t('common.na')}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.email')}</Typography>
              <Typography variant="body1">{admission.email || t('common.na')}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.address')}</Typography>
              <Typography variant="body1">{admission.addressEn || t('common.na')}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>{t('admissions.parentGuardianInformation')}</Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.fatherName')}</Typography>
              <Typography variant="body1">{admission.fatherName || t('common.na')}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.fatherPhone')}</Typography>
              <Typography variant="body1">{admission.fatherPhone || t('common.na')}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.motherName')}</Typography>
              <Typography variant="body1">{admission.motherName || t('common.na')}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.motherPhone')}</Typography>
              <Typography variant="body1">{admission.motherPhone || t('common.na')}</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.guardianName')}</Typography>
              <Typography variant="body1">{admission.guardianName || t('common.na')}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">{t('admissions.guardianPhone')}</Typography>
              <Typography variant="body1">{admission.guardianPhone || t('common.na')}</Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {admission.status === 'inquiry' && (
            <Button variant="contained" sx={S.BTN_PRIMARY} onClick={() => setConvertDialog(true)}>
              {t('admissions.convertToApplication')}
            </Button>
          )}
          {admission.status === 'applied' && (
            <>
              <Button variant="contained" sx={S.BTN_PRIMARY} onClick={() => setTestDialog(true)}>
                {t('admissions.scheduleTest')}
              </Button>
              <Button variant="contained" sx={S.BTN_PRIMARY} onClick={() => setInterviewDialog(true)}>
                {t('admissions.scheduleInterview')}
              </Button>
              <Button variant="contained" sx={S.BTN_PRIMARY} color="success" onClick={() => setAdmitDialog(true)}>
                {t('admissions.admitDirectly')}
              </Button>
            </>
          )}
          {admission.status === 'test_scheduled' && (
            <Button variant="contained" sx={S.BTN_PRIMARY} onClick={() => setTestDialog(true)}>
              {t('admissions.recordTestScore')}
            </Button>
          )}
          {(admission.status === 'tested' || admission.status === 'interviewed') && (
            <Button variant="contained" sx={S.BTN_PRIMARY} color="success" onClick={() => setAdmitDialog(true)}>
              {t('admissions.admitStudent')}
            </Button>
          )}
          {admission.status === 'interview_scheduled' && (
            <Button variant="contained" sx={S.BTN_PRIMARY} onClick={() => setInterviewDialog(true)}>
              {t('admissions.recordInterview')}
            </Button>
          )}
          {admission.status === 'admitted' && (
            <Button variant="contained" sx={S.BTN_PRIMARY} color="success" onClick={() => setEnrollDialog(true)}>
              {t('admissions.enrollStudent')}
            </Button>
          )}
          {!['enrolled', 'rejected', 'withdrawn'].includes(admission.status) && (
            <Button variant="outlined" sx={S.BTN_OUTLINE} color="error" onClick={() => setRejectDialog(true)}>
              {t('admissions.reject')}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Convert Dialog */}
      <Dialog open={convertDialog} onClose={() => setConvertDialog(false)}>
        <DialogTitle>{t('admissions.convertToApplication')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('admissions.confirmConvert')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" sx={S.BTN_PRIMARY} onClick={handleConvertToApplication}>
            {t('admissions.convert')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialog} onClose={() => setTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {admission.status === 'applied' ? t('admissions.scheduleTest') : t('admissions.recordTestScore')}
        </DialogTitle>
        <DialogContent>
          {admission.status === 'applied' ? (
            <TextField
              fullWidth
              type="datetime-local"
              label={t('admissions.testDateAndTime')}
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
                label={t('admissions.testScore')}
                value={testScore}
                onChange={(e) => setTestScore(e.target.value)}
                sx={{ mt: 2, mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('admissions.testRemarks')}
                value={testRemarks}
                onChange={(e) => setTestRemarks(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained" sx={S.BTN_PRIMARY}
            onClick={admission.status === 'applied' ? handleScheduleTest : handleRecordTestScore}
          >
            {admission.status === 'applied' ? t('admissions.schedule') : t('admissions.record')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Interview Dialog */}
      <Dialog open={interviewDialog} onClose={() => setInterviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {admission.status === 'applied' || admission.status === 'tested' ? t('admissions.scheduleInterview') : t('admissions.recordInterview')}
        </DialogTitle>
        <DialogContent>
          {admission.status === 'applied' || admission.status === 'tested' ? (
            <TextField
              fullWidth
              type="datetime-local"
              label={t('admissions.interviewDateAndTime')}
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
                label={t('admissions.interviewFeedback')}
                value={interviewFeedback}
                onChange={(e) => setInterviewFeedback(e.target.value)}
                sx={{ mt: 2, mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label={t('admissions.interviewScoreOptional')}
                value={interviewScore}
                onChange={(e) => setInterviewScore(e.target.value)}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterviewDialog(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained" sx={S.BTN_PRIMARY}
            onClick={admission.status === 'interview_scheduled' ? handleRecordInterview : handleScheduleInterview}
          >
            {admission.status === 'interview_scheduled' ? t('admissions.record') : t('admissions.schedule')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admit Dialog */}
      <Dialog open={admitDialog} onClose={() => setAdmitDialog(false)}>
        <DialogTitle>{t('admissions.admitStudent')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('admissions.confirmAdmit')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdmitDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" sx={S.BTN_PRIMARY} color="success" onClick={handleAdmit}>
            {t('admissions.admit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={enrollDialog} onClose={() => setEnrollDialog(false)}>
        <DialogTitle>{t('admissions.enrollStudent')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('admissions.confirmEnroll')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" sx={S.BTN_PRIMARY} color="success" onClick={handleEnroll}>
            {t('admissions.enrollStudent')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admissions.rejectApplication')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t('admissions.rejectionReason')}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" sx={S.BTN_PRIMARY} color="error" onClick={handleReject}>
            {t('admissions.reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdmissionDetail;

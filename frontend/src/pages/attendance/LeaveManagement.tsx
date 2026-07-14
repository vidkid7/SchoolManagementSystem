/**
 * Leave Management Page
 * 
 * Manage student and staff leave applications
 */

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  EventNote as LeaveIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface LeaveApplication {
  id?: number;
  leaveId?: number;
  studentId?: number;
  staffId?: number;
  studentName?: string;
  staffName?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  remarks?: string;
}

export function LeaveManagement() {
  const theme = useTheme();
  const { t } = useTranslation();
  const S = useAdminStyles(theme);
  const userRole = useSelector((state: any) => state.auth.user?.role);
  const canManageLeaves = userRole === 'School_Admin' || userRole === 'Class_Teacher';
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [viewOnly, setViewOnly] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, [activeTab, canManageLeaves]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError('');
      const response = canManageLeaves
        ? await apiClient.get('/attendance/leave/pending', {
            params: { status: activeTab === 0 ? 'pending' : activeTab === 1 ? 'approved' : 'rejected' },
          })
        : await apiClient.get('/attendance/leave/my');
      
      const leavesPayload = response.data?.data || [];
      const leavesData = Array.isArray(leavesPayload) ? leavesPayload : (leavesPayload.leaves || []);
      setLeaves(leavesData);
    } catch (error: any) {
      setError(error.response?.data?.message || t('attendance.failedToProcessLeave'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (leave: LeaveApplication, action: 'approve' | 'reject') => {
    setSelectedLeave(leave);
    setActionType(action);
    setViewOnly(false);
    setRemarks('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLeave(null);
    setViewOnly(false);
    setRemarks('');
  };

  const handleSubmitAction = async () => {
    if (!selectedLeave) return;

    const leaveId = selectedLeave.id || selectedLeave.leaveId;
    if (!leaveId) {
      setError(t('attendance.invalidLeaveId'));
      console.error('Leave object:', selectedLeave);
      return;
    }

    try {
      setError('');
      await apiClient.put(`/attendance/leave/${leaveId}/approve`, {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        remarks,
      });

      setSuccess(t('attendance.leaveActionSuccess', { action: actionType }));
      setTimeout(() => setSuccess(''), 3000);
      handleCloseDialog();
      fetchLeaves();
    } catch (error: any) {
      console.error('Failed to process leave:', error);
      const errorMsg = error.response?.data?.message || t('attendance.failedToProcessLeave');
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getDaysDifference = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <LeaveIcon sx={{ fontSize: 32, color: C.primary }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {t('attendance.leaveManagement')}
            </Typography>
          </Box>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: R.md }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: R.md }}>{error}</Alert>}

        {canManageLeaves && (
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label={t('common.pending')} sx={S.TAB_ACTIVE} />
            <Tab label={t('attendance.approveLeave')} sx={S.TAB_ACTIVE} />
            <Tab label={t('attendance.rejectLeave')} sx={S.TAB_ACTIVE} />
          </Tabs>
        )}
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell sx={{ fontWeight: 600 }}>{t('attendance.applicant')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('common.type')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('attendance.leaveType')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('attendance.startDate')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('attendance.endDate')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('attendance.days')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('attendance.appliedDate')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('common.status')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary">
                      {t('attendance.noLeaveApplications')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
              leaves.map((leave) => (
                <TableRow key={leave.id || leave.leaveId || `leave-${leave.studentId}-${leave.startDate}`} sx={S.TR_HOVER}>
                  <TableCell sx={S.TD}>
                    {leave.studentName || leave.staffName}
                  </TableCell>
                  <TableCell sx={S.TD}>
                    <Chip 
                      label={leave.studentId ? t('attendance.student') : t('attendance.staff')} 
                      size="small"
                      color={leave.studentId ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell sx={S.TD}>{leave.leaveType}</TableCell>
                  <TableCell sx={S.TD}>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                  <TableCell sx={S.TD}>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                  <TableCell sx={S.TD}>
                    {getDaysDifference(leave.startDate, leave.endDate)} {t('attendance.days')}
                  </TableCell>
                  <TableCell sx={S.TD}>{new Date(leave.appliedDate).toLocaleDateString()}</TableCell>
                  <TableCell sx={S.TD}>
                    <Chip 
                      label={t(`attendance.${leave.status}`, leave.status)}
                      size="small"
                      color={getStatusColor(leave.status)}
                    />
                  </TableCell>
                  <TableCell align="center" sx={S.TD}>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setViewOnly(true);
                        setDialogOpen(true);
                      }}
                      sx={S.BTN_ICON}
                    >
                      <ViewIcon />
                    </IconButton>
                    {canManageLeaves && leave.status === 'pending' && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOpenDialog(leave, 'approve')}
                          sx={S.BTN_ICON}
                        >
                          <ApproveIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDialog(leave, 'reject')}
                          sx={S.BTN_ICON}
                        >
                          <RejectIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: `${R.lg * 8}px` } }}
      >
        <DialogTitle>
          {viewOnly
            ? t('attendance.leaveDetails', 'Leave Details')
            : t('attendance.leaveApproveReject', { action: actionType === 'approve' ? t('attendance.approveLeave') : t('attendance.rejectLeave') })}
        </DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('attendance.applicant')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedLeave.studentName || selectedLeave.staffName}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                {t('attendance.leavePeriod')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}
                ({getDaysDifference(selectedLeave.startDate, selectedLeave.endDate)} {t('attendance.days')})
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                {t('attendance.reason')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedLeave.reason}
              </Typography>
            </Box>
          )}

          {!viewOnly && canManageLeaves && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label={t('attendance.remarksOptional')}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              sx={{ ...S.TF, mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={S.BTN_GHOST}>{t('common.cancel')}</Button>
          {!viewOnly && canManageLeaves && (
            <Button
              variant="contained"
              onClick={handleSubmitAction}
              sx={{ ...S.BTN_PRIMARY, ...actionType === 'approve' ? S.BTN_SUCCESS : S.BTN_DANGER }}
            >
              {actionType === 'approve' ? t('attendance.approveLeave') : t('attendance.rejectLeave')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LeaveManagement;

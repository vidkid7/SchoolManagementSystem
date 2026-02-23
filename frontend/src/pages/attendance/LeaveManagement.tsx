/**
 * Leave Management Page
 * 
 * Manage student and staff leave applications
 */

import { useState, useEffect } from 'react';
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
import api from '../../config/api';

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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [remarks, setRemarks] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaves();
  }, [activeTab]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError('');
      const status = activeTab === 0 ? 'pending' : activeTab === 1 ? 'approved' : 'rejected';
      const response = await api.get('/attendance/leave/pending', {
        params: { status },
      });
      
      console.log('API Response:', response.data);
      const leavesData = response.data?.data || [];
      console.log('Leaves data:', leavesData);
      
      setLeaves(leavesData);
    } catch (error: any) {
      console.error('Failed to fetch leaves:', error);
      setError(error.response?.data?.message || 'Failed to load leave applications');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (leave: LeaveApplication, action: 'approve' | 'reject') => {
    setSelectedLeave(leave);
    setActionType(action);
    setRemarks('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLeave(null);
    setRemarks('');
  };

  const handleSubmitAction = async () => {
    if (!selectedLeave) return;

    const leaveId = selectedLeave.id || selectedLeave.leaveId;
    if (!leaveId) {
      setError('Invalid leave application ID');
      console.error('Leave object:', selectedLeave);
      return;
    }

    try {
      setError('');
      console.log('Submitting action for leave ID:', leaveId);
      await api.put(`/attendance/leave/${leaveId}/approve`, {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        remarks,
      });

      setSuccess(`Leave application ${actionType}d successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      handleCloseDialog();
      fetchLeaves();
    } catch (error: any) {
      console.error('Failed to process leave:', error);
      const errorMsg = error.response?.data?.message || 'Failed to process leave application';
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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <LeaveIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            Leave Applications Management
          </Typography>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Leave Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Applied Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary">
                      No leave applications found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
              leaves.map((leave) => (
                <TableRow key={leave.id || leave.leaveId || `leave-${leave.studentId}-${leave.startDate}`}>
                  <TableCell>
                    {leave.studentName || leave.staffName}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={leave.studentId ? 'Student' : 'Staff'} 
                      size="small"
                      color={leave.studentId ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>{leave.leaveType}</TableCell>
                  <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {getDaysDifference(leave.startDate, leave.endDate)} days
                  </TableCell>
                  <TableCell>{new Date(leave.appliedDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip 
                      label={leave.status} 
                      size="small"
                      color={getStatusColor(leave.status)}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setDialogOpen(true);
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
                    {leave.status === 'pending' && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOpenDialog(leave, 'approve')}
                        >
                          <ApproveIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDialog(leave, 'reject')}
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve' : 'Reject'} Leave Application
        </DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Applicant
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedLeave.studentName || selectedLeave.staffName}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                Leave Period
              </Typography>
              <Typography variant="body1" gutterBottom>
                {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}
                ({getDaysDifference(selectedLeave.startDate, selectedLeave.endDate)} days)
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                Reason
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedLeave.reason}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Remarks (Optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            onClick={handleSubmitAction}
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LeaveManagement;

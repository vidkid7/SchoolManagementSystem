/**
 * Refund Management Page
 * Process refund requests, view refund history
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
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  IconButton,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Undo as RefundIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface Refund {
  refundId: number;
  paymentId: number;
  receiptNumber: string;
  studentName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requestedDate: string;
  processedDate?: string;
}

export function RefundManagement() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    paymentId: '',
    reason: '',
    remarks: '',
  });

  useEffect(() => {
    fetchRefunds();
  }, [page, rowsPerPage]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/finance/refunds', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setRefunds(response.data?.data || []);
      setTotal(response.data?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch refunds:', err);
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    try {
      await api.post('/finance/refunds', formData);
      setSuccess('Refund processed successfully');
      setOpenDialog(false);
      fetchRefunds();
      setTimeout(() => setSuccess(''), 3000);
      setFormData({
        paymentId: '',
        reason: '',
        remarks: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process refund');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'success';
      case 'approved': return 'info';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Refund Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefundIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Process Refund
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Refund ID</TableCell>
                <TableCell>Receipt #</TableCell>
                <TableCell>Student</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Loading...</TableCell>
                </TableRow>
              ) : refunds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No refunds found
                  </TableCell>
                </TableRow>
              ) : (
                refunds.map((refund) => (
                  <TableRow key={refund.refundId}>
                    <TableCell>#{refund.refundId}</TableCell>
                    <TableCell>{refund.receiptNumber}</TableCell>
                    <TableCell>{refund.studentName}</TableCell>
                    <TableCell align="right">NPR {refund.amount.toLocaleString()}</TableCell>
                    <TableCell>{refund.reason}</TableCell>
                    <TableCell>{new Date(refund.requestedDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={refund.status}
                        color={getStatusColor(refund.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        title="View Receipt"
                      >
                        <ReceiptIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Refund</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Payment ID"
              type="number"
              value={formData.paymentId}
              onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
              required
              fullWidth
              helperText="Enter the payment ID to refund"
            />
            <TextField
              label="Reason"
              select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              fullWidth
            >
              <MenuItem value="duplicate_payment">Duplicate Payment</MenuItem>
              <MenuItem value="overpayment">Overpayment</MenuItem>
              <MenuItem value="student_withdrawal">Student Withdrawal</MenuItem>
              <MenuItem value="fee_waiver">Fee Waiver</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              label="Remarks"
              multiline
              rows={3}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              fullWidth
              helperText="Additional details about the refund"
            />
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleProcessRefund} variant="contained">
            Process Refund
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RefundManagement;

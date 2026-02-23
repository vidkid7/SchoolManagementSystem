/**
 * Payments Management
 * Record payments, view history, process refunds
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
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Undo as RefundIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface Payment {
  paymentId: number;
  invoiceId: number;
  invoiceNumber: string;
  studentId: number;
  studentName: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: string;
  status: string;
}

export function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'cash',
    transactionId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  useEffect(() => {
    fetchPayments();
  }, [page, rowsPerPage]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/finance/payments', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setPayments(response.data?.data || []);
      setTotal(response.data?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    try {
      await api.post('/finance/payments', formData);
      setSuccess('Payment recorded successfully');
      setOpenDialog(false);
      fetchPayments();
      setTimeout(() => setSuccess(''), 3000);
      setFormData({
        invoiceId: '',
        amount: '',
        paymentMethod: 'cash',
        transactionId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        remarks: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleRefund = async (paymentId: number) => {
    if (!confirm('Are you sure you want to process this refund?')) return;

    try {
      await api.post(`/finance/payments/${paymentId}/refund`);
      setSuccess('Refund processed successfully');
      fetchPayments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process refund');
    }
  };

  const handlePrintReceipt = (paymentId: number) => {
    window.open(`/api/v1/finance/payments/${paymentId}/receipt`, '_blank');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Payment Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Record Payment
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment ID</TableCell>
                <TableCell>Invoice #</TableCell>
                <TableCell>Student</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">Loading...</TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.paymentId}>
                    <TableCell>#{payment.paymentId}</TableCell>
                    <TableCell>{payment.invoiceNumber}</TableCell>
                    <TableCell>{payment.studentName}</TableCell>
                    <TableCell align="right">NPR {payment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={payment.paymentMethod} size="small" />
                    </TableCell>
                    <TableCell>{payment.transactionId || '-'}</TableCell>
                    <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        color={payment.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handlePrintReceipt(payment.paymentId)}
                        title="Print Receipt"
                      >
                        <PrintIcon fontSize="small" />
                      </IconButton>
                      {payment.status === 'completed' && (
                        <IconButton
                          size="small"
                          onClick={() => handleRefund(payment.paymentId)}
                          title="Process Refund"
                          color="error"
                        >
                          <RefundIcon fontSize="small" />
                        </IconButton>
                      )}
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
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Invoice ID"
              type="number"
              value={formData.invoiceId}
              onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
              required
              fullWidth
              helperText="Enter the invoice ID to record payment for"
            />
            <TextField
              label="Amount (NPR)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Payment Method"
              select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              required
              fullWidth
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="cheque">Cheque</MenuItem>
              <MenuItem value="esewa">eSewa</MenuItem>
              <MenuItem value="khalti">Khalti</MenuItem>
              <MenuItem value="ime_pay">IME Pay</MenuItem>
            </TextField>
            <TextField
              label="Transaction ID (Optional)"
              value={formData.transactionId}
              onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
              fullWidth
              helperText="For online payments"
            />
            <TextField
              label="Payment Date"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Remarks"
              multiline
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              fullWidth
            />
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleRecordPayment} variant="contained">
            Record Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Payments;

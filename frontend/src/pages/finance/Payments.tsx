/**
 * Payments Management
 * Record payments, view history, process refunds
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Undo as RefundIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

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
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
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
      const response = await apiClient.get('/finance/payments', {
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
      await apiClient.post('/finance/payments', formData);
      setSuccess(t('finance.paymentRecordedSuccess'));
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
      setError(err.response?.data?.message || t('finance.failedToRecordPayment'));
    }
  };

  const handleRefund = async (paymentId: number) => {
    if (!confirm(t('finance.confirmRefund'))) return;

    try {
      await apiClient.post(`/finance/payments/${paymentId}/refund`);
      setSuccess(t('finance.refundProcessedSuccess'));
      fetchPayments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('finance.failedToLoad'));
    }
  };

  const handlePrintReceipt = (paymentId: number) => {
    window.open(`/api/v1/finance/payments/${paymentId}/receipt`, '_blank');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          {t('finance.payments')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          {t('finance.recordPayment')}
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ ...S.GLASS }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('finance.payments')}</TableCell>
                <TableCell>{t('finance.invoices')}</TableCell>
                <TableCell>{t('finance.studentName')}</TableCell>
                <TableCell align="right">{t('finance.amount')}</TableCell>
                <TableCell>{t('finance.paymentMethod')}</TableCell>
                <TableCell>{t('finance.transactionRef')}</TableCell>
                <TableCell>{t('finance.paymentDate')}</TableCell>
                <TableCell>{t('finance.paymentStatus')}</TableCell>
                <TableCell align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">{t('common.loading')}</TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    {t('finance.noPayments')}
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
                        title={t('common.download')}
                      >
                        <PrintIcon fontSize="small" />
                      </IconButton>
                      {payment.status === 'completed' && (
                        <IconButton
                          size="small"
                          onClick={() => handleRefund(payment.paymentId)}
                          title={t('finance.processRefund')}
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
        <DialogTitle>{t('finance.recordPayment')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('finance.invoices')}
              type="number"
              value={formData.invoiceId}
              onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
              required
              fullWidth
              helperText={t('finance.selectStudent')}
            />
            <TextField
              label={t('finance.amount')}
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t('finance.paymentMethod')}
              select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              required
              fullWidth
            >
              <MenuItem value="cash">{t('finance.cash')}</MenuItem>
              <MenuItem value="bank_transfer">{t('finance.bankTransfer')}</MenuItem>
              <MenuItem value="cheque">{t('finance.cheque')}</MenuItem>
              <MenuItem value="esewa">{t('finance.esewa')}</MenuItem>
              <MenuItem value="khalti">{t('finance.khalti')}</MenuItem>
              <MenuItem value="ime_pay">{t('finance.imePay')}</MenuItem>
            </TextField>
            <TextField
              label={t('finance.transactionRef')}
              value={formData.transactionId}
              onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
              fullWidth
              helperText={t('finance.onlinePayment')}
            />
            <TextField
              label={t('finance.paymentDate')}
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t('finance.paymentNotes')}
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
          <Button onClick={() => setOpenDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleRecordPayment} variant="contained">
            {t('finance.recordPayment')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Payments;

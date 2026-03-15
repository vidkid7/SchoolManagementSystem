/**
 * Refund Management Page
 * Process refund requests, view refund history
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
  useTheme,
} from '@mui/material';
import {
  Undo as RefundIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

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
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
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
      const response = await apiClient.get('/finance/refunds', {
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
      await apiClient.post('/finance/refunds', formData);
      setSuccess(t('finance.refundProcessedSuccess'));
      setOpenDialog(false);
      fetchRefunds();
      setTimeout(() => setSuccess(''), 3000);
      setFormData({
        paymentId: '',
        reason: '',
        remarks: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || t('finance.failedToProcessRefund'));
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
          {t('finance.refundManagement')}
        </Typography>
        <Button
          variant="contained" sx={S.BTN_PRIMARY}
          startIcon={<RefundIcon />}
          onClick={() => setOpenDialog(true)}
        >
          {t('finance.processRefund')}
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ ...S.GLASS }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>{t('finance.refundId')}</TableCell>
                <TableCell>{t('finance.receiptNumber')}</TableCell>
                <TableCell>{t('finance.student')}</TableCell>
                <TableCell align="right">{t('finance.amount')}</TableCell>
                <TableCell>{t('finance.reason')}</TableCell>
                <TableCell>{t('finance.requestedDate')}</TableCell>
                <TableCell>{t('finance.status')}</TableCell>
                <TableCell align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={8} align="center" sx={S.TD}>{t('common.loading')}</TableCell>
                </TableRow>
              ) : refunds.length === 0 ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={8} align="center" sx={S.TD}>
                    {t('finance.noRefunds')}
                  </TableCell>
                </TableRow>
              ) : (
                refunds.map((refund) => (
                  <TableRow key={refund.refundId} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>#{refund.refundId}</TableCell>
                    <TableCell sx={S.TD}>{refund.receiptNumber}</TableCell>
                    <TableCell sx={S.TD}>{refund.studentName}</TableCell>
                    <TableCell align="right" sx={S.TD}>NPR {refund.amount.toLocaleString()}</TableCell>
                    <TableCell sx={S.TD}>{refund.reason}</TableCell>
                    <TableCell sx={S.TD}>{new Date(refund.requestedDate).toLocaleDateString()}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip
                        label={refund.status}
                        color={getStatusColor(refund.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <IconButton
                        size="small"
                        title={t('finance.viewReceipt')}
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
        <DialogTitle>{t('finance.processRefund')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('finance.paymentId')}
              type="number"
              value={formData.paymentId}
              onChange={(e) => setFormData({ ...formData, paymentId: e.target.value })}
              required
              fullWidth
              helperText={t('finance.enterPaymentIdToRefund')}
            />
            <TextField
              label={t('finance.reason')}
              select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              fullWidth
            >
              <MenuItem value="duplicate_payment">{t('finance.duplicatePayment')}</MenuItem>
              <MenuItem value="overpayment">{t('finance.overpayment')}</MenuItem>
              <MenuItem value="student_withdrawal">{t('finance.studentWithdrawal')}</MenuItem>
              <MenuItem value="fee_waiver">{t('finance.feeWaiver')}</MenuItem>
              <MenuItem value="other">{t('finance.other')}</MenuItem>
            </TextField>
            <TextField
              label={t('finance.remarks')}
              multiline
              rows={3}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              fullWidth
              helperText={t('finance.additionalRefundDetails')}
            />
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleProcessRefund} variant="contained" sx={S.BTN_PRIMARY}>
            {t('finance.processRefund')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default RefundManagement;

import { YearSelectableDateField } from '../../components/YearSelectableDatePicker/YearSelectableDatePicker';
/**
 * Payments Management
 * Record payments, view history, process refunds
 */

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
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
import { formatLocalDate } from '../../utils/dateUtils';
import { useAdminStyles } from '../../theme/designTokens';
import { openFinanceReceipt } from './financeReceipt';

const getErrorMessage = (error: unknown, fallback: string): string => {
  const response = (error as { response?: { data?: { message?: unknown } } } | null)?.response;
  return typeof response?.data?.message === 'string' ? response.data.message : fallback;
};

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
  const recordPaymentButtonRef = useRef<HTMLButtonElement>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'cash',
    transactionId: '',
    paymentDate: formatLocalDate(new Date()),
    remarks: '',
  });

  const openPaymentDialog = (event: MouseEvent<HTMLButtonElement>) => {
    setError('');
    // MUI hides the app root while the dialog is open. Blur the trigger first
    // so it is not still focused when that aria-hidden state is applied.
    event.currentTarget.blur();
    setOpenDialog(true);
  };

  const restorePaymentDialogFocus = () => {
    recordPaymentButtonRef.current?.focus();
  };

  const closePaymentDialog = () => {
    setError('');
    setOpenDialog(false);
  };

  const fetchPayments = useCallback(async () => {
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
    } catch (err: unknown) {
      setPayments([]);
      setError(getErrorMessage(err, t('finance.failedToLoad')));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, t]);

  useEffect(() => {
    // Fetching a new page is an external synchronization effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPayments();
  }, [fetchPayments]);

  const handleRecordPayment = async () => {
    const invoiceId = Number(formData.invoiceId);
    const amount = Number(formData.amount);
    const [year, month, day] = formData.paymentDate.split('-').map(Number);
    const paymentDate = new Date(year, month - 1, day);
    const isValidPaymentDate =
      /^\d{4}-\d{2}-\d{2}$/.test(formData.paymentDate) &&
      paymentDate.getFullYear() === year &&
      paymentDate.getMonth() === month - 1 &&
      paymentDate.getDate() === day;

    if (!formData.invoiceId.trim() || !Number.isInteger(invoiceId) || invoiceId <= 0) {
      setError(t('validation.required'));
      return;
    }

    if (!formData.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError(t('finance.invalidAmount'));
      return;
    }

    if (
      !isValidPaymentDate
    ) {
      setError(t('validation.required'));
      return;
    }

    try {
      await apiClient.post('/finance/payments', { ...formData, invoiceId, amount });
      setSuccess(t('finance.paymentRecordedSuccess'));
      setOpenDialog(false);
      fetchPayments();
      setTimeout(() => setSuccess(''), 3000);
      setFormData({
        invoiceId: '',
        amount: '',
        paymentMethod: 'cash',
        transactionId: '',
        paymentDate: formatLocalDate(new Date()),
        remarks: '',
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('finance.failedToRecordPayment')));
    }
  };

  const handleRefund = async (paymentId: number) => {
    if (!confirm(t('finance.confirmRefund'))) return;

    try {
      await apiClient.post(`/finance/payments/${paymentId}/refund`);
      setSuccess(t('finance.refundProcessedSuccess'));
      fetchPayments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('finance.failedToLoad')));
    }
  };

  const handlePrintReceipt = (payment: Payment) => {
    openFinanceReceipt({
      title: t('finance.paymentReceipt'),
      reference: payment.invoiceNumber || `#${payment.paymentId}`,
      fields: [
        { label: t('finance.paymentId'), value: payment.paymentId },
        { label: t('finance.studentName'), value: payment.studentName },
        { label: t('finance.invoiceId'), value: payment.invoiceId },
        { label: t('finance.amount'), value: `NPR ${payment.amount.toLocaleString()}` },
        { label: t('finance.paymentMethod'), value: payment.paymentMethod },
        { label: t('finance.transactionRef'), value: payment.transactionId || '-' },
        { label: t('finance.paymentDate'), value: new Date(payment.paymentDate).toLocaleDateString() },
        { label: t('finance.paymentStatus'), value: payment.status },
      ],
    });
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            {t('finance.payments')}
          </Typography>
          <Button
            ref={recordPaymentButtonRef}
            variant="contained" sx={S.BTN_PRIMARY}
            startIcon={<AddIcon />}
            onClick={openPaymentDialog}
          >
            {t('finance.recordPayment')}
          </Button>
        </Box>
      </Paper>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ ...S.GLASS }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>{t('finance.paymentId')}</TableCell>
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
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={9} align="center" sx={S.TD}>{t('common.loading')}</TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={9} align="center" sx={S.TD}>
                    {t('finance.noPayments')}
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.paymentId} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>#{payment.paymentId}</TableCell>
                    <TableCell sx={S.TD}>{payment.invoiceNumber}</TableCell>
                    <TableCell sx={S.TD}>{payment.studentName}</TableCell>
                    <TableCell align="right" sx={S.TD}>NPR {payment.amount.toLocaleString()}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip label={payment.paymentMethod} size="small" />
                    </TableCell>
                    <TableCell sx={S.TD}>{payment.transactionId || '-'}</TableCell>
                    <TableCell sx={S.TD}>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip
                        label={payment.status}
                        color={payment.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <IconButton
                        size="small"
                        onClick={() => handlePrintReceipt(payment)}
                        title={t('common.download')}
                        aria-label={`${t('common.download')} ${payment.invoiceNumber || `#${payment.paymentId}`}`}
                      >
                        <PrintIcon fontSize="small" />
                      </IconButton>
                      {payment.status === 'completed' && (
                        <IconButton
                          size="small"
                          onClick={() => handleRefund(payment.paymentId)}
                          title={t('finance.processRefund')}
                          aria-label={`${t('finance.processRefund')} ${payment.invoiceNumber || `#${payment.paymentId}`}`}
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
          rowsPerPageOptions={[10, 20, 50, 100]}
          SelectProps={{ name: 'rowsPerPage' }}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      <Dialog
        open={openDialog}
        onClose={closePaymentDialog}
        maxWidth="sm"
        fullWidth
        TransitionProps={{ onExited: restorePaymentDialogFocus }}
      >
        <DialogTitle>{t('finance.recordPayment')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('finance.invoiceId')}
              type="number"
              value={formData.invoiceId}
              onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
              required
              fullWidth
              inputProps={{ min: 1, step: 1 }}
              helperText={t('finance.enterInvoiceId')}
            />
            <TextField
              label={t('finance.amount')}
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              fullWidth
              inputProps={{ min: 0.01, step: 0.01 }}
            />
            <TextField
              label={t('finance.paymentMethod')}
              select
              InputLabelProps={{ htmlFor: undefined, id: 'payment-method-label' }}
              SelectProps={{ labelId: 'payment-method-label', name: 'paymentMethod' }}
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
            <YearSelectableDateField
              label={t('finance.paymentDate')}
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
          <Button onClick={closePaymentDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleRecordPayment} variant="contained" sx={S.BTN_PRIMARY}>
            {t('finance.recordPayment')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Payments;

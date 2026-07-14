/**
 * Invoice List Page
 * 
 * Displays invoices with payment tracking
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Send as SendIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface Invoice {
  id?: number;
  invoiceId?: number;
  invoice_id?: number;
  invoice_number: string;
  student_name: string;
  class_name: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  due_date: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
}

export const InvoiceList = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Payment Dialog
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    fetchInvoices();
  }, [page, rowsPerPage, search, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await apiClient.get(`/api/v1/finance/invoices?${params}`);
      setInvoices(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setInvoices([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'overdue': return 'error';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const handlePayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balance.toString());
    setPaymentDialog(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedInvoice) return;

    try {
      await apiClient.post('/api/v1/finance/payments', {
        invoice_id: selectedInvoice.invoiceId || selectedInvoice.invoice_id || selectedInvoice.id,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
      });

      setPaymentDialog(false);
      fetchInvoices();
    } catch (error) {
      console.error('Failed to process payment:', error);
    }
  };

  const handleSendReminder = async (invoiceId: number) => {
    try {
      await apiClient.post(`/finance/invoices/${invoiceId}/send-reminder`);
      setSuccess(t('finance.reminderSentSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            {t('finance.invoices')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined" sx={S.BTN_OUTLINE}
              onClick={() => navigate(`/finance/invoices/bulk-generate`)}
            >
              {t('finance.generateInvoices')}
            </Button>
            <Button
              variant="contained" sx={S.BTN_PRIMARY}
              startIcon={<AddIcon />}
              onClick={() => navigate(`/finance/invoices/create`)}
            >
              {t('finance.createInvoice')}
            </Button>
          </Box>
        </Box>
      </Paper>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ ...S.GLASS, p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label={t('common.search')}
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              endAdornment: <SearchIcon />,
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('finance.paymentStatus')}</InputLabel>
            <Select
              value={statusFilter}
              label={t('finance.paymentStatus')}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">{t('finance.allStatuses')}</MenuItem>
              <MenuItem value="pending">{t('finance.pending')}</MenuItem>
              <MenuItem value="partial">{t('finance.partial')}</MenuItem>
              <MenuItem value="paid">{t('finance.paid')}</MenuItem>
              <MenuItem value="overdue">{t('finance.overdue')}</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined" sx={S.BTN_OUTLINE}
            onClick={() => {
              setSearch('');
              setStatusFilter('');
            }}
          >
            {t('common.clear')}
          </Button>
        </Box>
      </Paper>

      {/* Invoice Table */}
      <TableContainer component={Paper} sx={{ ...S.GLASS }}>
        <Table>
          <TableHead sx={{ bgcolor: S.TH_BG }}>
            <TableRow>
              <TableCell>{t('finance.invoices')}</TableCell>
              <TableCell>{t('finance.studentName')}</TableCell>
              <TableCell>{t('finance.className')}</TableCell>
              <TableCell align="right">{t('finance.totalAmount')}</TableCell>
              <TableCell align="right">{t('finance.paidAmount')}</TableCell>
              <TableCell align="right">{t('finance.balance')}</TableCell>
              <TableCell>{t('finance.dueDate')}</TableCell>
              <TableCell>{t('finance.paymentStatus')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow sx={S.TR_HOVER}>
                <TableCell colSpan={9} align="center" sx={S.TD}>
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : (invoices || []).length === 0 ? (
              <TableRow sx={S.TR_HOVER}>
                <TableCell colSpan={9} align="center" sx={S.TD}>
                  {t('finance.noInvoices')}
                </TableCell>
              </TableRow>
            ) : (
              (invoices || []).map((invoice, index) => (
                <TableRow key={invoice.invoiceId || invoice.invoice_id || invoice.id || invoice.invoice_number || index} hover sx={S.TR_HOVER}>
                  <TableCell sx={S.TD}>{invoice.invoice_number}</TableCell>
                  <TableCell sx={S.TD}>{invoice.student_name}</TableCell>
                  <TableCell sx={S.TD}>{invoice.class_name}</TableCell>
                  <TableCell align="right" sx={S.TD}>रू {(invoice.total_amount || 0).toLocaleString()}</TableCell>
                  <TableCell align="right" sx={S.TD}>रू {(invoice.paid_amount || 0).toLocaleString()}</TableCell>
                  <TableCell align="right" sx={S.TD}>
                    <Typography
                      color={invoice.balance > 0 ? 'error' : 'success'}
                      fontWeight="bold"
                    >
                      रू {(invoice.balance || 0).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell sx={S.TD}>{invoice.due_date}</TableCell>
                  <TableCell sx={S.TD}>
                    <Chip
                      label={t(`finance.${invoice.status}`)}
                      color={getStatusColor(invoice.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right" sx={S.TD}>
                    {invoice.balance > 0 && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handlePayment(invoice)}
                          title={t('finance.addPayment')}
                          color="primary"
                        >
                          <PaymentIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleSendReminder(invoice.invoiceId || invoice.invoice_id || invoice.id!)}
                          title={t('finance.sendReminders')}
                        >
                          <SendIcon />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/finance/invoices/${invoice.invoiceId || invoice.invoice_id || invoice.id}`)}
                      title={t('common.view')}
                    >
                      <ReceiptIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('finance.processRefund')}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  {t('finance.invoices')}: {selectedInvoice.invoice_number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('finance.studentName')}: {selectedInvoice.student_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('finance.balance')}: रू {(selectedInvoice.balance || 0).toLocaleString()}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label={t('finance.amount')}
                  type="number"
                  fullWidth
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  inputProps={{ max: selectedInvoice.balance }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('finance.paymentMethod')}</InputLabel>
                  <Select
                    value={paymentMethod}
                    label={t('finance.paymentMethod')}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="cash">{t('finance.cash')}</MenuItem>
                    <MenuItem value="bank_transfer">{t('finance.bankTransfer')}</MenuItem>
                    <MenuItem value="esewa">{t('finance.esewa')}</MenuItem>
                    <MenuItem value="khalti">{t('finance.khalti')}</MenuItem>
                    <MenuItem value="ime_pay">{t('finance.imePay')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained" sx={S.BTN_PRIMARY}
            onClick={handlePaymentSubmit}
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
          >
            {t('finance.addPayment')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

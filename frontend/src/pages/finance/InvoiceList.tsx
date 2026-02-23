/**
 * Invoice List Page
 * 
 * Displays invoices with payment tracking
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Send as SendIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface Invoice {
  id: number;
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
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
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

      const response = await apiClient.get(`/finance/invoices?${params}`);
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
      await apiClient.post('/finance/payments', {
        invoice_id: selectedInvoice.id,
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
      alert('Reminder sent successfully / रिमाइन्डर सफलतापूर्वक पठाइयो');
    } catch (error) {
      console.error('Failed to send reminder:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Invoices / बीजकहरू
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/finance/invoices/bulk-generate')}
          >
            Bulk Generate / थोक उत्पन्न
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/finance/invoices/create')}
          >
            Create Invoice / बीजक बनाउनुहोस्
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search / खोज्नुहोस्"
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
            <InputLabel>Status / स्थिति</InputLabel>
            <Select
              value={statusFilter}
              label="Status / स्थिति"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All / सबै</MenuItem>
              <MenuItem value="pending">Pending / बाँकी</MenuItem>
              <MenuItem value="partial">Partial / आंशिक</MenuItem>
              <MenuItem value="paid">Paid / भुक्तानी</MenuItem>
              <MenuItem value="overdue">Overdue / म्याद नाघेको</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
            }}
          >
            Clear Filters / फिल्टर हटाउनुहोस्
          </Button>
        </Box>
      </Paper>

      {/* Invoice Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice # / बीजक नं</TableCell>
              <TableCell>Student / विद्यार्थी</TableCell>
              <TableCell>Class / कक्षा</TableCell>
              <TableCell align="right">Total / कुल</TableCell>
              <TableCell align="right">Paid / भुक्तानी</TableCell>
              <TableCell align="right">Balance / बाँकी</TableCell>
              <TableCell>Due Date / म्याद</TableCell>
              <TableCell>Status / स्थिति</TableCell>
              <TableCell align="right">Actions / कार्यहरू</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Loading... / लोड हुँदैछ...
                </TableCell>
              </TableRow>
            ) : (invoices || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No invoices found / कुनै बीजक फेला परेन
                </TableCell>
              </TableRow>
            ) : (
              (invoices || []).map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.student_name}</TableCell>
                  <TableCell>{invoice.class_name}</TableCell>
                  <TableCell align="right">रू {invoice.total_amount.toLocaleString()}</TableCell>
                  <TableCell align="right">रू {invoice.paid_amount.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Typography
                      color={invoice.balance > 0 ? 'error' : 'success'}
                      fontWeight="bold"
                    >
                      रू {invoice.balance.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>{invoice.due_date}</TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      color={getStatusColor(invoice.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {invoice.balance > 0 && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handlePayment(invoice)}
                          title="Make Payment"
                          color="primary"
                        >
                          <PaymentIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleSendReminder(invoice.id)}
                          title="Send Reminder"
                        >
                          <SendIcon />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                      title="View Receipt"
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
          Process Payment / भुक्तानी प्रशोधन गर्नुहोस्
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Invoice: {selectedInvoice.invoice_number}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Student: {selectedInvoice.student_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Balance: रू {selectedInvoice.balance.toLocaleString()}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Payment Amount / भुक्तानी रकम"
                  type="number"
                  fullWidth
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  inputProps={{ max: selectedInvoice.balance }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method / भुक्तानी विधि</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Payment Method / भुक्तानी विधि"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="cash">Cash / नगद</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer / बैंक स्थानान्तरण</MenuItem>
                    <MenuItem value="esewa">eSewa</MenuItem>
                    <MenuItem value="khalti">Khalti</MenuItem>
                    <MenuItem value="ime_pay">IME Pay</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>
            Cancel / रद्द गर्नुहोस्
          </Button>
          <Button
            variant="contained"
            onClick={handlePaymentSubmit}
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
          >
            Process Payment / भुक्तानी प्रशोधन गर्नुहोस्
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

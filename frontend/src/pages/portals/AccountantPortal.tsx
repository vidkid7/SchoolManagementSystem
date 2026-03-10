import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip,
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  Assessment as ReportIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as RevenueIcon,
  PendingActions as PendingIcon,
  Add as AddIcon,
  Description as DocIcon,
  Notifications as AnnouncementIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';

interface FinanceStats {
  todayCollection: number;
  outstandingFees: number;
  pendingInvoices: number;
  totalRevenue: number;
}

interface Invoice {
  id: number;
  invoiceNumber?: string;
  studentId: number;
  studentName?: string;
  amount: number;
  dueDate: string;
  status: string;
  description?: string;
}

interface Payment {
  id: number;
  date: string;
  studentId?: number;
  studentName?: string;
  amount: number;
  method?: string;
  status: string;
  reference?: string;
}

interface ProfileData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  status: string;
}

const authHdr = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>;
}

const AccountantPortal: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<FinanceStats>({ todayCollection: 0, outstandingFees: 0, pendingInvoices: 0, totalRevenue: 0 });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ studentId: '', amount: '', dueDate: '', description: '' });

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [statsRes, invoiceRes, paymentRes, profileRes] = await Promise.all([
        apiClient.get('/api/v1/finance/statistics', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
        apiClient.get('/api/v1/finance/invoices?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/finance/payments?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/users/me', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
      ]);
      const s = statsRes.data?.data;
      if (s) {
        setStats({
          todayCollection: s.todayCollection ?? s.todaysCollection ?? 0,
          outstandingFees: s.outstandingFees ?? s.totalOutstanding ?? 0,
          pendingInvoices: s.pendingInvoices ?? 0,
          totalRevenue: s.totalRevenue ?? s.monthlyRevenue ?? 0,
        });
      }
      const inv = invoiceRes.data?.data;
      setInvoices(Array.isArray(inv) ? inv : inv?.invoices ?? []);
      const pay = paymentRes.data?.data;
      setPayments(Array.isArray(pay) ? pay : pay?.payments ?? []);
      setProfile(profileRes.data?.data ?? null);
    } catch {
      setError('Failed to load finance dashboard');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateInvoice = async () => {
    if (!accessToken) return;
    try {
      await apiClient.post('/api/v1/finance/invoices', {
        studentId: Number(invoiceForm.studentId),
        amount: Number(invoiceForm.amount),
        dueDate: invoiceForm.dueDate,
        description: invoiceForm.description,
      }, authHdr(accessToken));
      setInvoiceDialog(false);
      setInvoiceForm({ studentId: '', amount: '', dueDate: '', description: '' });
      loadData();
    } catch {
      setError('Failed to create invoice');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  const recentPayments = payments.slice(0, 10);

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
          <AccountIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>Accountant Portal</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user?.firstName || user?.username} — Finance & Accounts
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: "Today's Collection", value: `Rs ${stats.todayCollection.toLocaleString()}`, icon: <MoneyIcon />, color: 'success.main' },
          { label: 'Outstanding Fees', value: `Rs ${stats.outstandingFees.toLocaleString()}`, icon: <PendingIcon />, color: 'error.main' },
          { label: 'Pending Invoices', value: stats.pendingInvoices, icon: <InvoiceIcon />, color: 'warning.main' },
          { label: 'Total Revenue (This Month)', value: `Rs ${stats.totalRevenue.toLocaleString()}`, icon: <RevenueIcon />, color: 'primary.main' },
        ].map(stat => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ color: stat.color, fontSize: 32 }}>{stat.icon}</Box>
                <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<AccountIcon />} iconPosition="start" label="Dashboard Overview" />
        <Tab icon={<MoneyIcon />} iconPosition="start" label="Fee Collection" />
        <Tab icon={<InvoiceIcon />} iconPosition="start" label="Invoices" />
        <Tab icon={<PaymentIcon />} iconPosition="start" label="Payments" />
        <Tab icon={<ReportIcon />} iconPosition="start" label="Financial Reports" />
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile & Links" />
      </Tabs>

      {/* Dashboard Overview */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>Recent Payments</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Date</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentPayments.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No recent payments.</Typography></TableCell></TableRow>
              ) : recentPayments.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.date ? new Date(p.date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{p.studentName || `Student #${p.studentId || '—'}`}</TableCell>
                  <TableCell><strong>Rs {Number(p.amount).toLocaleString()}</strong></TableCell>
                  <TableCell>{p.method || '—'}</TableCell>
                  <TableCell>
                    <Chip label={p.status} size="small"
                      color={p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Fee Collection */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>Fee Collection</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Date</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No fee collection records.</Typography></TableCell></TableRow>
              ) : payments.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.date ? new Date(p.date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{p.studentName || `Student #${p.studentId || '—'}`}</TableCell>
                  <TableCell><strong>Rs {Number(p.amount).toLocaleString()}</strong></TableCell>
                  <TableCell>{p.method || '—'}</TableCell>
                  <TableCell>
                    <Chip label={p.status} size="small"
                      color={p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Invoices */}
      <TabPanel value={tab} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Invoices</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setInvoiceDialog(true)}>Create Invoice</Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Invoice #</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No invoices found.</Typography></TableCell></TableRow>
              ) : invoices.map(inv => (
                <TableRow key={inv.id} hover>
                  <TableCell>{inv.invoiceNumber || `INV-${inv.id}`}</TableCell>
                  <TableCell>{inv.studentName || `Student #${inv.studentId}`}</TableCell>
                  <TableCell><strong>Rs {Number(inv.amount).toLocaleString()}</strong></TableCell>
                  <TableCell>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <Chip label={inv.status} size="small"
                      color={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'error' : 'warning'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Payments */}
      <TabPanel value={tab} index={3}>
        <Typography variant="h6" fontWeight={600} mb={2}>All Payments</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Date</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No payments recorded.</Typography></TableCell></TableRow>
              ) : payments.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.date ? new Date(p.date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{p.studentName || `Student #${p.studentId || '—'}`}</TableCell>
                  <TableCell><strong>Rs {Number(p.amount).toLocaleString()}</strong></TableCell>
                  <TableCell>{p.method || '—'}</TableCell>
                  <TableCell>{p.reference || '—'}</TableCell>
                  <TableCell>
                    <Chip label={p.status} size="small"
                      color={p.status === 'completed' ? 'success' : p.status === 'pending' ? 'warning' : 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Financial Reports */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={600} mb={2}>Financial Reports</Typography>
        <Grid container spacing={2}>
          {[
            { label: 'Revenue Report', desc: 'View monthly and yearly revenue summaries', path: '/finance/reports' },
            { label: 'Fee Collection Report', desc: 'Detailed fee collection breakdown', path: '/finance/reports' },
            { label: 'Outstanding Fees', desc: 'List of students with pending fees', path: '/finance/reports' },
          ].map(r => (
            <Grid item xs={12} sm={4} key={r.label}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, cursor: 'pointer' }} onClick={() => navigate(r.path)}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <ReportIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600}>{r.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{r.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Profile & Links */}
      <TabPanel value={tab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>My Profile</Typography>
                  <Chip label={profile?.role || 'Accountant'} color="success" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>Name:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>Username:</strong> {profile?.username ?? user?.username}</Typography>
                <Typography variant="body2" mt={1}><strong>Email:</strong> {profile?.email ?? user?.email ?? '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>Phone:</strong> {profile?.phoneNumber || '—'}</Typography>
                <Box mt={2}>
                  <Button variant="outlined" color="success" size="small" onClick={() => navigate('/communication/messages')}>Contact Admin</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Quick Links</Typography>
                <Divider sx={{ mb: 1 }} />
                <List dense>
                  {[
                    { label: 'Finance Dashboard', path: '/finance', icon: <AccountIcon color="success" /> },
                    { label: 'Fee Structures', path: '/finance/fee-structures', icon: <MoneyIcon color="success" /> },
                    { label: 'Invoices', path: '/finance/invoices', icon: <InvoiceIcon color="success" /> },
                    { label: 'Messages', path: '/communication/messages', icon: <MessageIcon color="success" /> },
                    { label: 'Calendar', path: '/calendar', icon: <CalendarIcon color="success" /> },
                  ].map(l => (
                    <ListItem key={l.path} button onClick={() => navigate(l.path)}>
                      <ListItemIcon>{l.icon}</ListItemIcon>
                      <ListItemText primary={l.label} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Create Invoice Dialog */}
      <Dialog open={invoiceDialog} onClose={() => setInvoiceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Invoice</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Student ID" type="number" fullWidth value={invoiceForm.studentId}
              onChange={e => setInvoiceForm(prev => ({ ...prev, studentId: e.target.value }))} />
            <TextField label="Amount" type="number" fullWidth value={invoiceForm.amount}
              onChange={e => setInvoiceForm(prev => ({ ...prev, amount: e.target.value }))} />
            <TextField label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={invoiceForm.dueDate}
              onChange={e => setInvoiceForm(prev => ({ ...prev, dueDate: e.target.value }))} />
            <TextField label="Description" fullWidth multiline rows={3} value={invoiceForm.description}
              onChange={e => setInvoiceForm(prev => ({ ...prev, description: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateInvoice}
            disabled={!invoiceForm.studentId || !invoiceForm.amount || !invoiceForm.dueDate}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountantPortal;

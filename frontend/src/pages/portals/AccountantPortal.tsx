import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel,
  IconButton, Tooltip, InputAdornment, useTheme, LinearProgress,
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  Assessment as ReportIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
  PendingActions as PendingIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Undo as RefundIcon,
  Search as SearchIcon,
  Category as StructureIcon,
  CreditCard as GatewayIcon,
  Warning as WarningIcon,
  Notifications as NotifyIcon,
  CalendarMonth as CalendarIcon,
  Message as MessageIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  OpenInNew as OpenInNewIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';
import { C, useAdminStyles } from '../../theme/designTokens';

// ─── Interfaces ────────────────────────────────────────────────────────────────
interface FinanceStats {
  totalCollection: number;
  pendingFees: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  collectionRate: number;
}

interface FeeStructure {
  feeStructureId: number;
  name: string;
  totalAmount: number;
  isActive: boolean;
  description?: string;
}

interface Invoice {
  invoiceId: number;
  invoiceNumber?: string;
  studentId: number;
  studentName?: string;
  totalAmount?: number;
  paidAmount?: number;
  balance?: number;
  dueDate: string;
  status: string;
}

interface Payment {
  paymentId: number;
  receiptNumber?: string;
  studentId: number;
  studentName?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  transactionId?: string;
}

interface StudentFeeStatus {
  studentId: number;
  studentName: string;
  className: string;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  overdueAmount: number;
  status: string;
}

interface ReportData {
  collectionReport?: { totalAmount: number; byMethod?: Record<string, { total: number; count: number }> };
  pendingReport?: { totalPending: number; count: number };
  defaulters?: Array<{ studentId: number; studentName: string; totalDue: number; daysOverdue: number }>;
}

interface ProfileData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  status?: string;
}

const authHdr = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

// ─── Helpers ───────────────────────────────────────────────────────────────────
function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>;
}

const STATUS_COLORS: Record<string, { fg: string; bg: string; border: string }> = {
  paid:      { fg: C.success,  bg: C.successBg,  border: C.successBdr },
  completed: { fg: C.success,  bg: C.successBg,  border: C.successBdr },
  active:    { fg: C.success,  bg: C.successBg,  border: C.successBdr },
  partial:   { fg: C.primary,  bg: C.primaryBg,  border: C.primaryBdr },
  pending:   { fg: C.warning,  bg: C.warningBg,  border: C.warningBdr },
  overdue:   { fg: C.danger,   bg: C.dangerBg,   border: C.dangerBdr  },
  failed:    { fg: C.danger,   bg: C.dangerBg,   border: C.dangerBdr  },
  refunded:  { fg: C.purple,   bg: C.purpleBg,   border: C.purpleBdr  },
  cancelled: { fg: C.neutral,  bg: C.neutralBg,  border: C.neutralBdr },
  inactive:  { fg: C.neutral,  bg: C.neutralBg,  border: C.neutralBdr },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status?.toLowerCase()] ?? { fg: C.neutral, bg: C.neutralBg, border: C.neutralBdr };
  return (
    <Chip label={status || '—'} size="small" sx={{
      color: c.fg,
      background: c.bg,
      border: `1px solid ${c.border}`,
      fontWeight: 700,
      fontSize: '0.68rem',
      height: 22,
      letterSpacing: '0.02em',
    }} />
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const AccountantPortal: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { GLASS, GLASS_ELEVATED, TH_BG, TD, TR_HOVER, TF, BTN_PRIMARY, BTN_OUTLINE, BTN_GHOST } = S;
  
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<FinanceStats>({ totalCollection: 0, pendingFees: 0, totalInvoices: 0, paidInvoices: 0, overdueInvoices: 0, collectionRate: 0 });
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFeeStatus[]>([]);
  const [reportData, setReportData] = useState<ReportData>({});
  const [gateways, setGateways] = useState<Record<string, any>>({});
  const [gatewayTxns, setGatewayTxns] = useState<any[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Dialog state
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ studentId: '', feeStructureId: '', dueDate: '', description: '' });
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ invoiceId: '', amount: '', method: 'cash', transactionId: '', remarks: '' });
  const [feeDialog, setFeeDialog] = useState(false);
  const [editFee, setEditFee] = useState<FeeStructure | null>(null);
  const [feeForm, setFeeForm] = useState({ name: '', description: '', components: [{ name: '', type: 'monthly', amount: '', frequency: 'monthly', isMandatory: true }] });

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const nav = (path: string) => navigate(path);
  const dark = theme.palette.mode === 'dark';

  // ─── Data loading ─────────────────────────────────────────────────────────
  const loadCore = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const [statsRes, txnRes, invRes, payRes, profRes] = await Promise.all([
      apiClient.get('/api/v1/finance/statistics', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
      apiClient.get('/api/v1/finance/recent-transactions?limit=10', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
      apiClient.get('/api/v1/finance/invoices?limit=100', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
      apiClient.get('/api/v1/finance/payments?limit=100', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
      apiClient.get('/api/v1/auth/me', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
    ]);
    const s = statsRes.data?.data;
    if (s) setStats({
      totalCollection: Number(s.totalCollection ?? 0),
      pendingFees: Number(s.pendingFees ?? 0),
      totalInvoices: Number(s.totalInvoices ?? 0),
      paidInvoices: Number(s.paidInvoices ?? 0),
      overdueInvoices: Number(s.overdueInvoices ?? 0),
      collectionRate: Number(s.collectionRate ?? 0),
    });
    setRecentTxns(Array.isArray(txnRes.data?.data) ? txnRes.data.data : []);
    const inv = invRes.data?.data;
    setInvoices(Array.isArray(inv) ? inv : (inv?.invoices ?? []));
    const pay = payRes.data?.data;
    setPayments(Array.isArray(pay) ? pay : (pay?.payments ?? []));
    setProfile(profRes.data?.data ?? null);
    setLoading(false);
  }, [accessToken]);

  const loadTabData = useCallback(async (t: number) => {
    if (!accessToken) return;
    try {
      if (t === 1) {
        const r = await apiClient.get('/api/v1/finance/fee-structures', authHdr(accessToken));
        setFeeStructures(Array.isArray(r.data?.data) ? r.data.data : []);
      } else if (t === 5) {
        const [col, pend, def] = await Promise.all([
          apiClient.get('/api/v1/finance/reports/collection', authHdr(accessToken)).catch(() => ({ data: { data: {} } })),
          apiClient.get('/api/v1/finance/reports/pending', authHdr(accessToken)).catch(() => ({ data: { data: {} } })),
          apiClient.get('/api/v1/finance/reports/defaulters', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        ]);
        setReportData({ collectionReport: col.data?.data, pendingReport: pend.data?.data, defaulters: Array.isArray(def.data?.data) ? def.data.data : [] });
      } else if (t === 6) {
        const [cfg, txn] = await Promise.all([
          apiClient.get('/api/v1/finance/payment-gateways/config', authHdr(accessToken)).catch(() => ({ data: { data: {} } })),
          apiClient.get('/api/v1/finance/payment-gateways/transactions?limit=20', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        ]);
        setGateways(cfg.data?.data ?? {});
        setGatewayTxns(Array.isArray(txn.data?.data) ? txn.data.data : []);
      } else if (t === 7) {
        const r = await apiClient.get('/api/v1/finance/students/fee-status', authHdr(accessToken)).catch(() => ({ data: { data: [] } }));
        setStudentFees(Array.isArray(r.data?.data) ? r.data.data : []);
      }
    } catch { /* non-critical */ }
  }, [accessToken]);

  useEffect(() => { loadCore(); }, [loadCore]);
  useEffect(() => { loadTabData(tab); }, [tab, loadTabData]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleCreateInvoice = async () => {
    if (!accessToken || !invoiceForm.studentId || !invoiceForm.dueDate) return;
    try {
      await apiClient.post('/api/v1/finance/invoices', {
        studentId: Number(invoiceForm.studentId),
        ...(invoiceForm.feeStructureId && { feeStructureId: Number(invoiceForm.feeStructureId) }),
        dueDate: invoiceForm.dueDate,
        ...(invoiceForm.description && { description: invoiceForm.description }),
      }, authHdr(accessToken));
      setSuccess(t('finance.invoiceGeneratedSuccess') || 'Invoice generated successfully');
      setInvoiceDialog(false);
      setInvoiceForm({ studentId: '', feeStructureId: '', dueDate: '', description: '' });
      loadCore();
    } catch { setError(t('finance.failedToGenerateInvoice') || 'Failed to generate invoice'); }
  };

  const handleRecordPayment = async () => {
    if (!accessToken || !paymentForm.invoiceId || !paymentForm.amount) return;
    try {
      await apiClient.post('/api/v1/finance/payments', {
        invoiceId: Number(paymentForm.invoiceId),
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.method,
        ...(paymentForm.transactionId && { transactionId: paymentForm.transactionId }),
        ...(paymentForm.remarks && { remarks: paymentForm.remarks }),
      }, authHdr(accessToken));
      setSuccess(t('finance.paymentRecordedSuccess') || 'Payment recorded successfully');
      setPaymentDialog(false);
      setPaymentForm({ invoiceId: '', amount: '', method: 'cash', transactionId: '', remarks: '' });
      loadCore();
    } catch { setError(t('finance.failedToRecordPayment') || 'Failed to record payment'); }
  };

  const handleSendReminder = async (invoiceId: number) => {
    if (!accessToken) return;
    try {
      await apiClient.post(`/api/v1/finance/invoices/${invoiceId}/send-reminder`, {}, authHdr(accessToken));
      setSuccess(t('finance.reminderSentSuccess') || 'Reminder sent successfully');
    } catch { setError(t('finance.failedToSendReminder') || 'Failed to send reminder'); }
  };

  const handleRefund = async (paymentId: number) => {
    if (!accessToken) return;
    const reason = window.prompt('Enter refund reason:');
    if (!reason) return;
    try {
      await apiClient.post(`/api/v1/finance/payments/${paymentId}/refund`, { reason }, authHdr(accessToken));
      setSuccess(t('finance.refundProcessedSuccess') || 'Refund processed successfully');
      loadCore();
    } catch { setError(t('finance.failedToProcessRefund') || 'Failed to process refund'); }
  };

  const handleSaveFeeStructure = async () => {
    if (!accessToken || !feeForm.name) return;
    try {
      if (editFee) {
        await apiClient.put(`/api/v1/finance/fee-structures/${editFee.feeStructureId}`,
          { name: feeForm.name, description: feeForm.description || undefined }, authHdr(accessToken));
        setSuccess(t('finance.feeStructureUpdated') || 'Fee structure updated');
      } else {
        await apiClient.post('/api/v1/finance/fee-structures', {
          name: feeForm.name,
          description: feeForm.description || undefined,
          components: feeForm.components.filter(c => c.name && c.amount).map(c => ({
            name: c.name, type: c.type, amount: Number(c.amount), frequency: c.frequency, isMandatory: c.isMandatory,
          })),
        }, authHdr(accessToken));
        setSuccess(t('finance.feeStructureCreated') || 'Fee structure created');
      }
      setFeeDialog(false);
      setEditFee(null);
      setFeeForm({ name: '', description: '', components: [{ name: '', type: 'monthly', amount: '', frequency: 'monthly', isMandatory: true }] });
      loadTabData(1);
    } catch { setError(t('finance.failedToSaveFeeStructure') || 'Failed to save fee structure'); }
  };

  const handleDeleteFeeStructure = async (id: number) => {
    if (!accessToken || !window.confirm('Delete this fee structure? This cannot be undone.')) return;
    try {
      await (apiClient as any).delete(`/api/v1/finance/fee-structures/${id}`, authHdr(accessToken));
      setSuccess(t('finance.feeStructureDeleted') || 'Fee structure deleted');
      loadTabData(1);
    } catch { setError(t('finance.failedToDeleteFeeStructure') || 'Failed to delete fee structure'); }
  };

  const openEditFee = (fs: FeeStructure) => {
    setEditFee(fs);
    setFeeForm({ name: fs.name, description: fs.description ?? '', components: [{ name: '', type: 'monthly', amount: '', frequency: 'monthly', isMandatory: true }] });
    setFeeDialog(true);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: C.primary }} size={48} thickness={3} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Loading Finance Portal…</Typography>
      </Box>
    );
  }

  const filteredStudents = studentFees.filter(s =>
    !search || s.studentName?.toLowerCase().includes(search.toLowerCase()) || String(s.studentId).includes(search)
  );

  // ─── Shared table helpers ─────────────────────────────────────────────────
  const THead = ({ cols }: { cols: string[] }) => (
    <TableHead>
      <TableRow sx={{ '& th': { color: theme.palette.text.secondary, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `2px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,122,255,0.1)'}`, background: TH_BG, py: 1.5 } }}>
        {cols.map((c, idx) => <TableCell key={`${c}-${idx}`}>{c}</TableCell>)}
      </TableRow>
    </TableHead>
  );

  const EmptyRow = ({ cols, msg }: { cols: number; msg?: string }) => (
    <TableRow>
      <TableCell colSpan={cols} align="center" sx={{ py: 6, color: theme.palette.text.disabled, borderBottom: 'none', fontStyle: 'italic', fontSize: '0.85rem' }}>
        {msg ?? (t('finance.noRecordsFound') || 'No records found')}
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 3 }, mt: { xs: 7, sm: 8 } }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <Paper sx={S.PAGE_HEADER}>
        <Box display="flex" alignItems="center" gap={2}>
          <AccountIcon sx={{ fontSize: 32, color: C.primary }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{t('finance.portal') || 'Finance Portal'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('common.welcome')}, <strong>{user?.firstName || user?.username}</strong>
              <Chip label={t('roles.accountant') || 'Accountant'} size="small" sx={{
                ml: 1, height: 18, fontSize: '0.68rem', fontWeight: 700,
                background: C.primaryBg, color: C.primary, border: `1px solid ${C.primaryBdr}`,
              }} />
            </Typography>
          </Box>
          <Tooltip title={t('common.refresh') || 'Refresh data'}>
            <IconButton onClick={loadCore} sx={{
              color: C.primary,
              background: C.primaryBg,
              border: `1px solid ${C.primaryBdr}`,
              borderRadius: 1.5,
              '&:hover': { background: C.primaryBg, transform: 'rotate(180deg)', transition: 'transform 0.5s ease' },
            }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* ── Alerts ─────────────────────────────────────────────────────────── */}
      {error && <Alert severity="error" sx={{ mb: 2, ...GLASS }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, ...GLASS }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: t('finance.totalCollected') || 'Total Collected',   value: `Rs ${stats.totalCollection.toLocaleString()}`, icon: <MoneyIcon />,   accent: C.success,  accentBg: C.successBg,  accentBdr: C.successBdr  },
          { label: t('finance.outstandingFees') || 'Outstanding Fees', value: `Rs ${stats.pendingFees.toLocaleString()}`,     icon: <PendingIcon />,  accent: C.warning,  accentBg: C.warningBg,  accentBdr: C.warningBdr  },
          { label: t('finance.totalInvoices') || 'Total Invoices',     value: stats.totalInvoices,                            icon: <InvoiceIcon />,  accent: C.primary,  accentBg: C.primaryBg,  accentBdr: C.primaryBdr  },
          { label: t('finance.collectionRate') || 'Collection Rate',   value: `${stats.collectionRate.toFixed(1)}%`,          icon: <TrendingIcon />, accent: C.purple,   accentBg: C.purpleBg,   accentBdr: C.purpleBdr   },
        ].map(s => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card sx={{
              ...GLASS,
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 12px 32px ${s.accentBg}, 0 4px 12px rgba(0,0,0,0.1)`,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0, left: 0, bottom: 0,
                width: 4,
                background: s.accent,
                borderRadius: '2px 0 0 2px',
              },
            }}>
              <CardContent sx={{ p: 2.5, pb: '20px !important', pl: 3 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 1.5,
                  background: s.accentBg, border: `1px solid ${s.accentBdr}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: s.accent, mb: 1.5,
                }}>
                  {s.icon}
                </Box>
                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500, mt: 0.25, display: 'block' }}>{s.label}</Typography>
                {s.label === (t('finance.collectionRate') || 'Collection Rate') && (
                  <LinearProgress variant="determinate" value={Math.min(stats.collectionRate, 100)} sx={{
                    mt: 1, height: 3, borderRadius: 2,
                    background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${C.primary}, ${C.purple})`, borderRadius: 2 },
                  }} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <Box sx={{ ...GLASS, mb: 2, px: 0.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{
          '& .MuiTab-root': {
            color: theme.palette.text.secondary,
            fontWeight: 600,
            minHeight: 52,
            textTransform: 'none',
            fontSize: '0.83rem',
            borderRadius: 1.5,
            mx: 0.25,
            transition: 'all 0.2s ease',
            '&:hover': { color: C.primary, background: C.primaryBg },
          },
          '& .Mui-selected': { color: `${C.primary} !important`, fontWeight: 700 },
          '& .MuiTabs-indicator': {
            background: `linear-gradient(90deg, ${C.primary}, ${C.purple})`,
            height: 3,
            borderRadius: 2,
          },
        }}>
          <Tab icon={<AccountIcon />} iconPosition="start" label={t('menu.dashboard') || 'Dashboard'} />
          <Tab icon={<StructureIcon />} iconPosition="start" label={t('finance.feeStructures') || 'Fee Structures'} />
          <Tab icon={<InvoiceIcon />} iconPosition="start" label={t('finance.invoices') || 'Invoices'} />
          <Tab icon={<PaymentIcon />} iconPosition="start" label={t('finance.payments') || 'Payments'} />
          <Tab icon={<RefundIcon />} iconPosition="start" label={t('finance.refunds') || 'Refunds'} />
          <Tab icon={<ReportIcon />} iconPosition="start" label={t('finance.reports') || 'Reports'} />
          <Tab icon={<GatewayIcon />} iconPosition="start" label={t('finance.gateways') || 'Gateways'} />
          <Tab icon={<PeopleIcon />} iconPosition="start" label={t('finance.studentFees') || 'Student Fees'} />
          <Tab icon={<PersonIcon />} iconPosition="start" label={t('menu.profile') || 'Profile'} />
        </Tabs>
      </Box>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 0 — Dashboard                                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={0}>
        {/* Section label */}
        <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
          {t('finance.quickActions') || 'Quick Actions'}
        </Typography>

        {/* Quick actions */}
        <Grid container spacing={2} mb={4}>
          {[
            { label: t('finance.recordPayment') || 'Record Payment',   icon: <PaymentIcon />,   accent: C.success,  accentBg: C.successBg,  accentBdr: C.successBdr,  action: () => setPaymentDialog(true) },
            { label: t('finance.generateInvoice') || 'Generate Invoice', icon: <InvoiceIcon />, accent: C.primary,  accentBg: C.primaryBg,  accentBdr: C.primaryBdr,  action: () => setInvoiceDialog(true) },
            { label: t('finance.feeStructures') || 'Fee Structures',   icon: <StructureIcon />, accent: C.purple,   accentBg: C.purpleBg,   accentBdr: C.purpleBdr,   action: () => setTab(1) },
            { label: t('finance.viewReports') || 'View Reports',       icon: <ReportIcon />,    accent: C.warning,  accentBg: C.warningBg,  accentBdr: C.warningBdr,  action: () => setTab(5) },
            { label: t('finance.gatewayStatus') || 'Gateway Status',   icon: <GatewayIcon />,   accent: C.neutral,  accentBg: C.neutralBg,  accentBdr: C.neutralBdr,  action: () => setTab(6) },
            { label: t('finance.studentFees') || 'Student Fees',       icon: <PeopleIcon />,    accent: C.primary,  accentBg: C.primaryBg,  accentBdr: C.primaryBdr,  action: () => setTab(7) },
          ].map(a => (
            <Grid item xs={6} sm={4} md={2} key={a.label}>
              <Card onClick={a.action} sx={{
                ...GLASS,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  background: a.accentBg,
                  border: `1px solid ${a.accentBdr}`,
                  boxShadow: `0 12px 28px ${a.accentBg}`,
                },
              }}>
                <CardContent sx={{ py: 2.5, px: 2 }}>
                  <Box sx={{
                    width: 44, height: 44, mx: 'auto', mb: 1.25,
                    borderRadius: 1.5,
                    background: a.accentBg,
                    border: `1px solid ${a.accentBdr}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: a.accent,
                    transition: 'transform 0.2s ease',
                    '.MuiCard-root:hover &': { transform: 'scale(1.1)' },
                  }}>
                    {a.icon}
                  </Box>
                  <Typography variant="caption" sx={{ color: theme.palette.text.primary, fontWeight: 600, lineHeight: 1.3, display: 'block', fontSize: '0.78rem' }}>{a.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Section label */}
        <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
          {t('finance.recentTransactions') || 'Recent Transactions'}
        </Typography>

        {/* Recent transactions */}
        <TableContainer sx={GLASS}>
          <Table size="small">
            <THead cols={[t('finance.receiptNumber') || 'Receipt #', t('finance.student') || 'Student', t('finance.amount') || 'Amount', t('finance.method') || 'Method', t('finance.date') || 'Date', t('finance.status') || 'Status']} />
            <TableBody>
              {recentTxns.length === 0
                ? <EmptyRow cols={6} msg={t('finance.noTransactionsYet') || 'No transactions yet'} />
                : recentTxns.map((tx: any, i) => (
                  <TableRow key={tx.id ?? tx.paymentId ?? i} hover sx={TR_HOVER}>
                    <TableCell sx={{ ...TD, fontFamily: 'monospace', fontSize: '0.78rem', color: C.primary }}>{tx.receiptNumber || '—'}</TableCell>
                    <TableCell sx={{ ...TD, fontWeight: 500 }}>{tx.studentName || `Student #${tx.studentId}`}</TableCell>
                    <TableCell sx={{ ...TD, color: C.success, fontWeight: 700 }}>Rs {Number(tx.amount).toLocaleString()}</TableCell>
                    <TableCell sx={{ ...TD, textTransform: 'capitalize' }}>{String(tx.paymentMethod || tx.method || '—').replace(/_/g, ' ')}</TableCell>
                    <TableCell sx={TD}>{(tx.date || tx.paymentDate) ? new Date(tx.date ?? tx.paymentDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell sx={TD}><StatusBadge status={tx.status} /></TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary cards */}
        <Grid container spacing={2} mt={2}>
          {[
            { title: t('finance.invoiceBreakdown') || 'Invoice Breakdown', rows: [
              { l: t('finance.total') || 'Total',   v: stats.totalInvoices,                              c: theme.palette.text.primary },
              { l: t('finance.paid') || 'Paid',     v: stats.paidInvoices,                               c: C.success },
              { l: t('finance.overdue') || 'Overdue', v: stats.overdueInvoices,                          c: C.danger  },
            ]},
            { title: t('finance.financeOverview') || 'Finance Overview', rows: [
              { l: t('finance.totalCollected') || 'Collected',     v: `Rs ${stats.totalCollection.toLocaleString()}`, c: C.success  },
              { l: t('finance.outstandingFees') || 'Outstanding',  v: `Rs ${stats.pendingFees.toLocaleString()}`,     c: C.warning  },
              { l: t('finance.rate') || 'Rate',                    v: `${stats.collectionRate.toFixed(1)}%`,          c: C.purple   },
            ]},
          ].map(card => (
            <Grid item xs={12} sm={6} md={4} key={card.title}>
              <Card sx={GLASS}>
                <CardContent>
                  <Typography variant="caption" sx={{ color: theme.palette.text.disabled, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>{card.title}</Typography>
                  {card.rows.map(r => (
                    <Box key={r.l} display="flex" justifyContent="space-between" alignItems="center" mt={1.5}>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>{r.l}</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: r.c }}>{r.v}</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          ))}
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={GLASS}>
              <CardContent>
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>{t('common.navigate') || 'Navigate'}</Typography>
                {[
                  { label: t('finance.financeDashboard') || 'Finance Dashboard',   path: '/finance'              },
                  { label: t('finance.allInvoices') || 'All Invoices',             path: '/finance/invoices'     },
                  { label: t('finance.financialReports') || 'Financial Reports',   path: '/finance/reports'      },
                ].map(l => (
                  <Button key={l.path} size="small" fullWidth endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />} onClick={() => nav(l.path)}
                    sx={{ mt: 1, ...BTN_OUTLINE, justifyContent: 'space-between', py: 0.75 }}>
                    {l.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 1 — Fee Structures                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="h6" fontWeight={700}>{t('finance.feeStructures') || 'Fee Structures'}</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>{t('finance.feeStructuresSubtitle') || 'Manage fee plans and components'}</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => { setEditFee(null); setFeeForm({ name: '', description: '', components: [{ name: '', type: 'monthly', amount: '', frequency: 'monthly', isMandatory: true }] }); setFeeDialog(true); }}
            sx={BTN_PRIMARY}>
            {t('finance.newStructure') || 'New Structure'}
          </Button>
        </Box>
        <TableContainer sx={GLASS}>
          <Table size="small">
            <THead cols={[t('finance.name') || 'Name', t('finance.totalAmount') || 'Total Amount', t('finance.status') || 'Status', t('finance.description') || 'Description', t('finance.actions') || 'Actions']} />
            <TableBody>
              {feeStructures.length === 0 ? <EmptyRow cols={5} /> : feeStructures.map(fs => (
                <TableRow key={fs.feeStructureId} hover sx={TR_HOVER}>
                  <TableCell sx={{ ...TD, fontWeight: 600 }}>{fs.name}</TableCell>
                  <TableCell sx={{ ...TD, color: C.success, fontWeight: 700 }}>Rs {Number(fs.totalAmount || 0).toLocaleString()}</TableCell>
                  <TableCell sx={TD}><StatusBadge status={fs.isActive ? 'active' : 'inactive'} /></TableCell>
                  <TableCell sx={{ ...TD, color: theme.palette.text.disabled, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fs.description || '—'}</TableCell>
                  <TableCell sx={TD}>
                    <Tooltip title={t('common.edit') || 'Edit'}>
                      <IconButton size="small" sx={{ color: C.primary, '&:hover': { background: C.primaryBg } }} onClick={() => openEditFee(fs)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete') || 'Delete'}>
                      <IconButton size="small" sx={{ color: C.danger, '&:hover': { background: C.dangerBg } }} onClick={() => handleDeleteFeeStructure(fs.feeStructureId)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box mt={2}>
          <Button variant="outlined" size="small" endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />} onClick={() => nav('/finance/fee-structures')} sx={BTN_OUTLINE}>
            {t('finance.openFullFeeStructuresPage') || 'Open full Fee Structures page'}
          </Button>
        </Box>
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 2 — Invoices                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="h6" fontWeight={700}>{t('finance.invoices') || 'Invoices'}</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>{invoices.length} {t('finance.invoicesFound') || 'invoices loaded'}</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setInvoiceDialog(true)} sx={BTN_OUTLINE}>
              {t('finance.generateInvoice') || 'Generate Invoice'}
            </Button>
            <Button variant="contained" onClick={() => nav('/finance/invoices/bulk-generate')} sx={BTN_PRIMARY}>
              {t('finance.bulkGenerate') || 'Bulk Generate'}
            </Button>
          </Box>
        </Box>
        <TableContainer sx={GLASS}>
          <Table size="small">
            <THead cols={[t('finance.invoiceNumber') || 'Invoice #', t('finance.student') || 'Student', t('finance.total') || 'Total', t('finance.paid') || 'Paid', t('finance.balance') || 'Balance', t('finance.dueDate') || 'Due Date', t('finance.status') || 'Status', t('finance.actions') || 'Actions']} />
            <TableBody>
              {invoices.length === 0 ? <EmptyRow cols={8} /> : invoices.map((inv, i) => {
                const id = inv.invoiceId ?? (inv as any).id;
                const total = Number(inv.totalAmount ?? (inv as any).amount ?? 0);
                const paid = Number(inv.paidAmount ?? 0);
                const balance = Number(inv.balance ?? (total - paid));
                return (
                  <TableRow key={id ?? i} hover sx={TR_HOVER}>
                    <TableCell sx={{ ...TD, fontFamily: 'monospace', fontSize: '0.78rem', color: C.primary }}>{inv.invoiceNumber || `INV-${id}`}</TableCell>
                    <TableCell sx={{ ...TD, fontWeight: 500 }}>{inv.studentName || `Student #${inv.studentId}`}</TableCell>
                    <TableCell sx={{ ...TD, fontWeight: 700 }}>Rs {total.toLocaleString()}</TableCell>
                    <TableCell sx={{ ...TD, color: C.success }}>Rs {paid.toLocaleString()}</TableCell>
                    <TableCell sx={{ ...TD, color: balance > 0 ? C.warning : C.success, fontWeight: 700 }}>Rs {balance.toLocaleString()}</TableCell>
                    <TableCell sx={TD}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell sx={TD}><StatusBadge status={inv.status} /></TableCell>
                    <TableCell sx={TD}>
                      <Tooltip title={t('finance.sendReminder') || 'Send Reminder'}>
                        <IconButton size="small" sx={{ color: C.warning, '&:hover': { background: C.warningBg } }} onClick={() => handleSendReminder(id)}>
                          <NotifyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('finance.recordPayment') || 'Record Payment'}>
                        <IconButton size="small" sx={{ color: C.success, '&:hover': { background: C.successBg } }} onClick={() => { setPaymentForm(p => ({ ...p, invoiceId: String(id) })); setPaymentDialog(true); }}>
                          <PaymentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box mt={2}>
          <Button variant="outlined" size="small" endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />} onClick={() => nav('/finance/invoices')} sx={BTN_OUTLINE}>
            {t('finance.openFullInvoicesPage') || 'Open full Invoices page'}
          </Button>
        </Box>
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 3 — Payments                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="h6" fontWeight={700}>{t('finance.payments') || 'Payments'}</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>{payments.length} {t('finance.paymentsLoaded') || 'payments loaded'}</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setPaymentDialog(true)} sx={BTN_PRIMARY}>
            {t('finance.recordPayment') || 'Record Payment'}
          </Button>
        </Box>
        <TableContainer sx={GLASS}>
          <Table size="small">
            <THead cols={[t('finance.receiptNumber') || 'Receipt #', t('finance.student') || 'Student', t('finance.amount') || 'Amount', t('finance.method') || 'Method', t('finance.date') || 'Date', t('finance.transactionId') || 'Txn ID', t('finance.status') || 'Status', t('finance.actions') || 'Actions']} />
            <TableBody>
              {payments.length === 0 ? <EmptyRow cols={8} /> : payments.map((p, i) => {
                const id = p.paymentId ?? (p as any).id;
                return (
                  <TableRow key={id ?? i} hover sx={TR_HOVER}>
                    <TableCell sx={{ ...TD, fontFamily: 'monospace', fontSize: '0.78rem', color: C.primary }}>{p.receiptNumber || '—'}</TableCell>
                    <TableCell sx={{ ...TD, fontWeight: 500 }}>{p.studentName || `Student #${p.studentId}`}</TableCell>
                    <TableCell sx={{ ...TD, color: C.success, fontWeight: 700 }}>Rs {Number(p.amount).toLocaleString()}</TableCell>
                    <TableCell sx={{ ...TD, textTransform: 'capitalize' }}>{String(p.paymentMethod || '—').replace(/_/g, ' ')}</TableCell>
                    <TableCell sx={TD}>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell sx={{ ...TD, fontFamily: 'monospace', fontSize: '0.72rem', color: theme.palette.text.disabled }}>{p.transactionId || '—'}</TableCell>
                    <TableCell sx={TD}><StatusBadge status={p.status} /></TableCell>
                    <TableCell sx={TD}>
                      {p.status === 'completed' && (
                        <Tooltip title={t('finance.processRefund') || 'Process Refund'}>
                          <IconButton size="small" sx={{ color: C.purple, '&:hover': { background: C.purpleBg } }} onClick={() => handleRefund(id)}>
                            <RefundIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Box mt={2}>
          <Button variant="outlined" size="small" endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />} onClick={() => nav('/finance/payments')} sx={BTN_OUTLINE}>
            {t('finance.openFullPaymentsPage') || 'Open full Payments page'}
          </Button>
        </Box>
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 4 — Refunds                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={700} mb={2.5}>{t('finance.refundManagement') || 'Refund Management'}</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={GLASS_ELEVATED}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 1.5, background: C.purpleBg, border: `1px solid ${C.purpleBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.purple }}>
                    <RefundIcon fontSize="small" />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>{t('finance.processRefund') || 'Process a Refund'}</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2.5, lineHeight: 1.7 }}>
                  {t('finance.refundDescription') || 'To refund a payment, go to the Payments tab, find the completed payment, and click the refund action icon. You can also use the full Refund Management page.'}
                </Typography>
                <Button fullWidth variant="outlined" startIcon={<PaymentIcon />} onClick={() => setTab(3)} sx={{ ...BTN_OUTLINE, mb: 1.5 }}>
                  {t('finance.goToPaymentsTab') || 'Go to Payments tab'}
                </Button>
                <Button fullWidth variant="contained" startIcon={<RefundIcon />} onClick={() => nav('/finance/refunds')} sx={BTN_PRIMARY}>
                  {t('finance.openRefundManagement') || 'Open Refund Management'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={GLASS}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>{t('finance.refundedPayments') || 'Refunded Payments'}</Typography>
                <TableContainer>
                  <Table size="small">
                    <THead cols={[t('finance.receiptNumber') || 'Receipt #', t('finance.student') || 'Student', t('finance.amount') || 'Amount', t('finance.date') || 'Date']} />
                    <TableBody>
                      {payments.filter(p => p.status === 'refunded').length === 0
                        ? <EmptyRow cols={4} msg={t('finance.noRefundedPayments') || 'No refunded payments'} />
                        : payments.filter(p => p.status === 'refunded').map((p, i) => (
                          <TableRow key={p.paymentId ?? i} hover sx={TR_HOVER}>
                            <TableCell sx={{ ...TD, fontFamily: 'monospace', fontSize: '0.78rem', color: C.primary }}>{p.receiptNumber || '—'}</TableCell>
                            <TableCell sx={{ ...TD, fontWeight: 500 }}>{p.studentName || `Student #${p.studentId}`}</TableCell>
                            <TableCell sx={{ ...TD, color: C.purple, fontWeight: 700 }}>Rs {Number(p.amount).toLocaleString()}</TableCell>
                            <TableCell sx={TD}>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 5 — Reports                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={5}>
        <Typography variant="h6" fontWeight={700} mb={3}>{t('finance.financialReports') || 'Financial Reports'}</Typography>
        <Grid container spacing={3}>
          {/* Collection */}
          <Grid item xs={12} md={4}>
            <Card sx={{ ...GLASS, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: C.success, borderRadius: '2px 0 0 2px' }, position: 'relative', overflow: 'hidden', pl: 0.5 }}>
              <CardContent sx={{ pl: 3 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 1.5, background: C.successBg, border: `1px solid ${C.successBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.success }}>
                    <MoneyIcon fontSize="small" />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>{t('finance.collection') || 'Collection'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>{t('finance.totalCollectedLabel') || 'Total Collected'}</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: C.success }}>
                    Rs {Number(reportData.collectionReport?.totalAmount ?? stats.totalCollection).toLocaleString()}
                  </Typography>
                </Box>
                {reportData.collectionReport?.byMethod && Object.entries(reportData.collectionReport.byMethod).map(([m, d]: [string, any]) => (
                  <Box key={m} display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" sx={{ color: theme.palette.text.disabled, textTransform: 'capitalize' }}>{m.replace(/_/g, ' ')}</Typography>
                    <Typography variant="caption" fontWeight={600}>Rs {Number(d?.total ?? 0).toLocaleString()}</Typography>
                  </Box>
                ))}
                <Button size="small" variant="outlined" fullWidth sx={{ mt: 2, ...BTN_OUTLINE }} onClick={() => nav('/finance/reports')}>{t('finance.fullReport') || 'Full Report'} →</Button>
              </CardContent>
            </Card>
          </Grid>
          {/* Pending */}
          <Grid item xs={12} md={4}>
            <Card sx={{ ...GLASS, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: C.warning, borderRadius: '2px 0 0 2px' }, position: 'relative', overflow: 'hidden', pl: 0.5 }}>
              <CardContent sx={{ pl: 3 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 1.5, background: C.warningBg, border: `1px solid ${C.warningBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.warning }}>
                    <PendingIcon fontSize="small" />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>{t('finance.pendingFees') || 'Pending Fees'}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>{t('finance.totalOutstanding') || 'Total Outstanding'}</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: C.warning }}>
                    Rs {Number(reportData.pendingReport?.totalPending ?? stats.pendingFees).toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>{t('finance.studentsPending') || 'Students Pending'}</Typography>
                  <Typography variant="body2" fontWeight={700}>{reportData.pendingReport?.count ?? '—'}</Typography>
                </Box>
                <Button size="small" variant="outlined" fullWidth sx={{ ...S.BTN_OUTLINE,  mt: 2, color: C.warning, borderColor: C.warningBdr, textTransform: 'none', fontWeight: 600, borderRadius: 1.5, '&:hover': { background: C.warningBg, borderColor: C.warning } }} onClick={() => nav('/finance/reports')}>{t('finance.viewDetails') || 'View Details'} →</Button>
              </CardContent>
            </Card>
          </Grid>
          {/* Defaulters */}
          <Grid item xs={12} md={4}>
            <Card sx={{ ...GLASS, '&::before': { content: '""', position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: C.danger, borderRadius: '2px 0 0 2px' }, position: 'relative', overflow: 'hidden', pl: 0.5 }}>
              <CardContent sx={{ pl: 3 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 1.5, background: C.dangerBg, border: `1px solid ${C.dangerBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.danger }}>
                    <WarningIcon fontSize="small" />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>{t('finance.defaulters') || 'Defaulters'}</Typography>
                </Box>
                <Typography variant="h2" fontWeight={800} sx={{ color: C.danger, lineHeight: 1, mb: 0.5 }}>{reportData.defaulters?.length ?? 0}</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>{t('finance.studentsWithOverdue') || 'Students with overdue invoices'}</Typography>
                <Button size="small" variant="outlined" fullWidth sx={{ ...S.BTN_OUTLINE,  mt: 2, color: C.danger, borderColor: C.dangerBdr, textTransform: 'none', fontWeight: 600, borderRadius: 1.5, '&:hover': { background: C.dangerBg, borderColor: C.danger } }} onClick={() => nav('/finance/reports')}>{t('finance.viewDefaulters') || 'View Defaulters'} →</Button>
              </CardContent>
            </Card>
          </Grid>
          {/* Defaulters table */}
          {(reportData.defaulters?.length ?? 0) > 0 && (
            <Grid item xs={12}>
              <Card sx={GLASS}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>{t('finance.defaultersList') || 'Defaulters List'}</Typography>
                  <TableContainer>
                    <Table size="small">
                      <THead cols={[t('finance.student') || 'Student', t('finance.amountDue') || 'Amount Due', t('finance.daysOverdue') || 'Days Overdue']} />
                      <TableBody>
                        {reportData.defaulters!.slice(0, 15).map(d => (
                          <TableRow key={d.studentId} hover sx={TR_HOVER}>
                            <TableCell sx={{ ...TD, fontWeight: 500 }}>{d.studentName}</TableCell>
                            <TableCell sx={{ ...TD, color: C.danger, fontWeight: 700 }}>Rs {Number(d.totalDue).toLocaleString()}</TableCell>
                            <TableCell>
                              <Chip label={`${d.daysOverdue}d`} size="small" sx={{
                                background: d.daysOverdue > 30 ? C.dangerBg : C.warningBg,
                                color: d.daysOverdue > 30 ? C.danger : C.warning,
                                border: `1px solid ${d.daysOverdue > 30 ? C.dangerBdr : C.warningBdr}`,
                                fontWeight: 700, fontSize: '0.7rem', height: 20,
                              }} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 6 — Payment Gateways (view-only)                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={6}>
        <Box mb={3}>
          <Typography variant="h6" fontWeight={700}>{t('finance.paymentGateways') || 'Payment Gateways'}</Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.disabled, mt: 0.5 }}>
            {t('finance.gatewayViewOnly') || 'View-only — gateway configuration is managed by the School Admin.'}
          </Typography>
        </Box>
        <Grid container spacing={2} mb={4}>
          {Object.entries(gateways).length === 0 ? (
            <Grid item xs={12}>
              <Card sx={GLASS}>
                <CardContent sx={{ textAlign: 'center', py: 5 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 1.5, background: C.neutralBg, border: `1px solid ${C.neutralBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.neutral, mx: 'auto', mb: 2 }}>
                    <GatewayIcon />
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
                    {t('finance.noGatewayConfig') || 'No gateway configurations available. Contact Admin.'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : Object.entries(gateways).map(([key, cfg]: [string, any]) => (
            <Grid item xs={12} sm={4} key={key}>
              <Card sx={{
                ...GLASS,
                border: `1px solid ${cfg.enabled ? C.successBdr : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
                '&::before': { content: '""', position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: cfg.enabled ? C.success : C.neutral, borderRadius: '2px 0 0 2px' },
                position: 'relative', overflow: 'hidden', pl: 0.5,
              }}>
                <CardContent sx={{ pl: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box sx={{ width: 32, height: 32, borderRadius: 1.5, background: cfg.enabled ? C.successBg : C.neutralBg, border: `1px solid ${cfg.enabled ? C.successBdr : C.neutralBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.enabled ? C.success : C.neutral }}>
                        <GatewayIcon fontSize="small" />
                      </Box>
                      <Typography fontWeight={700} sx={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>{cfg.name || key}</Typography>
                    </Box>
                    <StatusBadge status={cfg.enabled ? 'active' : 'inactive'} />
                  </Box>
                  <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>Mode: {cfg.testMode ? 'Test / Sandbox' : 'Live'}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>{t('finance.gatewayTransactions') || 'Gateway Transactions'}</Typography>
        <TableContainer sx={GLASS}>
          <Table size="small">
            <THead cols={[t('finance.transactionId') || 'Transaction ID', t('finance.gateway') || 'Gateway', t('finance.amount') || 'Amount', t('finance.student') || 'Student', t('finance.date') || 'Date', t('finance.status') || 'Status']} />
            <TableBody>
              {gatewayTxns.length === 0 ? <EmptyRow cols={6} msg={t('finance.noGatewayTransactions') || 'No gateway transactions found'} /> : gatewayTxns.map((tx: any, i) => (
                <TableRow key={tx.id ?? i} hover sx={TR_HOVER}>
                  <TableCell sx={{ ...TD, fontFamily: 'monospace', fontSize: '0.75rem', color: C.primary }}>{tx.transactionId || '—'}</TableCell>
                  <TableCell sx={{ ...TD, textTransform: 'capitalize', fontWeight: 500 }}>{tx.gateway}</TableCell>
                  <TableCell sx={{ ...TD, color: C.success, fontWeight: 700 }}>Rs {Number(tx.amount).toLocaleString()}</TableCell>
                  <TableCell sx={TD}>{tx.studentName || `#${tx.studentId || '—'}`}</TableCell>
                  <TableCell sx={TD}>{tx.date ? new Date(tx.date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell sx={TD}><StatusBadge status={tx.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 7 — Student Fees                                                */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={7}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h6" fontWeight={700}>{t('finance.studentFeeStatus') || 'Student Fee Status'}</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>{filteredStudents.length} {t('finance.studentsShown') || 'students shown'}</Typography>
          </Box>
          <TextField size="small" placeholder={t('finance.searchByNameOrId') || 'Search by name or ID…'} value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: C.primary, fontSize: 18 }} /></InputAdornment>,
            }}
            sx={{ ...TF, width: 240 }} />
        </Box>
        <TableContainer sx={GLASS}>
          <Table size="small">
            <THead cols={[t('finance.student') || 'Student', t('finance.class') || 'Class', t('finance.invoiced') || 'Invoiced', t('finance.paid') || 'Paid', t('finance.balance') || 'Balance', t('finance.overdue') || 'Overdue', t('finance.status') || 'Status', t('finance.action') || 'Action']} />
            <TableBody>
              {filteredStudents.length === 0
                ? <EmptyRow cols={8} msg={studentFees.length === 0 ? (t('finance.noFeeDataLoaded') || 'No fee data loaded') : (t('finance.noResultsMatchSearch') || 'No results match your search')} />
                : filteredStudents.map(s => (
                  <TableRow key={s.studentId} hover sx={TR_HOVER}>
                    <TableCell sx={{ ...TD, fontWeight: 600 }}>{s.studentName}</TableCell>
                    <TableCell sx={{ ...TD, color: theme.palette.text.disabled }}>{s.className || '—'}</TableCell>
                    <TableCell sx={TD}>Rs {Number(s.totalInvoiced).toLocaleString()}</TableCell>
                    <TableCell sx={{ ...TD, color: C.success, fontWeight: 600 }}>Rs {Number(s.totalPaid).toLocaleString()}</TableCell>
                    <TableCell sx={{ ...TD, color: Number(s.balance) > 0 ? C.warning : C.success, fontWeight: 700 }}>Rs {Number(s.balance).toLocaleString()}</TableCell>
                    <TableCell sx={TD}>
                      {Number(s.overdueAmount) > 0
                        ? <Typography variant="body2" sx={{ color: C.danger, fontWeight: 700 }}>Rs {Number(s.overdueAmount).toLocaleString()}</Typography>
                        : <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>—</Typography>
                      }
                    </TableCell>
                    <TableCell sx={TD}><StatusBadge status={s.status} /></TableCell>
                    <TableCell sx={TD}>
                      <Button size="small" variant="outlined" onClick={() => nav('/finance/payments')}
                        sx={{ ...BTN_OUTLINE, fontSize: '0.72rem', py: 0.3, px: 1 }}>
                        Payments
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>
        <Box mt={2}>
          <Button variant="outlined" size="small" endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />} onClick={() => nav('/finance/students')} sx={BTN_OUTLINE}>
            {t('finance.openFullStudentFeeSearchPage') || 'Open full Student Fee Search page'}
          </Button>
        </Box>
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Tab 8 — Profile                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <TabPanel value={tab} index={8}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card sx={GLASS_ELEVATED}>
              <CardContent>
                {/* Profile header */}
                <Box sx={{
                  p: 2.5, mb: 2, borderRadius: 2,
                  background: `linear-gradient(135deg, ${C.primaryBg}, ${C.purpleBg})`,
                  border: `1px solid ${C.primaryBdr}`,
                  display: 'flex', alignItems: 'center', gap: 2,
                }}>
                  <Avatar sx={{
                    background: `linear-gradient(135deg, ${C.primary}, ${C.purple})`,
                    width: 60, height: 60, fontSize: 24, fontWeight: 800,
                    boxShadow: `0 4px 14px rgba(0,122,255,0.4)`,
                    border: '2px solid rgba(255,255,255,0.3)',
                  }}>
                    {(profile?.firstName?.[0] ?? user?.firstName?.[0] ?? 'A').toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                      {profile?.firstName ?? user?.firstName} {profile?.lastName ?? user?.lastName}
                    </Typography>
                    <Chip label={t('roles.accountant') || 'Accountant'} size="small" sx={{
                      mt: 0.5, height: 20, fontSize: '0.7rem', fontWeight: 700,
                      background: C.successBg, color: C.success, border: `1px solid ${C.successBdr}`,
                    }} />
                  </Box>
                </Box>
                <Divider sx={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', mb: 2 }} />
                {[
                  { label: t('finance.username') || 'Username', value: profile?.username ?? user?.username },
                  { label: t('common.email') || 'Email',        value: profile?.email ?? (user as any)?.email ?? '—' },
                  { label: t('common.phone') || 'Phone',        value: profile?.phoneNumber || '—' },
                  { label: t('finance.status') || 'Status',     value: profile?.status ?? 'Active' },
                ].map(f => (
                  <Box key={f.label} display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontWeight: 500 }}>{f.label}</Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>{f.value}</Typography>
                  </Box>
                ))}
                <Button fullWidth variant="outlined" startIcon={<MessageIcon />} onClick={() => nav('/communication/messages')}
                  sx={{ mt: 2, ...BTN_OUTLINE }}>{t('finance.contactAdmin') || 'Contact Admin'}</Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card sx={GLASS}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.72rem', mb: 2 }}>
                  {t('finance.financeNavigationTitle') || 'Finance Navigation'}
                </Typography>
                <List dense disablePadding>
                  {[
                    { label: t('finance.financeDashboard') || 'Finance Dashboard',   path: '/finance',                    icon: <AccountIcon />,  accent: C.primary  },
                    { label: t('finance.feeStructures') || 'Fee Structures',         path: '/finance/fee-structures',     icon: <StructureIcon />, accent: C.purple   },
                    { label: t('finance.invoices') || 'Invoices',                   path: '/finance/invoices',           icon: <InvoiceIcon />,  accent: C.primary  },
                    { label: t('finance.payments') || 'Payments',                   path: '/finance/payments',           icon: <PaymentIcon />,  accent: C.success  },
                    { label: t('finance.refundManagement') || 'Refund Management',  path: '/finance/refunds',            icon: <RefundIcon />,   accent: C.purple   },
                    { label: t('finance.paymentGateways') || 'Payment Gateways',    path: '/finance/payment-gateways',   icon: <GatewayIcon />,  accent: C.neutral  },
                    { label: t('finance.financialReports') || 'Financial Reports',  path: '/finance/reports',            icon: <ReportIcon />,   accent: C.warning  },
                    { label: t('finance.studentFeeSearch') || 'Student Fee Search', path: '/finance/students',           icon: <PeopleIcon />,   accent: C.primary  },
                    { label: t('menu.calendar') || 'Calendar',                      path: '/calendar',                   icon: <CalendarIcon />, accent: C.neutral  },
                    { label: t('menu.messages') || 'Messages',                      path: '/communication/messages',     icon: <MessageIcon />,  accent: C.neutral  },
                  ].map(l => (
                    <ListItem key={l.path} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton onClick={() => nav(l.path)} sx={{
                        borderRadius: 1.5, py: 1, px: 1.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: `rgba(${l.accent === C.primary ? '0,122,255' : l.accent === C.success ? '52,199,89' : l.accent === C.warning ? '255,149,0' : l.accent === C.purple ? '88,86,214' : '142,142,147'}, 0.08)`,
                          '& .nav-icon': { color: l.accent },
                        },
                      }}>
                        <ListItemIcon sx={{ minWidth: 36, color: theme.palette.text.disabled, transition: 'color 0.2s' }} className="nav-icon">
                          {l.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={l.label}
                          primaryTypographyProps={{ fontSize: '0.875rem', color: theme.palette.text.primary, fontWeight: 500 }}
                        />
                        <ArrowForwardIcon sx={{ fontSize: 14, color: theme.palette.text.disabled, opacity: 0.5 }} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* Dialogs                                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {/* Generate Invoice */}
      <Dialog open={invoiceDialog} onClose={() => setInvoiceDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { ...GLASS_ELEVATED, borderRadius: 2 } }}>
        <DialogTitle sx={{ color: theme.palette.text.primary, fontWeight: 700, pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, background: C.primaryBg, border: `1px solid ${C.primaryBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary }}>
              <InvoiceIcon fontSize="small" />
            </Box>
            {t('finance.generateInvoice') || 'Generate Invoice'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label={`${t('finance.studentId')} *`} type="number" fullWidth value={invoiceForm.studentId} sx={TF}
              onChange={e => setInvoiceForm(p => ({ ...p, studentId: e.target.value }))} />
            <TextField label={`${t('finance.feeStructureId')} (${t('finance.optional')})`} type="number" fullWidth value={invoiceForm.feeStructureId} sx={TF}
              onChange={e => setInvoiceForm(p => ({ ...p, feeStructureId: e.target.value }))} />
            <TextField label={`${t('finance.dueDate')} *`} type="date" fullWidth InputLabelProps={{ shrink: true }} value={invoiceForm.dueDate} sx={TF}
              onChange={e => setInvoiceForm(p => ({ ...p, dueDate: e.target.value }))} />
            <TextField label={`${t('finance.description')} (${t('finance.optional')})`} fullWidth multiline rows={2} value={invoiceForm.description} sx={TF}
              onChange={e => setInvoiceForm(p => ({ ...p, description: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setInvoiceDialog(false)} sx={BTN_GHOST}>{t('common.cancel') || 'Cancel'}</Button>
          <Button variant="contained" onClick={handleCreateInvoice} disabled={!invoiceForm.studentId || !invoiceForm.dueDate} sx={BTN_PRIMARY}>
            {t('finance.generate') || 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { ...GLASS_ELEVATED, borderRadius: 2 } }}>
        <DialogTitle sx={{ color: theme.palette.text.primary, fontWeight: 700, pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, background: C.successBg, border: `1px solid ${C.successBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.success }}>
              <PaymentIcon fontSize="small" />
            </Box>
            {t('finance.recordPayment') || 'Record Payment'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label={`${t('finance.invoiceId')} *`} type="number" fullWidth value={paymentForm.invoiceId} sx={TF}
              onChange={e => setPaymentForm(p => ({ ...p, invoiceId: e.target.value }))} />
            <TextField label={`${t('finance.amountRs')} *`} type="number" fullWidth value={paymentForm.amount} sx={TF}
              onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} />
            <FormControl fullWidth>
              <InputLabel sx={{ color: theme.palette.text.secondary, '&.Mui-focused': { color: C.primary } }}>{t('finance.paymentMethod')}</InputLabel>
              <Select value={paymentForm.method} label={t('finance.paymentMethod')} onChange={e => setPaymentForm(p => ({ ...p, method: e.target.value }))} sx={TF}>
                {['cash', 'bank_transfer', 'esewa', 'khalti', 'ime_pay'].map(m => (
                  <MenuItem key={m} value={m} sx={{ textTransform: 'capitalize' }}>{m === 'cash' ? t('finance.cash') : m === 'bank_transfer' ? t('finance.bankTransfer') : m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label={`${t('finance.transactionIdOptional')} (${t('finance.optional')})`} fullWidth value={paymentForm.transactionId} sx={TF}
              onChange={e => setPaymentForm(p => ({ ...p, transactionId: e.target.value }))} />
            <TextField label={`${t('finance.remarks')} (${t('finance.optional')})`} fullWidth multiline rows={2} value={paymentForm.remarks} sx={TF}
              onChange={e => setPaymentForm(p => ({ ...p, remarks: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setPaymentDialog(false)} sx={BTN_GHOST}>{t('common.cancel') || 'Cancel'}</Button>
          <Button variant="contained" onClick={handleRecordPayment} disabled={!paymentForm.invoiceId || !paymentForm.amount} sx={BTN_PRIMARY}>
            {t('finance.recordPayment') || 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create / Edit Fee Structure */}
      <Dialog open={feeDialog} onClose={() => { setFeeDialog(false); setEditFee(null); }} maxWidth="sm" fullWidth
        PaperProps={{ sx: { ...GLASS_ELEVATED, borderRadius: 2 } }}>
        <DialogTitle sx={{ color: theme.palette.text.primary, fontWeight: 700, pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1.5, background: C.purpleBg, border: `1px solid ${C.purpleBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.purple }}>
              <StructureIcon fontSize="small" />
            </Box>
            {editFee ? (t('finance.editFeeStructure') || 'Edit Fee Structure') : (t('finance.createFeeStructure') || 'Create Fee Structure')}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label={`${t('finance.name')} *`} fullWidth value={feeForm.name} sx={TF}
              onChange={e => setFeeForm(p => ({ ...p, name: e.target.value }))} />
            <TextField label={`${t('finance.description')} (${t('finance.optional')})`} fullWidth multiline rows={2} value={feeForm.description} sx={TF}
              onChange={e => setFeeForm(p => ({ ...p, description: e.target.value }))} />
            {!editFee && (
              <>
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                  {t('finance.feeComponents') || 'Fee Components'}
                </Typography>
                {feeForm.components.map((comp, i) => (
                  <Box key={i} sx={{ ...GLASS, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, borderRadius: 1.5 }}>
                    <TextField label={t('finance.componentName') || 'Component Name'} size="small" fullWidth value={comp.name} sx={TF}
                      onChange={e => { const comps = [...feeForm.components]; comps[i] = { ...comps[i], name: e.target.value }; setFeeForm(p => ({ ...p, components: comps })); }} />
                    <Box display="flex" gap={1}>
                      <TextField label={t('finance.amountRs') || 'Amount (Rs)'} size="small" type="number" sx={{ flex: 1, ...TF }} value={comp.amount}
                        onChange={e => { const comps = [...feeForm.components]; comps[i] = { ...comps[i], amount: e.target.value }; setFeeForm(p => ({ ...p, components: comps })); }} />
                      <FormControl size="small" sx={{ flex: 1 }}>
                        <InputLabel sx={{ color: theme.palette.text.secondary, '&.Mui-focused': { color: C.primary } }}>{t('finance.type') || 'Type'}</InputLabel>
                        <Select value={comp.type} label={t('finance.type') || 'Type'}
                          sx={{ color: theme.palette.text.primary, borderRadius: 1.5, '& fieldset': { borderColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }, '&:hover fieldset': { borderColor: C.primary }, '&.Mui-focused fieldset': { borderColor: C.primary }, '& .MuiSvgIcon-root': { color: theme.palette.text.disabled } }}
                          onChange={e => { const comps = [...feeForm.components]; comps[i] = { ...comps[i], type: e.target.value }; setFeeForm(p => ({ ...p, components: comps })); }}>
                          {['admission', 'annual', 'monthly', 'exam', 'transport', 'hostel', 'library', 'lab', 'eca', 'development'].map(tv => (
                            <MenuItem key={tv} value={tv} sx={{ textTransform: 'capitalize' }}>{tv}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                ))}
                <Button size="small" startIcon={<AddIcon />}
                  onClick={() => setFeeForm(p => ({ ...p, components: [...p.components, { name: '', type: 'monthly', amount: '', frequency: 'monthly', isMandatory: true }] }))}
                  sx={{ ...BTN_OUTLINE, alignSelf: 'flex-start' }}>
                  {t('finance.addComponent') || 'Add Component'}
                </Button>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setFeeDialog(false); setEditFee(null); }} sx={BTN_GHOST}>{t('common.cancel') || 'Cancel'}</Button>
          <Button variant="contained" onClick={handleSaveFeeStructure} disabled={!feeForm.name} sx={BTN_PRIMARY}>
            {editFee ? (t('common.update') || 'Update') : (t('common.create') || 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AccountantPortal;

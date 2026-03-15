import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Avatar, Button, IconButton, Tooltip, useTheme,
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  TrendingUp as TrendingIcon,
  Receipt as InvoiceIcon,
  Payment as PaymentIcon,
  PendingActions as PendingIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Assessment as ReportIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';
import { getAccountantStyles } from '../../styles/accountantTheme';
import { C, useAdminStyles } from '../../theme/designTokens';

interface FinanceStats {
  totalCollection: number;
  pendingFees: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  collectionRate: number;
}

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  paid: { fg: C.neutral, bg: C.neutralBg },
  completed: { fg: C.neutral, bg: C.neutralBg },
  partial: { fg: C.neutral, bg: 'rgba(107,114,128,0.08)' },
  pending: { fg: C.neutral, bg: 'rgba(156,163,175,0.08)' },
  overdue: { fg: C.danger, bg: C.dangerBg },
  failed: { fg: C.danger, bg: C.dangerBg },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status?.toLowerCase()] ?? { fg: C.neutral, bg: 'rgba(156,163,175,0.08)' };
  return (
    <Chip
      label={status || '—'}
      size="small"
      sx={{
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.fg}20`,
        fontWeight: 500,
        fontSize: '0.7rem',
        height: 22,
        borderRadius: 1,
        px: 1.5,
      }}
    />
  );
}

const AccountantDashboard: React.FC = () => {
  const theme = useTheme();
  const styles = getAccountantStyles(theme);
  const S = useAdminStyles(theme);
  
  const [stats, setStats] = useState<FinanceStats>({
    totalCollection: 0,
    pendingFees: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    collectionRate: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();

  const nav = (path: string) => navigate(path);

  const loadData = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);

    try {
      const [statsRes, txnRes, invoicesRes] = await Promise.all([
        apiClient.get('/finance/statistics', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => ({ data: { data: null } })),
        apiClient.get('/finance/recent-transactions?limit=10', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => ({ data: { data: [] } })),
        apiClient.get('/finance/invoices?status=overdue&limit=5', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => ({ data: { data: [] } })),
      ]);

      const s = statsRes.data?.data;
      if (s) {
        setStats({
          totalCollection: Number(s.totalCollection ?? 0),
          pendingFees: Number(s.pendingFees ?? 0),
          totalInvoices: Number(s.totalInvoices ?? 0),
          paidInvoices: Number(s.paidInvoices ?? 0),
          overdueInvoices: Number(s.overdueInvoices ?? 0),
          collectionRate: Number(s.collectionRate ?? 0),
        });
      }

      setRecentTransactions(Array.isArray(txnRes.data?.data) ? txnRes.data.data : []);
      
      const inv = invoicesRes.data?.data;
      setOverdueInvoices(Array.isArray(inv) ? inv : (inv?.invoices ?? []));
    } catch (err: any) {
      console.error('Failed to load accountant dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={styles.pageContainer(theme)}>
      {/* Content wrapper with z-index */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ 
              ...styles.avatarGradient(C.neutral, C.purple),
              width: 56, 
              height: 56 
            }}>
              <AccountIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                Finance Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome, {user?.firstName || user?.username} · Accountant
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Refresh data">
            <IconButton onClick={loadData} sx={styles.iconButton}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, ...styles.glassCard }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={styles.statCard(C.neutral)}>
              <CardContent sx={{ p: 2.5, pb: '20px !important' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MoneyIcon sx={{ color: C.neutral, fontSize: 28 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Total Collected
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: C.neutral, letterSpacing: '-0.02em' }}>
                  Rs {stats.totalCollection.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={styles.statCard(C.neutral)}>
              <CardContent sx={{ p: 2.5, pb: '20px !important' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PendingIcon sx={{ color: C.neutral, fontSize: 28 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Outstanding Fees
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: C.neutral, letterSpacing: '-0.02em' }}>
                  Rs {stats.pendingFees.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={styles.statCard(C.neutral)}>
              <CardContent sx={{ p: 2.5, pb: '20px !important' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <InvoiceIcon sx={{ color: C.neutral, fontSize: 28 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Total Invoices
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                  {stats.totalInvoices}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stats.paidInvoices} paid · {stats.overdueInvoices} overdue
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={styles.statCard(C.neutral)}>
              <CardContent sx={{ p: 2.5, pb: '20px !important' }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingIcon sx={{ color: C.neutral, fontSize: 28 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Collection Rate
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: C.neutral, letterSpacing: '-0.02em' }}>
                  {stats.collectionRate.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              sx={{ ...S.BTN_PRIMARY, py: 2 }}
              startIcon={<PaymentIcon />}
              onClick={() => nav('/finance/payments')}
            >
              Record Payment
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<InvoiceIcon />}
              onClick={() => nav('/finance/invoices')}
              sx={{ ...styles.secondaryButton, py: 2 }}
            >
              Manage Invoices
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ReportIcon />}
              onClick={() => nav('/finance/reports')}
              sx={{ ...styles.secondaryButton, py: 2 }}
            >
              View Reports
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => nav('/admissions')}
              sx={{ ...styles.secondaryButton, py: 2 }}
            >
              Admissions
            </Button>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Transactions */}
          <Grid item xs={12} lg={7}>
            <Card sx={styles.glassCard}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Recent Transactions
                </Typography>
                <TableContainer sx={styles.table.container}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={styles.table.header}>Receipt #</TableCell>
                        <TableCell sx={styles.table.header}>Student</TableCell>
                        <TableCell sx={styles.table.header} align="right">Amount</TableCell>
                        <TableCell sx={styles.table.header}>Method</TableCell>
                        <TableCell sx={styles.table.header}>Date</TableCell>
                        <TableCell sx={styles.table.header}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary', borderBottom: 'none' }}>
                            No transactions yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentTransactions.map((txn: any, idx) => (
                          <TableRow key={txn.paymentId || idx} sx={styles.table.row}>
                            <TableCell sx={{ ...styles.table.cell, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                              {txn.receiptNumber || '—'}
                            </TableCell>
                            <TableCell sx={styles.table.cell}>{txn.studentName || `Student #${txn.studentId}`}</TableCell>
                            <TableCell align="right" sx={{ ...styles.table.cell, fontWeight: 700, color: C.neutral }}>
                              Rs {Number(txn.amount).toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ ...styles.table.cell, textTransform: 'capitalize' }}>
                              {String(txn.paymentMethod || txn.method || '—').replace(/_/g, ' ')}
                            </TableCell>
                            <TableCell sx={styles.table.cell}>
                              {txn.paymentDate
                                ? new Date(txn.paymentDate).toLocaleDateString()
                                : '—'}
                            </TableCell>
                            <TableCell sx={styles.table.cell}>
                              <StatusBadge status={txn.status} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {recentTransactions.length > 0 && (
                  <Box mt={2} textAlign="center">
                    <Button size="small" onClick={() => nav('/finance/payments')} sx={styles.secondaryButton}>
                      View All Payments
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Overdue Invoices */}
          <Grid item xs={12} lg={5}>
            <Card sx={styles.glassCard}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <WarningIcon sx={{ color: C.danger }} />
                  <Typography variant="h6" fontWeight={700}>
                    Overdue Invoices
                  </Typography>
                </Box>
                {overdueInvoices.length === 0 ? (
                  <Box py={4} textAlign="center">
                    <Typography color="text.secondary">No overdue invoices</Typography>
                  </Box>
                ) : (
                  <Box>
                    {overdueInvoices.map((inv: any) => (
                      <Box
                        key={inv.invoiceId}
                        sx={{
                          p: 2,
                          mb: 1,
                          ...styles.glassCard,
                          '&:hover': { 
                            transform: 'translateX(4px)',
                            boxShadow: theme.palette.mode === 'dark'
                              ? '0 4px 12px rgba(0,0,0,0.3)'
                              : '0 4px 12px rgba(0,0,0,0.08)',
                          },
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={0.5}>
                          <Typography variant="body2" fontWeight={600}>
                            {inv.studentName || `Student #${inv.studentId}`}
                          </Typography>
                          <StatusBadge status={inv.status} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Invoice #{inv.invoiceNumber || inv.invoiceId}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: C.danger }}>
                            Rs {Number(inv.balance || inv.totalAmount).toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Due: {new Date(inv.dueDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                    <Box mt={2} textAlign="center">
                      <Button 
                        size="small" 
                        onClick={() => nav('/finance/invoices?status=overdue')}
                        sx={{ ...styles.secondaryButton, color: C.danger, borderColor: '#8b5a5a25' }}
                      >
                        View All Overdue
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AccountantDashboard;

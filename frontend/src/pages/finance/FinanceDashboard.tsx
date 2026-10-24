/**
 * Finance Dashboard
 * Overview of financial statistics and quick actions
 */

import { useState, useEffect, useCallback } from 'react';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  AccountBalance as BalanceIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';
interface FinanceStats {
  totalRevenue: number;
  pendingAmount: number;
  collectedToday: number;
  overdueInvoices: number;
  totalInvoices: number;
  paidInvoices: number;
  partialInvoices: number;
}

interface RecentTransaction {
  id: number | string;
  type: 'payment' | 'invoice' | 'refund';
  studentName: string;
  amount: number;
  date: string;
  status: string;
}

export function FinanceDashboard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const navigate = useSlugNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    pendingAmount: 0,
    collectedToday: 0,
    overdueInvoices: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    partialInvoices: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      let requestFailed = false;
      const fallback = <T,>(value: T) => () => { requestFailed = true; return { data: { data: value } }; };
      const [summaryRes, statsRes, todayRes, transactionsRes] = await Promise.all([
        apiClient.get('/finance/summary').catch(fallback(null)),
        apiClient.get('/finance/statistics').catch(fallback(null)),
        apiClient.get(`/finance/reports/collection?startDate=${todayString}&endDate=${todayString}`).catch(fallback(null)),
        apiClient.get('/finance/recent-transactions?limit=5').catch(fallback([])),
      ]);

      const summary = summaryRes.data?.data;
      const apiStats = statsRes.data?.data;
      setStats({
        totalRevenue: Number(summary?.totalRevenue ?? apiStats?.totalCollection ?? 0),
        pendingAmount: Number(apiStats?.pendingFees ?? summary?.totalOutstanding ?? 0),
        collectedToday: Number(todayRes.data?.data?.totalAmount ?? 0),
        overdueInvoices: Number(apiStats?.overdueInvoices ?? 0),
        totalInvoices: Number(apiStats?.totalInvoices ?? summary?.totalInvoices ?? 0),
        paidInvoices: Number(apiStats?.paidInvoices ?? summary?.paidInvoices ?? 0),
        partialInvoices: Number(apiStats?.partialInvoices ?? 0),
      });
      setRecentTransactions(Array.isArray(transactionsRes.data?.data) ? transactionsRes.data.data : []);
      if (requestFailed) setError('Some finance dashboard data could not be loaded');
    } catch {
      setError('Failed to load finance dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchDashboardData);
  }, [fetchDashboardData]);

  const statCards = [
    {
      title: t('finance.totalRevenue'),
      value: `NPR ${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: <BalanceIcon sx={{ fontSize: 32 }} />,
      color: C.success,
      bgColor: C.successBg,
      action: () => navigate(`/finance/reports`),
    },
    {
      title: t('finance.pendingAmount'),
      value: `NPR ${(stats.pendingAmount || 0).toLocaleString()}`,
      icon: <WarningIcon sx={{ fontSize: 32 }} />,
      color: C.warning,
      bgColor: C.warningBg,
      action: () => navigate(`/finance/invoices?status=pending`),
    },
    {
      title: t('finance.collectedToday'),
      value: `NPR ${(stats.collectedToday || 0).toLocaleString()}`,
      icon: <TrendingUpIcon sx={{ fontSize: 32 }} />,
      color: C.primary,
      bgColor: C.primaryBg,
      action: () => navigate(`/finance/payments`),
    },
    {
      title: t('finance.overdueInvoices'),
      value: (stats.overdueInvoices || 0).toString(),
      icon: <ReceiptIcon sx={{ fontSize: 32 }} />,
      color: C.danger,
      bgColor: C.dangerBg,
      action: () => navigate(`/finance/invoices?status=overdue`),
    },
  ];

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          minWidth: 0,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BalanceIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{t('finance.dashboard')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('finance.subtitle')}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' } }}>
            <Button
              variant="contained" sx={{ ...S.BTN_PRIMARY, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              startIcon={<AddIcon />}
              onClick={() => navigate(`/finance/fee-structures`)}
              fullWidth={false}
            >
              {t('finance.newFeeStructure')}
            </Button>
            <Button
              variant="outlined" sx={{ ...S.BTN_OUTLINE, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
              startIcon={<ReceiptIcon />}
              onClick={() => navigate(`/finance/invoices/generate`)}
              fullWidth={false}
            >
              {t('finance.generateInvoice')}
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              component="button"
              type="button"
              aria-label={`${card.title}: ${card.value}`}
              sx={{
                ...S.GLASS,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
              onClick={card.action}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" fontWeight={600}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ backgroundColor: card.bgColor, color: card.color, p: 1.5, borderRadius: R.lg, display: 'flex', alignItems: 'center' }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ ...S.GLASS, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                {t('finance.recentTransactions')}
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(`/finance/payments`)}
              >
                {t('finance.viewAll')}
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {recentTransactions.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                {t('finance.noRecentTransactions')}
              </Typography>
            ) : (
              <List>
                {recentTransactions.map((transaction) => (
                  <ListItem
                    key={transaction.id}
                    secondaryAction={
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body1" fontWeight={600}>
                          NPR {transaction.amount.toLocaleString()}
                        </Typography>
                        <Chip
                          label={transaction.status}
                          size="small"
                          color={['paid', 'completed'].includes(transaction.status.toLowerCase()) ? 'success' : 'warning'}
                        />
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={transaction.studentName}
                      secondary={`${transaction.type} • ${transaction.date && !Number.isNaN(new Date(transaction.date).getTime()) ? new Date(transaction.date).toLocaleDateString() : '—'}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('finance.quickActions')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                fullWidth
                startIcon={<ReceiptIcon />}
                onClick={() => navigate(`/finance/invoices`)}
              >
                {t('finance.manageInvoices')}
              </Button>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                fullWidth
                startIcon={<PaymentIcon />}
                onClick={() => navigate(`/finance/payments`)}
              >
                {t('finance.recordPayment')}
              </Button>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                fullWidth
                onClick={() => navigate(`/finance/fee-structures`)}
              >
                {t('finance.feeStructuresLink')}
              </Button>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                fullWidth
                onClick={() => navigate(`/finance/reports`)}
              >
                {t('finance.financialReportsLink')}
              </Button>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                fullWidth
                onClick={() => navigate(`/finance/payment-gateways`)}
              >
                {t('finance.paymentGatewaysLink')}
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ ...S.GLASS, p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('finance.invoiceSummary')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">{t('finance.totalInvoicesLabel')}</Typography>
                <Typography fontWeight={600}>{stats.totalInvoices}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">{t('finance.paidLabel')}</Typography>
                <Typography fontWeight={600} color="success.main">
                  {stats.paidInvoices}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">{t('finance.partialLabel')}</Typography>
                <Typography fontWeight={600} color="warning.main">
                  {stats.partialInvoices}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">{t('finance.overdueLabel')}</Typography>
                <Typography fontWeight={600} color="error.main">
                  {stats.overdueInvoices}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default FinanceDashboard;

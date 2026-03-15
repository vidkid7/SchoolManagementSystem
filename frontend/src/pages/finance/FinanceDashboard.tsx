/**
 * Finance Dashboard
 * Overview of financial statistics and quick actions
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
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
  id: number;
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
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, transactionsRes] = await Promise.all([
        apiClient.get('/finance/statistics').catch(() => ({ data: { data: null } })),
        apiClient.get('/finance/recent-transactions?limit=5').catch(() => ({ data: { data: [] } })),
      ]);

if (statsRes.data?.data) {
        setStats({
          totalRevenue: statsRes.data.data.totalRevenue || 0,
          pendingAmount: statsRes.data.data.pendingAmount || 0,
          collectedToday: statsRes.data.data.collectedToday || 0,
          overdueInvoices: statsRes.data.data.overdueInvoices || 0,
          totalInvoices: statsRes.data.data.totalInvoices || 0,
          paidInvoices: statsRes.data.data.paidInvoices || 0,
          partialInvoices: statsRes.data.data.partialInvoices || 0,
        });
      }
      setRecentTransactions(transactionsRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t('finance.totalRevenue'),
      value: `NPR ${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: <BalanceIcon sx={{ fontSize: 40, color: C.success }} />,
      color: C.success,
      action: () => navigate(`/finance/reports`),
    },
    {
      title: t('finance.pendingAmount'),
      value: `NPR ${(stats.pendingAmount || 0).toLocaleString()}`,
      icon: <WarningIcon sx={{ fontSize: 40, color: C.warning }} />,
      color: C.warning,
      action: () => navigate(`/finance/invoices?status=pending`),
    },
    {
      title: t('finance.collectedToday'),
      value: `NPR ${(stats.collectedToday || 0).toLocaleString()}`,
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: C.primary }} />,
      color: C.primary,
      action: () => navigate(`/finance/payments`),
    },
    {
      title: t('finance.overdueInvoices'),
      value: (stats.overdueInvoices || 0).toString(),
      icon: <ReceiptIcon sx={{ fontSize: 40, color: C.danger }} />,
      color: C.danger,
      action: () => navigate(`/finance/invoices?status=overdue`),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          {t('finance.dashboard')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained" sx={S.BTN_PRIMARY}
            startIcon={<AddIcon />}
            onClick={() => navigate(`/finance/fee-structures/new`)}
          >
            {t('finance.newFeeStructure')}
          </Button>
          <Button
            variant="outlined" sx={S.BTN_OUTLINE}
            startIcon={<ReceiptIcon />}
            onClick={() => navigate(`/finance/invoices/generate`)}
          >
            {t('finance.generateInvoice')}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
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
                  {card.icon}
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
                          color={transaction.status === 'paid' ? 'success' : 'warning'}
                        />
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={transaction.studentName}
                      secondary={`${transaction.type} • ${new Date(transaction.date).toLocaleDateString()}`}
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

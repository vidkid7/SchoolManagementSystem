/**
 * Finance Dashboard
 * Overview of financial statistics and quick actions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import api from '../../config/api';

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
  const navigate = useNavigate();
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
        api.get('/finance/statistics').catch(() => ({ data: { data: null } })),
        api.get('/finance/recent-transactions?limit=5').catch(() => ({ data: { data: [] } })),
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
      title: 'Total Revenue',
      value: `NPR ${(stats.totalRevenue || 0).toLocaleString()}`,
      icon: <BalanceIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: '#1976d2',
      action: () => navigate('/finance/reports'),
    },
    {
      title: 'Pending Amount',
      value: `NPR ${(stats.pendingAmount || 0).toLocaleString()}`,
      icon: <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: '#ed6c02',
      action: () => navigate('/finance/invoices?status=pending'),
    },
    {
      title: 'Collected Today',
      value: `NPR ${(stats.collectedToday || 0).toLocaleString()}`,
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: '#2e7d32',
      action: () => navigate('/finance/payments'),
    },
    {
      title: 'Overdue Invoices',
      value: (stats.overdueInvoices || 0).toString(),
      icon: <ReceiptIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      color: '#d32f2f',
      action: () => navigate('/finance/invoices?status=overdue'),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Finance Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/finance/fee-structures/new')}
          >
            New Fee Structure
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReceiptIcon />}
            onClick={() => navigate('/finance/invoices/generate')}
          >
            Generate Invoice
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
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
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Recent Transactions
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/finance/payments')}
              >
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {recentTransactions.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No recent transactions
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
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ReceiptIcon />}
                onClick={() => navigate('/finance/invoices')}
              >
                Manage Invoices
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PaymentIcon />}
                onClick={() => navigate('/finance/payments')}
              >
                Record Payment
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/finance/fee-structures')}
              >
                Fee Structures
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/finance/reports')}
              >
                Financial Reports
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/finance/payment-gateways')}
              >
                Payment Gateways
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Invoice Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Total Invoices</Typography>
                <Typography fontWeight={600}>{stats.totalInvoices}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Paid</Typography>
                <Typography fontWeight={600} color="success.main">
                  {stats.paidInvoices}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Partial</Typography>
                <Typography fontWeight={600} color="warning.main">
                  {stats.partialInvoices}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Overdue</Typography>
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

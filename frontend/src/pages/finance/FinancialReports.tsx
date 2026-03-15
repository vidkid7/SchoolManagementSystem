/**
 * Financial Reports
 * Generate and view financial reports and statistics
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface FinancialSummary {
  totalRevenue: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  totalRefunds: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
}

interface ReportData {
  summary?: FinancialSummary;
  details?: any[];
  chartData?: any[];
}

export function FinancialReports() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [reportType, setReportType] = useState('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    collectionRate: 0,
    totalRefunds: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
  });

  useEffect(() => {
    fetchFinancialSummary();
  }, []);

  const fetchFinancialSummary = async () => {
    try {
      // Try to fetch financial summary, fallback to calculating from invoices
      try {
        const response = await apiClient.get('/finance/summary');
        const data = response.data?.data || {};
        setSummary({
          totalRevenue: data.totalRevenue || 0,
          totalCollected: data.totalCollected || 0,
          totalOutstanding: data.totalOutstanding || 0,
          collectionRate: data.collectionRate || 0,
          totalRefunds: data.totalRefunds || 0,
          totalInvoices: data.totalInvoices || 0,
          paidInvoices: data.paidInvoices || 0,
          pendingInvoices: data.pendingInvoices || 0,
        });
      } catch (summaryError: any) {
        // Silently handle 404 - endpoint doesn't exist, use fallback
        if (summaryError.response?.status !== 404) {
          console.error('Error fetching summary:', summaryError);
        }
        
        // Fallback: Calculate from invoices
        const invoicesResponse = await apiClient.get('/finance/invoices');
        const invoices = invoicesResponse.data?.data?.records || invoicesResponse.data?.data || [];
        
        const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || 0), 0);
        const paidInvoices = invoices.filter((inv: any) => inv.status === 'paid');
        const totalCollected = paidInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || 0), 0);
        const totalOutstanding = totalRevenue - totalCollected;
        const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;
        
        setSummary({
          totalRevenue,
          totalCollected,
          totalOutstanding,
          collectionRate,
          totalRefunds: 0,
          totalInvoices: invoices.length,
          paidInvoices: paidInvoices.length,
          pendingInvoices: invoices.filter((inv: any) => inv.status === 'pending').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch financial summary:', error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        type: reportType,
      };

      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      console.log('Fetching financial report with params:', params);

      const response = await apiClient.get('/finance/reports', { params });
      const data = response.data?.data || response.data;
      
      console.log('Financial report data:', data);
      setReportData(data);

    } catch (error: any) {
      console.error('Failed to generate report:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to generate report';
      setError(errorMsg);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;

    // Create CSV content
    const csvContent = generateCSVContent(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_report_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const generateCSVContent = (data: ReportData): string => {
    const headers = ['Report Type', 'Generated Date', 'Start Date', 'End Date'];
    const rows = [
      [reportType, new Date().toLocaleDateString(), startDate || 'N/A', endDate || 'N/A']
    ];

    if (data.summary) {
      rows.push([]);
      rows.push(['Summary']);
      Object.entries(data.summary).forEach(([key, value]) => {
        rows.push([key, String(value)]);
      });
    }

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleQuickReport = async (period: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (period) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'week':
        start = new Date(today.setDate(today.getDate() - 7));
        end = new Date();
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date();
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date();
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    
    // Auto-generate report
    setTimeout(() => handleGenerateReport(), 100);
  };

  const reportTypes = [
    { value: 'revenue', label: t('finance.revenueReport') },
    { value: 'collection', label: t('finance.feeCollectionReport') },
    { value: 'outstanding', label: t('finance.outstandingFeesReport') },
    { value: 'payment_method', label: t('finance.paymentMethodAnalysis') },
    { value: 'class_wise', label: t('finance.classWiseRevenue') },
    { value: 'monthly', label: t('finance.monthlySummary') },
  ];

  const quickStats = [
    { 
      label: t('finance.totalRevenueMonth'), 
      value: `NPR ${summary.totalRevenue.toLocaleString()}`,
      icon: <MoneyIcon />,
      gradient: `linear-gradient(135deg, ${C.primary} 0%, ${C.primary} 100%)`,
    },
    { 
      label: t('finance.outstandingAmount'), 
      value: `NPR ${summary.totalOutstanding.toLocaleString()}`,
      icon: <AccountBalanceIcon />,
      gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    },
    { 
      label: t('finance.collectionRate'), 
      value: `${summary.collectionRate.toFixed(1)}%`,
      icon: <TrendingUpIcon />,
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
    },
    { 
      label: t('finance.refundsProcessed'), 
      value: `NPR ${summary.totalRefunds.toLocaleString()}`,
      icon: <ReceiptIcon />,
      gradient: 'linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%)',
    },
  ];

  return (
    <Box>
      {/* Header Card with Blue Theme */}
      <Paper 
        sx={{ 
          ...S.GLASS,
          p: 3, 
          mb: 3,
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primary} 100%)`,
          color: 'white',
          borderRadius: R.lg,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: R.lg,
              background: alpha('#ffffff', 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ReportIcon sx={{ fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {t('finance.financialReports')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t('finance.generateComprehensiveReports')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ ...S.GLASS, p: 3, borderRadius: R.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <ChartIcon sx={{ fontSize: 28, color: C.primary }} />
              <Typography variant="h6" fontWeight={600} color={C.primary}>
                {t('finance.generateReport')}
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label={t('finance.reportType')}
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: C.primary,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: C.primary,
                    },
                  }}
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('common.startDate')}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: C.primary,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: C.primary,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('common.endDate')}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: C.primary,
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: C.primary,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    sx={S.BTN_PRIMARY}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ReportIcon />}
                    onClick={handleGenerateReport}
                    disabled={loading}
                    fullWidth
                  >
                    {t('common.generate')}
                  </Button>
                  {reportData && (
                    <>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadPDF}
                        disabled={loading}
                        fullWidth
                        sx={{
                          borderColor: C.primary,
                          color: C.primary,
                          '&:hover': {
                            borderColor: C.primary,
                            bgcolor: alpha(C.primary, 0.05),
                          },
                        }}
                      >
                        {t('finance.downloadPDF')}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={handlePrint}
                        disabled={loading}
                        fullWidth
                        sx={{
                          borderColor: C.primary,
                          color: C.primary,
                          '&:hover': {
                            borderColor: C.primary,
                            bgcolor: alpha(C.primary, 0.05),
                          },
                        }}
                      >
                        {t('common.print')}
                      </Button>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: C.primary }} />
              </Box>
            ) : reportData ? (
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom color={C.primary}>
                  {t('finance.reportSummary')}
                </Typography>
                {reportData.summary && (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {Object.entries(reportData.summary).map(([key, value]) => (
                      <Grid item xs={12} sm={6} md={4} key={key}>
                        <Card sx={{ bgcolor: alpha(C.primary, 0.05), borderRadius: R.lg }}>
                          <CardContent>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Typography>
                            <Typography variant="h6" fontWeight={600} color={C.primary}>
                              {typeof value === 'number' ? value.toLocaleString() : value}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
                {reportData.details && reportData.details.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom color={C.primary}>
                      {t('finance.detailedReport')}
                    </Typography>
                    <TableContainer sx={{ mt: 2, border: `1px solid ${alpha(C.primary, 0.1)}`, borderRadius: R.lg }}>
                      <Table>
                        <TableHead sx={{ bgcolor: alpha(C.primary, 0.1) }}>
                          <TableRow>
                            {Object.keys(reportData.details[0]).map((key) => (
                              <TableCell key={key} sx={{ fontWeight: 600, color: C.primary }}>
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.details.map((row, index) => (
                            <TableRow 
                              key={index}
                              sx={{ 
                                '&:hover': { bgcolor: alpha(C.primary, 0.05) },
                                '&:nth-of-type(even)': { bgcolor: alpha(theme.palette.background.paper, 0.5) },
                              }}
                            >
                              {Object.values(row).map((value: any, i) => (
                                <TableCell key={i}>
                                  {typeof value === 'number' ? value.toLocaleString() : value}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ 
                p: 4, 
                textAlign: 'center',
                bgcolor: alpha(C.primary, 0.05),
                borderRadius: R.lg,
                border: `1px solid ${alpha(C.primary, 0.1)}`,
              }}>
                <ChartIcon sx={{ fontSize: 64, color: C.neutral, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('reports.noData')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('finance.generateReportToView')}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Quick Stats Cards */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            {quickStats.map((stat, index) => (
              <Card 
                key={index}
                sx={{
                  background: stat.gradient,
                  color: 'white',
                  borderRadius: R.lg,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: R.md,
                        background: alpha('#ffffff', 0.2),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {stat.value}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Quick Reports */}
          <Paper sx={{ ...S.GLASS, p: 3, borderRadius: R.lg }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <ReportIcon sx={{ fontSize: 24, color: C.primary }} />
              <Typography variant="h6" fontWeight={600} color={C.primary}>
                {t('finance.quickReports')}
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button 
                variant="outlined" 
                size="medium" 
                startIcon={<ReportIcon />}
                onClick={() => handleQuickReport('today')}
                sx={{
                  borderColor: C.primary,
                  color: C.primary,
                  '&:hover': {
                    borderColor: C.primary,
                    bgcolor: alpha(C.primary, 0.05),
                  },
                }}
              >
                {t('finance.todayCollection')}
              </Button>
              <Button 
                variant="outlined" 
                size="medium" 
                startIcon={<ReportIcon />}
                onClick={() => handleQuickReport('week')}
                sx={{
                  borderColor: C.primary,
                  color: C.primary,
                  '&:hover': {
                    borderColor: C.primary,
                    bgcolor: alpha(C.primary, 0.05),
                  },
                }}
              >
                {t('finance.thisWeek')}
              </Button>
              <Button 
                variant="outlined" 
                size="medium" 
                startIcon={<ReportIcon />}
                onClick={() => handleQuickReport('month')}
                sx={{
                  borderColor: C.primary,
                  color: C.primary,
                  '&:hover': {
                    borderColor: C.primary,
                    bgcolor: alpha(C.primary, 0.05),
                  },
                }}
              >
                {t('finance.thisMonth')}
              </Button>
              <Button 
                variant="outlined" 
                size="medium" 
                startIcon={<ReportIcon />}
                onClick={() => handleQuickReport('year')}
                sx={{
                  borderColor: C.primary,
                  color: C.primary,
                  '&:hover': {
                    borderColor: C.primary,
                    bgcolor: alpha(C.primary, 0.05),
                  },
                }}
              >
                {t('finance.thisYear')}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default FinancialReports;

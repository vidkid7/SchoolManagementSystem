/**
 * Library Reports
 * Generate various library reports
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { C, useAdminStyles, R } from '../../theme/designTokens';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface LibraryStats {
  booksIssuedMonth: number;
  booksReturned: number;
  overdueBooks: number;
  finesCollected: number;
}

export function LibraryReports() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [reportType, setReportType] = useState('circulation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<LibraryStats>({
    booksIssuedMonth: 0,
    booksReturned: 0,
    overdueBooks: 0,
    finesCollected: 0,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLibraryStats();
  }, []);

  const fetchLibraryStats = async () => {
    try {
      setStatsLoading(true);
      const response = await apiClient.get('/library/reports');
      const data = response.data?.data || response.data;
      
      setStats({
        booksIssuedMonth: data.booksIssuedMonth || data.totalCirculations || 0,
        booksReturned: data.booksReturned || data.totalReturns || 0,
        overdueBooks: data.overdueBooks || data.totalOverdue || 0,
        finesCollected: data.finesCollected || data.totalFines || 0,
      });
    } catch (error: any) {
      console.error('Failed to fetch library stats:', error);
      // Don't show error for stats, just use default values
    } finally {
      setStatsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError(t('library.pleaseSelectDateRange'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.get('/library/reports', {
        params: {
          type: reportType,
          startDate,
          endDate,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `library_report_${reportType}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccess(t('library.reportDownloadedSuccessfully'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      setError(error.response?.data?.message || t('library.failedToGenerateReport'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!startDate || !endDate) {
      setError(t('library.pleaseSelectDateRange'));
      return;
    }
    
    // For now, show a message that print feature is coming soon
    setSuccess(t('library.printFeatureComingSoon'));
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleQuickReport = (period: string) => {
    const today = new Date();
    let start = new Date();
    
    switch (period) {
      case 'today':
        start = today;
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setSuccess(t('library.dateRangeSet'));
    setTimeout(() => setSuccess(''), 2000);
  };

  const reportTypes = [
    { value: 'circulation', label: t('library.circulationReport') },
    { value: 'overdue', label: t('library.overdueBooksReport') },
    { value: 'popular', label: t('library.popularBooksReport') },
    { value: 'fines', label: t('library.finesCollectionReport') },
    { value: 'inventory', label: t('library.bookInventoryReport') },
    { value: 'member', label: t('library.memberActivityReport') },
  ];

  const quickStats = [
    { label: t('library.booksIssuedMonth'), value: statsLoading ? '...' : stats.booksIssuedMonth.toString() },
    { label: t('library.booksReturned'), value: statsLoading ? '...' : stats.booksReturned.toString() },
    { label: t('library.overdueBooks'), value: statsLoading ? '...' : stats.overdueBooks.toString() },
    { label: t('library.finesCollected'), value: statsLoading ? '...' : `NPR ${stats.finesCollected}` },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {t('library.libraryReports')}
      </Typography>
      <Typography color="text.secondary" paragraph>
        {t('library.generateComprehensiveReports')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ ...S.GLASS, p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('library.generateReport')}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label={t('library.reportType')}
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  fullWidth
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
                  label={t('library.startDate')}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('library.endDate')}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                    onClick={handleGenerateReport}
                    disabled={loading || !startDate || !endDate}
                    fullWidth
                  >
                    {loading ? t('common.loading') : t('library.downloadPDF')}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    disabled={loading || !startDate || !endDate}
                    fullWidth
                  >
                    {t('reports.print')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {quickStats.map((stat, index) => (
              <Card key={index} sx={S.GLASS}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {stat.value}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Paper sx={{ ...S.GLASS, p: 3, mt: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('library.quickReports')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<ReportIcon />}
                onClick={() => handleQuickReport('today')}
              >
                {t('library.todayActivity')}
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<ReportIcon />}
                onClick={() => handleQuickReport('week')}
              >
                {t('library.thisWeek')}
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<ReportIcon />}
                onClick={() => handleQuickReport('month')}
              >
                {t('library.thisMonth')}
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<ReportIcon />}
                onClick={() => handleQuickReport('year')}
              >
                {t('library.thisYear')}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default LibraryReports;

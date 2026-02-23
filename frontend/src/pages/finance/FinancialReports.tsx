/**
 * Financial Reports
 * Generate and view financial reports and statistics
 */

import { useState } from 'react';
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
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import api from '../../config/api';

export function FinancialReports() {
  const [reportType, setReportType] = useState('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/finance/reports', {
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
      link.setAttribute('download', `financial_report_${reportType}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { value: 'revenue', label: 'Revenue Report' },
    { value: 'collection', label: 'Fee Collection Report' },
    { value: 'outstanding', label: 'Outstanding Fees Report' },
    { value: 'payment_method', label: 'Payment Method Analysis' },
    { value: 'class_wise', label: 'Class-wise Revenue' },
    { value: 'monthly', label: 'Monthly Summary' },
  ];

  const quickStats = [
    { label: 'Total Revenue (This Month)', value: 'NPR 2,450,000', color: '#1976d2' },
    { label: 'Outstanding Amount', value: 'NPR 850,000', color: '#ed6c02' },
    { label: 'Collection Rate', value: '74.2%', color: '#2e7d32' },
    { label: 'Refunds Processed', value: 'NPR 45,000', color: '#d32f2f' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Financial Reports
      </Typography>
      <Typography color="text.secondary" paragraph>
        Generate comprehensive financial reports and analytics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Generate Report
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Report Type"
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
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="End Date"
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
                    startIcon={<DownloadIcon />}
                    onClick={handleGenerateReport}
                    disabled={loading || !startDate || !endDate}
                    fullWidth
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<PrintIcon />}
                    disabled={loading || !startDate || !endDate}
                    fullWidth
                  >
                    Print Report
                  </Button>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight={600} gutterBottom>
              Sample Report Preview
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Tuition Fees</TableCell>
                    <TableCell align="right">NPR 1,800,000</TableCell>
                    <TableCell align="right">73.5%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Admission Fees</TableCell>
                    <TableCell align="right">NPR 350,000</TableCell>
                    <TableCell align="right">14.3%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Exam Fees</TableCell>
                    <TableCell align="right">NPR 200,000</TableCell>
                    <TableCell align="right">8.2%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Other Fees</TableCell>
                    <TableCell align="right">NPR 100,000</TableCell>
                    <TableCell align="right">4.0%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell align="right"><strong>NPR 2,450,000</strong></TableCell>
                    <TableCell align="right"><strong>100%</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {quickStats.map((stat, index) => (
              <Card key={index}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingUpIcon sx={{ fontSize: 40, color: stat.color }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {stat.value}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Quick Reports
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<ReportIcon />}>
                Today's Collection
              </Button>
              <Button variant="outlined" size="small" startIcon={<ReportIcon />}>
                This Week
              </Button>
              <Button variant="outlined" size="small" startIcon={<ReportIcon />}>
                This Month
              </Button>
              <Button variant="outlined" size="small" startIcon={<ReportIcon />}>
                This Year
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default FinancialReports;

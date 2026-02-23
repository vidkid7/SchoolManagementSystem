/**
 * Library Reports
 * Generate various library reports
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
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import api from '../../config/api';

export function LibraryReports() {
  const [reportType, setReportType] = useState('circulation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/library/reports', {
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
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { value: 'circulation', label: 'Circulation Report' },
    { value: 'overdue', label: 'Overdue Books Report' },
    { value: 'popular', label: 'Popular Books Report' },
    { value: 'fines', label: 'Fines Collection Report' },
    { value: 'inventory', label: 'Book Inventory Report' },
    { value: 'member', label: 'Member Activity Report' },
  ];

  const quickStats = [
    { label: 'Books Issued (This Month)', value: '245' },
    { label: 'Books Returned', value: '198' },
    { label: 'Overdue Books', value: '23' },
    { label: 'Fines Collected', value: 'NPR 4,500' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Library Reports
      </Typography>
      <Typography color="text.secondary" paragraph>
        Generate comprehensive library reports and analytics
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
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {quickStats.map((stat, index) => (
              <Card key={index}>
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

          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Quick Reports
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<ReportIcon />}>
                Today's Activity
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

export default LibraryReports;

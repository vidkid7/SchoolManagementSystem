/**
 * Attendance Reports Page
 * 
 * View and generate attendance reports with filters
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface AttendanceRecord {
  attendanceId: number;
  studentId: number;
  classId: number;
  date: string;
  periodNumber?: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedAt: string;
  remarks?: string;
}

export function AttendanceReports() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('student');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    totalPresent: 0,
    totalAbsent: 0,
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/academic/classes');
      const classesData = response.data?.data || [];
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {};

      // Only add dates if they are provided
      if (startDate) {
        try {
          const date = new Date(startDate + 'T00:00:00.000Z');
          if (!isNaN(date.getTime())) {
            params.dateFrom = date.toISOString();
          }
        } catch (e) {
          console.error('Invalid start date:', e);
        }
      }
      
      if (endDate) {
        try {
          const date = new Date(endDate + 'T23:59:59.999Z');
          if (!isNaN(date.getTime())) {
            params.dateTo = date.toISOString();
          }
        } catch (e) {
          console.error('Invalid end date:', e);
        }
      }

      // For student reports, add class filter (only if it has a value)
      if (reportType === 'student') {
        if (selectedClass && selectedClass !== '') {
          params.classId = parseInt(selectedClass);
        }
      }

      const endpoint = reportType === 'student' 
        ? '/attendance/student/report'
        : '/attendance/staff/report';

      console.log('Fetching report with params:', params);

      const response = await apiClient.get(endpoint, { params });
      console.log('Response:', response.data);
      
      // The backend returns { records: [...], total, page, limit, totalPages }
      const responseData = response.data?.data;
      const data = responseData?.records || responseData || [];
      
      console.log('Parsed data:', data);
      
      setAttendanceData(data);
      
      // Calculate summary from the attendance records
      if (data.length > 0) {
        const statusCounts = data.reduce((acc: any, record: any) => {
          acc[record.status] = (acc[record.status] || 0) + 1;
          return acc;
        }, {});

        const totalRecords = data.length;
        const presentCount = statusCounts.present || 0;
        const absentCount = statusCounts.absent || 0;
        
        // Count unique students or staff
        const uniqueCount = new Set(data.map((r: any) => r.studentId || r.staffId)).size;

        setSummary({
          totalStudents: uniqueCount,
          averageAttendance: totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0,
          totalPresent: presentCount,
          totalAbsent: absentCount,
        });
      } else {
        setSummary({
          totalStudents: 0,
          averageAttendance: 0,
          totalPresent: 0,
          totalAbsent: 0,
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch report:', error);
      console.error('Error response:', error.response?.data);
      const errorDetails = error.response?.data?.details || error.response?.data?.error || '';
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch attendance report';
      setError(`${errorMsg}${errorDetails ? ': ' + JSON.stringify(errorDetails) : ''}`);
      setAttendanceData([]);
      setSummary({
        totalStudents: 0,
        averageAttendance: 0,
        totalPresent: 0,
        totalAbsent: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Export to CSV with the actual data structure
    const idLabel = reportType === 'student' ? 'Student ID' : 'Staff ID';
    const headers = ['Attendance ID', idLabel, 'Class ID', 'Date', 'Period', 'Status', 'Marked At', 'Remarks'];
    const rows = attendanceData.map((item: any) => [
      item.attendanceId || item.staffAttendanceId,
      item.studentId || item.staffId,
      item.classId || '-',
      new Date(item.date).toLocaleDateString(),
      item.periodNumber || '-',
      item.status,
      item.markedAt ? new Date(item.markedAt).toLocaleString() : new Date(item.createdAt).toLocaleString(),
      item.remarks || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
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
              {t('attendance.attendanceReport')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t('dashboard.attendanceSubtitle')}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>
                {t('common.reportType')}
              </InputLabel>
              <Select
                value={reportType}
                label={t('common.reportType')}
                onChange={(e) => setReportType(e.target.value)}
                sx={{
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: alpha('#ffffff', 0.3) },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#ffffff', 0.5) },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '.MuiSvgIcon-root': { color: 'white' },
                }}
              >
                <MenuItem value="student">{t('students.title')}</MenuItem>
                <MenuItem value="staff">{t('staff.title')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label={t('common.startDate')}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ 
                shrink: true,
                sx: { color: 'white', '&.Mui-focused': { color: 'white' } }
              }}
              sx={{
                '.MuiOutlinedInput-root': {
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: alpha('#ffffff', 0.3) },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#ffffff', 0.5) },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label={t('common.endDate')}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ 
                shrink: true,
                sx: { color: 'white', '&.Mui-focused': { color: 'white' } }
              }}
              sx={{
                '.MuiOutlinedInput-root': {
                  color: 'white',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: alpha('#ffffff', 0.3) },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#ffffff', 0.5) },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                },
              }}
            />
          </Grid>
          {reportType === 'student' && (
            <>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>
                    {t('common.class')} ({t('common.optional')})
                  </InputLabel>
                  <Select
                    value={selectedClass}
                    label={`${t('common.class')} (${t('common.optional')})`}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    sx={{
                      color: 'white',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: alpha('#ffffff', 0.3) },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#ffffff', 0.5) },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                      '.MuiSvgIcon-root': { color: 'white' },
                    }}
                  >
                    <MenuItem value="">{t('common.allClasses')}</MenuItem>
                    {classes.length > 0 ? (
                      classes.map((cls) => (
                        <MenuItem key={cls.classId} value={cls.classLevel?.toString() || cls.classId?.toString()}>
                          {t('common.class')} {cls.classLevel || cls.classId} {cls.className ? `- ${cls.className}` : ''}
                        </MenuItem>
                      ))
                    ) : (
                      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                        <MenuItem key={cls} value={cls.toString()}>
                          {t('common.class')} {cls}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'white', '&.Mui-focused': { color: 'white' } }}>
                    {t('common.section')} ({t('common.optional')})
                  </InputLabel>
                  <Select
                    value={selectedSection}
                    label={`${t('common.section')} (${t('common.optional')})`}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    sx={{
                      color: 'white',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: alpha('#ffffff', 0.3) },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#ffffff', 0.5) },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                      '.MuiSvgIcon-root': { color: 'white' },
                    }}
                  >
                    <MenuItem value="">{t('common.allSections')}</MenuItem>
                    <MenuItem value="A">{t('common.section')} A</MenuItem>
                    <MenuItem value="B">{t('common.section')} B</MenuItem>
                    <MenuItem value="C">{t('common.section')} C</MenuItem>
                    <MenuItem value="D">{t('common.section')} D</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          <Grid item xs={12} md={reportType === 'student' ? 1 : 3}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchReport}
              disabled={loading}
              sx={{ ...S.BTN_PRIMARY,  
                height: '56px',
                bgcolor: 'white',
                color: C.primary,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: alpha('#ffffff', 0.9),
                },
              }}
            >
              {t('common.generate')}
            </Button>
          </Grid>
        </Grid>

        {attendanceData.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              sx={{ ...S.BTN_OUTLINE, 
                color: 'white',
                borderColor: alpha('#ffffff', 0.3),
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: alpha('#ffffff', 0.1),
                },
              }}
            >
              {t('common.exportCSV')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ ...S.BTN_OUTLINE, 
                color: 'white',
                borderColor: alpha('#ffffff', 0.3),
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: alpha('#ffffff', 0.1),
                },
              }}
            >
              {t('common.print')}
            </Button>
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress sx={{ color: C.primary }} />
        </Box>
      ) : attendanceData.length === 0 && (startDate || endDate) ? (
        <Paper sx={{ ...S.GLASS, p: 4, textAlign: 'center' }}>
          <ChartIcon sx={{ fontSize: 64, color: C.neutral, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('common.noRecordsFound')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('common.tryAdjustingFilters')}
          </Typography>
        </Paper>
      ) : attendanceData.length > 0 ? (
        <>
          {/* Summary Cards with Blue Theme */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card 
                sx={{ 
                  borderRadius: R.lg,
                  background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primary} 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    {reportType === 'student' ? t('students.title') : t('staff.title')}
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {summary.totalStudents}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card 
                sx={{ 
                  borderRadius: R.lg,
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
                  color: 'white',
                }}
              >
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    {t('reports.averageAttendance')}
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {summary.averageAttendance.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card 
                sx={{ 
                  borderRadius: R.lg,
                  background: 'linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%)',
                  color: 'white',
                }}
              >
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    {t('attendance.present')}
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {summary.totalPresent}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card 
                sx={{ 
                  borderRadius: R.lg,
                  background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                  color: 'white',
                }}
              >
                <CardContent>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    {t('attendance.absent')}
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {summary.totalAbsent}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Data Table */}
          <TableContainer component={Paper} sx={{ ...S.GLASS }}>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow sx={{ bgcolor: alpha(C.primary, 0.1) }}>
                  <TableCell sx={{ fontWeight: 600, color: C.primary }}>
                    {reportType === 'student' ? t('students.studentId') : t('staff.staffId')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: C.primary }}>
                    {t('common.classId')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: C.primary }}>
                    {t('attendance.date')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: C.primary }}>
                    {t('attendance.period')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: C.primary }}>
                    {t('common.status')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: C.primary }}>
                    {t('common.markedAt')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: C.primary }}>
                    {t('common.remarks')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceData.map((row: any, index: number) => (
                  <TableRow 
                    key={row.attendanceId || row.staffAttendanceId || index}
                    sx={{ ...S.TR_HOVER, '&:hover': { bgcolor: alpha(C.primary, 0.05) },
                      '&:nth-of-type(even)': { bgcolor: alpha(theme.palette.background.paper, 0.5) }, }}
                  >
                    <TableCell sx={S.TD}>{row.studentId || row.staffId}</TableCell>
                    <TableCell sx={S.TD}>{row.classId || '-'}</TableCell>
                    <TableCell sx={S.TD}>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell align="center" sx={S.TD}>{row.periodNumber || '-'}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip
                        label={t(`attendance.${row.status}`)}
                        sx={{
                          bgcolor: 
                            row.status === 'present' ? alpha(C.primary, 0.15) :
                            row.status === 'absent' ? alpha(C.neutral, 0.15) :
                            alpha(C.primary, 0.15),
                          color:
                            row.status === 'present' ? C.primary :
                            row.status === 'absent' ? C.neutral :
                            C.primary,
                          fontWeight: 600,
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={S.TD}>
                      {row.markedAt ? new Date(row.markedAt).toLocaleString() : new Date(row.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell sx={S.TD}>{row.remarks || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Paper sx={{ ...S.GLASS, p: 4, textAlign: 'center' }}>
          <ChartIcon sx={{ fontSize: 64, color: C.neutral, mb: 2 }} />
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {t('common.generateReport')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('common.selectDateRangeToGenerate')}
          </Typography>
          <Box 
            sx={{ 
              mt: 3, 
              textAlign: 'left', 
              maxWidth: 600, 
              mx: 'auto',
              p: 3,
              bgcolor: alpha(C.primary, 0.05),
              borderRadius: R.lg,
              border: `1px solid ${alpha(C.primary, 0.1)}`,
            }}
          >
            <Typography variant="subtitle2" gutterBottom fontWeight={600} color={C.primary}>
              {t('common.instructions')}:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ lineHeight: 1.8 }}>
              1. {t('common.selectReportType')}<br />
              2. {t('common.chooseDateRange')}<br />
              3. {t('common.optionallyFilterByClass')}<br />
              4. {t('common.clickGenerateButton')}<br />
              5. {t('common.exportOrPrintReport')}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default AttendanceReports;

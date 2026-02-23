/**
 * Attendance Reports Page
 * 
 * View and generate attendance reports with filters
 */

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import api from '../../config/api';

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
      const response = await api.get('/academic/classes');
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
      // Note: Section filter is not supported by the backend API
      if (reportType === 'student') {
        if (selectedClass && selectedClass !== '') {
          params.classId = parseInt(selectedClass);
        }
      }

      const endpoint = reportType === 'student' 
        ? '/attendance/student/report'
        : '/attendance/staff/report';

      console.log('Fetching report with params:', params);

      const response = await api.get(endpoint, { params });
      console.log('Response:', response.data);
      console.log('Response data structure:', JSON.stringify(response.data.data, null, 2));
      
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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ReportIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            Attendance Reports
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="student">Student Attendance</MenuItem>
                <MenuItem value="staff">Staff Attendance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          {reportType === 'student' && (
            <>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Class (Optional)</InputLabel>
                  <Select
                    value={selectedClass}
                    label="Class (Optional)"
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <MenuItem value="">All Classes</MenuItem>
                    {classes.length > 0 ? (
                      classes.map((cls) => (
                        <MenuItem key={cls.classId} value={cls.classLevel?.toString() || cls.classId?.toString()}>
                          Class {cls.classLevel || cls.classId} {cls.className ? `- ${cls.className}` : ''}
                        </MenuItem>
                      ))
                    ) : (
                      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                        <MenuItem key={cls} value={cls.toString()}>
                          Class {cls}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Section (Optional)</InputLabel>
                  <Select
                    value={selectedSection}
                    label="Section (Optional)"
                    onChange={(e) => setSelectedSection(e.target.value)}
                  >
                    <MenuItem value="">All Sections</MenuItem>
                    <MenuItem value="A">Section A</MenuItem>
                    <MenuItem value="B">Section B</MenuItem>
                    <MenuItem value="C">Section C</MenuItem>
                    <MenuItem value="D">Section D</MenuItem>
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
              sx={{ height: '56px' }}
            >
              Generate
            </Button>
          </Grid>
        </Grid>

        {attendanceData.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
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
          <CircularProgress />
        </Box>
      ) : attendanceData.length === 0 && (startDate || endDate) ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No attendance records found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or date range
          </Typography>
        </Paper>
      ) : attendanceData.length > 0 ? (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Unique {reportType === 'student' ? 'Students' : 'Staff'}
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {summary.totalStudents}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Attendance Rate
                  </Typography>
                  <Typography variant="h4" fontWeight={600} color="primary">
                    {summary.averageAttendance.toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Present Records
                  </Typography>
                  <Typography variant="h4" fontWeight={600} color="success.main">
                    {summary.totalPresent}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Absent Records
                  </Typography>
                  <Typography variant="h4" fontWeight={600} color="error.main">
                    {summary.totalAbsent}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{reportType === 'student' ? 'Student ID' : 'Staff ID'}</TableCell>
                  <TableCell>Class ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Marked At</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceData.map((row: any, index: number) => (
                  <TableRow key={row.attendanceId || row.staffAttendanceId || index}>
                    <TableCell>{row.studentId || row.staffId}</TableCell>
                    <TableCell>{row.classId || '-'}</TableCell>
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                    <TableCell align="center">{row.periodNumber || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={
                          row.status === 'present' ? 'success' :
                          row.status === 'absent' ? 'error' :
                          row.status === 'late' || row.status === 'on_leave' ? 'warning' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{row.markedAt ? new Date(row.markedAt).toLocaleString() : new Date(row.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{row.remarks || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ReportIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Generate Attendance Report
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a date range and click "Generate" to view attendance reports
          </Typography>
          <Box sx={{ mt: 3, textAlign: 'left', maxWidth: 600, mx: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom>
              Instructions:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              1. Select report type (Student or Staff)<br />
              2. Choose start date and end date<br />
              3. Optionally filter by class and section<br />
              4. Click "Generate" button to view the report<br />
              5. Export to CSV or print the report
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}

export default AttendanceReports;

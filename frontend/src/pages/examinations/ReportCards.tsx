/**
 * Report Cards Page
 * Generate and view student report cards
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

interface Student {
  studentId: number;
  studentCode: string;
  firstName: string;
  lastName: string;
  rollNumber: number;
}

interface ReportData {
  studentId: number;
  studentName: string;
  class: string;
  section: string;
  term: string;
  academicYear: string;
  subjects: {
    subjectName: string;
    theoryMarks: number;
    practicalMarks: number;
    totalMarks: number;
    grade: string;
    gradePoint: number;
  }[];
  totalMarks: number;
  gpa: number;
  rank: number;
  attendance: number;
}

export function ReportCards() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  const [filters, setFilters] = useState({
    academicYear: '',
    term: '',
    class: '',
    section: '',
    examType: '',
  });

  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([
    { academicYearId: 1, name: '2025-2026' },
    { academicYearId: 2, name: '2024-2025' },
  ]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (filters.class) {
      fetchStudents();
    }
  }, [filters.class, filters.section]);

  const fetchInitialData = async () => {
    try {
      const [classesRes, yearsRes] = await Promise.all([
        api.get('/academic/classes').catch(e => { console.error('Classes error:', e); return { data: { data: [] } }; }),
        api.get('/academic/years').catch(e => { console.error('Years error:', e); return { data: { data: [] } }; }),
      ]);
      
      console.log('Classes response:', classesRes.data);
      console.log('Years response:', yearsRes.data);
      
      const classData = classesRes.data?.data || [];
      setClasses(classData);
      
      const years = yearsRes.data?.data || [];
      setAcademicYears(years.length > 0 ? years : [
        { academicYearId: 1, name: '2025-2026' },
        { academicYearId: 2, name: '2024-2025' },
      ]);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setAcademicYears([
        { academicYearId: 1, name: '2025-2026' },
        { academicYearId: 2, name: '2024-2025' },
      ]);
    }
  };

  const fetchStudents = async () => {
    if (!filters.class) {
      setStudents([]);
      return;
    }
    
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        classId: filters.class,
        limit: 100,
      };
      if (filters.section) {
        params.section = filters.section;
      }
      
      console.log('Fetching students with params:', params);
      const response = await api.get('/students', { params });
      console.log('Students response:', response.data);
      
      const apiStudents = response.data?.data || [];
      const mappedStudents = apiStudents.map((student: any) => ({
        studentId: student.studentId,
        studentCode: student.studentCode || '',
        firstName: student.firstNameEn || student.firstName || '',
        lastName: student.lastNameEn || student.lastName || '',
        rollNumber: student.rollNumber || 0,
      }));
      
      console.log('Mapped students:', mappedStudents);
      setStudents(mappedStudents);
      setSelectedStudent('');
      
      if (mappedStudents.length === 0) {
        setError('No students found for the selected class. Please check if students are enrolled in this class.');
      }
    } catch (err: any) {
      console.error('Failed to fetch students:', err);
      setError(err.response?.data?.message || 'Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Filter changed: ${name} = ${value}`);
    setFilters({
      ...filters,
      [name]: value,
    });
    // Clear students when class changes
    if (name === 'class') {
      setStudents([]);
      setSelectedStudent('');
    }
  };

  const handleGenerateReport = async (studentId?: string) => {
    const targetStudent = studentId || selectedStudent;
    if (!targetStudent) {
      setError('Please select a student');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filters.term) params.append('termId', filters.term);
      if (filters.academicYear) params.append('academicYearId', filters.academicYear);
      params.append('language', 'bilingual');
      params.append('format', 'ledger');

      const response = await api.get(`/examinations/report-card/${targetStudent}?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_card_${targetStudent}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Report card downloaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report card');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (students.length === 0) {
      setError('No students found for the selected criteria');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      for (const student of students) {
        await handleGenerateReport(student.studentId.toString());
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setSuccess(`Downloaded ${students.length} report cards!`);
    } catch (err: any) {
      setError('Failed to download some report cards');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEmail = async () => {
    if (students.length === 0) {
      setError('No students found for the selected criteria');
      return;
    }

    try {
      setLoading(true);
      setSuccess('Sending report cards to parents via email...');
      
      await api.post('/examinations/reports/email', {
        studentIds: students.map(s => s.studentId),
        termId: filters.term,
        academicYearId: filters.academicYear,
      });
      
      setSuccess('Report cards sent to parents via email!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send report cards');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <ReportIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            Generate Report Cards
          </Typography>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        
        {students.length === 0 && filters.class && !loading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No students found for the selected class. This could mean:
            <br />• No students are enrolled in this class
            <br />• Students need to be added to the database
            <br />• Try selecting a different class
            <br /><br />
            <strong>Tip:</strong> Run <code>npm run seed:academic</code> and then manually add students, or use the Students menu to add students.
          </Alert>
        )}

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Select Criteria
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Academic Year"
              name="academicYear"
              value={filters.academicYear}
              onChange={handleFilterChange}
            >
              <MenuItem value="">Select Academic Year</MenuItem>
              {academicYears.map((year) => (
                <MenuItem key={year.academicYearId} value={year.academicYearId}>
                  {year.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Term"
              name="term"
              value={filters.term}
              onChange={handleFilterChange}
            >
              <MenuItem value="">Select Term</MenuItem>
              <MenuItem value="1">First Term</MenuItem>
              <MenuItem value="2">Second Term</MenuItem>
              <MenuItem value="3">Third Term</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Class"
              name="class"
              value={filters.class}
              onChange={handleFilterChange}
            >
              <MenuItem value="">Select Class</MenuItem>
              {classes.map((cls) => (
                <MenuItem key={cls.classId} value={cls.classId}>
                  Class {cls.gradeLevel}{cls.section}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Section"
              name="section"
              value={filters.section}
              onChange={handleFilterChange}
            >
              <MenuItem value="">Select Section</MenuItem>
              <MenuItem value="A">Section A</MenuItem>
              <MenuItem value="B">Section B</MenuItem>
              <MenuItem value="C">Section C</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Student"
              name="student"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <MenuItem value="">All Students</MenuItem>
              {students.length === 0 ? (
                <MenuItem value="" disabled>No students found</MenuItem>
              ) : (
                students.map((student) => (
                  <MenuItem key={student.studentId} value={String(student.studentId)}>
                    {student.rollNumber} - {student.firstName} {student.lastName}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <ReportIcon />}
            onClick={() => handleGenerateReport()}
            disabled={loading || !selectedStudent}
          >
            Generate Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleBulkDownload}
            disabled={loading || students.length === 0}
          >
            Download All (PDF)
          </Button>
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            onClick={handleBulkEmail}
            disabled={loading || students.length === 0}
          >
            Email to Parents
          </Button>
        </Box>
      </Paper>

      {students.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Students ({students.length})
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Roll No</TableCell>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell>{student.rollNumber}</TableCell>
                    <TableCell>{student.studentCode}</TableCell>
                    <TableCell>{student.firstName} {student.lastName}</TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleGenerateReport(student.studentId.toString())}
                        disabled={loading}
                      >
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Report Card Features
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">✓ Subject-wise marks and grades</Typography>
                <Typography variant="body2">✓ Overall GPA calculation</Typography>
                <Typography variant="body2">✓ Attendance percentage</Typography>
                <Typography variant="body2">✓ Teacher remarks</Typography>
                <Typography variant="body2">✓ Class rank and position</Typography>
                <Typography variant="body2">✓ Comparison with previous terms</Typography>
                <Typography variant="body2">✓ Bilingual (English/Nepali)</Typography>
                <Typography variant="body2">✓ Principal's signature</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="outlined" fullWidth onClick={() => navigate('/examinations/grades')}>
                  Enter Grades First
                </Button>
                <Button variant="outlined" fullWidth onClick={() => navigate('/examinations/grading-scheme')}>
                  Configure Grading Scheme
                </Button>
                <Button variant="outlined" fullWidth onClick={() => navigate('/examinations/list')}>
                  View All Exams
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ReportCards;

/**
 * Class Roster - View and manage class students
 * For Class Teachers to view their assigned class students
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface Student {
  studentId: number;
  rollNumber: string;
  firstNameEn: string;
  lastNameEn: string;
  gender: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  address?: string;
  attendanceRate?: number;
  averageGrade?: number;
}

interface ClassInfo {
  classId: number;
  name: string;
  section: string;
  gradeLevel: number;
  totalStudents: number;
}

export function ClassRoster() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassData();
  }, []);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      // Get teacher's assigned class
      const response = await api.get('/teacher/my-class');
      setClassInfo(response.data?.data?.classInfo || null);
      setStudents(response.data?.data?.students || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) =>
    searchQuery === '' ||
    student.firstNameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.lastNameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: students.length,
    male: students.filter((s) => s.gender === 'male').length,
    female: students.filter((s) => s.gender === 'female').length,
    avgAttendance: students.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / (students.length || 1),
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        My Class Roster
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {classInfo && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Class</Typography>
                <Typography variant="h6" fontWeight={600}>
                  {classInfo.name} - {classInfo.section}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Grade Level</Typography>
                <Typography variant="h6" fontWeight={600}>Grade {classInfo.gradeLevel}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Total Students</Typography>
                <Typography variant="h6" fontWeight={600}>{stats.total}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Avg Attendance</Typography>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  {stats.avgAttendance.toFixed(1)}%
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Chip label={`Total: ${stats.total}`} color="primary" />
              <Chip label={`Male: ${stats.male}`} color="info" />
              <Chip label={`Female: ${stats.female}`} color="secondary" />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Roll No</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Parent Contact</TableCell>
              <TableCell>Attendance</TableCell>
              <TableCell>Avg Grade</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Loading...</TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.studentId} hover>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {student.firstNameEn[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {student.firstNameEn} {student.lastNameEn}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={student.gender}
                      size="small"
                      color={student.gender === 'male' ? 'info' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>
                    {student.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{student.phone}</Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.fatherPhone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{student.fatherPhone}</Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${(student.attendanceRate || 0).toFixed(1)}%`}
                      size="small"
                      color={
                        (student.attendanceRate || 0) >= 90
                          ? 'success'
                          : (student.attendanceRate || 0) >= 75
                          ? 'warning'
                          : 'error'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={student.averageGrade ? `${student.averageGrade.toFixed(1)}%` : 'N/A'}
                      size="small"
                      color={
                        (student.averageGrade || 0) >= 80
                          ? 'success'
                          : (student.averageGrade || 0) >= 60
                          ? 'warning'
                          : 'error'
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/students/${student.studentId}`)}
                      title="View Details"
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default ClassRoster;

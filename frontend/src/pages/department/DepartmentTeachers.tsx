/**
 * Department Teachers - View and manage department teachers
 * For Department Heads to supervise their department staff
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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface Teacher {
  staffId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  department: string;
  position: string;
  employmentType: string;
  status: string;
  classCount?: number;
  attendanceRate?: number;
}

interface DepartmentStats {
  totalTeachers: number;
  activeTeachers: number;
  onLeave: number;
  avgAttendance: number;
}

export function DepartmentTeachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<DepartmentStats>({
    totalTeachers: 0,
    activeTeachers: 0,
    onLeave: 0,
    avgAttendance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/department/teachers');
      setTeachers(response.data?.data?.teachers || []);
      setStats(response.data?.data?.stats || stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    searchQuery === '' ||
    teacher.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTeachers = filteredTeachers.filter((t) => t.status === 'active');
  const onLeaveTeachers = filteredTeachers.filter((t) => t.status === 'on_leave');

  const displayTeachers = tab === 0 ? filteredTeachers : tab === 1 ? activeTeachers : onLeaveTeachers;

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Department Teachers
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>{stats.totalTeachers}</Typography>
              <Typography variant="body2" color="text.secondary">Total Teachers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="success.main">{stats.activeTeachers}</Typography>
              <Typography variant="body2" color="text.secondary">Active</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="warning.main">{stats.onLeave}</Typography>
              <Typography variant="body2" color="text.secondary">On Leave</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="info.main">{stats.avgAttendance.toFixed(1)}%</Typography>
              <Typography variant="body2" color="text.secondary">Avg Attendance</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name or position..."
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
      </Paper>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab label={`All (${filteredTeachers.length})`} />
          <Tab label={`Active (${activeTeachers.length})`} />
          <Tab label={`On Leave (${onLeaveTeachers.length})`} />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Teacher</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Classes</TableCell>
              <TableCell>Attendance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : displayTeachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No teachers found
                </TableCell>
              </TableRow>
            ) : (
              displayTeachers.map((teacher) => (
                <TableRow key={teacher.staffId} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {teacher.firstName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {teacher.firstName} {teacher.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {teacher.department}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{teacher.position}</TableCell>
                  <TableCell>
                    {teacher.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="caption">{teacher.email}</Typography>
                      </Box>
                    )}
                    {teacher.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="caption">{teacher.phone}</Typography>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={teacher.classCount || 0} size="small" color="primary" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${(teacher.attendanceRate || 0).toFixed(1)}%`}
                      size="small"
                      color={
                        (teacher.attendanceRate || 0) >= 90
                          ? 'success'
                          : (teacher.attendanceRate || 0) >= 75
                          ? 'warning'
                          : 'error'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={teacher.status}
                      size="small"
                      color={teacher.status === 'active' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/staff/${teacher.staffId}`)}
                      title="View Details"
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="View Schedule"
                    >
                      <ScheduleIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Performance"
                    >
                      <AssessmentIcon fontSize="small" />
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

export default DepartmentTeachers;

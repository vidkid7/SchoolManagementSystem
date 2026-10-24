/**
 * Department Teachers - View and manage department teachers
 * For Department Heads to supervise their department staff
 */

import { useState, useEffect, useCallback } from 'react';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
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
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAdminStyles } from '../../theme/designTokens';
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
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const navigate = useSlugNavigate();
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
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/department/teachers');
      setTeachers(response.data?.data?.teachers || []);
      setStats((currentStats) => response.data?.data?.stats || currentStats);
    } catch (err: unknown) {
      const message = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchTeachers);
  }, [fetchTeachers]);

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
          <Card sx={{ ...S.GLASS }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>{stats.totalTeachers}</Typography>
              <Typography variant="body2" color="text.secondary">Total Teachers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="success.main">{stats.activeTeachers}</Typography>
              <Typography variant="body2" color="text.secondary">Active</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="warning.main">{stats.onLeave}</Typography>
              <Typography variant="body2" color="text.secondary">On Leave</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="info.main">{stats.avgAttendance.toFixed(1)}%</Typography>
              <Typography variant="body2" color="text.secondary">Avg Attendance</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ ...S.GLASS, p: 2, mb: 2 }}>
        <TextField
          fullWidth
          label="Search by name or position"
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

      <Paper sx={{ ...S.GLASS, mb: 2 }}>
        <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)}>
          <Tab label={`All (${filteredTeachers.length})`} />
          <Tab label={`Active (${activeTeachers.length})`} />
          <Tab label={`On Leave (${onLeaveTeachers.length})`} />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: S.TH_BG }}>
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
              <TableRow sx={S.TR_HOVER}>
                <TableCell colSpan={7} align="center" sx={S.TD}>Loading...</TableCell>
              </TableRow>
            ) : displayTeachers.length === 0 ? (
              <TableRow sx={S.TR_HOVER}>
                <TableCell colSpan={7} align="center" sx={S.TD}>
                  No teachers found
                </TableCell>
              </TableRow>
            ) : (
              displayTeachers.map((teacher) => (
                <TableRow key={teacher.staffId} hover sx={S.TR_HOVER}>
                  <TableCell sx={S.TD}>
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
                  <TableCell sx={S.TD}>{teacher.position}</TableCell>
                  <TableCell sx={S.TD}>
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
                  <TableCell sx={S.TD}>
                    <Chip label={teacher.classCount || 0} size="small" color="primary" />
                  </TableCell>
                  <TableCell sx={S.TD}>
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
                  <TableCell sx={S.TD}>
                    <Chip
                      label={teacher.status}
                      size="small"
                      color={teacher.status === 'active' ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell align="center" sx={S.TD}>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedTeacher(teacher)}
                      aria-label={`View details for ${teacher.firstName} ${teacher.lastName}`}
                      title="View Details"
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate('/academic/timetable')}
                      aria-label={`View schedule for ${teacher.firstName} ${teacher.lastName}`}
                      title="View Schedule"
                    >
                      <ScheduleIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate('/portal/department-head')}
                      aria-label={`View department performance for ${teacher.firstName} ${teacher.lastName}`}
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
      <Dialog open={Boolean(selectedTeacher)} onClose={() => setSelectedTeacher(null)} aria-labelledby="teacher-details-title">
        <DialogTitle id="teacher-details-title">Teacher Details</DialogTitle>
        <DialogContent dividers>
          {selectedTeacher && (
            <Box sx={{ minWidth: { sm: 360 }, display: 'grid', gap: 1 }}>
              <Typography><strong>Name:</strong> {selectedTeacher.firstName} {selectedTeacher.lastName}</Typography>
              <Typography><strong>Position:</strong> {selectedTeacher.position}</Typography>
              <Typography><strong>Department:</strong> {selectedTeacher.department}</Typography>
              <Typography><strong>Email:</strong> {selectedTeacher.email || '—'}</Typography>
              <Typography><strong>Phone:</strong> {selectedTeacher.phone || '—'}</Typography>
              <Typography><strong>Status:</strong> {selectedTeacher.status}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTeacher(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DepartmentTeachers;

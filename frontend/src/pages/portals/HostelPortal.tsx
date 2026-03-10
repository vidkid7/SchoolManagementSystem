import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Hotel as HostelIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  Description as DocIcon,
  Notifications as AnnouncementIcon,
  Person as PersonIcon,
  CheckCircle as ActiveIcon,
  BeachAccess as LeaveIcon,
  Warning as IncidentIcon,
  CheckCircleOutline as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';

interface DashboardData {
  summary: {
    totalStudents: number;
    activeStudents: number;
    role: string;
  };
  quickLinks: Array<{ label: string; path: string }>;
}

interface ProfileData {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  status: string;
}

interface Resident {
  id?: number;
  studentId?: number;
  firstNameEn?: string;
  lastNameEn?: string;
  studentCode?: string;
}

interface LeaveRequest {
  leaveId: number;
  studentId: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}

interface AttendanceSummary {
  date: string;
  totalResidents: number;
  present: number;
  absent: number;
  attendanceRate: number;
}

interface IncidentSummary {
  summary: {
    totalIncidents: number;
    rejectedLeaves: number;
    flaggedStudents: number;
  };
  incidents: Array<{
    type: string;
    count: number;
    severity: 'medium' | 'high';
    description: string;
  }>;
}

const HostelPortal: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [incidents, setIncidents] = useState<IncidentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const headers = { Authorization: `Bearer ${accessToken}` };
        const [dashboardRes, profileRes, residentsRes, leaveRes, attendanceRes, incidentsRes] = await Promise.all([
          apiClient.get('/api/v1/hostel/dashboard', { headers }),
          apiClient.get('/api/v1/hostel/profile', { headers }).catch(() => ({ data: { data: null } })),
          apiClient.get('/api/v1/hostel/residents', { params: { limit: 10 }, headers }).catch(() => ({ data: { data: { rows: [] } } })),
          apiClient.get('/api/v1/hostel/leave-requests', { params: { status: 'pending', limit: 10 }, headers }).catch(() => ({ data: { data: [] } })),
          apiClient.get('/api/v1/hostel/attendance', { headers }).catch(() => ({ data: { data: null } })),
          apiClient.get('/api/v1/hostel/incidents', { headers }).catch(() => ({ data: { data: null } })),
        ]);
        setData(dashboardRes.data.data);
        setProfile(profileRes.data?.data ?? null);
        const list = residentsRes.data?.data;
        setResidents(Array.isArray(list) ? list : list?.students ?? []);
        setLeaveRequests(Array.isArray(leaveRes.data?.data) ? leaveRes.data.data : []);
        setAttendance(attendanceRes.data?.data ?? null);
        setIncidents(incidentsRes.data?.data ?? null);
      } catch {
        setError('Failed to load hostel dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [accessToken]);

  const handleLeaveAction = async (leaveId: number, action: 'approve' | 'reject') => {
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      await apiClient.put(`/api/v1/hostel/leave-requests/${leaveId}/${action}`, {}, { headers });
      setActionMsg(`Leave ${action}d successfully`);
      setLeaveRequests((prev) => prev.filter((l) => l.leaveId !== leaveId));
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      setActionMsg(`Failed to ${action} leave`);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
          <HostelIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>Hostel Portal</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user?.firstName || user?.username} — Hostel Warden
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {actionMsg && <Alert severity="info" sx={{ mb: 2 }}>{actionMsg}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{data?.summary.totalStudents ?? '--'}</Typography>
              <Typography variant="body2" color="text.secondary">Total Students</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ActiveIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{attendance?.present ?? data?.summary.activeStudents ?? '--'}</Typography>
              <Typography variant="body2" color="text.secondary">Present Today</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <LeaveIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{leaveRequests.length}</Typography>
              <Typography variant="body2" color="text.secondary">Pending Leaves</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <IncidentIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{incidents?.summary.totalIncidents ?? 0}</Typography>
              <Typography variant="body2" color="text.secondary">Incidents</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Quick Access</Typography>
              <Divider sx={{ mb: 1 }} />
              <List dense>
                <ListItem button onClick={() => navigate('/students')}>
                  <ListItemIcon><PeopleIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="Student List" secondary="View all enrolled students" />
                </ListItem>
                <ListItem button onClick={() => navigate('/communication/messages')}>
                  <ListItemIcon><MessageIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="Messages" secondary="View and send messages" />
                </ListItem>
                <ListItem button onClick={() => navigate('/communication/announcements')}>
                  <ListItemIcon><AnnouncementIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="Announcements" secondary="School-wide announcements" />
                </ListItem>
                <ListItem button onClick={() => navigate('/calendar')}>
                  <ListItemIcon><CalendarIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="Calendar" secondary="Academic calendar and events" />
                </ListItem>
                <ListItem button onClick={() => navigate('/documents')}>
                  <ListItemIcon><DocIcon color="secondary" /></ListItemIcon>
                  <ListItemText primary="Documents" secondary="Access school documents" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={600}>My Profile</Typography>
                <Chip label={profile?.role || 'Hostel Warden'} color="secondary" size="small" />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Name</Typography>
                      <Typography variant="body1">{(profile?.firstName && profile?.lastName) ? `${profile.firstName} ${profile.lastName}` : (user?.firstName && user?.lastName) ? `${user.firstName} ${user.lastName}` : user?.username}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <HostelIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{profile?.email ?? user?.email ?? '—'}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              <Box mt={2}>
                <Button variant="outlined" color="secondary" size="small" onClick={() => navigate('/communication/messages')}>
                  Contact Admin
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Resident Students</Typography>
              <Divider sx={{ mb: 1 }} />
              {residents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No residents listed. Use dashboard totals above.</Typography>
              ) : (
                <List dense>
                  {residents.slice(0, 5).map((r) => (
                    <ListItem key={r.studentId ?? r.id ?? 0} dense>
                      <ListItemIcon><PersonIcon fontSize="small" color="action" /></ListItemIcon>
                      <ListItemText primary={`${r.firstNameEn ?? ''} ${r.lastNameEn ?? ''}`.trim() || r.studentCode || `#${r.studentId ?? r.id}`} />
                    </ListItem>
                  ))}
                  {residents.length > 5 && <ListItem><ListItemText primary={`+${residents.length - 5} more`} /></ListItem>}
                </List>
              )}
              <Button size="small" sx={{ mt: 1 }} color="secondary" onClick={() => navigate('/students')}>View all students</Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <IncidentIcon color="error" />
                <Typography variant="h6" fontWeight={600}>Incidents &amp; Alerts</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              {!incidents || incidents.incidents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No active incidents.</Typography>
              ) : (
                incidents.incidents.map((inc, i) => (
                  <Box key={i} display="flex" alignItems="center" justifyContent="space-between" py={0.5}>
                    <Typography variant="body2">{inc.description}</Typography>
                    <Chip label={inc.severity} color={inc.severity === 'high' ? 'error' : 'warning'} size="small" />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <LeaveIcon color="warning" />
                <Typography variant="h6" fontWeight={600}>Pending Leave Requests</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              {leaveRequests.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No pending leave requests.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student ID</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaveRequests.map((leave) => (
                      <TableRow key={leave.leaveId}>
                        <TableCell>{leave.studentId}</TableCell>
                        <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>{leave.reason}</TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Button size="small" color="success" variant="outlined" startIcon={<ApproveIcon />} onClick={() => handleLeaveAction(leave.leaveId, 'approve')}>Approve</Button>
                            <Button size="small" color="error" variant="outlined" startIcon={<RejectIcon />} onClick={() => handleLeaveAction(leave.leaveId, 'reject')}>Reject</Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HostelPortal;

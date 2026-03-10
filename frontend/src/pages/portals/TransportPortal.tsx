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
} from '@mui/material';
import {
  DirectionsBus as BusIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  Description as DocIcon,
  Notifications as AnnouncementIcon,
  Person as PersonIcon,
  CheckCircle as ActiveIcon,
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

interface TransportStudent {
  id?: number;
  studentId?: number;
  firstNameEn?: string;
  lastNameEn?: string;
  studentCode?: string;
}

const TransportPortal: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [students, setStudents] = useState<TransportStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashboardRes, profileRes, studentsRes] = await Promise.all([
          apiClient.get('/api/v1/transport/dashboard', { headers: { Authorization: `Bearer ${accessToken}` } }),
          apiClient.get('/api/v1/transport/profile', { headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => ({ data: { data: null } })),
          apiClient.get('/api/v1/transport/students', { params: { limit: 10 }, headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => ({ data: { data: { rows: [] } } })),
        ]);
        setData(dashboardRes.data.data);
        setProfile(profileRes.data?.data ?? null);
        const list = studentsRes.data?.data;
        setStudents(Array.isArray(list) ? list : list?.students ?? []);
      } catch {
        setError('Failed to load transport dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [accessToken]);

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
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          <BusIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>Transport Portal</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user?.firstName || user?.username} — Transport Manager
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{data?.summary.totalStudents ?? '--'}</Typography>
              <Typography variant="body2" color="text.secondary">Total Students</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ActiveIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight={700}>{data?.summary.activeStudents ?? '--'}</Typography>
              <Typography variant="body2" color="text.secondary">Active Students</Typography>
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
                  <ListItemIcon><PeopleIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Student List" secondary="View all enrolled students" />
                </ListItem>
                <ListItem button onClick={() => navigate('/communication/messages')}>
                  <ListItemIcon><MessageIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Messages" secondary="View and send messages" />
                </ListItem>
                <ListItem button onClick={() => navigate('/communication/announcements')}>
                  <ListItemIcon><AnnouncementIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Announcements" secondary="School-wide announcements" />
                </ListItem>
                <ListItem button onClick={() => navigate('/calendar')}>
                  <ListItemIcon><CalendarIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Calendar" secondary="Academic calendar and events" />
                </ListItem>
                <ListItem button onClick={() => navigate('/documents')}>
                  <ListItemIcon><DocIcon color="primary" /></ListItemIcon>
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
                <Chip label={profile?.role || 'Transport Manager'} color="primary" size="small" />
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
                    <BusIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body1">{profile?.email ?? user?.email ?? '—'}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              <Box mt={2}>
                <Button variant="outlined" size="small" onClick={() => navigate('/communication/messages')}>
                  Contact Admin
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Students on Transport</Typography>
              <Divider sx={{ mb: 1 }} />
              {students.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No students listed. Use dashboard totals above.</Typography>
              ) : (
                <List dense>
                  {students.slice(0, 5).map((s) => (
                    <ListItem key={(s as { studentId?: number }).studentId ?? s.id} dense>
                      <ListItemIcon><PersonIcon fontSize="small" color="action" /></ListItemIcon>
                      <ListItemText primary={`${s.firstNameEn ?? ''} ${s.lastNameEn ?? ''}`.trim() || s.studentCode || `#${(s as { studentId?: number }).studentId ?? s.id}`} />
                    </ListItem>
                  ))}
                  {students.length > 5 && <ListItem><ListItemText primary={`+${students.length - 5} more`} /></ListItem>}
                </List>
              )}
              <Button size="small" sx={{ mt: 1 }} onClick={() => navigate('/students')}>View all students</Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TransportPortal;

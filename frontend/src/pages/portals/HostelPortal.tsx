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
  Hotel as HostelIcon,
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

const HostelPortal: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiClient.get('/api/v1/hostel/dashboard', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setData(response.data.data);
      } catch {
        setError('Failed to load hostel dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
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

        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={600}>My Profile</Typography>
                <Chip label="Hostel Warden" color="secondary" size="small" />
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Name</Typography>
                      <Typography variant="body1">{user?.firstName} {user?.lastName}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <HostelIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Role</Typography>
                      <Typography variant="body1">Hostel Warden</Typography>
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
      </Grid>
    </Box>
  );
};

export default HostelPortal;

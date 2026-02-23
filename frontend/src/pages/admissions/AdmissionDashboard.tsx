/**
 * Admission Dashboard
 * Overview of admission statistics and quick actions
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  PersonAdd as InquiryIcon,
  Assignment as ApplicationIcon,
  School as AdmittedIcon,
  CheckCircle as EnrolledIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

interface AdmissionStats {
  totalInquiries: number;
  totalApplications: number;
  totalAdmitted: number;
  totalEnrolled: number;
  totalRejected: number;
  pendingTests: number;
  pendingInterviews: number;
}

export function AdmissionDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdmissionStats>({
    totalInquiries: 0,
    totalApplications: 0,
    totalAdmitted: 0,
    totalEnrolled: 0,
    totalRejected: 0,
    pendingTests: 0,
    pendingInterviews: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admissions/reports');
      setStats(response.data?.data || stats);
    } catch (error) {
      console.error('Failed to fetch admission stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Inquiries',
      value: stats.totalInquiries,
      icon: <InquiryIcon sx={{ fontSize: 40 }} />,
      color: '#2196f3',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Applications',
      value: stats.totalApplications,
      icon: <ApplicationIcon sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      bgColor: '#fff3e0',
    },
    {
      title: 'Admitted',
      value: stats.totalAdmitted,
      icon: <AdmittedIcon sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      bgColor: '#e8f5e9',
    },
    {
      title: 'Enrolled',
      value: stats.totalEnrolled,
      icon: <EnrolledIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      bgColor: '#f3e5f5',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={600}>
              Admission Management Dashboard
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<InquiryIcon />}
            onClick={() => navigate('/admissions/new')}
          >
            New Inquiry
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: card.bgColor,
                      color: card.color,
                      p: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pending Actions
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Pending Tests</Typography>
                <Typography fontWeight={600}>{stats.pendingTests}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Pending Interviews</Typography>
                <Typography fontWeight={600}>{stats.pendingInterviews}</Typography>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/admissions/list')}
                sx={{ mt: 2 }}
              >
                View All Admissions
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/admissions/new')}
              >
                Create New Inquiry
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/admissions/list?status=inquiry')}
              >
                View Inquiries
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/admissions/list?status=applied')}
              >
                View Applications
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/admissions/list?status=admitted')}
              >
                View Admitted Students
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdmissionDashboard;

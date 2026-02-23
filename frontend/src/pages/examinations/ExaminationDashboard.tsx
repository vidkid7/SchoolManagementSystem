/**
 * Examination Dashboard
 * Overview of examination statistics and quick actions
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
  Assignment as ExamIcon,
  Schedule as ScheduleIcon,
  Grade as GradeIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

interface ExamStats {
  totalExams: number;
  scheduledExams: number;
  ongoingExams: number;
  completedExams: number;
  pendingGrades: number;
  publishedResults: number;
}

export function ExaminationDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ExamStats>({
    totalExams: 0,
    scheduledExams: 0,
    ongoingExams: 0,
    completedExams: 0,
    pendingGrades: 0,
    publishedResults: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    
    try {
      const response = await api.get('/examinations');
      const exams = response.data?.data || [];
      
      const stats: ExamStats = {
        totalExams: exams.length,
        scheduledExams: exams.filter((e: any) => e.status === 'scheduled').length,
        ongoingExams: exams.filter((e: any) => e.status === 'ongoing').length,
        completedExams: exams.filter((e: any) => e.status === 'completed').length,
        pendingGrades: exams.filter((e: any) => e.status === 'ongoing' || e.status === 'completed').length,
        publishedResults: exams.filter((e: any) => e.status === 'completed').length,
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Failed to fetch examination stats:', error);
      setStats({
        totalExams: 0,
        scheduledExams: 0,
        ongoingExams: 0,
        completedExams: 0,
        pendingGrades: 0,
        publishedResults: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Exams',
      value: stats.totalExams,
      icon: <ExamIcon sx={{ fontSize: 40 }} />,
      color: '#2196f3',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Scheduled',
      value: stats.scheduledExams,
      icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      bgColor: '#fff3e0',
    },
    {
      title: 'Ongoing',
      value: stats.ongoingExams,
      icon: <TrendIcon sx={{ fontSize: 40 }} />,
      color: '#f44336',
      bgColor: '#ffebee',
    },
    {
      title: 'Completed',
      value: stats.completedExams,
      icon: <GradeIcon sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      bgColor: '#e8f5e9',
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
            <ReportIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={600}>
              Examination Management Dashboard
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<ExamIcon />}
            onClick={() => navigate('/examinations/create')}
          >
            Create Exam
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
                <Typography>Pending Grade Entry</Typography>
                <Typography fontWeight={600}>{stats.pendingGrades}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Results to Publish</Typography>
                <Typography fontWeight={600}>{stats.completedExams - stats.publishedResults}</Typography>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/examinations/grades')}
                sx={{ mt: 2 }}
              >
                Enter Grades
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
                onClick={() => navigate('/examinations/create')}
              >
                Create New Exam
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/examinations/list')}
              >
                Manage Exam Schedule
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/examinations/grades')}
              >
                Enter/View Grades
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/examinations/reports')}
              >
                Generate Report Cards
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/examinations/grading-scheme')}
              >
                Configure Grading Scheme
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ExaminationDashboard;

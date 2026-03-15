/**
 * Examination Dashboard
 * Overview of examination statistics and quick actions
 */

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { C, useAdminStyles, R } from '../../theme/designTokens';
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
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';

interface ExamStats {
  totalExams: number;
  scheduledExams: number;
  ongoingExams: number;
  completedExams: number;
  pendingGrades: number;
  publishedResults: number;
}

export function ExaminationDashboard() {
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ExamStats>({
    totalExams: 0,
    scheduledExams: 0,
    ongoingExams: 0,
    completedExams: 0,
    pendingGrades: 0,
    publishedResults: 0,
  });
  const [scheduleCount, setScheduleCount] = useState<number | null>(null);

  useEffect(() => {
    fetchStats();
    fetchScheduleCount();
  }, []);

  const fetchScheduleCount = async () => {
    try {
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 2);
      const res = await apiClient.get('/exam-schedules/by-date-range', {
        params: { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] },
      });
      const list = res.data?.data || [];
      setScheduleCount(Array.isArray(list) ? list.length : 0);
    } catch {
      setScheduleCount(null);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    
    try {
      const response = await apiClient.get('/examinations');
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
      title: t('examinations.totalExams'),
      value: stats.totalExams,
      icon: <ExamIcon sx={{ fontSize: 40 }} />,
      color: C.primary,
      bgColor: C.primaryBg,
    },
    {
      title: t('examinations.scheduled'),
      value: stats.scheduledExams,
      icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
      color: C.neutral,
      bgColor: C.neutralBg,
    },
    {
      title: t('examinations.ongoing'),
      value: stats.ongoingExams,
      icon: <TrendIcon sx={{ fontSize: 40 }} />,
      color: C.danger,
      bgColor: C.dangerBg,
    },
    {
      title: t('examinations.completed'),
      value: stats.completedExams,
      icon: <GradeIcon sx={{ fontSize: 40 }} />,
      color: C.primary,
      bgColor: C.primaryBg,
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
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ReportIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={600}>
              {t('examinations.examinationManagementDashboard')}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<ExamIcon />}
            onClick={() => navigate('/examinations/create')}
            sx={S.BTN_PRIMARY}
          >
            {t('examinations.createExam')}
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ ...S.GLASS, height: '100%' }}>
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
                      borderRadius: R.lg,
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
          <Paper sx={{ ...S.GLASS, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('examinations.pendingActions')}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>{t('examinations.pendingGradeEntry')}</Typography>
                <Typography fontWeight={600}>{stats.pendingGrades}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>{t('examinations.resultsToPublish')}</Typography>
                <Typography fontWeight={600}>{stats.completedExams - stats.publishedResults}</Typography>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/examinations/grades')}
                sx={{ mt: 2, ...S.BTN_OUTLINE }}
              >
                {t('examinations.enterGrades')}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ ...S.GLASS, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('examinations.quickActions')}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/examinations/create')}
                sx={S.BTN_OUTLINE}
              >
                {t('examinations.createNewExam')}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/examinations/list')}
                sx={S.BTN_OUTLINE}
              >
                {t('examinations.manageExamSchedule')}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/examinations/grades')}
                sx={S.BTN_OUTLINE}
              >
                {t('examinations.enterViewGrades')}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/examinations/reports')}
                sx={S.BTN_OUTLINE}
              >
                {t('examinations.generateReportCards')}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/examinations/grading-scheme')}
                sx={S.BTN_OUTLINE}
              >
                {t('examinations.configureGradingScheme')}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ExaminationDashboard;

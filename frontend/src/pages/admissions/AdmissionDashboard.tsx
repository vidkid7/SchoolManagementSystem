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
  useTheme,
} from '@mui/material';
import {
  PersonAdd as InquiryIcon,
  Assignment as ApplicationIcon,
  School as AdmittedIcon,
  CheckCircle as EnrolledIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import api from '../../config/api';

import { useTranslation } from 'react-i18next';

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
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
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
      title: t('admissions.totalInquiries'),
      value: stats.totalInquiries,
      icon: <InquiryIcon sx={{ fontSize: 40 }} />,
      color: C.primary,
      bgColor: C.primaryBg,
    },
    {
      title: t('admissions.applications'),
      value: stats.totalApplications,
      icon: <ApplicationIcon sx={{ fontSize: 40 }} />,
      color: C.warning,
      bgColor: C.warningBg,
    },
    {
      title: t('admissions.admitted'),
      value: stats.totalAdmitted,
      icon: <AdmittedIcon sx={{ fontSize: 40 }} />,
      color: C.success,
      bgColor: C.successBg,
    },
    {
      title: t('admissions.enrolled'),
      value: stats.totalEnrolled,
      icon: <EnrolledIcon sx={{ fontSize: 40 }} />,
      color: C.purple,
      bgColor: C.purpleBg,
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
      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={600}>
              {t('admissions.dashboardTitle')}
            </Typography>
          </Box>
          <Button
            variant="contained" sx={S.BTN_PRIMARY}
            startIcon={<InquiryIcon />}
            onClick={() => navigate('/admissions/new')}
          >
            {t('admissions.newInquiry')}
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
              {t('admissions.pendingActions')}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>{t('admissions.pendingTests')}</Typography>
                <Typography fontWeight={600}>{stats.pendingTests}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>{t('admissions.pendingInterviews')}</Typography>
                <Typography fontWeight={600}>{stats.pendingInterviews}</Typography>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/admissions/list')}
                sx={{ ...S.BTN_OUTLINE,  mt: 2 }}
              >
                {t('admissions.viewAllAdmissions')}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ ...S.GLASS, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('admissions.quickActions')}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                fullWidth
                onClick={() => navigate('/admissions/new')}
              >
                {t('admissions.createNewInquiry')}
              </Button>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                fullWidth
                onClick={() => navigate('/admissions/list?status=inquiry')}
              >
                {t('admissions.viewInquiries')}
              </Button>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                fullWidth
                onClick={() => navigate('/admissions/list?status=applied')}
              >
                {t('admissions.viewApplications')}
              </Button>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                fullWidth
                onClick={() => navigate('/admissions/list?status=admitted')}
              >
                {t('admissions.viewAdmittedStudents')}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdmissionDashboard;

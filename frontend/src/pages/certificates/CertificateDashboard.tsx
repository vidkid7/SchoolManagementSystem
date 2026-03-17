/**
 * Certificate Dashboard
 * 
 * Overview of certificate management system with statistics and quick actions
 * 
 * Requirements: 25.1, 25.2, 25.3
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import { C, useAdminStyles } from '../../theme/designTokens';
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  QrCode as QrCodeIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';

import { useTranslation } from 'react-i18next';

interface CertificateStats {
  totalCertificates: number;
  activeCertificates: number;
  revokedCertificates: number;
  certificatesThisMonth: number;
  certificatesByType: Record<string, number>;
  recentCertificates: Array<{
    certificateNumber: string;
    studentName: string;
    type: string;
    issuedDate: string;
  }>;
}

export const CertificateDashboard = () => {
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/api/v1/certificates/stats');
      const data = response.data.data;
      setStats({
        totalCertificates: data.total || 0,
        activeCertificates: data.active || 0,
        revokedCertificates: data.revoked || 0,
        certificatesThisMonth: data.thisMonth || 0,
        certificatesByType: data.byType || {},
        recentCertificates: data.recent || [],
      });
    } catch (err: any) {
      console.error('Failed to fetch certificate stats:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to load statistics';
      setError(errorMessage);
      // Set default empty stats on error
      setStats({
        totalCertificates: 0,
        activeCertificates: 0,
        revokedCertificates: 0,
        certificatesThisMonth: 0,
        certificatesByType: {},
        recentCertificates: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          {t('certificates.dashboardTitle')}
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <br />
          <Typography variant="caption">
            {t('certificates.errorHelp')}
          </Typography>
        </Alert>
        <Button variant="outlined" onClick={fetchStats} sx={{ ...S.BTN_OUTLINE,  mt: 2 }}>
          {t('common.retry')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DescriptionIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{t('certificates.dashboardTitle')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('certificates.subtitle')}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined" sx={S.BTN_OUTLINE}
              startIcon={<QrCodeIcon />}
              onClick={() => navigate('/certificates/verify')}
            >
              {t('certificates.verify')}
            </Button>
            <Button
              sx={S.BTN_PRIMARY}
              startIcon={<AddIcon />}
              onClick={() => navigate('/certificates/manage')}
            >
              {t('certificates.manageCertificates')}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    {t('certificates.totalCertificates')}
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {stats?.totalCertificates || 0}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: C.primaryBg, color: C.primary, p: 1.5, borderRadius: 2, display: 'flex' }}>
                  <DescriptionIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    {t('certificates.activeCertificates')}
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {stats?.activeCertificates || 0}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: C.successBg, color: C.success, p: 1.5, borderRadius: 2, display: 'flex' }}>
                  <CheckCircleIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    {t('certificates.revokedCertificates')}
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {stats?.revokedCertificates || 0}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: C.dangerBg, color: C.danger, p: 1.5, borderRadius: 2, display: 'flex' }}>
                  <CancelIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    {t('certificates.thisMonth')}
                  </Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {stats?.certificatesThisMonth || 0}
                  </Typography>
                </Box>
                <Box sx={{ backgroundColor: C.infoBg, color: C.info, p: 1.5, borderRadius: 2, display: 'flex' }}>
                  <TrendingUpIcon sx={{ fontSize: 32 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Certificates by Type */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('certificates.byType')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {stats?.certificatesByType && Object.entries(stats.certificatesByType).map(([type, count]) => (
                  <Box
                    key={type}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    <Typography>{type.replace(/_/g, ' ').toUpperCase()}</Typography>
                    <Typography fontWeight="bold">{count}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Certificates */}
        <Grid item xs={12} md={6}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('certificates.recentCertificates')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {stats?.recentCertificates && stats.recentCertificates.length > 0 ? (
                  stats.recentCertificates.map((cert, index) => (
                    <Box
                      key={index}
                      sx={{
                        py: 1,
                        borderBottom: '1px solid #e0e0e0',
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {cert.certificateNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cert.studentName} - {cert.type}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {new Date(cert.issuedDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">{t('certificates.noRecentCertificates')}</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('certificates.quickActions')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined" sx={S.BTN_OUTLINE}
                  onClick={() => navigate('/certificates/manage?tab=0')}
                >
                  {t('certificates.manageTemplates')}
                </Button>
                <Button
                  variant="outlined" sx={S.BTN_OUTLINE}
                  onClick={() => navigate('/certificates/manage?tab=2')}
                >
                  {t('certificates.generateCertificate')}
                </Button>
                <Button
                  variant="outlined" sx={S.BTN_OUTLINE}
                  onClick={() => navigate('/certificates/manage?tab=1')}
                >
                  {t('certificates.viewAllCertificates')}
                </Button>
                <Button
                  variant="outlined" sx={S.BTN_OUTLINE}
                  startIcon={<QrCodeIcon />}
                  onClick={() => navigate('/certificates/verify')}
                >
                  {t('certificates.verify')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

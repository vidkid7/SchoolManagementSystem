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
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Add as AddIcon,
  QrCode as QrCodeIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

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
  const navigate = useNavigate();
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
          Certificate Dashboard / प्रमाणपत्र ड्यासबोर्ड
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <br />
          <Typography variant="caption">
            Please ensure the backend server is running and the API endpoints are accessible.
          </Typography>
        </Alert>
        <Button variant="outlined" onClick={fetchStats} sx={{ mt: 2 }}>
          Retry / पुन: प्रयास गर्नुहोस्
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Certificate Dashboard / प्रमाणपत्र ड्यासबोर्ड
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<QrCodeIcon />}
            onClick={() => navigate('/certificates/verify')}
          >
            Verify / प्रमाणित गर्नुहोस्
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/certificates/manage')}
          >
            Manage Certificates / प्रमाणपत्र व्यवस्थापन
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Certificates
                  </Typography>
                  <Typography variant="h4">
                    {stats?.totalCertificates || 0}
                  </Typography>
                </Box>
                <DescriptionIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Active Certificates
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats?.activeCertificates || 0}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Revoked Certificates
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats?.revokedCertificates || 0}
                  </Typography>
                </Box>
                <CancelIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    This Month
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats?.certificatesThisMonth || 0}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Certificates by Type */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Certificates by Type / प्रकार अनुसार
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
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Certificates / हालैका प्रमाणपत्र
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
                  <Typography color="text.secondary">No recent certificates</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions / द्रुत कार्यहरू
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/certificates/manage?tab=0')}
                >
                  Manage Templates / टेम्पलेट व्यवस्थापन
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/certificates/manage?tab=2')}
                >
                  Generate Certificate / प्रमाणपत्र उत्पन्न गर्नुहोस्
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/certificates/manage?tab=1')}
                >
                  View All Certificates / सबै प्रमाणपत्र हेर्नुहोस्
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<QrCodeIcon />}
                  onClick={() => navigate('/certificates/verify')}
                >
                  Verify Certificate / प्रमाणपत्र प्रमाणित गर्नुहोस्
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

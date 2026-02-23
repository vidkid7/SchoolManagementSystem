/**
 * Student Certificates Page
 * 
 * Display available certificates for students and support PDF download
 * 
 * Requirements: 25.6
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  IconButton,
  Chip,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface StudentCertificate {
  id: number;
  certificateNumber: string;
  type: string;
  templateName: string;
  issuedDate: string;
  issuedDateBS: string;
  status: 'active' | 'revoked';
  pdfUrl?: string;
}

export const StudentCertificates = () => {
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedCertificate, setSelectedCertificate] = useState<StudentCertificate | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCertificates();
  }, []);

const fetchCertificates = async () => {
    try {
      setLoading(true);
      // Get current student ID from auth context or localStorage
      const studentId = localStorage.getItem('studentId') || '1'; // Fallback for demo
      const response = await apiClient.get(`/api/v1/certificates/student/${studentId}`);
      setCertificates(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
      setError('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (certificate: StudentCertificate) => {
    if (certificate.pdfUrl) {
      window.open(certificate.pdfUrl, '_blank');
    }
  };

  const handleView = (certificate: StudentCertificate) => {
    setSelectedCertificate(certificate);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      character: 'Character Certificate',
      transfer: 'Transfer Certificate',
      academic_excellence: 'Academic Excellence',
      eca: 'ECA Participation/Achievement',
      sports: 'Sports Participation/Achievement',
      course_completion: 'Course Completion',
      bonafide: 'Bonafide Certificate',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'revoked': return 'error';
      default: return 'default';
    }
  };

  const activeCertificates = certificates.filter(c => c.status === 'active');
  const revokedCertificates = certificates.filter(c => c.status === 'revoked');
  const displayedCertificates = selectedTab === 0 ? activeCertificates : revokedCertificates;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          My Certificates / मेरा प्रमाणपत्रहरू
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
          <Tab label={`Available / उपलब्ध (${activeCertificates.length})`} />
          <Tab label={`Revoked / रद्द (${revokedCertificates.length})`} />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : displayedCertificates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DescriptionIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Certificates Available / कुनै प्रमाणपत्र उपलब्ध छैन
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedTab === 0 
              ? 'You have not received any certificates yet.'
              : 'No revoked certificates.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Certificate No. / प्रमाणपत्र नं.</TableCell>
                <TableCell>Type / प्रकार</TableCell>
                <TableCell>Issued Date / जारी मिति</TableCell>
                <TableCell>Status / स्थिति</TableCell>
                <TableCell align="right">Actions / कार्यहरू</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedCertificates.map((cert) => (
                <TableRow key={cert.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {cert.certificateNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getTypeLabel(cert.type)}
                    </Typography>
                    {cert.templateName && (
                      <Typography variant="caption" color="text.secondary">
                        {cert.templateName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {cert.issuedDateBS} BS
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {cert.issuedDate} AD
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cert.status}
                      color={getStatusColor(cert.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      title="View Details"
                      onClick={() => handleView(cert)}
                    >
                      <ViewIcon />
                    </IconButton>
                    {cert.pdfUrl && cert.status === 'active' && (
                      <IconButton
                        size="small"
                        title="Download PDF"
                        color="primary"
                        onClick={() => handleDownload(cert)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Certificate Details Dialog */}
      {selectedCertificate && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
          }}
          onClick={() => setSelectedCertificate(null)}
        >
          <Paper sx={{ maxWidth: 600, width: '90%', maxHeight: '90vh', overflow: 'auto', m: 2 }} onClick={(e) => e.stopPropagation()}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  Certificate Details / प्रमाणपत्र विवरण
                </Typography>
                <IconButton onClick={() => setSelectedCertificate(null)}>
                  <DownloadIcon />
                </IconButton>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert 
                    severity={selectedCertificate.status === 'active' ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                  >
                    Certificate {selectedCertificate.status === 'active' ? 'is valid' : 'has been revoked'}
                  </Alert>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Certificate Number
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedCertificate.certificateNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedCertificate.status}
                    color={getStatusColor(selectedCertificate.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Certificate Type
                  </Typography>
                  <Typography variant="body1">
                    {getTypeLabel(selectedCertificate.type)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Issued Date (BS)
                  </Typography>
                  <Typography variant="body1">
                    {selectedCertificate.issuedDateBS}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Issued Date (AD)
                  </Typography>
                  <Typography variant="body1">
                    {selectedCertificate.issuedDate}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={() => setSelectedCertificate(null)}>
                  Close / बन्द गर्नुहोस्
                </Button>
                {selectedCertificate.pdfUrl && selectedCertificate.status === 'active' && (
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      handleDownload(selectedCertificate);
                      setSelectedCertificate(null);
                    }}
                  >
                    Download PDF / पीडीएफ डाउनलोड गर्नुहोस्
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="primary">
                {activeCertificates.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available Certificates / उपलब्ध प्रमाणपत्र
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="error.main">
                {revokedCertificates.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Revoked Certificates / रद्द प्रमाणपत्र
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h3" color="text.primary">
                {certificates.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Certificates / कुल प्रमाणपत्र
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
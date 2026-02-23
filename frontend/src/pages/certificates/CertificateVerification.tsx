/**
 * Certificate Verification Page (Public)
 * 
 * Support QR code scanning, certificate number lookup, and display certificate details
 * 
 * Requirements: 25.7
 */

import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  QrCodeScanner as QrCodeIcon,
  Search as SearchIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface CertificateVerificationResult {
  valid: boolean;
  certificate: {
    id: number;
    certificateNumber: string;
    studentName: string;
    type: string;
    issuedDate: string;
    issuedDateBS: string;
    templateName: string;
    status: string;
    schoolName?: string;
    schoolAddress?: string;
  } | null;
  message: string;
  verifiedAt: string;
}

export const CertificateVerification = () => {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateVerificationResult | null>(null);
  const [error, setError] = useState('');
  const [qrMode, setQrMode] = useState(false);

  const handleVerify = async () => {
    if (!certificateNumber.trim()) {
      setError('Please enter a certificate number');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

try {
      const response = await apiClient.get(`/api/v1/certificates/verify/${certificateNumber.trim()}`);
      setResult(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setResult({
          valid: false,
          certificate: null,
          message: 'Certificate not found. Please check the certificate number.',
          verifiedAt: new Date().toISOString(),
        });
      } else {
        setError('Failed to verify certificate. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScanQrCode = () => {
    // In a real implementation, this would use the device camera and a QR code library
    // For now, we'll simulate QR code scanning
    setQrMode(true);
    setError('QR code scanning would be implemented with a library like jsQR or react-qr-reader');
    setTimeout(() => setQrMode(false), 3000);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      character: 'Character Certificate',
      transfer: 'Transfer Certificate',
      academic_excellence: 'Academic Excellence Certificate',
      eca: 'ECA Participation/Achievement Certificate',
      sports: 'Sports Participation/Achievement Certificate',
      course_completion: 'Course Completion Certificate',
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

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Certificate Verification / प्रमाणपत्र प्रमाणित गर्नुहोस्
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Verify the authenticity of a certificate by entering the certificate number or scanning the QR code
          </Typography>
          <Typography variant="body2" color="text.secondary">
            प्रमाणपत्र नम्बर प्रविष्ट गरेर वा QR कोड स्क्यान गरेर प्रमाणपत्रको प्रामाणिकता प्रमाणित गर्नुहोस्
          </Typography>
        </Box>

        {/* Search Box */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Enter Certificate Number / प्रमाणपत्र नम्बर प्रविष्ट गर्नुहोस्
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                fullWidth
                placeholder="e.g., CERT-2024-001234"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                error={!!error}
                helperText={error}
              />
              <Button
                variant="contained"
                onClick={handleVerify}
                disabled={loading}
                sx={{ minWidth: 150, whiteSpace: 'nowrap' }}
              >
                {loading ? <CircularProgress size={24} /> : 'Verify / प्रमाणित गर्नुहोस्'}
              </Button>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<QrCodeIcon />}
                onClick={handleScanQrCode}
              >
                Scan QR Code / QR कोड स्क्यान गर्नुहोस्
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* QR Mode Info */}
        {qrMode && (
          <Alert severity="info" sx={{ mb: 4 }}>
            QR Code scanning requires camera access and a QR code library. 
            This feature would use react-qr-reader or similar library in production.
          </Alert>
        )}

        {/* Verification Result */}
        {result && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                {result.valid ? (
                  <VerifiedIcon color="success" sx={{ fontSize: 48 }} />
                ) : (
                  <WarningIcon color="error" sx={{ fontSize: 48 }} />
                )}
                <Box>
                  <Typography variant="h5" color={result.valid ? 'success.main' : 'error.main'}>
                    {result.valid ? 'Certificate Verified / प्रमाणपत्र प्रमाणित' : 'Certificate Not Verified / प्रमाणपत्र प्रमाणित भएन'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verified at: {new Date(result.verifiedAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {result.certificate ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Certificate Number / प्रमाणपत्र नम्बर
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {result.certificate.certificateNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status / स्थिति
                    </Typography>
                    <Chip
                      label={result.certificate.status}
                      color={getStatusColor(result.certificate.status)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Student Name / विद्यार्थीको नाम
                    </Typography>
                    <Typography variant="body1">
                      {result.certificate.studentName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Certificate Type / प्रमाणपत्र प्रकार
                    </Typography>
                    <Typography variant="body1">
                      {getTypeLabel(result.certificate.type)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Issued Date BS / जारी मिति (BS)
                    </Typography>
                    <Typography variant="body1">
                      {result.certificate.issuedDateBS}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Issued Date AD / जारी मिति (AD)
                    </Typography>
                    <Typography variant="body1">
                      {result.certificate.issuedDate}
                    </Typography>
                  </Grid>
                  {result.certificate.schoolName && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Issuing Authority / जारीकर्ता
                      </Typography>
                      <Typography variant="body1">
                        {result.certificate.schoolName}
                        {result.certificate.schoolAddress && `, ${result.certificate.schoolAddress}`}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Alert severity="warning">
                  {result.message}
                </Alert>
              )}

              {result.valid && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="body2">
                      This certificate has been verified as authentic.
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    यो प्रमाणपत्र प्रामाणिक भएको प्रमाणित गरिएको छ।
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            How to Verify / कसरी प्रमाणित गर्ने
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Option 1: Certificate Number
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    1. Locate the certificate number on the document
                    <br />
                    2. Enter it in the search box above
                    <br />
                    3. Click "Verify" to check authenticity
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Option 2: QR Code
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    1. Click "Scan QR Code" button
                    <br />
                    2. Allow camera access when prompted
                    <br />
                    3. Point camera at the QR code on the certificate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};
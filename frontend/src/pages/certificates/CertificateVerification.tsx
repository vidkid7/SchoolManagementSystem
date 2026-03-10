/**
 * Certificate Verification Page (Public)
 * 
 * Support QR code scanning, certificate number lookup, and display certificate details
 * 
 * Requirements: 25.7
 */

import { useEffect, useRef, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const verifyCertificate = async (input: string) => {
    const certNumber = input.trim();
    if (!certNumber) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiClient.get(`/api/v1/certificates/verify/${certNumber}`);
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

  const handleVerify = async () => {
    if (!certificateNumber.trim()) {
      setError('Please enter a certificate number');
      return;
    }
    await verifyCertificate(certificateNumber);
  };

  const extractCertificateNumber = (rawValue: string): string => {
    const value = rawValue.trim();
    if (!value) return '';

    const verifyPath = '/api/v1/certificates/verify/';

    if (value.includes(verifyPath)) {
      const extracted = value.split(verifyPath)[1]?.split(/[?#]/)[0];
      return decodeURIComponent(extracted || '').trim();
    }

    try {
      const parsed = new URL(value);
      const idx = parsed.pathname.indexOf(verifyPath);
      if (idx !== -1) {
        const extracted = parsed.pathname.slice(idx + verifyPath.length).split('/')[0];
        return decodeURIComponent(extracted || '').trim();
      }
    } catch {
      // Not a URL, continue with direct certificate value.
    }

    return value;
  };

  const handleScanQrCode = () => {
    setError('');
    setScannerOpen(true);
  };

  useEffect(() => {
    if (!scannerOpen) return;

    let stopped = false;
    const BarcodeDetectorClass = (window as any).BarcodeDetector;

    const stopScanner = () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    const startScanner = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not supported in this browser. Enter certificate number manually.');
        setScannerOpen(false);
        return;
      }

      if (!BarcodeDetectorClass) {
        setError('QR scanning is not supported in this browser. Enter certificate number manually.');
        setScannerOpen(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });

        if (stopped) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });

        const scanFrame = async () => {
          if (stopped || !videoRef.current) return;

          try {
            const barcodes = await detector.detect(videoRef.current);
            const rawValue = barcodes?.[0]?.rawValue;

            if (rawValue) {
              const certNumber = extractCertificateNumber(rawValue);
              if (!certNumber) {
                setError('QR code does not contain a valid certificate reference.');
                setScannerOpen(false);
                stopScanner();
                return;
              }

              setCertificateNumber(certNumber);
              setScannerOpen(false);
              stopScanner();
              await verifyCertificate(certNumber);
              return;
            }
          } catch {
            // Continue scanning.
          }

          animationRef.current = requestAnimationFrame(() => {
            void scanFrame();
          });
        };

        void scanFrame();
      } catch {
        setError('Unable to access camera. Please allow camera permissions and try again.');
        setScannerOpen(false);
      }
    };

    void startScanner();

    return () => {
      stopped = true;
      stopScanner();
    };
  }, [scannerOpen]);

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

        <Dialog open={scannerOpen} onClose={() => setScannerOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Scan QR Code / QR कोड स्क्यान गर्नुहोस्</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Point your camera at the certificate QR code. Verification starts automatically.
            </Typography>
            <Box
              sx={{
                width: '100%',
                borderRadius: 1,
                overflow: 'hidden',
                bgcolor: 'black',
                aspectRatio: '4 / 3',
              }}
            >
              <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              color="inherit"
              startIcon={<CloseIcon />}
              onClick={() => setScannerOpen(false)}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

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

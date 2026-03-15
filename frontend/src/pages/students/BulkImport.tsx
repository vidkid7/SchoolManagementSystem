/**
 * Bulk Import Page
 * 
 * Upload Excel file to import multiple students
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import {
  Box,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  ArrowBack as BackIcon,
  FilePresent as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { motion } from 'framer-motion';
import { useNepaliNumbers } from '../../hooks/useNepaliNumbers';

const MotionCard = motion.create(Card);

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    errors: string[];
  }>;
}

export const BulkImport = () => {
  const { t, i18n } = useTranslation();
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { formatNumber } = useNepaliNumbers();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
          selectedFile.type !== 'application/vnd.ms-excel') {
        setError(t('bulkImport.invalidFile'));
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError(t('bulkImport.selectFile'));
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/api/v1/students/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      setError(error.response?.data?.message || t('bulkImport.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await apiClient.get('/api/v1/students/import-template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  };

  const getFileSize = (bytes: number) => {
    return formatNumber((bytes / 1024).toFixed(2));
  };

  return (
    <Box sx={{ mt: 2, mb: 4 }} key={i18n.language}>
      {/* Header */}
      <MotionCard 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        elevation={0}
        sx={{ 
          ...S.PAGE_HEADER,
          mb: 3,
          color: theme.palette.text.primary,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: R.lg, 
                bgcolor: S.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,122,255,0.08)',
                backdropFilter: 'blur(10px)',
              }}>
                <UploadIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                  {t('bulkImport.title')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, opacity: 0.9 }}>
                  <Typography variant="body2">
                    {t('bulkImport.subtitle')}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/students')}
              sx={{ 
                ...S.BTN_OUTLINE,
              }}
            >
              {t('bulkImport.backToList')}
            </Button>
          </Box>
        </CardContent>
      </MotionCard>

      {/* Instructions */}
      <MotionCard 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        elevation={0}
        sx={{ 
          ...S.GLASS,
          mb: 3,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <TemplateIcon sx={{ color: C.primary }} />
            <Typography variant="h6" fontWeight={700}>
              {t('bulkImport.instructions')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {[
              t('bulkImport.step1'),
              t('bulkImport.step2'),
              t('bulkImport.step3'),
            ].map((step, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Chip 
                  label={index + 1} 
                  size="small" 
                  sx={{ 
                    minWidth: 28,
                    height: 28,
                    bgcolor: C.primaryBg,
                    color: C.primary,
                    fontWeight: 700,
                  }} 
                />
                <Typography variant="body2" color="text.secondary">
                  {step}
                </Typography>
              </Box>
            ))}
          </Box>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadTemplate}
            sx={{ 
              ...S.BTN_OUTLINE,
            }}
          >
            {t('bulkImport.downloadTemplate')}
          </Button>
        </CardContent>
      </MotionCard>

      {/* Upload Section */}
      <MotionCard 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        elevation={0}
        sx={{ 
          ...S.GLASS,
          mb: 3,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <FileIcon sx={{ color: C.primary }} />
            <Typography variant="h6" fontWeight={700}>
              {t('bulkImport.uploadFile')}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: R.lg }}>
              {error}
            </Alert>
          )}

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 2,
            p: 3,
            borderRadius: R.lg,
            border: `2px dashed ${C.primaryBdr}`,
            bgcolor: C.primaryBg,
          }}>
            <input
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Button 
                variant="contained" 
                component="span"
                startIcon={<FileIcon />}
                sx={{ ...S.BTN_PRIMARY }}
              >
                {t('bulkImport.chooseFile')}
              </Button>
            </label>
            {file && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 2 }}>
                <FileIcon sx={{ color: C.primary }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getFileSize(file.size)} KB
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleUpload}
            disabled={!file || uploading}
            sx={{ 
              ...S.BTN_PRIMARY,
              px: 4,
            }}
          >
            {uploading ? t('bulkImport.uploading') : t('bulkImport.upload')}
          </Button>

          {uploading && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress sx={{ borderRadius: R.sm }} />
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }} color="text.secondary">
                {t('bulkImport.processing')}
              </Typography>
            </Box>
          )}
        </CardContent>
      </MotionCard>

      {/* Results */}
      {result && (
        <MotionCard 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          elevation={0}
          sx={{ 
            ...S.GLASS,
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              {result.success > 0 ? (
                <SuccessIcon sx={{ color: 'success.main', fontSize: 28 }} />
              ) : (
                <ErrorIcon sx={{ color: 'warning.main', fontSize: 28 }} />
              )}
              <Typography variant="h6" fontWeight={700}>
                {t('bulkImport.results')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip
                icon={<SuccessIcon />}
                label={`${t('bulkImport.success')}: ${formatNumber(result.success)}`}
                color="success"
                sx={{ 
                  fontSize: '0.9rem', 
                  py: 2.5,
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
              <Chip
                icon={<ErrorIcon />}
                label={`${t('bulkImport.failed')}: ${formatNumber(result.failed)}`}
                color="error"
                sx={{ 
                  fontSize: '0.9rem', 
                  py: 2.5,
                  '& .MuiChip-icon': { color: 'white' }
                }}
              />
            </Box>

            {result.errors.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom color="error" fontWeight={600}>
                  {t('bulkImport.errors')}
                </Typography>
                <TableContainer sx={{ 
                  borderRadius: R.lg, 
                  border: `1px solid ${C.dangerBdr}`,
                  bgcolor: C.dangerBg,
                }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ 
                        bgcolor: S.TH_BG,
                      }}>
                        <TableCell sx={{ ...S.TD, fontWeight: 700 }}>{t('bulkImport.row')}</TableCell>
                        <TableCell sx={{ ...S.TD, fontWeight: 700 }}>{t('bulkImport.errorDetails')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.errors.map((err, index) => (
                        <TableRow key={index} sx={{ ...S.TR_HOVER }}>
                          <TableCell sx={{ ...S.TD }}>
                            <Chip 
                              label={formatNumber(err.row)} 
                              size="small" 
                              sx={{ 
                                ...S.CHIP(C.warning),
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ ...S.TD }}>
                            {err.errors.map((e, i) => (
                              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 0.5 }}>
                                <ErrorIcon sx={{ fontSize: 16, color: 'error.main', mt: 0.25 }} />
                                <Typography variant="body2" color="error">
                                  {e}
                                </Typography>
                              </Box>
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {result.success > 0 && (
              <Button
                variant="contained"
                onClick={() => navigate('/students')}
                sx={{ ...S.BTN_PRIMARY, mt: 3 }}
              >
                {t('bulkImport.viewStudents')}
              </Button>
            )}
          </CardContent>
        </MotionCard>
      )}
    </Box>
  );
};

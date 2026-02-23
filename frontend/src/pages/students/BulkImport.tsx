/**
 * Bulk Import Page
 * 
 * Upload Excel file to import multiple students
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  alpha,
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
  const navigate = useNavigate();
  const theme = useTheme();
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
          mb: 3,
          borderRadius: 4,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(28,28,30,0.4) 0%, rgba(28,28,30,0.6) 100%)' 
            : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.5) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
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
                borderRadius: 2, 
                bgcolor: 'rgba(255,255,255,0.2)',
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
                borderRadius: 2,
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                '&:hover': { 
                  borderColor: 'rgba(255,255,255,0.5)', 
                  bgcolor: 'rgba(255,255,255,0.1)' 
                }
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
          mb: 3,
          borderRadius: 4,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`,
          background: theme.palette.mode === 'dark' 
            ? 'rgba(28,28,30,0.6)' 
            : 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <TemplateIcon sx={{ color: theme.palette.primary.main }} />
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
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
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
              borderRadius: 2,
              borderColor: alpha(theme.palette.primary.main, 0.5),
              '&:hover': { 
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              }
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
          mb: 3,
          borderRadius: 4,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`,
          background: theme.palette.mode === 'dark' 
            ? 'rgba(28,28,30,0.6)' 
            : 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <FileIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" fontWeight={700}>
              {t('bulkImport.uploadFile')}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 2,
            p: 3,
            borderRadius: 2,
            border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
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
                sx={{ borderRadius: 2 }}
              >
                {t('bulkImport.chooseFile')}
              </Button>
            </label>
            {file && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 2 }}>
                <FileIcon sx={{ color: theme.palette.primary.main }} />
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
              borderRadius: 2,
              px: 4,
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              '&:hover': { 
                boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
              }
            }}
          >
            {uploading ? t('bulkImport.uploading') : t('bulkImport.upload')}
          </Button>

          {uploading && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress sx={{ borderRadius: 1 }} />
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
            borderRadius: 4,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`,
            background: theme.palette.mode === 'dark' 
              ? 'rgba(28,28,30,0.6)' 
              : 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
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
                  borderRadius: 2, 
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  bgcolor: alpha(theme.palette.error.main, 0.02),
                }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ 
                        bgcolor: alpha(theme.palette.error.main, 0.05),
                      }}>
                        <TableCell sx={{ fontWeight: 700 }}>{t('bulkImport.row')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('bulkImport.errorDetails')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.errors.map((err, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Chip 
                              label={formatNumber(err.row)} 
                              size="small" 
                              sx={{ 
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.main,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>
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
                sx={{ mt: 3, borderRadius: 2 }}
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

/**
 * Student Documents Component
 * 
 * Manages student documents including upload, view, and deletion
 * Similar to Staff Documents component
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
  useTheme,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Description as DocIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  CloudUpload as CloudUploadIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

interface StudentDocument {
  id: number;
  name: string;
  type: string;
  category: string;
  fileUrl: string;
  fileSize: number;
  expiryDate?: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  createdAt: string;
  version: number;
}

interface DocumentStats {
  total: number;
  active: number;
  expired: number;
  expiringSoon: number;
}

type FilterType = 'all' | 'active' | 'expired' | 'expiring-soon';

interface StudentDocumentsProps {
  studentId: number;
}

export const StudentDocuments = ({ studentId }: StudentDocumentsProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats>({ total: 0, active: 0, expired: 0, expiringSoon: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  
  const [uploadDialog, setUploadDialog] = useState({ open: false });
  const [bulkUploadDialog, setBulkUploadDialog] = useState({ open: false });
  const [detailDialog, setDetailDialog] = useState({ open: false, document: null as StudentDocument | null });
  
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'birth_certificate',
    file: null as File | null,
    expiryDate: '',
  });
  
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, [studentId, filter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let endpoint = `/api/v1/students/${studentId}/documents`;
      
      if (filter === 'expired') {
        endpoint = `/api/v1/students/${studentId}/documents/expired`;
      } else if (filter === 'expiring-soon') {
        endpoint = `/api/v1/students/${studentId}/documents/expiring-soon`;
      }
      
      const response = await apiClient.get(endpoint);
      let docs = response.data.data || [];
      
      // Apply active filter on client side
      if (filter === 'active') {
        docs = docs.filter((doc: StudentDocument) => !doc.isExpired && !doc.isExpiringSoon);
      }
      
      setDocuments(docs);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      setError(err.response?.data?.message || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get(`/api/v1/students/${studentId}/documents/statistics`);
      setStats(response.data.data || { total: 0, active: 0, expired: 0, expiringSoon: 0 });
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.name || !uploadForm.file) {
      setError(t('validation.required'));
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('name', uploadForm.name);
      formData.append('category', uploadForm.category);
      formData.append('documents', uploadForm.file);
      if (uploadForm.expiryDate) {
        formData.append('expiryDate', uploadForm.expiryDate);
      }
      
      await apiClient.post(`/api/v1/students/${studentId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSuccess(t('documents.documentUploadedSuccessfully'));
      setUploadDialog({ open: false });
      setUploadForm({ name: '', category: 'birth_certificate', file: null, expiryDate: '' });
      fetchDocuments();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || t('documents.failedToUploadDocument'));
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) {
      setError(t('documents.pleaseSelectFileToUpload'));
      return;
    }
    
if (bulkFiles.length > 10) {
      setError(t('documents.fileSizeExceedsLimit'));
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      bulkFiles.forEach((file) => {
        formData.append('documents', file);
      });
      
      await apiClient.post(`/api/v1/students/${studentId}/documents/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSuccess(`${bulkFiles.length} documents uploaded successfully`);
      setBulkUploadDialog({ open: false });
      setBulkFiles([]);
      fetchDocuments();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || t('documents.failedToUploadDocument'));
    } finally {
      setUploading(false);
    }
  };

  const handleViewDetails = async (documentId: number) => {
    try {
      setError('');
      const response = await apiClient.get(`/api/v1/students/documents/${documentId}`);
      setDetailDialog({ open: true, document: response.data.data });
    } catch (err: any) {
      setError(err.response?.data?.message || t('documents.failedToPreviewDocument'));
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!window.confirm(t('documents.areYouSureDelete'))) return;
    
    try {
      setError('');
      await apiClient.delete(`/api/v1/students/documents/${documentId}`);
      setSuccess(t('documents.documentDeletedSuccessfully'));
      fetchDocuments();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || t('documents.failedToDeleteDocument'));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({ ...uploadForm, file, name: file.name.split('.')[0] });
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 10) {
      setError('Maximum 10 files allowed');
      return;
    }
    setBulkFiles(files);
  };

  const removeBulkFile = (index: number) => {
    setBulkFiles(bulkFiles.filter((_, i) => i !== index));
  };

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 ' + t('documents.bytes');
    const k = 1024;
    const sizes = [t('documents.bytes'), 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      birth_certificate: t('documents.birthCertificate'),
      id_card: t('documents.idCard'),
      medical_record: t('documents.medicalRecord'),
      previous_school: t('documents.previousSchoolCertificate'),
      other: t('documents.other'),
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <MotionCard 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            sx={{ 
              borderRadius: 2,
              cursor: 'pointer',
              border: filter === 'all' ? `2px solid ${theme.palette.primary.main}` : 'none',
            }}
            onClick={() => setFilter('all')}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary">{t('documents.totalDocuments')}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                {stats.total}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid item xs={6} sm={3}>
          <MotionCard 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            sx={{ 
              borderRadius: 2,
              cursor: 'pointer',
              border: filter === 'active' ? `2px solid #10b981` : 'none',
            }}
            onClick={() => setFilter('active')}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary">{t('common.active')}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#10b981' }}>
                {stats.active}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid item xs={6} sm={3}>
          <MotionCard 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            sx={{ 
              borderRadius: 2,
              cursor: 'pointer',
              border: filter === 'expired' ? `2px solid ${theme.palette.error.main}` : 'none',
            }}
            onClick={() => setFilter('expired')}
          >
<CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary">{t('messages.expired') || 'Expired'}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
                {stats.expired}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid item xs={6} sm={3}>
          <MotionCard 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }} 
            sx={{ 
              borderRadius: 2,
              cursor: 'pointer',
              border: filter === 'expiring-soon' ? `2px solid #f59e0b` : 'none',
            }}
            onClick={() => setFilter('expiring-soon')}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary">{t('documents.expiringSoon')}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#f59e0b' }}>
                {stats.expiringSoon}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Upload Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
<Button
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          onClick={() => setBulkUploadDialog({ open: true })}
        >
          {t('documents.bulkUploadButton')}
        </Button>
<Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setUploadDialog({ open: true })}
        >
          {t('documents.uploadDocument')}
        </Button>
      </Box>

      {/* Documents Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
<TableCell sx={{ fontWeight: 600 }}>{t('documents.name')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('documents.category')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('documents.size')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('documents.expiryDate')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('documents.status')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{t('documents.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
<TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('documents.noDocumentsFound')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DocIcon sx={{ color: 'primary.main' }} />
                      <Typography variant="body2">{doc.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={getCategoryLabel(doc.category)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                  <TableCell>
                    {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : '-'}
                  </TableCell>
<TableCell>
                    {doc.isExpired ? (
                      <Chip icon={<WarningIcon />} label={t('messages.expired')} size="small" color="error" />
                    ) : doc.isExpiringSoon ? (
                      <Chip icon={<WarningIcon />} label={t('documents.expiringSoon')} size="small" color="warning" />
                    ) : (
                      <Chip icon={<CheckCircleIcon />} label={t('common.active')} size="small" color="success" />
                    )}
                  </TableCell>
                  <TableCell align="right">
<IconButton
                      size="small"
                      onClick={() => handleViewDetails(doc.id)}
                      title={t('documents.viewDetails')}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                      title={t('documents.view')}
                    >
                      <DocIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(doc.id)}
                      title={t('common.delete')}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog.open} onClose={() => setUploadDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{t('documents.uploadDocument')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
<TextField
                label={t('documents.documentName')}
                fullWidth
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
<FormControl fullWidth>
                <InputLabel>{t('documents.category')}</InputLabel>
                <Select
                  value={uploadForm.category}
                  label={t('documents.category')}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                >
                  <MenuItem value="birth_certificate">{t('documents.birthCertificate')}</MenuItem>
                  <MenuItem value="id_card">{t('documents.idCard')}</MenuItem>
                  <MenuItem value="medical_record">{t('documents.medicalRecord')}</MenuItem>
                  <MenuItem value="previous_school">{t('documents.previousSchoolCertificate')}</MenuItem>
                  <MenuItem value="other">{t('documents.other')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
<TextField
                label={t('documents.expiryDateOptional')}
                type="date"
                fullWidth
                value={uploadForm.expiryDate}
                onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ py: 2 }}
>
                {t('documents.selectFile')}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </Button>
{uploadForm.file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {t('documents.selected')} {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadDialog({ open: false })}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || !uploadForm.name || !uploadForm.file}
          >
            {uploading ? t('common.uploading') : t('common.upload')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadDialog.open} onClose={() => setBulkUploadDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{t('documents.bulkUpload')} ({t('documents.maxFiles')})</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ py: 2 }}
            >
              Select Files ({t('documents.maxFiles')})
              <input
                type="file"
                hidden
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleBulkFileChange}
              />
            </Button>
            {bulkFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                  Selected Files ({bulkFiles.length}/10):
                </Typography>
                {bulkFiles.map((file, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                    <Box>
                      <Typography variant="body2">{file.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => removeBulkFile(index)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkUploadDialog({ open: false })}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleBulkUpload}
            disabled={uploading || bulkFiles.length === 0}
          >
            {uploading ? 'Uploading...' : `Upload ${bulkFiles.length} Files`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Detail Dialog */}
      <Dialog open={detailDialog.open} onClose={() => setDetailDialog({ open: false, document: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Document Details</DialogTitle>
        <DialogContent>
          {detailDialog.document && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Name:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{detailDialog.document.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Category:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{getCategoryLabel(detailDialog.document.category)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Type:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{detailDialog.document.type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">File Size:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatFileSize(detailDialog.document.fileSize)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Status:</Typography>
                  {detailDialog.document.isExpired ? (
                    <Chip icon={<WarningIcon />} label="Expired" size="small" color="error" />
                  ) : detailDialog.document.isExpiringSoon ? (
                    <Chip icon={<WarningIcon />} label="Expiring Soon" size="small" color="warning" />
                  ) : (
                    <Chip icon={<CheckCircleIcon />} label="Active" size="small" color="success" />
                  )}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Expiry Date:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {detailDialog.document.expiryDate ? new Date(detailDialog.document.expiryDate).toLocaleDateString() : t('common.none')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Created At:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {new Date(detailDialog.document.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog({ open: false, document: null })}>Close</Button>
          <Button
            variant="contained"
            onClick={() => detailDialog.document && window.open(detailDialog.document.fileUrl, '_blank')}
          >
            Open File
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentDocuments;

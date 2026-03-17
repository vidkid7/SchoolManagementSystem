/**
 * Staff Documents Component
 * 
 * Manages staff documents including upload, view, and deletion
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
  History as HistoryIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { motion } from 'framer-motion';
import { C, useAdminStyles } from '../../theme/designTokens';

const MotionCard = motion.create(Card);

interface StaffDocument {
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

interface DocumentVersion {
  id: number;
  version: number;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

type FilterType = 'all' | 'active' | 'expired' | 'expiring-soon';

interface StaffDocumentsProps {
  staffId: number;
}

export const StaffDocuments = ({ staffId }: StaffDocumentsProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats>({ total: 0, active: 0, expired: 0, expiringSoon: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  
  const [uploadDialog, setUploadDialog] = useState({ open: false });
  const [bulkUploadDialog, setBulkUploadDialog] = useState({ open: false });
  const [versionsDialog, setVersionsDialog] = useState({ open: false, documentId: 0, documentName: '' });
  const [editDialog, setEditDialog] = useState({ open: false, document: null as StaffDocument | null });
  const [detailDialog, setDetailDialog] = useState({ open: false, document: null as StaffDocument | null });
  
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'certificate',
    file: null as File | null,
    expiryDate: '',
  });
  
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, [staffId, filter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let endpoint = `/api/v1/staff/${staffId}/documents`;
      
      if (filter === 'expired') {
        endpoint = `/api/v1/staff/${staffId}/documents/expired`;
      } else if (filter === 'expiring-soon') {
        endpoint = `/api/v1/staff/${staffId}/documents/expiring-soon`;
      }
      
      const response = await apiClient.get(endpoint);
      let docs = response.data.data || [];
      
      // Apply active filter on client side
      if (filter === 'active') {
        docs = docs.filter((doc: StaffDocument) => !doc.isExpired && !doc.isExpiringSoon);
      }
      
      setDocuments(docs);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
      // Handle 500 errors gracefully - feature not implemented yet
      if (err.response?.status === 500) {
        setDocuments([]);
        // Don't show error for 500 - feature not implemented
      } else {
      setError(err.response?.data?.message || t('staff.doc.failedToLoad'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get(`/api/v1/staff/${staffId}/documents/statistics`);
      setStats(response.data.data || { total: 0, active: 0, expired: 0, expiringSoon: 0 });
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      // Handle 500 errors gracefully - feature not implemented yet
      if (err.response?.status === 500) {
        setStats({ total: 0, active: 0, expired: 0, expiringSoon: 0 });
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.name || !uploadForm.file) {
      setError(t('staff.doc.fillAllFields'));
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('name', uploadForm.name);
      formData.append('category', uploadForm.category);
      formData.append('document', uploadForm.file);
      if (uploadForm.expiryDate) {
        formData.append('expiryDate', uploadForm.expiryDate);
      }
      
      await apiClient.post(`/api/v1/staff/${staffId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSuccess(t('staff.doc.uploadedSuccessfully'));
      setUploadDialog({ open: false });
      setUploadForm({ name: '', category: 'certificate', file: null, expiryDate: '' });
      fetchDocuments();
      fetchStats();
    } catch (err: any) {
      if (err.response?.status === 500) {
        setError(t('staff.doc.uploadFeatureNotImplemented'));
      } else {
        setError(err.response?.data?.message || t('staff.doc.failedToUpload'));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (bulkFiles.length === 0) {
      setError(t('staff.doc.selectAtLeastOneFile'));
      return;
    }
    
    if (bulkFiles.length > 10) {
      setError(t('staff.doc.maxFilesAllowed'));
      return;
    }
    
    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      bulkFiles.forEach((file) => {
        formData.append('documents', file);
      });
      
      await apiClient.post(`/api/v1/staff/${staffId}/documents/bulk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSuccess(t('staff.doc.bulkDocsUploadedSuccessfully', { count: bulkFiles.length }));
      setBulkUploadDialog({ open: false });
      setBulkFiles([]);
      fetchDocuments();
      fetchStats();
    } catch (err: any) {
      if (err.response?.status === 500) {
        setError(t('staff.doc.bulkUploadFeatureNotImplemented'));
      } else {
        setError(err.response?.data?.message || t('staff.doc.failedToBulkUpload'));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleViewVersions = async (documentId: number, documentName: string) => {
    try {
      setError('');
      const response = await apiClient.get(`/api/v1/staff/${staffId}/documents/versions`, {
        params: { documentId },
      });
      setVersions(response.data.data || []);
      setVersionsDialog({ open: true, documentId, documentName });
    } catch (err: any) {
      if (err.response?.status === 500) {
        setError(t('staff.doc.failedToLoadVersions'));
      } else {
        setError(err.response?.data?.message || t('staff.doc.failedToLoadVersions'));
      }
    }
  };

  const handleEditDocument = async () => {
    if (!editDialog.document) return;
    
    try {
      setError('');
      const { id, name, category, expiryDate } = editDialog.document;
      
      await apiClient.put(`/api/v1/staff/documents/${id}`, {
        name,
        category,
        expiryDate: expiryDate || null,
      });
      
      setSuccess(t('staff.doc.updatedSuccessfully'));
      setEditDialog({ open: false, document: null });
      fetchDocuments();
      fetchStats();
    } catch (err: any) {
      if (err.response?.status === 500) {
        setError(t('staff.doc.failedToUpdate'));
      } else {
        setError(err.response?.data?.message || t('staff.doc.failedToUpdate'));
      }
    }
  };

  const handleViewDetails = async (documentId: number) => {
    try {
      setError('');
      const response = await apiClient.get(`/api/v1/staff/documents/${documentId}`);
      setDetailDialog({ open: true, document: response.data.data });
    } catch (err: any) {
      if (err.response?.status === 500) {
        setError(t('staff.doc.detailsFeatureNotImplemented'));
      } else {
        setError(err.response?.data?.message || t('staff.doc.failedToLoadDetails'));
      }
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!window.confirm(t('staff.doc.confirmDeleteDocument'))) return;
    
    try {
      setError('');
      await apiClient.delete(`/api/v1/staff/documents/${documentId}`);
      setSuccess(t('staff.doc.deletedSuccessfully'));
      fetchDocuments();
      fetchStats();
    } catch (err: any) {
      if (err.response?.status === 500) {
        setError(t('staff.doc.deleteFeatureNotImplemented'));
      } else {
        setError(err.response?.data?.message || t('staff.doc.failedToDelete'));
      }
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
      setError(t('staff.doc.maxFilesAllowed'));
      return;
    }
    setBulkFiles(files);
  };

  const removeBulkFile = (index: number) => {
    setBulkFiles(bulkFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryLabel = (category: string) => {
    const labelMap: Record<string, string> = {
      certificate: t('staff.doc.certificate'),
      contract: t('staff.doc.contract'),
      qualification: t('staff.doc.qualification'),
      identity: t('staff.doc.identity'),
      other: t('staff.doc.other'),
    };
    return labelMap[category] || category;
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
              <Typography variant="body2" color="text.secondary">{t('staff.doc.totalDocuments')}</Typography>
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
              border: filter === 'active' ? `2px solid ${C.success}` : 'none',
            }}
            onClick={() => setFilter('active')}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary">{t('staff.doc.active')}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: C.success }}>
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
              <Typography variant="body2" color="text.secondary">{t('staff.doc.expired')}</Typography>
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
              border: filter === 'expiring-soon' ? `2px solid ${C.warning}` : 'none',
            }}
            onClick={() => setFilter('expiring-soon')}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary">{t('staff.doc.expiringSoon')}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: C.warning }}>
                {stats.expiringSoon}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Upload Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
        <Button
          variant="outlined" sx={S.BTN_OUTLINE}
          startIcon={<CloudUploadIcon />}
          onClick={() => setBulkUploadDialog({ open: true })}
        >
          {t('staff.doc.bulkUpload')}
        </Button>
        <Button
          sx={S.BTN_PRIMARY}
          startIcon={<CloudUploadIcon />}
          onClick={() => setUploadDialog({ open: true })}
        >
          {t('staff.doc.uploadDocument')}
        </Button>
      </Box>

      {/* Documents Table */}
      <TableContainer component={Paper} sx={{ ...S.GLASS, borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: S.TH_BG }}>
              <TableCell sx={{ fontWeight: 600 }}>{t('staff.doc.name')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('staff.doc.category')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('staff.doc.size')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('staff.doc.expiryDate')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('staff.doc.status')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('staff.doc.version')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <DocIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                    <Typography color="text.secondary">{t('staff.doc.noDocumentsFound')}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('staff.doc.uploadToGetStarted')}
                    </Typography>
                  </Box>
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
                      <Chip icon={<WarningIcon />} label={t('staff.doc.expired')} size="small" color="error" />
                    ) : doc.isExpiringSoon ? (
                      <Chip icon={<WarningIcon />} label={t('staff.doc.expiringSoon')} size="small" color="warning" />
                    ) : (
                      <Chip icon={<CheckCircleIcon />} label={t('staff.doc.active')} size="small" color="success" />
                    )}
                  </TableCell>
                  <TableCell>v{doc.version}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(doc.id)}
                      title={t('staff.doc.viewDetails')}
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleViewVersions(doc.id, doc.name)}
                      title={t('staff.doc.viewVersions')}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setEditDialog({ open: true, document: doc })}
                      title={t('common.edit')}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => window.open(doc.fileUrl, '_blank')}
                      title={t('common.view')}
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
        <DialogTitle>{t('staff.doc.uploadDocument')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label={t('staff.doc.documentName')}
                fullWidth
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{t('staff.doc.category')}</InputLabel>
                <Select
                  value={uploadForm.category}
                  label={t('staff.doc.category')}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                >
                  <MenuItem value="certificate">{t('staff.doc.certificate')}</MenuItem>
                  <MenuItem value="contract">{t('staff.doc.contract')}</MenuItem>
                  <MenuItem value="qualification">{t('staff.doc.qualification')}</MenuItem>
                  <MenuItem value="identity">{t('staff.doc.identity')}</MenuItem>
                  <MenuItem value="other">{t('staff.doc.other')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('staff.doc.expiryDateOptional')}
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
                sx={{ ...S.BTN_OUTLINE,  py: 2 }}
              >
                {t('staff.doc.selectFile')}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </Button>
              {uploadForm.file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadDialog({ open: false })}>{t('common.cancel')}</Button>
          <Button
            sx={S.BTN_PRIMARY}
            onClick={handleUpload}
            disabled={uploading || !uploadForm.name || !uploadForm.file}
          >
            {uploading ? t('staff.doc.uploading') : t('staff.doc.upload')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadDialog.open} onClose={() => setBulkUploadDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{t('staff.doc.bulkUploadTitle')}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ ...S.BTN_OUTLINE,  py: 2 }}
            >
              {t('staff.doc.selectFilesMax10')}
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
                  {t('staff.doc.selectedFilesCount', { count: bulkFiles.length })}
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
          <Button onClick={() => setBulkUploadDialog({ open: false })}>{t('common.cancel')}</Button>
          <Button
            sx={S.BTN_PRIMARY}
            onClick={handleBulkUpload}
            disabled={uploading || bulkFiles.length === 0}
          >
            {uploading ? t('staff.doc.uploading') : t('staff.doc.uploadNFiles', { count: bulkFiles.length })}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Versions Dialog */}
      <Dialog open={versionsDialog.open} onClose={() => setVersionsDialog({ open: false, documentId: 0, documentName: '' })} maxWidth="md" fullWidth>
        <DialogTitle>{t('staff.doc.documentVersions', { name: versionsDialog.documentName })}</DialogTitle>
        <DialogContent>
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('staff.doc.versionCol')}</TableCell>
                  <TableCell>{t('staff.doc.fileSize')}</TableCell>
                  <TableCell>{t('staff.doc.uploadedAt')}</TableCell>
                  <TableCell>{t('staff.doc.uploadedBy')}</TableCell>
                  <TableCell align="right">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {versions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">{t('staff.doc.noVersionsFound')}</TableCell>
                  </TableRow>
                ) : (
                  versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell>v{version.version}</TableCell>
                      <TableCell>{formatFileSize(version.fileSize)}</TableCell>
                      <TableCell>{new Date(version.uploadedAt).toLocaleString()}</TableCell>
                      <TableCell>{version.uploadedBy}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => window.open(version.fileUrl, '_blank')}
                          title={t('common.view')}
                        >
                          <DocIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionsDialog({ open: false, documentId: 0, documentName: '' })}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, document: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{t('staff.doc.editDocument')}</DialogTitle>
        <DialogContent>
          {editDialog.document && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label={t('staff.doc.documentName')}
                  fullWidth
                  value={editDialog.document.name}
                  onChange={(e) => setEditDialog({ 
                    ...editDialog, 
                    document: { ...editDialog.document!, name: e.target.value } 
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('staff.doc.category')}</InputLabel>
                  <Select
                    value={editDialog.document.category}
                    label={t('staff.doc.category')}
                    onChange={(e) => setEditDialog({ 
                      ...editDialog, 
                      document: { ...editDialog.document!, category: e.target.value } 
                    })}
                  >
                    <MenuItem value="certificate">{t('staff.doc.certificate')}</MenuItem>
                    <MenuItem value="contract">{t('staff.doc.contract')}</MenuItem>
                    <MenuItem value="qualification">{t('staff.doc.qualification')}</MenuItem>
                    <MenuItem value="identity">{t('staff.doc.identity')}</MenuItem>
                    <MenuItem value="other">{t('staff.doc.other')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('staff.doc.expiryDateOptional')}
                  type="date"
                  fullWidth
                  value={editDialog.document.expiryDate ? editDialog.document.expiryDate.split('T')[0] : ''}
                  onChange={(e) => setEditDialog({ 
                    ...editDialog, 
                    document: { ...editDialog.document!, expiryDate: e.target.value } 
                  })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialog({ open: false, document: null })}>{t('common.cancel')}</Button>
          <Button sx={S.BTN_PRIMARY} onClick={handleEditDocument}>
            {t('staff.doc.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Detail Dialog */}
      <Dialog open={detailDialog.open} onClose={() => setDetailDialog({ open: false, document: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{t('staff.doc.documentDetails')}</DialogTitle>
        <DialogContent>
          {detailDialog.document && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">{t('staff.doc.name')}:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{detailDialog.document.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">{t('staff.doc.category')}:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{getCategoryLabel(detailDialog.document.category)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">{t('staff.doc.type')}:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{detailDialog.document.type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">{t('staff.doc.fileSize')}:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatFileSize(detailDialog.document.fileSize)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">{t('staff.doc.version')}:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>v{detailDialog.document.version}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">{t('staff.doc.status')}:</Typography>
                  {detailDialog.document.isExpired ? (
                    <Chip icon={<WarningIcon />} label={t('staff.doc.expired')} size="small" color="error" />
                  ) : detailDialog.document.isExpiringSoon ? (
                    <Chip icon={<WarningIcon />} label={t('staff.doc.expiringSoon')} size="small" color="warning" />
                  ) : (
                    <Chip icon={<CheckCircleIcon />} label={t('staff.doc.active')} size="small" color="success" />
                  )}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">{t('staff.doc.expiryDate')}:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {detailDialog.document.expiryDate ? new Date(detailDialog.document.expiryDate).toLocaleDateString() : t('common.na')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">{t('staff.doc.createdAt')}:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {new Date(detailDialog.document.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">{t('staff.doc.fileUrl')}:</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      wordBreak: 'break-all', 
                      color: 'primary.main',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => window.open(detailDialog.document!.fileUrl, '_blank')}
                  >
                    {detailDialog.document.fileUrl}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog({ open: false, document: null })}>{t('common.close')}</Button>
          <Button 
            variant="contained" sx={S.BTN_PRIMARY} 
            onClick={() => detailDialog.document && window.open(detailDialog.document.fileUrl, '_blank')}
          >
            {t('staff.doc.openFile')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffDocuments;

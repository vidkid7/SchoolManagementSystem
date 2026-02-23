/**
 * Document Management Page
 * 
 * Display document list, support upload with categorization, search and filtering,
 * and document preview functionality
 * 
 * Requirements: 27.1, 27.5, 27.6
 */

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  Menu,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  Visibility as PreviewIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  MoreVert as MoreIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../services/apiClient';

// Document categories
const DOCUMENT_CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'financial', label: 'Financial' },
  { value: 'student_record', label: 'Student Record' },
  { value: 'staff_record', label: 'Staff Record' },
  { value: 'curriculum', label: 'Curriculum' },
  { value: 'exam', label: 'Exam' },
  { value: 'other', label: 'Other' },
];

// Document status options
const DOCUMENT_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

// Access level options
const ACCESS_LEVELS = [
  { value: 'private', label: 'Private' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'public', label: 'Public' },
];

// Interface for document data
interface Document {
  documentId: number;
  documentNumber: string;
  name: string;
  originalName: string;
  description?: string;
  category: string;
  mimeType: string;
  size: number;
  version: number;
  uploadedBy: number;
  uploadedByName?: string;
  accessLevel: string;
  tags?: string[];
  status: string;
  isCompressed?: boolean;
  compressionRatio?: number;
  createdAt: string;
  updatedAt: string;
  thumbnailPath?: string;
}

// Interface for document version
interface DocumentVersion {
  version: number;
  name: string;
  originalName: string;
  size: number;
  createdAt: string;
  createdBy: number;
  createdByName?: string;
}

// Interface for document filters
interface DocumentFilters {
  search: string;
  category: string;
  status: string;
  accessLevel: string;
  startDate: string;
  endDate: string;
}

// Interface for upload form data
interface UploadFormData {
  name: string;
  description: string;
  category: string;
  accessLevel: string;
  tags: string[];
  file: File | null;
}

// Interface for tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get file icon based on mime type
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <ImageIcon color="primary" />;
  if (mimeType === 'application/pdf') return <PdfIcon color="error" />;
  return <DocIcon color="action" />;
};

// Helper function to get category color
const getCategoryColor = (category: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    academic: 'primary',
    administrative: 'secondary',
    financial: 'success',
    student_record: 'info',
    staff_record: 'warning',
    curriculum: 'primary',
    exam: 'error',
    other: 'default',
  };
  return colors[category] || 'default';
};

export const DocumentManagement = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // State for filters
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    category: '',
    status: 'active',
    accessLevel: '',
    startDate: '',
    endDate: '',
  });

  // State for dialogs
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [versionsDialogOpen, setVersionsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<DocumentVersion[]>([]);

  // State for upload form
  const [uploadForm, setUploadForm] = useState<UploadFormData>({
    name: '',
    description: '',
    category: 'other',
    accessLevel: 'private',
    tags: [],
    file: null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tagInput, setTagInput] = useState('');

  // State for menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuDocument, setMenuDocument] = useState<Document | null>(null);

  // State for tabs
  const [tabValue, setTabValue] = useState(0);

  // Fetch documents on mount and when filters change
  useEffect(() => {
    fetchDocuments();
  }, [page, rowsPerPage, filters]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(filters.accessLevel && { accessLevel: filters.accessLevel }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await apiClient.get(`/documents?${params.toString()}`);
      
      if (response.data.success) {
        setDocuments(response.data.data);
        setTotalCount(response.data.meta?.total || response.data.data.length);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('Failed to load documents'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof DocumentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      status: 'active',
      accessLevel: '',
      startDate: '',
      endDate: '',
    });
    setPage(0);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError(t('File size exceeds maximum limit of 10MB'));
        return;
      }
      setUploadForm(prev => ({
        ...prev,
        name: file.name.replace(/\.[^/.]+$/, ''),
        file,
      }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file) {
      setError(t('Please select a file to upload'));
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('name', uploadForm.name);
      formData.append('description', uploadForm.description);
      formData.append('category', uploadForm.category);
      formData.append('accessLevel', uploadForm.accessLevel);
      if (uploadForm.tags.length > 0) {
        formData.append('tags', JSON.stringify(uploadForm.tags));
      }

      const response = await apiClient.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });

      if (response.data.success) {
        setSuccess(t('Document uploaded successfully'));
        setUploadDialogOpen(false);
        resetUploadForm();
        fetchDocuments();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('Failed to upload document'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      name: '',
      description: '',
      category: 'other',
      accessLevel: 'private',
      tags: [],
      file: null,
    });
    setTagInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !uploadForm.tags.includes(tagInput.trim())) {
      setUploadForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setUploadForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handlePreview = async (document: Document) => {
    try {
      setSelectedDocument(document);
      const response = await apiClient.get(`/documents/${document.documentId}/preview`);
      
      if (response.data.success) {
        setPreviewDialogOpen(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('Failed to preview document'));
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await apiClient.get(`/documents/${document.documentId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('Failed to download document'));
    }
  };

  const handleViewVersions = async (document: Document) => {
    try {
      const response = await apiClient.get(`/documents/${document.documentId}/versions`);
      
      if (response.data.success) {
        setSelectedDocument(document);
        setSelectedVersions(response.data.data);
        setVersionsDialogOpen(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('Failed to load versions'));
    }
  };

  const handleArchive = async (document: Document) => {
    try {
      const response = await apiClient.post(`/documents/${document.documentId}/archive`);
      
      if (response.data.success) {
        setSuccess(t('Document archived successfully'));
        fetchDocuments();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('Failed to archive document'));
    }
    setAnchorEl(null);
  };

  const handleDelete = async (document: Document) => {
    if (!window.confirm(t('Are you sure you want to delete this document?'))) {
      setAnchorEl(null);
      return;
    }

    try {
      const response = await apiClient.delete(`/documents/${document.documentId}`);
      
      if (response.data.success) {
        setSuccess(t('Document deleted successfully'));
        fetchDocuments();
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('Failed to delete document'));
    }
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, document: Document) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuDocument(document);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuDocument(null);
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">{t('Document Management')}</Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          {t('Upload Document')}
        </Button>
      </Box>

      {/* Success/Error Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('Search documents...')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: filters.search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleFilterChange('search', '')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('Category')}</InputLabel>
              <Select
                value={filters.category}
                label={t('Category')}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">{t('All Categories')}</MenuItem>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {t(cat.label)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('Status')}</InputLabel>
              <Select
                value={filters.status}
                label={t('Status')}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                {DOCUMENT_STATUS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {t(status.label)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('Access Level')}</InputLabel>
              <Select
                value={filters.accessLevel}
                label={t('Access Level')}
                onChange={(e) => handleFilterChange('accessLevel', e.target.value)}
              >
                <MenuItem value="">{t('All Levels')}</MenuItem>
                {ACCESS_LEVELS.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {t(level.label)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
            >
              {t('Clear Filters')}
            </Button>
          </Grid>
          <Grid item xs={12} md={1}>
            <IconButton onClick={fetchDocuments} color="primary">
              <RefreshIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>

      {/* Document Table */}
      <Paper>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('Name')}</TableCell>
                <TableCell>{t('Category')}</TableCell>
                <TableCell>{t('Size')}</TableCell>
                <TableCell>{t('Access')}</TableCell>
                <TableCell>{t('Uploaded By')}</TableCell>
                <TableCell>{t('Date')}</TableCell>
                <TableCell align="right">{t('Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      {t('No documents found')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow
                    key={doc.documentId}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handlePreview(doc)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getFileIcon(doc.mimeType)}
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {doc.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {doc.documentNumber} {doc.version > 1 && `• v${doc.version}`}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label || doc.category)}
                        size="small"
                        color={getCategoryColor(doc.category)}
                      />
                    </TableCell>
                    <TableCell>{formatFileSize(doc.size)}</TableCell>
                    <TableCell>
                      <Chip
                        label={t(doc.accessLevel)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{doc.uploadedByName || doc.uploadedBy}</TableCell>
                    <TableCell>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('Preview')}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(doc);
                          }}
                        >
                          <PreviewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('Download')}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc);
                          }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, doc)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {menuDocument && (
          <>
            <MenuItem
              onClick={() => {
                handleViewVersions(menuDocument);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('Version History')}</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setSelectedDocument(menuDocument);
                setEditDialogOpen(true);
                handleMenuClose();
              }}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('Edit')}</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => handleArchive(menuDocument)}
            >
              <ListItemIcon>
                <ArchiveIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>{t('Archive')}</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => handleDelete(menuDocument)}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>{t('Delete')}</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('Upload Document')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* File Input */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: uploadForm.file ? 'action.hover' : 'background.paper',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
              />
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                {uploadForm.file ? uploadForm.file.name : t('Click to select a file')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('Maximum file size: 10MB')}
              </Typography>
            </Paper>

            {uploading && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  {t('Uploading...')} {uploadProgress}%
                </Typography>
              </Box>
            )}

            {/* Document Details */}
            <TextField
              fullWidth
              label={t('Document Name')}
              value={uploadForm.name}
              onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label={t('Description')}
              value={uploadForm.description}
              onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={2}
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel>{t('Category')}</InputLabel>
              <Select
                value={uploadForm.category}
                label={t('Category')}
                onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {t(cat.label)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>{t('Access Level')}</InputLabel>
              <Select
                value={uploadForm.accessLevel}
                label={t('Access Level')}
                onChange={(e) => setUploadForm(prev => ({ ...prev, accessLevel: e.target.value }))}
              >
                {ACCESS_LEVELS.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {t(level.label)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Tags */}
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                label={t('Add Tags')}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                InputProps={{
                  endAdornment: (
                    <Button onClick={handleAddTag} disabled={!tagInput.trim()}>
                      {t('Add')}
                    </Button>
                  ),
                }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {uploadForm.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onDelete={() => handleRemoveTag(tag)}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUploadDialogOpen(false);
            resetUploadForm();
          }} disabled={uploading}>
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!uploadForm.file || !uploadForm.name || uploading}
          >
            {t('Upload')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedDocument?.name}
          <Typography variant="caption" display="block" color="text.secondary">
            {selectedDocument?.documentNumber}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label={t('Preview')} />
                <Tab label={t('Details')} />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Card>
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    {selectedDocument.mimeType.startsWith('image/') ? (
                      <img
                        src={`/api/v1/documents/${selectedDocument.documentId}/preview`}
                        alt={selectedDocument.name}
                        style={{ maxWidth: '100%', maxHeight: '500px' }}
                      />
                    ) : selectedDocument.mimeType === 'application/pdf' ? (
                      <Box>
                        <PdfIcon sx={{ fontSize: 64, mb: 2 }} />
                        <Typography>
                          {t('PDF Preview - Use download to view full document')}
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <DocIcon sx={{ fontSize: 64, mb: 2 }} />
                        <Typography>
                          {t('Preview not available for this file type')}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('Original Name')}
                    </Typography>
                    <Typography>{selectedDocument.originalName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('File Size')}
                    </Typography>
                    <Typography>{formatFileSize(selectedDocument.size)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('Category')}
                    </Typography>
                    <Chip
                      label={t(DOCUMENT_CATEGORIES.find(c => c.value === selectedDocument.category)?.label || selectedDocument.category)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('Access Level')}
                    </Typography>
                    <Chip
                      label={t(selectedDocument.accessLevel)}
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('Uploaded By')}
                    </Typography>
                    <Typography>{selectedDocument.uploadedByName || selectedDocument.uploadedBy}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('Upload Date')}
                    </Typography>
                    <Typography>
                      {new Date(selectedDocument.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                  {selectedDocument.description && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        {t('Description')}
                      </Typography>
                      <Typography>{selectedDocument.description}</Typography>
                    </Grid>
                  )}
                  {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {t('Tags')}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedDocument.tags.map((tag) => (
                          <Chip key={tag} label={tag} size="small" />
                        ))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </TabPanel>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            {t('Close')}
          </Button>
          {selectedDocument && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleDownload(selectedDocument)}
            >
              {t('Download')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog
        open={versionsDialogOpen}
        onClose={() => setVersionsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('Version History')}
          {selectedDocument && (
            <Typography variant="caption" display="block" color="text.secondary">
              {selectedDocument.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedVersions.map((version) => (
              <ListItem
                key={version.version}
                divider
                secondaryAction={
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      if (selectedDocument) {
                        handleDownload({ ...selectedDocument, version: version.version } as Document);
                      }
                    }}
                  >
                    {t('Download')}
                  </Button>
                }
              >
                <ListItemText
                  primary={`Version ${version.version}`}
                  secondary={
                    <>
                      {version.name}
                      <br />
                      {formatFileSize(version.size)} • {new Date(version.createdAt).toLocaleString()}
                      {version.createdByName && ` • ${version.createdByName}`}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionsDialogOpen(false)}>
            {t('Close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentManagement;
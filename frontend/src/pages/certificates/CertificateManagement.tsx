/**
 * Certificate Management Page (Admin)
 * 
 * Manage certificate templates, generate certificates, and view certificate registry
 * 
 * Requirements: 25.2, 25.3, 25.5
 */

import { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
  Autocomplete,
  Checkbox,
  Snackbar,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  QrCode as QrCodeIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient, { resolveApiAssetUrl } from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';
import { extractTemplateVariables } from './certificateTemplateUtils';

// Certificate types
const CERTIFICATE_TYPES = [
  { value: 'character', label: 'Character Certificate' },
  { value: 'transfer', label: 'Transfer Certificate' },
  { value: 'academic_excellence', label: 'Academic Excellence' },
  { value: 'eca', label: 'ECA Participation/Achievement' },
  { value: 'sports', label: 'Sports Participation/Achievement' },
  { value: 'course_completion', label: 'Course Completion' },
  { value: 'bonafide', label: 'Bonafide Certificate' },
];

interface CertificateTemplate {
  id?: number;
  templateId?: number;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  templateHtml?: string;
  variables?: string[];
}

interface Certificate {
  id?: number;
  certificateId?: number;
  certificateNumber: string;
  templateId: number;
  templateName: string;
  studentId: number;
  studentName: string;
  type: string;
  issuedDate: string;
  issuedDateBS: string;
  status: 'active' | 'revoked';
  pdfUrl?: string;
}

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

export const CertificateManagement = () => {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const [tabValue, setTabValue] = useState(0);
  
  // Templates state
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [templatesTotal, setTemplatesTotal] = useState(0);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatePage, setTemplatePage] = useState(0);
  const [templatesPerPage, setTemplatesPerPage] = useState(10);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateTypeFilter, setTemplateTypeFilter] = useState('');
  
  // Certificates state
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificatesTotal, setCertificatesTotal] = useState(0);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  const [certPage, setCertPage] = useState(0);
  const [certsPerPage, setCertsPerPage] = useState(10);
  const [certSearch, setCertSearch] = useState('');
  const [certTypeFilter, setCertTypeFilter] = useState('');
  const [certStatusFilter, setCertStatusFilter] = useState('');
  
// Dialogs
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [bulkGenerateDialogOpen, setBulkGenerateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  
  // Students and templates for generation
  const [students, setStudents] = useState<Array<{ studentId: number; firstName: string; lastName: string; studentCode: string }>>([]);
  const [availableTemplates, setAvailableTemplates] = useState<CertificateTemplate[]>([]);
  
  // Form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: '',
    templateHtml: '',
  });
  
  // Generate single certificate form
  const [generateForm, setGenerateForm] = useState({
    templateId: '',
    studentId: '',
    issuedDateBS: '',
    studentName: '',
    parentName: '',
    className: '',
    rollNumber: '',
    academicYear: '',
  });
  
  // Bulk generate form
  const [bulkForm, setBulkForm] = useState({
    templateId: '',
    selectedStudents: [] as number[],
    issuedDateBS: '',
    academicYear: '',
  });
  
  // UI state
  const [generating, setGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (generateDialogOpen || bulkGenerateDialogOpen) {
      fetchStudents();
      fetchAvailableTemplates();
    }
  }, [generateDialogOpen, bulkGenerateDialogOpen]);

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get('/api/v1/students?limit=1000');
      const studentRows = response.data.data || [];
      setStudents(studentRows.map((student: any) => ({
        ...student,
        firstName: student.firstName ?? student.firstNameEn ?? '',
        lastName: student.lastName ?? student.lastNameEn ?? '',
      })));
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const fetchAvailableTemplates = async () => {
    try {
      const response = await apiClient.get('/api/v1/certificate-templates?isActive=true');
      setAvailableTemplates(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

const fetchTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      const params = new URLSearchParams({
        ...(templateSearch && { search: templateSearch }),
        ...(templateTypeFilter && { type: templateTypeFilter }),
      });
      const response = await apiClient.get(`/api/v1/certificate-templates?${params}`);
      setTemplates(response.data.data || []);
      setTemplatesTotal(response.data.meta?.total ?? response.data.data?.length ?? 0);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  }, [templateSearch, templateTypeFilter]);

const fetchCertificates = useCallback(async () => {
    try {
      setCertificatesLoading(true);
      const params = new URLSearchParams({
        ...(certSearch && { search: certSearch }),
        ...(certTypeFilter && { type: certTypeFilter }),
        ...(certStatusFilter && { status: certStatusFilter }),
      });
      const response = await apiClient.get(`/api/v1/certificates?${params}`);
      setCertificates(response.data.data || []);
      setCertificatesTotal(response.data.meta?.total ?? response.data.data?.length ?? 0);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setCertificatesLoading(false);
    }
  }, [certSearch, certTypeFilter, certStatusFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => fetchTemplates(), 250);
    return () => window.clearTimeout(timeout);
  }, [fetchTemplates]);

  useEffect(() => {
    const timeout = window.setTimeout(() => fetchCertificates(), 250);
    return () => window.clearTimeout(timeout);
  }, [fetchCertificates]);

const handleCreateTemplate = async () => {
    const variables = extractTemplateVariables(templateForm.templateHtml);
    if (templateForm.name.trim().length < 3 || !templateForm.type || templateForm.templateHtml.trim().length < 10 || variables.length === 0) {
      setSnackbar({ open: true, message: t('certificates.templateFormRequired'), severity: 'error' });
      return;
    }

    try {
      const payload = { ...templateForm, name: templateForm.name.trim(), variables };
      if (selectedTemplate) {
        await apiClient.put(`/api/v1/certificate-templates/${getTemplateId(selectedTemplate)}`, payload);
      } else {
        await apiClient.post('/api/v1/certificate-templates', payload);
      }
      setTemplateDialogOpen(false);
      setSelectedTemplate(null);
      setTemplateForm({ name: '', type: '', templateHtml: '' });
      fetchTemplates();
      setSnackbar({
        open: true,
        message: t(selectedTemplate ? 'certificates.templateUpdated' : 'certificates.templateCreated'),
        severity: 'success',
      });
    } catch (error: any) {
      console.error(`Failed to ${selectedTemplate ? 'update' : 'create'} template:`, error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || t(selectedTemplate ? 'certificates.templateUpdateFailed' : 'certificates.templateCreateFailed'),
        severity: 'error',
      });
    }
  };

  const handleOpenTemplate = async (template: CertificateTemplate) => {
    const templateId = getTemplateId(template);
    try {
      const response = await apiClient.get(`/api/v1/certificate-templates/${templateId}`);
      const details = response.data.data || template;
      setSelectedTemplate({ ...template, ...details });
      setTemplateForm({
        name: details.name || template.name,
        type: details.type || template.type,
        templateHtml: details.templateHtml || '',
      });
      setTemplateDialogOpen(true);
    } catch (error: any) {
      console.error('Failed to load certificate template:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || t('certificates.templateFetchFailed'),
        severity: 'error',
      });
    }
  };

  const handleDeleteTemplate = async (template: CertificateTemplate) => {
    if (!window.confirm(t('certificates.confirmDeleteTemplate'))) return;

    try {
      await apiClient.delete(`/api/v1/certificate-templates/${getTemplateId(template)}`);
      fetchTemplates();
      setSnackbar({ open: true, message: t('certificates.templateDeleted'), severity: 'success' });
    } catch (error: any) {
      console.error('Failed to delete certificate template:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error?.message || t('certificates.templateDeleteFailed'),
        severity: 'error',
      });
    }
  };

  const handleOpenNewTemplate = () => {
    setSelectedTemplate(null);
    setTemplateForm({ name: '', type: '', templateHtml: '' });
    setTemplateDialogOpen(true);
  };

  const handleCloseTemplateDialog = () => {
    setTemplateDialogOpen(false);
    setSelectedTemplate(null);
    setTemplateForm({ name: '', type: '', templateHtml: '' });
  };

const handleGenerateCertificate = async () => {
    try {
      setGenerating(true);
      await apiClient.post('/api/v1/certificates/generate', {
        templateId: parseInt(generateForm.templateId),
        studentId: parseInt(generateForm.studentId),
        issuedDateBS: generateForm.issuedDateBS,
        data: {
          studentName: generateForm.studentName,
          parentName: generateForm.parentName,
          className: generateForm.className,
          rollNumber: generateForm.rollNumber,
          academicYear: generateForm.academicYear,
        },
      });
      setSnackbar({ open: true, message: 'Certificate generated successfully!', severity: 'success' });
      setGenerateDialogOpen(false);
      setGenerateForm({
        templateId: '',
        studentId: '',
        issuedDateBS: '',
        studentName: '',
        parentName: '',
        className: '',
        rollNumber: '',
        academicYear: '',
      });
      fetchCertificates();
    } catch (error: any) {
      console.error('Failed to generate certificate:', error);
      setSnackbar({ open: true, message: error.response?.data?.error?.message || 'Failed to generate certificate', severity: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (bulkForm.selectedStudents.length === 0) {
      setSnackbar({ open: true, message: 'Please select at least one student', severity: 'error' });
      return;
    }
    try {
      setGenerating(true);
      const response = await apiClient.post('/api/v1/certificates/bulk-generate', {
        templateId: parseInt(bulkForm.templateId),
        students: bulkForm.selectedStudents.map(id => ({ studentId: id })),
        issuedDateBS: bulkForm.issuedDateBS,
        data: {
          academicYear: bulkForm.academicYear,
        },
      });
      setSnackbar({ 
        open: true, 
        message: `Generated ${response.data.data.success.length} certificates. ${response.data.data.failed.length} failed.`, 
        severity: 'success' 
      });
      setBulkGenerateDialogOpen(false);
      setBulkForm({
        templateId: '',
        selectedStudents: [],
        issuedDateBS: '',
        academicYear: '',
      });
      fetchCertificates();
    } catch (error: any) {
      console.error('Failed to bulk generate certificates:', error);
      setSnackbar({ open: true, message: error.response?.data?.error?.message || 'Failed to generate certificates', severity: 'error' });
    } finally {
      setGenerating(false);
    }
  };

const handleRevokeCertificate = async (certificateId: number) => {
    try {
      await apiClient.put(`/api/v1/certificates/${certificateId}/revoke`, { reason: 'Revoked by admin' });
      fetchCertificates();
    } catch (error) {
      console.error('Failed to revoke certificate:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    const found = CERTIFICATE_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'revoked': return 'error';
      default: return 'default';
    }
  };

  const getTemplateId = (template: CertificateTemplate) => template.templateId ?? template.id ?? 0;
  const getCertificateId = (certificate: Certificate) => certificate.certificateId ?? certificate.id ?? 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('certificates.management')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined" sx={S.BTN_OUTLINE}
            startIcon={<QrCodeIcon />}
            onClick={() => navigate('/certificates/verify')}
          >
            {t('certificates.verifyCertificate')}
          </Button>
        </Box>
      </Box>

      <Paper sx={{ ...S.GLASS, mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label={t('certificates.templates')} />
          <Tab label={t('certificates.title')} />
          <Tab label={t('certificates.generate')} />
        </Tabs>
      </Paper>

      {/* Templates Tab */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ ...S.GLASS, p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label={t('certificates.searchTemplates')}
              variant="outlined"
              size="small"
              value={templateSearch}
              onChange={(e) => {
                setTemplatePage(0);
                setTemplateSearch(e.target.value);
              }}
              sx={{ minWidth: 250 }}
              InputProps={{
                endAdornment: <SearchIcon />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="template-type-filter-label">{t('common.type')}</InputLabel>
              <Select
                labelId="template-type-filter-label"
                value={templateTypeFilter}
                label={t('common.type')}
                onChange={(e) => {
                  setTemplatePage(0);
                  setTemplateTypeFilter(e.target.value);
                }}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {CERTIFICATE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained" sx={S.BTN_PRIMARY}
              startIcon={<AddIcon />}
              onClick={handleOpenNewTemplate}
            >
              {t('certificates.addTemplate')}
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>{t('common.name')}</TableCell>
                <TableCell>{t('common.type')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('common.created')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templatesLoading ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={6} align="center" sx={S.TD}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={6} align="center" sx={S.TD}>
                    {t('certificates.noTemplatesFound')}
                  </TableCell>
                </TableRow>
              ) : (
                templates.slice(templatePage * templatesPerPage, (templatePage + 1) * templatesPerPage).map((template) => (
                  <TableRow key={getTemplateId(template) || template.name} hover sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{getTemplateId(template)}</TableCell>
                    <TableCell sx={S.TD}>{template.name}</TableCell>
                    <TableCell sx={S.TD}>{getTypeLabel(template.type)}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip
                        label={template.isActive ? 'Active' : 'Inactive'}
                        color={template.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={S.TD}>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right" sx={S.TD}>
                      <IconButton
                        size="small"
                        aria-label={`${t('certificates.editTemplate')} ${template.name}`}
                        onClick={() => handleOpenTemplate(template)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={`${t('common.delete')} ${template.name}`}
                        onClick={() => handleDeleteTemplate(template)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={templatesTotal}
            rowsPerPage={templatesPerPage}
            page={templatePage}
            onPageChange={(_, newPage) => setTemplatePage(newPage)}
            onRowsPerPageChange={(e) => {
              setTemplatesPerPage(parseInt(e.target.value, 10));
              setTemplatePage(0);
            }}
          />
        </TableContainer>
      </TabPanel>

      {/* Certificates Tab */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ ...S.GLASS, p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label={t('certificates.searchCertificates')}
              variant="outlined"
              size="small"
              value={certSearch}
              onChange={(e) => {
                setCertPage(0);
                setCertSearch(e.target.value);
              }}
              sx={{ minWidth: 250 }}
              InputProps={{
                endAdornment: <SearchIcon />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="certificate-type-filter-label">{t('common.type')}</InputLabel>
              <Select
                labelId="certificate-type-filter-label"
                value={certTypeFilter}
                label={t('common.type')}
                onChange={(e) => {
                  setCertPage(0);
                  setCertTypeFilter(e.target.value);
                }}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                {CERTIFICATE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="certificate-status-filter-label">{t('common.status')}</InputLabel>
              <Select
                labelId="certificate-status-filter-label"
                value={certStatusFilter}
                label={t('common.status')}
                onChange={(e) => {
                  setCertPage(0);
                  setCertStatusFilter(e.target.value);
                }}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                <MenuItem value="active">{t('certificates.active')}</MenuItem>
                <MenuItem value="revoked">{t('certificates.revoked')}</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined" sx={S.BTN_OUTLINE}
              startIcon={<RefreshIcon />}
              onClick={fetchCertificates}
            >
              {t('common.refresh')}
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>{t('certificates.certificateNo')}</TableCell>
                <TableCell>{t('certificates.student')}</TableCell>
                <TableCell>{t('common.type')}</TableCell>
                <TableCell>{t('certificates.issuedDate')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificatesLoading ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={6} align="center" sx={S.TD}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : certificates.length === 0 ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={6} align="center" sx={S.TD}>
                    {t('certificates.noCertificatesFound')}
                  </TableCell>
                </TableRow>
              ) : (
                certificates.slice(certPage * certsPerPage, (certPage + 1) * certsPerPage).map((cert) => (
                  <TableRow key={getCertificateId(cert) || cert.certificateNumber} hover sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>
                      <Typography variant="body2" fontWeight="bold">
                        {cert.certificateNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={S.TD}>{cert.studentName}</TableCell>
                    <TableCell sx={S.TD}>{getTypeLabel(cert.type)}</TableCell>
                    <TableCell sx={S.TD}>
                      {cert.issuedDateBS} BS
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {cert.issuedDate} AD
                      </Typography>
                    </TableCell>
                    <TableCell sx={S.TD}>
                      <Chip
                        label={cert.status}
                        color={getStatusColor(cert.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right" sx={S.TD}>
                      <IconButton
                        size="small"
                        title="View"
                        onClick={() => setSelectedCertificate(cert)}
                      >
                        <ViewIcon />
                      </IconButton>
                      {cert.pdfUrl && (
                        <IconButton
                          size="small"
                          title="Download PDF"
                          onClick={() => window.open(resolveApiAssetUrl(cert.pdfUrl!), '_blank', 'noopener,noreferrer')}
                        >
                          <DownloadIcon />
                        </IconButton>
                      )}
                      {cert.status === 'active' && (
                        <IconButton
                          size="small"
                          title="Revoke"
                          color="error"
                          onClick={() => handleRevokeCertificate(getCertificateId(cert))}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={certificatesTotal}
            rowsPerPage={certsPerPage}
            page={certPage}
            onPageChange={(_, newPage) => setCertPage(newPage)}
            onRowsPerPageChange={(e) => {
              setCertsPerPage(parseInt(e.target.value, 10));
              setCertPage(0);
            }}
          />
        </TableContainer>
      </TabPanel>

      {/* Generate Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ ...S.GLASS }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Generate Single Certificate
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Generate a certificate for a single student using an existing template.
                </Typography>
                <Button
                  variant="contained" sx={S.BTN_PRIMARY}
                  fullWidth
                  onClick={() => setGenerateDialogOpen(true)}
                >
                  Generate Single Certificate
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ ...S.GLASS }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bulk Generation
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Generate certificates for multiple students at once.
                </Typography>
<Button
                  variant="outlined" sx={S.BTN_OUTLINE}
                  fullWidth
                  onClick={() => setBulkGenerateDialogOpen(true)}
                >
                  Bulk Generate
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Create Template Dialog */}
      <Dialog open={templateDialogOpen} onClose={handleCloseTemplateDialog} maxWidth="md" fullWidth>
        <DialogTitle>{t(selectedTemplate ? 'certificates.editTemplate' : 'certificates.createTemplate')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={t('certificates.templateName')}
              fullWidth
              required
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel id="create-template-type-label" required>{t('certificates.certificateType')}</InputLabel>
              <Select
                labelId="create-template-type-label"
                value={templateForm.type}
                label={t('certificates.certificateType')}
                onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
              >
                {CERTIFICATE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('certificates.templateHtml')}
              fullWidth
              required
              multiline
              rows={6}
              value={templateForm.templateHtml}
              onChange={(e) => setTemplateForm({ ...templateForm, templateHtml: e.target.value })}
              placeholder="<div class='certificate'>{{student_name}}...</div>"
              helperText={t('certificates.availableVarsNote')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTemplateDialog}>{t('common.cancel')}</Button>
          <Button variant="contained" sx={S.BTN_PRIMARY} onClick={handleCreateTemplate}>
            {t(selectedTemplate ? 'common.update' : 'common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Certificate Details Dialog */}
      <Dialog
        open={!!selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('certificates.certificateDetails')}</DialogTitle>
        <DialogContent>
          {selectedCertificate && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Certificate Number: {selectedCertificate.certificateNumber}
                  </Alert>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('certificates.studentName')}
                  </Typography>
                  <Typography variant="body1">{selectedCertificate.studentName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('certificates.certificateType')}
                  </Typography>
                  <Typography variant="body1">{getTypeLabel(selectedCertificate.type)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('certificates.issuedDateBS')}
                  </Typography>
                  <Typography variant="body1">{selectedCertificate.issuedDateBS}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('certificates.issuedDateAD')}
                  </Typography>
                  <Typography variant="body1">{selectedCertificate.issuedDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t('common.status')}
                  </Typography>
                  <Chip
                    label={selectedCertificate.status}
                    color={getStatusColor(selectedCertificate.status)}
                    size="small"
                  />
                </Grid>
                {selectedCertificate.pdfUrl && (
                  <Grid item xs={12}>
                    <Button
                      variant="outlined" sx={S.BTN_OUTLINE}
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open(resolveApiAssetUrl(selectedCertificate.pdfUrl!), '_blank', 'noopener,noreferrer')}
                    >
                      {t('certificates.downloadPdf')}
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
<DialogActions>
          <Button onClick={() => setSelectedCertificate(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Generate Single Certificate Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('certificates.singleGenerate')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="generate-template-label">{t('certificates.template')}</InputLabel>
                  <Select
                    labelId="generate-template-label"
                    value={generateForm.templateId}
                    label={t('certificates.template')}
                    onChange={(e) => setGenerateForm({ ...generateForm, templateId: e.target.value })}
                  >
                    {availableTemplates.map((template) => (
                      <MenuItem key={getTemplateId(template) || template.name} value={getTemplateId(template)}>
                        {template.name} ({getTypeLabel(template.type)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="generate-student-label">{t('certificates.student')}</InputLabel>
                  <Select
                    labelId="generate-student-label"
                    value={generateForm.studentId}
                    label={t('certificates.student')}
                    onChange={(e) => {
                      const student = students.find(s => s.studentId === parseInt(e.target.value));
                      setGenerateForm({ 
                        ...generateForm, 
                        studentId: e.target.value,
                        studentName: student ? `${student.firstName} ${student.lastName}` : ''
                      });
                    }}
                  >
                    {students.map((student) => (
                      <MenuItem key={student.studentId} value={student.studentId}>
                        {student.firstName} {student.lastName} ({student.studentCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('certificates.issuedDateBS')}
                  fullWidth
                  required
                  value={generateForm.issuedDateBS}
                  onChange={(e) => setGenerateForm({ ...generateForm, issuedDateBS: e.target.value })}
                  placeholder="2081/01/15"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('common.academicYear')}
                  fullWidth
                  value={generateForm.academicYear}
                  onChange={(e) => setGenerateForm({ ...generateForm, academicYear: e.target.value })}
                  placeholder="2081-2082"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('certificates.studentName')}
                  fullWidth
                  value={generateForm.studentName}
                  onChange={(e) => setGenerateForm({ ...generateForm, studentName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('certificates.parentGuardianName')}
                  fullWidth
                  value={generateForm.parentName}
                  onChange={(e) => setGenerateForm({ ...generateForm, parentName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('common.class')}
                  fullWidth
                  value={generateForm.className}
                  onChange={(e) => setGenerateForm({ ...generateForm, className: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('certificates.rollNumber')}
                  fullWidth
                  value={generateForm.rollNumber}
                  onChange={(e) => setGenerateForm({ ...generateForm, rollNumber: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button 
            variant="contained" sx={S.BTN_PRIMARY} 
            onClick={handleGenerateCertificate}
            disabled={generating || !generateForm.templateId || !generateForm.studentId || !generateForm.issuedDateBS}
          >
            {generating ? <CircularProgress size={24} /> : t('certificates.generate')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Generate Dialog */}
      <Dialog open={bulkGenerateDialogOpen} onClose={() => setBulkGenerateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('certificates.bulkGenerateCertificates')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Select a template and multiple students to generate certificates in bulk.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="bulk-generate-template-label">{t('certificates.template')}</InputLabel>
                  <Select
                    labelId="bulk-generate-template-label"
                    value={bulkForm.templateId}
                    label={t('certificates.template')}
                    onChange={(e) => setBulkForm({ ...bulkForm, templateId: e.target.value })}
                  >
                    {availableTemplates.map((template) => (
                      <MenuItem key={getTemplateId(template) || template.name} value={getTemplateId(template)}>
                        {template.name} ({getTypeLabel(template.type)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('certificates.issuedDateBS')}
                  fullWidth
                  required
                  value={bulkForm.issuedDateBS}
                  onChange={(e) => setBulkForm({ ...bulkForm, issuedDateBS: e.target.value })}
                  placeholder="2081/01/15"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('common.academicYear')}
                  fullWidth
                  value={bulkForm.academicYear}
                  onChange={(e) => setBulkForm({ ...bulkForm, academicYear: e.target.value })}
                  placeholder="2081-2082"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('certificates.selectStudents')} ({bulkForm.selectedStudents.length} selected)
                </Typography>
                <Autocomplete
                  multiple
                  options={students}
                  disableCloseOnSelect
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.studentCode})`}
                  value={students.filter(s => bulkForm.selectedStudents.includes(s.studentId))}
                  onChange={(_, newValue) => {
                    setBulkForm({ ...bulkForm, selectedStudents: newValue.map(s => s.studentId) });
                  }}
                  renderOption={(props, option, { selected }) => {
                    const { key, ...otherProps } = props as any;
                    return (
                      <li key={option.studentId} {...otherProps}>
                        <Checkbox
                          icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                          checkedIcon={<CheckBoxIcon fontSize="small" />}
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        {option.firstName} {option.lastName} ({option.studentCode})
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label={t('certificates.students')} placeholder="Search students..." />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkGenerateDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button 
            variant="contained" sx={S.BTN_PRIMARY} 
            onClick={handleBulkGenerate}
            disabled={generating || !bulkForm.templateId || bulkForm.selectedStudents.length === 0 || !bulkForm.issuedDateBS}
          >
            {generating ? <CircularProgress size={24} /> : `Generate ${bulkForm.selectedStudents.length} Certificates`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

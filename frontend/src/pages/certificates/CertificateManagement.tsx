/**
 * Certificate Management Page (Admin)
 * 
 * Manage certificate templates, generate certificates, and view certificate registry
 * 
 * Requirements: 25.2, 25.3, 25.5
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
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

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
  id: number;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

interface Certificate {
  id: number;
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
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  
  // Templates state
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatePage, setTemplatePage] = useState(0);
  const [templatesPerPage, setTemplatesPerPage] = useState(10);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateTypeFilter, setTemplateTypeFilter] = useState('');
  
  // Certificates state
  const [certificates, setCertificates] = useState<Certificate[]>([]);
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
    fetchTemplates();
    fetchCertificates();
  }, []);

  useEffect(() => {
    if (generateDialogOpen || bulkGenerateDialogOpen) {
      fetchStudents();
      fetchAvailableTemplates();
    }
  }, [generateDialogOpen, bulkGenerateDialogOpen]);

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get('/api/v1/students?limit=1000');
      setStudents(response.data.data || []);
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

const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const params = new URLSearchParams({
        page: (templatePage + 1).toString(),
        limit: templatesPerPage.toString(),
        ...(templateSearch && { search: templateSearch }),
        ...(templateTypeFilter && { type: templateTypeFilter }),
      });
      const response = await apiClient.get(`/api/v1/certificate-templates?${params}`);
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

const fetchCertificates = async () => {
    try {
      setCertificatesLoading(true);
      const params = new URLSearchParams({
        page: (certPage + 1).toString(),
        limit: certsPerPage.toString(),
        ...(certSearch && { search: certSearch }),
        ...(certTypeFilter && { type: certTypeFilter }),
        ...(certStatusFilter && { status: certStatusFilter }),
      });
      const response = await apiClient.get(`/api/v1/certificates?${params}`);
      setCertificates(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setCertificatesLoading(false);
    }
  };

const handleCreateTemplate = async () => {
    try {
      await apiClient.post('/api/v1/certificate-templates', templateForm);
      setTemplateDialogOpen(false);
      setTemplateForm({ name: '', type: '', templateHtml: '' });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Certificate Management / प्रमाणपत्र व्यवस्थापन
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<QrCodeIcon />}
            onClick={() => navigate('/certificates/verify')}
          >
            Verify Certificate / प्रमाणपत्र प्रमाणित गर्नुहोस्
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Templates / टेम्पलेट" />
          <Tab label="Certificates / प्रमाणपत्र" />
          <Tab label="Generate / उत्पन्न गर्नुहोस्" />
        </Tabs>
      </Paper>

      {/* Templates Tab */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Search Templates / खोज्नुहोस्"
              variant="outlined"
              size="small"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              sx={{ minWidth: 250 }}
              InputProps={{
                endAdornment: <SearchIcon />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Type / प्रकार</InputLabel>
              <Select
                value={templateTypeFilter}
                label="Type / प्रकार"
                onChange={(e) => setTemplateTypeFilter(e.target.value)}
              >
                <MenuItem value="">All / सबै</MenuItem>
                {CERTIFICATE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setTemplateDialogOpen(true)}
            >
              Add Template / टेम्पलेट थप्नुहोस्
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name / नाम</TableCell>
                <TableCell>Type / प्रकार</TableCell>
                <TableCell>Status / स्थिति</TableCell>
                <TableCell>Created / सिर्जित</TableCell>
                <TableCell align="right">Actions / कार्यहरू</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templatesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No templates found / कुनै टेम्पलेट फेला परेन
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id} hover>
                    <TableCell>{template.id}</TableCell>
                    <TableCell>{template.name}</TableCell>
                    <TableCell>{getTypeLabel(template.type)}</TableCell>
                    <TableCell>
                      <Chip
                        label={template.isActive ? 'Active' : 'Inactive'}
                        color={template.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" title="Edit">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" title="Delete">
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
            count={-1}
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
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Search Certificates / खोज्नुहोस्"
              variant="outlined"
              size="small"
              value={certSearch}
              onChange={(e) => setCertSearch(e.target.value)}
              sx={{ minWidth: 250 }}
              InputProps={{
                endAdornment: <SearchIcon />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Type / प्रकार</InputLabel>
              <Select
                value={certTypeFilter}
                label="Type / प्रकार"
                onChange={(e) => setCertTypeFilter(e.target.value)}
              >
                <MenuItem value="">All / सबै</MenuItem>
                {CERTIFICATE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status / स्थिति</InputLabel>
              <Select
                value={certStatusFilter}
                label="Status / स्थिति"
                onChange={(e) => setCertStatusFilter(e.target.value)}
              >
                <MenuItem value="">All / सबै</MenuItem>
                <MenuItem value="active">Active / सक्रिय</MenuItem>
                <MenuItem value="revoked">Revoked / रद्द</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchCertificates}
            >
              Refresh / ताजा गर्नुहोस्
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Certificate No. / प्रमाणपत्र नं.</TableCell>
                <TableCell>Student / विद्यार्थी</TableCell>
                <TableCell>Type / प्रकार</TableCell>
                <TableCell>Issued Date / जारी मिति</TableCell>
                <TableCell>Status / स्थिति</TableCell>
                <TableCell align="right">Actions / कार्यहरू</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificatesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : certificates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No certificates found / कुनै प्रमाणपत्र फेला परेन
                  </TableCell>
                </TableRow>
              ) : (
                certificates.map((cert) => (
                  <TableRow key={cert.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {cert.certificateNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{cert.studentName}</TableCell>
                    <TableCell>{getTypeLabel(cert.type)}</TableCell>
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
                        title="View"
                        onClick={() => setSelectedCertificate(cert)}
                      >
                        <ViewIcon />
                      </IconButton>
                      {cert.pdfUrl && (
                        <IconButton
                          size="small"
                          title="Download PDF"
                          onClick={() => window.open(cert.pdfUrl, '_blank')}
                        >
                          <DownloadIcon />
                        </IconButton>
                      )}
                      {cert.status === 'active' && (
                        <IconButton
                          size="small"
                          title="Revoke"
                          color="error"
                          onClick={() => handleRevokeCertificate(cert.id)}
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
            count={-1}
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
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Generate Single Certificate
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Generate a certificate for a single student using an existing template.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setGenerateDialogOpen(true)}
                >
                  Generate Single Certificate
                </Button>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bulk Generation
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Generate certificates for multiple students at once.
                </Typography>
<Button
                  variant="outlined"
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
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Certificate Template / प्रमाणपत्र टेम्पलेट सिर्जना गर्नुहोस्</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Template Name / टेम्पलेट नाम"
              fullWidth
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Certificate Type / प्रमाणपत्र प्रकार</InputLabel>
              <Select
                value={templateForm.type}
                label="Certificate Type / प्रमाणपत्र प्रकार"
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
              label="Template HTML / टेम्पलेट HTML"
              fullWidth
              multiline
              rows={6}
              value={templateForm.templateHtml}
              onChange={(e) => setTemplateForm({ ...templateForm, templateHtml: e.target.value })}
              placeholder="<div class='certificate'>{{student_name}}...</div>"
              helperText="Use {{variable_name}} for dynamic fields"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Cancel / रद्द गर्नुहोस्</Button>
          <Button variant="contained" onClick={handleCreateTemplate}>
            Create / सिर्जना गर्नुहोस्
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
        <DialogTitle>Certificate Details / प्रमाणपत्र विवरण</DialogTitle>
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
                    Student Name / विद्यार्थीको नाम
                  </Typography>
                  <Typography variant="body1">{selectedCertificate.studentName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Certificate Type / प्रमाणपत्र प्रकार
                  </Typography>
                  <Typography variant="body1">{getTypeLabel(selectedCertificate.type)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Issued Date BS / जारी मिति (BS)
                  </Typography>
                  <Typography variant="body1">{selectedCertificate.issuedDateBS}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Issued Date AD / जारी मिति (AD)
                  </Typography>
                  <Typography variant="body1">{selectedCertificate.issuedDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status / स्थिति
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
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open(selectedCertificate.pdfUrl, '_blank')}
                    >
                      Download PDF / पीडीएफ डाउनलोड गर्नुहोस्
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
<DialogActions>
          <Button onClick={() => setSelectedCertificate(null)}>Close / बन्द गर्नुहोस्</Button>
        </DialogActions>
      </Dialog>

      {/* Generate Single Certificate Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate Single Certificate / एकल प्रमाणपत्र उत्पन्न गर्नुहोस्</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Template / टेम्पलेट</InputLabel>
                  <Select
                    value={generateForm.templateId}
                    label="Template / टेम्पलेट"
                    onChange={(e) => setGenerateForm({ ...generateForm, templateId: e.target.value })}
                  >
                    {availableTemplates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name} ({getTypeLabel(template.type)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Student / विद्यार्थी</InputLabel>
                  <Select
                    value={generateForm.studentId}
                    label="Student / विद्यार्थी"
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
                  label="Issued Date (BS) / जारी मिति (BS)"
                  fullWidth
                  required
                  value={generateForm.issuedDateBS}
                  onChange={(e) => setGenerateForm({ ...generateForm, issuedDateBS: e.target.value })}
                  placeholder="2081/01/15"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Academic Year / शैक्षिक वर्ष"
                  fullWidth
                  value={generateForm.academicYear}
                  onChange={(e) => setGenerateForm({ ...generateForm, academicYear: e.target.value })}
                  placeholder="2081-2082"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Student Name / विद्यार्थीको नाम"
                  fullWidth
                  value={generateForm.studentName}
                  onChange={(e) => setGenerateForm({ ...generateForm, studentName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Parent/Guardian Name / अभिभावकको नाम"
                  fullWidth
                  value={generateForm.parentName}
                  onChange={(e) => setGenerateForm({ ...generateForm, parentName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Class / कक्षा"
                  fullWidth
                  value={generateForm.className}
                  onChange={(e) => setGenerateForm({ ...generateForm, className: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Roll Number / रोल नम्बर"
                  fullWidth
                  value={generateForm.rollNumber}
                  onChange={(e) => setGenerateForm({ ...generateForm, rollNumber: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel / रद्द गर्नुहोस्</Button>
          <Button 
            variant="contained" 
            onClick={handleGenerateCertificate}
            disabled={generating || !generateForm.templateId || !generateForm.studentId || !generateForm.issuedDateBS}
          >
            {generating ? <CircularProgress size={24} /> : 'Generate / उत्पन्न गर्नुहोस्'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Generate Dialog */}
      <Dialog open={bulkGenerateDialogOpen} onClose={() => setBulkGenerateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Generate Certificates / थोक प्रमाणपत्र उत्पन्न गर्नुहोस्</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Select a template and multiple students to generate certificates in bulk.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Template / टेम्पलेट</InputLabel>
                  <Select
                    value={bulkForm.templateId}
                    label="Template / टेम्पलेट"
                    onChange={(e) => setBulkForm({ ...bulkForm, templateId: e.target.value })}
                  >
                    {availableTemplates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name} ({getTypeLabel(template.type)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Issued Date (BS) / जारी मिति (BS)"
                  fullWidth
                  required
                  value={bulkForm.issuedDateBS}
                  onChange={(e) => setBulkForm({ ...bulkForm, issuedDateBS: e.target.value })}
                  placeholder="2081/01/15"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Academic Year / शैक्षिक वर्ष"
                  fullWidth
                  value={bulkForm.academicYear}
                  onChange={(e) => setBulkForm({ ...bulkForm, academicYear: e.target.value })}
                  placeholder="2081-2082"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Select Students / विद्यार्थी छान्नुहोस् ({bulkForm.selectedStudents.length} selected)
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
                    <TextField {...params} label="Students / विद्यार्थीहरू" placeholder="Search students..." />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkGenerateDialogOpen(false)}>Cancel / रद्द गर्नुहोस्</Button>
          <Button 
            variant="contained" 
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
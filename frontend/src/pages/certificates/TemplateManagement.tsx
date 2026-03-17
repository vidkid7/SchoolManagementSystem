/**
 * Certificate Template Management
 * 
 * Create, edit, and manage certificate templates
 * 
 * Requirements: 25.1, 25.2, 25.3
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
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
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import { C, useAdminStyles } from '../../theme/designTokens';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ContentCopy as CopyIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

import { useTranslation } from 'react-i18next';

const CERTIFICATE_TYPES = [
  { value: 'character', label: 'Character Certificate' },
  { value: 'transfer', label: 'Transfer Certificate' },
  { value: 'academic_excellence', label: 'Academic Excellence' },
  { value: 'eca', label: 'ECA Participation/Achievement' },
  { value: 'sports', label: 'Sports Participation/Achievement' },
  { value: 'course_completion', label: 'Course Completion' },
  { value: 'bonafide', label: 'Bonafide Certificate' },
  { value: 'conduct', label: 'Conduct Certificate' },
  { value: 'participation', label: 'Participation Certificate' },
];

interface Template {
  templateId: number;
  name: string;
  type: string;
  templateHtml: string;
  templateCss?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export const TemplateManagement = () => {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    type: 'character',
    templateHtml: '',
    templateCss: '',
    variables: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/certificate-templates');
      setTemplates(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch templates:', err);
      setError(err.response?.data?.error?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: Template) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        name: template.name,
        type: template.type,
        templateHtml: template.templateHtml,
        templateCss: template.templateCss || '',
        variables: template.variables || [],
        isActive: template.isActive,
      });
    } else {
      setSelectedTemplate(null);
      setFormData({
        name: '',
        type: 'character',
        templateHtml: getDefaultTemplate(),
        templateCss: getDefaultCss(),
        variables: [],
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTemplate(null);
    setError('');
  };

const handleSubmit = async () => {
    try {
      setError('');
      if (selectedTemplate) {
        await apiClient.put(`/api/v1/certificate-templates/${selectedTemplate.templateId}`, formData);
        setSuccess(t('certificates.templateUpdated'));
      } else {
        await apiClient.post('/api/v1/certificate-templates', formData);
        setSuccess(t('certificates.templateCreated'));
      }
      handleCloseDialog();
      fetchTemplates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to save template:', err);
      setError(err.response?.data?.error?.message || 'Failed to save template');
    }
  };

const handleDelete = async (templateId: number) => {
    if (!window.confirm(t('certificates.confirmDeleteTemplate'))) return;

    try {
      await apiClient.delete(`/api/v1/certificate-templates/${templateId}`);
      setSuccess(t('certificates.templateDeleted'));
      fetchTemplates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      setError(err.response?.data?.error?.message || 'Failed to delete template');
    }
  };

const handleToggleActive = async (templateId: number, isActive: boolean) => {
    try {
      await apiClient.patch(`/api/v1/certificate-templates/${templateId}`, { isActive: !isActive });
      setSuccess(`${!isActive ? t('certificates.templateActivated') : t('certificates.templateDeactivated')}`);
      fetchTemplates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to toggle template status:', err);
      setError(err.response?.data?.error?.message || 'Failed to update template status');
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      await apiClient.post('/api/v1/certificate-templates', {
        ...template,
        name: `${template.name} (Copy)`,
        templateId: undefined,
      });
      setSuccess(t('certificates.templateDuplicated'));
      fetchTemplates();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to duplicate template:', err);
      setError(err.response?.data?.error?.message || 'Failed to duplicate template');
    }
  };

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const getDefaultTemplate = () => {
    return `<div class="certificate">
  <div class="header">
    <h1>{{school_name}}</h1>
    <p>{{school_address}}</p>
  </div>
  
  <div class="title">
    <h2>CERTIFICATE</h2>
  </div>
  
  <div class="content">
    <p>This is to certify that</p>
    <h3>{{student_name}}</h3>
    <p>Son/Daughter of {{parent_name}}</p>
    <p>has successfully completed {{course_name}}</p>
    <p>during the academic year {{academic_year}}</p>
  </div>
  
  <div class="footer">
    <div class="signature">
      <p>_________________</p>
      <p>Principal</p>
      <p>{{issue_date}}</p>
    </div>
  </div>
</div>`;
  };

  const getDefaultCss = () => {
    return `.certificate {
  width: 800px;
  padding: 40px;
  border: 2px solid #333;
  font-family: 'Times New Roman', serif;
  text-align: center;
}

.header h1 {
  font-size: 32px;
  margin: 0;
  color: #4a5568;
}

.title h2 {
  font-size: 28px;
  margin: 30px 0;
  text-decoration: underline;
}

.content {
  margin: 40px 0;
  line-height: 2;
}

.content h3 {
  font-size: 24px;
  margin: 20px 0;
  text-decoration: underline;
}

.footer {
  margin-top: 60px;
}

.signature {
  float: right;
  text-align: center;
}`;
  };

  const getTypeLabel = (type: string) => {
    const found = CERTIFICATE_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DescriptionIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('certificates.templates')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('certificates.subtitle')}</Typography>
            </Box>
          </Box>
          <Button
            sx={S.BTN_PRIMARY}
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            {t('certificates.createTemplate')}
          </Button>
        </Box>
      </Paper>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {templates.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ ...S.GLASS, p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {t('certificates.noTemplatesFound')}
              </Typography>
            </Paper>
          </Grid>
        ) : (
          templates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.templateId}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" component="div">
                      {template.name}
                    </Typography>
                    <IconButton
                      size="small"
                      color={template.isActive ? 'success' : 'default'}
                      onClick={() => handleToggleActive(template.templateId, template.isActive)}
                      title={template.isActive ? 'Active' : 'Inactive'}
                    >
                      {template.isActive ? <ActiveIcon /> : <InactiveIcon />}
                    </IconButton>
                  </Box>
                  <Chip
                    label={getTypeLabel(template.type)}
                    size="small"
                    color="primary"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('certificates.variablesCount')}: {template.variables?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('common.created')}: {new Date(template.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => handlePreview(template)}
                  >
                    {t('certificates.preview')}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(template)}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<CopyIcon />}
                    onClick={() => handleDuplicate(template)}
                  >
                    {t('certificates.duplicate')}
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(template.templateId)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Create/Edit Template Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedTemplate ? t('certificates.editTemplate') : t('certificates.createTemplate')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('certificates.templateName')}
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>{t('certificates.certificateType')}</InputLabel>
                  <Select
                    value={formData.type}
                    label={t('certificates.certificateType')}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {CERTIFICATE_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Paper sx={{ ...S.GLASS, mt: 3 }}>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab label={t('certificates.htmlTemplateTab')} />
                <Tab label={t('certificates.cssStylesTab')} />
                <Tab label={t('certificates.variablesTab')} />
              </Tabs>
            </Paper>

            <TabPanel value={tabValue} index={0}>
              <TextField
                label={t('certificates.htmlTemplateTab')}
                fullWidth
                multiline
                rows={15}
                value={formData.templateHtml}
                onChange={(e) => setFormData({ ...formData, templateHtml: e.target.value })}
                placeholder="<div>{{variable_name}}</div>"
                helperText="Use {{variable_name}} for dynamic fields"
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TextField
                label={t('certificates.cssStylesTab')}
                fullWidth
                multiline
                rows={15}
                value={formData.templateCss}
                onChange={(e) => setFormData({ ...formData, templateCss: e.target.value })}
                placeholder=".certificate { padding: 20px; }"
              />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Available variables: student_name, parent_name, school_name, school_address, 
                course_name, academic_year, issue_date, certificate_number, class_name, 
                roll_number, date_of_birth, admission_date, etc.
              </Alert>
              <Typography variant="body2" color="text.secondary">
                {t('certificates.availableVarsNote')}
              </Typography>
            </TabPanel>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button sx={S.BTN_PRIMARY} onClick={handleSubmit}>
            {selectedTemplate ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('certificates.preview')}</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                {t('certificates.previewNote')}
              </Alert>
              <Paper
                sx={{
                  ...S.GLASS,
                  p: 3,
                  minHeight: 400,
                }}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: selectedTemplate.templateHtml
                      .replace(/{{student_name}}/g, 'John Doe')
                      .replace(/{{parent_name}}/g, 'Jane Doe')
                      .replace(/{{school_name}}/g, 'Sample School')
                      .replace(/{{school_address}}/g, 'Kathmandu, Nepal')
                      .replace(/{{course_name}}/g, 'Grade 10')
                      .replace(/{{academic_year}}/g, '2081-2082')
                      .replace(/{{issue_date}}/g, new Date().toLocaleDateString())
                      .replace(/{{certificate_number}}/g, 'CERT-2081-00001'),
                  }}
                />
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

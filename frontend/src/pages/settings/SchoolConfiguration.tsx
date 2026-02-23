/**
 * School Configuration Management
 * 
 * Exclusive access for School_Admin only
 * 
 * Features:
 * - View school configuration
 * - Create school configuration
 * - Update school details
 * - Upload school logo
 * - Deactivate configuration
 * - Configure branding (colors, theme)
 * - Configure localization (language, date format)
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import {
  School as SchoolIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface SchoolConfig {
  id: string;
  schoolNameEn: string;
  schoolNameNp: string;
  schoolCode: string;
  email: string;
  phone: string;
  website?: string;
  logoUrl?: string;
  addressEn: string;
  addressNp: string;
  city: string;
  district: string;
  province: string;
  postalCode?: string;
  establishedYear?: number;
  affiliationNumber?: string;
  principalName?: string;
  principalNameNp?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  defaultLanguage?: string;
  dateFormat?: string;
  fiscalYearStart?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
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

const DATE_FORMATS = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-02-23)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (23/02/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (02/23/2024)' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (23-02-2024)' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ne', label: 'नेपाली (Nepali)' },
];

const PROVINCES = [
  'Koshi Pradesh',
  'Madhesh Pradesh',
  'Bagmati Pradesh',
  'Gandaki Pradesh',
  'Lumbini Pradesh',
  'Karnali Pradesh',
  'Sudurpashchim Pradesh',
];

export const SchoolConfiguration = () => {
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<Partial<SchoolConfig>>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/api/v1/config/school');
      if (response.data.data) {
        setConfig(response.data.data);
        setFormData(response.data.data);
      } else {
        setConfig(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch config:', err);
      if (err.response?.status === 404) {
        setConfig(null);
      } else {
        setError(err.response?.data?.error?.message || 'Failed to load configuration');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (config) {
        // Update existing config
        const response = await apiClient.put(`/api/v1/config/school/${config.id}`, formData);
        setConfig(response.data.data);
        setSuccess('Configuration updated successfully');
      }
      
      setEditMode(false);
    } catch (err: any) {
      console.error('Failed to save config:', err);
      setError(err.response?.data?.error?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await apiClient.post('/api/v1/config/school', formData);
      setConfig(response.data.data);
      setFormData(response.data.data);
      setSuccess('Configuration created successfully');
      setCreateDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to create config:', err);
      setError(err.response?.data?.error?.message || 'Failed to create configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !config) return;

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('logo', file);

      const response = await apiClient.post(
        `/api/v1/config/school/${config.id}/logo`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      setConfig(response.data.data);
      setSuccess('Logo uploaded successfully');
    } catch (err: any) {
      console.error('Failed to upload logo:', err);
      setError(err.response?.data?.error?.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!config) return;

    if (!window.confirm('Are you sure you want to deactivate this configuration?')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await apiClient.post(`/api/v1/config/school/${config.id}/deactivate`);
      setSuccess('Configuration deactivated successfully');
      fetchConfig();
    } catch (err: any) {
      console.error('Failed to deactivate config:', err);
      setError(err.response?.data?.error?.message || 'Failed to deactivate configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(config || {});
    setEditMode(false);
    setError('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!config && !createDialogOpen) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          School Configuration / विद्यालय कन्फिगरेसन
        </Typography>
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          No school configuration found. Please create one to get started.
        </Alert>
        <Button
          variant="contained"
          startIcon={<SchoolIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Configuration / कन्फिगरेसन सिर्जना गर्नुहोस्
        </Button>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onClose={() => !saving && setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create School Configuration / विद्यालय कन्फिगरेसन सिर्जना गर्नुहोस्</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="School Name (English) *"
                    fullWidth
                    value={formData.schoolNameEn || ''}
                    onChange={(e) => setFormData({ ...formData, schoolNameEn: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="School Name (Nepali) *"
                    fullWidth
                    value={formData.schoolNameNp || ''}
                    onChange={(e) => setFormData({ ...formData, schoolNameNp: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="School Code *"
                    fullWidth
                    value={formData.schoolCode || ''}
                    onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email *"
                    type="email"
                    fullWidth
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Phone *"
                    fullWidth
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Website"
                    fullWidth
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Address (English) *"
                    fullWidth
                    value={formData.addressEn || ''}
                    onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Address (Nepali) *"
                    fullWidth
                    value={formData.addressNp || ''}
                    onChange={(e) => setFormData({ ...formData, addressNp: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="City *"
                    fullWidth
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="District *"
                    fullWidth
                    value={formData.district || ''}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Province *</InputLabel>
                    <Select
                      value={formData.province || ''}
                      label="Province *"
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    >
                      {PROVINCES.map((province) => (
                        <MenuItem key={province} value={province}>
                          {province}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)} disabled={saving}>
              Cancel / रद्द गर्नुहोस्
            </Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {saving ? 'Creating...' : 'Create / सिर्जना गर्नुहोस्'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          School Configuration / विद्यालय कन्फिगरेसन
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {config && (
            <Chip
              icon={config.isActive ? <CheckCircleIcon /> : <CancelIcon />}
              label={config.isActive ? 'Active' : 'Inactive'}
              color={config.isActive ? 'success' : 'default'}
            />
          )}
          {!editMode ? (
            <>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchConfig}
              >
                Refresh / ताजा गर्नुहोस्
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
              >
                Edit / सम्पादन गर्नुहोस्
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel / रद्द गर्नुहोस्
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <CircularProgress size={24} /> : 'Save / सुरक्षित गर्नुहोस्'}
              </Button>
            </>
          )}
        </Box>
      </Box>

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

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab icon={<SchoolIcon />} label="Basic Information" />
          <Tab icon={<PaletteIcon />} label="Branding" />
          <Tab icon={<LanguageIcon />} label="Localization" />
        </Tabs>
      </Paper>

      {/* Basic Information Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Logo Section */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  School Logo / विद्यालय लोगो
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar
                    src={config?.logoUrl}
                    sx={{ width: 120, height: 120 }}
                    variant="rounded"
                  >
                    <SchoolIcon sx={{ fontSize: 60 }} />
                  </Avatar>
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="logo-upload"
                      type="file"
                      onChange={handleLogoUpload}
                      disabled={uploading || !editMode}
                    />
                    <label htmlFor="logo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<UploadIcon />}
                        disabled={uploading || !editMode}
                      >
                        {uploading ? <CircularProgress size={24} /> : 'Upload Logo / लोगो अपलोड गर्नुहोस्'}
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Recommended: 500x500px, PNG or JPG
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* School Details */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  School Details / विद्यालय विवरण
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="School Name (English)"
                      fullWidth
                      value={formData.schoolNameEn || ''}
                      onChange={(e) => setFormData({ ...formData, schoolNameEn: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="School Name (Nepali)"
                      fullWidth
                      value={formData.schoolNameNp || ''}
                      onChange={(e) => setFormData({ ...formData, schoolNameNp: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="School Code"
                      fullWidth
                      value={formData.schoolCode || ''}
                      onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Established Year"
                      type="number"
                      fullWidth
                      value={formData.establishedYear || ''}
                      onChange={(e) => setFormData({ ...formData, establishedYear: parseInt(e.target.value) })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Email"
                      type="email"
                      fullWidth
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Phone"
                      fullWidth
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Website"
                      fullWidth
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Affiliation Number"
                      fullWidth
                      value={formData.affiliationNumber || ''}
                      onChange={(e) => setFormData({ ...formData, affiliationNumber: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Address (English)"
                      fullWidth
                      value={formData.addressEn || ''}
                      onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Address (Nepali)"
                      fullWidth
                      value={formData.addressNp || ''}
                      onChange={(e) => setFormData({ ...formData, addressNp: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="City"
                      fullWidth
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="District"
                      fullWidth
                      value={formData.district || ''}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Province</InputLabel>
                      <Select
                        value={formData.province || ''}
                        label="Province"
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        disabled={!editMode}
                      >
                        {PROVINCES.map((province) => (
                          <MenuItem key={province} value={province}>
                            {province}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Principal Name (English)"
                      fullWidth
                      value={formData.principalName || ''}
                      onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Principal Name (Nepali)"
                      fullWidth
                      value={formData.principalNameNp || ''}
                      onChange={(e) => setFormData({ ...formData, principalNameNp: e.target.value })}
                      disabled={!editMode}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Branding Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Brand Colors / ब्रान्ड रंगहरू
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Primary Color"
                  type="color"
                  fullWidth
                  value={formData.primaryColor || '#1976d2'}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Secondary Color"
                  type="color"
                  fullWidth
                  value={formData.secondaryColor || '#dc004e'}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Accent Color"
                  type="color"
                  fullWidth
                  value={formData.accentColor || '#f50057'}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Localization Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Localization Settings / स्थानीयकरण सेटिङ्हरू
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Default Language</InputLabel>
                  <Select
                    value={formData.defaultLanguage || 'en'}
                    label="Default Language"
                    onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                    disabled={!editMode}
                  >
                    {LANGUAGES.map((lang) => (
                      <MenuItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={formData.dateFormat || 'YYYY-MM-DD'}
                    label="Date Format"
                    onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                    disabled={!editMode}
                  >
                    {DATE_FORMATS.map((format) => (
                      <MenuItem key={format.value} value={format.value}>
                        {format.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Fiscal Year Start Month</InputLabel>
                  <Select
                    value={formData.fiscalYearStart || 7}
                    label="Fiscal Year Start Month"
                    onChange={(e) => setFormData({ ...formData, fiscalYearStart: Number(e.target.value) })}
                    disabled={!editMode}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <MenuItem key={month} value={month}>
                        {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Deactivate Section */}
      {config && config.isActive && editMode && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Alert severity="warning" sx={{ mb: 2 }}>
            Deactivating the configuration will disable it system-wide. This action can be reversed.
          </Alert>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeactivate}
            disabled={saving}
          >
            Deactivate Configuration / कन्फिगरेसन निष्क्रिय गर्नुहोस्
          </Button>
        </Box>
      )}
    </Box>
  );
};

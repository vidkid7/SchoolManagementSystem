/**
 * System Settings Page
 * 
 * Manage grading schemes, attendance rules, notification templates, and date format
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tabs,
  Tab,
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
  FormControlLabel,
  Checkbox,
  Switch,
  useTheme,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { motion } from 'framer-motion';
import { C, useAdminStyles, R } from '../../theme/designTokens';

const MotionCard = motion.create(Card);

interface GradingScheme {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  grades: Array<{
    grade: string;
    minPercentage: number;
    maxPercentage: number;
    gradePoint: number;
    description: string;
  }>;
}

interface AttendanceRule {
  id: string;
  name: string;
  minimumAttendancePercentage: number;
  lowAttendanceThreshold: number;
  criticalAttendanceThreshold: number;
  correctionWindowHours: number;
  allowTeacherCorrection: boolean;
  allowAdminCorrection: boolean;
  maxLeaveDaysPerMonth: number;
  maxLeaveDaysPerYear: number;
  requireLeaveApproval: boolean;
  enableLowAttendanceAlerts: boolean;
  alertParents: boolean;
  alertAdmins: boolean;
  isActive: boolean;
}

interface NotificationTemplate {
  id: string;
  name: string;
  code: string;
  category: 'attendance' | 'exam' | 'fee' | 'grade' | 'announcement' | 'leave' | 'library' | 'general';
  channel: 'sms' | 'email' | 'push' | 'in_app';
  language: 'nepali' | 'english';
  subject?: string;
  templateEn: string;
  templateNp?: string;
  variables?: string[];
  isActive?: boolean;
}

interface DateFormatSettings {
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  currency: string;
}

const DEFAULT_DATE_FORMAT_SETTINGS: DateFormatSettings = {
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm',
  numberFormat: 'en-US',
  currency: 'NPR',
};

export const SystemSettings = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [gradingSchemes, setGradingSchemes] = useState<GradingScheme[]>([]);
  const [attendanceRules, setAttendanceRules] = useState<AttendanceRule[]>([]);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const [dateFormatSettings, setDateFormatSettings] = useState<DateFormatSettings>(DEFAULT_DATE_FORMAT_SETTINGS);
  const [dateFormatAvailable, setDateFormatAvailable] = useState(false);
  
  const [gradingDialog, setGradingDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: GradingScheme }>({
    open: false,
    mode: 'create',
  });
  const [attendanceDialog, setAttendanceDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: AttendanceRule }>({
    open: false,
    mode: 'create',
  });
  const [templateDialog, setTemplateDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; data?: NotificationTemplate }>({
    open: false,
    mode: 'create',
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [gradingRes, attendanceRes, templatesRes, dateFormatRes] = await Promise.all([
        apiClient.get('/api/v1/system-settings/grading-schemes'),
        apiClient.get('/api/v1/system-settings/attendance-rules'),
        apiClient.get('/api/v1/system-settings/notification-templates'),
        apiClient.get('/api/v1/system-settings/date-format'),
      ]);
      setGradingSchemes(gradingRes.data.data || []);
      setAttendanceRules(attendanceRes.data.data || []);
      setNotificationTemplates(templatesRes.data.data || []);
      const dateSettings = dateFormatRes.data.data || {};
      setDateFormatSettings({ ...DEFAULT_DATE_FORMAT_SETTINGS, ...dateSettings });
      setDateFormatAvailable(Object.keys(dateSettings).length > 0);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGradingScheme = async (data: Partial<GradingScheme>) => {
    try {
      setError('');
      if (gradingDialog.mode === 'create') {
        await apiClient.post('/api/v1/system-settings/grading-schemes', data);
      } else {
        await apiClient.put(`/api/v1/system-settings/grading-schemes/${gradingDialog.data?.id}`, data);
      }
      setSuccess(t('systemSettings.successMessage'));
      setGradingDialog({ open: false, mode: 'create' });
      fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDeleteGradingScheme = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await apiClient.delete(`/api/v1/system-settings/grading-schemes/${id}`);
      fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSaveAttendanceRule = async (data: Partial<AttendanceRule>) => {
    try {
      setError('');
      if (attendanceDialog.mode === 'create') {
        await apiClient.post('/api/v1/system-settings/attendance-rules', data);
      } else {
        await apiClient.put(`/api/v1/system-settings/attendance-rules/${attendanceDialog.data?.id}`, data);
      }
      setSuccess(t('systemSettings.successMessage'));
      setAttendanceDialog({ open: false, mode: 'create' });
      fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDeleteAttendanceRule = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await apiClient.delete(`/api/v1/system-settings/attendance-rules/${id}`);
      fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSaveTemplate = async (data: Partial<NotificationTemplate>) => {
    try {
      setError('');
      if (templateDialog.mode === 'create') {
        await apiClient.post('/api/v1/system-settings/notification-templates', data);
      } else {
        await apiClient.put(`/api/v1/system-settings/notification-templates/${templateDialog.data?.id}`, data);
      }
      setSuccess(t('systemSettings.successMessage'));
      setTemplateDialog({ open: false, mode: 'create' });
      fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await apiClient.delete(`/api/v1/system-settings/notification-templates/${id}`);
      fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSaveDateFormat = async () => {
    try {
      setError('');
      await apiClient.put('/api/v1/system-settings/date-format', dateFormatSettings);
      setSuccess(t('systemSettings.successMessage'));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SecurityIcon sx={{ fontSize: 32, color: C.primary }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {t('systemSettings.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('systemSettings.subtitle')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ ...S.GLASS }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label={t('systemSettings.gradingSchemes')} />
          <Tab label={t('systemSettings.attendanceRules')} />
          <Tab label={t('systemSettings.notificationTemplates')} />
          <Tab label={t('systemSettings.dateFormat')} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Grading Schemes Tab */}
          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{t('systemSettings.gradingSchemes')}</Typography>
                <Button
                  sx={S.BTN_PRIMARY}
                  startIcon={<AddIcon />}
                  onClick={() => { setError(''); setGradingDialog({ open: true, mode: 'create' }); }}
                >
                  {t('systemSettings.addGradingScheme')}
                </Button>
              </Box>
              
              {gradingSchemes.length === 0 ? (
                <Typography color="text.secondary">{t('systemSettings.noGradingSchemes')}</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: S.TH_BG }}>
                        <TableCell sx={{ fontWeight: 600 }}>{t('systemSettings.schemeName')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('systemSettings.grades')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('systemSettings.isDefault')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('roles.active')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{t('staff.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gradingSchemes.map((scheme) => (
                        <TableRow key={scheme.id} hover>
                          <TableCell>{scheme.name}</TableCell>
                          <TableCell>{scheme.grades?.length || 0}</TableCell>
                          <TableCell>
                            {scheme.isDefault && <Chip label={t('systemSettings.isDefault')} size="small" color="primary" />}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={scheme.isActive ? t('roles.active') : t('roles.inactive')}
                              size="small"
                              color={scheme.isActive ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => { setError(''); setGradingDialog({ open: true, mode: 'edit', data: scheme }); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteGradingScheme(scheme.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Attendance Rules Tab */}
          {tabValue === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{t('systemSettings.attendanceRules')}</Typography>
                <Button
                  sx={S.BTN_PRIMARY}
                  startIcon={<AddIcon />}
                  onClick={() => { setError(''); setAttendanceDialog({ open: true, mode: 'create' }); }}
                >
                  {t('systemSettings.addAttendanceRule')}
                </Button>
              </Box>
              
              {attendanceRules.length === 0 ? (
                <Typography color="text.secondary">{t('systemSettings.noAttendanceRules')}</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: S.TH_BG }}>
                        <TableCell sx={{ fontWeight: 600 }}>{t('systemSettings.ruleName')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('systemSettings.minAttendance')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('systemSettings.lowAttendanceThreshold')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('systemSettings.criticalAttendanceThreshold')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('roles.active')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{t('staff.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceRules.map((rule) => (
                        <TableRow key={rule.id} hover>
                          <TableCell>{rule.name}</TableCell>
                          <TableCell>{rule.minimumAttendancePercentage}%</TableCell>
                          <TableCell>{rule.lowAttendanceThreshold}%</TableCell>
                          <TableCell>{rule.criticalAttendanceThreshold}%</TableCell>
                          <TableCell>
                            <Chip
                              label={rule.isActive ? t('roles.active') : t('roles.inactive')}
                              size="small"
                              color={rule.isActive ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => { setError(''); setAttendanceDialog({ open: true, mode: 'edit', data: rule }); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteAttendanceRule(rule.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Notification Templates Tab */}
          {tabValue === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{t('systemSettings.notificationTemplates')}</Typography>
                <Button
                  sx={S.BTN_PRIMARY}
                  startIcon={<AddIcon />}
                  onClick={() => { setError(''); setTemplateDialog({ open: true, mode: 'create' }); }}
                >
                  {t('systemSettings.addTemplate')}
                </Button>
              </Box>
              
              {notificationTemplates.length === 0 ? (
                <Typography color="text.secondary">{t('systemSettings.noTemplates')}</Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: S.TH_BG }}>
                        <TableCell sx={{ fontWeight: 600 }}>{t('systemSettings.templateName')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('systemSettings.templateCode')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('roles.active')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{t('staff.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {notificationTemplates.map((template) => (
                        <TableRow key={template.id} hover>
                          <TableCell>{template.name}</TableCell>
                          <TableCell>
                            <Chip label={template.code} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={template.isActive ? t('roles.active') : t('roles.inactive')}
                              size="small"
                              color={template.isActive ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => { setError(''); setTemplateDialog({ open: true, mode: 'edit', data: template }); }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteTemplate(template.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Date Format Tab */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>{t('systemSettings.dateFormatSettings')}</Typography>
              {!dateFormatAvailable && (
                <Alert severity="warning" sx={{ mb: 2 }}>{t('systemSettings.noActiveSchoolConfiguration')}</Alert>
              )}
              <Grid container spacing={3} maxWidth={600}>
                <Grid item xs={12}>
                  <TextField
                    label={t('systemSettings.dateFormatLabel')}
                    fullWidth
                    disabled={!dateFormatAvailable}
                    value={dateFormatSettings.dateFormat}
                    onChange={(e) => setDateFormatSettings({ ...dateFormatSettings, dateFormat: e.target.value })}
                    helperText="e.g., YYYY-MM-DD, DD/MM/YYYY, MM-DD-YYYY"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('systemSettings.timeFormat')}
                    fullWidth
                    disabled={!dateFormatAvailable}
                    value={dateFormatSettings.timeFormat}
                    onChange={(e) => setDateFormatSettings({ ...dateFormatSettings, timeFormat: e.target.value })}
                    helperText="e.g., HH:mm or hh:mm A"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('systemSettings.numberFormat')}
                    fullWidth
                    disabled={!dateFormatAvailable}
                    value={dateFormatSettings.numberFormat}
                    onChange={(e) => setDateFormatSettings({ ...dateFormatSettings, numberFormat: e.target.value })}
                    helperText="e.g., en-US"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('systemSettings.currency')}
                    fullWidth
                    disabled={!dateFormatAvailable}
                    value={dateFormatSettings.currency}
                    onChange={(e) => setDateFormatSettings({ ...dateFormatSettings, currency: e.target.value })}
                    helperText="e.g., NPR"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button sx={S.BTN_PRIMARY} disabled={!dateFormatAvailable} onClick={handleSaveDateFormat}>
                    {t('common.save')}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Grading Scheme Dialog */}
      <GradingSchemeDialog
        open={gradingDialog.open}
        mode={gradingDialog.mode}
        data={gradingDialog.data}
        saveError={error}
        onClose={() => setGradingDialog({ open: false, mode: 'create' })}
        onSave={handleSaveGradingScheme}
      />

      {/* Attendance Rule Dialog */}
      <AttendanceRuleDialog
        open={attendanceDialog.open}
        mode={attendanceDialog.mode}
        data={attendanceDialog.data}
        saveError={error}
        onClose={() => setAttendanceDialog({ open: false, mode: 'create' })}
        onSave={handleSaveAttendanceRule}
      />

      {/* Template Dialog */}
      <TemplateDialog
        open={templateDialog.open}
        mode={templateDialog.mode}
        data={templateDialog.data}
        saveError={error}
        onClose={() => setTemplateDialog({ open: false, mode: 'create' })}
        onSave={handleSaveTemplate}
      />
    </Box>
  );
};

interface GradingSchemeDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  data?: GradingScheme;
  saveError?: string;
  onClose: () => void;
  onSave: (data: Partial<GradingScheme>) => void;
}

const GradingSchemeDialog = ({ open, mode, data, saveError, onClose, onSave }: GradingSchemeDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    isDefault: boolean;
    isActive: boolean;
    grades: Array<{
      grade: string;
      minPercentage: number | '';
      maxPercentage: number | '';
      gradePoint: number | '';
      description: string;
    }>;
  }>({
    name: '',
    isDefault: false,
    isActive: true,
    grades: [{ grade: 'A', minPercentage: 90, maxPercentage: 100, gradePoint: 4.0, description: 'Excellent' }],
  });

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name,
        isDefault: data.isDefault,
        isActive: data.isActive,
        grades: data.grades || [],
      });
    } else {
      setFormData({
        name: '',
        isDefault: false,
        isActive: true,
        grades: [{ grade: 'A', minPercentage: 90, maxPercentage: 100, gradePoint: 4.0, description: 'Excellent' }],
      });
    }
    setSubmitted(false);
  }, [data, open]);

  const addGrade = () => {
    setFormData({
      ...formData,
      grades: [...formData.grades, { grade: '', minPercentage: '', maxPercentage: '', gradePoint: '', description: '' }],
    });
  };

  const updateGrade = (index: number, field: string, value: any) => {
    const newGrades = [...formData.grades];
    newGrades[index] = { ...newGrades[index], [field]: value };
    setFormData({ ...formData, grades: newGrades });
  };

  const removeGrade = (index: number) => {
    setFormData({
      ...formData,
      grades: formData.grades.filter((_, i) => i !== index),
    });
  };

  const hasInvalidGrade = (grade: (typeof formData.grades)[number]) =>
    !grade.grade.trim() ||
    !grade.description.trim() ||
    grade.minPercentage === '' || !Number.isFinite(Number(grade.minPercentage)) || Number(grade.minPercentage) < 0 || Number(grade.minPercentage) > 100 ||
    grade.maxPercentage === '' || !Number.isFinite(Number(grade.maxPercentage)) || Number(grade.maxPercentage) < 0 || Number(grade.maxPercentage) > 100 || Number(grade.minPercentage) > Number(grade.maxPercentage) ||
    grade.gradePoint === '' || !Number.isFinite(Number(grade.gradePoint)) || Number(grade.gradePoint) < 0 || Number(grade.gradePoint) > 4;

  const handleSave = () => {
    setSubmitted(true);
    if (!formData.name.trim() || formData.name.trim().length > 100 || formData.grades.length === 0 || formData.grades.some(hasInvalidGrade)) return;

    onSave({
      ...formData,
      grades: formData.grades.map((grade) => ({
        ...grade,
        minPercentage: Number(grade.minPercentage),
        maxPercentage: Number(grade.maxPercentage),
        gradePoint: Number(grade.gradePoint),
      })),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'create' ? t('systemSettings.addGradingScheme') : t('systemSettings.editGradingScheme')}
      </DialogTitle>
      <DialogContent>
        {saveError && <Alert severity="error" sx={{ mt: 1 }}>{saveError}</Alert>}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('systemSettings.schemeName')}
              fullWidth
              required
              error={submitted && (!formData.name.trim() || formData.name.trim().length > 100)}
              helperText={submitted && !formData.name.trim() ? t('systemSettings.schemeNameRequired') : submitted && formData.name.trim().length > 100 ? t('systemSettings.schemeNameTooLong') : ''}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
              }
              label={t('systemSettings.isDefault')}
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">{t('systemSettings.grades')}</Typography>
              <Button size="small" onClick={addGrade}>{t('systemSettings.addGrade')}</Button>
            </Box>
            {formData.grades.map((grade, index) => (
              <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                <Grid item xs={3}>
                  <TextField
                    label={t('systemSettings.grade')}
                    size="small"
                    fullWidth
                    required
                    error={submitted && !grade.grade.trim()}
                    helperText={submitted && !grade.grade.trim() ? t('systemSettings.gradeRequired') : ''}
                    value={grade.grade}
                    onChange={(e) => updateGrade(index, 'grade', e.target.value)}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    label={t('systemSettings.minPercentage')}
                    size="small"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ min: 0, max: 100 }}
                    error={submitted && (grade.minPercentage === '' || Number(grade.minPercentage) < 0 || Number(grade.minPercentage) > 100 || Number(grade.minPercentage) > Number(grade.maxPercentage))}
                    helperText={submitted && (grade.minPercentage === '' || Number(grade.minPercentage) < 0 || Number(grade.minPercentage) > 100 || Number(grade.minPercentage) > Number(grade.maxPercentage)) ? t('systemSettings.percentageRangeError') : ''}
                    value={grade.minPercentage}
                    onChange={(e) => updateGrade(index, 'minPercentage', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    label={t('systemSettings.maxPercentage')}
                    size="small"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ min: 0, max: 100 }}
                    error={submitted && (grade.maxPercentage === '' || Number(grade.maxPercentage) < 0 || Number(grade.maxPercentage) > 100 || Number(grade.minPercentage) > Number(grade.maxPercentage))}
                    helperText={submitted && (grade.maxPercentage === '' || Number(grade.maxPercentage) < 0 || Number(grade.maxPercentage) > 100 || Number(grade.minPercentage) > Number(grade.maxPercentage)) ? t('systemSettings.percentageRangeError') : ''}
                    value={grade.maxPercentage}
                    onChange={(e) => updateGrade(index, 'maxPercentage', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label={t('systemSettings.gradePoint')}
                    size="small"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ min: 0, max: 4, step: 0.1 }}
                    error={submitted && (grade.gradePoint === '' || Number(grade.gradePoint) < 0 || Number(grade.gradePoint) > 4)}
                    helperText={submitted && (grade.gradePoint === '' || Number(grade.gradePoint) < 0 || Number(grade.gradePoint) > 4) ? t('systemSettings.gradePointRangeError') : ''}
                    value={grade.gradePoint}
                    onChange={(e) => updateGrade(index, 'gradePoint', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </Grid>
                <Grid item xs={10} sm={11}>
                  <TextField
                    label={t('systemSettings.gradeDescription')}
                    size="small"
                    fullWidth
                    required
                    error={submitted && !grade.description.trim()}
                    helperText={submitted && !grade.description.trim() ? t('systemSettings.gradeDescriptionRequired') : ''}
                    value={grade.description}
                    onChange={(e) => updateGrade(index, 'description', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2} sm={1}>
                  <IconButton aria-label={t('common.delete')} size="small" color="error" onClick={() => removeGrade(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button sx={S.BTN_PRIMARY} onClick={handleSave}>{t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
};

interface AttendanceRuleDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  data?: AttendanceRule;
  saveError?: string;
  onClose: () => void;
  onSave: (data: Partial<AttendanceRule>) => void;
}

const AttendanceRuleDialog = ({ open, mode, data, saveError, onClose, onSave }: AttendanceRuleDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    minimumAttendancePercentage: 75,
    lowAttendanceThreshold: 75,
    criticalAttendanceThreshold: 60,
    correctionWindowHours: 24,
    allowTeacherCorrection: true,
    allowAdminCorrection: true,
    maxLeaveDaysPerMonth: 5,
    maxLeaveDaysPerYear: 30,
    requireLeaveApproval: true,
    enableLowAttendanceAlerts: true,
    alertParents: true,
    alertAdmins: true,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name,
        minimumAttendancePercentage: data.minimumAttendancePercentage,
        lowAttendanceThreshold: data.lowAttendanceThreshold,
        criticalAttendanceThreshold: data.criticalAttendanceThreshold,
        correctionWindowHours: data.correctionWindowHours,
        allowTeacherCorrection: data.allowTeacherCorrection,
        allowAdminCorrection: data.allowAdminCorrection,
        maxLeaveDaysPerMonth: data.maxLeaveDaysPerMonth,
        maxLeaveDaysPerYear: data.maxLeaveDaysPerYear,
        requireLeaveApproval: data.requireLeaveApproval,
        enableLowAttendanceAlerts: data.enableLowAttendanceAlerts,
        alertParents: data.alertParents,
        alertAdmins: data.alertAdmins,
      });
    } else {
      setFormData({
        name: '',
        minimumAttendancePercentage: 75,
        lowAttendanceThreshold: 75,
        criticalAttendanceThreshold: 60,
        correctionWindowHours: 24,
        allowTeacherCorrection: true,
        allowAdminCorrection: true,
        maxLeaveDaysPerMonth: 5,
        maxLeaveDaysPerYear: 30,
        requireLeaveApproval: true,
        enableLowAttendanceAlerts: true,
        alertParents: true,
        alertAdmins: true,
      });
    }
  }, [data, open]);

  useEffect(() => {
    if (open) setSubmitted(false);
  }, [open]);

  const handleSave = () => {
    setSubmitted(true);
    if (!formData.name.trim() || formData.name.trim().length > 100) return;
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? t('systemSettings.addAttendanceRule') : t('systemSettings.editAttendanceRule')}
      </DialogTitle>
      <DialogContent>
        {saveError && <Alert severity="error" sx={{ mt: 1 }}>{saveError}</Alert>}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label={t('systemSettings.ruleName')}
              fullWidth
              required
              inputProps={{ maxLength: 100 }}
              error={submitted && (!formData.name.trim() || formData.name.trim().length > 100)}
              helperText={submitted && !formData.name.trim() ? t('systemSettings.ruleNameRequired') : submitted && formData.name.trim().length > 100 ? t('systemSettings.ruleNameTooLong') : ''}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('systemSettings.minAttendance')}
              type="number"
              fullWidth
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              value={formData.minimumAttendancePercentage}
              onChange={(e) => setFormData({ ...formData, minimumAttendancePercentage: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('systemSettings.lowAttendanceThreshold')}
              type="number"
              fullWidth
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              value={formData.lowAttendanceThreshold}
              onChange={(e) => setFormData({ ...formData, lowAttendanceThreshold: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('systemSettings.criticalAttendanceThreshold')}
              type="number"
              fullWidth
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              value={formData.criticalAttendanceThreshold}
              onChange={(e) => setFormData({ ...formData, criticalAttendanceThreshold: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('systemSettings.correctionWindowHours')}
              type="number"
              fullWidth
              inputProps={{ min: 0, step: 1 }}
              value={formData.correctionWindowHours}
              onChange={(e) => setFormData({ ...formData, correctionWindowHours: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('systemSettings.maxLeaveDaysPerMonth')}
              type="number"
              fullWidth
              inputProps={{ min: 0, step: 1 }}
              value={formData.maxLeaveDaysPerMonth}
              onChange={(e) => setFormData({ ...formData, maxLeaveDaysPerMonth: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('systemSettings.maxLeaveDaysPerYear')}
              type="number"
              fullWidth
              inputProps={{ min: 0, step: 1 }}
              value={formData.maxLeaveDaysPerYear}
              onChange={(e) => setFormData({ ...formData, maxLeaveDaysPerYear: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel control={<Checkbox checked={formData.allowTeacherCorrection} onChange={(e) => setFormData({ ...formData, allowTeacherCorrection: e.target.checked })} />} label={t('systemSettings.allowTeacherCorrection')} />
            <FormControlLabel control={<Checkbox checked={formData.allowAdminCorrection} onChange={(e) => setFormData({ ...formData, allowAdminCorrection: e.target.checked })} />} label={t('systemSettings.allowAdminCorrection')} />
            <FormControlLabel control={<Checkbox checked={formData.requireLeaveApproval} onChange={(e) => setFormData({ ...formData, requireLeaveApproval: e.target.checked })} />} label={t('systemSettings.requireLeaveApproval')} />
            <FormControlLabel control={<Checkbox checked={formData.enableLowAttendanceAlerts} onChange={(e) => setFormData({ ...formData, enableLowAttendanceAlerts: e.target.checked })} />} label={t('systemSettings.enableLowAttendanceAlerts')} />
            <FormControlLabel control={<Checkbox checked={formData.alertParents} onChange={(e) => setFormData({ ...formData, alertParents: e.target.checked })} />} label={t('systemSettings.alertParents')} />
            <FormControlLabel control={<Checkbox checked={formData.alertAdmins} onChange={(e) => setFormData({ ...formData, alertAdmins: e.target.checked })} />} label={t('systemSettings.alertAdmins')} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button sx={S.BTN_PRIMARY} onClick={handleSave}>{t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
};

interface TemplateDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  data?: NotificationTemplate;
  saveError?: string;
  onClose: () => void;
  onSave: (data: Partial<NotificationTemplate>) => void;
}

const TemplateDialog = ({ open, mode, data, saveError, onClose, onSave }: TemplateDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'general' as NotificationTemplate['category'],
    channel: 'in_app' as NotificationTemplate['channel'],
    language: 'english' as NotificationTemplate['language'],
    subject: '',
    templateEn: '',
    templateNp: '',
  });

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name,
        code: data.code,
        category: data.category,
        channel: data.channel,
        language: data.language,
        subject: data.subject || '',
        templateEn: data.templateEn,
        templateNp: data.templateNp || '',
      });
    } else {
      setFormData({
        name: '',
        code: '',
        category: 'general',
        channel: 'in_app',
        language: 'english',
        subject: '',
        templateEn: '',
        templateNp: '',
      });
    }
    setSubmitted(false);
  }, [data, open]);

  const handleSave = () => {
    setSubmitted(true);
    if (!formData.name.trim() || formData.name.trim().length > 100 || !formData.code.trim() || formData.code.trim().length > 50 || !formData.templateEn.trim()) return;
    onSave({
      ...formData,
      name: formData.name.trim(),
      code: formData.code.trim(),
      subject: formData.subject.trim(),
      variables: Array.from(formData.templateEn.matchAll(/\{\{\s*([^}\s]+)\s*\}\}/g), (match) => match[1]),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'create' ? t('systemSettings.addTemplate') : t('systemSettings.editTemplate')}
      </DialogTitle>
      <DialogContent>
        {saveError && <Alert severity="error" sx={{ mt: 1 }}>{saveError}</Alert>}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('systemSettings.templateName')}
              fullWidth
              required
              inputProps={{ maxLength: 100 }}
              error={submitted && (!formData.name.trim() || formData.name.trim().length > 100)}
              helperText={submitted && !formData.name.trim() ? t('systemSettings.templateNameRequired') : submitted && formData.name.trim().length > 100 ? t('systemSettings.templateNameTooLong') : ''}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('systemSettings.templateCode')}
              fullWidth
              required
              inputProps={{ maxLength: 50 }}
              error={submitted && (!formData.code.trim() || formData.code.trim().length > 50)}
              helperText={submitted && !formData.code.trim() ? t('systemSettings.templateCodeRequired') : submitted && formData.code.trim().length > 50 ? t('systemSettings.templateCodeTooLong') : ''}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel id="notification-template-category-label">{t('systemSettings.category')}</InputLabel>
              <Select
                id="notification-template-category"
                labelId="notification-template-category-label"
                label={t('systemSettings.category')}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as NotificationTemplate['category'] })}
              >
                {(['attendance', 'exam', 'fee', 'grade', 'announcement', 'leave', 'library', 'general'] as const).map((category) => (
                  <MenuItem key={category} value={category}>{t(`systemSettings.templateCategory.${category}`)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel id="notification-template-channel-label">{t('systemSettings.channel')}</InputLabel>
              <Select
                id="notification-template-channel"
                labelId="notification-template-channel-label"
                label={t('systemSettings.channel')}
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as NotificationTemplate['channel'] })}
              >
                {(['sms', 'email', 'push', 'in_app'] as const).map((channel) => (
                  <MenuItem key={channel} value={channel}>{t(`systemSettings.templateChannel.${channel}`)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required>
              <InputLabel id="notification-template-language-label">{t('systemSettings.language')}</InputLabel>
              <Select
                id="notification-template-language"
                labelId="notification-template-language-label"
                label={t('systemSettings.language')}
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as NotificationTemplate['language'] })}
              >
                <MenuItem value="english">{t('systemSettings.english')}</MenuItem>
                <MenuItem value="nepali">{t('systemSettings.nepali')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={t('systemSettings.templateSubject')}
              fullWidth
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={t('systemSettings.templateEnglish')}
              fullWidth
              multiline
              rows={6}
              required
              error={submitted && !formData.templateEn.trim()}
              helperText={submitted && !formData.templateEn.trim() ? t('systemSettings.templateEnglishRequired') : t('systemSettings.templateVariablesHint')}
              value={formData.templateEn}
              onChange={(e) => setFormData({ ...formData, templateEn: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={t('systemSettings.templateNepali')}
              fullWidth
              multiline
              rows={4}
              value={formData.templateNp}
              onChange={(e) => setFormData({ ...formData, templateNp: e.target.value })}
              helperText="Use {{variable}} for dynamic content"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button sx={S.BTN_PRIMARY} onClick={handleSave}>{t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SystemSettings;

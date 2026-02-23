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
  alpha,
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

const MotionCard = motion.create(Card);

interface GradingScheme {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  grades: Array<{
    grade: string;
    minMarks: number;
    maxMarks: number;
    gradePoint: number;
  }>;
}

interface AttendanceRule {
  id: string;
  name: string;
  presentWeight: number;
  absentWeight: number;
  lateWeight: number;
  excusedWeight: number;
  minAttendance: number;
  isActive: boolean;
}

interface NotificationTemplate {
  id: string;
  name: string;
  code: string;
  content: string;
  isActive: boolean;
}

interface DateFormatSettings {
  dateFormat: string;
  fiscalYearStart: number;
}

export const SystemSettings = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [gradingSchemes, setGradingSchemes] = useState<GradingScheme[]>([]);
  const [attendanceRules, setAttendanceRules] = useState<AttendanceRule[]>([]);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const [dateFormatSettings, setDateFormatSettings] = useState<DateFormatSettings>({
    dateFormat: 'YYYY-MM-DD',
    fiscalYearStart: 1,
  });
  
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
        apiClient.get('/config/system-settings/grading-schemes'),
        apiClient.get('/config/system-settings/attendance-rules'),
        apiClient.get('/config/system-settings/notification-templates'),
        apiClient.get('/config/system-settings/date-format'),
      ]);
      setGradingSchemes(gradingRes.data.data || []);
      setAttendanceRules(attendanceRes.data.data || []);
      setNotificationTemplates(templatesRes.data.data || []);
      if (dateFormatRes.data.data) {
        setDateFormatSettings(dateFormatRes.data.data);
      }
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
        await apiClient.post('/config/system-settings/grading-schemes', data);
      } else {
        await apiClient.put(`/config/system-settings/grading-schemes/${gradingDialog.data?.id}`, data);
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
      await apiClient.delete(`/config/system-settings/grading-schemes/${id}`);
      fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSaveAttendanceRule = async (data: Partial<AttendanceRule>) => {
    try {
      setError('');
      if (attendanceDialog.mode === 'create') {
        await apiClient.post('/config/system-settings/attendance-rules', data);
      } else {
        await apiClient.put(`/config/system-settings/attendance-rules/${attendanceDialog.data?.id}`, data);
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
      await apiClient.delete(`/config/system-settings/attendance-rules/${id}`);
      fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSaveTemplate = async (data: Partial<NotificationTemplate>) => {
    try {
      setError('');
      if (templateDialog.mode === 'create') {
        await apiClient.post('/config/system-settings/notification-templates', data);
      } else {
        await apiClient.put(`/config/system-settings/notification-templates/${templateDialog.data?.id}`, data);
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
      await apiClient.delete(`/config/system-settings/notification-templates/${id}`);
      fetchAllData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSaveDateFormat = async () => {
    try {
      setError('');
      await apiClient.put('/config/system-settings/date-format', dateFormatSettings);
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          }}
        >
          <SecurityIcon sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {t('systemSettings.title')}
          </Typography>
        </Box>
      </Box>

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
      <Paper sx={{ borderRadius: 2 }}>
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
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setGradingDialog({ open: true, mode: 'create' })}
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
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
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
                            <IconButton size="small" onClick={() => setGradingDialog({ open: true, mode: 'edit', data: scheme })}>
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
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAttendanceDialog({ open: true, mode: 'create' })}
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
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableCell sx={{ fontWeight: 600 }}>{t('systemSettings.ruleName')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('systemSettings.presentWeight')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('systemSettings.minAttendance')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('roles.active')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{t('staff.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceRules.map((rule) => (
                        <TableRow key={rule.id} hover>
                          <TableCell>{rule.name}</TableCell>
                          <TableCell>{rule.presentWeight}%</TableCell>
                          <TableCell>{rule.minAttendance}%</TableCell>
                          <TableCell>
                            <Chip
                              label={rule.isActive ? t('roles.active') : t('roles.inactive')}
                              size="small"
                              color={rule.isActive ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => setAttendanceDialog({ open: true, mode: 'edit', data: rule })}>
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
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setTemplateDialog({ open: true, mode: 'create' })}
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
                      <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
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
                            <IconButton size="small" onClick={() => setTemplateDialog({ open: true, mode: 'edit', data: template })}>
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
              <Grid container spacing={3} maxWidth={600}>
                <Grid item xs={12}>
                  <TextField
                    label={t('systemSettings.dateFormatLabel')}
                    fullWidth
                    value={dateFormatSettings.dateFormat}
                    onChange={(e) => setDateFormatSettings({ ...dateFormatSettings, dateFormat: e.target.value })}
                    helperText="e.g., YYYY-MM-DD, DD/MM/YYYY, MM-DD-YYYY"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={t('systemSettings.fiscalYearStart')}
                    type="number"
                    fullWidth
                    value={dateFormatSettings.fiscalYearStart}
                    onChange={(e) => setDateFormatSettings({ ...dateFormatSettings, fiscalYearStart: parseInt(e.target.value) })}
                    inputProps={{ min: 1, max: 12 }}
                    helperText="Month number (1-12)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleSaveDateFormat}>
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
        onClose={() => setGradingDialog({ open: false, mode: 'create' })}
        onSave={handleSaveGradingScheme}
      />

      {/* Attendance Rule Dialog */}
      <AttendanceRuleDialog
        open={attendanceDialog.open}
        mode={attendanceDialog.mode}
        data={attendanceDialog.data}
        onClose={() => setAttendanceDialog({ open: false, mode: 'create' })}
        onSave={handleSaveAttendanceRule}
      />

      {/* Template Dialog */}
      <TemplateDialog
        open={templateDialog.open}
        mode={templateDialog.mode}
        data={templateDialog.data}
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
  onClose: () => void;
  onSave: (data: Partial<GradingScheme>) => void;
}

const GradingSchemeDialog = ({ open, mode, data, onClose, onSave }: GradingSchemeDialogProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    isDefault: false,
    isActive: true,
    grades: [{ grade: 'A', minMarks: 90, maxMarks: 100, gradePoint: 4.0 }],
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
        grades: [{ grade: 'A', minMarks: 90, maxMarks: 100, gradePoint: 4.0 }],
      });
    }
  }, [data, open]);

  const addGrade = () => {
    setFormData({
      ...formData,
      grades: [...formData.grades, { grade: '', minMarks: 0, maxMarks: 0, gradePoint: 0 }],
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'create' ? t('systemSettings.addGradingScheme') : t('systemSettings.editGradingScheme')}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('systemSettings.schemeName')}
              fullWidth
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
              <Button size="small" onClick={addGrade}>Add Grade</Button>
            </Box>
            {formData.grades.map((grade, index) => (
              <Grid container spacing={1} key={index} sx={{ mb: 1 }}>
                <Grid item xs={3}>
                  <TextField
                    label={t('systemSettings.grade')}
                    size="small"
                    fullWidth
                    value={grade.grade}
                    onChange={(e) => updateGrade(index, 'grade', e.target.value)}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    label={t('systemSettings.minMarks')}
                    size="small"
                    type="number"
                    fullWidth
                    value={grade.minMarks}
                    onChange={(e) => updateGrade(index, 'minMarks', parseFloat(e.target.value))}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    label={t('systemSettings.maxMarks')}
                    size="small"
                    type="number"
                    fullWidth
                    value={grade.maxMarks}
                    onChange={(e) => updateGrade(index, 'maxMarks', parseFloat(e.target.value))}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    label={t('systemSettings.gradePoint')}
                    size="small"
                    type="number"
                    fullWidth
                    value={grade.gradePoint}
                    onChange={(e) => updateGrade(index, 'gradePoint', parseFloat(e.target.value))}
                  />
                </Grid>
                <Grid item xs={1}>
                  <IconButton size="small" color="error" onClick={() => removeGrade(index)}>
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
        <Button variant="contained" onClick={() => onSave(formData)}>{t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
};

interface AttendanceRuleDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  data?: AttendanceRule;
  onClose: () => void;
  onSave: (data: Partial<AttendanceRule>) => void;
}

const AttendanceRuleDialog = ({ open, mode, data, onClose, onSave }: AttendanceRuleDialogProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    presentWeight: 100,
    absentWeight: 0,
    lateWeight: 75,
    excusedWeight: 100,
    minAttendance: 75,
    isActive: true,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name,
        presentWeight: data.presentWeight,
        absentWeight: data.absentWeight,
        lateWeight: data.lateWeight,
        excusedWeight: data.excusedWeight,
        minAttendance: data.minAttendance,
        isActive: data.isActive,
      });
    } else {
      setFormData({
        name: '',
        presentWeight: 100,
        absentWeight: 0,
        lateWeight: 75,
        excusedWeight: 100,
        minAttendance: 75,
        isActive: true,
      });
    }
  }, [data, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'create' ? t('systemSettings.addAttendanceRule') : t('systemSettings.editAttendanceRule')}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label={t('systemSettings.ruleName')}
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('systemSettings.presentWeight')}
              type="number"
              fullWidth
              value={formData.presentWeight}
              onChange={(e) => setFormData({ ...formData, presentWeight: parseFloat(e.target.value) })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('systemSettings.absentWeight')}
              type="number"
              fullWidth
              value={formData.absentWeight}
              onChange={(e) => setFormData({ ...formData, absentWeight: parseFloat(e.target.value) })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('systemSettings.lateWeight')}
              type="number"
              fullWidth
              value={formData.lateWeight}
              onChange={(e) => setFormData({ ...formData, lateWeight: parseFloat(e.target.value) })}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('systemSettings.excusedWeight')}
              type="number"
              fullWidth
              value={formData.excusedWeight}
              onChange={(e) => setFormData({ ...formData, excusedWeight: parseFloat(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={t('systemSettings.minAttendance')}
              type="number"
              fullWidth
              value={formData.minAttendance}
              onChange={(e) => setFormData({ ...formData, minAttendance: parseFloat(e.target.value) })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={() => onSave(formData)}>{t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
};

interface TemplateDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  data?: NotificationTemplate;
  onClose: () => void;
  onSave: (data: Partial<NotificationTemplate>) => void;
}

const TemplateDialog = ({ open, mode, data, onClose, onSave }: TemplateDialogProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    content: '',
    isActive: true,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name,
        code: data.code,
        content: data.content,
        isActive: data.isActive,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        content: '',
        isActive: true,
      });
    }
  }, [data, open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'create' ? t('systemSettings.addTemplate') : t('systemSettings.editTemplate')}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('systemSettings.templateName')}
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('systemSettings.templateCode')}
              fullWidth
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={t('systemSettings.templateContent')}
              fullWidth
              multiline
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              helperText="Use {{variable}} for dynamic content"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" onClick={() => onSave(formData)}>{t('common.save')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SystemSettings;

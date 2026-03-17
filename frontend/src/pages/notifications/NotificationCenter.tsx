/**
 * Notification Center
 * 
 * Manage SMS, Email, and Push notifications
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  Divider,
  Switch,
  FormControlLabel,
  TextareaAutosize,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Sms as SmsIcon,
  Email as EmailIcon,
  Notifications as PushIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';

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

interface NotificationHistory {
  id: number;
  type: 'sms' | 'email' | 'push';
  recipient: string;
  subject?: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  error?: string;
}

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export const NotificationCenter = () => {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [templates, setTemplates] = useState<(SMSTemplate | EmailTemplate)[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [smsSettings, setSmsSettings] = useState({
    provider: 'sparrow',
    apiKey: '',
    senderId: '',
    enabled: true,
  });

  const [emailSettings, setEmailSettings] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
    enabled: true,
  });

  const [smsForm, setSmsForm] = useState({
    recipients: '',
    message: '',
    templateId: '',
    scheduleTime: '',
  });

  const [emailForm, setEmailForm] = useState({
    recipients: '',
    subject: '',
    body: '',
    templateId: '',
    scheduleTime: '',
  });

  const [pushForm, setPushForm] = useState({
    title: '',
    message: '',
    targetRoles: [] as string[],
    scheduleTime: '',
  });

  const [smsBalance, setSmsBalance] = useState({ balance: 0, used: 0 });

  useEffect(() => {
    fetchHistory();
    fetchTemplates();
    fetchSettings();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/communication/notifications/history');
      setHistory(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch notification history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const [smsRes, emailRes] = await Promise.all([
        apiClient.get('/api/v1/communication/templates?type=sms'),
        apiClient.get('/api/v1/communication/templates?type=email'),
      ]);
      setTemplates([...(smsRes.data.data || []), ...(emailRes.data.data || [])]);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/api/v1/communication/settings');
      if (response.data.data) {
        setSmsSettings(response.data.data.sms || smsSettings);
        setEmailSettings(response.data.data.email || emailSettings);
        setSmsBalance(response.data.data.smsBalance || { balance: 0, used: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSendSMS = async () => {
    try {
      setLoading(true);
      await apiClient.post('/api/v1/communication/sms/send', {
        recipients: smsForm.recipients.split(',').map(r => r.trim()),
        message: smsForm.message,
        scheduleTime: smsForm.scheduleTime || undefined,
      });
      setSnackbar({ open: true, message: t('notifications.smsSentSuccess'), severity: 'success' });
      setSmsForm({ recipients: '', message: '', templateId: '', scheduleTime: '' });
      fetchHistory();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error?.message || t('notifications.failedToSendSms'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulkSMS = async () => {
    try {
      setLoading(true);
      await apiClient.post('/api/v1/communication/sms/bulk', {
        message: smsForm.message,
        targetRoles: ['student', 'parent', 'staff'],
        scheduleTime: smsForm.scheduleTime || undefined,
      });
      setSnackbar({ open: true, message: t('notifications.bulkSmsSentSuccess'), severity: 'success' });
      fetchHistory();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error?.message || t('notifications.failedToSendBulkSms'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setLoading(true);
      await apiClient.post('/api/v1/communication/email/send', {
        recipients: emailForm.recipients.split(',').map(r => r.trim()),
        subject: emailForm.subject,
        body: emailForm.body,
        scheduleTime: emailForm.scheduleTime || undefined,
      });
      setSnackbar({ open: true, message: t('notifications.emailSentSuccess'), severity: 'success' });
      setEmailForm({ recipients: '', subject: '', body: '', templateId: '', scheduleTime: '' });
      fetchHistory();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error?.message || t('notifications.failedToSendEmail'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPush = async () => {
    try {
      setLoading(true);
      await apiClient.post('/api/v1/communication/push/send', {
        title: pushForm.title,
        message: pushForm.message,
        targetRoles: pushForm.targetRoles,
        scheduleTime: pushForm.scheduleTime || undefined,
      });
      setSnackbar({ open: true, message: t('notifications.pushSentSuccess'), severity: 'success' });
      setPushForm({ title: '', message: '', targetRoles: [], scheduleTime: '' });
      fetchHistory();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error?.message || t('notifications.failedToSendPush'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await apiClient.put('/api/v1/communication/settings', {
        sms: smsSettings,
        email: emailSettings,
      });
      setSnackbar({ open: true, message: t('notifications.settingsSaved'), severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: t('notifications.failedToSaveSettings'), severity: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms': return <SmsIcon fontSize="small" />;
      case 'email': return <EmailIcon fontSize="small" />;
      case 'push': return <PushIcon fontSize="small" />;
      default: return null;
    }
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PushIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{t('notifications.title')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('notifications.subtitle')}</Typography>
            </Box>
          </Box>
          <Button
            variant="outlined" sx={S.BTN_OUTLINE}
            startIcon={<RefreshIcon />}
            onClick={fetchHistory}
          >
            {t('notifications.refresh')}
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ ...S.GLASS, mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab icon={<SmsIcon />} label={t('notifications.sms')} />
          <Tab icon={<EmailIcon />} label={t('notifications.email')} />
          <Tab icon={<PushIcon />} label={t('notifications.pushNotifications')} />
          <Tab icon={<HistoryIcon />} label={t('notifications.history')} />
          <Tab icon={<SettingsIcon />} label={t('notifications.settings')} />
        </Tabs>
      </Paper>

      {/* SMS Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ ...S.GLASS }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('notifications.smsBalance')}
                </Typography>
                <Typography variant="h3" color="primary">
                  {smsBalance.balance}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('notifications.availableCredits')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('notifications.usedThisMonth', { count: smsBalance.used })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ ...S.GLASS }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('notifications.sendSms')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>{t('notifications.templateOptional')}</InputLabel>
                    <Select
                      value={smsForm.templateId}
                      label={t('notifications.templateOptional')}
                      onChange={(e) => {
                        const templateId = String(e.target.value);
                        const template = templates.find(t => String(t.id) === templateId) as SMSTemplate;
                        setSmsForm({ ...smsForm, templateId, message: template?.content || '' });
                      }}
                    >
                      <MenuItem value="">{t('notifications.none')}</MenuItem>
                      {templates.filter(t => 'content' in t).map((template: any) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label={t('notifications.recipients')}
                    fullWidth
                    multiline
                    rows={2}
                    value={smsForm.recipients}
                    onChange={(e) => setSmsForm({ ...smsForm, recipients: e.target.value })}
                    placeholder="Enter phone numbers separated by commas"
                    helperText="e.g., 9800000001, 9800000002"
                  />
                  <TextField
                    label={t('notifications.message')}
                    fullWidth
                    multiline
                    rows={4}
                    value={smsForm.message}
                    onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                    inputProps={{ maxLength: 160 }}
                    helperText={`${smsForm.message.length}/160 characters`}
                  />
                  <TextField
                    label={t('notifications.scheduleTimeOptional')}
                    type="datetime-local"
                    fullWidth
                    value={smsForm.scheduleTime}
                    onChange={(e) => setSmsForm({ ...smsForm, scheduleTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained" sx={S.BTN_PRIMARY}
                      startIcon={<SendIcon />}
                      onClick={handleSendSMS}
                      disabled={loading || !smsForm.recipients || !smsForm.message}
                    >
                      {t('notifications.sendSms')}
                    </Button>
                    <Button
                      variant="outlined" sx={S.BTN_OUTLINE}
                      onClick={handleSendBulkSMS}
                      disabled={loading || !smsForm.message}
                    >
                      {t('notifications.sendBulkToAll')}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Email Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ ...S.GLASS }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('notifications.sendEmail')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>{t('notifications.templateOptional')}</InputLabel>
                <Select
                  value={emailForm.templateId}
                  label={t('notifications.templateOptional')}
                  onChange={(e) => {
                    const templateId = String(e.target.value);
                    const template = templates.find(t => String(t.id) === templateId) as EmailTemplate;
                    setEmailForm({ 
                      ...emailForm, 
                      templateId, 
                      subject: template?.subject || '',
                      body: template?.body || ''
                    });
                  }}
                >
                  <MenuItem value="">{t('notifications.none')}</MenuItem>
                  {templates.filter(t => 'subject' in t).map((template: any) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label={t('notifications.recipients')}
                fullWidth
                multiline
                rows={2}
                value={emailForm.recipients}
                onChange={(e) => setEmailForm({ ...emailForm, recipients: e.target.value })}
                placeholder="Enter email addresses separated by commas"
              />
              <TextField
                label={t('notifications.subject')}
                fullWidth
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              />
              <TextField
                label={t('notifications.body')}
                fullWidth
                multiline
                rows={8}
                value={emailForm.body}
                onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
              />
              <TextField
                label={t('notifications.scheduleTimeOptional')}
                type="datetime-local"
                fullWidth
                value={emailForm.scheduleTime}
                onChange={(e) => setEmailForm({ ...emailForm, scheduleTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained" sx={S.BTN_PRIMARY}
                startIcon={<SendIcon />}
                onClick={handleSendEmail}
                disabled={loading || !emailForm.recipients || !emailForm.subject || !emailForm.body}
              >
                {t('notifications.sendEmail')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Push Notifications Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ ...S.GLASS }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('notifications.sendPushNotification')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label={t('calendar.eventTitle')}
                fullWidth
                value={pushForm.title}
                onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })}
              />
              <TextField
                label={t('notifications.message')}
                fullWidth
                multiline
                rows={4}
                value={pushForm.message}
                onChange={(e) => setPushForm({ ...pushForm, message: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>{t('notifications.targetRoles')}</InputLabel>
                <Select
                  multiple
                  value={pushForm.targetRoles}
                  label={t('notifications.targetRoles')}
                  onChange={(e) => setPushForm({ ...pushForm, targetRoles: e.target.value as string[] })}
                >
                  <MenuItem value="student">{t('notifications.students')}</MenuItem>
                  <MenuItem value="parent">{t('notifications.parents')}</MenuItem>
                  <MenuItem value="teacher">{t('notifications.teachers')}</MenuItem>
                  <MenuItem value="staff">{t('notifications.staff')}</MenuItem>
                  <MenuItem value="admin">{t('notifications.admins')}</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={t('notifications.scheduleTimeOptional')}
                type="datetime-local"
                fullWidth
                value={pushForm.scheduleTime}
                onChange={(e) => setPushForm({ ...pushForm, scheduleTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained" sx={S.BTN_PRIMARY}
                startIcon={<SendIcon />}
                onClick={handleSendPush}
                disabled={loading || !pushForm.title || !pushForm.message || pushForm.targetRoles.length === 0}
              >
                {t('notifications.sendPushNotification')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* History Tab */}
      <TabPanel value={tabValue} index={3}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>{t('notifications.type')}</TableCell>
                <TableCell>{t('notifications.recipient')}</TableCell>
                <TableCell>{t('notifications.subjectMessage')}</TableCell>
                <TableCell>{t('notifications.status')}</TableCell>
                <TableCell>{t('notifications.sentAt')}</TableCell>
                <TableCell align="right">{t('calendar.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={6} align="center" sx={S.TD}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={6} align="center" sx={S.TD}>
                    {t('notifications.noHistory')}
                  </TableCell>
                </TableRow>
              ) : (
                history
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.id} hover sx={S.TR_HOVER}>
                      <TableCell sx={S.TD}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTypeIcon(item.type)}
                          {item.type.toUpperCase()}
                        </Box>
                      </TableCell>
                      <TableCell sx={S.TD}>{item.recipient}</TableCell>
                      <TableCell sx={S.TD}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {item.subject || item.message}
                        </Typography>
                      </TableCell>
                      <TableCell sx={S.TD}>
                        <Chip
                          label={item.status}
                          color={getStatusColor(item.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={S.TD}>
                        {new Date(item.sentAt).toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={S.TD}>
                        {item.status === 'failed' && (
                          <Typography variant="caption" color="error">
                            {item.error}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={history.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ ...S.GLASS }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {t('notifications.smsSettings')}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={smsSettings.enabled}
                        onChange={(e) => setSmsSettings({ ...smsSettings, enabled: e.target.checked })}
                      />
                    }
                    label={t('notifications.enabled')}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label={t('notifications.apiKey')}
                    fullWidth
                    type="password"
                    value={smsSettings.apiKey}
                    onChange={(e) => setSmsSettings({ ...smsSettings, apiKey: e.target.value })}
                  />
                  <TextField
                    label={t('notifications.senderId')}
                    fullWidth
                    value={smsSettings.senderId}
                    onChange={(e) => setSmsSettings({ ...smsSettings, senderId: e.target.value })}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ ...S.GLASS }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {t('notifications.emailSettings')}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailSettings.enabled}
                        onChange={(e) => setEmailSettings({ ...emailSettings, enabled: e.target.checked })}
                      />
                    }
                    label={t('notifications.enabled')}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label={t('notifications.smtpHost')}
                    fullWidth
                    value={emailSettings.host}
                    onChange={(e) => setEmailSettings({ ...emailSettings, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                  <TextField
                    label={t('notifications.port')}
                    type="number"
                    fullWidth
                    value={emailSettings.port}
                    onChange={(e) => setEmailSettings({ ...emailSettings, port: parseInt(e.target.value) })}
                  />
                  <TextField
                    label={t('notifications.username')}
                    fullWidth
                    value={emailSettings.username}
                    onChange={(e) => setEmailSettings({ ...emailSettings, username: e.target.value })}
                  />
                  <TextField
                    label={t('notifications.password')}
                    type="password"
                    fullWidth
                    value={emailSettings.password}
                    onChange={(e) => setEmailSettings({ ...emailSettings, password: e.target.value })}
                  />
                  <TextField
                    label={t('notifications.fromEmail')}
                    fullWidth
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  />
                  <TextField
                    label={t('notifications.fromName')}
                    fullWidth
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" sx={S.BTN_PRIMARY} onClick={handleSaveSettings}>
              {t('notifications.saveSettings')}
            </Button>
          </Grid>
        </Grid>
      </TabPanel>

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

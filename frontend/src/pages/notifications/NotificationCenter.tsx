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
  Template as TemplateIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

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
  id: number;
  name: string;
  content: string;
  variables: string[];
}

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export const NotificationCenter = () => {
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
      setSnackbar({ open: true, message: 'SMS sent successfully!', severity: 'success' });
      setSmsForm({ recipients: '', message: '', templateId: '', scheduleTime: '' });
      fetchHistory();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error?.message || 'Failed to send SMS', severity: 'error' });
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
      setSnackbar({ open: true, message: 'Bulk SMS sent successfully!', severity: 'success' });
      fetchHistory();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error?.message || 'Failed to send bulk SMS', severity: 'error' });
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
      setSnackbar({ open: true, message: 'Email sent successfully!', severity: 'success' });
      setEmailForm({ recipients: '', subject: '', body: '', templateId: '', scheduleTime: '' });
      fetchHistory();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error?.message || 'Failed to send email', severity: 'error' });
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
      setSnackbar({ open: true, message: 'Push notification sent successfully!', severity: 'success' });
      setPushForm({ title: '', message: '', targetRoles: [], scheduleTime: '' });
      fetchHistory();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error?.message || 'Failed to send push notification', severity: 'error' });
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
      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Notification Center / सूचना केन्द्र
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchHistory}
        >
          Refresh / ताजा गर्नुहोस्
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab icon={<SmsIcon />} label="SMS" />
          <Tab icon={<EmailIcon />} label="Email" />
          <Tab icon={<PushIcon />} label="Push Notifications" />
          <Tab icon={<HistoryIcon />} label="History / इतिहास" />
          <Tab icon={<SettingsIcon />} label="Settings / सेटिङ" />
        </Tabs>
      </Paper>

      {/* SMS Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  SMS Balance / SMS ब्यालेन्स
                </Typography>
                <Typography variant="h3" color="primary">
                  {smsBalance.balance}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available credits
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Used this month: {smsBalance.used}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Send SMS / SMS पठाउनुहोस्
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Template (Optional)</InputLabel>
                    <Select
                      value={smsForm.templateId}
                      label="Template (Optional)"
                      onChange={(e) => {
                        const template = templates.find(t => t.id === e.target.value) as SMSTemplate;
                        setSmsForm({ ...smsForm, templateId: e.target.value, message: template?.content || '' });
                      }}
                    >
                      <MenuItem value="">None</MenuItem>
                      {templates.filter(t => 'content' in t).map((template: any) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Recipients / प्रापकहरू"
                    fullWidth
                    multiline
                    rows={2}
                    value={smsForm.recipients}
                    onChange={(e) => setSmsForm({ ...smsForm, recipients: e.target.value })}
                    placeholder="Enter phone numbers separated by commas"
                    helperText="e.g., 9800000001, 9800000002"
                  />
                  <TextField
                    label="Message / सन्देश"
                    fullWidth
                    multiline
                    rows={4}
                    value={smsForm.message}
                    onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                    inputProps={{ maxLength: 160 }}
                    helperText={`${smsForm.message.length}/160 characters`}
                  />
                  <TextField
                    label="Schedule Time (Optional)"
                    type="datetime-local"
                    fullWidth
                    value={smsForm.scheduleTime}
                    onChange={(e) => setSmsForm({ ...smsForm, scheduleTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleSendSMS}
                      disabled={loading || !smsForm.recipients || !smsForm.message}
                    >
                      Send SMS
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleSendBulkSMS}
                      disabled={loading || !smsForm.message}
                    >
                      Bulk Send to All
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
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Send Email / इमेल पठाउनुहोस्
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Template (Optional)</InputLabel>
                <Select
                  value={emailForm.templateId}
                  label="Template (Optional)"
                  onChange={(e) => {
                    const template = templates.find(t => t.id === e.target.value) as EmailTemplate;
                    setEmailForm({ 
                      ...emailForm, 
                      templateId: e.target.value, 
                      subject: template?.subject || '',
                      body: template?.body || ''
                    });
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {templates.filter(t => 'subject' in t).map((template: any) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Recipients / प्रापकहरू"
                fullWidth
                multiline
                rows={2}
                value={emailForm.recipients}
                onChange={(e) => setEmailForm({ ...emailForm, recipients: e.target.value })}
                placeholder="Enter email addresses separated by commas"
              />
              <TextField
                label="Subject / विषय"
                fullWidth
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              />
              <TextField
                label="Body / मुख्य सन्देश"
                fullWidth
                multiline
                rows={8}
                value={emailForm.body}
                onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
              />
              <TextField
                label="Schedule Time (Optional)"
                type="datetime-local"
                fullWidth
                value={emailForm.scheduleTime}
                onChange={(e) => setEmailForm({ ...emailForm, scheduleTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleSendEmail}
                disabled={loading || !emailForm.recipients || !emailForm.subject || !emailForm.body}
              >
                Send Email
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Push Notifications Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Send Push Notification / पुश सूचना पठाउनुहोस्
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Title / शीर्षक"
                fullWidth
                value={pushForm.title}
                onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })}
              />
              <TextField
                label="Message / सन्देश"
                fullWidth
                multiline
                rows={4}
                value={pushForm.message}
                onChange={(e) => setPushForm({ ...pushForm, message: e.target.value })}
              />
              <FormControl fullWidth>
                <InputLabel>Target Roles</InputLabel>
                <Select
                  multiple
                  value={pushForm.targetRoles}
                  label="Target Roles"
                  onChange={(e) => setPushForm({ ...pushForm, targetRoles: e.target.value as string[] })}
                >
                  <MenuItem value="student">Students</MenuItem>
                  <MenuItem value="parent">Parents</MenuItem>
                  <MenuItem value="teacher">Teachers</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="admin">Admins</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Schedule Time (Optional)"
                type="datetime-local"
                fullWidth
                value={pushForm.scheduleTime}
                onChange={(e) => setPushForm({ ...pushForm, scheduleTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleSendPush}
                disabled={loading || !pushForm.title || !pushForm.message || pushForm.targetRoles.length === 0}
              >
                Send Push Notification
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* History Tab */}
      <TabPanel value={tabValue} index={3}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Subject/Message</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sent At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No notification history
                  </TableCell>
                </TableRow>
              ) : (
                history
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTypeIcon(item.type)}
                          {item.type.toUpperCase()}
                        </Box>
                      </TableCell>
                      <TableCell>{item.recipient}</TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {item.subject || item.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          color={getStatusColor(item.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(item.sentAt).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
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
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    SMS Settings (Sparrow SMS)
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={smsSettings.enabled}
                        onChange={(e) => setSmsSettings({ ...smsSettings, enabled: e.target.checked })}
                      />
                    }
                    label="Enabled"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="API Key"
                    fullWidth
                    type="password"
                    value={smsSettings.apiKey}
                    onChange={(e) => setSmsSettings({ ...smsSettings, apiKey: e.target.value })}
                  />
                  <TextField
                    label="Sender ID"
                    fullWidth
                    value={smsSettings.senderId}
                    onChange={(e) => setSmsSettings({ ...smsSettings, senderId: e.target.value })}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Email Settings (SMTP)
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailSettings.enabled}
                        onChange={(e) => setEmailSettings({ ...emailSettings, enabled: e.target.checked })}
                      />
                    }
                    label="Enabled"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="SMTP Host"
                    fullWidth
                    value={emailSettings.host}
                    onChange={(e) => setEmailSettings({ ...emailSettings, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                  <TextField
                    label="Port"
                    type="number"
                    fullWidth
                    value={emailSettings.port}
                    onChange={(e) => setEmailSettings({ ...emailSettings, port: parseInt(e.target.value) })}
                  />
                  <TextField
                    label="Username"
                    fullWidth
                    value={emailSettings.username}
                    onChange={(e) => setEmailSettings({ ...emailSettings, username: e.target.value })}
                  />
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    value={emailSettings.password}
                    onChange={(e) => setEmailSettings({ ...emailSettings, password: e.target.value })}
                  />
                  <TextField
                    label="From Email"
                    fullWidth
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                  />
                  <TextField
                    label="From Name"
                    fullWidth
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSaveSettings}>
              Save Settings
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

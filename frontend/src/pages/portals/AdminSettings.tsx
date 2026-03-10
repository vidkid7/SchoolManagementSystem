import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Storage as StorageIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const AdminSettings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [schoolConfig, setSchoolConfig] = useState({
    name: '',
    nameNp: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    principalName: '',
    establishedYear: '',
    schoolCode: '',
  });

  const [systemSettings, setSystemSettings] = useState({
    academicYearStart: 'Baisakh',
    dateFormat: 'BS',
    currency: 'NPR',
    timezone: 'Asia/Kathmandu',
    language: 'ne',
    attendanceThreshold: 75,
    gradingSystem: 'NEB',
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    enableSMS: true,
    enableEmail: true,
    enableOfflineMode: true,
    enablePaymentGateway: true,
    backupEnabled: true,
    backupSchedule: 'daily',
    backupRetention: 30,
    communication: {
      sms: {
        provider: 'sparrow',
        apiKey: '',
        senderId: '',
        enabled: true,
      },
      email: {
        host: '',
        port: 587,
        username: '',
        password: '',
        fromEmail: '',
        fromName: '',
        enabled: true,
      },
      smsBalance: { balance: 0, used: 0 },
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const [schoolResult, dateFormatResult, communicationResult] = await Promise.allSettled([
          apiClient.get('/api/v1/config/school'),
          apiClient.get('/api/v1/system-settings/date-format'),
          apiClient.get('/api/v1/communication/settings'),
        ]);

        const schoolData =
          schoolResult.status === 'fulfilled'
            ? (schoolResult.value.data?.data ?? null)
            : null;
        const dateData =
          dateFormatResult.status === 'fulfilled'
            ? (dateFormatResult.value.data?.data ?? null)
            : null;
        const communicationData =
          communicationResult.status === 'fulfilled'
            ? (communicationResult.value.data?.data ?? null)
            : null;

        if (schoolData) {
          setSchoolConfig((prev) => ({
            ...prev,
            name: schoolData.schoolNameEn || '',
            nameNp: schoolData.schoolNameNp || '',
            address: schoolData.addressEn || '',
            phone: schoolData.phone || '',
            email: schoolData.email || '',
            website: schoolData.website || '',
            schoolCode: schoolData.schoolCode || '',
          }));
        }

        setSystemSettings((prev) => {
          const portalSettings = communicationData?.portalSettings || {};
          return {
            ...prev,
            ...portalSettings,
            dateFormat:
              portalSettings.dateFormat ||
              (schoolData?.defaultCalendarSystem || (dateData?.dateFormat?.toUpperCase?.() === 'AD' ? 'AD' : 'BS')),
            currency: portalSettings.currency || dateData?.currency || schoolData?.currency || prev.currency,
            timezone: portalSettings.timezone || schoolData?.timezone || prev.timezone,
            language:
              portalSettings.language ||
              (schoolData?.defaultLanguage === 'english' ? 'en' : 'ne'),
            enableSMS: communicationData?.sms?.enabled ?? portalSettings.enableSMS ?? prev.enableSMS,
            enableEmail: communicationData?.email?.enabled ?? portalSettings.enableEmail ?? prev.enableEmail,
            communication: {
              sms: {
                ...prev.communication.sms,
                ...(communicationData?.sms || {}),
              },
              email: {
                ...prev.communication.email,
                ...(communicationData?.email || {}),
              },
              smsBalance: communicationData?.smsBalance || prev.communication.smsBalance,
            },
          };
        });
      } catch (loadError: any) {
        setError(loadError?.response?.data?.error?.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const schoolPayload = {
        schoolNameEn: schoolConfig.name,
        schoolNameNp: schoolConfig.nameNp,
        addressEn: schoolConfig.address,
        phone: schoolConfig.phone || undefined,
        email: schoolConfig.email || undefined,
        website: schoolConfig.website || undefined,
        schoolCode: schoolConfig.schoolCode || undefined,
        defaultCalendarSystem: systemSettings.dateFormat === 'AD' ? 'AD' : 'BS',
        defaultLanguage: systemSettings.language === 'en' ? 'english' : 'nepali',
        timezone: systemSettings.timezone,
        currency: systemSettings.currency,
      };

      const dateFormatPayload = {
        dateFormat: systemSettings.dateFormat,
        currency: systemSettings.currency,
      };

      const communicationPayload = {
        sms: {
          ...systemSettings.communication.sms,
          enabled: systemSettings.enableSMS,
        },
        email: {
          ...systemSettings.communication.email,
          enabled: systemSettings.enableEmail,
        },
        smsBalance: systemSettings.communication.smsBalance,
        portalSettings: {
          academicYearStart: systemSettings.academicYearStart,
          dateFormat: systemSettings.dateFormat,
          currency: systemSettings.currency,
          timezone: systemSettings.timezone,
          language: systemSettings.language,
          attendanceThreshold: systemSettings.attendanceThreshold,
          gradingSystem: systemSettings.gradingSystem,
          maxLoginAttempts: systemSettings.maxLoginAttempts,
          sessionTimeout: systemSettings.sessionTimeout,
          enableSMS: systemSettings.enableSMS,
          enableEmail: systemSettings.enableEmail,
          enableOfflineMode: systemSettings.enableOfflineMode,
          enablePaymentGateway: systemSettings.enablePaymentGateway,
          backupEnabled: systemSettings.backupEnabled,
          backupSchedule: systemSettings.backupSchedule,
          backupRetention: systemSettings.backupRetention,
        },
      };

      await Promise.all([
        apiClient.put('/api/v1/config/school', schoolPayload),
        apiClient.put('/api/v1/system-settings/date-format', dateFormatPayload),
        apiClient.put('/api/v1/communication/settings', communicationPayload),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (saveError: any) {
      setError(saveError?.response?.data?.error?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">System Settings</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<SchoolIcon />} label="School Info" />
          <Tab icon={<SettingsIcon />} label="Academic" />
          <Tab icon={<NotificationIcon />} label="Notifications" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<StorageIcon />} label="Backup" />
          <Tab icon={<PaletteIcon />} label="Features" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="School Name (English)"
                  value={schoolConfig.name}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="School Name (Nepali)"
                  value={schoolConfig.nameNp}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, nameNp: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Address"
                  value={schoolConfig.address}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, address: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={schoolConfig.phone}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, phone: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={schoolConfig.email}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, email: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Website"
                  value={schoolConfig.website}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, website: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Principal Name"
                  value={schoolConfig.principalName}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, principalName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Established Year (BS)"
                  value={schoolConfig.establishedYear}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, establishedYear: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="School Code"
                  value={schoolConfig.schoolCode}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, schoolCode: e.target.value }))}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={systemSettings.dateFormat}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                    label="Date Format"
                  >
                    <MenuItem value="BS">Bikram Sambat (BS)</MenuItem>
                    <MenuItem value="AD">Anno Domini (AD)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Grading System</InputLabel>
                  <Select
                    value={systemSettings.gradingSystem}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, gradingSystem: e.target.value }))}
                    label="Grading System"
                  >
                    <MenuItem value="NEB">NEB Grading</MenuItem>
                    <MenuItem value="percentage">Percentage</MenuItem>
                    <MenuItem value="letter">Letter Grade</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Attendance Threshold (%)"
                  type="number"
                  value={systemSettings.attendanceThreshold}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, attendanceThreshold: Number(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Default Language</InputLabel>
                  <Select
                    value={systemSettings.language}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, language: e.target.value }))}
                    label="Default Language"
                  >
                    <MenuItem value="ne">नेपाली (Nepali)</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <List>
              <ListItem>
                <ListItemText
                  primary="SMS Notifications (Sparrow SMS)"
                  secondary="Send SMS alerts to parents and staff"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.enableSMS}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, enableSMS: e.target.checked }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Send email alerts for important events"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.enableEmail}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, enableEmail: e.target.checked }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Login Attempts"
                  type="number"
                  value={systemSettings.maxLoginAttempts}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Session Timeout (minutes)"
                  type="number"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.backupEnabled}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, backupEnabled: e.target.checked }))}
                    />
                  }
                  label="Enable Automated Backups"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Backup Schedule</InputLabel>
                  <Select
                    value={systemSettings.backupSchedule}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, backupSchedule: e.target.value }))}
                    label="Backup Schedule"
                  >
                    <MenuItem value="daily">Daily (2:00 AM)</MenuItem>
                    <MenuItem value="weekly">Weekly (Sunday 2:00 AM)</MenuItem>
                    <MenuItem value="monthly">Monthly (1st, 2:00 AM)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Backup Retention (days)"
                  type="number"
                  value={systemSettings.backupRetention}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, backupRetention: Number(e.target.value) }))}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            <List>
              <ListItem>
                <ListItemText
                  primary="Offline Mode (PWA)"
                  secondary="Allow attendance marking and grade entry when offline"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.enableOfflineMode}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, enableOfflineMode: e.target.checked }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Payment Gateway (eSewa, Khalti, IME Pay)"
                  secondary="Enable online fee payment for parents"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={systemSettings.enablePaymentGateway}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, enablePaymentGateway: e.target.checked }))}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminSettings;

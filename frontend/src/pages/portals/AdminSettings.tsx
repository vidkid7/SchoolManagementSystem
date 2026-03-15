import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  TextField,
  Button,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Save as SaveIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Storage as StorageIcon,
  Notifications as NotificationIcon,
  Sms as SmsIcon,
  Email as EmailIcon,
  WifiOff as OfflineIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { useAdminStyles, C } from '../../theme/designTokens';

function TabPanel({ children, value, index }: { children?: React.ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminSettings: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const dark = theme.palette.mode === 'dark';

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
        setError(loadError?.response?.data?.error?.message || t('adminSettings.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, [t]);

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
      setError(saveError?.response?.data?.error?.message || t('adminSettings.failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
        <CircularProgress sx={{ color: C.primary }} size={48} thickness={3} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('common.loading')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <Box sx={{
        ...S.PAGE_HEADER,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box sx={S.ICON_BOX(C.primary, 44)}>
            <SettingsIcon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {t('adminSettings.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {t('adminSettings.tabs.schoolInfo')} · {t('adminSettings.tabs.academic')} · {t('adminSettings.tabs.security')}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={S.BTN_PRIMARY}
        >
          {saving ? t('adminSettings.saving') : t('adminSettings.saveAll')}
        </Button>
      </Box>

      {/* ── Alerts ────────────────────────────────────────────────────────── */}
      {saved && (
        <Alert severity="success" sx={{ mb: 2, ...S.GLASS }} onClose={() => setSaved(false)}>
          {t('adminSettings.savedSuccess')}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2, ...S.GLASS }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Main Card ─────────────────────────────────────────────────────── */}
      <Box sx={{ ...S.GLASS_ELEVATED, overflow: 'hidden' }}>

        {/* Tab Bar */}
        <Box sx={{ borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, px: 0.5 }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: theme.palette.text.secondary,
                fontWeight: 600,
                minHeight: 52,
                textTransform: 'none',
                fontSize: '0.83rem',
                borderRadius: '8px 8px 0 0',
                mx: 0.25,
                transition: 'all 0.2s ease',
                '&:hover': { color: C.primary, background: C.primaryBg },
              },
              '& .Mui-selected': { color: `${C.primary} !important`, fontWeight: 700 },
              '& .MuiTabs-indicator': {
                backgroundColor: C.primary,
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab icon={<SchoolIcon />} iconPosition="start" label={t('adminSettings.tabs.schoolInfo')} />
            <Tab icon={<SettingsIcon />} iconPosition="start" label={t('adminSettings.tabs.academic')} />
            <Tab icon={<NotificationIcon />} iconPosition="start" label={t('adminSettings.tabs.notifications')} />
            <Tab icon={<SecurityIcon />} iconPosition="start" label={t('adminSettings.tabs.security')} />
            <Tab icon={<StorageIcon />} iconPosition="start" label={t('adminSettings.tabs.backup')} />
            <Tab icon={<PaletteIcon />} iconPosition="start" label={t('adminSettings.tabs.features')} />
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <Box sx={{ p: { xs: 2, md: 3 } }}>

          {/* ── Tab 0: School Info ─────────────────────────────────────────── */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('adminSettings.school.nameEn')}
                  value={schoolConfig.name}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, name: e.target.value }))}
                  sx={S.TF}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('adminSettings.school.nameNp')}
                  value={schoolConfig.nameNp}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, nameNp: e.target.value }))}
                  sx={S.TF}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('adminSettings.school.address')}
                  value={schoolConfig.address}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, address: e.target.value }))}
                  sx={S.TF}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('adminSettings.school.phone')}
                  value={schoolConfig.phone}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, phone: e.target.value }))}
                  sx={S.TF}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('adminSettings.school.email')}
                  value={schoolConfig.email}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, email: e.target.value }))}
                  sx={S.TF}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('adminSettings.school.website')}
                  value={schoolConfig.website}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, website: e.target.value }))}
                  sx={S.TF}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('adminSettings.school.principalName')}
                  value={schoolConfig.principalName}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, principalName: e.target.value }))}
                  sx={S.TF}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label={t('adminSettings.school.establishedYear')}
                  value={schoolConfig.establishedYear}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, establishedYear: e.target.value }))}
                  sx={S.TF}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label={t('adminSettings.school.schoolCode')}
                  value={schoolConfig.schoolCode}
                  onChange={(e) => setSchoolConfig(prev => ({ ...prev, schoolCode: e.target.value }))}
                  sx={S.TF}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── Tab 1: Academic ───────────────────────────────────────────── */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={S.TF}>
                  <InputLabel>{t('adminSettings.academic.dateFormat')}</InputLabel>
                  <Select
                    value={systemSettings.dateFormat}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                    label={t('adminSettings.academic.dateFormat')}
                  >
                    <MenuItem value="BS">{t('adminSettings.academic.dateFormatBS')}</MenuItem>
                    <MenuItem value="AD">{t('adminSettings.academic.dateFormatAD')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={S.TF}>
                  <InputLabel>{t('adminSettings.academic.gradingSystem')}</InputLabel>
                  <Select
                    value={systemSettings.gradingSystem}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, gradingSystem: e.target.value }))}
                    label={t('adminSettings.academic.gradingSystem')}
                  >
                    <MenuItem value="NEB">{t('adminSettings.academic.gradingNEB')}</MenuItem>
                    <MenuItem value="percentage">{t('adminSettings.academic.gradingPercentage')}</MenuItem>
                    <MenuItem value="letter">{t('adminSettings.academic.gradingLetter')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label={t('adminSettings.academic.attendanceThreshold')}
                  type="number"
                  value={systemSettings.attendanceThreshold}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, attendanceThreshold: Number(e.target.value) }))}
                  sx={S.TF}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={S.TF}>
                  <InputLabel>{t('adminSettings.academic.defaultLanguage')}</InputLabel>
                  <Select
                    value={systemSettings.language}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, language: e.target.value }))}
                    label={t('adminSettings.academic.defaultLanguage')}
                  >
                    <MenuItem value="ne">{t('adminSettings.academic.languageNepali')}</MenuItem>
                    <MenuItem value="en">{t('adminSettings.academic.languageEnglish')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── Tab 2: Notifications ──────────────────────────────────────── */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={2}>
              {[
                {
                  key: 'sms' as const,
                  icon: <SmsIcon />,
                  accent: C.primary,
                  accentBg: C.primaryBg,
                  accentBdr: C.primaryBdr,
                  label: t('adminSettings.notifications.sms'),
                  desc: t('adminSettings.notifications.smsDesc'),
                  checked: systemSettings.enableSMS,
                  onChange: (v: boolean) => setSystemSettings(prev => ({ ...prev, enableSMS: v })),
                },
                {
                  key: 'email' as const,
                  icon: <EmailIcon />,
                  accent: C.purple,
                  accentBg: C.purpleBg,
                  accentBdr: C.purpleBdr,
                  label: t('adminSettings.notifications.email'),
                  desc: t('adminSettings.notifications.emailDesc'),
                  checked: systemSettings.enableEmail,
                  onChange: (v: boolean) => setSystemSettings(prev => ({ ...prev, enableEmail: v })),
                },
              ].map((item) => (
                <Grid item xs={12} md={6} key={item.key}>
                  <Box sx={{
                    ...S.GLASS,
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    border: item.checked
                      ? `1px solid ${item.accentBdr}`
                      : undefined,
                    transition: 'border-color 0.2s ease',
                  }}>
                    <Box sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      background: item.checked ? item.accentBg : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                      border: `1px solid ${item.checked ? item.accentBdr : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.checked ? item.accent : theme.palette.text.disabled,
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}>
                      {item.icon}
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                    <Switch
                      checked={item.checked}
                      onChange={(e) => item.onChange(e.target.checked)}
                      sx={{
                        flexShrink: 0,
                        '& .MuiSwitch-switchBase.Mui-checked': { color: item.accent },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: item.accent },
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* ── Tab 3: Security ───────────────────────────────────────────── */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('adminSettings.security.maxLoginAttempts')}
                  type="number"
                  value={systemSettings.maxLoginAttempts}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, maxLoginAttempts: Number(e.target.value) }))}
                  sx={S.TF}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('adminSettings.security.sessionTimeout')}
                  type="number"
                  value={systemSettings.sessionTimeout}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                  sx={S.TF}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── Tab 4: Backup ─────────────────────────────────────────────── */}
          <TabPanel value={tabValue} index={4}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{
                  ...S.GLASS,
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  border: systemSettings.backupEnabled
                    ? `1px solid ${C.successBdr}`
                    : undefined,
                  transition: 'border-color 0.2s ease',
                }}>
                  <Box sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    background: systemSettings.backupEnabled ? C.successBg : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    border: `1px solid ${systemSettings.backupEnabled ? C.successBdr : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: systemSettings.backupEnabled ? C.success : theme.palette.text.disabled,
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}>
                    <StorageIcon />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={700}>
                      {t('adminSettings.backup.enableAutomated')}
                    </Typography>
                  </Box>
                  <Switch
                    checked={systemSettings.backupEnabled}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, backupEnabled: e.target.checked }))}
                    sx={{
                      flexShrink: 0,
                      '& .MuiSwitch-switchBase.Mui-checked': { color: C.success },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: C.success },
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={S.TF}>
                  <InputLabel>{t('adminSettings.backup.schedule')}</InputLabel>
                  <Select
                    value={systemSettings.backupSchedule}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, backupSchedule: e.target.value }))}
                    label={t('adminSettings.backup.schedule')}
                  >
                    <MenuItem value="daily">{t('adminSettings.backup.scheduleDaily')}</MenuItem>
                    <MenuItem value="weekly">{t('adminSettings.backup.scheduleWeekly')}</MenuItem>
                    <MenuItem value="monthly">{t('adminSettings.backup.scheduleMonthly')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('adminSettings.backup.retention')}
                  type="number"
                  value={systemSettings.backupRetention}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, backupRetention: Number(e.target.value) }))}
                  sx={S.TF}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── Tab 5: Features ───────────────────────────────────────────── */}
          <TabPanel value={tabValue} index={5}>
            <Grid container spacing={2}>
              {[
                {
                  key: 'offline' as const,
                  icon: <OfflineIcon />,
                  accent: C.warning,
                  accentBg: C.warningBg,
                  accentBdr: C.warningBdr,
                  label: t('adminSettings.features.offlineMode'),
                  desc: t('adminSettings.features.offlineModeDesc'),
                  checked: systemSettings.enableOfflineMode,
                  onChange: (v: boolean) => setSystemSettings(prev => ({ ...prev, enableOfflineMode: v })),
                },
                {
                  key: 'payment' as const,
                  icon: <PaymentIcon />,
                  accent: C.success,
                  accentBg: C.successBg,
                  accentBdr: C.successBdr,
                  label: t('adminSettings.features.paymentGateway'),
                  desc: t('adminSettings.features.paymentGatewayDesc'),
                  checked: systemSettings.enablePaymentGateway,
                  onChange: (v: boolean) => setSystemSettings(prev => ({ ...prev, enablePaymentGateway: v })),
                },
              ].map((item) => (
                <Grid item xs={12} md={6} key={item.key}>
                  <Box sx={{
                    ...S.GLASS,
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    border: item.checked
                      ? `1px solid ${item.accentBdr}`
                      : undefined,
                    transition: 'border-color 0.2s ease',
                  }}>
                    <Box sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.5,
                      background: item.checked ? item.accentBg : (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                      border: `1px solid ${item.checked ? item.accentBdr : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.checked ? item.accent : theme.palette.text.disabled,
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}>
                      {item.icon}
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={700}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                    <Switch
                      checked={item.checked}
                      onChange={(e) => item.onChange(e.target.checked)}
                      sx={{
                        flexShrink: 0,
                        '& .MuiSwitch-switchBase.Mui-checked': { color: item.accent },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: item.accent },
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

        </Box>
      </Box>

      {/* ── Footer Save Button ─────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
        <Button
          variant="text"
          onClick={() => window.location.reload()}
          sx={S.BTN_GHOST}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={S.BTN_PRIMARY}
        >
          {saving ? t('adminSettings.saving') : t('adminSettings.saveAll')}
        </Button>
      </Box>

    </Box>
  );
};

export default AdminSettings;

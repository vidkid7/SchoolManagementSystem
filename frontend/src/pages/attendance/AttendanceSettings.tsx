/**
 * Attendance Settings Page
 * 
 * Configure attendance rules and policies
 */

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface AttendanceRule {
  id?: number | string;
  minimumAttendancePercentage: number;
  lateArrivalGracePeriod: number;
  autoMarkAbsentAfter: string;
  allowBackdatedEntry: boolean;
  backdatedEntryDaysLimit: number;
  requireRemarks: boolean;
  notifyParentsOnAbsence: boolean;
  consecutiveAbsenceAlertThreshold: number;
  academicYearId: number;
}

interface AttendanceRuleResponse {
  id?: number | string;
  minimumAttendancePercentage?: number;
  lowAttendanceThreshold?: number;
  criticalAttendanceThreshold?: number;
  correctionWindowHours?: number;
  allowTeacherCorrection?: boolean;
  allowAdminCorrection?: boolean;
  maxLeaveDaysPerMonth?: number;
  maxLeaveDaysPerYear?: number;
  requireLeaveApproval?: boolean;
  enableLowAttendanceAlerts?: boolean;
  alertParents?: boolean;
  alertAdmins?: boolean;
  isActive?: boolean;
}

const defaultSettings: AttendanceRule = {
  minimumAttendancePercentage: 75,
  lateArrivalGracePeriod: 15,
  autoMarkAbsentAfter: '10:00',
  allowBackdatedEntry: true,
  backdatedEntryDaysLimit: 7,
  requireRemarks: false,
  notifyParentsOnAbsence: true,
  consecutiveAbsenceAlertThreshold: 3,
  academicYearId: 1,
};

const mapResponseToSettings = (data: AttendanceRuleResponse): AttendanceRule => ({
  id: data.id,
  minimumAttendancePercentage: data.minimumAttendancePercentage ?? defaultSettings.minimumAttendancePercentage,
  lateArrivalGracePeriod: data.correctionWindowHours ?? defaultSettings.lateArrivalGracePeriod,
  autoMarkAbsentAfter: defaultSettings.autoMarkAbsentAfter,
  allowBackdatedEntry: data.allowTeacherCorrection ?? defaultSettings.allowBackdatedEntry,
  backdatedEntryDaysLimit: data.maxLeaveDaysPerMonth ?? defaultSettings.backdatedEntryDaysLimit,
  requireRemarks: data.requireLeaveApproval ?? defaultSettings.requireRemarks,
  notifyParentsOnAbsence: data.alertParents ?? defaultSettings.notifyParentsOnAbsence,
  consecutiveAbsenceAlertThreshold: defaultSettings.consecutiveAbsenceAlertThreshold,
  academicYearId: defaultSettings.academicYearId,
});

export function AttendanceSettings() {
  const theme = useTheme();
  const { t } = useTranslation();
  const S = useAdminStyles(theme);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<AttendanceRule>(defaultSettings);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/config/attendance-rules/active');
      if (response.data?.data) {
        setSettings(mapResponseToSettings(response.data.data));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AttendanceRule, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (settings.id) {
        await apiClient.put(`/config/attendance-rules/${settings.id}`, settings);
      } else {
        await apiClient.post('/config/attendance-rules', settings);
      }

      setSuccess(t('attendance.settingsSavedSuccess'));
      setTimeout(() => setSuccess(''), 3000);
      fetchSettings();
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setError(error.response?.data?.message || t('attendance.failedToSaveSettings'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SettingsIcon sx={{ fontSize: 32, color: C.primary }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              {t('attendance.rulesAndSettings')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('attendance.configureDescription')}
            </Typography>
          </Box>
        </Box>

        {success && <Alert severity="success" sx={{ mt: 2, borderRadius: R.md }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: R.md }}>{error}</Alert>}
      </Paper>

      <Paper sx={{ ...S.GLASS, p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              {t('attendance.generalSettings')}
            </Typography>
            <Divider sx={S.DIVIDER} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label={t('attendance.minimumAttendancePercentage')}
              value={settings.minimumAttendancePercentage}
              onChange={(e) => handleChange('minimumAttendancePercentage', Number(e.target.value))}
              helperText={t('attendance.minimumAttendanceHelp')}
              InputProps={{ inputProps: { min: 0, max: 100 } }}
              sx={S.TF}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label={t('attendance.lateArrivalGracePeriod')}
              value={settings.lateArrivalGracePeriod}
              onChange={(e) => handleChange('lateArrivalGracePeriod', Number(e.target.value))}
              helperText={t('attendance.lateArrivalHelp')}
              InputProps={{ inputProps: { min: 0 } }}
              sx={S.TF}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="time"
              label={t('attendance.autoMarkAbsentAfter')}
              value={settings.autoMarkAbsentAfter}
              onChange={(e) => handleChange('autoMarkAbsentAfter', e.target.value)}
              helperText={t('attendance.autoMarkAbsentHelp')}
              InputLabelProps={{ shrink: true }}
              sx={S.TF}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label={t('attendance.consecutiveAbsenceAlert')}
              value={settings.consecutiveAbsenceAlertThreshold}
              onChange={(e) => handleChange('consecutiveAbsenceAlertThreshold', Number(e.target.value))}
              helperText={t('attendance.consecutiveAbsenceHelp')}
              InputProps={{ inputProps: { min: 1 } }}
              sx={S.TF}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              {t('attendance.backdatedEntrySettings')}
            </Typography>
            <Divider sx={S.DIVIDER} />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowBackdatedEntry}
                  onChange={(e) => handleChange('allowBackdatedEntry', e.target.checked)}
                />
              }
              label={t('attendance.allowBackdatedEntry')}
            />
          </Grid>

          {settings.allowBackdatedEntry && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label={t('attendance.backdatedEntryDaysLimit')}
                value={settings.backdatedEntryDaysLimit}
                onChange={(e) => handleChange('backdatedEntryDaysLimit', Number(e.target.value))}
                helperText={t('attendance.backdatedEntryHelp')}
                InputProps={{ inputProps: { min: 1 } }}
                sx={S.TF}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              {t('attendance.notificationSettings')}
            </Typography>
            <Divider sx={S.DIVIDER} />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifyParentsOnAbsence}
                  onChange={(e) => handleChange('notifyParentsOnAbsence', e.target.checked)}
                />
              }
              label={t('attendance.notifyParents')}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.requireRemarks}
                  onChange={(e) => handleChange('requireRemarks', e.target.checked)}
                />
              }
              label={t('attendance.requireRemarks')}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={fetchSettings}
                disabled={loading || saving}
                sx={S.BTN_OUTLINE}
              >
                {t('common.reset')}
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={saving}
                sx={S.BTN_PRIMARY}
              >
                {saving ? t('common.saving') : t('attendance.saveSettings')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default AttendanceSettings;

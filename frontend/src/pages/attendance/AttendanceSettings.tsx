/**
 * Attendance Settings Page
 * 
 * Configure attendance rules and policies
 */

import { useState, useEffect } from 'react';
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
import api from '../../config/api';

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
      const response = await api.get('/config/attendance-rules/active');
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
        await api.put(`/config/attendance-rules/${settings.id}`, settings);
      } else {
        await api.post('/config/attendance-rules', settings);
      }

      setSuccess('Attendance settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchSettings();
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      setError(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            Attendance Rules & Settings
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Configure attendance policies and rules for your institution
        </Typography>

        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Attendance Percentage"
              value={settings.minimumAttendancePercentage}
              onChange={(e) => handleChange('minimumAttendancePercentage', Number(e.target.value))}
              helperText="Minimum attendance required for students"
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Late Arrival Grace Period (minutes)"
              value={settings.lateArrivalGracePeriod}
              onChange={(e) => handleChange('lateArrivalGracePeriod', Number(e.target.value))}
              helperText="Grace period before marking as late"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="time"
              label="Auto Mark Absent After"
              value={settings.autoMarkAbsentAfter}
              onChange={(e) => handleChange('autoMarkAbsentAfter', e.target.value)}
              helperText="Automatically mark absent after this time"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Consecutive Absence Alert Threshold"
              value={settings.consecutiveAbsenceAlertThreshold}
              onChange={(e) => handleChange('consecutiveAbsenceAlertThreshold', Number(e.target.value))}
              helperText="Alert after this many consecutive absences"
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Backdated Entry Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowBackdatedEntry}
                  onChange={(e) => handleChange('allowBackdatedEntry', e.target.checked)}
                />
              }
              label="Allow Backdated Attendance Entry"
            />
          </Grid>

          {settings.allowBackdatedEntry && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Backdated Entry Days Limit"
                value={settings.backdatedEntryDaysLimit}
                onChange={(e) => handleChange('backdatedEntryDaysLimit', Number(e.target.value))}
                helperText="Maximum days allowed for backdated entry"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Notification Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifyParentsOnAbsence}
                  onChange={(e) => handleChange('notifyParentsOnAbsence', e.target.checked)}
                />
              }
              label="Notify Parents on Student Absence"
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
              label="Require Remarks for Absence"
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={fetchSettings}
                disabled={loading || saving}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default AttendanceSettings;

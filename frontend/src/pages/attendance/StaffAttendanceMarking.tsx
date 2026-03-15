/**
 * Staff Attendance Marking Page
 * 
 * Mark daily attendance for staff members
 */

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  PersonAdd as StaffIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface Staff {
  staffId: number;
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  designation: string;
  department: string;
  attendance_status?: 'present' | 'absent' | 'late' | 'on_leave';
  remarks?: string;
}

export function StaffAttendanceMarking() {
  const theme = useTheme();
  const { t } = useTranslation();
  const S = useAdminStyles(theme);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('all');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, [department]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params: any = { status: 'active' };
      if (department !== 'all') params.department = department;

      const response = await apiClient.get('/staff', { params });
      const staffData = response.data?.data || response.data || [];
      
      const staffWithStatus = Array.isArray(staffData)
        ? staffData.map((s: Staff) => ({
            ...s,
            attendance_status: 'present' as const,
            remarks: '',
          }))
        : [];
      
      setStaff(staffWithStatus);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      setError(t('attendance.noStaffFound'));
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (staffId: number, status: string) => {
    setStaff(staff.map(s => 
      s.staffId === staffId 
        ? { ...s, attendance_status: status as any }
        : s
    ));
  };

  const handleRemarksChange = (staffId: number, remarks: string) => {
    setStaff(staff.map(s => 
      s.staffId === staffId 
        ? { ...s, remarks }
        : s
    ));
  };

  const handleMarkAllPresent = () => {
    setStaff(staff.map(s => ({
      ...s,
      attendance_status: 'present' as const,
      remarks: '',
    })));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const attendanceRecords = staff.map(s => ({
        staffId: s.staffId,
        status: s.attendance_status || 'present',
        remarks: s.remarks || '',
      }));

      const dateISO = new Date(selectedDate).toISOString();

      await apiClient.post('/attendance/staff/bulk', {
        date: dateISO,
        records: attendanceRecords,
      });

      setSuccess(t('attendance.staffAttendanceSaved'));
      setTimeout(() => setSuccess(''), 5000);
    } catch (error: any) {
      console.error('Failed to mark attendance:', error);
      const errorMsg = error.response?.data?.message || error.message || t('attendance.failedToMarkAttendance');
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const getFullName = (staff: Staff) => {
    return `${staff.firstNameEn} ${staff.middleNameEn || ''} ${staff.lastNameEn}`.trim();
  };

  return (
    <Box>
      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <StaffIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            {t('attendance.staffAttendanceTitle')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label={t('attendance.date')}
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ ...S.TF, width: 200 }}
          />
          <FormControl sx={{ width: 200 }}>
            <InputLabel>{t('attendance.department')}</InputLabel>
            <Select
              value={department}
              label={t('attendance.department')}
              onChange={(e) => setDepartment(e.target.value)}
              sx={S.SELECT}
            >
              <MenuItem value="all">{t('attendance.allDepartments')}</MenuItem>
              <MenuItem value="teaching">{t('attendance.teaching')}</MenuItem>
              <MenuItem value="administration">{t('attendance.administration')}</MenuItem>
              <MenuItem value="support">{t('attendance.support')}</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={handleMarkAllPresent}
            disabled={loading || staff.length === 0}
            sx={S.BTN_OUTLINE}
          >
            {t('attendance.markAllPresentStaff')}
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: R.md }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: R.md }}>{error}</Alert>}
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : staff.length === 0 ? (
        <Paper sx={{ ...S.GLASS, p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {t('attendance.noStaffFound')}
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={S.GLASS}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: S.TH_BG }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t('attendance.staffName')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('attendance.designation')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('attendance.department')}</TableCell>
                  <TableCell width={200} sx={{ fontWeight: 600 }}>{t('common.status')}</TableCell>
                  <TableCell width={300} sx={{ fontWeight: 600 }}>{t('attendance.remarks')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.staffId} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{getFullName(s)}</TableCell>
                    <TableCell sx={S.TD}>{s.designation}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip label={s.department} size="small" />
                    </TableCell>
                    <TableCell sx={S.TD}>
                      <FormControl fullWidth size="small">
                        <Select
                          value={s.attendance_status}
                          onChange={(e) => handleStatusChange(s.staffId, e.target.value)}
                          sx={S.SELECT}
                        >
                          <MenuItem value="present">{t('attendance.present')}</MenuItem>
                          <MenuItem value="absent">{t('attendance.absent')}</MenuItem>
                          <MenuItem value="late">{t('attendance.late')}</MenuItem>
                          <MenuItem value="on_leave">{t('attendance.onLeave')}</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell sx={S.TD}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder={t('attendance.addRemarks')}
                        value={s.remarks}
                        onChange={(e) => handleRemarksChange(s.staffId, e.target.value)}
                        sx={S.TF}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
              sx={S.BTN_PRIMARY}
            >
              {saving ? t('common.saving') : t('attendance.saveAttendance')}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

export default StaffAttendanceMarking;

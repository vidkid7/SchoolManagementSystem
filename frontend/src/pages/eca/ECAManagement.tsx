import { YearSelectableDateField } from '../../components/YearSelectableDatePicker/YearSelectableDatePicker';
/**
 * ECA Management - Enrollments, Attendance, Events, Achievements
 */

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, Alert, Grid, Checkbox, FormControlLabel,
  useTheme,
} from '@mui/material';
import { Add as AddIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { formatLocalDate } from '../../utils/dateUtils';

import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { EnrollmentFormErrors, validateEnrollmentForm } from './enrollmentValidation';
function TabPanel({ children, value, index }: any) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>;
}

export function mapEcaEventFormData(formData: Record<string, any>) {
  const { title, ...eventData } = formData;
  return { ...eventData, ecaId: Number(formData.ecaId), name: String(title).trim() };
}

export function mapEcaAchievementFormData(formData: Record<string, any>) {
  return {
    ecaId: Number(formData.ecaId),
    studentId: Number(formData.studentId),
    title: String(formData.achievement).trim(),
    type: formData.type,
    level: formData.level,
    achievementDate: formData.date,
    description: formData.description,
  };
}

export function mapEcaAttendanceFormData(formData: Record<string, any>) {
  return {
    ecaId: Number(formData.ecaId),
    attendanceData: formData.attendanceData,
  };
}

export function ECAManagement() {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(() => {
    const tab = searchParams.get('tab');
    return ({ enrollments: 0, attendance: 1, events: 2, achievements: 3 } as Record<string, number>)[tab || ''] ?? 0;
  });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<EnrollmentFormErrors>({});
  const [eventErrors, setEventErrors] = useState<{ ecaId?: boolean; title?: boolean; type?: boolean; eventDate?: boolean }>({});
  const [achievementErrors, setAchievementErrors] = useState<{ ecaId?: boolean; studentId?: boolean; title?: boolean; type?: boolean; level?: boolean; date?: boolean }>({});
  const [attendanceErrors, setAttendanceErrors] = useState<{ ecaId?: boolean; attendanceData?: boolean }>({});
  const [attendanceEnrollments, setAttendanceEnrollments] = useState<Array<{ enrollmentId: number; studentId: number; present: boolean }>>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const ecaId = searchParams.get('ecaId');

  useEffect(() => {
    fetchData();
  }, [tabValue, ecaId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoints = ['/eca/enrollments', '/eca/attendance', '/eca/events', '/eca/achievements'];
      const params = tabValue === 0 && ecaId ? { ecaId } : undefined;
      const response = await apiClient.get(endpoints[tabValue], { params });
      setData(response.data?.data || []);
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (tabValue === 0) {
      const nextErrors = validateEnrollmentForm(formData);
      setFormErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
    }
    if (tabValue === 2) {
      const nextErrors = {
        ecaId: !/^\d+$/.test(String(formData.ecaId || '')) || Number(formData.ecaId) <= 0,
        title: !String(formData.title || '').trim(),
        type: !['competition', 'performance', 'exhibition', 'workshop', 'other'].includes(formData.type),
        eventDate: !/^\d{4}-\d{2}-\d{2}$/.test(String(formData.eventDate || '')),
      };
      setEventErrors(nextErrors);
      if (Object.values(nextErrors).some(Boolean)) return;
    }
    if (tabValue === 3) {
      const nextErrors = {
        ecaId: !/^\d+$/.test(String(formData.ecaId || '')) || Number(formData.ecaId) <= 0,
        studentId: !/^\d+$/.test(String(formData.studentId || '')) || Number(formData.studentId) <= 0,
        title: !String(formData.achievement || '').trim(),
        type: !['award', 'medal', 'certificate', 'recognition', 'position'].includes(formData.type),
        level: !['school', 'district', 'regional', 'national', 'international'].includes(formData.level),
        date: !/^\d{4}-\d{2}-\d{2}$/.test(String(formData.date || '')),
      };
      setAchievementErrors(nextErrors);
      if (Object.values(nextErrors).some(Boolean)) return;
    }
    if (tabValue === 1) {
      const hasValidEcaId = /^\d+$/.test(String(formData.ecaId || '')) && Number(formData.ecaId) > 0;
      const nextErrors = {
        ecaId: !hasValidEcaId,
        attendanceData: hasValidEcaId && (!Array.isArray(formData.attendanceData) || formData.attendanceData.length === 0),
      };
      setAttendanceErrors(nextErrors);
      if (Object.values(nextErrors).some(Boolean)) return;
    }
    try {
      const endpoints = ['/eca/enrollments', '/eca/attendance', '/eca/events', '/eca/achievements'];
      const payload = tabValue === 2
        ? mapEcaEventFormData(formData)
        : tabValue === 3
          ? mapEcaAchievementFormData(formData)
          : tabValue === 1
            ? mapEcaAttendanceFormData(formData)
            : formData;
      await apiClient.post(endpoints[tabValue], payload);
      setSuccess(t('eca.operationSuccess'));
      setOpenDialog(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || t('eca.operationFailed'));
    }
  };

  const openEnrollDialog = () => {
    setFormErrors({});
    setError('');
    setFormData({ ecaId: '', studentId: '', enrollmentDate: formatLocalDate(new Date()) });
    setOpenDialog(true);
  };

  const openAttendanceDialog = () => {
    setError('');
    setAttendanceErrors({});
    setAttendanceEnrollments([]);
    setFormData({ ecaId: '', attendanceData: [] });
    setOpenDialog(true);
  };

  const loadAttendanceEnrollments = async (ecaIdValue: string) => {
    setAttendanceEnrollments([]);
    setFormData((current: any) => ({ ...current, ecaId: ecaIdValue, attendanceData: [] }));
    setAttendanceErrors((current) => ({ ...current, ecaId: false, attendanceData: false }));
    if (!/^\d+$/.test(ecaIdValue) || Number(ecaIdValue) <= 0) return;

    setAttendanceLoading(true);
    try {
      const response = await apiClient.get('/eca/enrollments', { params: { ecaId: Number(ecaIdValue), status: 'active', limit: 100 } });
      const enrollments = (response.data?.data || []).map((item: any) => ({
        enrollmentId: Number(item.enrollmentId),
        studentId: Number(item.studentId),
        present: true,
      }));
      setAttendanceEnrollments(enrollments);
      setFormData((current: any) => ({ ...current, attendanceData: enrollments.map(({ enrollmentId, present }: { enrollmentId: number; present: boolean }) => ({ enrollmentId, present })) }));
    } catch {
      setError(t('eca.failedToLoadEnrollments'));
    } finally {
      setAttendanceLoading(false);
    }
  };

  const toggleAttendance = (enrollmentId: number, present: boolean) => {
    const nextEnrollments = attendanceEnrollments.map((enrollment) => enrollment.enrollmentId === enrollmentId ? { ...enrollment, present } : enrollment);
    setAttendanceEnrollments(nextEnrollments);
    setFormData((current: any) => ({
      ...current,
      attendanceData: nextEnrollments.map(({ enrollmentId: id, present: isPresent }) => ({ enrollmentId: id, present: isPresent })),
    }));
  };

  const openEventDialog = () => {
    setError('');
    setEventErrors({});
    setFormData({ ecaId: '', title: '', type: '', description: '', eventDate: '', venue: '' });
    setOpenDialog(true);
  };

  const openAchievementDialog = () => {
    setError('');
    setAchievementErrors({});
    setFormData({ studentId: '', ecaId: '', achievement: '', type: '', level: '', date: formatLocalDate(new Date()), description: '' });
    setOpenDialog(true);
  };

  useEffect(() => {
    if (searchParams.get('action') !== 'create' || tabValue !== 2) return;
    setFormData({ ecaId: '', title: '', type: '', description: '', eventDate: '', venue: '' });
    setEventErrors({});
    setError('');
    setOpenDialog(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('action');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, tabValue]);

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Typography variant="h5" fontWeight={700}>{t('eca.management')}</Typography>
      </Paper>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ ...S.GLASS }}>
        <Tabs value={tabValue} onChange={(_, v) => { setTabValue(v); setError(''); setEventErrors({}); setAchievementErrors({}); setAttendanceErrors({}); setFormErrors({}); }}>
          <Tab label={t('eca.enrollments')} />
          <Tab label={t('eca.attendance')} />
          <Tab label={t('eca.events')} />
          <Tab label={t('eca.achievements')} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" sx={S.BTN_PRIMARY} startIcon={<AddIcon />} onClick={openEnrollDialog}>{t('eca.enrollStudent')}</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('eca.studentName')}</TableCell>
                  <TableCell>{t('eca.ecaCol')}</TableCell>
                  <TableCell>{t('eca.enrollmentDate')}</TableCell>
                  <TableCell>{t('eca.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={4} align="center" sx={S.TD}>{t('common.loading')}</TableCell></TableRow> : data.length === 0 ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={4} align="center" sx={S.TD}>{t('eca.noEnrollments')}</TableCell></TableRow> : data.map((item: any, i) => (
                  <TableRow key={i} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{item.studentName}</TableCell>
                    <TableCell sx={S.TD}>{item.ecaName}</TableCell>
                    <TableCell sx={S.TD}>{new Date(item.enrollmentDate).toLocaleDateString()}</TableCell>
                    <TableCell sx={S.TD}><Chip label={item.status} color="success" size="small" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" sx={S.BTN_PRIMARY} startIcon={<AddIcon />} onClick={openAttendanceDialog}>{t('eca.markAttendanceBtn')}</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('eca.ecaCol')}</TableCell>
                  <TableCell>{t('eca.date')}</TableCell>
                  <TableCell>{t('eca.present')}</TableCell>
                  <TableCell>{t('eca.absent')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={4} align="center" sx={S.TD}>{t('common.loading')}</TableCell></TableRow> : data.length === 0 ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={4} align="center" sx={S.TD}>{t('eca.noAttendanceRecords')}</TableCell></TableRow> : data.map((item: any, i) => (
                  <TableRow key={i} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{item.ecaName}</TableCell>
                    <TableCell sx={S.TD}>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell sx={S.TD}>{item.presentCount}</TableCell>
                    <TableCell sx={S.TD}>{item.absentCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" sx={S.BTN_PRIMARY} startIcon={<AddIcon />} onClick={openEventDialog}>{t('eca.createEvent')}</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('eca.eventTitle')}</TableCell>
                  <TableCell>{t('eca.ecaCol')}</TableCell>
                  <TableCell>{t('eca.date')}</TableCell>
                  <TableCell>{t('eca.venue')}</TableCell>
                  <TableCell>{t('eca.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={5} align="center" sx={S.TD}>{t('common.loading')}</TableCell></TableRow> : data.length === 0 ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={5} align="center" sx={S.TD}>{t('eca.noEvents')}</TableCell></TableRow> : data.map((item: any, i) => (
                  <TableRow key={i} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{item.title}</TableCell>
                    <TableCell sx={S.TD}>{item.ecaName}</TableCell>
                    <TableCell sx={S.TD}>{new Date(item.eventDate).toLocaleDateString()}</TableCell>
                    <TableCell sx={S.TD}>{item.venue}</TableCell>
                    <TableCell sx={S.TD}><Chip label={item.status} size="small" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" sx={S.BTN_PRIMARY} startIcon={<TrophyIcon />} onClick={openAchievementDialog}>{t('eca.recordAchievementBtn')}</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('eca.studentName')}</TableCell>
                  <TableCell>{t('eca.ecaCol')}</TableCell>
                  <TableCell>{t('eca.achievements')}</TableCell>
                  <TableCell>{t('eca.date')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={4} align="center" sx={S.TD}>{t('common.loading')}</TableCell></TableRow> : data.length === 0 ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={4} align="center" sx={S.TD}>{t('eca.noAchievements')}</TableCell></TableRow> : data.map((item: any, i) => (
                  <TableRow key={i} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{item.studentName}</TableCell>
                    <TableCell sx={S.TD}>{item.ecaName}</TableCell>
                    <TableCell sx={S.TD}>{item.achievement}</TableCell>
                    <TableCell sx={S.TD}>{new Date(item.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setError(''); setEventErrors({}); setAchievementErrors({}); setAttendanceErrors({}); setFormErrors({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {tabValue === 0 && t('eca.enrollStudent')}
          {tabValue === 1 && t('eca.markAttendanceBtn')}
          {tabValue === 2 && t('eca.createEvent')}
          {tabValue === 3 && t('eca.recordAchievementBtn')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {error && <Grid item xs={12}><Alert severity="error" onClose={() => setError('')}>{error}</Alert></Grid>}
            {tabValue === 0 && (
              <>
                <Grid item xs={12}><TextField label={t('eca.ecaId')} type="number" value={formData.ecaId} onChange={(e) => { setFormData({ ...formData, ecaId: e.target.value }); setFormErrors((current) => ({ ...current, ecaId: undefined })); }} error={Boolean(formErrors.ecaId)} helperText={formErrors.ecaId ? t(`eca.${formErrors.ecaId === 'required' ? 'ecaIdRequired' : 'positiveIdRequired'}`) : undefined} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.studentId')} type="number" value={formData.studentId} onChange={(e) => { setFormData({ ...formData, studentId: e.target.value }); setFormErrors((current) => ({ ...current, studentId: undefined })); }} error={Boolean(formErrors.studentId)} helperText={formErrors.studentId ? t(`eca.${formErrors.studentId === 'required' ? 'studentIdRequired' : 'positiveIdRequired'}`) : undefined} fullWidth /></Grid>
                <Grid item xs={12}><YearSelectableDateField label={t('eca.enrollmentDate')} value={formData.enrollmentDate} onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </>
            )}
            {tabValue === 1 && (
              <>
                <Grid item xs={12}><TextField label={t('eca.ecaId')} type="number" value={formData.ecaId} onChange={(e) => void loadAttendanceEnrollments(e.target.value)} error={Boolean(attendanceErrors.ecaId)} helperText={attendanceErrors.ecaId ? t('eca.ecaIdRequired') : undefined} fullWidth /></Grid>
                {attendanceLoading && <Grid item xs={12}><Typography>{t('common.loading')}</Typography></Grid>}
                {!attendanceLoading && formData.ecaId && attendanceEnrollments.length === 0 && <Grid item xs={12}><Alert severity="info">{t('eca.noActiveEnrollments')}</Alert></Grid>}
                {attendanceEnrollments.map((enrollment) => <Grid item xs={12} key={enrollment.enrollmentId}><FormControlLabel control={<Checkbox checked={enrollment.present} onChange={(event) => toggleAttendance(enrollment.enrollmentId, event.target.checked)} />} label={`${t('eca.studentId')}: ${enrollment.studentId}`} /></Grid>)}
                {attendanceErrors.attendanceData && <Grid item xs={12}><Alert severity="error">{t('eca.noActiveEnrollments')}</Alert></Grid>}
              </>
            )}
            {tabValue === 2 && (
              <>
                <Grid item xs={12}><TextField label={t('eca.ecaId')} type="number" value={formData.ecaId} onChange={(e) => { setFormData({ ...formData, ecaId: e.target.value }); setEventErrors((current) => ({ ...current, ecaId: false })); }} error={Boolean(eventErrors.ecaId)} helperText={eventErrors.ecaId ? t('eca.ecaIdRequired') : undefined} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.eventTitle')} value={formData.title} onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setEventErrors((current) => ({ ...current, title: false })); }} error={Boolean(eventErrors.title)} helperText={eventErrors.title ? t('eca.eventTitleRequired') : undefined} fullWidth /></Grid>
                <Grid item xs={12}><TextField select label={t('eca.eventType')} value={formData.type} onChange={(e) => { setFormData({ ...formData, type: e.target.value }); setEventErrors((current) => ({ ...current, type: false })); }} error={Boolean(eventErrors.type)} helperText={eventErrors.type ? t('eca.eventTypeRequired') : undefined} fullWidth>
                  {['competition', 'performance', 'exhibition', 'workshop', 'other'].map((type) => <MenuItem key={type} value={type}>{t(`eca.${type}`)}</MenuItem>)}
                </TextField></Grid>
                <Grid item xs={12}><YearSelectableDateField label={t('eca.eventDate')} value={formData.eventDate} onChange={(e) => { setFormData({ ...formData, eventDate: e.target.value }); setEventErrors((current) => ({ ...current, eventDate: false })); }} error={Boolean(eventErrors.eventDate)} helperText={eventErrors.eventDate ? t('eca.eventDateRequired') : undefined} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12}><TextField label={t('eca.venue')} value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.description')} multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth /></Grid>
              </>
            )}
            {tabValue === 3 && (
              <>
                <Grid item xs={12}><TextField label={t('eca.studentId')} type="number" value={formData.studentId} onChange={(e) => { setFormData({ ...formData, studentId: e.target.value }); setAchievementErrors((current) => ({ ...current, studentId: false })); }} error={Boolean(achievementErrors.studentId)} helperText={achievementErrors.studentId ? t('eca.studentIdRequired') : undefined} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.ecaId')} type="number" value={formData.ecaId} onChange={(e) => { setFormData({ ...formData, ecaId: e.target.value }); setAchievementErrors((current) => ({ ...current, ecaId: false })); }} error={Boolean(achievementErrors.ecaId)} helperText={achievementErrors.ecaId ? t('eca.ecaIdRequired') : undefined} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.achievements')} value={formData.achievement} onChange={(e) => { setFormData({ ...formData, achievement: e.target.value }); setAchievementErrors((current) => ({ ...current, title: false })); }} error={Boolean(achievementErrors.title)} helperText={achievementErrors.title ? t('eca.achievementTitleRequired') : undefined} fullWidth /></Grid>
                <Grid item xs={12}><TextField select label={t('eca.achievementType')} value={formData.type} onChange={(e) => { setFormData({ ...formData, type: e.target.value }); setAchievementErrors((current) => ({ ...current, type: false })); }} error={Boolean(achievementErrors.type)} helperText={achievementErrors.type ? t('eca.achievementTypeRequired') : undefined} fullWidth>
                  {['award', 'medal', 'certificate', 'recognition', 'position'].map((type) => <MenuItem key={type} value={type}>{t(`eca.${type}`)}</MenuItem>)}
                </TextField></Grid>
                <Grid item xs={12}><TextField select label={t('eca.achievementLevel')} value={formData.level} onChange={(e) => { setFormData({ ...formData, level: e.target.value }); setAchievementErrors((current) => ({ ...current, level: false })); }} error={Boolean(achievementErrors.level)} helperText={achievementErrors.level ? t('eca.achievementLevelRequired') : undefined} fullWidth>
                  {['school', 'district', 'regional', 'national', 'international'].map((level) => <MenuItem key={level} value={level}>{t(`eca.${level}`)}</MenuItem>)}
                </TextField></Grid>
                <Grid item xs={12}><YearSelectableDateField label={t('eca.date')} value={formData.date} onChange={(e) => { setFormData({ ...formData, date: e.target.value }); setAchievementErrors((current) => ({ ...current, date: false })); }} error={Boolean(achievementErrors.date)} helperText={achievementErrors.date ? t('eca.achievementDateRequired') : undefined} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12}><TextField label={t('eca.description')} multiline rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth /></Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenDialog(false); setError(''); setEventErrors({}); setAchievementErrors({}); setAttendanceErrors({}); setFormErrors({}); }}>{t('eca.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" sx={S.BTN_PRIMARY}>{t('eca.submit')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ECAManagement;

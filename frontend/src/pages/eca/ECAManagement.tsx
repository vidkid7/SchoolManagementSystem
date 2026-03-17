/**
 * ECA Management - Enrollments, Attendance, Events, Achievements
 */

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Alert, Grid,
  useTheme,
} from '@mui/material';
import { Add as AddIcon, EmojiEvents as TrophyIcon } from '@mui/icons-material';
import apiClient from '../../services/apiClient';

import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';
function TabPanel({ children, value, index }: any) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>;
}

export function ECAManagement() {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoints = ['/eca/enrollments', '/eca/attendance', '/eca/events', '/eca/achievements'];
      const response = await apiClient.get(endpoints[tabValue]);
      setData(response.data?.data || []);
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const endpoints = ['/eca/enrollments', '/eca/attendance', '/eca/events', '/eca/achievements'];
      await apiClient.post(endpoints[tabValue], formData);
      setSuccess(t('eca.operationSuccess'));
      setOpenDialog(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('eca.operationFailed'));
    }
  };

  const openEnrollDialog = () => {
    setFormData({ ecaId: '', studentId: '', enrollmentDate: new Date().toISOString().split('T')[0] });
    setOpenDialog(true);
  };

  const openAttendanceDialog = () => {
    setFormData({ ecaId: '', date: new Date().toISOString().split('T')[0], students: [] });
    setOpenDialog(true);
  };

  const openEventDialog = () => {
    setFormData({ ecaId: '', title: '', description: '', eventDate: '', venue: '' });
    setOpenDialog(true);
  };

  const openAchievementDialog = () => {
    setFormData({ studentId: '', ecaId: '', achievement: '', date: new Date().toISOString().split('T')[0], description: '' });
    setOpenDialog(true);
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Typography variant="h5" fontWeight={700}>{t('eca.management')}</Typography>
      </Paper>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ ...S.GLASS }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {tabValue === 0 && t('eca.enrollStudent')}
          {tabValue === 1 && t('eca.markAttendanceBtn')}
          {tabValue === 2 && t('eca.createEvent')}
          {tabValue === 3 && t('eca.recordAchievementBtn')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {tabValue === 0 && (
              <>
                <Grid item xs={12}><TextField label={t('eca.ecaId')} type="number" value={formData.ecaId} onChange={(e) => setFormData({ ...formData, ecaId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.studentId')} type="number" value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.enrollmentDate')} type="date" value={formData.enrollmentDate} onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </>
            )}
            {tabValue === 1 && (
              <>
                <Grid item xs={12}><TextField label={t('eca.ecaId')} type="number" value={formData.ecaId} onChange={(e) => setFormData({ ...formData, ecaId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.date')} type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </>
            )}
            {tabValue === 2 && (
              <>
                <Grid item xs={12}><TextField label={t('eca.ecaId')} type="number" value={formData.ecaId} onChange={(e) => setFormData({ ...formData, ecaId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.eventTitle')} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.eventDate')} type="date" value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12}><TextField label={t('eca.venue')} value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.description')} multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth /></Grid>
              </>
            )}
            {tabValue === 3 && (
              <>
                <Grid item xs={12}><TextField label={t('eca.studentId')} type="number" value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.ecaId')} type="number" value={formData.ecaId} onChange={(e) => setFormData({ ...formData, ecaId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.achievements')} value={formData.achievement} onChange={(e) => setFormData({ ...formData, achievement: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('eca.date')} type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12}><TextField label={t('eca.description')} multiline rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth /></Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('eca.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" sx={S.BTN_PRIMARY}>{t('eca.submit')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ECAManagement;

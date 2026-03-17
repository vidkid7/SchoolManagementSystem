/**
 * Sports Management - Comprehensive sports, teams, tournaments, achievements
 */

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, Alert, Grid, IconButton,
  useTheme,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, EmojiEvents as TrophyIcon, Groups as TeamIcon, PersonAdd as EnrollIcon, HowToReg as AttendanceIcon, History as HistoryIcon } from '@mui/icons-material';
import apiClient from '../../services/apiClient';

import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';
function TabPanel({ children, value, index }: any) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>;
}

export function SportsManagement() {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<any>({});

  // Enroll dialog
  const [enrollDialog, setEnrollDialog] = useState(false);
  const [enrollSportId, setEnrollSportId] = useState<number | null>(null);
  const [enrollForm, setEnrollForm] = useState({ studentId: '', teamId: '' });

  // Enrollments & Attendance tab
  const [sportsList, setSportsList] = useState<any[]>([]);
  const [selectedSportId, setSelectedSportId] = useState('');
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [attendancePresence, setAttendancePresence] = useState<Record<number, boolean>>({});
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  // Student history tab
  const [historyStudentId, setHistoryStudentId] = useState('');
  const [studentHistory, setStudentHistory] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (tabValue < 4) fetchData();
    if (tabValue === 4 && !sportsList.length) {
      apiClient.get('/sports/list', { params: { limit: 500 } }).then((r) => setSportsList(r.data?.data || [])).catch(() => {});
    }
  }, [tabValue, page, rowsPerPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoints = ['/sports/list', '/sports/teams', '/sports/tournaments', '/sports/achievements'];
      const response = await apiClient.get(endpoints[tabValue], { params: { page: page + 1, limit: rowsPerPage } });
      setData(response.data?.data || []);
      setTotal(response.data?.meta?.total || 0);
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!selectedSportId) return;
    setEnrollmentsLoading(true);
    try {
      const res = await apiClient.get(`/sports/${selectedSportId}/enrollments`, { params: { status: 'active' } });
      const list = res.data?.data || [];
      setEnrollments(list);
      const next: Record<number, boolean> = {};
      list.forEach((e: any) => { next[e.enrollmentId ?? e.id] = true; });
      setAttendancePresence(next);
    } catch {
      setEnrollments([]);
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedSportId) return;
    const attendanceData = enrollments.map((e: any) => ({
      enrollmentId: e.enrollmentId ?? e.id,
      present: attendancePresence[e.enrollmentId ?? e.id] ?? false,
    }));
    try {
      await apiClient.post(`/sports/${selectedSportId}/mark-attendance`, { attendanceData });
      setSuccess(t('sports.attendanceMarked'));
      fetchEnrollments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('sports.failedToMarkAttendance'));
    }
  };

  const fetchStudentHistory = async () => {
    if (!historyStudentId) return;
    setHistoryLoading(true);
    try {
      const res = await apiClient.get(`/sports/student/${historyStudentId}`);
      setStudentHistory(res.data?.data ?? null);
    } catch {
      setStudentHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (enrollSportId == null || !enrollForm.studentId) return;
    try {
      await apiClient.post(`/sports/${enrollSportId}/enroll`, {
        studentId: parseInt(enrollForm.studentId, 10),
        teamId: enrollForm.teamId ? parseInt(enrollForm.teamId, 10) : undefined,
      });
      setSuccess(t('sports.studentEnrolled'));
      setEnrollDialog(false);
      setEnrollSportId(null);
      setEnrollForm({ studentId: '', teamId: '' });
      if (selectedSportId && String(enrollSportId) === selectedSportId) fetchEnrollments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('sports.enrollFailed'));
    }
  };

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      if (tabValue === 0) setFormData({ name: '', category: '', coach: '', status: 'active' });
      else if (tabValue === 1) setFormData({ name: '', sportId: '', coach: '', captain: '' });
      else if (tabValue === 2) setFormData({ name: '', sportId: '', startDate: '', endDate: '', venue: '' });
      else setFormData({ studentId: '', sportId: '', achievement: '', date: new Date().toISOString().split('T')[0] });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const endpoints = ['/sports', '/sports/teams', '/sports/tournaments', '/sports/achievements'];
      const id = editingItem?.sportId ?? editingItem?.id;
      if (editingItem) {
        await apiClient.put(`${endpoints[tabValue]}/${id}`, formData);
        setSuccess(t('sports.updatedSuccessfully'));
      } else {
        await apiClient.post(endpoints[tabValue], formData);
        setSuccess(t('sports.createdSuccessfully'));
      }
      setOpenDialog(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('sports.operationFailed'));
    }
  };

  const handleDelete = async (item: any) => {
    const id = item?.sportId ?? item?.id;
    if (!id || !confirm(t('sports.confirmDelete'))) return;
    try {
      const endpoints = ['/sports', '/sports/teams', '/sports/tournaments', '/sports/achievements'];
      await apiClient.delete(`${endpoints[tabValue]}/${id}`);
      setSuccess(t('sports.deletedSuccessfully'));
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('sports.deleteFailed'));
    }
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Typography variant="h5" fontWeight={700}>{t('sports.management')}</Typography>
      </Paper>
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ ...S.GLASS }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={t('sports.sports')} />
          <Tab label={t('sports.teams')} />
          <Tab label={t('sports.tournaments')} />
          <Tab label={t('sports.achievements')} />
          <Tab label={t('sports.enrollmentsAndAttendance')} />
          <Tab label={t('sports.studentHistory')} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" sx={S.BTN_PRIMARY} startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>{t('sports.createSport')}</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('sports.sportName')}</TableCell>
                  <TableCell>{t('sports.category')}</TableCell>
                  <TableCell>{t('sports.coach')}</TableCell>
                  <TableCell>{t('sports.status')}</TableCell>
                  <TableCell align="center">{t('sports.enroll')}</TableCell>
                  <TableCell align="center">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={6} align="center" sx={S.TD}>{t('common.loading')}</TableCell></TableRow> : data.length === 0 ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={6} align="center" sx={S.TD}>{t('sports.noSportsFound')}</TableCell></TableRow> : data.map((item: any) => (
                  <TableRow key={item.sportId ?? item.id} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{item.name}</TableCell>
                    <TableCell sx={S.TD}><Chip label={item.category} size="small" /></TableCell>
                    <TableCell sx={S.TD}>{item.coach}</TableCell>
                    <TableCell sx={S.TD}><Chip label={item.status} color={item.status === 'active' ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <Button size="small" startIcon={<EnrollIcon />} onClick={() => { setEnrollSportId(item.sportId ?? item.id); setEnrollDialog(true); }}>{t('sports.enroll')}</Button>
                      <IconButton size="small" onClick={() => handleOpenDialog(item)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(item)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" sx={S.BTN_PRIMARY} startIcon={<TeamIcon />} onClick={() => handleOpenDialog()}>{t('sports.createTeamBtn')}</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('sports.teamName')}</TableCell>
                  <TableCell>{t('sports.sport')}</TableCell>
                  <TableCell>{t('sports.coach')}</TableCell>
                  <TableCell>{t('sports.captain')}</TableCell>
                  <TableCell align="center">{t('sports.players')}</TableCell>
                  <TableCell align="center">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={6} align="center" sx={S.TD}>{t('common.loading')}</TableCell></TableRow> : data.length === 0 ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={6} align="center" sx={S.TD}>{t('sports.noTeamsFound')}</TableCell></TableRow> : data.map((item: any) => (
                  <TableRow key={item.id} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{item.name}</TableCell>
                    <TableCell sx={S.TD}>{item.sportName}</TableCell>
                    <TableCell sx={S.TD}>{item.coach}</TableCell>
                    <TableCell sx={S.TD}>{item.captain}</TableCell>
                    <TableCell align="center" sx={S.TD}>{item.playerCount || 0}</TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <IconButton size="small" onClick={() => handleOpenDialog(item)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(item.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" sx={S.BTN_PRIMARY} startIcon={<TrophyIcon />} onClick={() => handleOpenDialog()}>{t('sports.createTournament')}</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('sports.tournamentName')}</TableCell>
                  <TableCell>{t('sports.sport')}</TableCell>
                  <TableCell>{t('sports.startDate')}</TableCell>
                  <TableCell>{t('sports.endDate')}</TableCell>
                  <TableCell>{t('sports.venue')}</TableCell>
                  <TableCell>{t('sports.status')}</TableCell>
                  <TableCell align="center">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={7} align="center" sx={S.TD}>{t('common.loading')}</TableCell></TableRow> : data.length === 0 ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={7} align="center" sx={S.TD}>{t('sports.noTournamentsFound')}</TableCell></TableRow> : data.map((item: any) => (
                  <TableRow key={item.id} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{item.name}</TableCell>
                    <TableCell sx={S.TD}>{item.sportName}</TableCell>
                    <TableCell sx={S.TD}>{new Date(item.startDate).toLocaleDateString()}</TableCell>
                    <TableCell sx={S.TD}>{new Date(item.endDate).toLocaleDateString()}</TableCell>
                    <TableCell sx={S.TD}>{item.venue}</TableCell>
                    <TableCell sx={S.TD}><Chip label={item.status} size="small" /></TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <IconButton size="small" onClick={() => handleOpenDialog(item)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(item.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" sx={S.BTN_PRIMARY} startIcon={<TrophyIcon />} onClick={() => handleOpenDialog()}>{t('sports.recordAchievementBtn')}</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('sports.studentName')}</TableCell>
                  <TableCell>{t('sports.sport')}</TableCell>
                  <TableCell>{t('sports.achievement')}</TableCell>
                  <TableCell>{t('sports.date')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={4} align="center" sx={S.TD}>{t('common.loading')}</TableCell></TableRow> : data.length === 0 ? <TableRow sx={S.TR_HOVER}><TableCell colSpan={4} align="center" sx={S.TD}>{t('sports.noAchievementsFound')}</TableCell></TableRow> : data.map((item: any) => (
                  <TableRow key={item.id} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{item.studentName}</TableCell>
                    <TableCell sx={S.TD}>{item.sportName}</TableCell>
                    <TableCell sx={S.TD}>{item.achievement}</TableCell>
                    <TableCell sx={S.TD}>{new Date(item.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
            <TextField
              select
              size="small"
              label={t('sports.selectSport')}
              value={selectedSportId}
              onChange={(e) => setSelectedSportId(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">{t('sports.selectSport')}</MenuItem>
              {(sportsList.length ? sportsList : data).map((s: any) => (
                <MenuItem key={s.sportId ?? s.id} value={String(s.sportId ?? s.id)}>{s.name}</MenuItem>
              ))}
            </TextField>
            <Button variant="contained" sx={S.BTN_PRIMARY} startIcon={<AttendanceIcon />} onClick={fetchEnrollments} disabled={!selectedSportId || enrollmentsLoading}>{t('sports.loadEnrollments')}</Button>
            {enrollments.length > 0 && (
              <Button variant="outlined" sx={S.BTN_OUTLINE} onClick={handleMarkAttendance}>{t('sports.markAttendanceBtn')}</Button>
            )}
          </Box>
          {enrollmentsLoading ? <Typography>{t('common.loading')}</Typography> : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: S.TH_BG }}>
                  <TableRow>
                    <TableCell>{t('sports.enrollmentId')}</TableCell>
                    <TableCell>{t('sports.studentId')}</TableCell>
                    <TableCell>{t('sports.attendanceCount')}</TableCell>
                    <TableCell>{t('sports.presentToday')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {enrollments.length === 0 ? (
                    <TableRow sx={S.TR_HOVER}><TableCell colSpan={4} align="center" sx={S.TD}>{t('sports.selectSportClickLoad')}</TableCell></TableRow>
                  ) : (
                    enrollments.map((e: any) => (
                      <TableRow key={e.enrollmentId ?? e.id} sx={S.TR_HOVER}>
                        <TableCell sx={S.TD}>{e.enrollmentId ?? e.id}</TableCell>
                        <TableCell sx={S.TD}>{e.studentId}</TableCell>
                        <TableCell sx={S.TD}>{e.attendanceCount ?? 0} / {e.totalSessions ?? 0}</TableCell>
                        <TableCell sx={S.TD}>
                          <input
                            type="checkbox"
                            checked={attendancePresence[e.enrollmentId ?? e.id] ?? false}
                            onChange={(ev) => setAttendancePresence((prev) => ({ ...prev, [e.enrollmentId ?? e.id]: ev.target.checked }))}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField size="small" label={t('sports.studentId')} value={historyStudentId} onChange={(e) => setHistoryStudentId(e.target.value)} placeholder={t('sports.studentId')} sx={{ width: 140 }} />
            <Button variant="contained" sx={S.BTN_PRIMARY} startIcon={<HistoryIcon />} onClick={fetchStudentHistory} disabled={!historyStudentId || historyLoading}>{t('sports.loadHistory')}</Button>
          </Box>
          {historyLoading && <Typography>{t('common.loading')}</Typography>}
          {studentHistory && !historyLoading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {studentHistory.enrollments?.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>{t('sports.enrollmentsAndAttendance')}</Typography>
                  <TableContainer><Table size="small">
                    <TableHead sx={{ bgcolor: S.TH_BG }}><TableRow><TableCell>{t('sports.sport')}</TableCell><TableCell>{t('sports.status')}</TableCell><TableCell>{t('sports.attendanceCount')}</TableCell></TableRow></TableHead>
                    <TableBody>
                      {studentHistory.enrollments.map((e: any) => (
                        <TableRow key={e.enrollmentId ?? e.id} sx={S.TR_HOVER}>
                          <TableCell sx={S.TD}>{e.Sport?.name ?? e.sportId}</TableCell>
                          <TableCell sx={S.TD}><Chip label={e.status} size="small" /></TableCell>
                          <TableCell sx={S.TD}>{e.attendanceCount ?? 0} / {e.totalSessions ?? 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table></TableContainer>
                </Box>
              )}
              {studentHistory.achievements?.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>{t('sports.achievements')}</Typography>
                  <TableContainer><Table size="small">
                    <TableHead sx={{ bgcolor: S.TH_BG }}><TableRow><TableCell>{t('sports.achievement')}</TableCell><TableCell>{t('sports.date')}</TableCell></TableRow></TableHead>
                    <TableBody>
                      {studentHistory.achievements.map((a: any, i: number) => (
                        <TableRow key={i} sx={S.TR_HOVER}><TableCell sx={S.TD}>{a.achievement ?? a.description}</TableCell><TableCell sx={S.TD}>{a.date ? new Date(a.date).toLocaleDateString() : '-'}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table></TableContainer>
                </Box>
              )}
              {studentHistory && !studentHistory.enrollments?.length && !studentHistory.achievements?.length && <Typography color="text.secondary">{t('sports.noEnrollmentsOrAchievements')}</Typography>}
            </Box>
          )}
        </TabPanel>

        <TablePagination component="div" count={total} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingItem ? t('sports.edit') : t('common.create')} {[t('sports.sports'), t('sports.teams'), t('sports.tournaments'), t('sports.achievements')][tabValue]}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {tabValue === 0 && (
              <>
                <Grid item xs={12}><TextField label={t('sports.sportName')} value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}>
                  <TextField select label={t('sports.category')} value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} fullWidth>
                    <MenuItem value="Indoor">{t('sports.indoor')}</MenuItem>
                    <MenuItem value="Outdoor">{t('sports.outdoor')}</MenuItem>
                    <MenuItem value="Team">{t('sports.teamCategory')}</MenuItem>
                    <MenuItem value="Individual">{t('sports.individual')}</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}><TextField label={t('sports.coach')} value={formData.coach || ''} onChange={(e) => setFormData({ ...formData, coach: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}>
                  <TextField select label={t('sports.status')} value={formData.status || 'active'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} fullWidth>
                    <MenuItem value="active">{t('sports.active')}</MenuItem>
                    <MenuItem value="inactive">{t('sports.inactive')}</MenuItem>
                  </TextField>
                </Grid>
              </>
            )}
            {tabValue === 1 && (
              <>
                <Grid item xs={12}><TextField label={t('sports.teamName')} value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label={t('sports.sportId')} type="number" value={formData.sportId || ''} onChange={(e) => setFormData({ ...formData, sportId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label={t('sports.coach')} value={formData.coach || ''} onChange={(e) => setFormData({ ...formData, coach: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('sports.captain')} value={formData.captain || ''} onChange={(e) => setFormData({ ...formData, captain: e.target.value })} fullWidth /></Grid>
              </>
            )}
            {tabValue === 2 && (
              <>
                <Grid item xs={12}><TextField label={t('sports.tournamentName')} value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label={t('sports.sportId')} type="number" value={formData.sportId || ''} onChange={(e) => setFormData({ ...formData, sportId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label={t('sports.venue')} value={formData.venue || ''} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label={t('sports.startDate')} type="date" value={formData.startDate || ''} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12} md={6}><TextField label={t('sports.endDate')} type="date" value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </>
            )}
            {tabValue === 3 && (
              <>
                <Grid item xs={12} md={6}><TextField label={t('sports.studentId')} type="number" value={formData.studentId || ''} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12} md={6}><TextField label={t('sports.sportId')} type="number" value={formData.sportId || ''} onChange={(e) => setFormData({ ...formData, sportId: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('sports.achievement')} value={formData.achievement || ''} onChange={(e) => setFormData({ ...formData, achievement: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label={t('sports.date')} type="date" value={formData.date || ''} onChange={(e) => setFormData({ ...formData, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('sports.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" sx={S.BTN_PRIMARY}>{t('sports.submit')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={enrollDialog} onClose={() => { setEnrollDialog(false); setEnrollSportId(null); setEnrollForm({ studentId: '', teamId: '' }); }} maxWidth="xs" fullWidth>
        <DialogTitle>{t('sports.enrollStudent')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField label={t('sports.studentId')} type="number" value={enrollForm.studentId} onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })} fullWidth required />
            </Grid>
            <Grid item xs={12}>
              <TextField label={t('sports.teamIdOptional')} type="number" value={enrollForm.teamId} onChange={(e) => setEnrollForm({ ...enrollForm, teamId: e.target.value })} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialog(false)}>{t('sports.cancel')}</Button>
          <Button onClick={handleEnroll} variant="contained" sx={S.BTN_PRIMARY} disabled={!enrollForm.studentId}>{t('sports.enroll')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SportsManagement;

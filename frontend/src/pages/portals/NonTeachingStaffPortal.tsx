import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select,
  MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, useTheme,
} from '@mui/material';
import { C, useAdminStyles } from '../../theme/designTokens';
import {
  Badge as StaffIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  Description as DocIcon,
  Notifications as AnnouncementIcon,
  Person as PersonIcon,
  Assignment as TaskIcon,
  Schedule as ScheduleIcon,
  CheckCircle as DoneIcon,
  HourglassTop as InProgressIcon,
  RadioButtonUnchecked as PendingIcon,
  EventAvailable as LeaveIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';
import { useTranslation } from 'react-i18next';

interface DashboardData { profile: { username: string; email: string; firstName: string; lastName: string; phoneNumber: string; role: string; status: string; }; role: string; quickLinks: Array<{ label: string; path: string }>; }
interface ProfileData { username: string; email: string; firstName: string; lastName: string; phoneNumber?: string; role: string; status: string; }
interface Task { id: number; title: string; description: string; priority: string; status: string; dueDate: string | null; assignedBy: number; }
interface ScheduleEntry { day: string; startTime: string; endTime: string; location: string; duties: string; }

const authHdr = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const statusIcon = (status: string) => {
  if (status === 'completed') return <DoneIcon fontSize="small" color="success" />;
  if (status === 'in_progress') return <InProgressIcon fontSize="small" color="warning" />;
  return <PendingIcon fontSize="small" color="action" />;
};

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>;
}

const NonTeachingStaffPortal: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [dashRes, profileRes, tasksRes, schedRes, leaveRes] = await Promise.all([
        apiClient.get('/api/v1/non-teaching-staff/dashboard', authHdr(accessToken)),
        apiClient.get('/api/v1/non-teaching-staff/profile', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
        apiClient.get('/api/v1/non-teaching-staff/tasks', authHdr(accessToken)).catch(() => ({ data: { data: { tasks: [] } } })),
        apiClient.get('/api/v1/non-teaching-staff/schedule', authHdr(accessToken)).catch(() => ({ data: { data: { schedule: [] } } })),
        apiClient.get('/api/v1/attendance/leave/my', authHdr(accessToken)).catch(() => ({ data: { data: { leaves: [], balance: null } } })),
      ]);
      setData(dashRes.data.data);
      setProfile(profileRes.data?.data ?? null);
      const taskList = tasksRes.data?.data;
      setTasks(Array.isArray(taskList) ? taskList : taskList?.tasks ?? []);
      const schedList = schedRes.data?.data;
      setSchedule(Array.isArray(schedList) ? schedList : schedList?.schedule ?? []);
      const leaveData = leaveRes.data?.data;
      setLeaveHistory(Array.isArray(leaveData) ? leaveData : leaveData?.leaves ?? []);
      if (leaveData?.balance) setLeaveBalance(leaveData.balance);
    } catch {
      setError('Failed to load staff dashboard');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await apiClient.put(`/api/v1/non-teaching-staff/tasks/${taskId}`, { status: newStatus }, authHdr(accessToken!));
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch { setError('Failed to update task status'); }
  };

  const handleLeaveSubmit = async () => {
    if (!accessToken || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) return;
    try {
      setLeaveSubmitting(true);
      await apiClient.post('/api/v1/attendance/leave/apply', leaveForm, authHdr(accessToken));
      setLeaveDialogOpen(false);
      setLeaveForm({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
      loadData();
    } catch {
      setError('Failed to submit leave request');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
          <StaffIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>{t('portal.staffPortal')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('portal.welcome')}, {user?.firstName || user?.username} — {t('portal.nonTeachingStaff')}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: t('portal.pendingTasksCount'), value: pendingCount, icon: <PendingIcon />, color: C.neutral },
          { label: t('portal.inProgressCount'), value: inProgressCount, icon: <InProgressIcon />, color: C.warning },
          { label: t('portal.completedCount'), value: completedCount, icon: <DoneIcon />, color: C.success },
          { label: t('portal.totalTasksCount'), value: tasks.length, icon: <TaskIcon />, color: C.primary },
        ].map(stat => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Box sx={S.STAT_CARD(stat.color)}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={S.ICON_BOX(stat.color, 36)}>{stat.icon}</Box>
                <Typography variant="h4" fontWeight={700}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<TaskIcon />} iconPosition="start" label={t('portal.myTasks')} />
        <Tab icon={<ScheduleIcon />} iconPosition="start" label={t('portal.mySchedule')} />
        <Tab icon={<LeaveIcon />} iconPosition="start" label={t('portal.leaveManagement')} />
        <Tab icon={<PersonIcon />} iconPosition="start" label={t('portal.profileAndLinks')} />
      </Tabs>

      {/* TASKS */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.assignedTasks')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('common.status')}</TableCell><TableCell>{t('portal.task')}</TableCell><TableCell>{t('common.description')}</TableCell>
              <TableCell>{t('common.priority')}</TableCell><TableCell>{t('portal.dueDate')}</TableCell><TableCell>{t('portal.updateStatus')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noTasksAssigned')}</Typography></TableCell></TableRow>
              ) : tasks.map(task => (
                <TableRow key={task.id} hover>
                  <TableCell>{statusIcon(task.status)}</TableCell>
                  <TableCell><strong>{task.title}</strong></TableCell>
                  <TableCell sx={{ maxWidth: 200 }}><Typography variant="body2" noWrap>{task.description || '—'}</Typography></TableCell>
                  <TableCell>
                    <Chip label={task.priority} size="small"
                      color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'} />
                  </TableCell>
                  <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <Select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)} disabled={task.status === 'completed'}>
                        <MenuItem value="pending">{t('common.pending')}</MenuItem>
                        <MenuItem value="in_progress">{t('common.inProgress')}</MenuItem>
                        <MenuItem value="completed">{t('common.completed')}</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* SCHEDULE */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.weeklySchedule')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('portal.day')}</TableCell><TableCell>{t('portal.start')}</TableCell><TableCell>{t('portal.end')}</TableCell>
              <TableCell>{t('portal.location')}</TableCell><TableCell>{t('portal.duties')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {schedule.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noSchedule')}</Typography></TableCell></TableRow>
              ) : DAYS.map(day => {
                const entry = schedule.find(s => s.day === day);
                return (
                  <TableRow key={day} sx={entry ? {} : { bgcolor: 'grey.50' }}>
                    <TableCell><strong>{day}</strong></TableCell>
                    <TableCell>{entry?.startTime || '—'}</TableCell>
                    <TableCell>{entry?.endTime || '—'}</TableCell>
                    <TableCell>{entry?.location || '—'}</TableCell>
                    <TableCell>{entry?.duties || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* LEAVE MANAGEMENT */}
      <TabPanel value={tab} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>{t('portal.leaveManagement')}</Typography>
          <Button variant="contained" sx={S.BTN_PRIMARY} color="warning" startIcon={<LeaveIcon />} onClick={() => setLeaveDialogOpen(true)}>
            {t('portal.requestLeave')}
          </Button>
        </Box>
        {leaveBalance && (
          <Grid container spacing={2} mb={3}>
            {Object.entries(leaveBalance).map(([type, balance]: [string, any]) => (
              <Grid item xs={6} sm={3} key={type}>
                <Box sx={S.STAT_CARD(C.warning)}>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h5" fontWeight={700}>{typeof balance === 'object' ? balance.remaining ?? balance.total ?? '—' : balance}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{type.replace(/_/g, ' ')}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
        <Typography variant="subtitle1" fontWeight={600} mb={1}>{t('portal.leaveHistory')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('portal.leaveType')}</TableCell><TableCell>{t('common.startDate')}</TableCell><TableCell>{t('common.endDate')}</TableCell>
              <TableCell>{t('common.status')}</TableCell><TableCell>{t('portal.appliedOn')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {leaveHistory.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('portal.noLeaveRecords')}</Typography></TableCell></TableRow>
              ) : leaveHistory.map((leave: any, idx: number) => (
                <TableRow key={leave.id || idx} hover>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{leave.leaveType || leave.type || '—'}</TableCell>
                  <TableCell>{leave.startDate ? new Date(leave.startDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{leave.endDate ? new Date(leave.endDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <Chip label={leave.status || 'pending'} size="small"
                      color={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'error' : 'warning'} />
                  </TableCell>
                  <TableCell>{leave.createdAt || leave.appliedOn ? new Date(leave.createdAt || leave.appliedOn).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog open={leaveDialogOpen} onClose={() => setLeaveDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t('portal.requestLeave')}</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel>{t('portal.leaveType')}</InputLabel>
              <Select value={leaveForm.leaveType} label={t('portal.leaveType')} onChange={(e) => setLeaveForm(prev => ({ ...prev, leaveType: e.target.value }))}>
                <MenuItem value="casual">{t('portal.casual')}</MenuItem>
                <MenuItem value="sick">{t('portal.sick')}</MenuItem>
                <MenuItem value="personal">{t('portal.personal')}</MenuItem>
                <MenuItem value="other">{t('portal.other')}</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label={t('common.startDate')} type="date" InputLabelProps={{ shrink: true }} value={leaveForm.startDate} onChange={(e) => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label={t('common.endDate')} type="date" InputLabelProps={{ shrink: true }} value={leaveForm.endDate} onChange={(e) => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label={t('portal.reason')} multiline rows={3} value={leaveForm.reason} onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLeaveDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button variant="contained" sx={S.BTN_PRIMARY} color="warning" onClick={handleLeaveSubmit} disabled={leaveSubmitting || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason}>
              {leaveSubmitting ? t('portal.submitting') : t('portal.submitLeave')}
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      {/* PROFILE & LINKS */}
      <TabPanel value={tab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>{t('portal.myProfile')}</Typography>
                  <Chip label={profile?.role || t('portal.nonTeachingStaff')} color="warning" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>{t('common.name')}:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.username')}:</strong> {profile?.username ?? user?.username}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.email')}:</strong> {profile?.email ?? user?.email ?? '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.phone')}:</strong> {profile?.phoneNumber || '—'}</Typography>
                <Box mt={2}>
                  <Button sx={S.BTN_OUTLINE} size="small" onClick={() => navigate('/communication/messages')}>{t('portal.contactAdmin')}</Button>
                </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>{t('portal.quickLinks')}</Typography>
                <Divider sx={{ mb: 1 }} />
                <List dense>
                  {[
                    { label: t('communication.messages'), path: '/communication/messages', icon: <MessageIcon color="warning" /> },
                    { label: t('communication.announcements'), path: '/communication/announcements', icon: <AnnouncementIcon color="warning" /> },
                    { label: t('menu.calendar'), path: '/calendar', icon: <CalendarIcon color="warning" /> },
                    { label: t('menu.documents'), path: '/documents', icon: <DocIcon color="warning" /> },
                  ].map(l => (
                    <ListItem key={l.path} button onClick={() => navigate(l.path)}>
                      <ListItemIcon>{l.icon}</ListItemIcon>
                      <ListItemText primary={l.label} />
                    </ListItem>
                  ))}
                </List>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default NonTeachingStaffPortal;

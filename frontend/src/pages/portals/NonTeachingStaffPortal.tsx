import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select,
  MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField,
} from '@mui/material';
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
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';

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
  const navigate = useNavigate();

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
          <Typography variant="h4" fontWeight={700}>Staff Portal</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user?.firstName || user?.username} — Non-Teaching Staff
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Pending Tasks', value: pendingCount, icon: <PendingIcon />, color: 'text.secondary' },
          { label: 'In Progress', value: inProgressCount, icon: <InProgressIcon />, color: 'warning.main' },
          { label: 'Completed', value: completedCount, icon: <DoneIcon />, color: 'success.main' },
          { label: 'Total Tasks', value: tasks.length, icon: <TaskIcon />, color: 'primary.main' },
        ].map(stat => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ color: stat.color, fontSize: 32 }}>{stat.icon}</Box>
                <Typography variant="h4" fontWeight={700}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<TaskIcon />} iconPosition="start" label="My Tasks" />
        <Tab icon={<ScheduleIcon />} iconPosition="start" label="My Schedule" />
        <Tab icon={<LeaveIcon />} iconPosition="start" label="Leave Management" />
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile & Links" />
      </Tabs>

      {/* TASKS */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>Assigned Tasks</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Status</TableCell><TableCell>Task</TableCell><TableCell>Description</TableCell>
              <TableCell>Priority</TableCell><TableCell>Due Date</TableCell><TableCell>Update Status</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No tasks assigned yet.</Typography></TableCell></TableRow>
              ) : tasks.map(t => (
                <TableRow key={t.id} hover>
                  <TableCell>{statusIcon(t.status)}</TableCell>
                  <TableCell><strong>{t.title}</strong></TableCell>
                  <TableCell sx={{ maxWidth: 200 }}><Typography variant="body2" noWrap>{t.description || '—'}</Typography></TableCell>
                  <TableCell>
                    <Chip label={t.priority} size="small"
                      color={t.priority === 'high' ? 'error' : t.priority === 'medium' ? 'warning' : 'default'} />
                  </TableCell>
                  <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <Select value={t.status} onChange={e => updateTaskStatus(t.id, e.target.value)} disabled={t.status === 'completed'}>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
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
        <Typography variant="h6" fontWeight={600} mb={2}>Weekly Schedule</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Day</TableCell><TableCell>Start</TableCell><TableCell>End</TableCell>
              <TableCell>Location</TableCell><TableCell>Duties</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {schedule.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No schedule set. Contact your supervisor.</Typography></TableCell></TableRow>
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
          <Typography variant="h6" fontWeight={600}>Leave Management</Typography>
          <Button variant="contained" color="warning" startIcon={<LeaveIcon />} onClick={() => setLeaveDialogOpen(true)}>
            Request Leave
          </Button>
        </Box>
        {leaveBalance && (
          <Grid container spacing={2} mb={3}>
            {Object.entries(leaveBalance).map(([type, balance]: [string, any]) => (
              <Grid item xs={6} sm={3} key={type}>
                <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h5" fontWeight={700}>{typeof balance === 'object' ? balance.remaining ?? balance.total ?? '—' : balance}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{type.replace(/_/g, ' ')}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        <Typography variant="subtitle1" fontWeight={600} mb={1}>Leave History</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Type</TableCell><TableCell>Start Date</TableCell><TableCell>End Date</TableCell>
              <TableCell>Status</TableCell><TableCell>Applied On</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {leaveHistory.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No leave records found.</Typography></TableCell></TableRow>
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
          <DialogTitle>Request Leave</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
              <InputLabel>Leave Type</InputLabel>
              <Select value={leaveForm.leaveType} label="Leave Type" onChange={(e) => setLeaveForm(prev => ({ ...prev, leaveType: e.target.value }))}>
                <MenuItem value="casual">Casual</MenuItem>
                <MenuItem value="sick">Sick</MenuItem>
                <MenuItem value="personal">Personal</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={leaveForm.startDate} onChange={(e) => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="End Date" type="date" InputLabelProps={{ shrink: true }} value={leaveForm.endDate} onChange={(e) => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))} sx={{ mb: 2 }} />
            <TextField fullWidth label="Reason" multiline rows={3} value={leaveForm.reason} onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="warning" onClick={handleLeaveSubmit} disabled={leaveSubmitting || !leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason}>
              {leaveSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </TabPanel>

      {/* PROFILE & LINKS */}
      <TabPanel value={tab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>My Profile</Typography>
                  <Chip label={profile?.role || 'Non-Teaching Staff'} color="warning" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>Name:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>Username:</strong> {profile?.username ?? user?.username}</Typography>
                <Typography variant="body2" mt={1}><strong>Email:</strong> {profile?.email ?? user?.email ?? '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>Phone:</strong> {profile?.phoneNumber || '—'}</Typography>
                <Box mt={2}>
                  <Button variant="outlined" color="warning" size="small" onClick={() => navigate('/communication/messages')}>Contact Admin</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Quick Links</Typography>
                <Divider sx={{ mb: 1 }} />
                <List dense>
                  {[
                    { label: 'Messages', path: '/communication/messages', icon: <MessageIcon color="warning" /> },
                    { label: 'Announcements', path: '/communication/announcements', icon: <AnnouncementIcon color="warning" /> },
                    { label: 'Calendar', path: '/calendar', icon: <CalendarIcon color="warning" /> },
                    { label: 'Documents', path: '/documents', icon: <DocIcon color="warning" /> },
                  ].map(l => (
                    <ListItem key={l.path} button onClick={() => navigate(l.path)}>
                      <ListItemIcon>{l.icon}</ListItemIcon>
                      <ListItemText primary={l.label} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default NonTeachingStaffPortal;

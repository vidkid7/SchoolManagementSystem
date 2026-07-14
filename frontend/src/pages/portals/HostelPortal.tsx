import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip, useTheme,
} from '@mui/material';
import { C, useAdminStyles } from '../../theme/designTokens';
import {
  Hotel as HostelIcon, People as PeopleIcon, Message as MessageIcon,
  CalendarMonth as CalendarIcon, Description as DocIcon,
  Notifications as AnnouncementIcon, Person as PersonIcon,
  CheckCircle as ActiveIcon, MeetingRoom as RoomIcon, Gavel as DisciplineIcon,
  EmojiPeople as VisitorIcon, BeachAccess as LeaveIcon, Warning as IncidentIcon,
  Add as AddIcon, Edit as EditIcon, CheckCircleOutline, Cancel as CancelIcon,
  Logout as CheckoutIcon, Restaurant as MessIcon, Inventory as InventoryIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';
import { useTranslation } from 'react-i18next';

interface DashboardData { summary: { totalStudents: number; activeStudents: number; role: string }; quickLinks: Array<{ label: string; path: string }>; }

interface ProfileData {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  status: string;
}

interface Resident {
  id?: number;
  studentId?: number;
  firstNameEn?: string;
  lastNameEn?: string;
  studentCode?: string;
}

interface Room { id: number; roomNumber: string; floor: number; type: string; capacity: number; occupied: number; status: string; description: string; }
interface DisciplineRecord { id: number; studentId: number; violation: string; description: string; action: string; severity: string; date: string; status: string; }
interface Visitor { id: number; visitorName: string; studentId: number; relation: string; phone: string; purpose: string; visitDate: string; checkInTime: string; checkOutTime: string | null; status: string; }
interface LeaveRequest { id: number; studentId: number; reason: string; fromDate: string; toDate: string; status: string; }
interface Incident { id: number; title: string; description: string; severity: string; date: string; status: string; actionTaken: string; }
interface MessMenu { id: number; day: string; mealType: string; items: string[]; specialNotes: string; }
interface InventoryItem { id: number; name: string; category: string; quantity: number; unit: string; minStock: number; location: string; }

const authHdr = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>;
}

const HostelPortal: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [discipline, setDiscipline] = useState<DisciplineRecord[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [messMenus, setMessMenus] = useState<MessMenu[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roomDialog, setRoomDialog] = useState(false);
  const [disciplineDialog, setDisciplineDialog] = useState(false);
  const [visitorDialog, setVisitorDialog] = useState(false);
  const [incidentDialog, setIncidentDialog] = useState(false);
  const [messDialog, setMessDialog] = useState(false);
  const [inventoryDialog, setInventoryDialog] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [editMenu, setEditMenu] = useState<MessMenu | null>(null);
  const [editInventory, setEditInventory] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<any>({});

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [dashRes, profileRes, residentsRes, roomsRes, disciplineRes, visitorsRes, leavesRes, incidentsRes, messRes, inventoryRes] = await Promise.all([
        apiClient.get('/api/v1/hostel/dashboard', authHdr(accessToken)),
        apiClient.get('/api/v1/hostel/profile', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
        apiClient.get('/api/v1/hostel/residents', { ...authHdr(accessToken), params: { limit: 50 } }).catch(() => ({ data: { data: { students: [] } } })),
        apiClient.get('/api/v1/hostel/rooms', authHdr(accessToken)).catch(() => ({ data: { data: { rooms: [] } } })),
        apiClient.get('/api/v1/hostel/discipline', authHdr(accessToken)).catch(() => ({ data: { data: { records: [] } } })),
        apiClient.get('/api/v1/hostel/visitors', authHdr(accessToken)).catch(() => ({ data: { data: { visitors: [] } } })),
        apiClient.get('/api/v1/hostel/leaves', authHdr(accessToken)).catch(() => ({ data: { data: { leaves: [] } } })),
        apiClient.get('/api/v1/hostel/incidents', authHdr(accessToken)).catch(() => ({ data: { data: { incidents: [] } } })),
        apiClient.get('/api/v1/hostel/mess-menu', authHdr(accessToken)).catch(() => ({ data: { data: { menus: [] } } })),
        apiClient.get('/api/v1/hostel/inventory', authHdr(accessToken)).catch(() => ({ data: { data: { items: [] } } })),
      ]);
      setData(dashRes.data.data);
      setProfile(profileRes.data?.data ?? null);
      const resList = residentsRes.data?.data;
      setResidents(Array.isArray(resList) ? resList : resList?.students ?? []);
      setRooms(roomsRes.data?.data?.rooms ?? []);
      setDiscipline(disciplineRes.data?.data?.records ?? []);
      setVisitors(visitorsRes.data?.data?.visitors ?? []);
      setLeaves(leavesRes.data?.data?.leaves ?? []);
      setIncidents(incidentsRes.data?.data?.incidents ?? []);
      setMessMenus(messRes.data?.data?.menus ?? []);
      setInventory(inventoryRes.data?.data?.items ?? []);
    } catch {
      setError(t('portal.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveRoom = async () => {
    try {
      if (editRoom) {
        await apiClient.put(`/api/v1/hostel/rooms/${editRoom.id}`, formData, authHdr(accessToken!));
      } else {
        await apiClient.post('/api/v1/hostel/rooms', formData, authHdr(accessToken!));
      }
      setRoomDialog(false); setEditRoom(null); setFormData({});
      loadData();
    } catch { setError(t('portal.failedToLoadData')); }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!window.confirm(t('portal.confirmDeleteRoom'))) return;
    try {
      await apiClient.delete(`/api/v1/hostel/rooms/${id}`, authHdr(accessToken!));
      loadData();
    } catch { setError(t('portal.failedToLoadData')); }
  };

  const handleCreateDiscipline = async () => {
    try {
      await apiClient.post('/api/v1/hostel/discipline', formData, authHdr(accessToken!));
      setDisciplineDialog(false); setFormData({}); loadData();
    } catch { setError(t('portal.failedToLoadData')); }
  };

  const handleRegisterVisitor = async () => {
    try {
      await apiClient.post('/api/v1/hostel/visitors', formData, authHdr(accessToken!));
      setVisitorDialog(false); setFormData({}); loadData();
    } catch { setError(t('portal.failedToLoadData')); }
  };

  const handleCheckoutVisitor = async (id: number) => {
    try {
      await apiClient.put(`/api/v1/hostel/visitors/${id}/checkout`, {}, authHdr(accessToken!));
      loadData();
    } catch { setError(t('portal.failedToLoadData')); }
  };

  const handleProcessLeave = async (id: number, action: 'approve' | 'reject') => {
    try {
      await apiClient.put(`/api/v1/hostel/leaves/${id}/process`, { action }, authHdr(accessToken!));
      loadData();
    } catch { setError(t('portal.failedToLoadData')); }
  };

  const handleCreateIncident = async () => {
    try {
      await apiClient.post('/api/v1/hostel/incidents', formData, authHdr(accessToken!));
      setIncidentDialog(false); setFormData({}); loadData();
    } catch { setError(t('portal.failedToLoadData')); }
  };

  const handleSaveMessMenu = async () => {
    try {
      const payload = { ...formData, items: typeof formData.items === 'string' ? formData.items.split(',').map((s: string) => s.trim()) : formData.items };
      if (editMenu) {
        await apiClient.put(`/api/v1/hostel/mess-menu/${editMenu.id}`, payload, authHdr(accessToken!));
      } else {
        await apiClient.post('/api/v1/hostel/mess-menu', payload, authHdr(accessToken!));
      }
      setMessDialog(false); setEditMenu(null); setFormData({}); loadData();
    } catch { setError(t('portal.failedToLoadData')); }
  };

  const handleDeleteMessMenu = async (id: number) => {
    if (!window.confirm(t('portal.confirmDeleteMenu'))) return;
    try {
      await apiClient.delete(`/api/v1/hostel/mess-menu/${id}`, authHdr(accessToken!));
      loadData();
    } catch { setError(t('portal.failedToLoadData')); }
  };

  const handleSaveInventory = async () => {
    try {
      if (editInventory) {
        await apiClient.put(`/api/v1/hostel/inventory/${editInventory.id}`, formData, authHdr(accessToken!));
      } else {
        await apiClient.post('/api/v1/hostel/inventory', formData, authHdr(accessToken!));
      }
      setInventoryDialog(false); setEditInventory(null); setFormData({}); loadData();
    } catch { setError(t('portal.failedToLoadData')); }
  };

  const handleDeleteInventory = async (id: number) => {
    if (!window.confirm(t('portal.confirmDeleteItem'))) return;
    try {
      await apiClient.delete(`/api/v1/hostel/inventory/${id}`, authHdr(accessToken!));
      loadData();
    } catch { setError(t('portal.failedToLoadData')); }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, mt: { xs: 7, sm: 8 } }}>
      {/* Header */}
      <Paper sx={S.PAGE_HEADER}>
        <Box display="flex" alignItems="center" gap={2}>
          <HostelIcon sx={{ fontSize: 32, color: C.purple }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{t('portal.hostelManagement')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('portal.welcome')}, {user?.firstName || user?.username} — {t('portal.hostelWarden')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: t('dashboard.totalStudents'), value: data?.summary?.totalStudents ?? '--', icon: <PeopleIcon />, color: C.purple },
          { label: t('portal.activeStudents'), value: data?.summary?.activeStudents ?? '--', icon: <ActiveIcon />, color: C.success },
          { label: t('hostel.rooms'), value: rooms.length, icon: <RoomIcon />, color: C.primary },
          { label: t('portal.pendingLeaves'), value: leaves.filter(l => l.status === 'pending').length, icon: <LeaveIcon />, color: C.warning },
        ].map((stat) => (
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
        <Tab icon={<RoomIcon />} iconPosition="start" label={t('hostel.rooms')} />
        <Tab icon={<PeopleIcon />} iconPosition="start" label={t('hostel.residents')} />
        <Tab icon={<DisciplineIcon />} iconPosition="start" label={t('hostel.discipline')} />
        <Tab icon={<VisitorIcon />} iconPosition="start" label={t('hostel.visitors')} />
        <Tab icon={<LeaveIcon />} iconPosition="start" label={t('hostel.leaveRequests')} />
        <Tab icon={<IncidentIcon />} iconPosition="start" label={t('hostel.incidents')} />
        <Tab icon={<MessIcon />} iconPosition="start" label={t('hostel.messManagement')} />
        <Tab icon={<InventoryIcon />} iconPosition="start" label={t('hostel.inventory')} />
        <Tab icon={<PersonIcon />} iconPosition="start" label={t('portal.profileAndLinks')} />
      </Tabs>

      {/* ROOMS */}
      <TabPanel value={tab} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>{t('hostel.roomManagement')}</Typography>
          <Button sx={S.BTN_PRIMARY} startIcon={<AddIcon />} onClick={() => { setEditRoom(null); setFormData({}); setRoomDialog(true); }}>{t('hostel.addRoom')}</Button>
        </Box>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('hostel.roomNo')}</TableCell><TableCell>{t('hostel.floor')}</TableCell><TableCell>{t('hostel.type') || 'Type'}</TableCell>
              <TableCell>{t('hostel.capacity')}</TableCell><TableCell>{t('hostel.occupied')}</TableCell><TableCell>{t('common.status')}</TableCell><TableCell>{t('common.actions')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {rooms.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('hostel.noRooms')}</Typography></TableCell></TableRow>
              ) : rooms.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell><strong>{r.roomNumber}</strong></TableCell>
                  <TableCell>{r.floor}</TableCell>
                  <TableCell><Chip label={r.type} size="small" /></TableCell>
                  <TableCell>{r.capacity}</TableCell>
                  <TableCell>{r.occupied}</TableCell>
                  <TableCell><Chip label={r.status} size="small" color={r.status === 'available' ? 'success' : r.status === 'occupied' ? 'error' : 'default'} /></TableCell>
                  <TableCell>
                    <Tooltip title={t('common.edit')}><IconButton size="small" onClick={() => { setEditRoom(r); setFormData({ ...r }); setRoomDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title={t('common.delete')}><IconButton size="small" color="error" onClick={() => handleDeleteRoom(r.id)}><CancelIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* RESIDENTS */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('hostel.residents')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('hostel.studentCode')}</TableCell><TableCell>{t('common.name')}</TableCell><TableCell>{t('common.actions')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {residents.length === 0 ? (
                <TableRow><TableCell colSpan={3} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('hostel.noResidents')}</Typography></TableCell></TableRow>
              ) : residents.map(r => (
                <TableRow key={r.studentId ?? r.id} hover>
                  <TableCell>{r.studentCode ?? '—'}</TableCell>
                  <TableCell>{`${r.firstNameEn ?? ''} ${r.lastNameEn ?? ''}`.trim() || '—'}</TableCell>
                  <TableCell><Button size="small" onClick={() => navigate(`/students/${r.studentId ?? r.id}`)}>{t('portal.viewProfileBtn')}</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* DISCIPLINE */}
      <TabPanel value={tab} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>{t('hostel.disciplineRecords')}</Typography>
          <Button variant="contained" sx={S.BTN_PRIMARY} color="warning" startIcon={<AddIcon />} onClick={() => { setFormData({}); setDisciplineDialog(true); }}>{t('hostel.recordViolation')}</Button>
        </Box>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('hostel.studentId')}</TableCell><TableCell>{t('hostel.violation')}</TableCell><TableCell>{t('hostel.severity')}</TableCell>
              <TableCell>{t('hostel.actionTaken')}</TableCell><TableCell>{t('common.date')}</TableCell><TableCell>{t('common.status')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {discipline.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('hostel.noDiscipline')}</Typography></TableCell></TableRow>
              ) : discipline.map(d => (
                <TableRow key={d.id} hover>
                  <TableCell>{d.studentId}</TableCell>
                  <TableCell>{d.violation}</TableCell>
                  <TableCell><Chip label={d.severity} size="small" color={d.severity === 'major' ? 'error' : d.severity === 'moderate' ? 'warning' : 'default'} /></TableCell>
                  <TableCell>{d.action}</TableCell>
                  <TableCell>{new Date(d.date).toLocaleDateString()}</TableCell>
                  <TableCell><Chip label={d.status} size="small" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* VISITORS */}
      <TabPanel value={tab} index={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>{t('hostel.visitorLog')}</Typography>
          <Button variant="contained" sx={S.BTN_PRIMARY} color="info" startIcon={<AddIcon />} onClick={() => { setFormData({}); setVisitorDialog(true); }}>{t('hostel.registerVisitor')}</Button>
        </Box>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('hostel.visitorName')}</TableCell><TableCell>{t('hostel.studentId')}</TableCell><TableCell>{t('hostel.relation')}</TableCell>
              <TableCell>{t('hostel.purpose')}</TableCell><TableCell>{t('hostel.checkIn')}</TableCell><TableCell>{t('common.status')}</TableCell><TableCell>{t('common.actions')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {visitors.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('hostel.noVisitors')}</Typography></TableCell></TableRow>
              ) : visitors.map(v => (
                <TableRow key={v.id} hover>
                  <TableCell>{v.visitorName}</TableCell>
                  <TableCell>{v.studentId}</TableCell>
                  <TableCell>{v.relation}</TableCell>
                  <TableCell>{v.purpose}</TableCell>
                  <TableCell>{new Date(v.checkInTime).toLocaleTimeString()}</TableCell>
                  <TableCell><Chip label={v.status} size="small" color={v.status === 'checked-in' ? 'success' : 'default'} /></TableCell>
                  <TableCell>
                    {v.status === 'checked-in' && (
                      <Tooltip title={t('portal.checkOut')}><IconButton size="small" color="warning" onClick={() => handleCheckoutVisitor(v.id)}><CheckoutIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* LEAVE REQUESTS */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('hostel.leaveRequests')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('hostel.studentId')}</TableCell><TableCell>{t('common.from')}</TableCell><TableCell>{t('common.to')}</TableCell>
              <TableCell>{t('portal.reason')}</TableCell><TableCell>{t('common.status')}</TableCell><TableCell>{t('common.actions')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('hostel.noLeaves')}</Typography></TableCell></TableRow>
              ) : leaves.map(l => (
                <TableRow key={l.id} hover>
                  <TableCell>{l.studentId}</TableCell>
                  <TableCell>{l.fromDate ? new Date(l.fromDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{l.toDate ? new Date(l.toDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{l.reason}</TableCell>
                  <TableCell><Chip label={l.status} size="small" color={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'error' : 'warning'} /></TableCell>
                  <TableCell>
                    {l.status === 'pending' && (
                      <>
                        <Tooltip title={t('portal.approve')}><IconButton size="small" color="success" onClick={() => handleProcessLeave(l.id, 'approve')}><CheckCircleOutline fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={t('portal.reject')}><IconButton size="small" color="error" onClick={() => handleProcessLeave(l.id, 'reject')}><CancelIcon fontSize="small" /></IconButton></Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* INCIDENTS */}
      <TabPanel value={tab} index={5}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>{t('hostel.incidentReports')}</Typography>
          <Button variant="contained" sx={S.BTN_PRIMARY} color="error" startIcon={<AddIcon />} onClick={() => { setFormData({}); setIncidentDialog(true); }}>{t('hostel.recordIncident')}</Button>
        </Box>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('common.title')}</TableCell><TableCell>{t('hostel.severity')}</TableCell><TableCell>{t('common.date')}</TableCell>
              <TableCell>{t('hostel.actionTaken')}</TableCell><TableCell>{t('common.status')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {incidents.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('hostel.noIncidents')}</Typography></TableCell></TableRow>
              ) : incidents.map(i => (
                <TableRow key={i.id} hover>
                  <TableCell>{i.title}</TableCell>
                  <TableCell><Chip label={i.severity} size="small" color={i.severity === 'high' ? 'error' : i.severity === 'medium' ? 'warning' : 'default'} /></TableCell>
                  <TableCell>{new Date(i.date).toLocaleDateString()}</TableCell>
                  <TableCell>{i.actionTaken || '—'}</TableCell>
                  <TableCell><Chip label={i.status} size="small" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* MESS MANAGEMENT */}
      <TabPanel value={tab} index={6}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>{t('hostel.messMenu')}</Typography>
          <Button sx={S.BTN_PRIMARY} startIcon={<AddIcon />} onClick={() => { setEditMenu(null); setFormData({}); setMessDialog(true); }}>{t('hostel.createMenu')}</Button>
        </Box>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('hostel.day')}</TableCell><TableCell>{t('hostel.mealType')}</TableCell><TableCell>{t('hostel.items')}</TableCell>
              <TableCell>{t('hostel.specialNotes')}</TableCell><TableCell>{t('common.actions')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {messMenus.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('hostel.noMessMenus')}</Typography></TableCell></TableRow>
              ) : messMenus.map(m => (
                <TableRow key={m.id} hover>
                  <TableCell><strong>{m.day}</strong></TableCell>
                  <TableCell><Chip label={m.mealType} size="small" color={m.mealType === 'breakfast' ? 'info' : m.mealType === 'lunch' ? 'success' : m.mealType === 'dinner' ? 'warning' : 'default'} /></TableCell>
                  <TableCell>{Array.isArray(m.items) ? m.items.join(', ') : m.items}</TableCell>
                  <TableCell>{m.specialNotes || '—'}</TableCell>
                  <TableCell>
                    <Tooltip title={t('common.edit')}><IconButton size="small" onClick={() => { setEditMenu(m); setFormData({ ...m, items: Array.isArray(m.items) ? m.items.join(', ') : m.items }); setMessDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title={t('common.delete')}><IconButton size="small" color="error" onClick={() => handleDeleteMessMenu(m.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* INVENTORY */}
      <TabPanel value={tab} index={7}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>{t('hostel.inventoryManagement')}</Typography>
          <Button sx={S.BTN_PRIMARY} startIcon={<AddIcon />} onClick={() => { setEditInventory(null); setFormData({}); setInventoryDialog(true); }}>{t('hostel.addItem')}</Button>
        </Box>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: S.TH_BG }}>
              <TableCell>{t('common.name')}</TableCell><TableCell>{t('common.category')}</TableCell><TableCell>{t('hostel.quantity')}</TableCell>
              <TableCell>{t('hostel.unit')}</TableCell><TableCell>{t('hostel.minStock')}</TableCell><TableCell>{t('hostel.location')}</TableCell><TableCell>{t('common.actions')}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {inventory.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('hostel.noInventory')}</Typography></TableCell></TableRow>
              ) : inventory.map(i => (
                <TableRow key={i.id} hover>
                  <TableCell><strong>{i.name}</strong></TableCell>
                  <TableCell><Chip label={i.category} size="small" /></TableCell>
                  <TableCell sx={{ color: i.quantity <= i.minStock ? 'error.main' : 'inherit', fontWeight: i.quantity <= i.minStock ? 700 : 400 }}>{i.quantity}</TableCell>
                  <TableCell>{i.unit}</TableCell>
                  <TableCell>{i.minStock}</TableCell>
                  <TableCell>{i.location || '—'}</TableCell>
                  <TableCell>
                    <Tooltip title={t('common.edit')}><IconButton size="small" onClick={() => { setEditInventory(i); setFormData({ ...i }); setInventoryDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title={t('common.delete')}><IconButton size="small" color="error" onClick={() => handleDeleteInventory(i.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* PROFILE & LINKS */}
      <TabPanel value={tab} index={8}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>{t('portal.myProfile')}</Typography>
                  <Chip label={profile?.role || t('portal.hostelWarden')} color="secondary" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>{t('common.name')}:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.email')}:</strong> {profile?.email || user?.email || '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.phone')}:</strong> {profile?.phoneNumber || '—'}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="body2" component="span"><strong>{t('common.status')}:</strong></Typography>
                  <Chip label={profile?.status || 'active'} size="small" color="success" />
                </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>{t('portal.quickLinks')}</Typography>
                <Divider sx={{ mb: 1 }} />
                <List dense>
                  {[
                    { label: t('students.studentList'), path: '/students', icon: <PeopleIcon color="secondary" /> },
                    { label: t('communication.messages'), path: '/communication/messages', icon: <MessageIcon color="secondary" /> },
                    { label: t('communication.announcements'), path: '/communication/announcements', icon: <AnnouncementIcon color="secondary" /> },
                    { label: t('menu.calendar'), path: '/calendar', icon: <CalendarIcon color="secondary" /> },
                    { label: t('menu.documents'), path: '/documents', icon: <DocIcon color="secondary" /> },
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

      {/* Room Dialog */}
      <Dialog open={roomDialog} onClose={() => { setRoomDialog(false); setEditRoom(null); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editRoom ? t('hostel.editRoom') : t('hostel.addNewRoom')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label={t('hostel.roomNumber')} value={formData.roomNumber ?? ''} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} fullWidth required />
          <TextField label={t('hostel.floor')} type="number" value={formData.floor ?? 1} onChange={e => setFormData({ ...formData, floor: Number(e.target.value) })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>{t('common.type')}</InputLabel>
            <Select label={t('common.type')} value={formData.type ?? ''}onChange={e => setFormData({ ...formData, type: e.target.value })}>
              {[
                { value: 'single', label: t('hostel.single', 'Single') },
                { value: 'double', label: t('hostel.double', 'Double') },
                { value: 'dormitory', label: t('hostel.dormitory', 'Dormitory') },
              ].map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label={t('hostel.capacity')} type="number" value={formData.capacity ?? 2} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} fullWidth />
          <TextField label={t('hostel.description')} value={formData.description ?? ''} onChange={e => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRoomDialog(false);setEditRoom(null); setFormData({}); }}>{t('common.cancel')}</Button>
          <Button sx={S.BTN_PRIMARY} onClick={handleSaveRoom}>{editRoom ? t('common.update') : t('common.create')}</Button>
        </DialogActions>
      </Dialog>

      {/* Discipline Dialog */}
      <Dialog open={disciplineDialog} onClose={() => { setDisciplineDialog(false); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{t('hostel.recordDisciplineViolation')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label={t('hostel.studentId')} type="number" value={formData.studentId ?? ''} onChange={e => setFormData({ ...formData, studentId: Number(e.target.value) })} fullWidth required />
          <TextField label={t('hostel.violation')}value={formData.violation ?? ''} onChange={e => setFormData({ ...formData, violation: e.target.value })} fullWidth required />
          <TextField label={t('hostel.description')} value={formData.description ?? ''} onChange={e => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={2} />
          <FormControl fullWidth>
            <InputLabel>{t('hostel.severity')}</InputLabel>
            <Select label={t('hostel.severity')} value={formData.severity ?? 'minor'} onChange={e => setFormData({ ...formData, severity: e.target.value })}>
              {['minor', 'moderate', 'major'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label={t('hostel.actionTaken')} value={formData.action ?? ''} onChange={e => setFormData({ ...formData, action: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDisciplineDialog(false); setFormData({}); }}>{t('common.cancel')}</Button>
          <Button variant="contained" sx={S.BTN_PRIMARY} color="warning" onClick={handleCreateDiscipline}>{t('common.record')}</Button>
        </DialogActions>
      </Dialog>

      {/* Visitor Dialog */}
      <Dialog open={visitorDialog} onClose={() => { setVisitorDialog(false); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{t('hostel.registerVisitor')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label={t('hostel.visitorName')} value={formData.visitorName ?? ''} onChange={e => setFormData({ ...formData, visitorName: e.target.value })} fullWidth required />
          <TextField label={t('hostel.studentId')} type="number" value={formData.studentId ?? ''} onChange={e => setFormData({ ...formData, studentId: Number(e.target.value) })} fullWidth required />
          <TextField label={t('hostel.relation')}value={formData.relation ?? ''} onChange={e => setFormData({ ...formData, relation: e.target.value })} fullWidth />
          <TextField label={t('common.phone')} value={formData.phone ?? ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} fullWidth />
          <TextField label={t('hostel.purpose')} value={formData.purpose ?? ''} onChange={e => setFormData({ ...formData, purpose: e.target.value })} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setVisitorDialog(false); setFormData({}); }}>{t('common.cancel')}</Button>
          <Button variant="contained" sx={S.BTN_PRIMARY} color="info" onClick={handleRegisterVisitor}>{t('common.register')}</Button>
        </DialogActions>
      </Dialog>

      {/* Incident Dialog */}
      <Dialog open={incidentDialog} onClose={() => { setIncidentDialog(false); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{t('hostel.recordIncident')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label={t('common.title')} value={formData.title ?? ''} onChange={e => setFormData({ ...formData, title: e.target.value })} fullWidth required />
          <TextField label={t('hostel.description')} value={formData.description ?? ''} onChange={e => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={3} required />
          <FormControl fullWidth>
            <InputLabel>{t('hostel.severity')}</InputLabel>
            <Select label={t('hostel.severity')} value={formData.severity ?? 'low'} onChange={e => setFormData({ ...formData, severity: e.target.value })}>
              {['low', 'medium', 'high'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label={t('hostel.actionTaken')} value={formData.actionTaken ?? ''} onChange={e => setFormData({ ...formData, actionTaken: e.target.value })} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setIncidentDialog(false); setFormData({}); }}>{t('common.cancel')}</Button>
          <Button variant="contained" sx={S.BTN_PRIMARY} color="error" onClick={handleCreateIncident}>{t('common.record')}</Button>
        </DialogActions>
      </Dialog>

      {/* Mess Menu Dialog */}
      <Dialog open={messDialog} onClose={() => { setMessDialog(false); setEditMenu(null); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editMenu ? t('hostel.editMenu') : t('hostel.createMessMenu')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>{t('portal.day')}</InputLabel>
            <Select label={t('portal.day')}value={formData.day ?? ''} onChange={e => setFormData({ ...formData, day: e.target.value })}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>{t('hostel.mealType')}</InputLabel>
            <Select label={t('hostel.mealType')}value={formData.mealType ?? ''} onChange={e => setFormData({ ...formData, mealType: e.target.value })}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label={t('hostel.itemsCommaSeparated')} value={formData.items ?? ''} onChange={e => setFormData({ ...formData, items: e.target.value })} fullWidth required helperText="e.g. Rice, Dal, Chapati, Salad" />
          <TextField label={t('hostel.specialNotes')} value={formData.specialNotes ?? ''} onChange={e => setFormData({ ...formData, specialNotes: e.target.value })} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setMessDialog(false); setEditMenu(null); setFormData({}); }}>{t('common.cancel')}</Button>
          <Button sx={S.BTN_PRIMARY} onClick={handleSaveMessMenu}>{editMenu ? t('common.update') : t('common.create')}</Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Dialog */}
      <Dialog open={inventoryDialog} onClose={() => { setInventoryDialog(false); setEditInventory(null); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editInventory ? t('hostel.editInventoryItem') : t('hostel.addInventoryItem')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label={t('hostel.itemName')} value={formData.name ?? ''} onChange={e => setFormData({ ...formData, name: e.target.value })} fullWidth required />
          <FormControl fullWidth>
            <InputLabel>{t('hostel.category')}</InputLabel>
            <Select label={t('hostel.category')}value={formData.category ?? ''} onChange={e => setFormData({ ...formData, category: e.target.value })}>
              {['Kitchen', 'Cleaning', 'Furniture', 'Bedding', 'Electrical', 'Stationery', 'Other'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label={t('hostel.quantity')} type="number" value={formData.quantity ?? 0} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} fullWidth />
          <TextField label={t('hostel.unit')} value={formData.unit ?? 'pcs'} onChange={e => setFormData({ ...formData, unit: e.target.value })} fullWidth />
          <TextField label={t('hostel.minStock')} type="number" value={formData.minStock ?? 0} onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })} fullWidth />
          <TextField label={t('hostel.location')} value={formData.location ?? ''} onChange={e => setFormData({ ...formData, location: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setInventoryDialog(false); setEditInventory(null); setFormData({}); }}>{t('common.cancel')}</Button>
          <Button sx={S.BTN_PRIMARY} onClick={handleSaveInventory}>{editInventory ? t('common.update') : t('common.create')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HostelPortal;


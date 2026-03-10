import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip,
} from '@mui/material';
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
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';

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
  const navigate = useNavigate();

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
      setError('Failed to load hostel data');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

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
    } catch { setError('Failed to save room'); }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await apiClient.delete(`/api/v1/hostel/rooms/${id}`, authHdr(accessToken!));
      loadData();
    } catch { setError('Failed to delete room'); }
  };

  const handleCreateDiscipline = async () => {
    try {
      await apiClient.post('/api/v1/hostel/discipline', formData, authHdr(accessToken!));
      setDisciplineDialog(false); setFormData({}); loadData();
    } catch { setError('Failed to record discipline'); }
  };

  const handleRegisterVisitor = async () => {
    try {
      await apiClient.post('/api/v1/hostel/visitors', formData, authHdr(accessToken!));
      setVisitorDialog(false); setFormData({}); loadData();
    } catch { setError('Failed to register visitor'); }
  };

  const handleCheckoutVisitor = async (id: number) => {
    try {
      await apiClient.put(`/api/v1/hostel/visitors/${id}/checkout`, {}, authHdr(accessToken!));
      loadData();
    } catch { setError('Failed to checkout visitor'); }
  };

  const handleProcessLeave = async (id: number, action: 'approve' | 'reject') => {
    try {
      await apiClient.put(`/api/v1/hostel/leaves/${id}/process`, { action }, authHdr(accessToken!));
      loadData();
    } catch { setError('Failed to process leave'); }
  };

  const handleCreateIncident = async () => {
    try {
      await apiClient.post('/api/v1/hostel/incidents', formData, authHdr(accessToken!));
      setIncidentDialog(false); setFormData({}); loadData();
    } catch { setError('Failed to record incident'); }
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
    } catch { setError('Failed to save menu'); }
  };

  const handleDeleteMessMenu = async (id: number) => {
    if (!window.confirm('Delete this menu?')) return;
    try {
      await apiClient.delete(`/api/v1/hostel/mess-menu/${id}`, authHdr(accessToken!));
      loadData();
    } catch { setError('Failed to delete menu'); }
  };

  const handleSaveInventory = async () => {
    try {
      if (editInventory) {
        await apiClient.put(`/api/v1/hostel/inventory/${editInventory.id}`, formData, authHdr(accessToken!));
      } else {
        await apiClient.post('/api/v1/hostel/inventory', formData, authHdr(accessToken!));
      }
      setInventoryDialog(false); setEditInventory(null); setFormData({}); loadData();
    } catch { setError('Failed to save inventory item'); }
  };

  const handleDeleteInventory = async (id: number) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await apiClient.delete(`/api/v1/hostel/inventory/${id}`, authHdr(accessToken!));
      loadData();
    } catch { setError('Failed to delete item'); }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
          <HostelIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>Hostel Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user?.firstName || user?.username} — Hostel Warden
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total Students', value: data?.summary.totalStudents ?? '--', icon: <PeopleIcon />, color: 'secondary.main' },
          { label: 'Active Students', value: data?.summary.activeStudents ?? '--', icon: <ActiveIcon />, color: 'success.main' },
          { label: 'Rooms', value: rooms.length, icon: <RoomIcon />, color: 'primary.main' },
          { label: 'Pending Leaves', value: leaves.filter(l => l.status === 'pending').length, icon: <LeaveIcon />, color: 'warning.main' },
        ].map((stat) => (
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
        <Tab icon={<RoomIcon />} iconPosition="start" label="Rooms" />
        <Tab icon={<PeopleIcon />} iconPosition="start" label="Residents" />
        <Tab icon={<DisciplineIcon />} iconPosition="start" label="Discipline" />
        <Tab icon={<VisitorIcon />} iconPosition="start" label="Visitors" />
        <Tab icon={<LeaveIcon />} iconPosition="start" label="Leave Requests" />
        <Tab icon={<IncidentIcon />} iconPosition="start" label="Incidents" />
        <Tab icon={<MessIcon />} iconPosition="start" label="Mess Management" />
        <Tab icon={<InventoryIcon />} iconPosition="start" label="Inventory" />
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile & Links" />
      </Tabs>

      {/* ROOMS */}
      <TabPanel value={tab} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Room Management</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditRoom(null); setFormData({}); setRoomDialog(true); }}>Add Room</Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Room No.</TableCell><TableCell>Floor</TableCell><TableCell>Type</TableCell>
              <TableCell>Capacity</TableCell><TableCell>Occupied</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {rooms.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No rooms added yet. Click "Add Room" to get started.</Typography></TableCell></TableRow>
              ) : rooms.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell><strong>{r.roomNumber}</strong></TableCell>
                  <TableCell>{r.floor}</TableCell>
                  <TableCell><Chip label={r.type} size="small" /></TableCell>
                  <TableCell>{r.capacity}</TableCell>
                  <TableCell>{r.occupied}</TableCell>
                  <TableCell><Chip label={r.status} size="small" color={r.status === 'available' ? 'success' : r.status === 'occupied' ? 'error' : 'default'} /></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditRoom(r); setFormData({ ...r }); setRoomDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteRoom(r.id)}><CancelIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* RESIDENTS */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>Resident Students</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Student Code</TableCell><TableCell>Name</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {residents.length === 0 ? (
                <TableRow><TableCell colSpan={3} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No resident data loaded.</Typography></TableCell></TableRow>
              ) : residents.map(r => (
                <TableRow key={r.studentId ?? r.id} hover>
                  <TableCell>{r.studentCode ?? '—'}</TableCell>
                  <TableCell>{`${r.firstNameEn ?? ''} ${r.lastNameEn ?? ''}`.trim() || '—'}</TableCell>
                  <TableCell><Button size="small" onClick={() => navigate(`/students/${r.studentId ?? r.id}`)}>View Profile</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* DISCIPLINE */}
      <TabPanel value={tab} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Discipline Records</Typography>
          <Button variant="contained" color="warning" startIcon={<AddIcon />} onClick={() => { setFormData({}); setDisciplineDialog(true); }}>Record Violation</Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Student ID</TableCell><TableCell>Violation</TableCell><TableCell>Severity</TableCell>
              <TableCell>Action</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {discipline.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No discipline records.</Typography></TableCell></TableRow>
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
          <Typography variant="h6" fontWeight={600}>Visitor Log</Typography>
          <Button variant="contained" color="info" startIcon={<AddIcon />} onClick={() => { setFormData({}); setVisitorDialog(true); }}>Register Visitor</Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Visitor</TableCell><TableCell>Student ID</TableCell><TableCell>Relation</TableCell>
              <TableCell>Purpose</TableCell><TableCell>Check-In</TableCell><TableCell>Status</TableCell><TableCell>Action</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {visitors.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No visitor records.</Typography></TableCell></TableRow>
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
                      <Tooltip title="Check Out"><IconButton size="small" color="warning" onClick={() => handleCheckoutVisitor(v.id)}><CheckoutIcon fontSize="small" /></IconButton></Tooltip>
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
        <Typography variant="h6" fontWeight={600} mb={2}>Leave Requests</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Student ID</TableCell><TableCell>From</TableCell><TableCell>To</TableCell>
              <TableCell>Reason</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No leave requests.</Typography></TableCell></TableRow>
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
                        <Tooltip title="Approve"><IconButton size="small" color="success" onClick={() => handleProcessLeave(l.id, 'approve')}><CheckCircleOutline fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Reject"><IconButton size="small" color="error" onClick={() => handleProcessLeave(l.id, 'reject')}><CancelIcon fontSize="small" /></IconButton></Tooltip>
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
          <Typography variant="h6" fontWeight={600}>Incident Reports</Typography>
          <Button variant="contained" color="error" startIcon={<AddIcon />} onClick={() => { setFormData({}); setIncidentDialog(true); }}>Record Incident</Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Title</TableCell><TableCell>Severity</TableCell><TableCell>Date</TableCell>
              <TableCell>Action Taken</TableCell><TableCell>Status</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {incidents.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No incidents recorded.</Typography></TableCell></TableRow>
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
          <Typography variant="h6" fontWeight={600}>Mess Menu</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditMenu(null); setFormData({}); setMessDialog(true); }}>Create Menu</Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Day</TableCell><TableCell>Meal Type</TableCell><TableCell>Items</TableCell>
              <TableCell>Special Notes</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {messMenus.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No mess menus added. Click "Create Menu" to get started.</Typography></TableCell></TableRow>
              ) : messMenus.map(m => (
                <TableRow key={m.id} hover>
                  <TableCell><strong>{m.day}</strong></TableCell>
                  <TableCell><Chip label={m.mealType} size="small" color={m.mealType === 'breakfast' ? 'info' : m.mealType === 'lunch' ? 'success' : m.mealType === 'dinner' ? 'warning' : 'default'} /></TableCell>
                  <TableCell>{Array.isArray(m.items) ? m.items.join(', ') : m.items}</TableCell>
                  <TableCell>{m.specialNotes || '—'}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditMenu(m); setFormData({ ...m, items: Array.isArray(m.items) ? m.items.join(', ') : m.items }); setMessDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteMessMenu(m.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
          <Typography variant="h6" fontWeight={600}>Inventory Management</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditInventory(null); setFormData({}); setInventoryDialog(true); }}>Add Item</Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Name</TableCell><TableCell>Category</TableCell><TableCell>Quantity</TableCell>
              <TableCell>Unit</TableCell><TableCell>Min Stock</TableCell><TableCell>Location</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {inventory.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No inventory items. Click "Add Item" to get started.</Typography></TableCell></TableRow>
              ) : inventory.map(i => (
                <TableRow key={i.id} hover>
                  <TableCell><strong>{i.name}</strong></TableCell>
                  <TableCell><Chip label={i.category} size="small" /></TableCell>
                  <TableCell sx={{ color: i.quantity <= i.minStock ? 'error.main' : 'inherit', fontWeight: i.quantity <= i.minStock ? 700 : 400 }}>{i.quantity}</TableCell>
                  <TableCell>{i.unit}</TableCell>
                  <TableCell>{i.minStock}</TableCell>
                  <TableCell>{i.location || '—'}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditInventory(i); setFormData({ ...i }); setInventoryDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteInventory(i.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>My Profile</Typography>
                  <Chip label={profile?.role || 'Hostel Warden'} color="secondary" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>Name:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>Email:</strong> {profile?.email || user?.email || '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>Phone:</strong> {profile?.phoneNumber || '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>Status:</strong> <Chip label={profile?.status || 'active'} size="small" color="success" /></Typography>
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
                    { label: 'Student List', path: '/students', icon: <PeopleIcon color="secondary" /> },
                    { label: 'Messages', path: '/communication/messages', icon: <MessageIcon color="secondary" /> },
                    { label: 'Announcements', path: '/communication/announcements', icon: <AnnouncementIcon color="secondary" /> },
                    { label: 'Calendar', path: '/calendar', icon: <CalendarIcon color="secondary" /> },
                    { label: 'Documents', path: '/documents', icon: <DocIcon color="secondary" /> },
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

      {/* Room Dialog */}
      <Dialog open={roomDialog} onClose={() => { setRoomDialog(false); setEditRoom(null); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Room Number" value={formData.roomNumber ?? ''} onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} fullWidth required />
          <TextField label="Floor" type="number" value={formData.floor ?? 1} onChange={e => setFormData({ ...formData, floor: Number(e.target.value) })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={formData.type ?? ''} onChange={e => setFormData({ ...formData, type: e.target.value })}>
              {['Single', 'Double', 'Triple', 'Dormitory'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Capacity" type="number" value={formData.capacity ?? 2} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} fullWidth />
          <TextField label="Description" value={formData.description ?? ''} onChange={e => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRoomDialog(false); setEditRoom(null); setFormData({}); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRoom}>{editRoom ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Discipline Dialog */}
      <Dialog open={disciplineDialog} onClose={() => { setDisciplineDialog(false); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>Record Discipline Violation</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Student ID" type="number" value={formData.studentId ?? ''} onChange={e => setFormData({ ...formData, studentId: Number(e.target.value) })} fullWidth required />
          <TextField label="Violation" value={formData.violation ?? ''} onChange={e => setFormData({ ...formData, violation: e.target.value })} fullWidth required />
          <TextField label="Description" value={formData.description ?? ''} onChange={e => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={2} />
          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select label="Severity" value={formData.severity ?? 'minor'} onChange={e => setFormData({ ...formData, severity: e.target.value })}>
              {['minor', 'moderate', 'major'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Action Taken" value={formData.action ?? ''} onChange={e => setFormData({ ...formData, action: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDisciplineDialog(false); setFormData({}); }}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleCreateDiscipline}>Record</Button>
        </DialogActions>
      </Dialog>

      {/* Visitor Dialog */}
      <Dialog open={visitorDialog} onClose={() => { setVisitorDialog(false); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>Register Visitor</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Visitor Name" value={formData.visitorName ?? ''} onChange={e => setFormData({ ...formData, visitorName: e.target.value })} fullWidth required />
          <TextField label="Student ID" type="number" value={formData.studentId ?? ''} onChange={e => setFormData({ ...formData, studentId: Number(e.target.value) })} fullWidth required />
          <TextField label="Relation" value={formData.relation ?? ''} onChange={e => setFormData({ ...formData, relation: e.target.value })} fullWidth />
          <TextField label="Phone" value={formData.phone ?? ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} fullWidth />
          <TextField label="Purpose of Visit" value={formData.purpose ?? ''} onChange={e => setFormData({ ...formData, purpose: e.target.value })} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setVisitorDialog(false); setFormData({}); }}>Cancel</Button>
          <Button variant="contained" color="info" onClick={handleRegisterVisitor}>Register</Button>
        </DialogActions>
      </Dialog>

      {/* Incident Dialog */}
      <Dialog open={incidentDialog} onClose={() => { setIncidentDialog(false); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>Record Incident</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Title" value={formData.title ?? ''} onChange={e => setFormData({ ...formData, title: e.target.value })} fullWidth required />
          <TextField label="Description" value={formData.description ?? ''} onChange={e => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={3} required />
          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select label="Severity" value={formData.severity ?? 'low'} onChange={e => setFormData({ ...formData, severity: e.target.value })}>
              {['low', 'medium', 'high'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Action Taken" value={formData.actionTaken ?? ''} onChange={e => setFormData({ ...formData, actionTaken: e.target.value })} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setIncidentDialog(false); setFormData({}); }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleCreateIncident}>Record</Button>
        </DialogActions>
      </Dialog>

      {/* Mess Menu Dialog */}
      <Dialog open={messDialog} onClose={() => { setMessDialog(false); setEditMenu(null); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editMenu ? 'Edit Menu' : 'Create Mess Menu'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Day</InputLabel>
            <Select label="Day" value={formData.day ?? ''} onChange={e => setFormData({ ...formData, day: e.target.value })}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Meal Type</InputLabel>
            <Select label="Meal Type" value={formData.mealType ?? ''} onChange={e => setFormData({ ...formData, mealType: e.target.value })}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Items (comma-separated)" value={formData.items ?? ''} onChange={e => setFormData({ ...formData, items: e.target.value })} fullWidth required helperText="e.g. Rice, Dal, Chapati, Salad" />
          <TextField label="Special Notes" value={formData.specialNotes ?? ''} onChange={e => setFormData({ ...formData, specialNotes: e.target.value })} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setMessDialog(false); setEditMenu(null); setFormData({}); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMessMenu}>{editMenu ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Dialog */}
      <Dialog open={inventoryDialog} onClose={() => { setInventoryDialog(false); setEditInventory(null); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editInventory ? 'Edit Inventory Item' : 'Add Inventory Item'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Item Name" value={formData.name ?? ''} onChange={e => setFormData({ ...formData, name: e.target.value })} fullWidth required />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select label="Category" value={formData.category ?? ''} onChange={e => setFormData({ ...formData, category: e.target.value })}>
              {['Kitchen', 'Cleaning', 'Furniture', 'Bedding', 'Electrical', 'Stationery', 'Other'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Quantity" type="number" value={formData.quantity ?? 0} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} fullWidth />
          <TextField label="Unit" value={formData.unit ?? 'pcs'} onChange={e => setFormData({ ...formData, unit: e.target.value })} fullWidth />
          <TextField label="Minimum Stock" type="number" value={formData.minStock ?? 0} onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })} fullWidth />
          <TextField label="Location" value={formData.location ?? ''} onChange={e => setFormData({ ...formData, location: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setInventoryDialog(false); setEditInventory(null); setFormData({}); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveInventory}>{editInventory ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HostelPortal;


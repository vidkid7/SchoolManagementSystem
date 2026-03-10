import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip,
} from '@mui/material';
import {
  DirectionsBus as BusIcon,
  People as PeopleIcon, Message as MessageIcon,
  CalendarMonth as CalendarIcon, Description as DocIcon,
  Notifications as AnnouncementIcon, Person as PersonIcon,
  CheckCircle as ActiveIcon, Route as RouteIcon, AirportShuttle as VehicleIcon,
  LocationOn as PickupIcon, FactCheck as AttendanceIcon,
  Add as AddIcon, Edit as EditIcon, Cancel as CancelIcon,
  PersonPin as DriverIcon, Build as MaintenanceIcon, Delete as DeleteIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';

interface DashboardData { summary: { totalStudents: number; activeStudents: number; role: string }; quickLinks: Array<{ label: string; path: string }>; }
interface ProfileData { id: number; username: string; email: string; firstName: string; lastName: string; phoneNumber?: string; role: string; status: string; }
interface TransportStudent { id?: number; studentId?: number; firstNameEn?: string; lastNameEn?: string; studentCode?: string; }
interface Route { id: number; routeName: string; origin: string; destination: string; stops: string[]; driverName: string; driverPhone: string; departureTime: string; arrivalTime: string; status: string; studentCount: number; }
interface Vehicle { id: number; vehicleNumber: string; type: string; capacity: number; driverName: string; driverPhone: string; insuranceExpiry: string | null; registrationExpiry: string | null; status: string; }
interface PickupPoint { id: number; name: string; address: string; routeId: number | null; estimatedTime: string; status: string; }
interface Driver { id: number; name: string; licenseNumber: string; licenseExpiry: string | null; phone: string; address: string; assignedVehicleId: number | null; status: string; }
interface MaintenanceRecord { id: number; vehicleId: number; type: string; description: string; cost: number; date: string; nextDueDate: string | null; status: string; }

const authHdr = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>;
}

const TransportPortal: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [students, setStudents] = useState<TransportStudent[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [routeDialog, setRouteDialog] = useState(false);
  const [vehicleDialog, setVehicleDialog] = useState(false);
  const [pickupDialog, setPickupDialog] = useState(false);
  const [driverDialog, setDriverDialog] = useState(false);
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [editRoute, setEditRoute] = useState<Route | null>(null);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [editMaintenance, setEditMaintenance] = useState<MaintenanceRecord | null>(null);
  const [formData, setFormData] = useState<any>({});

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [dashRes, profileRes, studentsRes, routesRes, vehiclesRes, pickupsRes, driversRes, maintenanceRes] = await Promise.all([
        apiClient.get('/api/v1/transport/dashboard', authHdr(accessToken)),
        apiClient.get('/api/v1/transport/profile', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
        apiClient.get('/api/v1/transport/students', { ...authHdr(accessToken), params: { limit: 50 } }).catch(() => ({ data: { data: { students: [] } } })),
        apiClient.get('/api/v1/transport/routes', authHdr(accessToken)).catch(() => ({ data: { data: { routes: [] } } })),
        apiClient.get('/api/v1/transport/vehicles', authHdr(accessToken)).catch(() => ({ data: { data: { vehicles: [] } } })),
        apiClient.get('/api/v1/transport/pickup-points', authHdr(accessToken)).catch(() => ({ data: { data: { pickupPoints: [] } } })),
        apiClient.get('/api/v1/transport/drivers', authHdr(accessToken)).catch(() => ({ data: { data: { drivers: [] } } })),
        apiClient.get('/api/v1/transport/maintenance', authHdr(accessToken)).catch(() => ({ data: { data: { records: [] } } })),
      ]);
      setData(dashRes.data.data);
      setProfile(profileRes.data?.data ?? null);
      const list = studentsRes.data?.data;
      setStudents(Array.isArray(list) ? list : list?.students ?? []);
      setRoutes(routesRes.data?.data?.routes ?? []);
      setVehicles(vehiclesRes.data?.data?.vehicles ?? []);
      setPickupPoints(pickupsRes.data?.data?.pickupPoints ?? []);
      setDriversList(driversRes.data?.data?.drivers ?? []);
      setMaintenance(maintenanceRes.data?.data?.records ?? []);
    } catch {
      setError('Failed to load transport data');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveRoute = async () => {
    try {
      if (editRoute) {
        await apiClient.put(`/api/v1/transport/routes/${editRoute.id}`, formData, authHdr(accessToken!));
      } else {
        await apiClient.post('/api/v1/transport/routes', formData, authHdr(accessToken!));
      }
      setRouteDialog(false); setEditRoute(null); setFormData({}); loadData();
    } catch { setError('Failed to save route'); }
  };

  const handleDeleteRoute = async (id: number) => {
    if (!window.confirm('Delete this route?')) return;
    try {
      await apiClient.delete(`/api/v1/transport/routes/${id}`, authHdr(accessToken!));
      loadData();
    } catch { setError('Failed to delete route'); }
  };

  const handleSaveVehicle = async () => {
    try {
      if (editVehicle) {
        await apiClient.put(`/api/v1/transport/vehicles/${editVehicle.id}`, formData, authHdr(accessToken!));
      } else {
        await apiClient.post('/api/v1/transport/vehicles', formData, authHdr(accessToken!));
      }
      setVehicleDialog(false); setEditVehicle(null); setFormData({}); loadData();
    } catch { setError('Failed to save vehicle'); }
  };

  const handleCreatePickup = async () => {
    try {
      await apiClient.post('/api/v1/transport/pickup-points', formData, authHdr(accessToken!));
      setPickupDialog(false); setFormData({}); loadData();
    } catch { setError('Failed to create pickup point'); }
  };

  const handleSaveDriver = async () => {
    try {
      if (editDriver) {
        await apiClient.put(`/api/v1/transport/drivers/${editDriver.id}`, formData, authHdr(accessToken!));
      } else {
        await apiClient.post('/api/v1/transport/drivers', formData, authHdr(accessToken!));
      }
      setDriverDialog(false); setEditDriver(null); setFormData({}); loadData();
    } catch { setError('Failed to save driver'); }
  };

  const handleDeleteDriver = async (id: number) => {
    if (!window.confirm('Delete this driver?')) return;
    try {
      await apiClient.delete(`/api/v1/transport/drivers/${id}`, authHdr(accessToken!));
      loadData();
    } catch { setError('Failed to delete driver'); }
  };

  const handleSaveMaintenance = async () => {
    try {
      if (editMaintenance) {
        await apiClient.put(`/api/v1/transport/maintenance/${editMaintenance.id}`, formData, authHdr(accessToken!));
      } else {
        await apiClient.post('/api/v1/transport/maintenance', formData, authHdr(accessToken!));
      }
      setMaintenanceDialog(false); setEditMaintenance(null); setFormData({}); loadData();
    } catch { setError('Failed to save maintenance record'); }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          <BusIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>Transport Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user?.firstName || user?.username} — Transport Manager
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total Students', value: data?.summary.totalStudents ?? '--', icon: <PeopleIcon />, color: 'primary.main' },
          { label: 'Active Students', value: data?.summary.activeStudents ?? '--', icon: <ActiveIcon />, color: 'success.main' },
          { label: 'Routes', value: routes.length, icon: <RouteIcon />, color: 'info.main' },
          { label: 'Vehicles', value: vehicles.length, icon: <VehicleIcon />, color: 'warning.main' },
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
        <Tab icon={<RouteIcon />} iconPosition="start" label="Routes" />
        <Tab icon={<VehicleIcon />} iconPosition="start" label="Vehicles" />
        <Tab icon={<PickupIcon />} iconPosition="start" label="Pickup Points" />
        <Tab icon={<PeopleIcon />} iconPosition="start" label="Students" />
        <Tab icon={<AttendanceIcon />} iconPosition="start" label="Attendance" />
        <Tab icon={<DriverIcon />} iconPosition="start" label="Drivers" />
        <Tab icon={<MaintenanceIcon />} iconPosition="start" label="Maintenance" />
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile & Links" />
      </Tabs>

      {/* ROUTES */}
      <TabPanel value={tab} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Route Management</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditRoute(null); setFormData({}); setRouteDialog(true); }}>Add Route</Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Route Name</TableCell><TableCell>From</TableCell><TableCell>To</TableCell>
              <TableCell>Driver</TableCell><TableCell>Departure</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {routes.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No routes added. Click "Add Route" to get started.</Typography></TableCell></TableRow>
              ) : routes.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell><strong>{r.routeName}</strong></TableCell>
                  <TableCell>{r.origin}</TableCell>
                  <TableCell>{r.destination}</TableCell>
                  <TableCell>{r.driverName || '—'}</TableCell>
                  <TableCell>{r.departureTime || '—'}</TableCell>
                  <TableCell><Chip label={r.status} size="small" color={r.status === 'active' ? 'success' : 'default'} /></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditRoute(r); setFormData({ ...r }); setRouteDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteRoute(r.id)}><CancelIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* VEHICLES */}
      <TabPanel value={tab} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Vehicle Management</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditVehicle(null); setFormData({}); setVehicleDialog(true); }}>Add Vehicle</Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Vehicle No.</TableCell><TableCell>Type</TableCell><TableCell>Capacity</TableCell>
              <TableCell>Driver</TableCell><TableCell>Phone</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No vehicles added. Click "Add Vehicle" to get started.</Typography></TableCell></TableRow>
              ) : vehicles.map(v => (
                <TableRow key={v.id} hover>
                  <TableCell><strong>{v.vehicleNumber}</strong></TableCell>
                  <TableCell><Chip label={v.type} size="small" /></TableCell>
                  <TableCell>{v.capacity}</TableCell>
                  <TableCell>{v.driverName || '—'}</TableCell>
                  <TableCell>{v.driverPhone || '—'}</TableCell>
                  <TableCell><Chip label={v.status} size="small" color={v.status === 'active' ? 'success' : 'default'} /></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditVehicle(v); setFormData({ ...v }); setVehicleDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* PICKUP POINTS */}
      <TabPanel value={tab} index={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Pickup Points</Typography>
          <Button variant="contained" color="info" startIcon={<AddIcon />} onClick={() => { setFormData({}); setPickupDialog(true); }}>Add Pickup Point</Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Name</TableCell><TableCell>Address</TableCell><TableCell>Route ID</TableCell><TableCell>Est. Time</TableCell><TableCell>Status</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {pickupPoints.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No pickup points. Click "Add Pickup Point" to get started.</Typography></TableCell></TableRow>
              ) : pickupPoints.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell><strong>{p.name}</strong></TableCell>
                  <TableCell>{p.address}</TableCell>
                  <TableCell>{p.routeId ?? '—'}</TableCell>
                  <TableCell>{p.estimatedTime || '—'}</TableCell>
                  <TableCell><Chip label={p.status} size="small" color={p.status === 'active' ? 'success' : 'default'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* STUDENTS */}
      <TabPanel value={tab} index={3}>
        <Typography variant="h6" fontWeight={600} mb={2}>Students on Transport</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}><TableCell>Student Code</TableCell><TableCell>Name</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
            <TableBody>
              {students.length === 0 ? (
                <TableRow><TableCell colSpan={3} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No student transport data.</Typography></TableCell></TableRow>
              ) : students.map(s => (
                <TableRow key={s.studentId ?? s.id} hover>
                  <TableCell>{s.studentCode ?? '—'}</TableCell>
                  <TableCell>{`${s.firstNameEn ?? ''} ${s.lastNameEn ?? ''}`.trim() || '—'}</TableCell>
                  <TableCell><Button size="small" onClick={() => navigate(`/students/${s.studentId ?? s.id}`)}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* ATTENDANCE */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={600} mb={2}>Transport Attendance</Typography>
        <Typography variant="body2" color="text.secondary">
          Use the attendance marking section to record daily transport attendance. 
          Route-wise attendance reports will appear here once students are linked to routes.
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/attendance')}>
          Go to Attendance Module
        </Button>
      </TabPanel>

      {/* DRIVERS */}
      <TabPanel value={tab} index={5}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Driver Management</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditDriver(null); setFormData({}); setDriverDialog(true); }}>Add Driver</Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Name</TableCell><TableCell>License #</TableCell><TableCell>License Expiry</TableCell>
              <TableCell>Phone</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {driversList.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No drivers added. Click "Add Driver" to get started.</Typography></TableCell></TableRow>
              ) : driversList.map(d => (
                <TableRow key={d.id} hover>
                  <TableCell><strong>{d.name}</strong></TableCell>
                  <TableCell>{d.licenseNumber}</TableCell>
                  <TableCell>{d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{d.phone || '—'}</TableCell>
                  <TableCell><Chip label={d.status} size="small" color={d.status === 'active' ? 'success' : d.status === 'on-leave' ? 'warning' : 'default'} /></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditDriver(d); setFormData({ ...d }); setDriverDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDeleteDriver(d.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* MAINTENANCE */}
      <TabPanel value={tab} index={6}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>Maintenance Records</Typography>
          <Button variant="contained" color="warning" startIcon={<AddIcon />} onClick={() => { setEditMaintenance(null); setFormData({}); setMaintenanceDialog(true); }}>Add Record</Button>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead><TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell>Vehicle ID</TableCell><TableCell>Type</TableCell><TableCell>Description</TableCell>
              <TableCell>Cost</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {maintenance.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No maintenance records. Click "Add Record" to get started.</Typography></TableCell></TableRow>
              ) : maintenance.map(m => (
                <TableRow key={m.id} hover>
                  <TableCell>{m.vehicleId}</TableCell>
                  <TableCell><Chip label={m.type} size="small" /></TableCell>
                  <TableCell>{m.description || '—'}</TableCell>
                  <TableCell>${m.cost}</TableCell>
                  <TableCell>{new Date(m.date).toLocaleDateString()}</TableCell>
                  <TableCell><Chip label={m.status} size="small" color={m.status === 'completed' ? 'success' : m.status === 'in-progress' ? 'warning' : 'info'} /></TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditMaintenance(m); setFormData({ ...m }); setMaintenanceDialog(true); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* PROFILE & LINKS */}
      <TabPanel value={tab} index={7}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>My Profile</Typography>
                  <Chip label={profile?.role || 'Transport Manager'} color="primary" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>Name:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>Email:</strong> {profile?.email || user?.email || '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>Phone:</strong> {profile?.phoneNumber || '—'}</Typography>
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
                    { label: 'Student List', path: '/students', icon: <PeopleIcon color="primary" /> },
                    { label: 'Messages', path: '/communication/messages', icon: <MessageIcon color="primary" /> },
                    { label: 'Announcements', path: '/communication/announcements', icon: <AnnouncementIcon color="primary" /> },
                    { label: 'Calendar', path: '/calendar', icon: <CalendarIcon color="primary" /> },
                    { label: 'Documents', path: '/documents', icon: <DocIcon color="primary" /> },
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

      {/* Route Dialog */}
      <Dialog open={routeDialog} onClose={() => { setRouteDialog(false); setEditRoute(null); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editRoute ? 'Edit Route' : 'Add New Route'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Route Name" value={formData.routeName ?? ''} onChange={e => setFormData({ ...formData, routeName: e.target.value })} fullWidth required />
          <TextField label="Origin" value={formData.origin ?? ''} onChange={e => setFormData({ ...formData, origin: e.target.value })} fullWidth required />
          <TextField label="Destination" value={formData.destination ?? ''} onChange={e => setFormData({ ...formData, destination: e.target.value })} fullWidth required />
          <TextField label="Driver Name" value={formData.driverName ?? ''} onChange={e => setFormData({ ...formData, driverName: e.target.value })} fullWidth />
          <TextField label="Driver Phone" value={formData.driverPhone ?? ''} onChange={e => setFormData({ ...formData, driverPhone: e.target.value })} fullWidth />
          <TextField label="Departure Time (HH:MM)" value={formData.departureTime ?? ''} onChange={e => setFormData({ ...formData, departureTime: e.target.value })} fullWidth />
          <TextField label="Arrival Time (HH:MM)" value={formData.arrivalTime ?? ''} onChange={e => setFormData({ ...formData, arrivalTime: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRouteDialog(false); setEditRoute(null); setFormData({}); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRoute}>{editRoute ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Vehicle Dialog */}
      <Dialog open={vehicleDialog} onClose={() => { setVehicleDialog(false); setEditVehicle(null); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Vehicle Number" value={formData.vehicleNumber ?? ''} onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })} fullWidth required />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={formData.type ?? ''} onChange={e => setFormData({ ...formData, type: e.target.value })}>
              {['Bus', 'Minibus', 'Van', 'Car'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Capacity" type="number" value={formData.capacity ?? 40} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} fullWidth />
          <TextField label="Driver Name" value={formData.driverName ?? ''} onChange={e => setFormData({ ...formData, driverName: e.target.value })} fullWidth />
          <TextField label="Driver Phone" value={formData.driverPhone ?? ''} onChange={e => setFormData({ ...formData, driverPhone: e.target.value })} fullWidth />
          <TextField label="Insurance Expiry" type="date" value={formData.insuranceExpiry ?? ''} onChange={e => setFormData({ ...formData, insuranceExpiry: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Registration Expiry" type="date" value={formData.registrationExpiry ?? ''} onChange={e => setFormData({ ...formData, registrationExpiry: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setVehicleDialog(false); setEditVehicle(null); setFormData({}); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveVehicle}>{editVehicle ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Pickup Point Dialog */}
      <Dialog open={pickupDialog} onClose={() => { setPickupDialog(false); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>Add Pickup Point</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Name" value={formData.name ?? ''} onChange={e => setFormData({ ...formData, name: e.target.value })} fullWidth required />
          <TextField label="Address" value={formData.address ?? ''} onChange={e => setFormData({ ...formData, address: e.target.value })} fullWidth required />
          <TextField label="Route ID (optional)" type="number" value={formData.routeId ?? ''} onChange={e => setFormData({ ...formData, routeId: e.target.value ? Number(e.target.value) : null })} fullWidth />
          <TextField label="Estimated Pickup Time (HH:MM)" value={formData.estimatedTime ?? ''} onChange={e => setFormData({ ...formData, estimatedTime: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPickupDialog(false); setFormData({}); }}>Cancel</Button>
          <Button variant="contained" color="info" onClick={handleCreatePickup}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Driver Dialog */}
      <Dialog open={driverDialog} onClose={() => { setDriverDialog(false); setEditDriver(null); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Name" value={formData.name ?? ''} onChange={e => setFormData({ ...formData, name: e.target.value })} fullWidth required />
          <TextField label="License Number" value={formData.licenseNumber ?? ''} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })} fullWidth required />
          <TextField label="License Expiry" type="date" value={formData.licenseExpiry ?? ''} onChange={e => setFormData({ ...formData, licenseExpiry: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Phone" value={formData.phone ?? ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} fullWidth />
          <TextField label="Address" value={formData.address ?? ''} onChange={e => setFormData({ ...formData, address: e.target.value })} fullWidth />
          <TextField label="Assigned Vehicle ID (optional)" type="number" value={formData.assignedVehicleId ?? ''} onChange={e => setFormData({ ...formData, assignedVehicleId: e.target.value ? Number(e.target.value) : null })} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={formData.status ?? 'active'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              {['active', 'inactive', 'on-leave'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDriverDialog(false); setEditDriver(null); setFormData({}); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveDriver}>{editDriver ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={maintenanceDialog} onClose={() => { setMaintenanceDialog(false); setEditMaintenance(null); setFormData({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editMaintenance ? 'Edit Maintenance Record' : 'Add Maintenance Record'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Vehicle ID" type="number" value={formData.vehicleId ?? ''} onChange={e => setFormData({ ...formData, vehicleId: Number(e.target.value) })} fullWidth required />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={formData.type ?? ''} onChange={e => setFormData({ ...formData, type: e.target.value })}>
              {['Oil Change', 'Tire Replacement', 'Engine Repair', 'Brake Service', 'AC Service', 'General Inspection', 'Other'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Description" value={formData.description ?? ''} onChange={e => setFormData({ ...formData, description: e.target.value })} fullWidth multiline rows={2} />
          <TextField label="Cost" type="number" value={formData.cost ?? 0} onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })} fullWidth />
          <TextField label="Date" type="date" value={formData.date ?? ''} onChange={e => setFormData({ ...formData, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <TextField label="Next Due Date" type="date" value={formData.nextDueDate ?? ''} onChange={e => setFormData({ ...formData, nextDueDate: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={formData.status ?? 'scheduled'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              {['scheduled', 'in-progress', 'completed', 'cancelled'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setMaintenanceDialog(false); setEditMaintenance(null); setFormData({}); }}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleSaveMaintenance}>{editMaintenance ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransportPortal;

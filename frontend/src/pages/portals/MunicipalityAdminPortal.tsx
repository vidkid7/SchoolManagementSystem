import { FormEvent, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  LocationCity as LocationCityIcon,
  PersonAdd as PersonAddIcon,
  School as SchoolIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface DashboardData {
  municipality: {
    id: string;
    nameEn: string;
    nameNp?: string;
    code: string;
    district: string;
    province?: string;
  };
  summary: {
    totalSchools: number;
    activeSchools: number;
    inactiveSchools: number;
    totalUsers: number;
    activeSchoolAdmins: number;
  };
}

interface ReportsData {
  schoolMetrics: {
    totalSchools: number;
    activeSchools: number;
    inactiveSchools: number;
  };
  userMetrics: {
    totalUsers: number;
    byStatus: {
      active: number;
      inactive: number;
      suspended: number;
      locked: number;
    };
    byRole: {
      schoolAdmins: number;
      teachers: number;
      students: number;
      parents: number;
      supportStaff: number;
    };
  };
}

interface MunicipalityIncident {
  id: string;
  category: 'school' | 'user';
  severity: 'medium' | 'high';
  title: string;
  description: string;
  occurredAt: string;
}

interface IncidentsData {
  summary: {
    totalIncidents: number;
    inactiveSchools: number;
    flaggedUsers: number;
  };
  incidents: MunicipalityIncident[];
}

interface School {
  id: string;
  schoolNameEn: string;
  schoolNameNp?: string;
  schoolCode?: string;
  addressEn?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

interface SchoolForm {
  schoolNameEn: string;
  schoolCode: string;
  addressEn: string;
  phone: string;
  email: string;
}

interface SchoolAdminForm {
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
}

const initialSchoolForm: SchoolForm = {
  schoolNameEn: '',
  schoolCode: '',
  addressEn: '',
  phone: '',
  email: '',
};

const initialSchoolAdminForm: SchoolAdminForm = {
  username: '',
  email: '',
  password: '',
  phoneNumber: '',
};

export default function MunicipalityAdminPortal() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [incidents, setIncidents] = useState<IncidentsData | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolForm, setSchoolForm] = useState<SchoolForm>(initialSchoolForm);
  const [adminForm, setAdminForm] = useState<SchoolAdminForm>(initialSchoolAdminForm);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSchool, setSavingSchool] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [dashboardResponse, schoolsResponse, reportsResponse, incidentsResponse] = await Promise.all([
        api.get('/municipality-admin/dashboard'),
        api.get('/municipality-admin/schools', {
          params: { includeInactive: true },
        }),
        api.get('/municipality-admin/reports'),
        api.get('/municipality-admin/incidents', {
          params: { limit: 10 },
        }),
      ]);

      setDashboard(dashboardResponse.data.data as DashboardData);
      setSchools(schoolsResponse.data.data as School[]);
      setReports(reportsResponse.data.data as ReportsData);
      setIncidents(incidentsResponse.data.data as IncidentsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load municipality data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateSchool = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSavingSchool(true);
      setError('');
      setMessage('');

      const payload = {
        schoolNameEn: schoolForm.schoolNameEn,
        schoolCode: schoolForm.schoolCode || undefined,
        addressEn: schoolForm.addressEn || undefined,
        phone: schoolForm.phone || undefined,
        email: schoolForm.email || undefined,
      };

      await api.post('/municipality-admin/schools', payload);
      setSchoolForm(initialSchoolForm);
      setMessage('School created successfully');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create school');
    } finally {
      setSavingSchool(false);
    }
  };

  const toggleSchoolStatus = async (school: School) => {
    try {
      setError('');
      setMessage('');
      const endpoint = school.isActive ? 'deactivate' : 'activate';
      await api.post(`/municipality-admin/schools/${school.id}/${endpoint}`);
      setMessage(
        school.isActive ? 'School deactivated successfully' : 'School activated successfully'
      );
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update school status');
    }
  };

  const openCreateAdminDialog = (school: School) => {
    setSelectedSchool(school);
    setAdminForm(initialSchoolAdminForm);
    setAdminDialogOpen(true);
  };

  const handleCreateSchoolAdmin = async () => {
    if (!selectedSchool) {
      return;
    }

    try {
      setSavingAdmin(true);
      setError('');
      setMessage('');
      await api.post(`/municipality-admin/schools/${selectedSchool.id}/admins`, {
        username: adminForm.username,
        email: adminForm.email,
        password: adminForm.password,
        phoneNumber: adminForm.phoneNumber || undefined,
      });
      setAdminDialogOpen(false);
      setMessage('School admin created successfully');
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create school admin');
    } finally {
      setSavingAdmin(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <LocationCityIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          Municipality Admin
        </Typography>
      </Stack>

      {dashboard && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {dashboard.municipality.nameEn} ({dashboard.municipality.code}) - {dashboard.municipality.district}
        </Typography>
      )}

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {dashboard && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SchoolIcon color="primary" />
                  <Typography variant="subtitle2">Total Schools</Typography>
                </Stack>
                <Typography variant="h5" fontWeight={700}>
                  {dashboard.summary.totalSchools}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircleIcon color="success" />
                  <Typography variant="subtitle2">Active Schools</Typography>
                </Stack>
                <Typography variant="h5" fontWeight={700}>
                  {dashboard.summary.activeSchools}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2">Inactive Schools</Typography>
                <Typography variant="h5" fontWeight={700}>
                  {dashboard.summary.inactiveSchools}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2">Active School Admins</Typography>
                <Typography variant="h5" fontWeight={700}>
                  {dashboard.summary.activeSchoolAdmins}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <AssessmentIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Reports Overview
                </Typography>
              </Stack>
              {reports ? (
                <Stack spacing={0.75}>
                  <Typography variant="body2">
                    <strong>Total Users:</strong> {reports.userMetrics.totalUsers}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Teachers:</strong> {reports.userMetrics.byRole.teachers}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Students:</strong> {reports.userMetrics.byRole.students}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Parents:</strong> {reports.userMetrics.byRole.parents}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Support Staff:</strong> {reports.userMetrics.byRole.supportStaff}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Suspended/Locked Users:</strong>{' '}
                    {reports.userMetrics.byStatus.suspended + reports.userMetrics.byStatus.locked}
                  </Typography>
                </Stack>
              ) : (
                <Typography color="text.secondary">Reports data unavailable.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <WarningAmberIcon color="warning" />
                <Typography variant="h6" fontWeight={700}>
                  Incidents
                </Typography>
              </Stack>
              {incidents ? (
                <>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    {incidents.summary.totalIncidents} tracked issue(s):{' '}
                    {incidents.summary.inactiveSchools} inactive school(s),{' '}
                    {incidents.summary.flaggedUsers} flagged user(s)
                  </Typography>
                  <Stack spacing={1}>
                    {incidents.incidents.slice(0, 5).map((incident) => (
                      <Box
                        key={incident.id}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2">{incident.title}</Typography>
                          <Chip
                            size="small"
                            color={incident.severity === 'high' ? 'error' : 'warning'}
                            label={incident.severity.toUpperCase()}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {incident.description}
                        </Typography>
                      </Box>
                    ))}
                    {incidents.incidents.length === 0 && (
                      <Typography color="text.secondary">No incidents found.</Typography>
                    )}
                  </Stack>
                </>
              ) : (
                <Typography color="text.secondary">Incident data unavailable.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Add School
              </Typography>
              <Box component="form" onSubmit={handleCreateSchool}>
                <Stack spacing={1.5}>
                  <TextField
                    required
                    label="School Name"
                    value={schoolForm.schoolNameEn}
                    onChange={(event) =>
                      setSchoolForm((previous) => ({
                        ...previous,
                        schoolNameEn: event.target.value,
                      }))
                    }
                  />
                  <TextField
                    label="School Code"
                    value={schoolForm.schoolCode}
                    onChange={(event) =>
                      setSchoolForm((previous) => ({
                        ...previous,
                        schoolCode: event.target.value,
                      }))
                    }
                  />
                  <TextField
                    label="Address"
                    value={schoolForm.addressEn}
                    onChange={(event) =>
                      setSchoolForm((previous) => ({
                        ...previous,
                        addressEn: event.target.value,
                      }))
                    }
                  />
                  <TextField
                    label="Phone"
                    value={schoolForm.phone}
                    onChange={(event) =>
                      setSchoolForm((previous) => ({
                        ...previous,
                        phone: event.target.value,
                      }))
                    }
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={schoolForm.email}
                    onChange={(event) =>
                      setSchoolForm((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }))
                    }
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<AddIcon />}
                    disabled={savingSchool || !schoolForm.schoolNameEn.trim()}
                  >
                    {savingSchool ? 'Saving...' : 'Create School'}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Schools In Municipality
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>School</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {school.schoolNameEn}
                        </Typography>
                        {school.addressEn && (
                          <Typography variant="caption" color="text.secondary">
                            {school.addressEn}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{school.schoolCode || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={school.isActive ? 'success' : 'default'}
                          label={school.isActive ? 'Active' : 'Inactive'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PersonAddIcon />}
                            onClick={() => openCreateAdminDialog(school)}
                          >
                            Add Admin
                          </Button>
                          <Button
                            size="small"
                            color={school.isActive ? 'warning' : 'success'}
                            variant="contained"
                            onClick={() => void toggleSchoolStatus(school)}
                          >
                            {school.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {schools.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography color="text.secondary">No schools found for this municipality.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create School Admin</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedSchool ? `School: ${selectedSchool.schoolNameEn}` : ''}
          </Typography>
          <Stack spacing={1.5}>
            <TextField
              required
              label="Username"
              value={adminForm.username}
              onChange={(event) =>
                setAdminForm((previous) => ({
                  ...previous,
                  username: event.target.value,
                }))
              }
            />
            <TextField
              required
              label="Email"
              type="email"
              value={adminForm.email}
              onChange={(event) =>
                setAdminForm((previous) => ({
                  ...previous,
                  email: event.target.value,
                }))
              }
            />
            <TextField
              required
              label="Password"
              type="password"
              value={adminForm.password}
              onChange={(event) =>
                setAdminForm((previous) => ({
                  ...previous,
                  password: event.target.value,
                }))
              }
            />
            <TextField
              label="Phone Number"
              value={adminForm.phoneNumber}
              onChange={(event) =>
                setAdminForm((previous) => ({
                  ...previous,
                  phoneNumber: event.target.value,
                }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void handleCreateSchoolAdmin()}
            disabled={
              savingAdmin ||
              !adminForm.username.trim() ||
              !adminForm.email.trim() ||
              !adminForm.password.trim()
            }
          >
            {savingAdmin ? 'Creating...' : 'Create Admin'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

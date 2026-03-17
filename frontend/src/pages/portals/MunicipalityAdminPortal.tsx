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
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  LocationCity as LocationCityIcon,
  PersonAdd as PersonAddIcon,
  School as SchoolIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { useTranslation } from 'react-i18next';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';

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
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
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
        apiClient.get('/municipality-admin/dashboard'),
        apiClient.get('/municipality-admin/schools', {
          params: { includeInactive: true },
        }),
        apiClient.get('/municipality-admin/reports'),
        apiClient.get('/municipality-admin/incidents', {
          params: { limit: 10 },
        }),
      ]);

      setDashboard(dashboardResponse.data.data as DashboardData);
      const schoolsData = schoolsResponse.data.data;
      setSchools(Array.isArray(schoolsData) ? schoolsData : schoolsData?.schools || schoolsData?.items || []);
      setReports(reportsResponse.data.data as ReportsData);
      setIncidents(incidentsResponse.data.data as IncidentsData);
    } catch (err: any) {
      setError(err.response?.data?.message || t('portal.failedToLoadData'));
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

      await apiClient.post('/municipality-admin/schools', payload);
      setSchoolForm(initialSchoolForm);
      setMessage(t('portal.schoolCreatedSuccess'));
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('portal.failedToLoadData'));
    } finally {
      setSavingSchool(false);
    }
  };

  const toggleSchoolStatus = async (school: School) => {
    try {
      setError('');
      setMessage('');
      const endpoint = school.isActive ? 'deactivate' : 'activate';
      await apiClient.post(`/municipality-admin/schools/${school.id}/${endpoint}`);
      setMessage(
        school.isActive ? t('portal.schoolDeactivatedSuccess') : t('portal.schoolActivatedSuccess')
      );
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('portal.failedToLoadData'));
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
      await apiClient.post(`/municipality-admin/schools/${selectedSchool.id}/admins`, {
        username: adminForm.username,
        email: adminForm.email,
        password: adminForm.password,
        phoneNumber: adminForm.phoneNumber || undefined,
      });
      setAdminDialogOpen(false);
      setMessage(t('portal.schoolAdminCreatedSuccess'));
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('portal.failedToLoadData'));
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
    <Box sx={{ p: 3, mt: { xs: 7, sm: 8 } }}>
      {/* Header */}
      <Paper sx={S.PAGE_HEADER}>
        <Box display="flex" alignItems="center" gap={2}>
          <LocationCityIcon sx={{ fontSize: 32, color: C.primary }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{t('portal.municipalityAdminPortal')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {dashboard ? `${dashboard.municipality?.nameEn ?? ''} (${dashboard.municipality?.code ?? ''}) - ${dashboard.municipality?.district ?? ''}` : t('portal.manageSchools')}
            </Typography>
          </Box>
        </Box>
      </Paper>

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
                  <Typography variant="subtitle2">{t('portal.totalSchools')}</Typography>
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
                  <Typography variant="subtitle2">{t('portal.activeSchools')}</Typography>
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
                <Typography variant="subtitle2">{t('portal.inactiveSchools')}</Typography>
                <Typography variant="h5" fontWeight={700}>
                  {dashboard.summary.inactiveSchools}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2">{t('portal.activeSchoolAdmins')}</Typography>
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
                  {t('portal.reportsOverview')}
                </Typography>
              </Stack>
              {reports?.userMetrics ? (
                <Stack spacing={0.75}>
                  <Typography variant="body2">
                    <strong>{t('portal.totalUsers')}:</strong> {reports.userMetrics.totalUsers}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t('portal.teachers')}:</strong> {reports.userMetrics.byRole?.teachers}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t('portal.studentsLabel')}:</strong> {reports.userMetrics.byRole?.students}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t('portal.parentsLabel')}:</strong> {reports.userMetrics.byRole?.parents}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t('portal.supportStaff')}:</strong> {reports.userMetrics.byRole?.supportStaff}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t('portal.suspendedLockedUsers')}:</strong>{' '}
                    {(reports.userMetrics.byStatus?.suspended ?? 0) + (reports.userMetrics.byStatus?.locked ?? 0)}
                  </Typography>
                </Stack>
              ) : (
                <Typography color="text.secondary">{t('portal.reportsDataUnavailable')}</Typography>
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
                  {t('portal.incidents')}
                </Typography>
              </Stack>
              {incidents?.summary ? (
                <>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    {incidents.summary.totalIncidents} tracked issue(s):{' '}
                    {incidents.summary.inactiveSchools} inactive school(s),{' '}
                    {incidents.summary.flaggedUsers} flagged user(s)
                  </Typography>
                  <Stack spacing={1}>
                    {(incidents.incidents || []).slice(0, 5).map((incident) => (
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
                    {(incidents.incidents || []).length === 0 && (
                      <Typography color="text.secondary">{t('portal.noIncidentsFound')}</Typography>
                    )}
                  </Stack>
                </>
              ) : (
                <Typography color="text.secondary">{t('portal.incidentDataUnavailable')}</Typography>
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
                {t('portal.addSchool')}
              </Typography>
              <Box component="form" onSubmit={handleCreateSchool}>
                <Stack spacing={1.5}>
                  <TextField
                    required
                    label={t('portal.schoolName')}
                    value={schoolForm.schoolNameEn}
                    onChange={(event) =>
                      setSchoolForm((previous) => ({
                        ...previous,
                        schoolNameEn: event.target.value,
                      }))
                    }
                  />
                  <TextField
                    label={t('portal.schoolCode')}
                    value={schoolForm.schoolCode}
                    onChange={(event) =>
                      setSchoolForm((previous) => ({
                        ...previous,
                        schoolCode: event.target.value,
                      }))
                    }
                  />
                  <TextField
                    label={t('portal.addressLabel')}
                    value={schoolForm.addressEn}
                    onChange={(event) =>
                      setSchoolForm((previous) => ({
                        ...previous,
                        addressEn: event.target.value,
                      }))
                    }
                  />
                  <TextField
                    label={t('portal.phone')}
                    value={schoolForm.phone}
                    onChange={(event) =>
                      setSchoolForm((previous) => ({
                        ...previous,
                        phone: event.target.value,
                      }))
                    }
                  />
                  <TextField
                    label={t('portal.email')}
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
                    sx={S.BTN_PRIMARY}
                    startIcon={<AddIcon />}
                    disabled={savingSchool || !schoolForm.schoolNameEn.trim()}
                  >
                    {savingSchool ? t('portal.saving') : t('portal.createSchool')}
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
                {t('portal.schoolsInMunicipality')}
              </Typography>
              <Table size="small">
                <TableHead sx={{ bgcolor: S.TH_BG }}>
                  <TableRow>
                    <TableCell>{t('common.school')}</TableCell>
                    <TableCell>{t('portal.schoolCode')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.id} sx={S.TR_HOVER}>
                      <TableCell sx={S.TD}>
                        <Typography variant="body2" fontWeight={600}>
                          {school.schoolNameEn}
                        </Typography>
                        {school.addressEn && (
                          <Typography variant="caption" color="text.secondary">
                            {school.addressEn}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={S.TD}>{school.schoolCode || '-'}</TableCell>
                      <TableCell sx={S.TD}>
                        <Chip
                          size="small"
                          color={school.isActive ? 'success' : 'default'}
                          label={school.isActive ? t('portal.active') : t('portal.inactive')}
                        />
                      </TableCell>
                      <TableCell align="right" sx={S.TD}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined" sx={S.BTN_OUTLINE}
                            startIcon={<PersonAddIcon />}
                            onClick={() => openCreateAdminDialog(school)}
                          >
                            {t('portal.addAdmin')}
                          </Button>
                          <Button
                            size="small"
                            color={school.isActive ? 'warning' : 'success'}
                            variant="contained" sx={S.BTN_PRIMARY}
                            onClick={() => void toggleSchoolStatus(school)}
                          >
                            {school.isActive ? t('portal.deactivate') : t('portal.activate')}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {schools.length === 0 && (
                    <TableRow sx={S.TR_HOVER}>
                      <TableCell colSpan={4} sx={S.TD}>
                        <Typography color="text.secondary">{t('portal.noSchoolsFound')}</Typography>
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
        <DialogTitle>{t('portal.createSchoolAdmin')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedSchool ? `School: ${selectedSchool.schoolNameEn}` : ''}
          </Typography>
          <Stack spacing={1.5}>
            <TextField
              required
              label={t('portal.username')}
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
              label={t('portal.email')}
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
              label={t('portal.password')}
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
              label={t('portal.phone')}
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
          <Button onClick={() => setAdminDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            sx={S.BTN_PRIMARY}
            onClick={() => void handleCreateSchoolAdmin()}
            disabled={
              savingAdmin ||
              !adminForm.username.trim() ||
              !adminForm.email.trim() ||
              !adminForm.password.trim()
            }
          >
            {savingAdmin ? t('portal.creating') : t('portal.createAdmin')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

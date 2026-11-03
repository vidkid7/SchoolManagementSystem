import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
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
  MenuItem,
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
import { C, useAdminStyles } from '../../theme/designTokens';
import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Backup as BackupIcon,
  CheckCircle as CheckCircleIcon,
  LocationCity as LocationCityIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  School as SchoolIcon,
  WarningAmber as WarningAmberIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';

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
  municipalityId?: string;
  isActive: boolean;
}

interface SchoolForm {
  schoolNameEn: string;
  schoolCode: string;
  addressEn: string;
  phone: string;
  email: string;
  municipalityId: string;
}

interface MunicipalityOption {
  id: string;
  nameEn: string;
  code: string;
  district?: string;
}

interface SchoolAdminForm {
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
}

interface MunicipalityUser {
  userId: number;
  username: string;
  email: string;
  role: string;
  status: string;
  schoolConfigId?: string;
}

interface SchoolBackupPreview {
  school: { id: string; name: string; code: string | null };
  createdAt: string;
  tableCount: number;
  rowCount: number;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
      return 'The request timed out. The operation may still have completed; refresh the list before retrying.';
    }
  }
  return fallback;
}

const initialSchoolForm: SchoolForm = {
  schoolNameEn: '',
  schoolCode: '',
  addressEn: '',
  phone: '',
  email: '',
  municipalityId: '',
};

const initialSchoolAdminForm: SchoolAdminForm = {
  username: '',
  email: '',
  password: '',
  phoneNumber: '',
};

export default function MunicipalityAdminPortal() {
  const { t } = useTranslation();
  const isSystemAccount = useSelector((state: RootState) => state.auth.user?.isSystemAccount === true);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.userId);
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [incidents, setIncidents] = useState<IncidentsData | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<MunicipalityUser[]>([]);
  const [municipalities, setMunicipalities] = useState<MunicipalityOption[]>([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolForm, setSchoolForm] = useState<SchoolForm>(initialSchoolForm);
  const [adminForm, setAdminForm] = useState<SchoolAdminForm>(initialSchoolAdminForm);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingSchool, setSavingSchool] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [resetLink, setResetLink] = useState('');
  const [adminForReset, setAdminForReset] = useState<MunicipalityUser | null>(null);
  const [schoolForEdit, setSchoolForEdit] = useState<School | null>(null);
  const [schoolForStatusChange, setSchoolForStatusChange] = useState<School | null>(null);
  const [editSchoolForm, setEditSchoolForm] = useState<SchoolForm>(initialSchoolForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [backupSchool, setBackupSchool] = useState<School | null>(null);
  const [backupMode, setBackupMode] = useState<'create' | 'restore' | null>(null);
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupPreview, setBackupPreview] = useState<SchoolBackupPreview | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const requests: Array<Promise<any>> = [
        apiClient.get('/municipality-admin/dashboard'),
        apiClient.get('/municipality-admin/schools', {
          params: { includeInactive: true },
        }),
        apiClient.get('/municipality-admin/reports'),
        apiClient.get('/municipality-admin/incidents', {
          params: { limit: 10 },
        }),
        apiClient.get('/municipality-admin/users'),
      ];
      if (isSystemAccount) requests.push(apiClient.get('/municipality-admin/platform/municipalities'));
      const [dashboardResponse, schoolsResponse, reportsResponse, incidentsResponse, usersResponse, municipalitiesResponse] = await Promise.all(requests);

      setDashboard(dashboardResponse.data.data as DashboardData);
      const schoolsData = schoolsResponse.data.data;
      setSchools(Array.isArray(schoolsData) ? schoolsData : schoolsData?.schools || schoolsData?.items || []);
      setReports(reportsResponse.data.data as ReportsData);
      setIncidents(incidentsResponse.data.data as IncidentsData);
      setUsers(Array.isArray(usersResponse.data.data) ? usersResponse.data.data : []);
      const municipalityData = municipalitiesResponse?.data?.data;
      setMunicipalities(Array.isArray(municipalityData) ? municipalityData : []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('portal.failedToLoadData')));
    } finally {
      setLoading(false);
    }
  }, [isSystemAccount, t]);

  useEffect(() => {
    // loadData starts API requests and updates state when those requests settle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

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
        ...(isSystemAccount && schoolForm.municipalityId ? { municipalityId: schoolForm.municipalityId } : {}),
      };

      await apiClient.post('/municipality-admin/schools', payload);
      setSchoolForm(initialSchoolForm);
      setMessage(t('portal.schoolFoundationCreatedSuccess'));
      await loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('portal.failedToLoadData')));
    } finally {
      setSavingSchool(false);
    }
  };

  const openEditSchool = (school: School) => {
    setSchoolForEdit(school);
    setEditSchoolForm({
      schoolNameEn: school.schoolNameEn || '',
      schoolCode: school.schoolCode || '',
      addressEn: school.addressEn || '',
      phone: school.phone || '',
      email: school.email || '',
      municipalityId: school.municipalityId || '',
    });
  };

  const handleUpdateSchool = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!schoolForEdit) return;
    try {
      setSavingEdit(true);
      await apiClient.put(`/municipality-admin/schools/${schoolForEdit.id}`, {
        schoolNameEn: editSchoolForm.schoolNameEn,
        schoolCode: editSchoolForm.schoolCode || '',
        addressEn: editSchoolForm.addressEn || '',
        phone: editSchoolForm.phone || '',
        email: editSchoolForm.email || '',
      });
      setSchoolForEdit(null);
      setMessage('School details updated.');
      await loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('portal.failedToLoadData')));
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleSchoolStatus = async (school: School) => {
    setSchoolForStatusChange(school);
  };

  const confirmToggleSchoolStatus = async () => {
    const school = schoolForStatusChange;
    if (!school) return;
    try {
      setError('');
      setMessage('');
      const endpoint = school.isActive ? 'deactivate' : 'activate';
      await apiClient.post(`/municipality-admin/schools/${school.id}/${endpoint}`);
      setMessage(
        school.isActive ? t('portal.schoolDeactivatedSuccess') : t('portal.schoolActivatedSuccess')
      );
      setSchoolForStatusChange(null);
      await loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('portal.failedToLoadData')));
    }
  };

  const openCreateAdminDialog = (school: School) => {
    setSelectedSchool(school);
    setAdminForm(initialSchoolAdminForm);
    setAdminDialogOpen(true);
  };

  const handleCreateSchoolAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('portal.failedToLoadData')));
    } finally {
      setSavingAdmin(false);
    }
  };

  const issuePasswordResetLink = async (user: MunicipalityUser) => {
    if (!user.schoolConfigId) return;
    try {
      setError('');
      const response = await apiClient.post(
        `/municipality-admin/platform/schools/${user.schoolConfigId}/admins/${user.userId}/reset-password-link`
      );
      setResetLink(response.data.data.resetUrl);
      setAdminForReset(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('portal.failedToLoadData')));
    }
  };

  const openBackup = (school: School, mode: 'create' | 'restore') => {
    setBackupSchool(school);
    setBackupMode(mode);
    setBackupPassphrase('');
    setBackupFile(null);
    setBackupPreview(null);
  };

  const closeBackup = () => {
    setBackupMode(null);
    setBackupSchool(null);
    setBackupPassphrase('');
    setBackupFile(null);
    setBackupPreview(null);
  };

  const handleCreateBackup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!backupSchool || backupPassphrase.length < 12) return;
    try {
      setBackupBusy(true);
      const response = await apiClient.post(
        `/backup/platform/schools/${backupSchool.id}/create`,
        { passphrase: backupPassphrase },
        { responseType: 'blob' }
      );
      const contentDisposition = String(response.headers['content-disposition'] || '');
      const filename = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] || `school-${backupSchool.id}.smbak`;
      const downloadUrl = URL.createObjectURL(new Blob([response.data]));
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
      setMessage(`Encrypted backup downloaded for ${backupSchool.schoolNameEn}. Keep the passphrase to restore it.`);
      closeBackup();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not create the school backup.'));
    } finally {
      setBackupBusy(false);
    }
  };

  const makeBackupForm = (): FormData | null => {
    if (!backupFile || !backupPassphrase) return null;
    const form = new FormData();
    form.append('backup', backupFile);
    form.append('passphrase', backupPassphrase);
    return form;
  };

  const validateBackup = async () => {
    if (!backupSchool) return;
    const form = makeBackupForm();
    if (!form) return;
    try {
      setBackupBusy(true);
      const response = await apiClient.post(`/backup/platform/schools/${backupSchool.id}/verify`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBackupPreview(response.data.data as SchoolBackupPreview);
    } catch (err: unknown) {
      setBackupPreview(null);
      setError(getErrorMessage(err, 'Backup validation failed. Check the file and passphrase.'));
    } finally {
      setBackupBusy(false);
    }
  };

  const restoreBackup = async () => {
    if (!backupSchool || !backupPreview) return;
    const form = makeBackupForm();
    if (!form) return;
    try {
      setBackupBusy(true);
      const response = await apiClient.post(`/backup/platform/schools/${backupSchool.id}/restore`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(response.data.message || 'Backup records merged successfully.');
      closeBackup();
      await loadData();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not restore this school backup.'));
    } finally {
      setBackupBusy(false);
    }
  };

  const filteredSchools = schools.filter((school) =>
    `${school.schoolNameEn} ${school.schoolCode || ''} ${school.addressEn || ''}`.toLowerCase().includes(schoolSearch.toLowerCase())
  );
  const schoolAdminUsers = users.filter((user) => user.role === 'School_Admin' && user.userId !== currentUserId);

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
          {isSystemAccount && (
            <Button
              variant="outlined"
              sx={S.BTN_OUTLINE}
              startIcon={<BackupIcon />}
              onClick={() => document.getElementById('school-management')?.scrollIntoView({ behavior: 'smooth' })}
            >
              School operations
            </Button>
          )}
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
                    inputProps={{ maxLength: 255 }}
                    label={t('portal.schoolName')}
                    value={schoolForm.schoolNameEn}
                    onChange={(event) =>
                      setSchoolForm((previous) => ({
                        ...previous,
                        schoolNameEn: event.target.value,
                      }))
                    }
                  />
                  {isSystemAccount && (
                    <TextField
                      select
                      required
                      label="Municipality"
                      value={schoolForm.municipalityId}
                      onChange={(event) => setSchoolForm((previous) => ({ ...previous, municipalityId: event.target.value }))}
                    >
                      {municipalities.map((municipality) => (
                        <MenuItem key={municipality.id} value={municipality.id}>
                          {municipality.nameEn} ({municipality.code})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                  <TextField
                    inputProps={{ maxLength: 50 }}
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
                    inputProps={{ maxLength: 20 }}
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
                    inputProps={{ maxLength: 255 }}
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
                    disabled={savingSchool || !schoolForm.schoolNameEn.trim() || (isSystemAccount && !schoolForm.municipalityId)}
                  >
                    {savingSchool ? t('portal.saving') : t('portal.createSchool')}
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8} id="school-management">
          <Card>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  {isSystemAccount ? 'All schools' : t('portal.schoolsInMunicipality')}
                </Typography>
                <TextField
                  size="small"
                  label="Search schools"
                  value={schoolSearch}
                  onChange={(event) => setSchoolSearch(event.target.value)}
                  sx={{ minWidth: 220 }}
                />
              </Stack>
              <Table size="small">
                <TableHead sx={{ bgcolor: S.TH_BG }}>
                  <TableRow>
                    <TableCell>{t('common.school')}</TableCell>
                    <TableCell>{t('portal.schoolCode')}</TableCell>
                      {isSystemAccount && <TableCell>Municipality</TableCell>}
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSchools.map((school) => (
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
                      {isSystemAccount && (
                        <TableCell sx={S.TD}>
                          {municipalities.find((municipality) => municipality.id === school.municipalityId)?.nameEn || school.municipalityId || '-'}
                        </TableCell>
                      )}
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
                            variant="outlined"
                            sx={S.BTN_OUTLINE}
                            startIcon={<EditIcon />}
                            onClick={() => openEditSchool(school)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined" sx={S.BTN_OUTLINE}
                            startIcon={<PersonAddIcon />}
                            onClick={() => openCreateAdminDialog(school)}
                          >
                            {t('portal.addAdmin')}
                          </Button>
                          {isSystemAccount && (
                            <>
                              <Button size="small" variant="outlined" sx={S.BTN_OUTLINE} startIcon={<BackupIcon />} onClick={() => openBackup(school, 'create')}>
                                Backup
                              </Button>
                              <Button size="small" variant="outlined" sx={S.BTN_OUTLINE} onClick={() => openBackup(school, 'restore')}>
                                Restore
                              </Button>
                            </>
                          )}
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
                  {filteredSchools.length === 0 && (
                    <TableRow sx={S.TR_HOVER}>
                      <TableCell colSpan={isSystemAccount ? 5 : 4} sx={S.TD}>
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

      {isSystemAccount && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              {t('portal.userPasswordRecovery')}
            </Typography>
            <Table size="small">
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>School</TableCell>
                  <TableCell>{t('userManagement.username')}</TableCell>
                  <TableCell>{t('common.email')}</TableCell>
                  <TableCell>{t('userManagement.role')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell align="right">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schoolAdminUsers.map((user) => (
                  <TableRow key={user.userId} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{schools.find((school) => school.id === user.schoolConfigId)?.schoolNameEn || '-'}</TableCell>
                    <TableCell sx={S.TD}>{user.username}</TableCell>
                    <TableCell sx={S.TD}>{user.email}</TableCell>
                    <TableCell sx={S.TD}>{user.role.replace(/_/g, ' ')}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip size="small" label={user.status} />
                    </TableCell>
                    <TableCell align="right" sx={S.TD}>
                      <Button
                        size="small"
                        variant="outlined"
                        sx={S.BTN_OUTLINE}
                        disabled={!user.schoolConfigId}
                        onClick={() => setAdminForReset(user)}
                      >
                        {t('portal.createPasswordResetLink')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {schoolAdminUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">{t('portal.noUsersFound')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('portal.createSchoolAdmin')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedSchool ? `School: ${selectedSchool.schoolNameEn}` : ''}
          </Typography>
          <Box component="form" id="school-admin-form" onSubmit={handleCreateSchoolAdmin}>
            <Stack spacing={1.5}>
              <TextField
                required
                inputProps={{ minLength: 3, maxLength: 50, pattern: '[A-Za-z0-9]+' }}
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
                inputProps={{ maxLength: 100 }}
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
                inputProps={{
                  minLength: 8,
                  maxLength: 128,
                  pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+',
                }}
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
                inputProps={{ maxLength: 20, pattern: '(\\+977[-\\s]?)?[0-9]{7,10}' }}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            type="submit"
            form="school-admin-form"
            sx={S.BTN_PRIMARY}
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

      <Dialog open={Boolean(resetLink)} onClose={() => setResetLink('')} maxWidth="sm" fullWidth>
        <DialogTitle>{t('portal.passwordResetLink')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>{t('portal.passwordResetLinkExpiry')}</Alert>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={t('portal.passwordResetLink')}
            value={resetLink}
            InputProps={{ readOnly: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetLink('')}>{t('common.close')}</Button>
          <Button
            variant="contained"
            sx={S.BTN_PRIMARY}
            onClick={() => void navigator.clipboard.writeText(resetLink)}
          >
            {t('common.copy')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(adminForReset)} onClose={() => setAdminForReset(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset school administrator password?</DialogTitle>
        <DialogContent>
          <Typography>
            Create a single-use, time-limited reset link for {adminForReset?.username} ({adminForReset?.email}).
            The link lets that administrator choose a new password and invalidates their active refresh sessions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminForReset(null)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            sx={S.BTN_PRIMARY}
            disabled={!adminForReset?.schoolConfigId}
            onClick={() => adminForReset && void issuePasswordResetLink(adminForReset)}
          >
            Create reset link
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(schoolForStatusChange)} onClose={() => setSchoolForStatusChange(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{schoolForStatusChange?.isActive ? 'Deactivate this school?' : 'Activate this school?'}</DialogTitle>
        <DialogContent>
          <Typography>
            {schoolForStatusChange?.isActive
              ? `This will prevent users from accessing ${schoolForStatusChange.schoolNameEn}. The school data will remain stored.`
              : `This will restore access for users at ${schoolForStatusChange?.schoolNameEn}.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSchoolForStatusChange(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" sx={S.BTN_PRIMARY} onClick={() => void confirmToggleSchoolStatus()}>
            {schoolForStatusChange?.isActive ? 'Deactivate school' : 'Activate school'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(schoolForEdit)} onClose={() => setSchoolForEdit(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit school details</DialogTitle>
        <DialogContent>
          <Box component="form" id="school-edit-form" onSubmit={handleUpdateSchool} sx={{ pt: 1 }}>
            <Stack spacing={1.5}>
              <TextField required label={t('portal.schoolName')} value={editSchoolForm.schoolNameEn} onChange={(event) => setEditSchoolForm((previous) => ({ ...previous, schoolNameEn: event.target.value }))} />
              <TextField label={t('portal.schoolCode')} value={editSchoolForm.schoolCode} onChange={(event) => setEditSchoolForm((previous) => ({ ...previous, schoolCode: event.target.value }))} />
              <TextField label={t('portal.addressLabel')} value={editSchoolForm.addressEn} onChange={(event) => setEditSchoolForm((previous) => ({ ...previous, addressEn: event.target.value }))} />
              <TextField label={t('portal.phone')} value={editSchoolForm.phone} onChange={(event) => setEditSchoolForm((previous) => ({ ...previous, phone: event.target.value }))} />
              <TextField label={t('portal.email')} type="email" value={editSchoolForm.email} onChange={(event) => setEditSchoolForm((previous) => ({ ...previous, email: event.target.value }))} />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSchoolForEdit(null)}>{t('common.cancel')}</Button>
          <Button type="submit" form="school-edit-form" variant="contained" sx={S.BTN_PRIMARY} disabled={savingEdit || !editSchoolForm.schoolNameEn.trim()}>
            {savingEdit ? t('portal.saving') : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(backupMode)} onClose={backupBusy ? undefined : closeBackup} maxWidth="sm" fullWidth>
        <DialogTitle>{backupMode === 'create' ? `Create encrypted backup: ${backupSchool?.schoolNameEn || ''}` : `Restore school backup: ${backupSchool?.schoolNameEn || ''}`}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {backupMode === 'create' ? (
              <Alert severity="info">The backup is encrypted before download. Store the file and passphrase securely; the app does not retain a server copy.</Alert>
            ) : (
              <Alert severity="warning">Restore merges records into this school; it does not remove newer records. It will invalidate this school’s refresh sessions and pending password reset links.</Alert>
            )}
            {backupMode === 'restore' && (
              <Button component="label" variant="outlined" sx={S.BTN_OUTLINE}>
                {backupFile ? backupFile.name : 'Choose encrypted backup file'}
                <input
                  hidden
                  type="file"
                  accept=".smbak,application/vnd.school-management-school-backup+json,application/json"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setBackupFile(event.target.files?.[0] || null);
                    setBackupPreview(null);
                  }}
                />
              </Button>
            )}
            <TextField
              required
              type="password"
              label="Backup passphrase (12–128 characters)"
              value={backupPassphrase}
              onChange={(event) => { setBackupPassphrase(event.target.value); setBackupPreview(null); }}
              inputProps={{ minLength: 12, maxLength: 128, autoComplete: 'new-password' }}
            />
            {backupPreview && (
              <Alert severity="success">
                Valid backup for {backupPreview.school.name}, created {new Date(backupPreview.createdAt).toLocaleString()}; {backupPreview.rowCount} records across {backupPreview.tableCount} data tables.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBackup} disabled={backupBusy}>{t('common.cancel')}</Button>
          {backupMode === 'create' ? (
            <Button type="submit" form="school-backup-form" variant="contained" sx={S.BTN_PRIMARY} disabled={backupBusy || backupPassphrase.length < 12}>
              {backupBusy ? 'Creating…' : 'Download backup'}
            </Button>
          ) : (
            <>
              {!backupPreview ? (
                <Button variant="contained" sx={S.BTN_PRIMARY} disabled={backupBusy || !backupFile || backupPassphrase.length < 12} onClick={() => void validateBackup()}>
                  {backupBusy ? 'Checking…' : 'Validate backup'}
                </Button>
              ) : (
                <Button variant="contained" color="warning" disabled={backupBusy} onClick={() => void restoreBackup()}>
                  {backupBusy ? 'Restoring…' : 'Apply merge restore'}
                </Button>
              )}
            </>
          )}
        </DialogActions>
        {backupMode === 'create' && (
          <Box component="form" id="school-backup-form" onSubmit={handleCreateBackup} />
        )}
      </Dialog>
    </Box>
  );
}

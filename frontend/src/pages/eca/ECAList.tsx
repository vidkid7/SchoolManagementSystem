/**
 * ECA List - Manage all Extra-Curricular Activities
 */

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Alert, Grid,
  useTheme,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, People as PeopleIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';

import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';

const ECA_CATEGORY_OPTIONS = [
  { value: 'club', label: 'Club' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'community_service', label: 'Community Service' },
  { value: 'leadership', label: 'Leadership' },
];

type ECAStatus = 'active' | 'inactive' | 'completed';

interface StaffOption {
  staffId: number;
  name: string;
  status?: string;
}

interface ECA {
  ecaId: number;
  name: string;
  category: string;
  coordinator?: string;
  coordinatorId?: number;
  status: ECAStatus;
  enrolledCount?: number;
  currentEnrollment?: number;
  capacity?: number;
  schedule?: string;
  subcategory?: string;
  description?: string;
}

interface ECAFormData {
  name: string;
  category: string;
  coordinatorId: string;
  status: ECAStatus;
  description: string;
  schedule: string;
  subcategory: string;
  capacity: string;
}

const emptyForm: ECAFormData = {
  name: '',
  category: 'club',
  coordinatorId: '',
  status: 'active',
  description: '',
  schedule: '',
  subcategory: '',
  capacity: '30',
};

export function ECAList() {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const canManageECA = ['School_Admin', 'ECA_Coordinator'].includes(user?.role || '');
  const canDeleteECA = user?.role === 'School_Admin';
  const [ecas, setEcas] = useState<ECA[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingECA, setEditingECA] = useState<ECA | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ECAFormData>(emptyForm);

  useEffect(() => {
    fetchECAs();
  }, [page, rowsPerPage, categoryFilter, statusFilter]);

  useEffect(() => {
    if (canManageECA) {
      fetchFormMetadata();
    } else {
      setStaffOptions([]);
      setCurrentAcademicYearId(null);
    }
  }, [canManageECA]);

  const fetchECAs = async () => {
    try {
      setLoading(true);
      const params: any = { page: page + 1, limit: rowsPerPage };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await apiClient.get('/eca/list', { params });
      setEcas(response.data?.data || []);
      setTotal(response.data?.meta?.total || 0);
    } catch (err) {
      setEcas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormMetadata = async () => {
    try {
      const [staffRes, yearRes] = await Promise.all([
        apiClient.get('/staff', { params: { status: 'active', limit: 100 } }).catch(() => null),
        apiClient.get('/academic/years/current').catch(() => null),
      ]);

      const staffList = Array.isArray(staffRes?.data?.data) ? staffRes?.data?.data : [];
      setStaffOptions(
        staffList.map((staff: any) => ({
          staffId: staff.staffId,
          name: [staff.firstNameEn, staff.middleNameEn, staff.lastNameEn].filter(Boolean).join(' ') || staff.staffCode || `Staff #${staff.staffId}`,
          status: staff.status,
        })).filter((staff: StaffOption) => Number.isFinite(staff.staffId))
      );

      const year = yearRes?.data?.data ?? yearRes?.data;
      setCurrentAcademicYearId(year?.academicYearId ?? null);
    } catch {
      setStaffOptions([]);
      setCurrentAcademicYearId(null);
    }
  };

  const defaultCoordinatorId = () => {
    const activeStaff = staffOptions.find((staff) => staff.status === 'active') ?? staffOptions[0];
    return activeStaff ? String(activeStaff.staffId) : '';
  };

  const getCategoryLabel = (value: string) => {
    return ECA_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? value;
  };

  const getCoordinatorLabel = (eca: ECA) => {
    if (eca.coordinator) return eca.coordinator;
    const coordinator = staffOptions.find((staff) => staff.staffId === eca.coordinatorId);
    return coordinator?.name ?? (eca.coordinatorId ? `Staff #${eca.coordinatorId}` : '-');
  };

  const handleOpenDialog = (eca?: ECA) => {
    if (eca) {
      setEditingECA(eca);
      setFormData({
        name: eca.name,
        category: eca.category || 'club',
        coordinatorId: eca.coordinatorId ? String(eca.coordinatorId) : defaultCoordinatorId(),
        status: eca.status || 'active',
        description: eca.description || '',
        schedule: eca.schedule || '',
        subcategory: eca.subcategory || '',
        capacity: eca.capacity ? String(eca.capacity) : '30',
      });
    } else {
      setEditingECA(null);
      setFormData({ ...emptyForm, coordinatorId: defaultCoordinatorId() });
    }
    setError('');
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const coordinatorId = Number(formData.coordinatorId);
      if (!formData.name.trim()) {
        setError('ECA name is required.');
        return;
      }
      if (!coordinatorId) {
        setError('Select a coordinator before saving.');
        return;
      }
      if (!editingECA && !currentAcademicYearId) {
        setError('Current academic year is required before creating an ECA.');
        return;
      }

      const payload: any = {
        name: formData.name.trim(),
        category: formData.category,
        coordinatorId,
        description: formData.description.trim() || undefined,
        schedule: formData.schedule.trim() || undefined,
        subcategory: formData.subcategory.trim() || undefined,
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
      };

      if (editingECA) {
        await apiClient.put(`/eca/${editingECA.ecaId}`, {
          ...payload,
          status: formData.status,
        });
        setSuccess(t('eca.ecaUpdatedSuccess'));
      } else {
        await apiClient.post('/eca', {
          ...payload,
          academicYearId: currentAcademicYearId,
        });
        setSuccess(t('eca.ecaCreatedSuccess'));
      }
      setOpenDialog(false);
      fetchECAs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('eca.failedToSaveEca'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('eca.confirmDelete'))) return;
    try {
      await apiClient.delete(`/eca/${id}`);
      setSuccess(t('eca.ecaDeletedSuccess'));
      fetchECAs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('eca.failedToDeleteEca'));
    }
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>{t('eca.title')}</Typography>
          {canManageECA && (
            <Button variant="contained" sx={S.BTN_PRIMARY} startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>{t('eca.createEca')}</Button>
          )}
        </Box>
      </Paper>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ ...S.GLASS, p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label={t('eca.category')} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <MenuItem value="">{t('eca.allCategories')}</MenuItem>
              {ECA_CATEGORY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label={t('eca.status')} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">{t('eca.allStatus')}</MenuItem>
              <MenuItem value="active">{t('eca.active')}</MenuItem>
              <MenuItem value="inactive">{t('eca.inactive')}</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ ...S.GLASS }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>{t('common.name')}</TableCell>
                <TableCell>{t('eca.category')}</TableCell>
                <TableCell>{t('eca.coordinator')}</TableCell>
                <TableCell align="center">{t('eca.enrolled')}</TableCell>
                <TableCell>{t('eca.status')}</TableCell>
                {canManageECA && <TableCell align="center">{t('common.actions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow sx={S.TR_HOVER}><TableCell colSpan={canManageECA ? 6 : 5} align="center" sx={S.TD}>{t('common.loading')}</TableCell></TableRow>
              ) : ecas.length === 0 ? (
                <TableRow sx={S.TR_HOVER}><TableCell colSpan={canManageECA ? 6 : 5} align="center" sx={S.TD}>{t('eca.noEcasFound')}</TableCell></TableRow>
              ) : (
                ecas.map((eca) => (
                  <TableRow key={eca.ecaId} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{eca.name}</TableCell>
                    <TableCell sx={S.TD}><Chip label={getCategoryLabel(eca.category)} size="small" /></TableCell>
                    <TableCell sx={S.TD}>{getCoordinatorLabel(eca)}</TableCell>
                    <TableCell align="center" sx={S.TD}>{eca.enrolledCount ?? eca.currentEnrollment ?? 0}</TableCell>
                    <TableCell sx={S.TD}><Chip label={eca.status} color={eca.status === 'active' ? 'success' : 'default'} size="small" /></TableCell>
                    {canManageECA && (
                      <TableCell align="center" sx={S.TD}>
                        <IconButton size="small" onClick={() => handleOpenDialog(eca)}><EditIcon fontSize="small" /></IconButton>
                        {canDeleteECA && (
                          <IconButton size="small" onClick={() => handleDelete(eca.ecaId)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                        )}
                        <IconButton size="small" onClick={() => navigate(`/eca/${eca.ecaId}/enrollments`)}><PeopleIcon fontSize="small" /></IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={total} page={page} onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingECA ? t('eca.editEca') : t('eca.createEca')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField label={t('eca.ecaName')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required fullWidth /></Grid>
            <Grid item xs={12} md={6}>
              <TextField select label={t('eca.category')} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required fullWidth>
                {ECA_CATEGORY_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select label={t('eca.coordinator')} value={formData.coordinatorId} onChange={(e) => setFormData({ ...formData, coordinatorId: e.target.value })} required fullWidth>
                {staffOptions.map((staff) => (
                  <MenuItem key={staff.staffId} value={String(staff.staffId)}>{staff.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField label={t('eca.schedule')} value={formData.schedule} onChange={(e) => setFormData({ ...formData, schedule: e.target.value })} fullWidth placeholder={t('eca.schedulePlaceholder')} /></Grid>
            <Grid item xs={12} md={6}><TextField label="Subcategory" value={formData.subcategory} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })} fullWidth /></Grid>
            <Grid item xs={12} md={6}><TextField label="Capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} fullWidth /></Grid>
            <Grid item xs={12} md={6}>
              <TextField select label={t('eca.status')} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as ECAStatus })} required fullWidth>
                <MenuItem value="active">{t('eca.active')}</MenuItem>
                <MenuItem value="inactive">{t('eca.inactive')}</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField label={t('eca.description')} multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth /></Grid>
          </Grid>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('eca.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" sx={S.BTN_PRIMARY}>{editingECA ? t('eca.update') : t('eca.create')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ECAList;

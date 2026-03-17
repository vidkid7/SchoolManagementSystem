/**
 * ECA List - Manage all Extra-Curricular Activities
 */

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Alert, Grid,
  useTheme,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, People as PeopleIcon } from '@mui/icons-material';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';

import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';

interface ECA {
  ecaId: number;
  name: string;
  category: string;
  coordinator: string;
  status: 'active' | 'inactive';
  enrolledCount: number;
  description?: string;
}

export function ECAList() {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
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
  const [formData, setFormData] = useState({ name: '', category: '', coordinator: '', status: 'active', description: '', schedule: '', venue: '' });

  useEffect(() => {
    fetchECAs();
  }, [page, rowsPerPage, categoryFilter, statusFilter]);

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

  const handleOpenDialog = (eca?: ECA) => {
    if (eca) {
      setEditingECA(eca);
      setFormData({ name: eca.name, category: eca.category, coordinator: eca.coordinator, status: eca.status, description: eca.description || '', schedule: '', venue: '' });
    } else {
      setEditingECA(null);
      setFormData({ name: '', category: '', coordinator: '', status: 'active', description: '', schedule: '', venue: '' });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingECA) {
        await apiClient.put(`/eca/${editingECA.ecaId}`, formData);
        setSuccess(t('eca.ecaUpdatedSuccess'));
      } else {
        await apiClient.post('/eca', formData);
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
          <Button variant="contained" sx={S.BTN_PRIMARY} startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>{t('eca.createEca')}</Button>
        </Box>
      </Paper>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ ...S.GLASS, p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label={t('eca.category')} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <MenuItem value="">{t('eca.allCategories')}</MenuItem>
              <MenuItem value="Sports">Sports</MenuItem>
              <MenuItem value="Arts">Arts</MenuItem>
              <MenuItem value="Music">Music</MenuItem>
              <MenuItem value="Drama">Drama</MenuItem>
              <MenuItem value="Debate">Debate</MenuItem>
              <MenuItem value="Science">Science</MenuItem>
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
                <TableCell align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow sx={S.TR_HOVER}><TableCell colSpan={6} align="center" sx={S.TD}>{t('common.loading')}</TableCell></TableRow>
              ) : ecas.length === 0 ? (
                <TableRow sx={S.TR_HOVER}><TableCell colSpan={6} align="center" sx={S.TD}>{t('eca.noEcasFound')}</TableCell></TableRow>
              ) : (
                ecas.map((eca) => (
                  <TableRow key={eca.ecaId} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{eca.name}</TableCell>
                    <TableCell sx={S.TD}><Chip label={eca.category} size="small" /></TableCell>
                    <TableCell sx={S.TD}>{eca.coordinator}</TableCell>
                    <TableCell align="center" sx={S.TD}>{eca.enrolledCount}</TableCell>
                    <TableCell sx={S.TD}><Chip label={eca.status} color={eca.status === 'active' ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <IconButton size="small" onClick={() => handleOpenDialog(eca)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(eca.ecaId)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => navigate(`/eca/${eca.ecaId}/enrollments`)}><PeopleIcon fontSize="small" /></IconButton>
                    </TableCell>
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
                <MenuItem value="Sports">Sports</MenuItem>
                <MenuItem value="Arts">Arts</MenuItem>
                <MenuItem value="Music">Music</MenuItem>
                <MenuItem value="Drama">Drama</MenuItem>
                <MenuItem value="Debate">Debate</MenuItem>
                <MenuItem value="Science">Science</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField label={t('eca.coordinator')} value={formData.coordinator} onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })} required fullWidth /></Grid>
            <Grid item xs={12} md={6}><TextField label={t('eca.schedule')} value={formData.schedule} onChange={(e) => setFormData({ ...formData, schedule: e.target.value })} fullWidth placeholder={t('eca.schedulePlaceholder')} /></Grid>
            <Grid item xs={12} md={6}><TextField label={t('eca.venue')} value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} fullWidth /></Grid>
            <Grid item xs={12} md={6}>
              <TextField select label={t('eca.status')} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} required fullWidth>
                <MenuItem value="active">{t('eca.active')}</MenuItem>
                <MenuItem value="inactive">{t('eca.inactive')}</MenuItem>
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

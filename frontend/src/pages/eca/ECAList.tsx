/**
 * ECA List - Manage all Extra-Curricular Activities
 */

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Alert, Grid } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, People as PeopleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

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
  const navigate = useNavigate();
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
      const response = await api.get('/eca/list', { params });
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
        await api.put(`/eca/${editingECA.ecaId}`, formData);
        setSuccess('ECA updated successfully');
      } else {
        await api.post('/eca', formData);
        setSuccess('ECA created successfully');
      }
      setOpenDialog(false);
      fetchECAs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save ECA');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/eca/${id}`);
      setSuccess('ECA deleted successfully');
      fetchECAs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete ECA');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Extra-Curricular Activities</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Create ECA</Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="Sports">Sports</MenuItem>
              <MenuItem value="Arts">Arts</MenuItem>
              <MenuItem value="Music">Music</MenuItem>
              <MenuItem value="Drama">Drama</MenuItem>
              <MenuItem value="Debate">Debate</MenuItem>
              <MenuItem value="Science">Science</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Coordinator</TableCell>
                <TableCell align="center">Enrolled</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
              ) : ecas.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">No ECAs found</TableCell></TableRow>
              ) : (
                ecas.map((eca) => (
                  <TableRow key={eca.ecaId}>
                    <TableCell>{eca.name}</TableCell>
                    <TableCell><Chip label={eca.category} size="small" /></TableCell>
                    <TableCell>{eca.coordinator}</TableCell>
                    <TableCell align="center">{eca.enrolledCount}</TableCell>
                    <TableCell><Chip label={eca.status} color={eca.status === 'active' ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell align="center">
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
        <DialogTitle>{editingECA ? 'Edit ECA' : 'Create ECA'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField label="ECA Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required fullWidth /></Grid>
            <Grid item xs={12} md={6}>
              <TextField select label="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required fullWidth>
                <MenuItem value="Sports">Sports</MenuItem>
                <MenuItem value="Arts">Arts</MenuItem>
                <MenuItem value="Music">Music</MenuItem>
                <MenuItem value="Drama">Drama</MenuItem>
                <MenuItem value="Debate">Debate</MenuItem>
                <MenuItem value="Science">Science</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}><TextField label="Coordinator" value={formData.coordinator} onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })} required fullWidth /></Grid>
            <Grid item xs={12} md={6}><TextField label="Schedule" value={formData.schedule} onChange={(e) => setFormData({ ...formData, schedule: e.target.value })} fullWidth placeholder="e.g., Mon & Wed 4-5 PM" /></Grid>
            <Grid item xs={12} md={6}><TextField label="Venue" value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} fullWidth /></Grid>
            <Grid item xs={12} md={6}>
              <TextField select label="Status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} required fullWidth>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField label="Description" multiline rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth /></Grid>
          </Grid>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">{editingECA ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ECAList;

/**
 * Fee Structures Management
 * Create, view, update, and delete fee structures
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface FeeStructure {
  feeStructureId: number;
  name: string;
  academicYearId: number;
  academicYearName?: string;
  classId?: number;
  className?: string;
  amount: number;
  dueDate: string;
  description?: string;
  isActive: boolean;
}

export function FeeStructures() {
  const navigate = useNavigate();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    academicYearId: '',
    classId: '',
    amount: '',
    dueDate: '',
    description: '',
  });

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      const response = await api.get('/finance/fee-structures');
      setFeeStructures(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch fee structures:', err);
      setFeeStructures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (fee?: FeeStructure) => {
    if (fee) {
      setEditingFee(fee);
      setFormData({
        name: fee.name,
        academicYearId: fee.academicYearId.toString(),
        classId: fee.classId?.toString() || '',
        amount: fee.amount.toString(),
        dueDate: fee.dueDate.split('T')[0],
        description: fee.description || '',
      });
    } else {
      setEditingFee(null);
      setFormData({
        name: '',
        academicYearId: '',
        classId: '',
        amount: '',
        dueDate: '',
        description: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFee(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      if (editingFee) {
        await api.put(`/finance/fee-structures/${editingFee.feeStructureId}`, formData);
        setSuccess('Fee structure updated successfully');
      } else {
        await api.post('/finance/fee-structures', formData);
        setSuccess('Fee structure created successfully');
      }
      handleCloseDialog();
      fetchFeeStructures();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save fee structure');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;

    try {
      await api.delete(`/finance/fee-structures/${id}`);
      setSuccess('Fee structure deleted successfully');
      fetchFeeStructures();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete fee structure');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Fee Structures
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Fee Structure
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Academic Year</TableCell>
                <TableCell>Class</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Loading...</TableCell>
                </TableRow>
              ) : feeStructures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No fee structures found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                feeStructures.map((fee) => (
                  <TableRow key={fee.feeStructureId}>
                    <TableCell>{fee.name}</TableCell>
                    <TableCell>{fee.academicYearName || fee.academicYearId}</TableCell>
                    <TableCell>{fee.className || fee.classId || 'All Classes'}</TableCell>
                    <TableCell align="right">NPR {fee.amount.toLocaleString()}</TableCell>
                    <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={fee.isActive ? 'Active' : 'Inactive'}
                        color={fee.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(fee)}
                        title="Edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(fee.feeStructureId)}
                        title="Delete"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/finance/fee-structures/${fee.feeStructureId}/assign`)}
                        title="Assign to Students"
                      >
                        <AssignIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFee ? 'Edit Fee Structure' : 'Create Fee Structure'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Fee Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Academic Year"
              select
              value={formData.academicYearId}
              onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
              required
              fullWidth
            >
              <MenuItem value="10">2025-2026</MenuItem>
              <MenuItem value="11">2024-2025</MenuItem>
            </TextField>
            <TextField
              label="Class (Optional)"
              select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              fullWidth
            >
              <MenuItem value="">All Classes</MenuItem>
              <MenuItem value="1">Class 1</MenuItem>
              <MenuItem value="2">Class 2</MenuItem>
              <MenuItem value="3">Class 3</MenuItem>
            </TextField>
            <TextField
              label="Amount (NPR)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
            />
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingFee ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FeeStructures;

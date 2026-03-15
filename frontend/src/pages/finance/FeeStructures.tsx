/**
 * Fee Structures Management
 * Create, view, update, and delete fee structures
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { useTranslation } from 'react-i18next';
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
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { useCurrentAcademicYear } from '../../hooks/useCurrentAcademicYear';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface FeeStructure {
  feeStructureId: number;
  name: string;
  academicYearId: number;
  academicYearName?: string;
  classId?: number;
  className?: string;
  amount: number;
  totalAmount?: number;
  dueDate: string;
  description?: string;
  isActive: boolean;
}

export function FeeStructures() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const { currentYear, academicYears } = useCurrentAcademicYear();
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
      const response = await apiClient.get('/finance/fee-structures');
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
        academicYearId: currentYear ? String(currentYear.academicYearId) : '',
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
        await apiClient.put(`/finance/fee-structures/${editingFee.feeStructureId}`, formData);
        setSuccess(t('finance.savedSuccessfully'));
      } else {
        await apiClient.post('/finance/fee-structures', formData);
        setSuccess(t('finance.savedSuccessfully'));
      }
      handleCloseDialog();
      fetchFeeStructures();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('finance.failedToLoad'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('finance.confirmDelete'))) return;

    try {
      await apiClient.delete(`/finance/fee-structures/${id}`);
      setSuccess(t('finance.deletedSuccessfully'));
      fetchFeeStructures();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('finance.failedToLoad'));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          {t('finance.feeStructures')}
        </Typography>
        <Button
          variant="contained" sx={S.BTN_PRIMARY}
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('finance.createFeeStructure')}
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ ...S.GLASS }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>{t('finance.feeName')}</TableCell>
                <TableCell>{t('finance.academicYear')}</TableCell>
                <TableCell>{t('finance.className')}</TableCell>
                <TableCell align="right">{t('finance.amount')}</TableCell>
                <TableCell>{t('finance.dueDate')}</TableCell>
                <TableCell>{t('common.active')}</TableCell>
                <TableCell align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={7} align="center" sx={S.TD}>{t('common.loading')}</TableCell>
                </TableRow>
              ) : feeStructures.length === 0 ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={7} align="center" sx={S.TD}>
                    {t('finance.noFeeStructures')}
                  </TableCell>
                </TableRow>
              ) : (
                feeStructures.map((fee) => (
                  <TableRow key={fee.feeStructureId} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{fee.name}</TableCell>
                    <TableCell sx={S.TD}>{fee.academicYearName || fee.academicYearId}</TableCell>
                    <TableCell sx={S.TD}>{fee.className || fee.classId || t('finance.allClasses')}</TableCell>
                    <TableCell align="right" sx={S.TD}>NPR {(fee.amount || fee.totalAmount || 0).toLocaleString()}</TableCell>
                    <TableCell sx={S.TD}>{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '—'}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip
                        label={fee.isActive ? t('common.active') : t('common.no')}
                        color={fee.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(fee)}
                        title={t('common.edit')}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(fee.feeStructureId)}
                        title={t('common.delete')}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/finance/fee-structures/${fee.feeStructureId}/assign`)}
                        title={t('finance.addPayment')}
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
          {editingFee ? t('finance.editFeeStructure') : t('finance.createFeeStructure')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('finance.feeName')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t('finance.academicYear')}
              select
              value={formData.academicYearId}
              onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
              required
              fullWidth
              helperText={t('finance.autoSetAcademicYear')}
            >
              {academicYears.length > 0 ? academicYears.map((y) => (
                <MenuItem key={y.academicYearId} value={String(y.academicYearId)}>
                  AY {y.name.replace('-', '/')} {y.isCurrent ? `(${t('common.current')})` : ''}
                </MenuItem>
              )) : currentYear ? (
                <MenuItem value={String(currentYear.academicYearId)}>
                  AY {currentYear.name.replace('-', '/')} ({t('common.current')})
                </MenuItem>
              ) : (
                <MenuItem value="" disabled>{t('common.loading')}</MenuItem>
              )}
            </TextField>
            <TextField
              label={t('finance.selectClassOptional')}
              select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              fullWidth
            >
              <MenuItem value="">{t('finance.allClasses')}</MenuItem>
              <MenuItem value="1">Class 1</MenuItem>
              <MenuItem value="2">Class 2</MenuItem>
              <MenuItem value="3">Class 3</MenuItem>
            </TextField>
            <TextField
              label={t('finance.amount')}
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t('finance.dueDate')}
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label={t('finance.description')}
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
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" sx={S.BTN_PRIMARY}>
            {editingFee ? t('common.save') : t('common.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FeeStructures;

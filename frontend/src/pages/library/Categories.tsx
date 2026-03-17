/**
 * Book Categories Management
 * Manage library book categories
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { C, useAdminStyles, R } from '../../theme/designTokens';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface Category {
  categoryId: number;
  name: string;
  description?: string;
  bookCount: number;
}

export function Categories() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/library/categories');
      setCategories(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingCategory) {
        await apiClient.put(`/library/categories/${editingCategory.categoryId}`, formData);
        setSuccess(t('library.categoryUpdatedSuccess'));
      } else {
        await apiClient.post('/library/categories', formData);
        setSuccess(t('library.categoryCreatedSuccess'));
      }
      setOpenDialog(false);
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('library.failedToSaveCategory'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('library.confirmDeleteCategory'))) return;

    try {
      await apiClient.delete(`/library/categories/${id}`);
      setSuccess(t('library.categoryDeletedSuccess'));
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('library.failedToDeleteCategory'));
    }
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            {t('library.bookCategories')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={S.BTN_PRIMARY}
          >
            {t('library.addCategory')}
          </Button>
        </Box>
      </Paper>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={S.GLASS}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>{t('library.categoryName')}</TableCell>
                <TableCell>{t('library.description')}</TableCell>
                <TableCell align="center">{t('library.booksCount')}</TableCell>
                <TableCell align="center">{t('library.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={4} align="center" sx={S.TD}>{t('library.loading')}</TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={4} align="center" sx={S.TD}>
                    {t('library.noCategoriesFound')}
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.categoryId} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{category.name}</TableCell>
                    <TableCell sx={S.TD}>{category.description || '-'}</TableCell>
                    <TableCell align="center" sx={S.TD}>{category.bookCount}</TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(category)}
                        title={t('library.edit')}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(category.categoryId)}
                        title={t('library.delete')}
                        color="error"
                        disabled={category.bookCount > 0}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? t('library.editCategory') : t('library.addCategory')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label={t('library.categoryName')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={t('library.description')}
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
          <Button onClick={() => setOpenDialog(false)}>{t('library.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" sx={S.BTN_PRIMARY}>
            {editingCategory ? t('library.update') : t('library.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Categories;

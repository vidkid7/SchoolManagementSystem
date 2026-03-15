/**
 * Grading Scheme Configuration
 * Configure grading rules and schemes
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
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
  TextField,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface GradeDefinition {
  grade: string;
  gradePoint: number;
  minPercentage: number;
  maxPercentage: number;
  description: string;
}

interface GradeScheme {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  grades: GradeDefinition[];
}

const defaultNEBScheme: GradeDefinition[] = [
  { grade: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 4.0, description: 'Outstanding' },
  { grade: 'A', minPercentage: 80, maxPercentage: 89, gradePoint: 3.6, description: 'Excellent' },
  { grade: 'B+', minPercentage: 70, maxPercentage: 79, gradePoint: 3.2, description: 'Very Good' },
  { grade: 'B', minPercentage: 60, maxPercentage: 69, gradePoint: 2.8, description: 'Good' },
  { grade: 'C+', minPercentage: 50, maxPercentage: 59, gradePoint: 2.4, description: 'Satisfactory' },
  { grade: 'C', minPercentage: 40, maxPercentage: 49, gradePoint: 2.0, description: 'Acceptable' },
  { grade: 'D', minPercentage: 35, maxPercentage: 39, gradePoint: 1.6, description: 'Basic' },
  { grade: 'E', minPercentage: 0, maxPercentage: 34, gradePoint: 0.0, description: 'Not Sufficient' },
];

export function GradingScheme() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [schemes, setSchemes] = useState<GradeScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<GradeScheme | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grades: defaultNEBScheme,
  });

  useEffect(() => {
    fetchGradingSchemes();
  }, []);

  const fetchGradingSchemes = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/system-settings/grading-schemes');
      const apiSchemes = response.data?.data || [];
      
      if (apiSchemes.length > 0) {
        setSchemes(apiSchemes);
      } else {
        setSchemes([{
          id: 'default',
          name: 'NEB Default Grading Scheme',
          description: 'National Examination Board standard grading',
          isDefault: true,
          isActive: true,
          grades: defaultNEBScheme,
        }]);
      }
    } catch (err) {
      console.error('Failed to fetch grading schemes:', err);
      setSchemes([{
        id: 'default',
        name: 'NEB Default Grading Scheme',
        description: 'National Examination Board standard grading',
        isDefault: true,
        isActive: true,
        grades: defaultNEBScheme,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (scheme?: GradeScheme) => {
    if (scheme) {
      setEditingScheme(scheme);
      setFormData({
        name: scheme.name,
        description: scheme.description || '',
        grades: scheme.grades,
      });
    } else {
      setEditingScheme(null);
      setFormData({
        name: '',
        description: '',
        grades: defaultNEBScheme,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingScheme(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      setError('');
      
      if (editingScheme && editingScheme.id !== 'default') {
        await apiClient.put(`/system-settings/grading-schemes/${editingScheme.id}`, {
          name: formData.name,
          description: formData.description,
          grades: formData.grades,
        });
        setSuccess(t('examinations.gradeSchemeUpdated'));
      } else {
        await apiClient.post('/system-settings/grading-schemes', {
          name: formData.name || 'Custom Grading Scheme',
          description: formData.description,
          grades: formData.grades,
          isDefault: false,
          isActive: true,
        });
        setSuccess(t('examinations.gradeSchemeCreated'));
      }

      handleCloseDialog();
      fetchGradingSchemes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('examinations.failedToSaveGradeScheme'));
    }
  };

  const handleDelete = async (id: string) => {
    if (id === 'default') {
      setError(t('examinations.cannotDeleteDefault'));
      return;
    }
    
    if (window.confirm(t('examinations.confirmDeleteGradeScheme'))) {
      try {
        await apiClient.delete(`/system-settings/grading-schemes/${id}`);
        setSuccess(t('examinations.gradeSchemeDeleted'));
        fetchGradingSchemes();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || t('examinations.failedToDeleteGradeScheme'));
      }
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm(t('examinations.confirmResetToNEB'))) {
      setFormData({
        name: 'NEB Default Grading Scheme',
        description: 'National Examination Board standard grading',
        grades: defaultNEBScheme,
      });
      setSuccess(t('examinations.resetToNEBSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const activeScheme = schemes.find(s => s.isActive) || schemes[0];
  const displayGrades = activeScheme?.grades || defaultNEBScheme;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={600}>
              {t('examinations.gradingSchemeConfiguration')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleResetToDefault}
              sx={S.BTN_OUTLINE}
            >
              {t('examinations.resetToNEBDefault')}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={S.BTN_PRIMARY}
            >
              {t('examinations.addGrade')}
            </Button>
          </Box>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Alert severity="info" sx={{ mb: 3 }}>
          {t('examinations.gradingSchemeInfo')}
        </Alert>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('examinations.grade')}</TableCell>
                <TableCell>{t('examinations.percentageRange')}</TableCell>
                <TableCell>{t('examinations.gradePoint')}</TableCell>
                <TableCell>{t('common.description')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayGrades.map((grade, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="h6" fontWeight={600}>
                      {grade.grade}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {grade.minPercentage}% - {grade.maxPercentage}%
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600}>
                      {grade.gradePoint.toFixed(1)}
                    </Typography>
                  </TableCell>
                  <TableCell>{grade.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {schemes.length > 1 && (
        <Paper sx={{ ...S.GLASS, p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('examinations.availableGradingSchemes')}
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('common.name')}</TableCell>
                  <TableCell>{t('common.description')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell align="center">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schemes.map((scheme) => (
                  <TableRow key={scheme.id}>
                    <TableCell>{scheme.name}</TableCell>
                    <TableCell>{scheme.description || '-'}</TableCell>
                    <TableCell>
                      {scheme.isDefault ? t('examinations.default') : scheme.isActive ? t('common.active') : t('examinations.inactive')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(scheme)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(scheme.id)}
                        disabled={scheme.isDefault}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingScheme ? t('examinations.editGradingScheme') : t('examinations.createGradingScheme')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={t('examinations.schemeName')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('examinations.schemeNamePlaceholder')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('common.description')}
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            {t('examinations.gradeDefinitions')}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('examinations.grade')}</TableCell>
                  <TableCell>{t('examinations.minPercentage')}</TableCell>
                  <TableCell>{t('examinations.maxPercentage')}</TableCell>
                  <TableCell>{t('examinations.gradePoint')}</TableCell>
                  <TableCell>{t('common.description')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.grades.map((grade, index) => (
                  <TableRow key={index}>
                    <TableCell>{grade.grade}</TableCell>
                    <TableCell>{grade.minPercentage}</TableCell>
                    <TableCell>{grade.maxPercentage}</TableCell>
                    <TableCell>{grade.gradePoint}</TableCell>
                    <TableCell>{grade.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={S.BTN_PRIMARY}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GradingScheme;

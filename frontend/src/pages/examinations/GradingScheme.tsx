/**
 * Grading Scheme Configuration
 * Configure grading rules and schemes
 */

import { useState, useEffect } from 'react';
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
import api from '../../config/api';

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
  { grade: 'NG', minPercentage: 0, maxPercentage: 34, gradePoint: 0.0, description: 'Not Graded' },
];

export function GradingScheme() {
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
      const response = await api.get('/system-settings/grading-schemes');
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
        await api.put(`/system-settings/grading-schemes/${editingScheme.id}`, {
          name: formData.name,
          description: formData.description,
          grades: formData.grades,
        });
        setSuccess('Grade scheme updated successfully!');
      } else {
        await api.post('/system-settings/grading-schemes', {
          name: formData.name || 'Custom Grading Scheme',
          description: formData.description,
          grades: formData.grades,
          isDefault: false,
          isActive: true,
        });
        setSuccess('Grade scheme created successfully!');
      }

      handleCloseDialog();
      fetchGradingSchemes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save grade scheme');
    }
  };

  const handleDelete = async (id: string) => {
    if (id === 'default') {
      setError('Cannot delete the default grading scheme');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this grade scheme?')) {
      try {
        await api.delete(`/system-settings/grading-schemes/${id}`);
        setSuccess('Grade scheme deleted successfully!');
        fetchGradingSchemes();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete grade scheme');
      }
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset to NEB default grading scheme?')) {
      setFormData({
        name: 'NEB Default Grading Scheme',
        description: 'National Examination Board standard grading',
        grades: defaultNEBScheme,
      });
      setSuccess('Reset to NEB default grading scheme!');
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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={600}>
              Grading Scheme Configuration
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleResetToDefault}
            >
              Reset to NEB Default
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Grade
            </Button>
          </Box>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Alert severity="info" sx={{ mb: 3 }}>
          This grading scheme follows the Nepal Education Board (NEB) standard. 
          Grades are automatically calculated based on percentage ranges.
        </Alert>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Grade</TableCell>
                <TableCell>Percentage Range</TableCell>
                <TableCell>Grade Point</TableCell>
                <TableCell>Description</TableCell>
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
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Available Grading Schemes
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {schemes.map((scheme) => (
                  <TableRow key={scheme.id}>
                    <TableCell>{scheme.name}</TableCell>
                    <TableCell>{scheme.description || '-'}</TableCell>
                    <TableCell>
                      {scheme.isDefault ? 'Default' : scheme.isActive ? 'Active' : 'Inactive'}
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
          {editingScheme ? 'Edit Grading Scheme' : 'Create Grading Scheme'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Scheme Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Custom Grading Scheme"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Grade Definitions
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Grade</TableCell>
                  <TableCell>Min %</TableCell>
                  <TableCell>Max %</TableCell>
                  <TableCell>Grade Point</TableCell>
                  <TableCell>Description</TableCell>
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
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GradingScheme;

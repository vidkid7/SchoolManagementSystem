/**
 * Academic Years Management Page
 * 
 * Manage academic years and terms
 */

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
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
  Chip,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface AcademicYear {
  academicYearId?: number;  // Database field name
  id?: number;              // Alternative field name
  name: string;
  startDateBS: string;
  endDateBS: string;
  startDateAD: string;
  endDateAD: string;
  isCurrent: boolean;
}

interface Term {
  termId?: number;      // Database field name
  id?: number;          // Alternative field name
  academicYearId: number;
  name: string;
  startDate: string;
  endDate: string;
  examStartDate?: string;
  examEndDate?: string;
}

export const AcademicYears = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [error, setError] = useState('');
  
  const termsRef = useRef<HTMLDivElement>(null);

  // Academic Year form
  const [yearForm, setYearForm] = useState({
    name: '',
    startDateBS: '',
    endDateBS: '',
    startDateAD: '',
    endDateAD: '',
    isCurrent: false,
  });

  // Term form
  const [termForm, setTermForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    examStartDate: '',
    examEndDate: '',
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const response = await api.get('/academic/years');
      const yearsData = response.data?.data || response.data;
      setAcademicYears(Array.isArray(yearsData) ? yearsData : []);
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
      setError('Failed to load academic years');
    } finally {
      setLoading(false);
    }
  };

  const fetchTerms = async (academicYearId: number) => {
    try {
      const response = await api.get(`/academic/terms?academicYearId=${academicYearId}`);
      const termsData = response.data?.data || response.data;
      setTerms(Array.isArray(termsData) ? termsData : []);
      
      // Scroll to terms section after a short delay to allow rendering
      setTimeout(() => {
        termsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error('Failed to fetch terms:', error);
      setError('Failed to load terms');
    }
  };

  const handleOpenDialog = (year?: AcademicYear) => {
    setEditMode(!!year);
    if (year) {
      const yearId = year.academicYearId || year.id;
      setEditId(yearId || null);
      setYearForm({
        name: year.name,
        startDateBS: year.startDateBS,
        endDateBS: year.endDateBS,
        // Convert ISO date to YYYY-MM-DD format for date input
        startDateAD: year.startDateAD ? new Date(year.startDateAD).toISOString().split('T')[0] : '',
        endDateAD: year.endDateAD ? new Date(year.endDateAD).toISOString().split('T')[0] : '',
        isCurrent: year.isCurrent,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditMode(false);
    setEditId(null);
    setYearForm({
      name: '',
      startDateBS: '',
      endDateBS: '',
      startDateAD: '',
      endDateAD: '',
      isCurrent: false,
    });
  };

  const handleOpenTermDialog = (yearId: number, term?: Term) => {
    setSelectedYearId(yearId);
    setEditMode(!!term);
    if (term) {
      const termId = term.termId || term.id;
      setEditId(termId || null);
      setTermForm({
        name: term.name,
        // Convert ISO date to YYYY-MM-DD format for date input
        startDate: term.startDate ? new Date(term.startDate).toISOString().split('T')[0] : '',
        endDate: term.endDate ? new Date(term.endDate).toISOString().split('T')[0] : '',
        examStartDate: term.examStartDate ? new Date(term.examStartDate).toISOString().split('T')[0] : '',
        examEndDate: term.examEndDate ? new Date(term.examEndDate).toISOString().split('T')[0] : '',
      });
    }
    setTermDialogOpen(true);
  };

  const handleCloseTermDialog = () => {
    setTermDialogOpen(false);
    setEditMode(false);
    setEditId(null);
    setSelectedYearId(null);
    setTermForm({
      name: '',
      startDate: '',
      endDate: '',
      examStartDate: '',
      examEndDate: '',
    });
  };

  const handleSaveYear = async () => {
    try {
      // Validate that all required fields are filled
      if (!yearForm.name || !yearForm.startDateBS || !yearForm.endDateBS || !yearForm.startDateAD || !yearForm.endDateAD) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate BS date format (YYYY-MM-DD)
      const bsDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!bsDateRegex.test(yearForm.startDateBS)) {
        setError('Start Date (BS) must be in YYYY-MM-DD format (e.g., 2081-01-01)');
        return;
      }
      if (!bsDateRegex.test(yearForm.endDateBS)) {
        setError('End Date (BS) must be in YYYY-MM-DD format (e.g., 2081-12-30)');
        return;
      }

      // Convert date strings to ISO format for backend validation
      const payload = {
        name: yearForm.name,
        startDateBS: yearForm.startDateBS,
        endDateBS: yearForm.endDateBS,
        startDateAD: new Date(yearForm.startDateAD).toISOString(),
        endDateAD: new Date(yearForm.endDateAD).toISOString(),
        isCurrent: yearForm.isCurrent,
      };

      console.log('Sending payload:', payload);

      if (editMode && editId) {
        await api.put('/academic/years', { academicYearId: editId, ...payload });
      } else {
        await api.post('/academic/years', payload);
      }
      handleCloseDialog();
      fetchAcademicYears();
    } catch (error: any) {
      console.error('Failed to save academic year:', error);
      console.error('Error response:', error.response?.data);
      
      // Display validation errors if available
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        setError(errorMessages);
      } else {
        setError(error.response?.data?.message || error.response?.data?.error || 'Failed to save academic year');
      }
    }
  };

  const handleSaveTerm = async () => {
    try {
      // Convert date strings to ISO format for backend validation
      const payload = {
        ...termForm,
        academicYearId: selectedYearId,
        startDate: termForm.startDate ? new Date(termForm.startDate).toISOString() : '',
        endDate: termForm.endDate ? new Date(termForm.endDate).toISOString() : '',
        examStartDate: termForm.examStartDate ? new Date(termForm.examStartDate).toISOString() : undefined,
        examEndDate: termForm.examEndDate ? new Date(termForm.examEndDate).toISOString() : undefined,
      };

      if (editMode && editId) {
        await api.put('/academic/terms', { termId: editId, ...payload });
      } else {
        await api.post('/academic/terms', payload);
      }
      handleCloseTermDialog();
      if (selectedYearId) {
        fetchTerms(selectedYearId);
      }
    } catch (error: any) {
      console.error('Failed to save term:', error);
      setError(error.response?.data?.message || 'Failed to save term');
    }
  };

  const currentYear = academicYears.find(y => y.isCurrent);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Academic Years Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Academic Year
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Current Academic Year Card */}
      {currentYear && (
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  Current Academic Year
                </Typography>
                <Typography variant="h6">
                  {currentYear.name}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {currentYear.startDateBS} - {currentYear.endDateBS}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Academic Years Table */}
      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Start Date (BS)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>End Date (BS)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Start Date (AD)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>End Date (AD)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : academicYears.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No academic years found
                  </TableCell>
                </TableRow>
              ) : (
                academicYears.map((year) => {
                  const yearId = year.academicYearId || year.id;
                  return (
                  <TableRow key={yearId} hover>
                    <TableCell>
                      <Typography fontWeight={year.isCurrent ? 600 : 400}>
                        {year.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{year.startDateBS}</TableCell>
                    <TableCell>{year.endDateBS}</TableCell>
                    <TableCell>{new Date(year.startDateAD).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(year.endDateAD).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {year.isCurrent ? (
                        <Chip label="Current" color="success" size="small" />
                      ) : (
                        <Chip label="Inactive" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant={selectedYearId === yearId ? "contained" : "outlined"}
                        startIcon={<CalendarIcon />}
                        onClick={() => {
                          if (yearId) {
                            setSelectedYearId(yearId);
                            fetchTerms(yearId);
                          }
                        }}
                        sx={{ mr: 1 }}
                      >
                        Terms
                      </Button>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(year)}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Terms Section */}
      {selectedYearId && (
        <Paper ref={termsRef} sx={{ mt: 3, p: 3, borderRadius: 2, border: 2, borderColor: 'primary.main' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={600} color="primary">
                Terms for Academic Year: {academicYears.find(y => (y.academicYearId || y.id) === selectedYearId)?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {academicYears.find(y => (y.academicYearId || y.id) === selectedYearId)?.startDateBS} to {academicYears.find(y => (y.academicYearId || y.id) === selectedYearId)?.endDateBS}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedYearId(null)}
              >
                Close
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleOpenTermDialog(selectedYearId)}
              >
                Add Term
              </Button>
            </Box>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Term Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Exam Period</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {terms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No terms found
                    </TableCell>
                  </TableRow>
                ) : (
                  terms.map((term) => {
                    const termId = term.termId || term.id;
                    return (
                    <TableRow key={termId} hover>
                      <TableCell>{term.name}</TableCell>
                      <TableCell>{new Date(term.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(term.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {term.examStartDate && term.examEndDate
                          ? `${new Date(term.examStartDate).toLocaleDateString()} - ${new Date(term.examEndDate).toLocaleDateString()}`
                          : 'Not set'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenTermDialog(selectedYearId, term)}
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Academic Year Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editMode ? 'Edit Academic Year' : 'Add Academic Year'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Name"
                fullWidth
                required
                value={yearForm.name}
                onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                placeholder="e.g., 2081-2082"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Start Date (BS)"
                fullWidth
                required
                value={yearForm.startDateBS}
                onChange={(e) => setYearForm({ ...yearForm, startDateBS: e.target.value })}
                placeholder="YYYY-MM-DD (e.g., 2081-01-01)"
                helperText="Format: YYYY-MM-DD"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="End Date (BS)"
                fullWidth
                required
                value={yearForm.endDateBS}
                onChange={(e) => setYearForm({ ...yearForm, endDateBS: e.target.value })}
                placeholder="YYYY-MM-DD (e.g., 2081-12-30)"
                helperText="Format: YYYY-MM-DD"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Start Date (AD)"
                type="date"
                fullWidth
                required
                value={yearForm.startDateAD}
                onChange={(e) => setYearForm({ ...yearForm, startDateAD: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="End Date (AD)"
                type="date"
                fullWidth
                required
                value={yearForm.endDateAD}
                onChange={(e) => setYearForm({ ...yearForm, endDateAD: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={yearForm.isCurrent}
                    onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })}
                  />
                }
                label="Set as Current Academic Year"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveYear}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Term Dialog */}
      <Dialog open={termDialogOpen} onClose={handleCloseTermDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editMode ? 'Edit Term' : 'Add Term'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Term Name"
                fullWidth
                value={termForm.name}
                onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                placeholder="e.g., First Term, Second Term"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={termForm.startDate}
                onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={termForm.endDate}
                onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Exam Start Date"
                type="date"
                fullWidth
                value={termForm.examStartDate}
                onChange={(e) => setTermForm({ ...termForm, examStartDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Exam End Date"
                type="date"
                fullWidth
                value={termForm.examEndDate}
                onChange={(e) => setTermForm({ ...termForm, examEndDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseTermDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTerm}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

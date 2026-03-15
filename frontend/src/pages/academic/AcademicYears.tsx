/**
 * Academic Years Management Page
 *
 * Academic years are managed automatically based on Nepal's Bikram Sambat calendar.
 * The system detects the current year on startup — no manual creation needed.
 * This page is read-only for academic year records; admins can still manage terms.
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
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
  FormControlLabel,
  Switch,
  useTheme,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  AutoAwesome as AutoIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { useCurrentAcademicYear, AcademicYear } from '../../hooks/useCurrentAcademicYear';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface Term {
  termId?: number;
  id?: number;
  academicYearId: number;
  name: string;
  startDate: string;
  endDate: string;
  examStartDate?: string;
  examEndDate?: string;
}

export const AcademicYears = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams();
  const { currentYear, academicYears, loading, error: hookError } = useCurrentAcademicYear();

  const [terms, setTerms] = useState<Term[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const termsRef = useRef<HTMLDivElement>(null);

  const [yearForm, setYearForm] = useState({
    name: '',
    startDateBS: '',
    endDateBS: '',
    startDateAD: '',
    endDateAD: '',
    isCurrent: false,
  });

  const [termForm, setTermForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    examStartDate: '',
    examEndDate: '',
  });

  useEffect(() => {
    if (hookError) setError(hookError);
  }, [hookError]);

  const fetchTerms = async (academicYearId: number) => {
    try {
      const response = await apiClient.get(`/academic/terms?academicYearId=${academicYearId}`);
      const termsData = response.data?.data || response.data;
      setTerms(Array.isArray(termsData) ? termsData : []);
      setTimeout(() => {
        termsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error('Failed to fetch terms:', err);
      setError('Failed to load terms');
    }
  };

  const handleOpenDialog = (year?: AcademicYear) => {
    setEditMode(!!year);
    if (year) {
      const yearId = year.academicYearId;
      setEditId(yearId || null);
      setYearForm({
        name: year.name,
        startDateBS: year.startDateBS,
        endDateBS: year.endDateBS,
        startDateAD: year.startDateAD ? new Date(year.startDateAD).toISOString().split('T')[0] : '',
        endDateAD: year.endDateAD ? new Date(year.endDateAD).toISOString().split('T')[0] : '',
        isCurrent: year.isCurrent,
      });
    } else {
      setEditId(null);
      setYearForm({
        name: '',
        startDateBS: '',
        endDateBS: '',
        startDateAD: '',
        endDateAD: '',
        isCurrent: false,
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
        startDate: term.startDate ? new Date(term.startDate).toISOString().split('T')[0] : '',
        endDate: term.endDate ? new Date(term.endDate).toISOString().split('T')[0] : '',
        examStartDate: term.examStartDate ? new Date(term.examStartDate).toISOString().split('T')[0] : '',
        examEndDate: term.examEndDate ? new Date(term.examEndDate).toISOString().split('T')[0] : '',
      });
    } else {
      setEditId(null);
      setTermForm({ name: '', startDate: '', endDate: '', examStartDate: '', examEndDate: '' });
    }
    setTermDialogOpen(true);
  };

  const handleCloseTermDialog = () => {
    setTermDialogOpen(false);
    setEditMode(false);
    setEditId(null);
    setSelectedYearId(null);
    setTermForm({ name: '', startDate: '', endDate: '', examStartDate: '', examEndDate: '' });
  };

  const handleSaveYear = async () => {
    try {
      if (!yearForm.name || !yearForm.startDateBS || !yearForm.endDateBS || !yearForm.startDateAD || !yearForm.endDateAD) {
        setError('Please fill in all required fields');
        return;
      }

      const bsDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!bsDateRegex.test(yearForm.startDateBS)) {
        setError('Start Date (BS) must be in YYYY-MM-DD format (e.g., 2081-01-01)');
        return;
      }
      if (!bsDateRegex.test(yearForm.endDateBS)) {
        setError('End Date (BS) must be in YYYY-MM-DD format (e.g., 2081-12-30)');
        return;
      }

      const payload = {
        name: yearForm.name,
        startDateBS: yearForm.startDateBS,
        endDateBS: yearForm.endDateBS,
        startDateAD: new Date(yearForm.startDateAD).toISOString(),
        endDateAD: new Date(yearForm.endDateAD).toISOString(),
        isCurrent: yearForm.isCurrent,
      };

      if (editMode && editId) {
        await apiClient.put('/academic/years', { academicYearId: editId, ...payload });
      } else {
        await apiClient.post('/academic/years', payload);
      }
      handleCloseDialog();
      window.location.reload(); // Reload to refresh academic years
    } catch (error: any) {
      console.error('Failed to save academic year:', error);
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
      const payload = {
        ...termForm,
        academicYearId: selectedYearId,
        startDate: termForm.startDate ? new Date(termForm.startDate).toISOString() : '',
        endDate: termForm.endDate ? new Date(termForm.endDate).toISOString() : '',
        examStartDate: termForm.examStartDate ? new Date(termForm.examStartDate).toISOString() : undefined,
        examEndDate: termForm.examEndDate ? new Date(termForm.examEndDate).toISOString() : undefined,
      };

      if (editMode && editId) {
        await apiClient.put('/academic/terms', { termId: editId, ...payload });
      } else {
        await apiClient.post('/academic/terms', payload);
      }
      handleCloseTermDialog();
      if (selectedYearId) fetchTerms(selectedYearId);
    } catch (err: any) {
      console.error('Failed to save term:', err);
      setError(err.response?.data?.message || 'Failed to save term');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate(`/academic`)}
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight={600}>
            {t('academicYears.title')}
          </Typography>
        </Box>
        <Button
          sx={S.BTN_PRIMARY}
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          {t('academicYears.addAcademicYear')}
        </Button>
      </Box>

      <Alert
        severity="info"
        icon={<AutoIcon />}
        sx={{ mb: 3 }}
      >
        {t('academicYears.autoDetectionInfo')}
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {currentYear && (
        <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${C.primary} 0%, ${C.purple} 100%)`, color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {t('academicYears.currentAcademicYear')}
                </Typography>
                <Typography variant="h6">
                  AY {currentYear.name.replace('-', '/')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {currentYear.startDateBS} – {currentYear.endDateBS}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Paper sx={{ ...S.GLASS }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>{t('academicYears.name')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('academicYears.startDateBS')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('academicYears.endDateBS')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('academicYears.startDateAD')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('academicYears.endDateAD')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('common.status')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">{t('common.loading')}</TableCell>
                </TableRow>
              ) : academicYears.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">{t('academicYears.noAcademicYearsFound')}</TableCell>
                </TableRow>
              ) : (
                academicYears.map((year: AcademicYear) => {
                  const yearId = year.academicYearId;
                  return (
                    <TableRow key={yearId} hover>
                      <TableCell>
                        <Typography fontWeight={year.isCurrent ? 600 : 400}>
                          AY {year.name.replace('-', '/')}
                        </Typography>
                      </TableCell>
                      <TableCell>{year.startDateBS}</TableCell>
                      <TableCell>{year.endDateBS}</TableCell>
                      <TableCell>{new Date(year.startDateAD).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(year.endDateAD).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {year.isCurrent ? (
                          <Chip label={t('academicYears.current')} color="success" size="small" />
                        ) : (
                          <Chip label={t('academicYears.inactive')} size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant={selectedYearId === yearId ? 'contained' : 'outlined'}
                          startIcon={<CalendarIcon />}
                          onClick={() => {
                            if (yearId) {
                              setSelectedYearId(yearId);
                              fetchTerms(yearId);
                            }
                          }}
                          sx={{ mr: 1 }}
                        >
                          {t('academicYears.terms')}
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

      {selectedYearId && (
        <Paper ref={termsRef} sx={{ ...S.GLASS, mt: 3, p: 3, border: 2, borderColor: 'primary.main' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={600} color="primary">
                {t('academicYears.termsFor')}: AY {academicYears.find((y: AcademicYear) => y.academicYearId === selectedYearId)?.name?.replace('-', '/')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {academicYears.find((y: AcademicYear) => y.academicYearId === selectedYearId)?.startDateBS} to{' '}
                {academicYears.find((y: AcademicYear) => y.academicYearId === selectedYearId)?.endDateBS}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" size="small" onClick={() => setSelectedYearId(null)}>
                {t('academicYears.close')}
              </Button>
              <Button
                sx={S.BTN_PRIMARY}
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleOpenTermDialog(selectedYearId)}
              >
                {t('academicYears.addTerm')}
              </Button>
            </Box>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academicYears.termName')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academicYears.startDate')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academicYears.endDate')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('academicYears.examPeriod')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {terms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">{t('academicYears.noTermsFound')}</TableCell>
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
                            ? `${new Date(term.examStartDate).toLocaleDateString()} – ${new Date(term.examEndDate).toLocaleDateString()}`
                            : t('academicYears.notSet')}
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editMode ? t('academicYears.editAcademicYear') : t('academicYears.addAcademicYear')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label={t('academicYears.name')}
                fullWidth
                required
                value={yearForm.name}
                onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                placeholder="e.g., 2081-2082"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={t('academicYears.startDateBS')}
                fullWidth
                required
                value={yearForm.startDateBS}
                onChange={(e) => setYearForm({ ...yearForm, startDateBS: e.target.value })}
                placeholder="YYYY-MM-DD (e.g., 2081-01-01)"
                helperText={t('academicYears.formatBSDate')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={t('academicYears.endDateBS')}
                fullWidth
                required
                value={yearForm.endDateBS}
                onChange={(e) => setYearForm({ ...yearForm, endDateBS: e.target.value })}
                placeholder="YYYY-MM-DD (e.g., 2081-12-30)"
                helperText={t('academicYears.formatBSDate')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={t('academicYears.startDateAD')}
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
                label={t('academicYears.endDateAD')}
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
                label={t('academicYears.setAsCurrent')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button sx={S.BTN_PRIMARY} onClick={handleSaveYear}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={termDialogOpen} onClose={handleCloseTermDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editMode ? t('academicYears.editTerm') : t('academicYears.addTerm')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label={t('academicYears.termName')}
                fullWidth
                value={termForm.name}
                onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                placeholder="e.g., First Term, Second Term"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={t('academicYears.startDate')}
                type="date"
                fullWidth
                value={termForm.startDate}
                onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={t('academicYears.endDate')}
                type="date"
                fullWidth
                value={termForm.endDate}
                onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={t('academicYears.examStartDate')}
                type="date"
                fullWidth
                value={termForm.examStartDate}
                onChange={(e) => setTermForm({ ...termForm, examStartDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={t('academicYears.examEndDate')}
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
          <Button onClick={handleCloseTermDialog}>{t('common.cancel')}</Button>
          <Button sx={S.BTN_PRIMARY} onClick={handleSaveTerm}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

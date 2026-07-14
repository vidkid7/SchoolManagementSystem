/**
 * Behavior Tracking - Record and monitor student behavior
 * For Class Teachers to track discipline and conduct
 */

import { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Grid,
  Card,
  CardContent,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { useTheme } from '@mui/material';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface BehaviorRecord {
  id: number;
  studentId: number;
  studentName: string;
  type: 'positive' | 'negative' | 'neutral';
  category: string;
  description: string;
  actionTaken?: string;
  date: string;
  recordedBy: string;
}

interface Student {
  studentId: number;
  firstNameEn: string;
  lastNameEn: string;
  rollNumber: string;
}

export function BehaviorTracking() {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const [records, setRecords] = useState<BehaviorRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    studentId: null as number | null,
    type: 'neutral' as 'positive' | 'negative' | 'neutral',
    category: '',
    description: '',
    actionTaken: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recordsRes, studentsRes] = await Promise.all([
        apiClient.get('/teachers/behavior-records'),
        apiClient.get('/teachers/my-class'),
      ]);
      setRecords(recordsRes.data?.data || []);
      setStudents(studentsRes.data?.data?.students || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await apiClient.post('/teachers/behavior-records', formData);
      setSuccess(t('teacher.behaviorRecordAdded'));
      setOpenDialog(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
      setFormData({
        studentId: null,
        type: 'neutral',
        category: '',
        description: '',
        actionTaken: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (err: any) {
      setError(t('portal.failedToLoadData'));
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      default: return 'default';
    }
  };

  const stats = {
    total: records.length,
    positive: records.filter((r) => r.type === 'positive').length,
    negative: records.filter((r) => r.type === 'negative').length,
    neutral: records.filter((r) => r.type === 'neutral').length,
  };

  return (
    <Box sx={{ mt: { xs: 7, sm: 8 } }}>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TrendingUpIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{t('teacher.behaviorTracking')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('teacher.behaviorTrackingSubtitle')}</Typography>
            </Box>
          </Box>
          <Button
            variant="contained" sx={S.BTN_PRIMARY}
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            {t('teacher.recordBehavior')}
          </Button>
        </Box>
      </Paper>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">{t('teacher.totalRecords')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 32, color: 'success.main' }} />
              <Typography variant="h4" fontWeight={700} color="success.main">{stats.positive}</Typography>
              <Typography variant="body2" color="text.secondary">{t('teacher.positive')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingDownIcon sx={{ fontSize: 32, color: 'error.main' }} />
              <Typography variant="h4" fontWeight={700} color="error.main">{stats.negative}</Typography>
              <Typography variant="body2" color="text.secondary">{t('teacher.negative')}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700}>{stats.neutral}</Typography>
              <Typography variant="body2" color="text.secondary">{t('teacher.neutral')}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: S.TH_BG }}>
            <TableRow>
              <TableCell>{t('common.date')}</TableCell>
              <TableCell>{t('portal.student')}</TableCell>
              <TableCell>{t('common.type')}</TableCell>
              <TableCell>{t('portal.categoryLabel')}</TableCell>
              <TableCell>{t('common.description')}</TableCell>
              <TableCell>{t('teacher.actionTaken')}</TableCell>
              <TableCell align="center">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow sx={S.TR_HOVER}>
                <TableCell colSpan={7} align="center" sx={S.TD}>{t('common.loading')}</TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow sx={S.TR_HOVER}>
                <TableCell colSpan={7} align="center" sx={S.TD}>
                  {t('teacher.noBehaviorRecords')}
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id} hover sx={S.TR_HOVER}>
                  <TableCell sx={S.TD}>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell sx={S.TD}>{record.studentName}</TableCell>
                  <TableCell sx={S.TD}>
                    <Chip
                      label={record.type}
                      color={getTypeColor(record.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={S.TD}>{record.category}</TableCell>
                  <TableCell sx={S.TD}>{record.description}</TableCell>
                  <TableCell sx={S.TD}>{record.actionTaken || '—'}</TableCell>
                  <TableCell align="center" sx={S.TD}>
                    <IconButton size="small" title="View Details">
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('teacher.recordStudentBehavior')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Autocomplete
              options={students}
              getOptionLabel={(option) => `${option.rollNumber} - ${option.firstNameEn} ${option.lastNameEn}`}
              onChange={(_, value) => setFormData({ ...formData, studentId: value?.studentId || null })}
              renderInput={(params) => (
                <TextField {...params} label={t('portal.student')} required />
              )}
            />

            <TextField
              label={t('common.type')}
              select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              required
              fullWidth
            >
              <MenuItem value="positive">{t('teacher.positive')}</MenuItem>
              <MenuItem value="negative">{t('teacher.negative')}</MenuItem>
              <MenuItem value="neutral">{t('teacher.neutral')}</MenuItem>
            </TextField>

            <TextField
              label={t('portal.categoryLabel')}
              select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              fullWidth
            >
              <MenuItem value="discipline">{t('portal.discipline')}</MenuItem>
              <MenuItem value="participation">{t('teacher.participation')}</MenuItem>
              <MenuItem value="homework">{t('teacher.homework')}</MenuItem>
              <MenuItem value="attendance">{t('portal.attendance')}</MenuItem>
              <MenuItem value="conduct">{t('teacher.conduct')}</MenuItem>
              <MenuItem value="achievement">{t('teacher.achievement')}</MenuItem>
              <MenuItem value="other">{t('portal.other')}</MenuItem>
            </TextField>

            <TextField
              label={t('common.description')}
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              fullWidth
              helperText={t('teacher.describeIncident')}
            />

            <TextField
              label={t('teacher.actionTaken')}
              multiline
              rows={2}
              value={formData.actionTaken}
              onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
              fullWidth
              helperText={t('teacher.actionTakenHelper')}
            />

            <TextField
              label={t('common.date')}
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleSubmit}
            variant="contained" sx={S.BTN_PRIMARY}
            disabled={!formData.studentId || !formData.description}
          >
            {t('teacher.recordBehavior')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BehaviorTracking;

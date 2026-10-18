/**
 * Admission List Page
 * Complete admission workflow management
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
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  PersonAdd as InquiryIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useSearchParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import api from '../../config/api';
import { useTranslation } from 'react-i18next';

interface Admission {
  admissionId: number;
  temporaryId: string;
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  applyingForClass: number;
  status: string;
  inquiryDate: string;
  phone?: string;
  email?: string;
}

const statusColors: Record<string, any> = {
  inquiry: 'info',
  applied: 'primary',
  test_scheduled: 'warning',
  tested: 'warning',
  interview_scheduled: 'warning',
  interviewed: 'warning',
  admitted: 'success',
  enrolled: 'success',
  rejected: 'error',
  withdrawn: 'default',
};



export function AdmissionList() {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const statusKeyMap: Record<string, string> = {
    inquiry: 'admissions.inquiry',
    applied: 'admissions.applied',
    test_scheduled: 'admissions.testScheduled',
    tested: 'admissions.tested',
    interview_scheduled: 'admissions.interviewScheduled',
    interviewed: 'admissions.interviewed',
    admitted: 'admissions.admitted',
    enrolled: 'admissions.enrolled',
    rejected: 'admissions.rejected',
    withdrawn: 'admissions.withdrawn',
  };

  const getStatusLabel = (status: string) => t(statusKeyMap[status] || status);

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [classFilter, setClassFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAdmissions();
  }, [statusFilter, classFilter]);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (classFilter) params.applyingForClass = classFilter;
      
      const response = await api.get('/admissions', { params });
      setAdmissions(response.data?.data || []);
    } catch (error: any) {
      console.error('Failed to fetch admissions:', error);
      setError(t('admissions.failedToLoadList'));
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, admission: Admission) => {
    setAnchorEl(event.currentTarget);
    setSelectedAdmission(admission);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = async (action: string) => {
    if (!selectedAdmission) return;
    const admissionId = selectedAdmission.admissionId;
    handleMenuClose();
    navigate(action === 'view' ? `/admissions/${admissionId}` : `/admissions/${admissionId}?action=${action}`);
  };

  const getAvailableActions = (status: string) => {
    const actions = [
      { label: t('admissions.viewDetails'), value: 'view', icon: <ViewIcon /> },
    ];

    switch (status) {
      case 'inquiry':
        actions.push({ label: t('admissions.convertToApplication'), value: 'convert', icon: <EditIcon /> });
        break;
      case 'applied':
        actions.push(
          { label: t('admissions.scheduleTest'), value: 'schedule-test', icon: <EditIcon /> },
          { label: t('admissions.scheduleInterview'), value: 'schedule-interview', icon: <EditIcon /> },
          { label: t('admissions.admitDirectly'), value: 'admit', icon: <EditIcon /> }
        );
        break;
      case 'test_scheduled':
        actions.push({ label: t('admissions.recordTestScore'), value: 'record-test', icon: <EditIcon /> });
        break;
      case 'tested':
        actions.push(
          { label: t('admissions.scheduleInterview'), value: 'schedule-interview', icon: <EditIcon /> },
          { label: t('admissions.admit'), value: 'admit', icon: <EditIcon /> }
        );
        break;
      case 'interview_scheduled':
        actions.push({ label: t('admissions.recordInterview'), value: 'record-interview', icon: <EditIcon /> });
        break;
      case 'interviewed':
        actions.push({ label: t('admissions.admit'), value: 'admit', icon: <EditIcon /> });
        break;
      case 'admitted':
        actions.push({ label: t('admissions.enrollStudent'), value: 'enroll', icon: <EditIcon /> });
        break;
    }

    if (!['enrolled', 'rejected', 'withdrawn'].includes(status)) {
      actions.push({ label: t('admissions.reject'), value: 'reject', icon: <EditIcon /> });
    }

    return actions;
  };

  const normalizedSearchQuery = searchQuery.trim().replace(/\s+/g, ' ').toLowerCase();
  const filteredAdmissions = admissions.filter((admission) => {
    if (!normalizedSearchQuery) return true;
    const fullName = `${admission.firstNameEn} ${admission.middleNameEn || ''} ${admission.lastNameEn}`
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    return (
      fullName.includes(normalizedSearchQuery) ||
      admission.temporaryId.toLowerCase().includes(normalizedSearchQuery) ||
      admission.phone?.includes(searchQuery.trim()) ||
      admission.email?.toLowerCase().includes(normalizedSearchQuery)
    );
  });

  return (
    <Box>
      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InquiryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={600}>
              {t('admissions.admissionManagement')}
            </Typography>
          </Box>
          <Button
            variant="contained" sx={S.BTN_PRIMARY}
            startIcon={<InquiryIcon />}
            onClick={() => navigate('/admissions/new')}
          >
            {t('admissions.newInquiry')}
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('admissions.search')}
              placeholder={t('admissions.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="admission-status-filter-label">{t('admissions.status')}</InputLabel>
              <Select
                id="admission-status-filter"
                labelId="admission-status-filter-label"
                value={statusFilter}
                label={t('admissions.status')}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">{t('admissions.allStatuses')}</MenuItem>
                {Object.keys(statusColors).map((value) => (
                  <MenuItem key={value} value={value}>{getStatusLabel(value)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="admission-class-filter-label">{t('admissions.class')}</InputLabel>
              <Select
                id="admission-class-filter"
                labelId="admission-class-filter-label"
                value={classFilter}
                label={t('admissions.class')}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <MenuItem value="">{t('admissions.allClasses')}</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                  <MenuItem key={cls} value={cls}>{t('common.class')} {cls}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>{t('admissions.id')}</TableCell>
                <TableCell>{t('admissions.name')}</TableCell>
                <TableCell>{t('admissions.class')}</TableCell>
                <TableCell>{t('admissions.contact')}</TableCell>
                <TableCell>{t('admissions.inquiryDate')}</TableCell>
                <TableCell>{t('admissions.status')}</TableCell>
                <TableCell align="center">{t('admissions.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAdmissions.length === 0 ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={7} align="center" sx={S.TD}>
                    <Typography color="text.secondary">
                      {t('admissions.noAdmissionsFound')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmissions.map((admission) => (
                  <TableRow key={admission.admissionId} hover sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{admission.temporaryId}</TableCell>
                    <TableCell sx={S.TD}>
                      {`${admission.firstNameEn} ${admission.middleNameEn || ''} ${admission.lastNameEn}`}
                    </TableCell>
                    <TableCell sx={S.TD}>{t('common.class')} {admission.applyingForClass}</TableCell>
                    <TableCell sx={S.TD}>
                      {admission.phone && <div>{admission.phone}</div>}
                      {admission.email && <div style={{ fontSize: '0.875rem', color: '#666' }}>{admission.email}</div>}
                    </TableCell>
                    <TableCell sx={S.TD}>
                      {new Date(admission.inquiryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={S.TD}>
                      <Chip
                        label={getStatusLabel(admission.status)}
                        color={statusColors[admission.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <IconButton
                        size="small"
                        aria-label={`${t('admissions.actions')} ${admission.temporaryId}`}
                        onClick={(e) => handleMenuOpen(e, admission)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedAdmission && getAvailableActions(selectedAdmission.status).map((action) => (
          <MenuItem key={action.value} onClick={() => handleAction(action.value)}>
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

export default AdmissionList;

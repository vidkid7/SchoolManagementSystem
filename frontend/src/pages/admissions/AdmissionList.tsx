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
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  PersonAdd as InquiryIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../config/api';

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

const statusLabels: Record<string, string> = {
  inquiry: 'Inquiry',
  applied: 'Applied',
  test_scheduled: 'Test Scheduled',
  tested: 'Tested',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  admitted: 'Admitted',
  enrolled: 'Enrolled',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export function AdmissionList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
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
      if (classFilter) params.class = classFilter;
      
      const response = await api.get('/admissions', { params });
      setAdmissions(response.data?.data || []);
    } catch (error: any) {
      console.error('Failed to fetch admissions:', error);
      setError('Failed to load admissions');
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
    
    handleMenuClose();
    
    switch (action) {
      case 'view':
        navigate(`/admissions/${selectedAdmission.admissionId}`);
        break;
      case 'convert':
        navigate(`/admissions/${selectedAdmission.admissionId}/convert`);
        break;
      case 'schedule-test':
        navigate(`/admissions/${selectedAdmission.admissionId}/schedule-test`);
        break;
      case 'record-test':
        navigate(`/admissions/${selectedAdmission.admissionId}/record-test`);
        break;
      case 'schedule-interview':
        navigate(`/admissions/${selectedAdmission.admissionId}/schedule-interview`);
        break;
      case 'record-interview':
        navigate(`/admissions/${selectedAdmission.admissionId}/record-interview`);
        break;
      case 'admit':
        navigate(`/admissions/${selectedAdmission.admissionId}/admit`);
        break;
      case 'enroll':
        navigate(`/admissions/${selectedAdmission.admissionId}/enroll`);
        break;
      case 'reject':
        navigate(`/admissions/${selectedAdmission.admissionId}/reject`);
        break;
    }
  };

  const getAvailableActions = (status: string) => {
    const actions = [
      { label: 'View Details', value: 'view', icon: <ViewIcon /> },
    ];

    switch (status) {
      case 'inquiry':
        actions.push({ label: 'Convert to Application', value: 'convert', icon: <EditIcon /> });
        break;
      case 'applied':
        actions.push(
          { label: 'Schedule Test', value: 'schedule-test', icon: <EditIcon /> },
          { label: 'Schedule Interview', value: 'schedule-interview', icon: <EditIcon /> },
          { label: 'Admit Directly', value: 'admit', icon: <EditIcon /> }
        );
        break;
      case 'test_scheduled':
        actions.push({ label: 'Record Test Score', value: 'record-test', icon: <EditIcon /> });
        break;
      case 'tested':
        actions.push(
          { label: 'Schedule Interview', value: 'schedule-interview', icon: <EditIcon /> },
          { label: 'Admit', value: 'admit', icon: <EditIcon /> }
        );
        break;
      case 'interview_scheduled':
        actions.push({ label: 'Record Interview', value: 'record-interview', icon: <EditIcon /> });
        break;
      case 'interviewed':
        actions.push({ label: 'Admit', value: 'admit', icon: <EditIcon /> });
        break;
      case 'admitted':
        actions.push({ label: 'Enroll Student', value: 'enroll', icon: <EditIcon /> });
        break;
    }

    if (!['enrolled', 'rejected', 'withdrawn'].includes(status)) {
      actions.push({ label: 'Reject', value: 'reject', icon: <EditIcon /> });
    }

    return actions;
  };

  const filteredAdmissions = admissions.filter((admission) => {
    if (!searchQuery) return true;
    const fullName = `${admission.firstNameEn} ${admission.middleNameEn || ''} ${admission.lastNameEn}`.toLowerCase();
    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      admission.temporaryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admission.phone?.includes(searchQuery) ||
      admission.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InquiryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={600}>
              Admission Management
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<InquiryIcon />}
            onClick={() => navigate('/admissions/new')}
          >
            New Inquiry
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Name, ID, Phone, Email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={classFilter}
                label="Class"
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <MenuItem value="">All Classes</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                  <MenuItem key={cls} value={cls}>Class {cls}</MenuItem>
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
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Inquiry Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAdmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">
                      No admissions found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmissions.map((admission) => (
                  <TableRow key={admission.admissionId} hover>
                    <TableCell>{admission.temporaryId}</TableCell>
                    <TableCell>
                      {`${admission.firstNameEn} ${admission.middleNameEn || ''} ${admission.lastNameEn}`}
                    </TableCell>
                    <TableCell>Class {admission.applyingForClass}</TableCell>
                    <TableCell>
                      {admission.phone && <div>{admission.phone}</div>}
                      {admission.email && <div style={{ fontSize: '0.875rem', color: '#666' }}>{admission.email}</div>}
                    </TableCell>
                    <TableCell>
                      {new Date(admission.inquiryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[admission.status] || admission.status}
                        color={statusColors[admission.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
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

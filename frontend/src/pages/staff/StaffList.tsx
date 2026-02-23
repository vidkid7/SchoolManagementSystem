/**
 * Staff List Page
 * 
 * Displays list of staff with filters and actions
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Avatar,
  alpha,
  useTheme,
  InputAdornment,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  School as SchoolIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Paper);
const MotionBox = motion.create(Box);

interface Staff {
  staffId: number;
  staffCode: string;
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  position: string;
  department: string;
  category: string;
  status: 'active' | 'inactive' | 'on_leave';
  photoUrl?: string;
  phone?: string;
  email?: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; labelKey: string }> = {
  active: { color: '#10b981', bg: '#10b981', labelKey: 'staff.active' },
  inactive: { color: '#6b7280', bg: '#6b7280', labelKey: 'staff.inactive' },
  on_leave: { color: '#f59e0b', bg: '#f59e0b', labelKey: 'staff.onLeave' },
};

const StatCard = ({ icon, label, value, color, delay }: { icon: React.ReactNode; label: string; value: number | string; color: string; delay: number }) => {
  const theme = useTheme();
  return (
    <MotionCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
      sx={{ 
        p: 3, 
        borderRadius: 3, 
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 3,
            backgroundColor: alpha(color, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: color, lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
      </Box>
    </MotionCard>
  );
};

export const StaffList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchStaff();
  }, [page, rowsPerPage, search, departmentFilter, positionFilter, statusFilter]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        _t: Date.now().toString(),
        ...(search && { search }),
        ...(departmentFilter && { department: departmentFilter }),
        ...(positionFilter && { position: positionFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await apiClient.get(`/api/v1/staff?${params}`);
      setStaff(response.data.data || []);
      setTotal(response.data.meta?.total ?? response.data.total ?? 0);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    return STATUS_CONFIG[status]?.color || '#6b7280';
  };

  const getStatusBg = (status: string) => {
    return STATUS_CONFIG[status]?.bg || '#6b7280';
  };

  const clearFilters = () => {
    setSearch('');
    setDepartmentFilter('');
    setPositionFilter('');
    setStatusFilter('');
  };

  const hasFilters = search || departmentFilter || positionFilter || statusFilter;

  const handleDelete = async (staffId: number) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) {
      return;
    }
    try {
      await apiClient.delete(`/api/v1/staff/${staffId}`);
      fetchStaff();
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header Section */}
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          p: 3,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
            }}
          >
            <PeopleIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.25 }}>
              {t('staff.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('staff.totalStaff')}: <strong>{total}</strong>
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/staff/create')}
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            py: 1.5,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
            }
          }}
        >
          {t('staff.addStaff')}
        </Button>
      </MotionBox>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PeopleIcon sx={{ color: '#10b981', fontSize: 24 }} />}
            label={t('staff.active')}
            value={staff.filter(s => s.status === 'active').length}
            color="#10b981"
            delay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PeopleIcon sx={{ color: '#6b7280', fontSize: 24 }} />}
            label={t('staff.inactive')}
            value={staff.filter(s => s.status === 'inactive').length}
            color="#6b7280"
            delay={0.1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<SchoolIcon sx={{ color: '#f59e0b', fontSize: 24 }} />}
            label={t('staff.onLeave')}
            value={staff.filter(s => s.status === 'on_leave').length}
            color="#f59e0b"
            delay={0.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PeopleIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />}
            label={t('staff.totalStaff')}
            value={total}
            color={theme.palette.primary.main}
            delay={0.3}
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        sx={{ p: 3, mb: 4, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <FilterIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t('reports.filters')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label={t('staff.search')}
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ 
              minWidth: 280,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                transition: 'all 0.2s ease',
                '&:hover': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                  }
                }
              }
            }}
            placeholder={t('staff.searchPlaceholder')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t('staff.department')}</InputLabel>
            <Select
              value={departmentFilter}
              label={t('staff.department')}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              sx={{ borderRadius: 2.5 }}
            >
              <MenuItem value="">{t('staff.all')}</MenuItem>
              <MenuItem value="academic">{t('staff.departments.academic')}</MenuItem>
              <MenuItem value="administration">{t('staff.departments.administration')}</MenuItem>
              <MenuItem value="support">{t('staff.departments.support')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t('staff.position')}</InputLabel>
            <Select
              value={positionFilter}
              label={t('staff.position')}
              onChange={(e) => setPositionFilter(e.target.value)}
              sx={{ borderRadius: 2.5 }}
            >
              <MenuItem value="">{t('staff.all')}</MenuItem>
              <MenuItem value="principal">{t('staff.positions.principal')}</MenuItem>
              <MenuItem value="vice_principal">{t('staff.positions.vicePrincipal')}</MenuItem>
              <MenuItem value="teacher">{t('staff.positions.teacher')}</MenuItem>
              <MenuItem value="accountant">{t('staff.positions.accountant')}</MenuItem>
              <MenuItem value="librarian">{t('staff.positions.librarian')}</MenuItem>
              <MenuItem value="support_staff">{t('staff.positions.supportStaff')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t('staff.status')}</InputLabel>
            <Select
              value={statusFilter}
              label={t('staff.status')}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ borderRadius: 2.5 }}
            >
              <MenuItem value="">{t('staff.all')}</MenuItem>
              <MenuItem value="active">{t('staff.active')}</MenuItem>
              <MenuItem value="inactive">{t('staff.inactive')}</MenuItem>
              <MenuItem value="on_leave">{t('staff.onLeave')}</MenuItem>
            </Select>
          </FormControl>

          {hasFilters && (
            <Button
              variant="outlined"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
              sx={{ 
                borderRadius: 2.5, 
                textTransform: 'none',
                fontWeight: 500,
                borderColor: alpha(theme.palette.error.main, 0.5),
                color: theme.palette.error.main,
                '&:hover': {
                  borderColor: theme.palette.error.main,
                  bgcolor: alpha(theme.palette.error.main, 0.05),
                }
              }}
            >
              {t('staff.clearFilters')}
            </Button>
          )}
        </Box>
      </MotionCard>

      {/* Staff Table */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.03) }}>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>{t('staff.photo')}</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>{t('staff.staffId')}</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>{t('staff.title')}</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>{t('staff.position')}</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>{t('staff.department')}</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>{t('staff.contactNumber')}</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>{t('staff.email')}</TableCell>
                <TableCell sx={{ fontWeight: 600, py: 2 }}>{t('staff.status')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>{t('staff.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">{t('staff.loading')}</Typography>
                  </TableCell>
                </TableRow>
              ) : !staff || staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <PeopleIcon sx={{ fontSize: 48, color: alpha(theme.palette.text.secondary, 0.3), mb: 2 }} />
                      <Typography color="text.secondary">{t('staff.noStaffFound')}</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((member) => (
                  <TableRow 
                    key={member.staffId} 
                    hover 
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: alpha(theme.palette.primary.main, 0.03),
                        transform: 'scale(1.005)',
                      },
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <TableCell>
                      <Avatar
                        src={member.photoUrl}
                        alt={`${member.firstNameEn} ${member.lastNameEn}`}
                        sx={{ 
                          width: 44, 
                          height: 44,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          border: `2px solid ${theme.palette.background.paper}`,
                        }}
                      >
                        {member.firstNameEn?.[0] || 'S'}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {member.staffCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {member.firstNameEn} {member.lastNameEn}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(`staff.positions.${member.position}`) || member.position}
                        size="small"
                        sx={{
                          borderRadius: 2,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {t(`staff.departments.${member.department}`) || member.department}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {member.phone || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                        {member.email || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(STATUS_CONFIG[member.status]?.labelKey) || member.status}
                        size="small"
                        sx={{
                          borderRadius: 2,
                          backgroundColor: alpha(getStatusBg(member.status), 0.12),
                          color: getStatusColor(member.status),
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/staff/${member.staffId}`)}
                          title={t('staff.viewDetails')}
                          sx={{ 
                            color: 'primary.main',
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            transition: 'all 0.2s ease',
                            '&:hover': { 
                              bgcolor: alpha(theme.palette.primary.main, 0.15),
                              transform: 'scale(1.1)',
                            }
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/staff/${member.staffId}/edit`)}
                          title={t('staff.edit')}
                          sx={{ 
                            color: '#6b7280',
                            bgcolor: alpha('#6b7280', 0.08),
                            transition: 'all 0.2s ease',
                            '&:hover': { 
                              bgcolor: alpha('#6b7280', 0.15),
                              transform: 'scale(1.1)',
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(member.staffId)}
                          title={t('common.delete')}
                          sx={{ 
                            color: 'error.main',
                            bgcolor: alpha(theme.palette.error.main, 0.08),
                            transition: 'all 0.2s ease',
                            '&:hover': { 
                              bgcolor: alpha(theme.palette.error.main, 0.15),
                              transform: 'scale(1.1)',
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        {member.position === 'teacher' && (
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/staff/${member.staffId}/assignments`)}
                            title={t('staff.manageAssignments')}
                            sx={{ 
                              color: 'secondary.main',
                              bgcolor: alpha(theme.palette.secondary.main, 0.08),
                              transition: 'all 0.2s ease',
                              '&:hover': { 
                                bgcolor: alpha(theme.palette.secondary.main, 0.15),
                                transform: 'scale(1.1)',
                              }
                            }}
                          >
                            <AssignmentIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ 
            borderTop: `1px solid ${theme.palette.divider}`,
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontWeight: 500,
            }
          }}
        />
      </MotionCard>
    </Box>
  );
};

/**
 * User Management Page
 * 
 * Manage user accounts, roles, and permissions
 */

import { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Snackbar,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  LockReset as ResetPasswordIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  History as HistoryIcon,
  People as PeopleIcon,
  PersonOff as PersonOffIcon,
  GppBad as SuspendedIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';

interface User {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  roleName: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
}

interface Role {
  id: number;
  name: string;
  displayName: string;
  permissions: string[];
}

interface UserActivity {
  id: number;
  action: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export const UserManagement = () => {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    roleId: '',
    status: 'active' as 'active' | 'inactive' | 'suspended',
  });

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchStats();
  }, [page, rowsPerPage, search, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const response = await apiClient.get(`/api/v1/users?${params}`);
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get('/api/v1/config/roles');
      setRoles(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/v1/users/stats');
      if (response.data.data) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUserActivity = async (userId: number) => {
    try {
      const response = await apiClient.get(`/api/v1/users/${userId}/activity`);
      setUserActivity(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch user activity:', error);
      setUserActivity([]);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setFormMode('edit');
      setSelectedUser(user);
      setUserForm({
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        password: '',
        roleId: user.role,
        status: user.status,
      });
    } else {
      setFormMode('create');
      setSelectedUser(null);
      setUserForm({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        password: '',
        roleId: '',
        status: 'active',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async () => {
    try {
      if (formMode === 'create') {
        await apiClient.post('/api/v1/users', userForm);
        setSnackbar({ open: true, message: t('userManagement.createSuccess'), severity: 'success' });
      } else {
        await apiClient.put(`/api/v1/users/${selectedUser?.userId}`, userForm);
        setSnackbar({ open: true, message: t('userManagement.updateSuccess'), severity: 'success' });
      }
      handleCloseDialog();
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error?.message || 'Operation failed', severity: 'error' });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm(t('userManagement.confirmDelete'))) return;
    try {
      await apiClient.delete(`/api/v1/users/${userId}`);
      setSnackbar({ open: true, message: t('userManagement.deleteSuccess'), severity: 'success' });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error?.message || 'Failed to delete user', severity: 'error' });
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      await apiClient.post(`/api/v1/users/${userId}/reset-password`);
      setSnackbar({ open: true, message: t('userManagement.resetPasswordSuccess'), severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to reset password', severity: 'error' });
    }
    setAnchorEl(null);
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await apiClient.put(`/api/v1/users/${userId}`, { status: newStatus });
      setSnackbar({ open: true, message: t('userManagement.statusUpdated'), severity: 'success' });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
    setAnchorEl(null);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
    setAnchorEl(null);
  };

  const handleViewActivity = (user: User) => {
    setSelectedUser(user);
    fetchUserActivity(user.userId);
    setActivityDialogOpen(true);
    setAnchorEl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PeopleIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{t('userManagement.title')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('userManagement.subtitle')}</Typography>
            </Box>
          </Box>
          <Button
            variant="contained" sx={S.BTN_PRIMARY}
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            {t('userManagement.addUser')}
          </Button>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>{t('userManagement.totalUsers')}</Typography>
                  <Typography variant="h4">{stats.total}</Typography>
                </Box>
                <Box sx={{ backgroundColor: C.primaryBg, color: 'primary.main', p: 1.5, borderRadius: R.lg }}>
                  <PeopleIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>{t('userManagement.activeUsers')}</Typography>
                  <Typography variant="h4" color="success.main">{stats.active}</Typography>
                </Box>
                <Box sx={{ backgroundColor: C.successBg, color: 'success.main', p: 1.5, borderRadius: R.lg }}>
                  <ActivateIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>{t('userManagement.inactiveUsers')}</Typography>
                  <Typography variant="h4" color="text.secondary">{stats.inactive}</Typography>
                </Box>
                <Box sx={{ backgroundColor: C.warningBg, color: 'warning.main', p: 1.5, borderRadius: R.lg }}>
                  <PersonOffIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ ...S.GLASS }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>{t('userManagement.suspended')}</Typography>
                  <Typography variant="h4" color="error.main">{stats.suspended}</Typography>
                </Box>
                <Box sx={{ backgroundColor: C.dangerBg, color: 'error.main', p: 1.5, borderRadius: R.lg }}>
                  <SuspendedIcon />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ ...S.GLASS, p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label={t('common.search')}
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: <SearchIcon color="action" />,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('userManagement.role')}</InputLabel>
            <Select
              value={roleFilter}
              label={t('userManagement.role')}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.name}>
                  {role.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('userManagement.status')}</InputLabel>
            <Select
              value={statusFilter}
              label={t('userManagement.status')}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              <MenuItem value="active">{t('userManagement.active')}</MenuItem>
              <MenuItem value="inactive">{t('userManagement.inactive')}</MenuItem>
              <MenuItem value="suspended">{t('userManagement.suspended')}</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined" sx={S.BTN_OUTLINE}
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
          >
            {t('common.refresh')}
          </Button>
        </Box>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: S.TH_BG }}>
            <TableRow>
              <TableCell>{t('userManagement.user')}</TableCell>
              <TableCell>{t('common.email')}</TableCell>
              <TableCell>{t('userManagement.role')}</TableCell>
              <TableCell>{t('userManagement.status')}</TableCell>
              <TableCell>{t('userManagement.lastLogin')}</TableCell>
              <TableCell>{t('common.created')}</TableCell>
              <TableCell align="right">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow sx={S.TR_HOVER}>
                <TableCell colSpan={7} align="center" sx={S.TD}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow sx={S.TR_HOVER}>
                <TableCell colSpan={7} align="center" sx={S.TD}>
                  {t('userManagement.noUsersFound')}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.userId} hover sx={S.TR_HOVER}>
                  <TableCell sx={S.TD}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.firstName} />
                        ) : (
                          getInitials(user.firstName, user.lastName)
                        )}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{user.username}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={S.TD}>{user.email}</TableCell>
                  <TableCell sx={S.TD}>
                    <Chip label={user.roleName} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={S.TD}>
                    <Chip
                      label={user.status}
                      color={getStatusColor(user.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={S.TD}>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : t('userManagement.never')}
                  </TableCell>
                  <TableCell sx={S.TD}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right" sx={S.TD}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setSelectedUser(user);
                        setAnchorEl(e.currentTarget);
                      }}
                    >
                      <MoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={-1}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => selectedUser && handleViewDetails(selectedUser)}>
          <ListItemIcon><ViewIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('userManagement.viewDetails')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleOpenDialog(selectedUser!); setAnchorEl(null); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('userManagement.edit')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedUser && handleResetPassword(selectedUser.userId)}>
          <ListItemIcon><ResetPasswordIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('userManagement.resetPassword')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedUser && handleViewActivity(selectedUser)}>
          <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
          <ListItemText>{t('userManagement.viewActivity')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => selectedUser && handleToggleStatus(selectedUser.userId, selectedUser.status)}>
          <ListItemIcon>
            {selectedUser?.status === 'active' ? <BlockIcon fontSize="small" /> : <ActivateIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedUser?.status === 'active' ? t('userManagement.deactivate') : t('userManagement.activate')}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedUser && handleDeleteUser(selectedUser.userId)} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>{t('userManagement.delete')}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {formMode === 'create' ? t('userManagement.addUser') : t('userManagement.editUser')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label={t('userManagement.firstName')}
                  fullWidth
                  required
                  value={userForm.firstName}
                  onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={t('userManagement.lastName')}
                  fullWidth
                  required
                  value={userForm.lastName}
                  onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              label={t('userManagement.username')}
              fullWidth
              required
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              disabled={formMode === 'edit'}
            />
            <TextField
              label={t('common.email')}
              fullWidth
              required
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            />
            <TextField
              label={t('userManagement.phone')}
              fullWidth
              value={userForm.phone}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
            />
            {formMode === 'create' && (
              <TextField
                label={t('userManagement.password')}
                fullWidth
                required
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
            )}
            <FormControl fullWidth required>
              <InputLabel>{t('userManagement.role')}</InputLabel>
              <Select
                value={userForm.roleId}
                label={t('userManagement.role')}
                onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.name}>
                    {role.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('userManagement.status')}</InputLabel>
              <Select
                value={userForm.status}
                label={t('userManagement.status')}
                onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
              >
                <MenuItem value="active">{t('userManagement.active')}</MenuItem>
                <MenuItem value="inactive">{t('userManagement.inactive')}</MenuItem>
                <MenuItem value="suspended">{t('userManagement.suspended')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('userManagement.cancel')}</Button>
          <Button
            variant="contained" sx={S.BTN_PRIMARY}
            onClick={handleSubmit}
            disabled={!userForm.username || !userForm.email || !userForm.firstName || !userForm.roleId}
          >
            {formMode === 'create' ? t('userManagement.create') : t('userManagement.update')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('userManagement.userDetails')}</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}>
                  {getInitials(selectedUser.firstName, selectedUser.lastName)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{selectedUser.username}
                  </Typography>
                </Box>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">{t('common.email')}</Typography>
                  <Typography variant="body1">{selectedUser.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">{t('userManagement.phone')}</Typography>
                  <Typography variant="body1">{selectedUser.phone || t('common.na')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">{t('userManagement.role')}</Typography>
                  <Chip label={selectedUser.roleName} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">{t('userManagement.status')}</Typography>
                  <Chip label={selectedUser.status} color={getStatusColor(selectedUser.status)} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">{t('userManagement.lastLogin')}</Typography>
                  <Typography variant="body1">
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : t('userManagement.never')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">{t('common.created')}</Typography>
                  <Typography variant="body1">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>{t('userManagement.close')}</Button>
          <Button variant="contained" sx={S.BTN_PRIMARY} onClick={() => { setDetailDialogOpen(false); handleOpenDialog(selectedUser!); }}>
            {t('userManagement.edit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={activityDialogOpen} onClose={() => setActivityDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('userManagement.activityLog')}</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {t('userManagement.activityFor', { name: `${selectedUser.firstName} ${selectedUser.lastName}` })}
              </Typography>
              {userActivity.length === 0 ? (
                <Alert severity="info">{t('userManagement.noActivityFound')}</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: S.TH_BG }}>
                      <TableRow>
                        <TableCell>{t('userManagement.activityAction')}</TableCell>
                        <TableCell>{t('userManagement.activityIpAddress')}</TableCell>
                        <TableCell>{t('userManagement.activityTimestamp')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userActivity.map((activity) => (
                        <TableRow key={activity.id} sx={S.TR_HOVER}>
                          <TableCell sx={S.TD}>{activity.action}</TableCell>
                          <TableCell sx={S.TD}>{activity.ipAddress}</TableCell>
                          <TableCell sx={S.TD}>{new Date(activity.timestamp).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityDialogOpen(false)}>{t('userManagement.close')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

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
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

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
        setSnackbar({ open: true, message: 'User created successfully!', severity: 'success' });
      } else {
        await apiClient.put(`/api/v1/users/${selectedUser?.userId}`, userForm);
        setSnackbar({ open: true, message: 'User updated successfully!', severity: 'success' });
      }
      handleCloseDialog();
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error?.message || 'Operation failed', severity: 'error' });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiClient.delete(`/api/v1/users/${userId}`);
      setSnackbar({ open: true, message: 'User deleted successfully!', severity: 'success' });
      fetchUsers();
      fetchStats();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.error?.message || 'Failed to delete user', severity: 'error' });
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      await apiClient.post(`/api/v1/users/${userId}/reset-password`);
      setSnackbar({ open: true, message: 'Password reset email sent!', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to reset password', severity: 'error' });
    }
    setAnchorEl(null);
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await apiClient.put(`/api/v1/users/${userId}`, { status: newStatus });
      setSnackbar({ open: true, message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'}!`, severity: 'success' });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          User Management / प्रयोगकर्ता व्यवस्थापन
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User / प्रयोगकर्ता थप्नुहोस्
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Users
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Active
              </Typography>
              <Typography variant="h4" color="success.main">{stats.active}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Inactive
              </Typography>
              <Typography variant="h4" color="text.secondary">{stats.inactive}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Suspended
              </Typography>
              <Typography variant="h4" color="error.main">{stats.suspended}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search / खोज्नुहोस्"
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
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.name}>
                  {role.displayName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.userId} hover>
                  <TableCell>
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
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={user.roleName} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      color={getStatusColor(user.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
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
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleOpenDialog(selectedUser!); setAnchorEl(null); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedUser && handleResetPassword(selectedUser.userId)}>
          <ListItemIcon><ResetPasswordIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Reset Password</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedUser && handleViewActivity(selectedUser)}>
          <ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Activity</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => selectedUser && handleToggleStatus(selectedUser.userId, selectedUser.status)}>
          <ListItemIcon>
            {selectedUser?.status === 'active' ? <BlockIcon fontSize="small" /> : <ActivateIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedUser?.status === 'active' ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedUser && handleDeleteUser(selectedUser.userId)} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {formMode === 'create' ? 'Create User / प्रयोगकर्ता सिर्जना' : 'Edit User / प्रयोगकर्ता सम्पादन'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  required
                  value={userForm.firstName}
                  onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  required
                  value={userForm.lastName}
                  onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              label="Username"
              fullWidth
              required
              value={userForm.username}
              onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
              disabled={formMode === 'edit'}
            />
            <TextField
              label="Email"
              fullWidth
              required
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            />
            <TextField
              label="Phone"
              fullWidth
              value={userForm.phone}
              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
            />
            {formMode === 'create' && (
              <TextField
                label="Password"
                fullWidth
                required
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
            )}
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={userForm.roleId}
                label="Role"
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
              <InputLabel>Status</InputLabel>
              <Select
                value={userForm.status}
                label="Status"
                onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!userForm.username || !userForm.email || !userForm.firstName || !userForm.roleId}
          >
            {formMode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
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
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedUser.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{selectedUser.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                  <Chip label={selectedUser.roleName} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip label={selectedUser.status} color={getStatusColor(selectedUser.status)} size="small" />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Last Login</Typography>
                  <Typography variant="body1">
                    {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => { setDetailDialogOpen(false); handleOpenDialog(selectedUser!); }}>
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={activityDialogOpen} onClose={() => setActivityDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>User Activity Log</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Activity for {selectedUser.firstName} {selectedUser.lastName}
              </Typography>
              {userActivity.length === 0 ? (
                <Alert severity="info">No activity records found</Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Action</TableCell>
                        <TableCell>IP Address</TableCell>
                        <TableCell>Timestamp</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userActivity.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>{activity.action}</TableCell>
                          <TableCell>{activity.ipAddress}</TableCell>
                          <TableCell>{new Date(activity.timestamp).toLocaleString()}</TableCell>
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
          <Button onClick={() => setActivityDialogOpen(false)}>Close</Button>
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

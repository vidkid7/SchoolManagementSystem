/**
 * Role Management Page
 * 
 * Allows admins to manage roles and permissions
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Switch,
  alpha,
  useTheme,
  CircularProgress,
  Alert,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Security as SecurityIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineIcon,
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

const MotionCard = motion.create(Card);

interface Permission {
  id: string;
  name: string;
  code: string;
  category: string;
  action: string;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  permissions?: Permission[];
}

const PERMISSION_CATEGORIES = [
  'student',
  'staff',
  'academic',
  'attendance',
  'examination',
  'finance',
  'library',
  'transport',
  'hostel',
  'eca',
  'sports',
  'communication',
  'document',
  'certificate',
  'report',
  'system',
];

const PERMISSION_ACTIONS = ['create', 'read', 'update', 'delete', 'manage'];

export const RoleManagement = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; role?: Role }>({
    open: false,
    mode: 'create',
  });
  const [permissionDialog, setPermissionDialog] = useState<{ open: boolean; role?: Role }>({
    open: false,
  });
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  
  const [roleForm, setRoleForm] = useState({
    name: '',
    code: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        apiClient.get('/api/v1/config/roles?includeInactive=true'),
        apiClient.get('/api/v1/config/permissions?includeInactive=true'),
      ]);
      setRoles(rolesRes.data.data || []);
      setPermissions(permissionsRes.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      setError('');
      await apiClient.post('/api/v1/config/roles', roleForm);
      setSuccess(t('roles.roleCreated'));
      setRoleDialog({ open: false, mode: 'create' });
      setRoleForm({ name: '', code: '', description: '', isActive: true });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create role');
    }
  };

  const handleUpdateRole = async () => {
    if (!roleDialog.role) return;
    try {
      setError('');
      await apiClient.put(`/api/v1/config/roles/${roleDialog.role.id}`, roleForm);
      setSuccess(t('roles.roleUpdated'));
      setRoleDialog({ open: false, mode: 'create' });
      setRoleForm({ name: '', code: '', description: '', isActive: true });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm(t('roles.confirmDelete'))) return;
    try {
      setError('');
      await apiClient.delete(`/api/v1/config/roles/${roleId}`);
      setSuccess(t('roles.roleDeleted'));
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const handleToggleRoleStatus = async (role: Role) => {
    try {
      await apiClient.put(`/api/v1/config/roles/${role.id}`, { isActive: !role.isActive });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleSavePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      setError('');
      await apiClient.post(`/api/v1/config/roles/${roleId}/permissions`, { permissionIds });
      setSuccess(t('roles.permissionsUpdated'));
      setPermissionDialog({ open: false });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update permissions');
    }
  };

  const openEditRole = (role: Role) => {
    setRoleForm({
      name: role.name,
      code: role.code,
      description: role.description || '',
      isActive: role.isActive,
    });
    setRoleDialog({ open: true, mode: 'edit', role });
  };

  const openPermissionDialog = (role: Role) => {
    setPermissionDialog({ open: true, role });
  };

  const toggleRoleExpand = (roleId: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter(p => p.category === category);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            }}
          >
            <SecurityIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {t('roles.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('settings.roleAndPermissions')}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setRoleDialog({ open: true, mode: 'create' })}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          {t('roles.addRole')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Roles Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
              <TableCell sx={{ fontWeight: 600 }} width={50}></TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('roles.roleName')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('roles.roleCode')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('roles.description')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('roles.permissions')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('roles.systemRole')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('roles.active')}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{t('staff.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('roles.noRolesFound')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <>
                  <TableRow key={role.id} hover>
                    <TableCell>
                      <IconButton size="small" onClick={() => toggleRoleExpand(role.id)}>
                        {expandedRoles.has(role.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {role.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={role.code} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {role.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openPermissionDialog(role)}
                      >
                        {t('roles.managePermissions')} ({role.permissions?.length || 0})
                      </Button>
                    </TableCell>
                    <TableCell>
                      {role.isSystem && (
                        <Chip label={t('roles.systemRole')} size="small" color="warning" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={role.isActive}
                        onChange={() => handleToggleRoleStatus(role)}
                        disabled={role.isSystem}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => openEditRole(role)}
                        disabled={role.isSystem}
                        title={t('staff.edit')}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.isSystem}
                        title={t('common.delete')}
                        sx={{ color: 'error.main' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 0 }}>
                      <Collapse in={expandedRoles.has(role.id)} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            {t('roles.permissions')}:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {role.permissions?.map((perm) => (
                              <Chip
                                key={perm.id}
                                label={`${perm.category}.${perm.action}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            )) || <Typography variant="body2" color="text.secondary">No permissions assigned</Typography>}
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Role Dialog */}
      <Dialog open={roleDialog.open} onClose={() => setRoleDialog({ open: false, mode: 'create' })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {roleDialog.mode === 'create' ? t('roles.createRole') : t('roles.updateRole')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('roles.roleName')}
                fullWidth
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t('roles.roleCode')}
                fullWidth
                value={roleForm.code}
                onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                disabled={roleDialog.mode === 'edit'}
                helperText="e.g., SCHOOL_ADMIN"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('roles.description')}
                fullWidth
                multiline
                rows={2}
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={roleForm.isActive}
                    onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                  />
                }
                label={t('roles.active')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRoleDialog({ open: false, mode: 'create' })}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={roleDialog.mode === 'create' ? handleCreateRole : handleUpdateRole}
            disabled={!roleForm.name || !roleForm.code}
          >
            {roleDialog.mode === 'create' ? t('roles.createRole') : t('roles.updateRole')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog
        open={permissionDialog.open}
        onClose={() => setPermissionDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('roles.managePermissions')}: {permissionDialog.role?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select permissions to assign to this role.
          </Typography>
          <PermissionMatrix
            permissions={permissions}
            rolePermissions={permissionDialog.role?.permissions || []}
            onSave={(permIds) => handleSavePermissions(permissionDialog.role?.id!, permIds)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPermissionDialog({ open: false })}>
            {t('common.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

interface PermissionMatrixProps {
  permissions: Permission[];
  rolePermissions: Permission[];
  onSave: (permissionIds: string[]) => void;
}

const PermissionMatrix = ({ permissions, rolePermissions, onSave }: PermissionMatrixProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(rolePermissions.map(p => p.id))
  );

  const rolePermissionIds = new Set(rolePermissions.map(p => p.id));

  const handleToggle = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissions(newSelected);
  };

  const handleCategoryToggle = (category: string, action: string) => {
    const categoryPerms = permissions.filter(p => p.category === category && p.action === action);
    const allSelected = categoryPerms.every(p => selectedPermissions.has(p.id));
    
    const newSelected = new Set(selectedPermissions);
    categoryPerms.forEach(p => {
      if (allSelected) {
        newSelected.delete(p.id);
      } else {
        newSelected.add(p.id);
      }
    });
    setSelectedPermissions(newSelected);
  };

  const handleSave = () => {
    onSave(Array.from(selectedPermissions));
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSave}>
          {t('common.save')}
        </Button>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const allIds = permissions.map(p => p.id);
                setSelectedPermissions(new Set(allIds));
              }}
            >
              Select All
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSelectedPermissions(new Set())}
            >
              Deselect All
            </Button>
          </Box>
        </Grid>
        
        {PERMISSION_CATEGORIES.map((category) => {
          const categoryPerms = getPermissionsByCategory(permissions, category);
          if (categoryPerms.length === 0) return null;
          
          return (
            <Grid item xs={12} key={category}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {t(`roles.categories.${category}`)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {PERMISSION_ACTIONS.map((action) => {
                    const perm = categoryPerms.find(p => p.action === action);
                    if (!perm) return null;
                    
                    const isSelected = selectedPermissions.has(perm.id);
                    const isOriginal = rolePermissionIds.has(perm.id);
                    
                    return (
                      <Chip
                        key={perm.id}
                        label={t(`roles.actions.${action}`)}
                        onClick={() => handleToggle(perm.id)}
                        icon={isSelected ? <CheckBoxIcon /> : <CheckBoxOutlineIcon />}
                        color={isSelected ? 'primary' : 'default'}
                        variant={isSelected ? 'filled' : 'outlined'}
                        sx={{
                          borderColor: isOriginal ? 'primary.main' : undefined,
                          '& .MuiChip-icon': {
                            color: isSelected ? 'white' : 'text.secondary',
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

function getPermissionsByCategory(permissions: Permission[], category: string) {
  return permissions.filter(p => p.category === category);
}

export default RoleManagement;

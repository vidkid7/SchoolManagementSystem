/**
 * Backup & Restore Management
 * 
 * Exclusive access for School_Admin only
 * 
 * Features:
 * - Create manual backups
 * - List all available backups
 * - Restore from backup
 * - Verify backup integrity
 * - Clean up old backups
 * - View backup configuration
 * - Configure automatic backup schedule
 * - Set backup retention policy
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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
} from '@mui/material';
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Verified as VerifiedIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  CloudDownload as DownloadIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';

interface Backup {
  filename: string;
  path: string;
  size: number;
  createdAt: string;
  timestamp?: string;
  isValid?: boolean;
}

interface BackupConfig {
  enabled: boolean;
  schedule: string;
  retentionDays: number;
  path: string;
  externalPath?: string;
  compression: boolean;
  jobStatus?: {
    isRunning: boolean;
    lastRun?: string;
    nextRun?: string;
  };
}

export const BackupManagement = () => {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  useEffect(() => {
    fetchBackups();
    fetchConfig();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get('/api/v1/backup/list');
      setBackups(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch backups:', err);
      setError(err.response?.data?.error?.message || 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await apiClient.get('/api/v1/backup/config');
      const raw = response.data.data;
      if (raw) {
        // Normalize API field names to match interface
        setConfig({
          ...raw,
          path: raw.path || raw.backupPath,
          compression: raw.compression ?? raw.compressionEnabled,
          jobStatus: raw.jobStatus ? {
            isRunning: raw.jobStatus.isRunning ?? raw.jobStatus.running,
            lastRun: raw.jobStatus.lastRun,
            nextRun: raw.jobStatus.nextRun,
          } : undefined,
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch config:', err);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      setError('');
      setSuccess('');
      const response = await apiClient.post('/api/v1/backup/create');
      setSuccess(`Backup created successfully: ${response.data.data.filename}`);
      fetchBackups();
    } catch (err: any) {
      console.error('Failed to create backup:', err);
      setError(err.response?.data?.error?.message || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    if (!window.confirm(
      'WARNING: Restoring a backup will replace all current data. This action cannot be undone. Are you sure you want to continue?'
    )) {
      return;
    }

    try {
      setRestoring(true);
      setError('');
      setSuccess('');
      const response = await apiClient.post('/api/v1/backup/restore', {
        filename: selectedBackup.filename,
      });
      setSuccess(`Database restored successfully from ${selectedBackup.filename}`);
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
    } catch (err: any) {
      console.error('Failed to restore backup:', err);
      setError(err.response?.data?.error?.message || 'Failed to restore backup');
    } finally {
      setRestoring(false);
    }
  };

  const handleVerifyBackup = async (backup: Backup) => {
    try {
      setVerifying(true);
      setError('');
      const response = await apiClient.post('/api/v1/backup/verify', {
        filename: backup.filename,
      });
      
      // Update backup in list with verification status
      setBackups(backups.map(b => 
        b.filename === backup.filename 
          ? { ...b, isValid: response.data.data.valid }
          : b
      ));
      
      if (response.data.data.valid) {
        setSuccess(`Backup ${backup.filename} is valid`);
      } else {
        setError(`Backup ${backup.filename} is corrupted or invalid`);
      }
    } catch (err: any) {
      console.error('Failed to verify backup:', err);
      setError(err.response?.data?.error?.message || 'Failed to verify backup');
    } finally {
      setVerifying(false);
    }
  };

  const handleCleanupBackups = async () => {
    if (!window.confirm(
      'This will delete all backups older than the retention period. Continue?'
    )) {
      return;
    }

    try {
      setCleaning(true);
      setError('');
      setSuccess('');
      const response = await apiClient.post('/api/v1/backup/cleanup');
      setSuccess(`Cleaned up ${response.data.data.deletedCount} old backups`);
      fetchBackups();
    } catch (err: any) {
      console.error('Failed to cleanup backups:', err);
      setError(err.response?.data?.error?.message || 'Failed to cleanup backups');
    } finally {
      setCleaning(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '—';
    // Handle backup filename date format: 2026-03-11T20-15-00-033Z (hyphens instead of colons/dots)
    const normalized = dateString.replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, 'T$1:$2:$3.$4Z');
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? dateString : d.toLocaleString();
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BackupIcon sx={{ fontSize: 32, color: C.primary }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>{t('backup.title')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('backup.subtitle')}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined" sx={S.BTN_OUTLINE}
              startIcon={<SettingsIcon />}
              onClick={() => setConfigDialogOpen(true)}
            >
              {t('backup.config')}
            </Button>
            <Button
              variant="contained" sx={S.BTN_PRIMARY}
              startIcon={<BackupIcon />}
              onClick={handleCreateBackup}
              disabled={creating}
            >
              {creating ? <CircularProgress size={24} /> : t('backup.createBackup')}
            </Button>
          </Box>
        </Box>
      </Paper>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Configuration Overview */}
      {config && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ ...S.GLASS }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <ScheduleIcon color="primary" />
                  <Typography variant="h6">Schedule</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {config.enabled ? config.schedule : 'Disabled'}
                </Typography>
                <Chip
                  label={config.enabled ? 'Enabled' : 'Disabled'}
                  color={config.enabled ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ ...S.GLASS }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <StorageIcon color="primary" />
                  <Typography variant="h6">Retention</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {config.retentionDays} days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ ...S.GLASS }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <CheckCircleIcon color="primary" />
                  <Typography variant="h6">Last Run</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {config.jobStatus?.lastRun 
                    ? formatDate(config.jobStatus.lastRun)
                    : 'Never'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card sx={{ ...S.GLASS }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <ScheduleIcon color="primary" />
                  <Typography variant="h6">Next Run</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {config.jobStatus?.nextRun 
                    ? formatDate(config.jobStatus.nextRun)
                    : 'Not scheduled'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Backups List */}
      <Paper sx={{ ...S.GLASS }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {t('backup.availableBackups')} ({backups.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined" sx={S.BTN_OUTLINE}
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchBackups}
              disabled={loading}
            >
              {t('common.refresh')}
            </Button>
            <Button
              variant="outlined" sx={S.BTN_OUTLINE}
              size="small"
              startIcon={<DeleteIcon />}
              onClick={handleCleanupBackups}
              disabled={cleaning}
              color="error"
            >
              {cleaning ? <CircularProgress size={20} /> : t('backup.cleanupOld')}
            </Button>
          </Box>
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>{t('backup.filename')}</TableCell>
                <TableCell>{t('backup.size')}</TableCell>
                <TableCell>{t('common.created')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={5} align="center" sx={S.TD}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : backups.length === 0 ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={5} align="center" sx={S.TD}>
                    <Typography color="text.secondary">
                      {t('backup.noBackups')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((backup) => (
                  <TableRow key={backup.filename} hover sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>
                      <Typography variant="body2" fontFamily="monospace">
                        {backup.filename}
                      </Typography>
                    </TableCell>
                    <TableCell sx={S.TD}>{formatBytes(backup.size)}</TableCell>
                    <TableCell sx={S.TD}>{formatDate(backup.timestamp || backup.createdAt)}</TableCell>
                    <TableCell sx={S.TD}>
                      {backup.isValid === true && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Verified"
                          color="success"
                          size="small"
                        />
                      )}
                      {backup.isValid === false && (
                        <Chip
                          icon={<ErrorIcon />}
                          label="Invalid"
                          color="error"
                          size="small"
                        />
                      )}
                      {backup.isValid === undefined && (
                        <Chip
                          icon={<WarningIcon />}
                          label="Not Verified"
                          color="default"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={S.TD}>
                      <IconButton
                        size="small"
                        title="Verify Backup"
                        onClick={() => handleVerifyBackup(backup)}
                        disabled={verifying}
                      >
                        <VerifiedIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Restore Backup"
                        color="primary"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setRestoreDialogOpen(true);
                        }}
                      >
                        <RestoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => !restoring && setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon color="warning" />
            {t('backup.confirmRestoreTitle')}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            WARNING: This will replace ALL current data with the backup data. This action CANNOT be undone!
          </Alert>
          {selectedBackup && (
            <Box>
              <Typography variant="body1" gutterBottom>
                You are about to restore from:
              </Typography>
              <Paper sx={{ ...S.GLASS, p: 2, bgcolor: 'grey.100', mt: 1 }}>
                <Typography variant="body2" fontFamily="monospace">
                  {selectedBackup.filename}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Size: {formatBytes(selectedBackup.size)} | Created: {formatDate(selectedBackup.timestamp || selectedBackup.createdAt)}
                </Typography>
              </Paper>
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                Please ensure you have created a current backup before proceeding.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)} disabled={restoring}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained" sx={S.BTN_PRIMARY}
            color="error"
            onClick={handleRestoreBackup}
            disabled={restoring}
            startIcon={restoring ? <CircularProgress size={20} /> : <RestoreIcon />}
          >
            {restoring ? t('backup.restoring') : t('backup.restore')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('backup.config')}</DialogTitle>
        <DialogContent>
          {config && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Backup configuration is managed through environment variables. Contact your system administrator to modify these settings.
              </Alert>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color={config.enabled ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Automatic Backups"
                    secondary={config.enabled ? 'Enabled' : 'Disabled'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ScheduleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Schedule (Cron)"
                    secondary={config.schedule}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <StorageIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Retention Period"
                    secondary={`${config.retentionDays} days`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <StorageIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Backup Path"
                    secondary={config.path}
                  />
                </ListItem>
                {config.externalPath && (
                  <ListItem>
                    <ListItemIcon>
                      <DownloadIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="External Backup Path"
                      secondary={config.externalPath}
                    />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleIcon color={config.compression ? 'success' : 'disabled'} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Compression"
                    secondary={config.compression ? 'Enabled (gzip)' : 'Disabled'}
                  />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

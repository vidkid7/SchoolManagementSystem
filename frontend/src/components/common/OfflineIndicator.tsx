/**
 * OfflineIndicator Component
 * Displays network status and sync information with detailed progress
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  CloudOff,
  CloudDone,
  Sync,
  CloudQueue,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle
} from '@mui/icons-material';
import { usePWA } from '@/hooks/usePWA';

export const OfflineIndicator: React.FC = () => {
  const [pwaState, pwaActions] = usePWA();
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>('');

  // Show alerts when network status changes
  useEffect(() => {
    if (!pwaState.isOnline) {
      setShowOfflineAlert(true);
      setShowOnlineAlert(false);
    } else {
      setShowOfflineAlert(false);
      setShowOnlineAlert(true);
      // Auto-hide online alert after 3 seconds
      const timer = setTimeout(() => setShowOnlineAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [pwaState.isOnline]);

  const handleSync = async () => {
    setShowSyncDialog(true);
    setSyncProgress('Starting sync...');
    await pwaActions.triggerManualSync((message) => {
      setSyncProgress(message);
    });
    // Keep dialog open for 2 seconds to show completion
    setTimeout(() => {
      setShowSyncDialog(false);
      setSyncProgress('');
    }, 2000);
  };

  const getSyncStatusText = () => {
    if (pwaState.syncStatus.isSyncing) {
      return 'Syncing...';
    }
    if (pwaState.syncStatus.pendingCount > 0) {
      return `${pwaState.syncStatus.pendingCount} pending`;
    }
    if (pwaState.syncStatus.lastSyncTime) {
      const timeDiff = Date.now() - pwaState.syncStatus.lastSyncTime.getTime();
      const minutes = Math.floor(timeDiff / 60000);
      if (minutes < 1) return 'Just synced';
      if (minutes < 60) return `Synced ${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      return `Synced ${hours}h ago`;
    }
    return 'No sync needed';
  };

  const getSyncIcon = () => {
    if (pwaState.syncStatus.isSyncing) {
      return <CircularProgress size={16} color="inherit" />;
    }
    if (pwaState.syncStatus.pendingCount > 0) {
      return <CloudQueue />;
    }
    if (pwaState.syncStatus.errors.length > 0) {
      return <ErrorIcon />;
    }
    if (pwaState.syncStatus.conflicts && pwaState.syncStatus.conflicts.length > 0) {
      return <WarningIcon />;
    }
    return <CloudDone />;
  };

  const getSyncColor = () => {
    if (pwaState.syncStatus.errors.length > 0) return 'error';
    if (pwaState.syncStatus.conflicts && pwaState.syncStatus.conflicts.length > 0) return 'warning';
    if (pwaState.syncStatus.pendingCount > 0) return 'warning';
    return 'default';
  };

  return (
    <>
      {/* Network Status Chip */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {!pwaState.isOnline && (
          <Tooltip title="You are offline. Changes will be synced when online.">
            <Chip
              icon={<CloudOff />}
              label="Offline"
              color="warning"
              size="small"
              variant="outlined"
            />
          </Tooltip>
        )}

        {/* Sync Status */}
        {(pwaState.syncStatus.pendingCount > 0 || 
          pwaState.syncStatus.isSyncing || 
          pwaState.syncStatus.errors.length > 0 ||
          (pwaState.syncStatus.conflicts && pwaState.syncStatus.conflicts.length > 0)) && (
          <Tooltip title={getSyncStatusText()}>
            <span>
              <IconButton
                size="small"
                onClick={handleSync}
                disabled={pwaState.syncStatus.isSyncing || !pwaState.isOnline}
                color={getSyncColor()}
              >
                {getSyncIcon()}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {/* Sync Progress Dialog */}
      <Dialog open={showSyncDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Syncing Data</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant={pwaState.syncStatus.isSyncing ? 'indeterminate' : 'determinate'}
              value={100}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {syncProgress}
          </Typography>
          
          {/* Show sync results */}
          {pwaState.syncStatus.syncResult && (
            <Box sx={{ mt: 2 }}>
              <List dense>
                {pwaState.syncStatus.syncResult.syncedCount > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${pwaState.syncStatus.syncResult.syncedCount} records synced successfully`}
                    />
                  </ListItem>
                )}
                {pwaState.syncStatus.syncResult.failedCount > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${pwaState.syncStatus.syncResult.failedCount} records failed to sync`}
                    />
                  </ListItem>
                )}
                {pwaState.syncStatus.syncResult.conflictCount > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`${pwaState.syncStatus.syncResult.conflictCount} conflicts resolved`}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSyncDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Offline Alert */}
      <Snackbar
        open={showOfflineAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          icon={<CloudOff />}
          sx={{ width: '100%' }}
        >
          You are offline. Changes will be saved and synced when you're back online.
        </Alert>
      </Snackbar>

      {/* Online Alert */}
      <Snackbar
        open={showOnlineAlert}
        autoHideDuration={3000}
        onClose={() => setShowOnlineAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          icon={<CloudDone />}
          sx={{ width: '100%' }}
          onClose={() => setShowOnlineAlert(false)}
        >
          You are back online. {pwaState.syncStatus.pendingCount > 0 ? 'Syncing changes...' : 'All synced!'}
        </Alert>
      </Snackbar>

      {/* Sync Errors */}
      {pwaState.syncStatus.errors.length > 0 && !showSyncDialog && (
        <Snackbar
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="error"
            sx={{ width: '100%' }}
            action={
              <Button color="inherit" size="small" onClick={handleSync}>
                Retry
              </Button>
            }
          >
            Sync failed: {pwaState.syncStatus.errors[0]}
          </Alert>
        </Snackbar>
      )}

      {/* Conflict Alert */}
      {pwaState.syncStatus.conflicts && pwaState.syncStatus.conflicts.length > 0 && !showSyncDialog && (
        <Snackbar
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="warning"
            sx={{ width: '100%' }}
          >
            {pwaState.syncStatus.conflicts.length} conflict(s) resolved using local data
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

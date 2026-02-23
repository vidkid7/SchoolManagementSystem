/**
 * Lite Mode Indicator Component
 * 
 * Displays lite mode status and allows toggling
 */

import { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  SignalCellular2Bar as SlowIcon,
  SignalCellular4Bar as FastIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleLiteMode,
  toggleAutoDetect,
  selectLiteModeEnabled,
  selectAutoDetect,
  selectIsLiteModeActive,
  selectNetworkInfo,
} from '../../store/slices/liteModeSlice';

export const LiteModeIndicator: React.FC = () => {
  const dispatch = useDispatch();
  const liteModeEnabled = useSelector(selectLiteModeEnabled);
  const autoDetect = useSelector(selectAutoDetect);
  const isLiteModeActive = useSelector(selectIsLiteModeActive);
  const networkInfo = useSelector(selectNetworkInfo);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggleLiteMode = () => {
    dispatch(toggleLiteMode());
  };

  const handleToggleAutoDetect = () => {
    dispatch(toggleAutoDetect());
  };

  const getConnectionIcon = () => {
    if (networkInfo.isSlowConnection) {
      return <SlowIcon color="warning" />;
    }
    return <FastIcon color="success" />;
  };

  const getConnectionLabel = () => {
    if (networkInfo.effectiveConnectionType === 'unknown') {
      return 'Unknown';
    }
    return networkInfo.effectiveConnectionType.toUpperCase();
  };

  return (
    <>
      <Tooltip title="Network & Lite Mode">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{
            color: isLiteModeActive ? 'warning.main' : 'inherit',
          }}
        >
          {isLiteModeActive ? <SpeedIcon /> : getConnectionIcon()}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 250 }}>
          <Typography variant="subtitle2" gutterBottom>
            Network Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            {getConnectionIcon()}
            <Chip
              label={getConnectionLabel()}
              size="small"
              color={networkInfo.isSlowConnection ? 'warning' : 'success'}
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle2" gutterBottom>
            Lite Mode
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Reduces data usage and improves performance on slow connections
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={liteModeEnabled}
                onChange={handleToggleLiteMode}
                size="small"
              />
            }
            label="Enable Lite Mode"
          />

          <FormControlLabel
            control={
              <Switch
                checked={autoDetect}
                onChange={handleToggleAutoDetect}
                size="small"
              />
            }
            label="Auto-detect slow connection"
          />

          {isLiteModeActive && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="caption" color="warning.dark">
                Lite mode is active:
              </Typography>
              <Typography variant="caption" display="block" color="warning.dark">
                • Animations disabled
              </Typography>
              <Typography variant="caption" display="block" color="warning.dark">
                • Images compressed
              </Typography>
              <Typography variant="caption" display="block" color="warning.dark">
                • Limited concurrent requests
              </Typography>
            </Box>
          )}
        </Box>
      </Menu>
    </>
  );
};

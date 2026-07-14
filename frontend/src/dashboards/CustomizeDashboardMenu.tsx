import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Popover,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { RestartAlt, Tune, Visibility, VisibilityOff } from '@mui/icons-material';
import { DASHBOARD_SECTIONS, type DashboardLayoutApi } from './useDashboardLayout';

interface CustomizeDashboardMenuProps {
  layout: DashboardLayoutApi;
}

/**
 * Popover menu for arranging the dashboard. Lets the user add or
 * remove cards, reset to defaults, and quickly toggle visibility.
 */
export function CustomizeDashboardMenu({ layout }: CustomizeDashboardMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Customize dashboard layout">
        <Button
          startIcon={<Tune />}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          variant="outlined"
          className="role-dashboard__secondary-button"
          aria-label="Customize dashboard"
        >
          Customize
          {layout.hiddenCount > 0 && (
            <Chip
              size="small"
              label={layout.hiddenCount}
              className="role-dashboard__customize-chip"
              sx={{ ml: 0.75 }}
            />
          )}
        </Button>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            className: 'dashboard-customize-popover',
            elevation: 0,
          },
        }}
      >
        <Box className="dashboard-customize-popover__header">
          <Box>
            <Typography className="dashboard-customize-popover__title">Arrange dashboard</Typography>
            <Typography variant="caption" className="dashboard-customize-popover__subtitle">
              Show, hide, and tune the cards on your role workspace.
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${layout.visibleCount} of ${DASHBOARD_SECTIONS.length}`}
            className="dashboard-customize-popover__count"
          />
        </Box>

        <Stack direction="row" spacing={1} className="dashboard-customize-popover__quick-actions">
          <Button
            size="small"
            startIcon={<Visibility sx={{ fontSize: 16 }} />}
            onClick={layout.showAll}
            className="dashboard-customize-popover__action"
          >
            Show all
          </Button>
          <Button
            size="small"
            startIcon={<VisibilityOff sx={{ fontSize: 16 }} />}
            onClick={layout.hideAll}
            className="dashboard-customize-popover__action"
          >
            Minimize
          </Button>
          <Button
            size="small"
            startIcon={<RestartAlt sx={{ fontSize: 16 }} />}
            onClick={layout.reset}
            className="dashboard-customize-popover__action"
          >
            Reset
          </Button>
        </Stack>

        <Divider className="dashboard-customize-popover__divider" />

        <Stack className="dashboard-customize-popover__list">
          {DASHBOARD_SECTIONS.map((section) => {
            const visible = layout.isVisible(section.id);
            return (
              <Box
                key={section.id}
                className={`dashboard-customize-popover__item${visible ? '' : ' dashboard-customize-popover__item--hidden'}`}
                onClick={() => layout.toggle(section.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    layout.toggle(section.id);
                  }
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography className="dashboard-customize-popover__item-label">{section.label}</Typography>
                  <Typography variant="caption" className="dashboard-customize-popover__item-desc">
                    {section.description}
                  </Typography>
                </Box>
                <Switch
                  checked={visible}
                  size="small"
                  onClick={(event) => event.stopPropagation()}
                  onChange={() => layout.toggle(section.id)}
                  inputProps={{ 'aria-label': `Toggle ${section.label}` }}
                />
              </Box>
            );
          })}
        </Stack>
      </Popover>
    </>
  );
}

export default CustomizeDashboardMenu;

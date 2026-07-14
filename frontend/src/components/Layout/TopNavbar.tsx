import { useState } from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Lock,
  Logout,
  Menu as MenuIcon,
  Message,
  Person,
  Search,
  Settings,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { LiteModeIndicator } from '../common/LiteModeIndicator';
import { ThemeToggle } from '../ThemeToggle';
import { AccessibilitySettings } from '../AccessibilitySettings';
import { NotificationBell } from '../NotificationBell/NotificationBell';

interface TopNavbarProps {
  sidebarWidth: number;
  onMobileMenu: () => void;
}

function titleFromPath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1] || 'dashboard';
  return last.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function isDashboardPath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1] || '';
  return last === 'dashboard' || parts.length === 0;
}

export function TopNavbar({ sidebarWidth, onMobileMenu }: TopNavbarProps) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const extraSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useSlugNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'User';
  const initials = userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    setAnchorEl(null);
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      className="dashboard-topbar"
      sx={{
        width: { md: `calc(100% - ${sidebarWidth}px)` },
        ml: { md: `${sidebarWidth}px` },
        transition: 'width 0.25s ease, margin-left 0.25s ease',
      }}
    >
      <Toolbar className="dashboard-topbar__toolbar" sx={{ minHeight: { xs: 48, md: 48 }, gap: 0.8 }}>
        <IconButton onClick={onMobileMenu} className="dashboard-topbar__icon" sx={{ display: { md: 'none' } }} aria-label="Open navigation">
          <MenuIcon />
        </IconButton>

        <Box className="dashboard-topbar__brand" sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="caption" className="dashboard-topbar__eyebrow" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {isDashboardPath(location.pathname) ? 'Welcome back,' : 'School Management System'}
          </Typography>
          <Typography variant="h6" className="dashboard-topbar__title">
            {isDashboardPath(location.pathname)
              ? compact
                ? (user?.firstName || userName.split(' ')[0] || 'Dashboard')
                : `${(user?.firstName || userName.split(' ')[0] || 'there')} 👋`
              : titleFromPath(location.pathname)}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        {!compact && (
          <TextField
            size="small"
            placeholder="Search modules, students, invoices"
            className="dashboard-topbar__search"
            sx={{
              width: { md: 290, lg: 330, xl: 360 },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        )}

        <Stack direction="row" alignItems="center" spacing={0.35} className="dashboard-topbar__controls">
          <OfflineIndicator />
          {!extraSmall && <LiteModeIndicator />}
          {!extraSmall && <AccessibilitySettings compact />}
          <ThemeToggle />
          {!extraSmall && <LanguageSwitcher />}
          <IconButton onClick={() => navigate('/communication/messages')} className="dashboard-topbar__icon" aria-label="Messages">
            <Badge variant="dot" color="primary">
              <Message />
            </Badge>
          </IconButton>
          <NotificationBell />
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            role="button"
            aria-label="Account menu"
            tabIndex={0}
            onClick={(event) => setAnchorEl(event.currentTarget)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setAnchorEl(event.currentTarget);
              }
            }}
            className="dashboard-topbar__account"
            sx={{
              px: { xs: 0.45, sm: 0.8 },
              py: 0.35,
            }}
          >
            <Avatar className="dashboard-topbar__account-avatar" sx={{ width: 24, height: 24, bgcolor: '#2563eb', fontWeight: 900, fontSize: '0.72rem' }}>{initials || 'U'}</Avatar>
            {!compact && (
              <Box sx={{ pr: 0.75 }}>
                <Typography variant="body2" className="dashboard-topbar__account-name">{userName}</Typography>
                <Typography variant="caption" className="dashboard-topbar__account-role">{(user?.role || '').replace(/_/g, ' ')}</Typography>
              </Box>
            )}
          </Stack>
        </Stack>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { mt: 1, borderRadius: 2, minWidth: 220 } }}>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
            <Person fontSize="small" sx={{ mr: 1.2 }} /> Profile
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
            <Settings fontSize="small" sx={{ mr: 1.2 }} /> Settings
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/change-password'); }}>
            <Lock fontSize="small" sx={{ mr: 1.2 }} /> Change password
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout fontSize="small" sx={{ mr: 1.2 }} /> Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

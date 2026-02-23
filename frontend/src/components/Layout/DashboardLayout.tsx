/**
 * Dashboard Layout
 * 
 * Main layout component with sidebar and header
 */

import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  LibraryBooks as LibraryIcon,
  SportsBasketball as SportsIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Group as StaffIcon,
  Class as ClassIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  VerifiedUser as CertificateIcon,
  CalendarMonth as CalendarIcon,
  Security as SecurityIcon,
  Tune as TuneIcon,
  Description as DescriptionIcon,
  Backup as BackupIcon,
  Archive as ArchiveIcon,
  History as HistoryIcon,
  DirectionsBus as TransportIcon,
  Hotel as HostelIcon,
  Badge as StaffBadgeIcon,
  Person as PersonIcon,
  FamilyRestroom as FamilyIcon,
  SupervisorAccount as TeacherPortalIcon,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { LiteModeIndicator } from '../common/LiteModeIndicator';
import { ThemeToggle } from '../ThemeToggle';
import { AccessibilitySettings } from '../AccessibilitySettings';

const drawerWidth = 260; // Slightly wider for better spacing

interface MenuItem {
  text: string;
  icon: JSX.Element;
  path: string;
  roles?: string[];
}

export const DashboardLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const menuItems: MenuItem[] = [
    { text: t('menu.dashboard'), icon: <DashboardIcon />, path: '/dashboard', roles: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head', 'eca_coordinator', 'sports_coordinator', 'librarian', 'accountant', 'transport_manager', 'hostel_warden', 'non_teaching_staff'] },
    { text: t('menu.students'), icon: <PeopleIcon />, path: '/students', roles: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head'] },
    { text: t('menu.admissions'), icon: <PersonAddIcon />, path: '/admissions', roles: ['school_admin', 'accountant'] },
    { text: t('menu.staff'), icon: <StaffIcon />, path: '/staff', roles: ['school_admin'] },
    { text: t('menu.academic'), icon: <ClassIcon />, path: '/academic', roles: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head'] },
    { text: t('menu.attendance'), icon: <AssignmentIcon />, path: '/attendance', roles: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head'] },
    { text: t('menu.examinations'), icon: <SchoolIcon />, path: '/examinations', roles: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head'] },
    { text: t('menu.finance'), icon: <MoneyIcon />, path: '/finance', roles: ['school_admin', 'accountant'] },
    { text: t('menu.library'), icon: <LibraryIcon />, path: '/library', roles: ['school_admin', 'librarian'] },
    { text: t('menu.eca'), icon: <SportsIcon />, path: '/eca', roles: ['school_admin', 'eca_coordinator', 'department_head'] },
    { text: t('menu.sports'), icon: <SportsIcon />, path: '/sports', roles: ['school_admin', 'sports_coordinator', 'department_head'] },
    { text: t('menu.calendar'), icon: <CalendarIcon />, path: '/calendar' },
    { text: t('communication.messages'), icon: <MessageIcon />, path: '/communication/messages' },
    { text: t('communication.announcements'), icon: <NotificationsIcon />, path: '/communication/announcements' },
    { text: t('menu.reports'), icon: <ReportIcon />, path: '/reports', roles: ['school_admin', 'department_head', 'class_teacher', 'subject_teacher', 'accountant', 'librarian', 'eca_coordinator', 'sports_coordinator'] },
    { text: t('certificates.title'), icon: <CertificateIcon />, path: '/certificates', roles: ['school_admin'] },
    { text: t('notifications.title') || 'Notifications', icon: <NotificationsIcon />, path: '/notifications', roles: ['school_admin'] },
    { text: t('menu.users') || 'User Management', icon: <PeopleIcon />, path: '/users', roles: ['school_admin'] },
    { text: t('documents.title'), icon: <DescriptionIcon />, path: '/documents', roles: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head', 'eca_coordinator', 'sports_coordinator', 'librarian', 'accountant', 'transport_manager', 'hostel_warden', 'non_teaching_staff'] },
    { text: t('menu.auditLogs'), icon: <HistoryIcon />, path: '/audit', roles: ['school_admin'] },
    { text: t('settings.roleManagement'), icon: <SecurityIcon />, path: '/settings/roles', roles: ['school_admin'] },
    { text: t('systemSettings.title'), icon: <TuneIcon />, path: '/settings/system', roles: ['school_admin'] },
    { text: t('backup.title'), icon: <BackupIcon />, path: '/settings/backup', roles: ['school_admin'] },
    { text: t('archive.title'), icon: <ArchiveIcon />, path: '/settings/archive', roles: ['school_admin'] },
    { text: t('menu.settings'), icon: <SettingsIcon />, path: '/settings', roles: ['school_admin'] },
    { text: t('menu.teacherPortal') || 'Teacher Portal', icon: <TeacherPortalIcon />, path: '/teacher/dashboard', roles: ['class_teacher', 'subject_teacher', 'department_head'] },
    { text: t('menu.myPortal') || 'My Portal', icon: <PersonIcon />, path: '/portal/student', roles: ['student'] },
    { text: t('menu.parentPortal') || 'Parent Portal', icon: <FamilyIcon />, path: '/portal/parent', roles: ['parent'] },
    { text: t('menu.transportPortal') || 'Transport Portal', icon: <TransportIcon />, path: '/portal/transport', roles: ['transport_manager'] },
    { text: t('menu.hostelPortal') || 'Hostel Portal', icon: <HostelIcon />, path: '/portal/hostel', roles: ['hostel_warden'] },
    { text: t('menu.staffPortal') || 'Staff Portal', icon: <StaffBadgeIcon />, path: '/portal/non-teaching-staff', roles: ['non_teaching_staff'] },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.some(role => role.toLowerCase() === user.role.toLowerCase()))
  );

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 2.5 }}>
        <Box sx={{ 
          p: 1.25, 
          borderRadius: 2.5, 
          background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,122,255,0.4), 0 0 0 1px rgba(255,255,255,0.2) inset',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <SchoolIcon sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Typography variant="subtitle1" noWrap component="div" sx={{ fontWeight: 600, letterSpacing: '-0.01em', ml: 1.5, color: theme.palette.text.primary }}>
          {t('app.title')}
        </Typography>
      </Toolbar>
      <Divider sx={{ mb: 2, opacity: 0.1, mx: 2 }} />
      <List role="navigation" aria-label="Main navigation" sx={{ px: 1.5, flexGrow: 1 }}>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigate(item.path)}
                selected={isActive}
                aria-label={`Navigate to ${item.text}`}
                sx={{
                  borderRadius: 2.5,
                  py: 1.25,
                  px: 2,
                  mx: 0.5,
                  mb: 0.5,
                  color: isActive 
                    ? '#007AFF' 
                    : theme.palette.text.secondary,
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(0,122,255,0.15) 0%, rgba(0,122,255,0.08) 100%)'
                    : 'transparent',
                  backdropFilter: isActive ? 'blur(10px)' : 'none',
                  border: isActive 
                    ? '1px solid rgba(0,122,255,0.2)' 
                    : '1px solid transparent',
                  boxShadow: isActive ? '0 4px 12px rgba(0,122,255,0.15)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': isActive ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                    pointerEvents: 'none',
                  } : {},
                  '&:hover': {
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(0,122,255,0.2) 0%, rgba(0,122,255,0.1) 100%)'
                      : 'rgba(255,255,255,0.05)',
                    transform: 'translateX(4px)',
                    boxShadow: isActive ? '0 6px 16px rgba(0,122,255,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                  },
                }}
              >
                <ListItemIcon aria-hidden="true" sx={{ 
                  color: isActive 
                    ? '#007AFF'
                    : theme.palette.text.secondary,
                  minWidth: 40,
                  transition: 'all 0.3s ease',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.85rem', 
                    fontWeight: isActive ? 600 : 400 
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 2 }}>
        <Box sx={{ 
          p: 2, 
          borderRadius: 3,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
            : 'linear-gradient(135deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 100%)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)'}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05) inset'
            : '0 4px 16px rgba(0,0,0,0.04), 0 0 0 1px rgba(255,255,255,0.5) inset',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
            pointerEvents: 'none',
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08) inset'
              : '0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.7) inset',
          }
        }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,122,255,0.3), 0 0 0 1px rgba(255,255,255,0.2) inset',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {user?.firstName?.[0] || user?.username?.[0] || 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden', flexGrow: 1, position: 'relative', zIndex: 1 }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
              {user?.firstName || t('menu.user')}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.7rem' }}>
              {user?.role || t('menu.guest')}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{
      display: 'flex',
      backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#f5f5f7',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Liquid Glass Background Effects */}
      <Box sx={{
        position: 'fixed',
        top: '-20%',
        left: '-15%',
        width: '60vw',
        height: '60vw',
        borderRadius: '50%',
        background: theme.palette.mode === 'dark' 
          ? 'radial-gradient(circle, rgba(0,122,255,0.08) 0%, rgba(0,0,0,0) 70%)' 
          : 'radial-gradient(circle, rgba(0,122,255,0.1) 0%, rgba(255,255,255,0) 70%)',
        filter: 'blur(60px)',
        zIndex: 0,
        animation: 'float 20s ease-in-out infinite',
      }} />
      <Box sx={{
        position: 'fixed',
        bottom: '-20%',
        right: '-15%',
        width: '70vw',
        height: '70vw',
        borderRadius: '50%',
        background: theme.palette.mode === 'dark' 
          ? 'radial-gradient(circle, rgba(88,86,214,0.08) 0%, rgba(0,0,0,0) 70%)' 
          : 'radial-gradient(circle, rgba(88,86,214,0.08) 0%, rgba(255,255,255,0) 70%)',
        filter: 'blur(80px)',
        zIndex: 0,
        animation: 'float 25s ease-in-out infinite reverse',
      }} />
      <Box sx={{
        position: 'fixed',
        top: '40%',
        right: '10%',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        background: theme.palette.mode === 'dark' 
          ? 'radial-gradient(circle, rgba(255,45,85,0.06) 0%, rgba(0,0,0,0) 70%)' 
          : 'radial-gradient(circle, rgba(255,45,85,0.05) 0%, rgba(255,255,255,0) 70%)',
        filter: 'blur(60px)',
        zIndex: 0,
        animation: 'float 15s ease-in-out infinite 2s',
      }} />
      
      {/* Skip to main content link for screen readers (Requirement 34.5) */}
      <a href="#main-content" className="skip-to-main">
        {t('common.skipToMain') || 'Skip to main content'}
      </a>
      
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)'}`,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.6) 100%)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 0 0 1px rgba(255,255,255,0.05) inset, 0 4px 24px rgba(0,0,0,0.2)'
            : '0 0 0 1px rgba(255,255,255,0.5) inset, 0 4px 24px rgba(0,0,0,0.04)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <OfflineIndicator />
            <LiteModeIndicator />
            <AccessibilitySettings compact />
            <ThemeToggle />
            <LanguageSwitcher />
            
            <IconButton onClick={handleMenuOpen} sx={{ p: 0, ml: 1 }}>
              <Avatar 
                src={undefined}
                sx={{ 
                  background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                  width: 36, 
                  height: 36,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,122,255,0.3), 0 0 0 1px rgba(255,255,255,0.2) inset',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
              </Avatar>
            </IconButton>
          </Box>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 8px 32px rgba(0,0,0,0.15))',
                mt: 1,
                borderRadius: 3,
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)'}`,
                backdropFilter: 'blur(40px) saturate(180%)',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 0 0 1px rgba(255,255,255,0.05) inset, 0 8px 32px rgba(0,0,0,0.3)'
                  : '0 0 0 1px rgba(255,255,255,0.5) inset, 0 8px 32px rgba(0,0,0,0.08)',
                '& .MuiAvatar-root': {
                  width: 28,
                  height: 28,
                  ml: -0.5,
                  mr: 1,
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
                  borderRadius: '12px 12px 0 0',
                  pointerEvents: 'none',
                },
              },
            }}
          >
            <MenuItem onClick={handleMenuClose} sx={{ fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
              <Avatar /> {t('menu.profile')}
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              {t('menu.settings')}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              {t('menu.logout')}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.65) 100%)',
              borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)'}`,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 0 0 1px rgba(255,255,255,0.05) inset, 0 8px 32px rgba(0,0,0,0.3)'
                : '0 0 0 1px rgba(255,255,255,0.5) inset, 0 8px 32px rgba(0,0,0,0.04)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.65) 100%)',
              borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)'}`,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 0 0 1px rgba(255,255,255,0.05) inset, 0 8px 32px rgba(0,0,0,0.3)'
                : '0 0 0 1px rgba(255,255,255,0.5) inset, 0 8px 32px rgba(0,0,0,0.04)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 7,
          minHeight: '100vh',
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};


/**
 * Dashboard Layout
 * 
 * Main layout component with sidebar and header
 */

import { useState } from 'react';
import { Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Chip,
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
  Collapse,
  Tooltip,
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
  Lock as LockIcon,
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
  LocationCity as MunicipalityIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { OfflineIndicator } from '../common/OfflineIndicator';
import { LiteModeIndicator } from '../common/LiteModeIndicator';
import { ThemeToggle } from '../ThemeToggle';
import { AccessibilitySettings } from '../AccessibilitySettings';
import { NotificationBell } from '../NotificationBell/NotificationBell';

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

interface MenuItem {
  text: string;
  icon: JSX.Element;
  path: string;
  roles?: string[];
  section?: string;
  children?: MenuItem[];
}

export const DashboardLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const menuItems: MenuItem[] = [
    // Dashboard - First item for all roles (at the top)
    { text: 'Municipality Admin', icon: <MunicipalityIcon />, path: '/municipality', roles: ['municipality_admin'], section: 'main' },
    { text: t('menu.dashboard'), icon: <DashboardIcon />, path: '/dashboard', roles: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head', 'eca_coordinator', 'sports_coordinator', 'librarian'], section: 'main' },
    { text: t('menu.dashboard') || 'Dashboard', icon: <DashboardIcon />, path: '/portal/accountant', roles: ['accountant'], section: 'main' },
    { text: t('menu.dashboard') || 'Dashboard', icon: <DashboardIcon />, path: '/portal/transport', roles: ['transport_manager'], section: 'main' },
    { text: t('menu.dashboard') || 'Dashboard', icon: <DashboardIcon />, path: '/portal/hostel', roles: ['hostel_warden'], section: 'main' },
    { text: t('menu.dashboard') || 'Dashboard', icon: <DashboardIcon />, path: '/portal/non-teaching-staff', roles: ['non_teaching_staff'], section: 'main' },
    
    // Academic Section
    { text: t('menu.students'), icon: <PeopleIcon />, path: '/students', roles: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head'], section: 'academic' },
    { text: t('menu.admissions'), icon: <PersonAddIcon />, path: '/admissions', roles: ['school_admin', 'accountant'], section: 'academic' },
    { text: t('menu.staff'), icon: <StaffIcon />, path: '/staff', roles: ['school_admin'], section: 'academic' },
    { text: t('menu.academic'), icon: <ClassIcon />, path: '/academic', roles: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head'], section: 'academic' },
    { text: t('menu.attendance'), icon: <AssignmentIcon />, path: '/attendance', roles: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head'], section: 'academic' },
    { text: t('menu.examinations'), icon: <SchoolIcon />, path: '/examinations', roles: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head'], section: 'academic' },
    
    // Management Section
    { text: t('menu.finance'), icon: <MoneyIcon />, path: '/finance', roles: ['school_admin', 'accountant'], section: 'management' },
    { text: t('menu.library'), icon: <LibraryIcon />, path: '/library', roles: ['school_admin', 'librarian'], section: 'management' },
    { text: t('menu.eca'), icon: <SportsIcon />, path: '/eca', roles: ['school_admin', 'eca_coordinator', 'department_head'], section: 'management' },
    { text: t('menu.sports'), icon: <SportsIcon />, path: '/sports', roles: ['school_admin', 'sports_coordinator', 'department_head'], section: 'management' },
    { text: t('menu.calendar'), icon: <CalendarIcon />, path: '/calendar', section: 'management' },
    
    // Communication Section
    { text: t('communication.messages'), icon: <MessageIcon />, path: '/communication/messages', section: 'communication' },
    { text: t('communication.announcements'), icon: <NotificationsIcon />, path: '/communication/announcements', section: 'communication' },
    { text: t('notifications.title') || 'Notifications', icon: <NotificationsIcon />, path: '/my-notifications', section: 'communication' },
    
    // Reports & Documents
    { text: t('menu.reports'), icon: <ReportIcon />, path: '/reports', roles: ['school_admin', 'department_head', 'class_teacher', 'subject_teacher', 'accountant', 'librarian', 'eca_coordinator', 'sports_coordinator'], section: 'reports' },
    { text: t('certificates.title'), icon: <CertificateIcon />, path: '/certificates', roles: ['school_admin'], section: 'reports' },
    { text: t('documents.title'), icon: <DescriptionIcon />, path: '/documents', roles: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head', 'eca_coordinator', 'sports_coordinator', 'librarian', 'accountant', 'transport_manager', 'hostel_warden', 'non_teaching_staff'], section: 'reports' },
    
    // System Settings
    { text: t('menu.users') || 'User Management', icon: <PeopleIcon />, path: '/users', roles: ['school_admin'], section: 'settings' },
    { text: t('menu.auditLogs'), icon: <HistoryIcon />, path: '/audit', roles: ['school_admin'], section: 'settings' },
    { text: t('settings.roleManagement'), icon: <SecurityIcon />, path: '/settings/roles', roles: ['school_admin'], section: 'settings' },
    { text: t('systemSettings.title'), icon: <TuneIcon />, path: '/settings/system', roles: ['school_admin'], section: 'settings' },
    { text: t('backup.title'), icon: <BackupIcon />, path: '/settings/backup', roles: ['school_admin'], section: 'settings' },
    { text: t('archive.title'), icon: <ArchiveIcon />, path: '/settings/archive', roles: ['school_admin'], section: 'settings' },
    { text: t('menu.settings'), icon: <SettingsIcon />, path: '/settings', roles: ['school_admin'], section: 'settings' },
    
    // Role-specific portals
    { text: t('menu.teacherPortal') || 'Teacher Portal', icon: <TeacherPortalIcon />, path: '/teacher/dashboard', roles: ['class_teacher', 'subject_teacher', 'department_head'], section: 'portals' },
    { text: t('menu.myPortal') || 'My Portal', icon: <PersonIcon />, path: '/portal/student', roles: ['student'], section: 'portals' },
    { text: t('menu.parentPortal') || 'Parent Portal', icon: <FamilyIcon />, path: '/portal/parent', roles: ['parent'], section: 'portals' },
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
    const targetPath = municipalitySlug ? `/${municipalitySlug}${path}` : path;
    navigate(targetPath);
    setMobileOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.some(role => role.toLowerCase() === user.role.toLowerCase()))
  );

  const groupedMenuItems = filteredMenuItems.reduce((acc, item) => {
    const section = item.section || 'other';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const sectionTitles: Record<string, string> = {
    main: t('menu.dashboard'),
    academic: t('menu.academic') || 'Academic',
    management: t('menu.management') || 'Management',
    communication: t('communication.title') || 'Communication',
    reports: t('menu.reports') || 'Reports',
    settings: t('menu.settings') || 'Settings',
    portals: t('menu.portals') || 'Portals',
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = location.pathname.startsWith(item.path);
    
    return (
      <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
        <Tooltip title={sidebarCollapsed ? item.text : ''} placement="right" arrow>
          <ListItemButton
            onClick={() => handleNavigate(item.path)}
            selected={isActive}
            aria-label={`Navigate to ${item.text}`}
            sx={{
              borderRadius: 1.5,
              py: 1.25,
              px: sidebarCollapsed ? 1.5 : 2,
              mx: 0.5,
              mb: 0.5,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
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
                  : theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)'
                    : 'linear-gradient(135deg, rgba(0,122,255,0.08) 0%, rgba(0,122,255,0.04) 100%)',
                transform: sidebarCollapsed ? 'scale(1.05)' : 'translateX(4px)',
                boxShadow: isActive 
                  ? '0 6px 16px rgba(0,122,255,0.25), 0 2px 8px rgba(0,122,255,0.15)' 
                  : theme.palette.mode === 'dark'
                    ? '0 4px 12px rgba(0,0,0,0.3), 0 2px 6px rgba(255,255,255,0.05)'
                    : '0 4px 12px rgba(0,122,255,0.12), 0 2px 6px rgba(0,122,255,0.08)',
                border: isActive
                  ? '1px solid rgba(0,122,255,0.3)'
                  : theme.palette.mode === 'dark'
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid rgba(0,122,255,0.15)',
              },
            }}
          >
            <ListItemIcon aria-hidden="true" sx={{ 
              color: isActive 
                ? '#007AFF'
                : theme.palette.text.secondary,
              minWidth: sidebarCollapsed ? 'auto' : 40,
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
            }}>
              {item.icon}
            </ListItemIcon>
            {!sidebarCollapsed && (
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontSize: '0.85rem', 
                  fontWeight: isActive ? 600 : 400 
                }} 
              />
            )}
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', px: 2, py: 2.5 }}>
        {!sidebarCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              p: 1.25, 
              borderRadius: 1.5, 
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
          </Box>
        )}
        {sidebarCollapsed && (
          <Box sx={{ 
            p: 1.25, 
            borderRadius: 1.5, 
            background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,122,255,0.4), 0 0 0 1px rgba(255,255,255,0.2) inset',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <SchoolIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
        )}
      </Toolbar>
      
      <Box sx={{ px: 1.5, mb: 1, display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-end' }}>
        <Tooltip title={sidebarCollapsed ? t('menu.expand') || 'Expand' : t('menu.collapse') || 'Collapse'} placement="right" arrow>
          <IconButton 
            onClick={toggleSidebar}
            size="small"
            sx={{
              background: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.05)' 
                : 'rgba(0,0,0,0.03)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 100%)' 
                  : 'linear-gradient(135deg, rgba(0,122,255,0.1) 0%, rgba(0,122,255,0.05) 100%)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,122,255,0.2)'}`,
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.3), 0 2px 6px rgba(255,255,255,0.05)'
                  : '0 4px 12px rgba(0,122,255,0.15), 0 2px 6px rgba(0,122,255,0.08)',
                transform: 'scale(1.05)',
              }
            }}
          >
            {sidebarCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
      
      <Divider sx={{ mb: 2, opacity: 0.1, mx: 2 }} />
      
      <Box role="navigation" aria-label="Main navigation" sx={{ px: 1.5, flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {Object.entries(groupedMenuItems).map(([section, items]) => (
          <Box key={section} sx={{ mb: 2 }}>
            {!sidebarCollapsed && section !== 'main' && (
              <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  height: '1px',
                  flexGrow: 1,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, rgba(0,122,255,0.3) 0%, transparent 100%)'
                    : 'linear-gradient(90deg, rgba(0,122,255,0.2) 0%, transparent 100%)',
                }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: theme.palette.mode === 'dark' ? 'rgba(0,122,255,0.7)' : '#007AFF',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    flexShrink: 0,
                  }}
                >
                  {sectionTitles[section] || section}
                </Typography>
              </Box>
            )}
            <List sx={{ py: 0 }}>
              {items.map(renderMenuItem)}
            </List>
          </Box>
        ))}
      </Box>
      
      <Box sx={{ p: 2 }}>
        <Box sx={{ 
          p: sidebarCollapsed ? 1.5 : 2, 
          borderRadius: 2,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
            : 'linear-gradient(135deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.02) 100%)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          gap: sidebarCollapsed ? 0 : 1.5,
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
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)'
              : 'linear-gradient(135deg, rgba(0,122,255,0.08) 0%, rgba(0,122,255,0.04) 100%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.12) inset'
              : '0 8px 24px rgba(0,122,255,0.15), 0 4px 12px rgba(0,122,255,0.08), 0 0 0 1px rgba(255,255,255,0.8) inset',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,122,255,0.2)'}`,
          }
        }}>
          <Avatar 
            sx={{ 
              width: sidebarCollapsed ? 36 : 40, 
              height: sidebarCollapsed ? 36 : 40, 
              background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,122,255,0.3), 0 0 0 1px rgba(255,255,255,0.2) inset',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {user?.firstName?.[0] || user?.username?.[0] || 'U'}
          </Avatar>
          {!sidebarCollapsed && (
            <Box sx={{ overflow: 'hidden', flexGrow: 1, position: 'relative', zIndex: 1 }}>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                {user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : user?.username || t('menu.user')}
              </Typography>
              <Chip
                label={(user?.role || t('menu.guest') || 'Guest').replace(/_/g, ' ')}
                size="small"
                sx={{
                  mt: 0.5,
                  height: 18,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'capitalize',
                  color: '#007AFF',
                  background: 'rgba(0,122,255,0.12)',
                  border: '1px solid rgba(0,122,255,0.25)',
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            </Box>
          )}
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
          width: { sm: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          ml: { sm: `${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
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
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
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

          {/* Page title — derived from active menu item */}
          {(() => {
            const active = filteredMenuItems.find(item =>
              location.pathname === `/${municipalitySlug}${item.path}` ||
              location.pathname.startsWith(`/${municipalitySlug}${item.path}/`)
            );
            return active ? (
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 28, height: 28,
                  borderRadius: 1.5,
                  background: 'linear-gradient(135deg, rgba(0,122,255,0.15) 0%, rgba(88,86,214,0.15) 100%)',
                  border: '1px solid rgba(0,122,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#007AFF',
                  '& svg': { fontSize: 16 },
                }}>
                  {active.icon}
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.92rem', letterSpacing: '-0.01em' }}>
                  {active.text}
                </Typography>
              </Box>
            ) : null;
          })()}
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <OfflineIndicator />
            <LiteModeIndicator />
            <AccessibilitySettings compact />
            <ThemeToggle />
            <LanguageSwitcher />
            <NotificationBell />
            
            {/* Visual separator */}
            <Box sx={{ width: 1, height: 24, background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)', mx: 0.5 }} />

            {/* User info pill + avatar */}
            <Box
              onClick={handleMenuOpen}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,122,255,0.06)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,122,255,0.2)'}`,
                  transform: 'translateY(-1px)',
                  boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,122,255,0.1)',
                },
              }}
            >
              <Avatar
                sx={{
                  background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                  width: 28, height: 28,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(0,122,255,0.3)',
                }}
              >
                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.2 }}>
                  {user?.firstName || user?.username || t('menu.user')}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#007AFF', fontWeight: 600, textTransform: 'capitalize' }}>
                  {(user?.role || '').replace(/_/g, ' ')}
                </Typography>
              </Box>
            </Box>

            {/* Mobile avatar only */}
            <IconButton onClick={handleMenuOpen} sx={{ p: 0, ml: 0.5, display: { xs: 'flex', sm: 'none' } }}>
              <Avatar
                sx={{
                  background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                  width: 34, height: 34,
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
                borderRadius: 2,
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
            <MenuItem onClick={handleMenuClose} sx={{ fontSize: '0.85rem', position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', fontWeight: 700 }}>
                  {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    {user?.firstName ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}` : user?.username || 'User'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#007AFF', fontWeight: 600, textTransform: 'capitalize', fontSize: '0.7rem' }}>
                    {(user?.role || '').replace(/_/g, ' ')}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <Divider sx={{ my: 0.5, opacity: 0.15 }} />
            <MenuItem onClick={handleMenuClose} sx={{ fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
              <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
              {t('menu.profile')}
            </MenuItem>
            <MenuItem onClick={handleMenuClose} sx={{ fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              {t('menu.settings')}
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate(`/${municipalitySlug}/change-password`); }} sx={{ fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>
              <ListItemIcon>
                <LockIcon fontSize="small" />
              </ListItemIcon>
              Change password
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
        sx={{ width: { sm: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth }, flexShrink: { sm: 0 } }}
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
              width: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth,
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.65) 100%)',
              borderRight: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.5)'}`,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 0 0 1px rgba(255,255,255,0.05) inset, 0 8px 32px rgba(0,0,0,0.3)'
                : '0 0 0 1px rgba(255,255,255,0.5) inset, 0 8px 32px rgba(0,0,0,0.04)',
              transition: 'width 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
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
          width: { sm: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          mt: 7,
          minHeight: '100vh',
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
          transition: 'width 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

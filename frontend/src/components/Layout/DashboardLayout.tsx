import { useMemo, useState } from 'react';
import { Box, Drawer } from '@mui/material';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import '../../styles/dashboard.css';

const drawerWidth = 214;
const collapsedDrawerWidth = 58;

export const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? collapsedDrawerWidth : drawerWidth;

  const scopedPath = useMemo(() => {
    if (!municipalitySlug) return location.pathname;
    const prefix = `/${municipalitySlug}`;
    return location.pathname.startsWith(prefix) ? location.pathname.slice(prefix.length) || '/dashboard' : location.pathname;
  }, [location.pathname, municipalitySlug]);

  const navigateTo = (path: string) => {
    const target = municipalitySlug ? `/${municipalitySlug}${path}` : path;
    navigate(target);
    setMobileOpen(false);
  };

  return (
    <Box className="sms-dashboard-shell">
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <TopNavbar sidebarWidth={sidebarWidth} onMobileMenu={() => setMobileOpen(true)} />

      <Box component="nav" sx={{ width: { md: sidebarWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, border: 0, bgcolor: '#081427' },
          }}
        >
          <Sidebar
            collapsed={false}
            currentPath={scopedPath}
            role={user?.role}
            onCollapse={() => setCollapsed((value) => !value)}
            onNavigate={navigateTo}
          />
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: sidebarWidth,
              border: 0,
              bgcolor: '#081427',
              overflowX: 'hidden',
              transition: 'width 0.25s ease',
            },
          }}
          open
        >
          <Sidebar
            collapsed={collapsed}
            currentPath={scopedPath}
            role={user?.role}
            onCollapse={() => setCollapsed((value) => !value)}
            onNavigate={navigateTo}
          />
        </Drawer>
      </Box>

      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          ml: { md: `${sidebarWidth}px` },
          // Reserve the fixed 49px topbar height + a clear gap so content never tucks under it
          pt: { xs: '62px', md: '64px' },
          px: { xs: 0.7, sm: 0.95, lg: 1 },
          pb: 1.8,
          minHeight: '100vh',
          transition: 'width 0.25s ease, margin-left 0.25s ease',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

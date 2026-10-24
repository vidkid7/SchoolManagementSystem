import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Avatar,
  Autocomplete,
  Badge,
  Box,
  IconButton,
  InputAdornment,
  CircularProgress,
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
import apiClient from '../../services/apiClient';
import { navigationSections, type NavItem } from './navigation';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

type SearchOption = {
  kind: 'module' | 'student' | 'invoice';
  label: string;
  detail?: string;
  path: string;
};
type StudentSearchRecord = {
  studentId?: number | string;
  student_id?: number | string;
  firstNameEn?: string | null;
  first_name_en?: string | null;
  middleNameEn?: string | null;
  middle_name_en?: string | null;
  lastNameEn?: string | null;
  last_name_en?: string | null;
  studentCode?: string;
  student_code?: string;
};
type InvoiceSearchRecord = {
  invoice_number?: string;
  invoiceNumber?: string;
  student_name?: string;
  studentName?: string;
};

function canSee(item: NavItem, role?: string) {
  return !item.roles?.length || Boolean(role && item.roles.includes(role));
}

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
  const [searchInput, setSearchInput] = useState('');
  const [remoteOptions, setRemoteOptions] = useState<SearchOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 250);
  const searchInputRef = useRef(searchInput.trim());

  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'User';
  const initials = userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const moduleOptions = useMemo(() => {
    const role = user?.role;
    return navigationSections.flatMap((section) => section.items
      .filter((item) => canSee(item, role))
      .flatMap((item) => {
        if (item.children?.length) {
          return item.children.filter((child) => canSee(child, role) && child.path).map((child) => ({
            kind: 'module' as const,
            label: child.label,
            detail: section.title,
            path: child.path!,
          }));
        }
        return item.path ? [{ kind: 'module' as const, label: item.label, detail: section.title, path: item.path }] : [];
      }));
  }, [user?.role]);

  const filteredModuleOptions = useMemo(() => {
    const query = searchInput.trim().toLocaleLowerCase();
    return query ? moduleOptions.filter((option) => `${option.label} ${option.detail}`.toLocaleLowerCase().includes(query)) : [];
  }, [moduleOptions, searchInput]);

  useEffect(() => {
    let cancelled = false;
    if (debouncedSearch.length < 2) return undefined;

    const canSearchStudents = moduleOptions.some((option) => option.path === '/students');
    const canSearchInvoices = moduleOptions.some((option) => option.path === '/finance/invoices');
    Promise.allSettled([
      canSearchStudents ? apiClient.get(`/api/v1/students?page=1&limit=5&search=${encodeURIComponent(debouncedSearch)}`) : Promise.resolve({ data: { data: [] } }),
      canSearchInvoices ? apiClient.get(`/api/v1/finance/invoices?page=1&limit=5&search=${encodeURIComponent(debouncedSearch)}`) : Promise.resolve({ data: { data: [] } }),
    ]).then(([studentsResult, invoicesResult]) => {
      if (cancelled || searchInputRef.current !== debouncedSearch) return;
      const studentPayload = studentsResult.status === 'fulfilled' ? studentsResult.value.data?.data : [];
      const invoicePayload = invoicesResult.status === 'fulfilled' ? invoicesResult.value.data?.data : [];
      const students: StudentSearchRecord[] = Array.isArray(studentPayload) ? studentPayload : [];
      const invoices: InvoiceSearchRecord[] = Array.isArray(invoicePayload) ? invoicePayload : [];
      const results: SearchOption[] = [
        ...students.flatMap((student) => {
          const id = student.studentId ?? student.student_id;
          if (!id) return [];
          const name = [student.firstNameEn ?? student.first_name_en, student.middleNameEn ?? student.middle_name_en, student.lastNameEn ?? student.last_name_en].filter(Boolean).join(' ');
          return [{ kind: 'student' as const, label: name || student.studentCode || student.student_code || `Student ${id}`, detail: student.studentCode || student.student_code || 'Student', path: `/students/${id}` }];
        }),
        ...invoices.flatMap((invoice) => {
          const number = invoice.invoice_number ?? invoice.invoiceNumber;
          if (!number) return [];
          return [{ kind: 'invoice' as const, label: number, detail: invoice.student_name || invoice.studentName || 'Invoice', path: `/finance/invoices?search=${encodeURIComponent(number)}` }];
        }),
      ];
      setRemoteOptions(results);
    }).finally(() => {
      if (!cancelled && searchInputRef.current === debouncedSearch) setSearchLoading(false);
    });
    return () => { cancelled = true; };
  }, [debouncedSearch, moduleOptions]);

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
          <Typography component="div" variant="h6" className="dashboard-topbar__title">
            {isDashboardPath(location.pathname)
              ? compact
                ? (user?.firstName || userName.split(' ')[0] || 'Dashboard')
                : `${(user?.firstName || userName.split(' ')[0] || 'there')} 👋`
              : titleFromPath(location.pathname)}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        {!compact && (
          <Autocomplete
            size="small"
            options={[...filteredModuleOptions, ...(searchInput.trim().length >= 2 ? remoteOptions : [])]}
            inputValue={searchInput}
            loading={searchLoading}
            filterOptions={(options) => options}
            getOptionLabel={(option) => option.label}
            groupBy={(option) => option.kind === 'module' ? 'Modules' : option.kind === 'student' ? 'Students' : 'Invoices'}
            onInputChange={(_event, value) => {
              const query = value.trim();
              searchInputRef.current = query;
              setSearchInput(value);
              setSearchLoading(query.length >= 2);
              if (query.length < 2) setRemoteOptions([]);
            }}
            onChange={(_event, option) => {
              if (option) {
                navigate(option.path);
                setSearchInput('');
              }
            }}
            noOptionsText={searchInput.trim().length < 2 ? 'Type at least 2 characters' : 'No matching modules, students, or invoices'}
            sx={{ width: { md: 290, lg: 330, xl: 360 } }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search modules, students, invoices"
                className="dashboard-topbar__search"
                inputProps={{ ...params.inputProps, 'aria-label': 'Search modules, students, invoices' }}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {searchLoading && <CircularProgress color="inherit" size={16} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={`${option.kind}:${option.path}`}>
                <Box><Typography variant="body2">{option.label}</Typography><Typography variant="caption" color="text.secondary">{option.detail}</Typography></Box>
              </li>
            )}
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
            component="button"
            type="button"
            direction="row"
            alignItems="center"
            spacing={1}
            onClick={(event) => setAnchorEl(event.currentTarget)}
            aria-label={compact ? `${initials || 'U'} Account menu` : undefined}
            className="dashboard-topbar__account"
            sx={{
              px: { xs: 0.45, sm: 0.8 },
              py: 0.35,
              font: 'inherit',
              textAlign: 'left',
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

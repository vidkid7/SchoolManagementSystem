import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Badge as BadgeIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  ManageAccounts as ManageAccountsIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { C, useAdminStyles } from '../../theme/designTokens';

function formatRole(role?: string) {
  return role ? role.replace(/_/g, ' ') : 'User';
}

export default function Profile() {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const navigate = useSlugNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role?.toLowerCase() === 'school_admin';
  const fullName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : user?.username || 'User';

  const details = [
    { label: 'Username', value: user?.username || '-', icon: <PersonIcon /> },
    { label: 'Email', value: user?.email || '-', icon: <EmailIcon /> },
    { label: 'Role', value: formatRole(user?.role), icon: <BadgeIcon /> },
    { label: 'Municipality', value: user?.municipalityName || user?.municipalityCode || '-', icon: <SchoolIcon /> },
  ];

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
      <Card sx={{ ...S.PAGE_HEADER, overflow: 'hidden' }}>
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Avatar
              sx={{
                width: 74,
                height: 74,
                fontSize: '1.8rem',
                fontWeight: 800,
                bgcolor: C.primary,
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.success} 100%)`,
                boxShadow: '0 18px 38px rgba(0,122,255,0.26)',
              }}
            >
              {fullName[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: C.primary, fontWeight: 800 }}>
                My account
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                {fullName}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={formatRole(user?.role)} color="primary" variant="outlined" />
                {user?.municipalityCode && <Chip label={user.municipalityCode} variant="outlined" />}
              </Stack>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Button
                variant="contained"
                startIcon={<LockIcon />}
                onClick={() => navigate('/change-password')}
              >
                Change Password
              </Button>
              {isAdmin && (
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate('/settings')}
                >
                  Settings
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        {details.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={1.5}>
                  <Box sx={S.ICON_BOX(C.primary, 42)}>{item.icon}</Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 2.5 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <ManageAccountsIcon sx={{ color: C.primary }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Account actions
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button variant="outlined" startIcon={<LockIcon />} onClick={() => navigate('/change-password')}>
              Update password
            </Button>
            {isAdmin && (
              <Button variant="outlined" startIcon={<PersonIcon />} onClick={() => navigate('/users')}>
                Manage users
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

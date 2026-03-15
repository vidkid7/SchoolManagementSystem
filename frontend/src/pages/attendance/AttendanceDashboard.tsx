/**
 * Attendance Dashboard
 * 
 * Main dashboard for attendance management with all features
 */

import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Assignment as AttendanceIcon,
  People as StudentsIcon,
  PersonAdd as StaffIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  EventNote as LeaveIcon,
} from '@mui/icons-material';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function AttendanceDashboard() {
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const { t } = useTranslation();
  const S = useAdminStyles(theme);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const features = [
    {
      title: t('attendance.markStudentAttendance'),
      description: t('attendance.markStudentAttendanceDesc'),
      icon: <StudentsIcon sx={{ fontSize: 40 }} />,
      color: C.primary,
      path: '/attendance/student/mark',
    },
    {
      title: t('attendance.markStaffAttendance'),
      description: t('attendance.markStaffAttendanceDesc'),
      icon: <StaffIcon sx={{ fontSize: 40 }} />,
      color: C.primary,
      path: '/attendance/staff/mark',
    },
    {
      title: t('attendance.attendanceReport'),
      description: t('attendance.attendanceReportsDesc'),
      icon: <ReportsIcon sx={{ fontSize: 40 }} />,
      color: C.neutral,
      path: '/attendance/reports',
    },
    {
      title: t('attendance.leaveApplications'),
      description: t('attendance.leaveApplicationsDesc'),
      icon: <LeaveIcon sx={{ fontSize: 40 }} />,
      color: C.neutral,
      path: '/attendance/leave',
    },
    {
      title: t('attendance.attendanceRulesLabel'),
      description: t('attendance.attendanceRulesDesc'),
      icon: <SettingsIcon sx={{ fontSize: 40 }} />,
      color: C.danger,
      path: '/attendance/settings',
    },
  ];

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AttendanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={600}>
            {t('attendance.attendanceManagement')}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {t('attendance.comprehensiveTracking')}
        </Typography>
        
        {/* Quick Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<StudentsIcon />}
            onClick={() => navigate('/attendance/student/mark')}
            sx={S.BTN_PRIMARY}
          >
            {t('attendance.markStudentAttendance')}
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<StaffIcon />}
            onClick={() => navigate('/attendance/staff/mark')}
            sx={S.BTN_PRIMARY}
          >
            {t('attendance.markStaffAttendance')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<ReportsIcon />}
            onClick={() => navigate('/attendance/reports')}
            sx={S.BTN_OUTLINE}
          >
            {t('attendance.viewReports')}
          </Button>
        </Box>
      </Paper>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label={t('common.overview')} sx={S.TAB_ACTIVE} />
        <Tab label={t('common.actions')} sx={S.TAB_ACTIVE} />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                sx={{
                  ...S.GLASS,
                  height: '100%',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate(feature.path)}
              >
                <CardContent>
                  <Box
                    sx={S.ICON_BOX(feature.color, 80)}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<StudentsIcon />}
              onClick={() => navigate('/attendance/student/mark')}
              sx={{ ...S.BTN_PRIMARY, py: 2 }}
            >
              {t('attendance.markStudentAttendance')}
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<StaffIcon />}
              onClick={() => navigate('/attendance/staff/mark')}
              sx={{ ...S.BTN_PRIMARY, py: 2 }}
            >
              {t('attendance.markStaffAttendance')}
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ReportsIcon />}
              onClick={() => navigate('/attendance/reports')}
              sx={{ ...S.BTN_OUTLINE, py: 2 }}
            >
              {t('attendance.viewReports')}
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<LeaveIcon />}
              onClick={() => navigate('/attendance/leave')}
              sx={{ ...S.BTN_OUTLINE, py: 2 }}
            >
              {t('attendance.manageLeaveApplications')}
            </Button>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}

export default AttendanceDashboard;

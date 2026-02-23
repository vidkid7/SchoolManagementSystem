/**
 * Attendance Dashboard
 * 
 * Main dashboard for attendance management with all features
 */

import { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const features = [
    {
      title: 'Mark Student Attendance',
      description: 'Mark daily attendance for students by class',
      icon: <StudentsIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      path: '/attendance/student/mark',
    },
    {
      title: 'Mark Staff Attendance',
      description: 'Record staff attendance and working hours',
      icon: <StaffIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      path: '/attendance/staff/mark',
    },
    {
      title: 'Attendance Reports',
      description: 'View detailed attendance reports and statistics',
      icon: <ReportsIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      path: '/attendance/reports',
    },
    {
      title: 'Leave Applications',
      description: 'Manage student and staff leave requests',
      icon: <LeaveIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      path: '/attendance/leave',
    },
    {
      title: 'Attendance Rules',
      description: 'Configure attendance policies and rules',
      icon: <SettingsIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
      path: '/attendance/settings',
    },
  ];

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AttendanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={600}>
            Attendance Management
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Comprehensive attendance tracking and management system for students and staff
        </Typography>
        
        {/* Quick Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<StudentsIcon />}
            onClick={() => navigate('/attendance/student/mark')}
          >
            Mark Student Attendance
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<StaffIcon />}
            onClick={() => navigate('/attendance/staff/mark')}
          >
            Mark Staff Attendance
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<ReportsIcon />}
            onClick={() => navigate('/attendance/reports')}
          >
            View Reports
          </Button>
        </Box>
      </Paper>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Quick Actions" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => navigate(feature.path)}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      bgcolor: `${feature.color}15`,
                      color: feature.color,
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
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
              sx={{ py: 2 }}
            >
              Mark Student Attendance
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<StaffIcon />}
              onClick={() => navigate('/attendance/staff/mark')}
              sx={{ py: 2 }}
            >
              Mark Staff Attendance
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ReportsIcon />}
              onClick={() => navigate('/attendance/reports')}
              sx={{ py: 2 }}
            >
              View Reports
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<LeaveIcon />}
              onClick={() => navigate('/attendance/leave')}
              sx={{ py: 2 }}
            >
              Manage Leave Applications
            </Button>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}

export default AttendanceDashboard;

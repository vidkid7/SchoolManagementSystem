import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Paper,
  Tabs,
  Tab,
  Button,
  Divider,
  Avatar,
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  EventNote as EventIcon,
  Receipt as ReceiptIcon,
  EmojiEvents as TrophyIcon,
  MenuBook as BookIcon,
  CalendarMonth as CalendarIcon,
  Notifications as NotificationIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

interface DashboardData {
  attendance: { present: number; total: number; percentage: number };
  grades: Array<{ subject: string; grade: string; gpa: number }>;
  fees: { paid: number; pending: number; total: number };
  assignments: Array<{ title: string; subject: string; dueDate: string; status: string }>;
  notices: Array<{ id: number; title: string; date: string }>;
  timetable: Array<{ period: number; subject: string; teacher: string; time: string }>;
}

const StudentPortal: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState<DashboardData>({
    attendance: { present: 185, total: 200, percentage: 92.5 },
    grades: [
      { subject: 'Mathematics', grade: 'A+', gpa: 4.0 },
      { subject: 'Science', grade: 'A', gpa: 3.6 },
      { subject: 'English', grade: 'B+', gpa: 3.2 },
      { subject: 'Nepali', grade: 'A', gpa: 3.6 },
      { subject: 'Social Studies', grade: 'A+', gpa: 4.0 },
    ],
    fees: { paid: 45000, pending: 15000, total: 60000 },
    assignments: [
      { title: 'Math Homework Ch. 5', subject: 'Mathematics', dueDate: '2082-11-05', status: 'pending' },
      { title: 'Science Lab Report', subject: 'Science', dueDate: '2082-11-03', status: 'submitted' },
      { title: 'English Essay', subject: 'English', dueDate: '2082-11-07', status: 'pending' },
    ],
    notices: [
      { id: 1, title: 'Annual Sports Day - Falgun 15', date: '2082-10-28' },
      { id: 2, title: 'Parent-Teacher Meeting', date: '2082-11-01' },
      { id: 3, title: 'Science Exhibition', date: '2082-11-10' },
    ],
    timetable: [
      { period: 1, subject: 'Mathematics', teacher: 'Mr. Sharma', time: '10:00 - 10:45' },
      { period: 2, subject: 'Science', teacher: 'Mrs. Thapa', time: '10:45 - 11:30' },
      { period: 3, subject: 'English', teacher: 'Mr. Adhikari', time: '11:45 - 12:30' },
      { period: 4, subject: 'Nepali', teacher: 'Mrs. Poudel', time: '12:30 - 13:15' },
      { period: 5, subject: 'Social Studies', teacher: 'Mr. KC', time: '14:00 - 14:45' },
    ],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [attendanceRes, gradesRes, feesRes] = await Promise.allSettled([
          apiClient.get('/api/v1/students/me/attendance/summary'),
          apiClient.get('/api/v1/students/me/grades'),
          apiClient.get('/api/v1/students/me/fees/summary'),
        ]);

        setData(prev => {
          const updated = { ...prev };
          if (attendanceRes.status === 'fulfilled') updated.attendance = attendanceRes.value.data.data;
          if (gradesRes.status === 'fulfilled') updated.grades = gradesRes.value.data.data;
          if (feesRes.status === 'fulfilled') updated.fees = feesRes.value.data.data;
          return updated;
        });
      } catch {
        // Use default data
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const attendanceColor = data.attendance.percentage >= 75 ? 'success' : 'error';

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Student Portal</Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon color="primary" />
                <Typography color="textSecondary">Attendance</Typography>
              </Box>
              <Typography variant="h4" color={`${attendanceColor}.main`}>
                {data.attendance.percentage}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={data.attendance.percentage}
                color={attendanceColor}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon color="info" />
                <Typography color="textSecondary">GPA</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {(data.grades.reduce((sum, g) => sum + g.gpa, 0) / data.grades.length).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {data.grades.length} subjects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon color="warning" />
                <Typography color="textSecondary">Fee Status</Typography>
              </Box>
              <Typography variant="h4" color={data.fees.pending > 0 ? 'warning.main' : 'success.main'}>
                Rs. {data.fees.pending.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                pending of Rs. {data.fees.total.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon color="secondary" />
                <Typography color="textSecondary">Assignments</Typography>
              </Box>
              <Typography variant="h4" color="secondary.main">
                {data.assignments.filter(a => a.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                pending assignments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<CalendarIcon />} label="Timetable" />
          <Tab icon={<AssignmentIcon />} label="Assignments" />
          <Tab icon={<SchoolIcon />} label="Grades" />
          <Tab icon={<NotificationIcon />} label="Notices" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TabPanel value={tabValue} index={0}>
            <List>
              {data.timetable.map((item) => (
                <ListItem key={item.period} divider>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 14 }}>
                      {item.period}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={item.subject}
                    secondary={`${item.teacher} | ${item.time}`}
                  />
                </ListItem>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <List>
              {data.assignments.map((item, idx) => (
                <ListItem key={idx} divider>
                  <ListItemIcon>
                    {item.status === 'submitted' ? (
                      <CheckIcon color="success" />
                    ) : (
                      <WarningIcon color="warning" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    secondary={`${item.subject} | Due: ${item.dueDate}`}
                  />
                  <Chip
                    label={item.status}
                    color={item.status === 'submitted' ? 'success' : 'warning'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <List>
              {data.grades.map((item, idx) => (
                <ListItem key={idx} divider>
                  <ListItemIcon>
                    <BookIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.subject}
                    secondary={`GPA: ${item.gpa}`}
                  />
                  <Chip label={item.grade} color="primary" />
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button startIcon={<DownloadIcon />} variant="outlined">
                Download Report Card
              </Button>
              <Button startIcon={<DownloadIcon />} variant="outlined">
                Download CV
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <List>
              {data.notices.map((item) => (
                <ListItem key={item.id} divider>
                  <ListItemIcon>
                    <EventIcon color="info" />
                  </ListItemIcon>
                  <ListItemText primary={item.title} secondary={item.date} />
                </ListItem>
              ))}
            </List>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default StudentPortal;

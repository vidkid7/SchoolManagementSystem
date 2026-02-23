/**
 * Teacher Dashboard
 * 
 * Main dashboard for teachers with today's schedule, pending tasks, and class performance
 */

import { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// Sample data for today's schedule
const todaySchedule = [
  { period: 1, time: '08:00-08:45', subject: 'Mathematics', class: 'Class 10 A', room: 'Room 201', status: 'completed' },
  { period: 2, time: '08:45-09:30', subject: 'Mathematics', class: 'Class 10 B', room: 'Room 201', status: 'completed' },
  { period: 3, time: '09:30-10:15', subject: 'Physics', class: 'Class 11 Science', room: 'Lab 1', status: 'ongoing' },
  { period: 4, time: '10:30-11:15', subject: 'Mathematics', class: 'Class 9 A', room: 'Room 201', status: 'upcoming' },
  { period: 5, time: '11:15-12:00', subject: 'Physics', class: 'Class 12 Science', room: 'Lab 1', status: 'upcoming' },
];

// Sample pending tasks
const pendingTasks = [
  { type: 'attendance', title: 'Mark attendance for Class 10 A', priority: 'high', count: 1 },
  { type: 'grading', title: 'Grade assignments for Class 11 Science', priority: 'medium', count: 25 },
  { type: 'lesson', title: 'Prepare lesson plan for tomorrow', priority: 'medium', count: 3 },
  { type: 'exam', title: 'Create exam questions for Terminal', priority: 'low', count: 1 },
];

// Sample class performance data
const classPerformanceData = [
  { class: 'Class 10 A', attendance: 92, avgGrade: 3.5, assignments: 85 },
  { class: 'Class 10 B', attendance: 88, avgGrade: 3.2, assignments: 78 },
  { class: 'Class 11 Sci', attendance: 85, avgGrade: 3.8, assignments: 90 },
  { class: 'Class 12 Sci', attendance: 90, avgGrade: 3.6, assignments: 88 },
];

// Sample attendance trend
const attendanceTrend = [
  { week: 'Week 1', rate: 88 },
  { week: 'Week 2', rate: 90 },
  { week: 'Week 3', rate: 87 },
  { week: 'Week 4', rate: 92 },
];

// Sample notifications
const notifications = [
  { icon: <EventIcon color="primary" />, text: 'Parent-Teacher meeting scheduled for 2081-11-10', time: '2 hours ago' },
  { icon: <WarningIcon color="warning" />, text: '3 students with low attendance in Class 10 A', time: '5 hours ago' },
  { icon: <CheckCircleIcon color="success" />, text: 'Lesson plan approved by principal', time: '1 day ago' },
];

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [currentPeriod] = useState(3); // Current period number

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'ongoing':
        return 'primary';
      case 'upcoming':
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Teacher Dashboard / शिक्षक ड्यासबोर्ड
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Today: 2081-10-25 BS (2026-02-11 AD) | Current Period: {currentPeriod}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<ScheduleIcon />}>
          View Full Schedule
        </Button>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#1976d2', mr: 2 }}>
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">5</Typography>
                  <Typography variant="caption">Classes Today / आजका कक्षा</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#ed6c02', mr: 2 }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">4</Typography>
                  <Typography variant="caption">Pending Tasks / बाँकी कार्य</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#2e7d32', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">156</Typography>
                  <Typography variant="caption">Total Students / कुल विद्यार्थी</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#9c27b0', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">89%</Typography>
                  <Typography variant="caption">Avg Attendance / औसत उपस्थिति</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Today's Schedule */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Today's Schedule / आजको तालिका
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Period / अवधि</TableCell>
                    <TableCell>Time / समय</TableCell>
                    <TableCell>Subject / विषय</TableCell>
                    <TableCell>Class / कक्षा</TableCell>
                    <TableCell>Room / कोठा</TableCell>
                    <TableCell>Status / स्थिति</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todaySchedule.map((period) => (
                    <TableRow
                      key={period.period}
                      sx={{
                        bgcolor: period.status === 'ongoing' ? 'action.selected' : 'inherit',
                      }}
                    >
                      <TableCell>{period.period}</TableCell>
                      <TableCell>{period.time}</TableCell>
                      <TableCell>{period.subject}</TableCell>
                      <TableCell>{period.class}</TableCell>
                      <TableCell>{period.room}</TableCell>
                      <TableCell>
                        <Chip
                          label={period.status}
                          size="small"
                          color={getStatusColor(period.status)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Class Performance */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Class Performance Overview / कक्षा प्रदर्शन
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Class / कक्षा</TableCell>
                    <TableCell align="center">Attendance / उपस्थिति</TableCell>
                    <TableCell align="center">Avg Grade / औसत ग्रेड</TableCell>
                    <TableCell align="center">Assignments / असाइनमेन्ट</TableCell>
                    <TableCell align="center">Action / कार्य</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classPerformanceData.map((cls) => (
                    <TableRow key={cls.class}>
                      <TableCell>{cls.class}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${cls.attendance}%`}
                          size="small"
                          color={cls.attendance >= 90 ? 'success' : cls.attendance >= 80 ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="center">{cls.avgGrade.toFixed(1)}</TableCell>
                      <TableCell align="center">{cls.assignments}%</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/teacher/class/${cls.class}`)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Pending Tasks */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pending Tasks / बाँकी कार्य
            </Typography>
            <List>
              {pendingTasks.map((task, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 0,
                    borderBottom: index < pendingTasks.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <ListItemIcon>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: `${getPriorityColor(task.priority)}.main` }}>
                      {task.count}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={task.title}
                    secondary={
                      <Chip
                        label={task.priority}
                        size="small"
                        color={getPriorityColor(task.priority)}
                        sx={{ mt: 0.5 }}
                      />
                    }
                  />
                </ListItem>
              ))}
            </List>
            <Button fullWidth variant="contained" sx={{ mt: 2 }}>
              View All Tasks
            </Button>
          </Paper>

          {/* Attendance Trend */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attendance Trend / उपस्थिति प्रवृत्ति
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#1976d2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* Notifications */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Notifications / सूचना
              </Typography>
            </Box>
            <List>
              {notifications.map((notification, index) => (
                <Box key={index}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>{notification.icon}</ListItemIcon>
                    <ListItemText
                      primary={notification.text}
                      secondary={notification.time}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
            <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
              View All Notifications
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

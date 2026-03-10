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
  Avatar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  School as SchoolIcon,
  EventNote as EventIcon,
  Notifications as NotificationIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
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

interface ChildInfo {
  id: number;
  name: string;
  class: string;
  section: string;
  rollNo: number;
}

const ParentPortal: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [attendanceData, setAttendanceData] = useState({ present: 0, total: 0, percentage: 0 });
  const [feeData, setFeeData] = useState<{
    invoices: Array<{ id: number; month: string; amount: number; status: string; paidDate?: string; dueDate?: string }>;
    totalPaid: number;
    totalPending: number;
  }>({ invoices: [], totalPaid: 0, totalPending: 0 });
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; type: string; date: string }>>([]);
  const [grades, setGrades] = useState<Array<{ subject: string; midterm?: string; final?: string; gpa?: number }>>([]);

  useEffect(() => {
    apiClient.get('/api/v1/parents/children').then((res) => {
      const list = res.data?.data || [];
      setChildren(list.map((c: any) => ({ id: c.studentId ?? c.id, name: c.name, class: c.class ?? '', section: c.section ?? '', rollNo: c.rollNo ?? 0 })));
    }).catch(() => setChildren([]));
  }, []);

  const selectedChild = children[selectedChildIndex];
  useEffect(() => {
    if (!selectedChild?.id) return;
    setLoading(true);
    apiClient.get(`/api/v1/parents/children/${selectedChild.id}/summary`)
      .then((res) => {
        const d = res.data?.data || {};
        if (d.attendance) setAttendanceData({ present: d.attendance.present ?? 0, total: d.attendance.total ?? 0, percentage: d.attendance.percentage ?? 0 });
        if (d.fees) setFeeData({ invoices: d.fees.invoices ?? [], totalPaid: d.fees.totalPaid ?? 0, totalPending: d.fees.totalPending ?? 0 });
        if (d.notifications) setNotifications(d.notifications);
        if (d.grades) setGrades(d.grades);
      })
      .catch(() => { setAttendanceData({ present: 0, total: 0, percentage: 0 }); setFeeData({ invoices: [], totalPaid: 0, totalPending: 0 }); setNotifications([]); setGrades([]); })
      .finally(() => setLoading(false));
  }, [selectedChild?.id]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Parent Portal</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Child</InputLabel>
          <Select
            value={selectedChildIndex}
            onChange={(e) => setSelectedChildIndex(Number(e.target.value))}
            label="Select Child"
          >
            {children.map((child, idx) => (
              <MenuItem key={child.id} value={idx}>
                {child.name} - Class {child.class}{child.section}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Selected Child Info */}
      {selectedChild && (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            {selectedChild.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{selectedChild.name}</Typography>
            <Typography color="textSecondary">
              Class {selectedChild.class}-{selectedChild.section} |
              Roll No: {selectedChild.rollNo}
            </Typography>
          </Box>
        </Box>
      </Paper>
      )}

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon color="primary" />
                <Typography color="textSecondary">Attendance</Typography>
              </Box>
              <Typography variant="h4" color={attendanceData.percentage >= 75 ? 'success.main' : 'error.main'}>
                {attendanceData.percentage}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={attendanceData.percentage}
                color={attendanceData.percentage >= 75 ? 'success' : 'error'}
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                {attendanceData.present}/{attendanceData.total} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon color="warning" />
                <Typography color="textSecondary">Fees Pending</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                Rs. {feeData.totalPending.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Paid: Rs. {feeData.totalPaid.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationIcon color="info" />
                <Typography color="textSecondary">Notifications</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {notifications.filter(n => n.type === 'warning').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                alerts requiring attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<ReceiptIcon />} label="Fees" />
          <Tab icon={<SchoolIcon />} label="Grades" />
          <Tab icon={<NotificationIcon />} label="Notifications" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TabPanel value={tabValue} index={0}>
            <List>
              {feeData.invoices.map((inv) => (
                <ListItem key={inv.id} divider>
                  <ListItemIcon>
                    {inv.status === 'paid' ? (
                      <CheckIcon color="success" />
                    ) : inv.status === 'pending' ? (
                      <WarningIcon color="warning" />
                    ) : (
                      <ScheduleIcon color="info" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={inv.month}
                    secondary={`Rs. ${inv.amount.toLocaleString()}`}
                  />
                  <Chip
                    label={inv.status.toUpperCase()}
                    color={inv.status === 'paid' ? 'success' : inv.status === 'pending' ? 'warning' : 'default'}
                    size="small"
                  />
                  {inv.status === 'pending' && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PaymentIcon />}
                      sx={{ ml: 1 }}
                    >
                      Pay Now
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <List>
              {grades.map((g, idx) => (
                <ListItem key={idx} divider>
                  <ListItemText
                    primary={g.subject}
                    secondary={`Midterm: ${g.midterm} | Final: ${g.final} | GPA: ${g.gpa}`}
                  />
                  <Chip label={g.final} color="primary" />
                </ListItem>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {notifications.map((n) => (
              <Alert
                key={n.id}
                severity={n.type === 'warning' ? 'warning' : 'info'}
                sx={{ mb: 1 }}
              >
                <Typography variant="body2">{n.title}</Typography>
                <Typography variant="caption" color="textSecondary">{n.date}</Typography>
              </Alert>
            ))}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default ParentPortal;

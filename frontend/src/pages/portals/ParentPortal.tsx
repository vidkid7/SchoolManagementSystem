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
  MenuBook as LibraryIcon,
  Campaign as AnnouncementIcon,
  Assignment as AssignmentIcon,
  SportsBasketball as SportsIcon,
  EmojiEvents as BehaviorIcon,
  CalendarMonth as CalendarIcon,
  CardMembership as CertificateIcon,
  Message as MessageIcon,
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
  const [libraryData, setLibraryData] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activities, setActivities] = useState<{ eca: any[]; sports: any[] }>({ eca: [], sports: [] });
  const [behavior, setBehavior] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

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
    
    // Fetch summary data
    apiClient.get(`/api/v1/parents/children/${selectedChild.id}/summary`)
      .then((res) => {
        const d = res.data?.data || {};
        if (d.attendance) setAttendanceData({ present: d.attendance.present ?? 0, total: d.attendance.total ?? 0, percentage: d.attendance.percentage ?? 0 });
        if (d.fees) setFeeData({ invoices: d.fees.invoices ?? [], totalPaid: d.fees.totalPaid ?? 0, totalPending: d.fees.totalPending ?? 0 });
        if (d.notifications) setNotifications(d.notifications);
        if (d.grades) setGrades(d.grades);
        if (d.library) setLibraryData(d.library);
      })
      .catch(() => { setAttendanceData({ present: 0, total: 0, percentage: 0 }); setFeeData({ invoices: [], totalPaid: 0, totalPending: 0 }); setNotifications([]); setGrades([]); });
    
    // Fetch assignments
    apiClient.get(`/api/v1/parents/children/${selectedChild.id}/assignments`)
      .then((res) => setAssignments(res.data?.data || []))
      .catch(() => setAssignments([]));
    
    // Fetch activities (ECA & Sports)
    apiClient.get(`/api/v1/parents/children/${selectedChild.id}/activities`)
      .then((res) => setActivities(res.data?.data || { eca: [], sports: [] }))
      .catch(() => setActivities({ eca: [], sports: [] }));
    
    // Fetch behavior
    apiClient.get(`/api/v1/parents/children/${selectedChild.id}/behavior`)
      .then((res) => setBehavior(res.data?.data || []))
      .catch(() => setBehavior([]));
    
    // Fetch certificates
    apiClient.get(`/api/v1/parents/children/${selectedChild.id}/certificates`)
      .then((res) => setCertificates(res.data?.data || []))
      .catch(() => setCertificates([]));
    
    setLoading(false);
  }, [selectedChild?.id]);

  useEffect(() => {
    // Fetch announcements
    apiClient.get('/api/v1/communication/announcements', { params: { limit: 20 } })
      .then((res) => { setAnnouncements(res.data?.data || []); })
      .catch(() => { setAnnouncements([]); });
    
    // Fetch school calendar
    apiClient.get('/api/v1/parents/calendar')
      .then((res) => setCalendar(res.data?.data || []))
      .catch(() => setCalendar([]));
  }, []);

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
          <Tab icon={<AssignmentIcon />} label="Assignments" />
          <Tab icon={<LibraryIcon />} label="Library" />
          <Tab icon={<SportsIcon />} label="Activities" />
          <Tab icon={<BehaviorIcon />} label="Behavior" />
          <Tab icon={<CalendarIcon />} label="Calendar" />
          <Tab icon={<CertificateIcon />} label="Certificates" />
          <Tab icon={<NotificationIcon />} label="Notifications" />
          <Tab icon={<AnnouncementIcon />} label="Announcements" />
          <Tab icon={<MessageIcon />} label="Messages" />
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
            {assignments.length > 0 ? (
              <List>
                {assignments.map((assign: any) => (
                  <ListItem key={assign.id} divider>
                    <ListItemIcon>
                      <AssignmentIcon color={assign.status === 'submitted' ? 'success' : 'warning'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={assign.title}
                      secondary={`Subject: ${assign.subject} | Due: ${assign.dueDate}${assign.submittedAt ? ` | Submitted: ${assign.submittedAt}` : ''}`}
                    />
                    <Chip
                      label={assign.status.toUpperCase()}
                      color={assign.status === 'submitted' ? 'success' : assign.status === 'graded' ? 'info' : 'warning'}
                      size="small"
                    />
                    {assign.grade && (
                      <Chip label={`Grade: ${assign.grade}`} color="primary" size="small" sx={{ ml: 1 }} />
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No assignments found</Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {libraryData.length > 0 ? (
              <List>
                {libraryData.map((book: any, idx: number) => (
                  <ListItem key={idx} divider>
                    <ListItemIcon>
                      <LibraryIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={book.title || book.bookTitle || 'Unknown Book'}
                      secondary={`Borrowed: ${book.borrowDate || book.issuedDate || '—'} | Due: ${book.dueDate || book.returnDate || '—'}${book.fine ? ` | Fine: Rs. ${book.fine}` : ''}`}
                    />
                    <Chip
                      label={book.status || 'Borrowed'}
                      size="small"
                      color={book.status === 'returned' ? 'success' : book.status === 'overdue' ? 'error' : 'warning'}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No library books borrowed</Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" gutterBottom>Extra-Curricular Activities</Typography>
            {activities.eca.length > 0 ? (
              <List>
                {activities.eca.map((eca: any, idx: number) => (
                  <ListItem key={idx} divider>
                    <ListItemIcon>
                      <SportsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={eca.name}
                      secondary={`Category: ${eca.category} | Enrolled: ${eca.enrolledDate}`}
                    />
                    <Chip label={eca.status} color="success" size="small" />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>No ECA enrollments</Alert>
            )}

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Sports Activities</Typography>
            {activities.sports.length > 0 ? (
              <List>
                {activities.sports.map((sport: any, idx: number) => (
                  <ListItem key={idx} divider>
                    <ListItemIcon>
                      <SportsIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={sport.name}
                      secondary={`Category: ${sport.category} | Enrolled: ${sport.enrolledDate}`}
                    />
                    <Chip label={sport.status} color="success" size="small" />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No sports enrollments</Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={5}>
            {behavior.length > 0 ? (
              <List>
                {behavior.map((record: any, idx: number) => (
                  <ListItem key={idx} divider>
                    <ListItemIcon>
                      <BehaviorIcon color={record.type === 'positive' ? 'success' : 'warning'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={record.title || record.description}
                      secondary={`Date: ${record.date} | Teacher: ${record.teacher || 'N/A'}`}
                    />
                    <Chip
                      label={record.type}
                      color={record.type === 'positive' ? 'success' : record.type === 'negative' ? 'error' : 'default'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No behavior records</Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={6}>
            {calendar.length > 0 ? (
              <List>
                {calendar.map((event: any) => (
                  <ListItem key={event.id} divider>
                    <ListItemIcon>
                      <CalendarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={event.title}
                      secondary={
                        <>
                          <Typography variant="caption" component="span">
                            {event.date} | {event.type}
                          </Typography>
                          {event.description && (
                            <Typography variant="body2" color="textSecondary" component="p">
                              {event.description}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No upcoming events</Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={7}>
            {certificates.length > 0 ? (
              <List>
                {certificates.map((cert: any) => (
                  <ListItem key={cert.id} divider>
                    <ListItemIcon>
                      <CertificateIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={cert.title}
                      secondary={`Type: ${cert.type} | Issued: ${cert.issueDate}`}
                    />
                    {cert.downloadUrl && (
                      <Button
                        variant="outlined"
                        size="small"
                        href={cert.downloadUrl}
                        target="_blank"
                      >
                        Download
                      </Button>
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No certificates available</Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={8}>
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

          <TabPanel value={tabValue} index={9}>
            {announcements.length > 0 ? (
              <List>
                {announcements.map((ann: any, idx: number) => (
                  <ListItem key={ann.id || idx} divider>
                    <ListItemIcon>
                      <AnnouncementIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary={ann.title || 'Announcement'}
                      secondary={
                        <>
                          <Typography variant="caption" color="textSecondary" component="span">
                            {ann.date || ann.createdAt ? new Date(ann.date || ann.createdAt).toLocaleDateString() : ''}
                          </Typography>
                          {(ann.content || ann.message) && (
                            <Typography variant="body2" color="textSecondary" component="p" sx={{ mt: 0.5 }}>
                              {(ann.content || ann.message).substring(0, 150)}{(ann.content || ann.message).length > 150 ? '...' : ''}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No announcements at this time.</Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={10}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Use the messaging feature to communicate with teachers and school staff.
            </Alert>
            <Button
              variant="contained"
              startIcon={<MessageIcon />}
              fullWidth
              onClick={() => window.location.href = '/communication/messages'}
            >
              Open Messages
            </Button>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default ParentPortal;

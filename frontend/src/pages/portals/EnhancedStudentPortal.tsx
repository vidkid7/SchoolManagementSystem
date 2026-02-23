import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  Tabs,
  Tab,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  EmojiEvents as TrophyIcon,
  MenuBook as BookIcon,
  CalendarMonth as CalendarIcon,
  Download as DownloadIcon,
  CardMembership as CertificateIcon,
  History as HistoryIcon,
  Comment as CommentIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { apiClient } from '../../services/apiClient';
import type { RootState } from '../../store';

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

const glassMorphStyle = (theme: any) => ({
  background: theme.palette.mode === 'dark'
    ? 'rgba(28,28,30,0.6)'
    : 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)'}`,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px 0 rgba(0,0,0,0.04)'
    : '0 8px 32px 0 rgba(0,0,0,0.04)',
});

export const EnhancedStudentPortal: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [studentId, setStudentId] = useState<number | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [fees, setFees] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [eca, setECA] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const results = await Promise.allSettled([
        apiClient.get('/api/v1/students/me/attendance/summary'),
        apiClient.get('/api/v1/students/me/grades'),
        apiClient.get('/api/v1/students/me/fees/summary'),
        apiClient.get('/api/v1/students/me/profile'),
      ]);

      if (results[0].status === 'fulfilled') {
        setAttendance(results[0].value.data.data);
      }
      if (results[1].status === 'fulfilled') {
        setGrades(results[1].value.data.data || []);
      }
      if (results[2].status === 'fulfilled') {
        setFees(results[2].value.data.data);
      }
      if (results[3].status === 'fulfilled') {
        const profileData = results[3].value.data.data;
        setProfile(profileData);
        if (profileData?.studentId) {
          setStudentId(profileData.studentId);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    if (!studentId) return;
    try {
      const response = await apiClient.get(`/api/v1/students/${studentId}/certificates`);
      setCertificates(response.data.data?.certificates || []);
    } catch {
      setCertificates([]);
    }
  };

  const fetchLibrary = async () => {
    if (!studentId) return;
    try {
      const response = await apiClient.get(`/api/v1/students/${studentId}/library`);
      setLibrary(response.data.data || []);
    } catch {
      setLibrary([]);
    }
  };

  const fetchECA = async () => {
    if (!studentId) return;
    try {
      const response = await apiClient.get(`/api/v1/students/${studentId}/eca`);
      setECA(response.data.data?.eca || []);
    } catch {
      setECA([]);
    }
  };

  const fetchHistory = async () => {
    if (!studentId) return;
    try {
      const response = await apiClient.get(`/api/v1/students/${studentId}/history`);
      setHistory(response.data.data || []);
    } catch {
      setHistory([]);
    }
  };

  const fetchRemarks = async () => {
    if (!studentId) return;
    try {
      const response = await apiClient.get(`/api/v1/students/${studentId}/remarks`);
      setRemarks(response.data.data?.remarks || []);
    } catch {
      setRemarks([]);
    }
  };

  useEffect(() => {
    if (!studentId) return;
    if (tabValue === 4 && certificates.length === 0) fetchCertificates();
    if (tabValue === 5 && library.length === 0) fetchLibrary();
    if (tabValue === 6 && eca.length === 0) fetchECA();
    if (tabValue === 7 && history.length === 0) fetchHistory();
    if (tabValue === 8 && remarks.length === 0) fetchRemarks();
  }, [tabValue, studentId]);

  const attendancePercentage = attendance?.percentage || 0;
  const avgGPA = grades.length > 0
    ? (grades.reduce((sum: number, g: any) => sum + (g.gpa || 0), 0) / grades.length).toFixed(2)
    : '0.00';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body2" color="text.secondary">Loading your portal...</Typography>
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Attendance',
      value: `${attendancePercentage}%`,
      subtitle: `${attendance?.present || 0} / ${attendance?.total || 0} days`,
      icon: <SchoolIcon sx={{ fontSize: 28 }} />,
      color1: '#667eea', color2: '#764ba2',
      progress: attendancePercentage,
    },
    {
      title: 'Avg. GPA',
      value: avgGPA,
      subtitle: `${grades.length} subjects`,
      icon: <TrendingUpIcon sx={{ fontSize: 28 }} />,
      color1: '#11998e', color2: '#38ef7d',
      progress: (parseFloat(avgGPA) / 4.0) * 100,
    },
    {
      title: 'Fee Pending',
      value: `Rs. ${(fees?.pending || 0).toLocaleString()}`,
      subtitle: `of Rs. ${(fees?.total || 0).toLocaleString()}`,
      icon: <MoneyIcon sx={{ fontSize: 28 }} />,
      color1: fees?.pending > 0 ? '#f093fb' : '#43e97b',
      color2: fees?.pending > 0 ? '#f5576c' : '#38f9d7',
      progress: fees?.total ? ((fees?.paid || 0) / fees.total) * 100 : 0,
    },
    {
      title: 'Certificates',
      value: `${certificates.length}`,
      subtitle: 'available',
      icon: <CertificateIcon sx={{ fontSize: 28 }} />,
      color1: '#4facfe', color2: '#00f2fe',
      progress: null,
    },
  ];

  return (
    <Box sx={{
      p: { xs: 2, md: 3 },
      minHeight: '100vh',
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        mb: 4, p: 3, borderRadius: 4, ...glassMorphStyle(theme),
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontSize: '1.4rem', fontWeight: 700,
            boxShadow: '0 4px 14px rgba(102,126,234,0.4)',
          }}>
            {user?.firstName?.[0] || user?.username?.[0] || 'S'}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Welcome back, {user?.firstName || 'Student'}!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile?.studentCode ? `Student Code: ${profile.studentCode}` : 'Student Portal'}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="Refresh Data">
          <IconButton onClick={fetchAllData} sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            '&:hover': { background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)', transform: 'rotate(180deg)' },
            transition: 'all 0.3s ease',
          }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{
              borderRadius: 4, overflow: 'hidden',
              background: `linear-gradient(135deg, ${card.color1} 0%, ${card.color2} 100%)`,
              color: '#fff', border: 'none',
              boxShadow: `0 8px 24px ${alpha(card.color1, 0.4)}`,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: `0 20px 40px ${alpha(card.color1, 0.5)}`,
              },
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.2, mt: 0.5 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, borderRadius: 3, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex' }}>
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>{card.subtitle}</Typography>
                {card.progress !== null && (
                  <LinearProgress variant="determinate" value={Math.min(card.progress || 0, 100)} sx={{
                    mt: 1.5, height: 6, borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'rgba(255,255,255,0.9)' },
                  }} />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs Section */}
      <Box sx={{ borderRadius: 4, overflow: 'hidden', ...glassMorphStyle(theme) }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto" sx={{
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.875rem', py: 2, minHeight: 56 },
          '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
          '& .Mui-selected': { color: `${theme.palette.primary.main} !important` },
        }}>
          <Tab icon={<AssignmentIcon />} iconPosition="start" label="Grades" />
          <Tab icon={<SchoolIcon />} iconPosition="start" label="Attendance" />
          <Tab icon={<ReceiptIcon />} iconPosition="start" label="Fees" />
          <Tab icon={<CalendarIcon />} iconPosition="start" label="Timetable" />
          <Tab icon={<CertificateIcon />} iconPosition="start" label="Certificates" />
          <Tab icon={<BookIcon />} iconPosition="start" label="Library" />
          <Tab icon={<TrophyIcon />} iconPosition="start" label="ECA & Sports" />
          <Tab icon={<HistoryIcon />} iconPosition="start" label="History" />
          <Tab icon={<CommentIcon />} iconPosition="start" label="Remarks" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Grades Tab */}
          <TabPanel value={tabValue} index={0}>
            <TableContainer sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '& th': { color: '#fff', fontWeight: 700, border: 'none' },
                  }}>
                    <TableCell>Subject</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>GPA</TableCell>
                    <TableCell>Marks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grades.map((item: any, idx: number) => (
                    <TableRow key={idx} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }, transition: 'background 0.2s' }}>
                      <TableCell sx={{ fontWeight: 600 }}>{item.subject || item.subjectName}</TableCell>
                      <TableCell>
                        <Chip label={item.grade} size="small" sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: '#fff', fontWeight: 700,
                        }} />
                      </TableCell>
                      <TableCell>{item.gpa?.toFixed(2)}</TableCell>
                      <TableCell>{item.marks || item.obtainedMarks}{item.totalMarks ? `/${item.totalMarks}` : ''}</TableCell>
                    </TableRow>
                  ))}
                  {grades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No grades available yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
              <Button startIcon={<DownloadIcon />} variant="outlined"
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
                onClick={() => navigate('/my-certificates')}>
                Download Report Card
              </Button>
              <Button startIcon={<DownloadIcon />} variant="outlined"
                sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 600 }}
                onClick={() => window.open(`/api/v1/cv/student/${user?.userId}`, '_blank')}>
                Download CV
              </Button>
            </Box>
          </TabPanel>

          {/* Attendance Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 4, ...glassMorphStyle(theme) }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>Attendance Summary</Typography>
                    {[
                      { label: 'Present', value: `${attendance?.present || 0} days`, color: '#10b981' },
                      { label: 'Absent', value: `${attendance?.absent || 0} days`, color: '#ef4444' },
                      { label: 'Late', value: `${attendance?.late || 0} days`, color: '#f59e0b' },
                      { label: 'Total', value: `${attendance?.total || 0} days`, color: theme.palette.text.primary },
                    ].map((row) => (
                      <Box key={row.label} sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        py: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                      }}>
                        <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                        <Typography variant="body2" fontWeight={700} color={row.color}>{row.value}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 4, overflow: 'hidden', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', border: 'none', boxShadow: '0 8px 24px rgba(102,126,234,0.4)' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ opacity: 0.9 }}>Attendance Rate</Typography>
                    <Box sx={{ position: 'relative', display: 'inline-flex', my: 2 }}>
                      <CircularProgress variant="determinate" value={100} size={140} thickness={5} sx={{ color: 'rgba(255,255,255,0.2)', position: 'absolute', left: 0 }} />
                      <CircularProgress variant="determinate" value={attendancePercentage} size={140} thickness={5} sx={{ color: 'rgba(255,255,255,0.9)' }} />
                      <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                        <Typography variant="h4" fontWeight={800}>{attendancePercentage}%</Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                      {attendancePercentage >= 75 ? '✅ Good Attendance' : '⚠️ Below 75% Minimum'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Fees Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 4, ...glassMorphStyle(theme) }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>Fee Summary</Typography>
                    {[
                      { label: 'Total Fee', value: `Rs. ${(fees?.total || 0).toLocaleString()}`, color: theme.palette.text.primary },
                      { label: 'Paid', value: `Rs. ${(fees?.paid || 0).toLocaleString()}`, color: '#10b981' },
                      { label: 'Pending', value: `Rs. ${(fees?.pending || 0).toLocaleString()}`, color: fees?.pending > 0 ? '#ef4444' : '#10b981' },
                    ].map((row) => (
                      <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
                        <Typography color="text.secondary">{row.label}</Typography>
                        <Typography fontWeight={700} color={row.color}>{row.value}</Typography>
                      </Box>
                    ))}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">Payment Progress</Typography>
                      <LinearProgress variant="determinate"
                        value={fees?.total ? Math.min(((fees?.paid || 0) / fees.total) * 100, 100) : 0}
                        sx={{ height: 10, borderRadius: 5, bgcolor: alpha(theme.palette.divider, 0.3), '& .MuiLinearProgress-bar': { borderRadius: 5, background: 'linear-gradient(90deg, #11998e, #38ef7d)' } }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 4, ...glassMorphStyle(theme) }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>Payment Actions</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button variant="contained" fullWidth sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 4px 14px rgba(102,126,234,0.4)' }}>
                        Pay Online
                      </Button>
                      <Button variant="outlined" fullWidth sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 600 }}>
                        View Payment History
                      </Button>
                      <Button variant="outlined" fullWidth startIcon={<DownloadIcon />} sx={{ borderRadius: 3, py: 1.5, textTransform: 'none', fontWeight: 600 }}>
                        Download Receipt
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Timetable Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CalendarIcon sx={{ fontSize: 64, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>Timetable Coming Soon</Typography>
              <Typography variant="body2" color="text.secondary">Your class timetable will be available here once set by your teacher.</Typography>
              <Button variant="contained" sx={{ mt: 3, borderRadius: 3, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                onClick={() => navigate('/calendar')}>
                View School Calendar
              </Button>
            </Box>
          </TabPanel>

          {/* Certificates Tab */}
          <TabPanel value={tabValue} index={4}>
            {!studentId ? (
              <Alert severity="info" sx={{ borderRadius: 3 }}>Student profile not fully set up. Contact your administrator.</Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {certificates.map((cert: any, idx: number) => (
                  <ListItem key={idx} sx={{ mb: 1.5, borderRadius: 3, ...glassMorphStyle(theme), '&:hover': { transform: 'translateX(4px)' }, transition: 'transform 0.2s' }}>
                    <ListItemIcon>
                      <Box sx={{ p: 1, borderRadius: 2, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: '#fff', display: 'flex' }}>
                        <CertificateIcon fontSize="small" />
                      </Box>
                    </ListItemIcon>
                    <ListItemText primary={<Typography fontWeight={600}>{cert.name || cert.certificateType}</Typography>} secondary={`Issued: ${cert.issueDate || cert.createdAt}`} />
                    <IconButton size="small" sx={{ mr: 1 }}><ViewIcon /></IconButton>
                    <IconButton size="small"><DownloadIcon /></IconButton>
                  </ListItem>
                ))}
                {certificates.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CertificateIcon sx={{ fontSize: 64, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
                    <Typography color="text.secondary">No certificates available yet</Typography>
                  </Box>
                )}
              </List>
            )}
          </TabPanel>

          {/* Library Tab */}
          <TabPanel value={tabValue} index={5}>
            {!studentId ? (
              <Alert severity="info" sx={{ borderRadius: 3 }}>Student profile not fully set up. Contact your administrator.</Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {library.map((book: any, idx: number) => (
                  <ListItem key={idx} sx={{ mb: 1.5, borderRadius: 3, ...glassMorphStyle(theme) }}>
                    <ListItemIcon>
                      <Box sx={{ p: 1, borderRadius: 2, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: '#fff', display: 'flex' }}>
                        <BookIcon fontSize="small" />
                      </Box>
                    </ListItemIcon>
                    <ListItemText primary={<Typography fontWeight={600}>{book.bookTitle || book.title}</Typography>} secondary={`Borrowed: ${book.borrowDate} | Due: ${book.dueDate}`} />
                    <Chip label={book.status || 'Borrowed'} size="small" sx={{ fontWeight: 600, bgcolor: book.status === 'returned' ? alpha('#10b981', 0.1) : alpha('#f59e0b', 0.1), color: book.status === 'returned' ? '#10b981' : '#f59e0b' }} />
                  </ListItem>
                ))}
                {library.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <BookIcon sx={{ fontSize: 64, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
                    <Typography color="text.secondary">No library records found</Typography>
                  </Box>
                )}
              </List>
            )}
          </TabPanel>

          {/* ECA & Sports Tab */}
          <TabPanel value={tabValue} index={6}>
            {!studentId ? (
              <Alert severity="info" sx={{ borderRadius: 3 }}>Student profile not fully set up. Contact your administrator.</Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {eca.map((activity: any, idx: number) => (
                  <ListItem key={idx} sx={{ mb: 1.5, borderRadius: 3, ...glassMorphStyle(theme) }}>
                    <ListItemIcon>
                      <Box sx={{ p: 1, borderRadius: 2, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#fff', display: 'flex' }}>
                        <TrophyIcon fontSize="small" />
                      </Box>
                    </ListItemIcon>
                    <ListItemText primary={<Typography fontWeight={600}>{activity.name || activity.activityName}</Typography>} secondary={activity.description || activity.category} />
                    <Chip label={activity.status || 'Active'} size="small" sx={{ fontWeight: 600 }} />
                  </ListItem>
                ))}
                {eca.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <TrophyIcon sx={{ fontSize: 64, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
                    <Typography color="text.secondary">No ECA activities enrolled</Typography>
                  </Box>
                )}
              </List>
            )}
          </TabPanel>

          {/* History Tab */}
          <TabPanel value={tabValue} index={7}>
            {!studentId ? (
              <Alert severity="info" sx={{ borderRadius: 3 }}>Student profile not fully set up. Contact your administrator.</Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {history.map((record: any, idx: number) => (
                  <ListItem key={idx} sx={{ mb: 1.5, borderRadius: 3, ...glassMorphStyle(theme) }}>
                    <ListItemIcon>
                      <Box sx={{ p: 1, borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', display: 'flex' }}>
                        <HistoryIcon fontSize="small" />
                      </Box>
                    </ListItemIcon>
                    <ListItemText primary={<Typography fontWeight={600}>{record.academicYear} — Class {record.className}</Typography>} secondary={`Result: ${record.result || 'N/A'}`} />
                  </ListItem>
                ))}
                {history.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <HistoryIcon sx={{ fontSize: 64, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
                    <Typography color="text.secondary">No academic history found</Typography>
                  </Box>
                )}
              </List>
            )}
          </TabPanel>

          {/* Remarks Tab */}
          <TabPanel value={tabValue} index={8}>
            {!studentId ? (
              <Alert severity="info" sx={{ borderRadius: 3 }}>Student profile not fully set up. Contact your administrator.</Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {remarks.map((remark: any, idx: number) => (
                  <ListItem key={idx} sx={{ mb: 1.5, borderRadius: 3, ...glassMorphStyle(theme), alignItems: 'flex-start' }}>
                    <ListItemIcon sx={{ mt: 1 }}>
                      <Avatar sx={{ width: 36, height: 36, background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', fontSize: '0.875rem', fontWeight: 700 }}>
                        {remark.teacherName?.[0] || 'T'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText primary={<Typography fontWeight={600}>{remark.remark || remark.comment}</Typography>} secondary={`By: ${remark.teacherName} · ${remark.date}`} />
                  </ListItem>
                ))}
                {remarks.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CommentIcon sx={{ fontSize: 64, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
                    <Typography color="text.secondary">No remarks from teachers yet</Typography>
                  </Box>
                )}
              </List>
            )}
          </TabPanel>
        </Box>
      </Box>
    </Box>
  );
};

export default EnhancedStudentPortal;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Chip,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  PersonAdd as PersonAddIcon,
  FactCheck as FactCheckIcon,
  LibraryBooks as LibraryBooksIcon,
  Class as ClassIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Notifications as NotificationsIcon,
  CalendarToday as CalendarTodayIcon,
  Groups as GroupsIcon,
  MenuBook as MenuBookIcon,
  EmojiEvents as EmojiEventsIcon,
  Description as DescriptionIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import api from '../../config/api';

interface ChartData {
  label: string;
  value: number;
}

interface Activity {
  id: number;
  type: string;
  description: string;
  createdAt: string;
}

interface DashboardData {
  summary: {
    totalStudents: number;
    totalStaff: number;
    totalClasses: number;
    totalBooks: number;
    attendanceRate: number;
    feeCollectionRate: number;
    totalMaleStudents: number;
    totalFemaleStudents: number;
    newAdmissionsThisMonth: number;
    totalExams: number;
    pendingFeeStudents: number;
  };
  charts: {
    enrollmentTrend: ChartData[];
    attendanceTrend: ChartData[];
    feeCollection: ChartData[];
    examPerformance: ChartData[];
    genderDistribution: ChartData[];
    monthlyNewAdmissions: ChartData[];
  };
  recentActivities?: Activity[];
}

const COLORS = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#30cfd0'];

const quickLinks = [
  { title: 'Admissions', path: '/admissions/dashboard', icon: <PersonAddIcon />, color: '#667eea' },
  { title: 'Academic', path: '/academic/dashboard', icon: <SchoolIcon />, color: '#f093fb' },
  { title: 'Attendance', path: '/attendance/dashboard', icon: <FactCheckIcon />, color: '#4facfe' },
  { title: 'Examinations', path: '/examinations/dashboard', icon: <AssessmentIcon />, color: '#43e97b' },
  { title: 'Finance', path: '/finance/dashboard', icon: <MoneyIcon />, color: '#fa709a' },
  { title: 'Library', path: '/library/dashboard', icon: <LibraryBooksIcon />, color: '#30cfd0' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock data for activities and events (can be replaced with API calls)
  const recentActivities = [
    {
      id: 1,
      type: 'attendance',
      description: 'Class 10 attendance marked',
      time: '5 mins ago',
      icon: <CheckCircleIcon />,
      color: '#43e97b',
    },
    {
      id: 2,
      type: 'payment',
      description: 'Fee payment received: Rs 15,000',
      time: '12 mins ago',
      icon: <PaymentIcon />,
      color: '#f093fb',
    },
    {
      id: 3,
      type: 'alert',
      description: 'Low attendance alert: 3 students',
      time: '1 hours ago',
      icon: <WarningIcon />,
      color: '#fa709a',
    },
    {
      id: 4,
      type: 'exam',
      description: 'Exam scheduled: Terminal Exam',
      time: '2 hours ago',
      icon: <ScheduleIcon />,
      color: '#667eea',
    },
    {
      id: 5,
      type: 'admission',
      description: 'New student admission - Grade 6',
      time: '3 hours ago',
      icon: <PersonAddIcon />,
      color: '#4facfe',
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Terminal Examination',
      date: '2082-10-30',
      type: 'exam',
      status: 'Upcoming',
      icon: <AssessmentIcon />,
      color: '#667eea',
    },
    {
      id: 2,
      title: 'Parent-Teacher Meeting',
      date: '2082-10-25',
      type: 'meeting',
      status: 'Upcoming',
      icon: <GroupsIcon />,
      color: '#43e97b',
    },
    {
      id: 3,
      title: 'Sports Day',
      date: '2082-11-05',
      type: 'event',
      status: 'Upcoming',
      icon: <EmojiEventsIcon />,
      color: '#feca57',
    },
    {
      id: 4,
      title: 'Science Exhibition',
      date: '2082-11-12',
      type: 'event',
      status: 'Upcoming',
      icon: <MenuBookIcon />,
      color: '#f093fb',
    },
  ];

  const quickOverview = [
    { label: 'Staff Members', value: data?.summary.totalStaff ?? 12, icon: <PeopleIcon />, color: '#43e97b' },
    { label: 'Library Books', value: data?.summary.totalBooks ?? 1, icon: <LibraryBooksIcon />, color: '#30cfd0' },
    { label: 'Active Classes', value: data?.summary.totalClasses ?? 79, icon: <ClassIcon />, color: '#feca57' },
    { label: 'Total Exams', value: data?.summary.totalExams ?? 75, icon: <AssessmentIcon />, color: '#667eea' },
    { label: 'New Admissions', value: data?.summary.newAdmissionsThisMonth ?? 185, icon: <PersonAddIcon />, color: '#fa709a' },
  ];

  const quickReports = [
    { 
      title: 'Enrollment', 
      description: 'Student enrollment reports',
      path: '/reports/enrollment',
      icon: <SchoolIcon />,
      color: '#667eea',
    },
    { 
      title: 'Attendance', 
      description: 'Attendance analysis',
      path: '/attendance/reports',
      icon: <FactCheckIcon />,
      color: '#43e97b',
    },
    { 
      title: 'Finance', 
      description: 'Fee collection reports',
      path: '/finance/reports',
      icon: <MoneyIcon />,
      color: '#f093fb',
    },
    { 
      title: 'Examinations', 
      description: 'Exam results & grades',
      path: '/examinations/reports',
      icon: <AssessmentIcon />,
      color: '#fa709a',
    },
    { 
      title: 'Library', 
      description: 'Books & circulation',
      path: '/library/reports',
      icon: <LibraryBooksIcon />,
      color: '#30cfd0',
    },
    { 
      title: 'Sports & ECA', 
      description: 'Activities & sports',
      path: '/sports/dashboard',
      icon: <EmojiEventsIcon />,
      color: '#feca57',
    },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/reports/dashboard');
        setData(response.data.data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        if (err.response?.status === 401) {
          setError('401');
        } else {
          setError('Failed to load dashboard data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error === '401') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary" align="center">
          Please login to view the dashboard
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const summaryCards = [
    {
      title: 'Total Students',
      value: data?.summary.totalStudents ?? 0,
      change: `+${data?.summary.newAdmissionsThisMonth ?? 0}`,
      changeLabel: 'new this month',
      icon: <SchoolIcon sx={{ fontSize: 32 }} />,
      color: '#667eea',
      trend: 'up',
    },
    {
      title: 'Total Staff',
      value: data?.summary.totalStaff ?? 0,
      change: 'Active',
      changeLabel: 'members',
      icon: <PeopleIcon sx={{ fontSize: 32 }} />,
      color: '#43e97b',
      trend: 'neutral',
    },
    {
      title: 'Attendance Rate',
      value: `${data?.summary.attendanceRate ?? 0}%`,
      change: data?.summary.attendanceRate && data.summary.attendanceRate < 75 ? 'Low' : 'Good',
      changeLabel: 'Last 30 days',
      icon: <CheckCircleIcon sx={{ fontSize: 32 }} />,
      color: data?.summary.attendanceRate && data.summary.attendanceRate < 75 ? '#fa709a' : '#4facfe',
      trend: data?.summary.attendanceRate && data.summary.attendanceRate < 75 ? 'down' : 'up',
    },
    {
      title: 'Fee Collection',
      value: `${data?.summary.feeCollectionRate ?? 0}%`,
      change: `${data?.summary.pendingFeeStudents ?? 0}`,
      changeLabel: 'Pending',
      icon: <MoneyIcon sx={{ fontSize: 32 }} />,
      color: '#f093fb',
      trend: data?.summary.feeCollectionRate && data.summary.feeCollectionRate < 50 ? 'down' : 'up',
    },
    {
      title: 'Library Books',
      value: data?.summary.totalBooks ?? 0,
      change: 'Total',
      changeLabel: 'in catalog',
      icon: <LibraryBooksIcon sx={{ fontSize: 32 }} />,
      color: '#30cfd0',
      trend: 'neutral',
    },
    {
      title: 'Active Classes',
      value: data?.summary.totalClasses ?? 0,
      change: `${data?.summary.totalExams ?? 0}`,
      changeLabel: 'this session',
      icon: <ClassIcon sx={{ fontSize: 32 }} />,
      color: '#feca57',
      trend: 'neutral',
    },
  ];

  const enrollmentData = data?.charts.enrollmentTrend.map(item => ({
    name: item.label,
    students: item.value,
  })) ?? [];

  const attendanceData = data?.charts.attendanceTrend.map(item => ({
    name: item.label,
    rate: item.value,
  })) ?? [];

  const feeData = data?.charts.feeCollection.map(item => ({
    name: item.label,
    amount: item.value,
  })) ?? [];

  const gradeData = data?.charts.examPerformance.map(item => ({
    name: item.label,
    count: item.value,
  })) ?? [];

  const genderData = data?.charts.genderDistribution.filter(item => item.value > 0).map(item => ({
    name: item.label,
    value: item.value,
  })) ?? [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box 
        sx={{ 
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome, admin!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            School Admin • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          endIcon={<DescriptionIcon />}
          onClick={() => navigate('/reports')}
          sx={{
            borderColor: theme.palette.divider,
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: '#667eea',
              background: alpha('#667eea', 0.08),
            },
          }}
        >
          View Full Reports
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                background: theme.palette.mode === 'dark' 
                  ? `linear-gradient(135deg, ${alpha(card.color, 0.15)} 0%, ${alpha(card.color, 0.05)} 100%)`
                  : `linear-gradient(135deg, ${alpha(card.color, 0.1)} 0%, ${alpha(card.color, 0.02)} 100%)`,
                border: `1px solid ${alpha(card.color, 0.2)}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(card.color, 0.25)}`,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${card.color} 0%, ${alpha(card.color, 0.7)} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      boxShadow: `0 4px 12px ${alpha(card.color, 0.4)}`,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Chip
                    size="small"
                    label={card.change}
                    icon={
                      card.trend === 'up' ? <TrendingUpIcon /> : 
                      card.trend === 'down' ? <TrendingDownIcon /> : 
                      <CheckCircleIcon />
                    }
                    sx={{
                      background: card.trend === 'up' ? alpha('#43e97b', 0.15) : 
                                 card.trend === 'down' ? alpha('#fa709a', 0.15) : 
                                 alpha('#4facfe', 0.15),
                      color: card.trend === 'up' ? '#43e97b' : 
                             card.trend === 'down' ? '#fa709a' : 
                             '#4facfe',
                      fontWeight: 600,
                      border: 'none',
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.changeLabel}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Enrollment Trend */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.6)
                : '#fff',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Enrollment Trend
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Last 6 months enrollment
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={enrollmentData}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.1)} />
                <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <Tooltip 
                  contentStyle={{ 
                    background: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="students" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorStudents)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gender Distribution */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.6)
                : '#fff',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Gender Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Student demographics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={(item) => `${item.name}: ${item.value}`}
                >
                  {genderData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<MaleIcon />} 
                label={`Male: ${data?.summary.totalMaleStudents ?? 0} (${Math.round((data?.summary.totalMaleStudents ?? 0) / (data?.summary.totalStudents || 1) * 100)}%)`}
                sx={{ background: alpha('#667eea', 0.15), color: '#667eea' }}
              />
              <Chip 
                icon={<FemaleIcon />} 
                label={`Female: ${data?.summary.totalFemaleStudents ?? 0} (${Math.round((data?.summary.totalFemaleStudents ?? 0) / (data?.summary.totalStudents || 1) * 100)}%)`}
                sx={{ background: alpha('#f093fb', 0.15), color: '#f093fb' }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Attendance Trend */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.6)
                : '#fff',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Attendance Trends
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Daily attendance rate
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.1)} />
                <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <Tooltip 
                  contentStyle={{ 
                    background: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#4facfe" 
                  strokeWidth={3}
                  dot={{ fill: '#4facfe', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Attendance %"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Fee Collection */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.6)
                : '#fff',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Fee Collection
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Monthly breakdown (in thousands)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.1)} />
                <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <Tooltip 
                  contentStyle={{ 
                    background: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="amount" 
                  fill="#fa709a" 
                  radius={[8, 8, 0, 0]}
                  name="Amount (K)"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Exam Performance */}
        {gradeData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                height: '100%',
                background: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.paper, 0.6)
                  : '#fff',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Exam Performance
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Grade distribution overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.1)} />
                  <XAxis type="number" stroke={theme.palette.text.secondary} />
                  <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} />
                  <Tooltip 
                    contentStyle={{ 
                      background: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" fill="#43e97b" radius={[0, 8, 8, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Performance Indicators */}
        <Grid item xs={12} md={gradeData.length > 0 ? 6 : 12}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.6)
                : '#fff',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Key Rate Indicators
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Performance at a glance
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Attendance Rate
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color={
                    (data?.summary.attendanceRate ?? 0) >= 75 ? '#43e97b' : '#fa709a'
                  }>
                    {data?.summary.attendanceRate ?? 0}%
                  </Typography>
                </Box>
                <Box sx={{ 
                  height: 8, 
                  borderRadius: 4, 
                  background: alpha(theme.palette.divider, 0.1),
                  overflow: 'hidden',
                }}>
                  <Box sx={{ 
                    height: '100%', 
                    width: `${data?.summary.attendanceRate ?? 0}%`,
                    background: (data?.summary.attendanceRate ?? 0) >= 75 
                      ? 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)'
                      : 'linear-gradient(90deg, #fa709a 0%, #fee140 100%)',
                    transition: 'width 1s ease-in-out',
                  }} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {(data?.summary.attendanceRate ?? 0) >= 75 ? 'Good' : 'Needs Improvement'} - Last 30 days average
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Fee Collection Rate
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color={
                    (data?.summary.feeCollectionRate ?? 0) >= 70 ? '#43e97b' : '#fa709a'
                  }>
                    {data?.summary.feeCollectionRate ?? 0}%
                  </Typography>
                </Box>
                <Box sx={{ 
                  height: 8, 
                  borderRadius: 4, 
                  background: alpha(theme.palette.divider, 0.1),
                  overflow: 'hidden',
                }}>
                  <Box sx={{ 
                    height: '100%', 
                    width: `${data?.summary.feeCollectionRate ?? 0}%`,
                    background: (data?.summary.feeCollectionRate ?? 0) >= 70 
                      ? 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)'
                      : 'linear-gradient(90deg, #fa709a 0%, #fee140 100%)',
                    transition: 'width 1s ease-in-out',
                  }} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {data?.summary.pendingFeeStudents ?? 0} students with pending fees
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 2,
                mt: 2,
              }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: alpha('#667eea', 0.1),
                  border: `1px solid ${alpha('#667eea', 0.2)}`,
                }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Exams
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="#667eea">
                    {data?.summary.totalExams ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  background: alpha('#30cfd0', 0.1),
                  border: `1px solid ${alpha('#30cfd0', 0.2)}`,
                }}>
                  <Typography variant="caption" color="text.secondary">
                    Active Classes
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="#30cfd0">
                    {data?.summary.totalClasses ?? 0}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activities & Upcoming Events */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.6)
                : '#fff',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Recent Activities
              </Typography>
              <NotificationsIcon sx={{ color: theme.palette.text.secondary }} />
            </Box>
            <List sx={{ py: 0 }}>
              {recentActivities.map((activity, index) => (
                <Box key={activity.id}>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          background: alpha(activity.color, 0.15),
                          color: activity.color,
                          width: 40,
                          height: 40,
                        }}
                      >
                        {activity.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {activity.description}
                        </Typography>
                      }
                      secondary={
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          {activity.time}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < recentActivities.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.6)
                : '#fff',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Upcoming Events
              </Typography>
              <CalendarTodayIcon sx={{ color: theme.palette.text.secondary }} />
            </Box>
            <List sx={{ py: 0 }}>
              {upcomingEvents.map((event, index) => (
                <Box key={event.id}>
                  <ListItem sx={{ px: 0, py: 1.5 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          background: alpha(event.color, 0.15),
                          color: event.color,
                          width: 40,
                          height: 40,
                        }}
                      >
                        {event.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {event.title}
                        </Typography>
                      }
                      secondary={
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          {event.date}
                          <Chip
                            label={event.status}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              background: alpha(event.color, 0.15),
                              color: event.color,
                            }}
                          />
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < upcomingEvents.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Overview & Quick Reports */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Quick Overview */}
        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.6)
                : '#fff',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Quick Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Key metrics at a glance
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {quickOverview.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderRadius: 2,
                    background: alpha(item.color, 0.08),
                    border: `1px solid ${alpha(item.color, 0.2)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        background: alpha(item.color, 0.15),
                        color: item.color,
                        width: 36,
                        height: 36,
                      }}
                    >
                      {item.icon}
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color={item.color}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Quick Reports */}
        <Grid item xs={12} md={7}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.background.paper, 0.6)
                : '#fff',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Quick Reports
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Access detailed analytics
                </Typography>
              </Box>
              <Button
                variant="text"
                size="small"
                endIcon={<DescriptionIcon />}
                onClick={() => navigate('/reports')}
                sx={{ color: '#667eea' }}
              >
                View All
              </Button>
            </Box>
            <Grid container spacing={2}>
              {quickReports.map((report, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: alpha(report.color, 0.08),
                      border: `1px solid ${alpha(report.color, 0.2)}`,
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 16px ${alpha(report.color, 0.25)}`,
                        border: `1px solid ${alpha(report.color, 0.5)}`,
                      },
                    }}
                    onClick={() => navigate(report.path)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                      <Avatar
                        sx={{
                          background: `linear-gradient(135deg, ${report.color} 0%, ${alpha(report.color, 0.7)} 100%)`,
                          color: 'white',
                          width: 48,
                          height: 48,
                          margin: '0 auto',
                          mb: 1.5,
                          boxShadow: `0 4px 12px ${alpha(report.color, 0.4)}`,
                        }}
                      >
                        {report.icon}
                      </Avatar>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        {report.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {report.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Access */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
        Quick Access
      </Typography>
      <Grid container spacing={2}>
        {quickLinks.map((link, index) => (
          <Grid item xs={6} sm={4} md={2} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.paper, 0.6)
                  : '#fff',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 12px 24px ${alpha(link.color, 0.3)}`,
                  border: `1px solid ${alpha(link.color, 0.5)}`,
                },
              }}
              onClick={() => navigate(link.path)}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  py: 3,
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${link.color} 0%, ${alpha(link.color, 0.7)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    mb: 1.5,
                    boxShadow: `0 4px 12px ${alpha(link.color, 0.4)}`,
                  }}
                >
                  {link.icon}
                </Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {link.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

import { useEffect, useState, useMemo } from 'react';
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
  IconButton,
  Tooltip,
  LinearProgress,
  Button,
  Stack,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  PersonAdd as PersonAddIcon,
  FactCheck as FactCheckIcon,
  Class as ClassIcon,
  CheckCircle as CheckCircleIcon,
  Notifications as NotificationsIcon,
  EmojiEvents as EmojiEventsIcon,
  AccessTime as AccessTimeIcon,
  Warning as WarningIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  AutoGraph as AutoGraphIcon,
  LocalLibrary as LocalLibraryIcon,
  Book as BookIcon,
  Assignment as AssignmentIcon,
  WbSunny as SunIcon,
  DarkMode as MoonIcon,
  WbTwilight as TwilightIcon,
  CalendarToday as CalendarIcon,
  Groups as GroupsIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import api from '../../config/api';

interface ChartData {
  label: string;
  value: number;
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
    totalCirculations?: number;
    activeEcaActivities?: number;
    activeSports?: number;
  };
  charts: {
    enrollmentTrend: ChartData[];
    attendanceTrend: ChartData[];
    feeCollection: ChartData[];
    examPerformance: ChartData[];
    genderDistribution: ChartData[];
    monthlyNewAdmissions: ChartData[];
    classWiseEnrollment?: ChartData[];
    staffDistribution?: ChartData[];
    feeStatus?: ChartData[];
  };
  recentActivities?: Activity[];
}

interface Activity {
  id: number;
  type: string;
  description: string;
  createdAt: string;
}

interface ReportData {
  enrollment: any;
  attendance: any;
  feeCollection: any;
  examination: any;
  library: any;
  eca: any;
  sports: any;
}

const COLORS = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#30cfd0', '#feca57', '#ff6b6b', '#a855f7', '#14b8a6'];

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 14, mass: 0.8 }
  }
};

const scaleVariants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 120, damping: 12 }
  }
};

const LiquidCard = ({ children, gradient, delay = 0, sx = {} }: any) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <MotionCard
      variants={itemVariants}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { duration: 0.4, ease: [0.2, 0, 0, 1] }
      }}
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: delay * 0.1, ease: [0.2, 0, 0, 1] }}
      sx={{
        background: isDark
          ? 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.05) 100%)'
          : 'linear-gradient(145deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0.72) 100%)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        borderRadius: '28px',
        border: isDark
          ? '1px solid rgba(255, 255, 255, 0.12)'
          : '1px solid rgba(255, 255, 255, 0.65)',
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.2)'
          : '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.02)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.5s cubic-bezier(0.2, 0, 0, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '45%',
          background: isDark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1,
          borderRadius: '28px 28px 0 0',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '60%',
          height: '100%',
          background: isDark
            ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          transition: 'left 0.8s cubic-bezier(0.2, 0, 0, 1)',
          zIndex: 2,
          pointerEvents: 'none',
        },
        '&:hover::after': {
          left: '200%',
        },
        '&:hover': {
          boxShadow: isDark
            ? '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.3)'
            : '0 20px 60px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.03)',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.18)'
            : '1px solid rgba(255, 255, 255, 0.8)',
        },
        ...sx,
      }}
    >
      {gradient && (
        <>
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(gradient, isDark ? 0.25 : 0.15)} 0%, transparent 70%)`,
              pointerEvents: 'none',
              filter: 'blur(40px)',
              animation: 'liquidFloat 8s ease-in-out infinite',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -40,
              left: -40,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(gradient, isDark ? 0.15 : 0.08)} 0%, transparent 70%)`,
              pointerEvents: 'none',
              filter: 'blur(30px)',
              animation: 'liquidFloat 10s ease-in-out infinite reverse',
            }}
          />
        </>
      )}
      {children}
    </MotionCard>
  );
};

const AnimatedNumber = ({ value, suffix = '', prefix = '' }: any) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

const DonutChart = ({ data, colors, size = 180 }: any) => {
  return (
    <PieChart width={size} height={size}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={size * 0.35}
        outerRadius={size * 0.5}
        paddingAngle={4}
        dataKey="value"
        animationDuration={1500}
        animationEasing="ease-out"
      >
        {data.map((_: any, index: number) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
    </PieChart>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  const theme = useTheme();
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ 
        p: 2, 
        borderRadius: 3,
        background: theme.palette.mode === 'dark'
          ? 'rgba(20, 20, 35, 0.95)'
          : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
      }}>
        <Typography variant="body2" fontWeight={700}>{label}</Typography>
        {payload.map((entry: any, index: number) => (
          <Typography key={index} variant="body2" sx={{ color: entry.color, fontWeight: 600 }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: <SunIcon sx={{ color: '#feca57', fontSize: 28 }} /> };
  if (hour < 17) return { text: 'Good Afternoon', icon: <TwilightIcon sx={{ color: '#fa709a', fontSize: 28 }} /> };
  return { text: 'Good Evening', icon: <MoonIcon sx={{ color: '#667eea', fontSize: 28 }} /> };
};

const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 4, height: 22, borderRadius: 2, background: 'linear-gradient(180deg, #667eea, #764ba2)' }} />
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, pl: '20px' }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {action}
  </Box>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/dashboard');
      setData(response.data.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      if (err.response?.status === 401) {
        setError('401');
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReportData = async () => {
    try {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      
      const [enrollment, attendance, feeCollection, examination, library, eca, sports] = await Promise.allSettled([
        api.get('/reports/enrollment'),
        api.get('/reports/attendance', { params: { startDate: formatDate(startOfYear), endDate: formatDate(today) } }),
        api.get('/reports/fee-collection', { params: { startDate: formatDate(startOfYear), endDate: formatDate(today) } }),
        api.get('/reports/examination'),
        api.get('/reports/library', { params: { startDate: formatDate(startOfYear), endDate: formatDate(today) } }),
        api.get('/reports/eca'),
        api.get('/reports/sports'),
      ]);

      setReportData({
        enrollment: enrollment.status === 'fulfilled' ? enrollment.value.data?.data : null,
        attendance: attendance.status === 'fulfilled' ? attendance.value.data?.data : null,
        feeCollection: feeCollection.status === 'fulfilled' ? feeCollection.value.data?.data : null,
        examination: examination.status === 'fulfilled' ? examination.value.data?.data : null,
        library: library.status === 'fulfilled' ? library.value.data?.data : null,
        eca: eca.status === 'fulfilled' ? eca.value.data?.data : null,
        sports: sports.status === 'fulfilled' ? sports.value.data?.data : null,
      });
    } catch (err) {
      console.error('Failed to fetch report data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchReportData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    fetchReportData();
  };

  const recentActivities = [
    { id: 1, type: 'attendance', description: 'Class 10 attendance marked', time: '5 mins ago', icon: <CheckCircleIcon />, color: '#43e97b' },
    { id: 2, type: 'payment', description: 'Fee payment received: Rs 15,000', time: '12 mins ago', icon: <PaymentIcon />, color: '#f093fb' },
    { id: 3, type: 'alert', description: 'Low attendance alert: 3 students', time: '1 hour ago', icon: <WarningIcon />, color: '#fa709a' },
    { id: 4, type: 'exam', description: 'Exam scheduled: Terminal Exam', time: '2 hours ago', icon: <ScheduleIcon />, color: '#667eea' },
    { id: 5, type: 'admission', description: 'New student admission - Grade 6', time: '3 hours ago', icon: <PersonAddIcon />, color: '#4facfe' },
  ];

  const quickStats = [
    { title: 'Students', value: data?.summary.totalStudents ?? 0, icon: <SchoolIcon />, color: '#667eea', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { title: 'Staff', value: data?.summary.totalStaff ?? 0, icon: <PeopleIcon />, color: '#43e97b', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { title: 'Classes', value: data?.summary.totalClasses ?? 0, icon: <ClassIcon />, color: '#f093fb', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { title: 'Books', value: data?.summary.totalBooks ?? 0, icon: <BookIcon />, color: '#30cfd0', bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  ];

  const analyticsCards = [
    { 
      title: 'Attendance', 
      value: data?.summary.attendanceRate ?? 0,
      suffix: '%',
      icon: <FactCheckIcon />,
      color: '#4facfe',
      bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      path: '/attendance/reports'
    },
    { 
      title: 'Fee Collection', 
      value: data?.summary.feeCollectionRate ?? 0,
      suffix: '%',
      icon: <MoneyIcon />,
      color: '#43e97b',
      bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      path: '/finance/reports'
    },
    { 
      title: 'Exams', 
      value: data?.summary.totalExams ?? 0,
      icon: <AssignmentIcon />,
      color: '#fa709a',
      bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      path: '/examinations/reports'
    },
    { 
      title: 'Circulations', 
      value: data?.summary.totalCirculations ?? 0,
      icon: <LocalLibraryIcon />,
      color: '#a855f7',
      bg: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
      path: '/library/reports'
    },
  ];

  const activityDistribution = [
    { subject: 'Sports', A: 120, fullMark: 150 },
    { subject: 'Music', A: 98, fullMark: 150 },
    { subject: 'Art', A: 86, fullMark: 150 },
    { subject: 'Science', A: 99, fullMark: 150 },
    { subject: 'Debate', A: 65, fullMark: 150 },
    { subject: 'Dance', A: 85, fullMark: 150 },
  ];

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <CircularProgress size={60} thickness={4} sx={{ color: '#667eea' }} />
        </motion.div>
      </Box>
    );
  }

  if (error === '401') {
    return (
      <LiquidCard sx={{ p: 4, textAlign: 'center', mt: 4, maxWidth: 500, mx: 'auto' }}>
        <Typography color="text.secondary">
          Please login to view the dashboard
        </Typography>
      </LiquidCard>
    );
  }

  if (error) {
    return (
      <LiquidCard sx={{ p: 4, textAlign: 'center', mt: 4, maxWidth: 500, mx: 'auto' }}>
        <Typography color="error">{error}</Typography>
      </LiquidCard>
    );
  }

  const enrollmentData = data?.charts.enrollmentTrend.map(item => ({
    name: item.label,
    students: item.value,
    value: item.value,
  })) ?? [];

  const classEnrollmentData = data?.charts.classWiseEnrollment?.map(item => ({
    name: item.label,
    students: item.value,
  })) ?? [];

  const feeStatusData: { name: string; value: number }[] = data?.charts.feeStatus?.map((item: any) => ({
    name: item.label || item.name,
    value: item.value,
  })) ?? [
    { name: 'Paid', value: data?.summary.totalStudents ? data.summary.totalStudents - (data.summary.pendingFeeStudents || 0) : 0 },
    { name: 'Pending', value: data?.summary.pendingFeeStudents || 0 },
    { name: 'Partial', value: Math.floor((data?.summary.pendingFeeStudents || 0) * 0.3) },
  ];

  const genderData = data?.charts.genderDistribution.filter(item => item.value > 0).map(item => ({
    name: item.label,
    value: item.value,
  })) ?? [
    { name: 'Male', value: data?.summary.totalMaleStudents || 55 },
    { name: 'Female', value: data?.summary.totalFemaleStudents || 45 },
  ];

  const staffData = (data?.charts.staffDistribution ?? []).map(item => ({
    name: (item as any).label || (item as any).name || 'Other',
    value: item.value,
  }));
  const staffDataFinal = staffData.length > 0 ? staffData : [
    { name: 'Teachers', value: 45 },
    { name: 'Admin', value: 12 },
    { name: 'Support', value: 20 },
    { name: 'Librarian', value: 5 },
  ];

  const attendanceData = data?.charts.attendanceTrend?.map(item => ({
    name: item.label,
    rate: item.value,
  })) ?? [];

  const admissionsData = data?.charts.monthlyNewAdmissions?.map(item => ({
    name: item.label,
    admissions: item.value,
  })) ?? [];

  const examPerformanceData = data?.charts.examPerformance?.map(item => ({
    name: item.label,
    score: item.value,
  })) ?? [];

  const greeting = getGreeting();

  const highlightItems = [
    { icon: <SchoolIcon sx={{ fontSize: 18 }} />, label: `${data?.summary.totalStudents ?? 0} Students`, color: '#667eea' },
    { icon: <GroupsIcon sx={{ fontSize: 18 }} />, label: `${data?.summary.totalStaff ?? 0} Staff`, color: '#43e97b' },
    { icon: <PersonAddIcon sx={{ fontSize: 18 }} />, label: `+${data?.summary.newAdmissionsThisMonth ?? 0} New This Month`, color: '#4facfe' },
    { icon: <MenuBookIcon sx={{ fontSize: 18 }} />, label: `${data?.summary.totalBooks ?? 0} Books`, color: '#a855f7' },
    { icon: <EmojiEventsIcon sx={{ fontSize: 18 }} />, label: `${data?.summary.activeEcaActivities ?? 0} ECA Activities`, color: '#f093fb' },
  ];

  return (
    <MotionBox
      sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Header — Liquid Glass */}
      <MotionBox
        variants={itemVariants}
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: '28px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(102,126,234,0.12) 0%, rgba(118,75,162,0.08) 50%, rgba(240,147,251,0.06) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.62) 100%)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: isDark
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(255,255,255,0.65)',
          boxShadow: isDark
            ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.3)'
            : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 32px rgba(102,126,234,0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '45%',
            background: isDark
              ? 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)',
            pointerEvents: 'none',
            borderRadius: '28px 28px 0 0',
            zIndex: 1,
          },
        }}
      >
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(102,126,234,0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(102,126,234,0.12) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)', animation: 'liquidFloat 8s ease-in-out infinite' }} />
        <Box sx={{ position: 'absolute', bottom: -40, left: '30%', width: 160, height: 160, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(240,147,251,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(240,147,251,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(30px)', animation: 'liquidFloat 10s ease-in-out infinite reverse' }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              {greeting.icon}
              <Typography variant="h4" fontWeight={800} sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}>
                {greeting.text}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(102, 126, 234, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '14px',
                  p: 1.2,
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.15)'
                      : 'rgba(102, 126, 234, 0.2)',
                  }
                }}
              >
                <RefreshIcon sx={{
                  fontSize: 20,
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  }
                }} />
              </IconButton>
            </Tooltip>
            <Box
              onClick={() => navigate('/reports')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2.5,
                py: 1,
                borderRadius: '16px',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(102,126,234,0.35) 0%, rgba(118,75,162,0.3) 100%)'
                  : 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.15) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: isDark ? '1px solid rgba(102,126,234,0.3)' : '1px solid rgba(102,126,234,0.25)',
                cursor: 'pointer',
                boxShadow: isDark
                  ? '0 6px 20px rgba(102,126,234,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 6px 20px rgba(102,126,234,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
                transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: isDark
                    ? '0 12px 32px rgba(102,126,234,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
                    : '0 12px 32px rgba(102,126,234,0.25), inset 0 1px 0 rgba(255,255,255,0.7)',
                }
              }}
            >
              <AutoGraphIcon sx={{ color: isDark ? '#fff' : '#667eea', fontSize: 18 }} />
              <Typography sx={{ color: isDark ? '#fff' : '#667eea', fontWeight: 600, fontSize: '0.8rem' }}>
                Analytics
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Highlight Strip */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            mt: 2.5,
            pt: 2,
            borderTop: theme.palette.mode === 'dark'
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(102,126,234,0.08)',
            overflowX: 'auto',
            position: 'relative',
            zIndex: 1,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {highlightItems.map((item, i) => (
            <Chip
              key={i}
              icon={item.icon}
              label={item.label}
              size="small"
              sx={{
                bgcolor: alpha(item.color, 0.1),
                color: item.color,
                fontWeight: 600,
                fontSize: '0.75rem',
                borderRadius: '10px',
                border: `1px solid ${alpha(item.color, 0.15)}`,
                '& .MuiChip-icon': { color: item.color },
                whiteSpace: 'nowrap',
              }}
            />
          ))}
        </Stack>
      </MotionBox>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickStats.map((stat, index) => (
          <Grid item xs={6} md={3} key={index}>
            <MotionCard
              variants={scaleVariants}
              whileHover={{ scale: 1.04, y: -6 }}
              sx={{
                borderRadius: '24px',
                overflow: 'hidden',
                position: 'relative',
                background: isDark
                  ? `linear-gradient(145deg, ${alpha(stat.color, 0.18)} 0%, ${alpha(stat.color, 0.06)} 100%)`
                  : `linear-gradient(145deg, ${alpha(stat.color, 0.14)} 0%, ${alpha(stat.color, 0.04)} 100%)`,
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: `1px solid ${alpha(stat.color, isDark ? 0.2 : 0.25)}`,
                boxShadow: `0 8px 32px ${alpha(stat.color, 0.15)}, inset 0 1px 0 ${alpha('#ffffff', isDark ? 0.08 : 0.5)}`,
                transition: 'all 0.5s cubic-bezier(0.2, 0, 0, 1)',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: `linear-gradient(180deg, ${alpha('#ffffff', isDark ? 0.06 : 0.35)} 0%, transparent 100%)`,
                  pointerEvents: 'none',
                  borderRadius: '24px 24px 0 0',
                  zIndex: 1,
                },
                '&:hover': {
                  boxShadow: `0 16px 48px ${alpha(stat.color, 0.25)}, inset 0 1px 0 ${alpha('#ffffff', isDark ? 0.12 : 0.7)}`,
                  border: `1px solid ${alpha(stat.color, isDark ? 0.3 : 0.35)}`,
                },
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${alpha(stat.color, isDark ? 0.3 : 0.2)} 0%, transparent 70%)`,
                  filter: 'blur(20px)',
                  animation: 'liquidFloat 6s ease-in-out infinite',
                }}
              />
              <CardContent sx={{ position: 'relative', zIndex: 2, py: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: alpha(stat.color, 0.7), fontWeight: 600, mb: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h3" fontWeight={800} sx={{ color: stat.color, textShadow: `0 2px 12px ${alpha(stat.color, 0.3)}` }}>
                      <AnimatedNumber value={stat.value} />
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    background: `linear-gradient(135deg, ${alpha(stat.color, 0.2)} 0%, ${alpha(stat.color, 0.1)} 100%)`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(stat.color, 0.2)}`,
                    color: stat.color,
                    width: 48, 
                    height: 48,
                    boxShadow: `0 4px 16px ${alpha(stat.color, 0.2)}`,
                  }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {analyticsCards.map((card, index) => (
          <Grid item xs={6} md={3} key={index}>
            <LiquidCard gradient={card.color} delay={index}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: '16px',
                      background: card.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 8px 24px ${alpha(card.color, 0.4)}`,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Chip
                    label={card.suffix ? `${card.value}${card.suffix}` : card.value}
                    size="small"
                    sx={{
                      background: alpha(card.color, 0.15),
                      color: card.color,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: card.color }}>
                  <AnimatedNumber value={card.value} suffix={card.suffix} />
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {card.title}
                </Typography>
                <Box 
                  onClick={() => navigate(card.path)}
                  sx={{ 
                    mt: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5, 
                    cursor: 'pointer',
                    color: card.color,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>View Details</Typography>
                  <ArrowForwardIcon sx={{ fontSize: 14 }} />
                </Box>
              </CardContent>
            </LiquidCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <LiquidCard gradient="#667eea">
            <CardContent>
              <SectionHeader
                title="Enrollment Trend"
                subtitle="Monthly student enrollment"
                action={
                  <Chip 
                    icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
                    label="+12% growth" 
                    size="small"
                    sx={{ bgcolor: alpha('#43e97b', 0.15), color: '#43e97b', fontWeight: 600 }} 
                  />
                }
              />
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={enrollmentData}>
                  <defs>
                    <linearGradient id="liquidEnrollGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} vertical={false} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="students" 
                    stroke="#667eea" 
                    strokeWidth={3}
                    fill="url(#liquidEnrollGradient)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </LiquidCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <LiquidCard gradient="#f093fb" sx={{ height: '100%' }}>
            <CardContent>
              <SectionHeader title="Gender Distribution" subtitle="Male vs Female ratio" />
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                <DonutChart data={genderData} colors={['#667eea', '#f093fb']} size={180} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#667eea' }} />
                  <Typography variant="body2" fontWeight={600}>
                    Male: {data?.summary.totalMaleStudents || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f093fb' }} />
                  <Typography variant="body2" fontWeight={600}>
                    Female: {data?.summary.totalFemaleStudents || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </LiquidCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <LiquidCard gradient="#4facfe">
            <CardContent>
              <SectionHeader title="Class-wise Enrollment" subtitle="Students per grade" />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={classEnrollmentData.length > 0 ? classEnrollmentData : [
                  { name: 'Grade 6', students: 120 },
                  { name: 'Grade 7', students: 145 },
                  { name: 'Grade 8', students: 132 },
                  { name: 'Grade 9', students: 156 },
                  { name: 'Grade 10', students: 142 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} vertical={false} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="students" 
                    radius={[8, 8, 4, 4]}
                    animationDuration={1500}
                  >
                    {COLORS.slice(0, 5).map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </LiquidCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <LiquidCard gradient="#43e97b">
            <CardContent>
              <SectionHeader title="Fee Status" subtitle="Payment overview" />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={feeStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        animationDuration={1500}
                      >
                        {feeStatusData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box>
                  {feeStatusData.map((item, index) => (
                    <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[index] }} />
                      <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">({item.value})</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </LiquidCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <LiquidCard gradient="#a855f7">
            <CardContent>
              <SectionHeader title="ECA Activities" subtitle="Participation by category" />
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={activityDistribution}>
                  <PolarGrid stroke={alpha(theme.palette.divider, 0.3)} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                  <Radar
                    name="Participants"
                    dataKey="A"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.3}
                    animationDuration={2000}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </LiquidCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <LiquidCard gradient="#30cfd0">
            <CardContent>
              <SectionHeader title="Staff Distribution" subtitle="By department" />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={staffData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} horizontal={false} />
                  <XAxis type="number" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 8, 8, 0]}
                    animationDuration={1500}
                  >
                    {staffData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </LiquidCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <LiquidCard>
            <CardContent>
              <SectionHeader
                title="Recent Activities"
                subtitle="Latest updates"
                action={<NotificationsIcon sx={{ color: theme.palette.text.secondary }} />}
              />
              <List sx={{ py: 0 }}>
                {recentActivities.map((activity, index) => (
                  <Box key={activity.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            background: alpha(activity.color, 0.15),
                            color: activity.color,
                            width: 44,
                            height: 44,
                            borderRadius: '14px',
                            boxShadow: `0 4px 16px ${alpha(activity.color, 0.25)}`,
                          }}
                        >
                          {activity.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            {activity.description}
                          </Typography>
                        }
                        secondary={
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 12 }} />
                            {activity.time}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider sx={{ opacity: 0.4 }} />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </LiquidCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <LiquidCard>
            <CardContent>
              <SectionHeader
                title="Performance Overview"
                subtitle="Key metrics at a glance"
                action={<EmojiEventsIcon sx={{ color: '#feca57' }} />}
              />
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Attendance Rate</Typography>
                  <Typography variant="body2" fontWeight={700} color="#4facfe">{data?.summary.attendanceRate || 85}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={data?.summary.attendanceRate || 85}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: alpha('#4facfe', 0.15),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Fee Collection</Typography>
                  <Typography variant="body2" fontWeight={700} color="#43e97b">{data?.summary.feeCollectionRate || 75}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={data?.summary.feeCollectionRate || 75}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: alpha('#43e97b', 0.15),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Library Circulation</Typography>
                  <Typography variant="body2" fontWeight={700} color="#a855f7">{reportData?.library?.circulationRate || 68}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={reportData?.library?.circulationRate || 68}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: alpha('#a855f7', 0.15),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, #a855f7 0%, #6366f1 100%)',
                    }
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>ECA Participation</Typography>
                  <Typography variant="body2" fontWeight={700} color="#f093fb">{reportData?.eca?.participationRate || 72}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={reportData?.eca?.participationRate || 72}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: alpha('#f093fb', 0.15),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)',
                    }
                  }}
                />
              </Box>
            </CardContent>
          </LiquidCard>
        </Grid>
      </Grid>

      {/* Attendance Trend & Exam Performance Row */}
      <Grid container spacing={3} sx={{ mt: 1, mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <LiquidCard gradient="#4facfe">
            <CardContent>
              <SectionHeader
                title="Attendance Trend"
                subtitle="Monthly attendance rate"
                action={
                  <Chip
                    label={`${data?.summary.attendanceRate ?? 0}% avg`}
                    size="small"
                    sx={{ bgcolor: alpha('#4facfe', 0.15), color: '#4facfe', fontWeight: 600 }}
                  />
                }
              />
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={attendanceData.length > 0 ? attendanceData : [
                  { name: 'Jan', rate: 88 }, { name: 'Feb', rate: 91 }, { name: 'Mar', rate: 86 },
                  { name: 'Apr', rate: 93 }, { name: 'May', rate: 89 }, { name: 'Jun', rate: 95 },
                  { name: 'Jul', rate: 82 }, { name: 'Aug', rate: 90 }, { name: 'Sep', rate: 94 },
                  { name: 'Oct', rate: 92 }, { name: 'Nov', rate: 88 }, { name: 'Dec', rate: 91 },
                ]}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4facfe" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#4facfe" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} vertical={false} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[60, 100]} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#4facfe"
                    strokeWidth={3}
                    fill="url(#attendanceGradient)"
                    animationDuration={2000}
                    name="Attendance %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </LiquidCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <LiquidCard gradient="#fa709a" sx={{ height: '100%' }}>
            <CardContent>
              <SectionHeader title="Exam Performance" subtitle="Average scores by subject" />
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={examPerformanceData.length > 0 ? examPerformanceData : [
                  { name: 'Math', score: 72 }, { name: 'Science', score: 78 },
                  { name: 'English', score: 81 }, { name: 'Social', score: 69 },
                  { name: 'Nepali', score: 84 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} horizontal={false} />
                  <XAxis type="number" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]} animationDuration={1500} name="Avg Score">
                    {(examPerformanceData.length > 0 ? examPerformanceData : [
                      { name: 'Math', score: 72 }, { name: 'Science', score: 78 },
                      { name: 'English', score: 81 }, { name: 'Social', score: 69 },
                      { name: 'Nepali', score: 84 },
                    ]).map((_: any, index: number) => (
                      <Cell key={`exam-${index}`} fill={['#fa709a', '#f093fb', '#667eea', '#4facfe', '#43e97b'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </LiquidCard>
        </Grid>
      </Grid>

      {/* Monthly Admissions & Fee Collection Trend */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <LiquidCard gradient="#43e97b">
            <CardContent>
              <SectionHeader
                title="Monthly Admissions"
                subtitle="New student enrollments"
                action={
                  <Chip
                    icon={<PersonAddIcon sx={{ fontSize: 16 }} />}
                    label={`+${data?.summary.newAdmissionsThisMonth ?? 0} this month`}
                    size="small"
                    sx={{ bgcolor: alpha('#43e97b', 0.15), color: '#43e97b', fontWeight: 600 }}
                  />
                }
              />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={admissionsData.length > 0 ? admissionsData : [
                  { name: 'Jan', admissions: 12 }, { name: 'Feb', admissions: 8 },
                  { name: 'Mar', admissions: 15 }, { name: 'Apr', admissions: 22 },
                  { name: 'May', admissions: 18 }, { name: 'Jun', admissions: 5 },
                  { name: 'Jul', admissions: 10 }, { name: 'Aug', admissions: 25 },
                  { name: 'Sep', admissions: 14 }, { name: 'Oct', admissions: 7 },
                  { name: 'Nov', admissions: 9 }, { name: 'Dec', admissions: 3 },
                ]}>
                  <defs>
                    <linearGradient id="admissionsBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#43e97b" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#38f9d7" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} vertical={false} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="admissions"
                    fill="url(#admissionsBarGradient)"
                    radius={[6, 6, 2, 2]}
                    animationDuration={1500}
                    name="Admissions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </LiquidCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <LiquidCard gradient="#f093fb">
            <CardContent>
              <SectionHeader
                title="Fee Collection Trend"
                subtitle="Monthly collection overview"
                action={
                  <Chip
                    label={`${data?.summary.feeCollectionRate ?? 0}% collected`}
                    size="small"
                    sx={{ bgcolor: alpha('#f093fb', 0.15), color: '#f093fb', fontWeight: 600 }}
                  />
                }
              />
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={(data?.charts.feeCollection ?? []).map(item => ({
                  name: item.label,
                  amount: item.value,
                })).length > 0 ? (data?.charts.feeCollection ?? []).map(item => ({
                  name: item.label,
                  amount: item.value,
                })) : [
                  { name: 'Jan', amount: 180000 }, { name: 'Feb', amount: 220000 },
                  { name: 'Mar', amount: 195000 }, { name: 'Apr', amount: 310000 },
                  { name: 'May', amount: 260000 }, { name: 'Jun', amount: 150000 },
                  { name: 'Jul', amount: 175000 }, { name: 'Aug', amount: 340000 },
                  { name: 'Sep', amount: 290000 }, { name: 'Oct', amount: 240000 },
                  { name: 'Nov', amount: 210000 }, { name: 'Dec', amount: 185000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} vertical={false} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#f093fb"
                    strokeWidth={3}
                    dot={{ fill: '#f093fb', r: 4, strokeWidth: 2, stroke: theme.palette.background.paper }}
                    activeDot={{ r: 6, fill: '#f093fb' }}
                    animationDuration={2000}
                    name="Amount (Rs)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </LiquidCard>
        </Grid>
      </Grid>

      {/* Quick Navigation Footer */}
      <MotionBox variants={itemVariants} sx={{ mt: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="text"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/reports')}
            sx={{ color: '#667eea', fontWeight: 600 }}
          >
            View All Reports
          </Button>
        </Box>
      </MotionBox>
    </MotionBox>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
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
import apiClient from '../../services/apiClient';
import { useTranslation } from 'react-i18next';

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
  color?: string;
  icon?: React.ReactNode;
  time?: string;
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

import { C, R } from '../../theme/designTokens';

// Blue & Black Aesthetic Color Palette
const COLORS = [
  '#3b82f6', // Bright Blue
  '#1e40af', // Deep Blue
  '#60a5fa', // Light Blue
  '#1e293b', // Dark Slate
  '#0ea5e9', // Sky Blue
  '#334155', // Slate Gray
  '#06b6d4', // Cyan
  '#0f172a', // Almost Black
  '#38bdf8', // Light Cyan
  '#475569', // Medium Slate
];

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
        y: -4, 
        scale: 1.01,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: 'easeOut' }}
      sx={{
        background: isDark
          ? 'rgba(30, 30, 40, 0.6)'
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '8px',
        border: isDark
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: isDark
          ? '0 2px 8px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: isDark
            ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1,
          borderRadius: '8px 8px 0 0',
        },
        '&:hover': {
          boxShadow: isDark
            ? '0 4px 12px rgba(0,0,0,0.4)'
            : '0 4px 12px rgba(0,0,0,0.08)',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.15)'
            : '1px solid rgba(0, 0, 0, 0.12)',
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
              background: `radial-gradient(circle, ${alpha(gradient, isDark ? 0.12 : 0.06)} 0%, transparent 70%)`,
              pointerEvents: 'none',
              filter: 'blur(25px)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -40,
              left: -40,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(gradient, isDark ? 0.08 : 0.04)} 0%, transparent 70%)`,
              pointerEvents: 'none',
              filter: 'blur(20px)',
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
        borderRadius: 2,
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

const getGreeting = (t: any) => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: t('dashboard.goodMorning'), icon: <SunIcon sx={{ color: C.warning, fontSize: 28 }} /> };
  if (hour < 17) return { text: t('dashboard.goodAfternoon'), icon: <TwilightIcon sx={{ color: C.danger, fontSize: 28 }} /> };
  return { text: t('dashboard.goodEvening'), icon: <MoonIcon sx={{ color: C.primary, fontSize: 28 }} /> };
};

const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Box>
      <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 4, height: 22, borderRadius: 2, background: `linear-gradient(180deg, ${C.primary}, ${C.purple})` }} />
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
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
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
      const response = await apiClient.get('/reports/dashboard');
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
        apiClient.get('/reports/enrollment'),
        apiClient.get('/reports/attendance', { params: { startDate: formatDate(startOfYear), endDate: formatDate(today) } }),
        apiClient.get('/reports/fee-collection', { params: { startDate: formatDate(startOfYear), endDate: formatDate(today) } }),
        apiClient.get('/reports/examination'),
        apiClient.get('/reports/library', { params: { startDate: formatDate(startOfYear), endDate: formatDate(today) } }),
        apiClient.get('/reports/eca'),
        apiClient.get('/reports/sports'),
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

  // Use only real data from API, no hardcoded activities
  const recentActivities = data?.recentActivities || [];

  const quickStats = [
    { title: t('dashboard.students'), value: data?.summary.totalStudents ?? 0, icon: <SchoolIcon />, color: '#3b82f6', bg: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' },
    { title: t('dashboard.staff'), value: data?.summary.totalStaff ?? 0, icon: <PeopleIcon />, color: '#0ea5e9', bg: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)' },
    { title: t('dashboard.classes'), value: data?.summary.totalClasses ?? 0, icon: <ClassIcon />, color: '#60a5fa', bg: 'linear-gradient(135deg, #1e3a8a 0%, #60a5fa 100%)' },
    { title: t('dashboard.totalBooks'), value: data?.summary.totalBooks ?? 0, icon: <BookIcon />, color: '#06b6d4', bg: 'linear-gradient(135deg, #164e63 0%, #06b6d4 100%)' },
  ];

  const analyticsCards = [
    { 
      title: t('dashboard.attendanceTitle'), 
      value: data?.summary.attendanceRate ?? 0,
      suffix: '%',
      icon: <FactCheckIcon />,
      color: '#3b82f6',
      bg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      path: `/${municipalitySlug}/attendance/reports`
    },
    { 
      title: t('dashboard.feeCollection'), 
      value: data?.summary.feeCollectionRate ?? 0,
      suffix: '%',
      icon: <MoneyIcon />,
      color: '#0ea5e9',
      bg: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)',
      path: `/${municipalitySlug}/finance/reports`
    },
    { 
      title: t('dashboard.exams'), 
      value: data?.summary.totalExams ?? 0,
      icon: <AssignmentIcon />,
      color: '#60a5fa',
      bg: 'linear-gradient(135deg, #1e40af 0%, #60a5fa 100%)',
      path: `/${municipalitySlug}/examinations/reports`
    },
    { 
      title: t('dashboard.circulations'), 
      value: data?.summary.totalCirculations ?? 0,
      icon: <LocalLibraryIcon />,
      color: '#06b6d4',
      bg: 'linear-gradient(135deg, #164e63 0%, #06b6d4 100%)',
      path: `/${municipalitySlug}/library/reports`
    },
  ];

  // Transform ECA data for radar chart
  const activityDistribution = useMemo(() => {
    if (!reportData?.eca?.byCategory) return [];
    return reportData.eca.byCategory.map((item: any) => ({
      subject: item.category,
      A: item.count,
    }));
  }, [reportData?.eca]);

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <CircularProgress size={60} thickness={4} sx={{ color: '#4a5568' }} />
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

  // Translate class enrollment labels (Grade 6 -> कक्षा ६)
  const classEnrollmentData = data?.charts.classWiseEnrollment?.map(item => {
    const label = item.label;
    // If label starts with "Grade ", translate it
    if (label.startsWith('Grade ')) {
      const gradeNumber = label.replace('Grade ', '');
      return {
        name: `${t('examinations.grade')} ${gradeNumber}`,
        students: item.value,
      };
    }
    return {
      name: label,
      students: item.value,
    };
  }) ?? [];

  // Translate fee status labels
  const feeStatusData: { name: string; value: number }[] = data?.charts.feeStatus?.map((item: any) => {
    const label = item.label || item.name;
    // Translate common fee status labels
    const translatedLabel = label === 'Paid' ? t('finance.paid') :
                           label === 'Partial' ? t('finance.partial') :
                           label === 'Unpaid' ? t('finance.unpaid') :
                           label === 'Pending' ? t('finance.pending') :
                           label === 'Overdue' ? t('finance.overdue') :
                           label;
    return {
      name: translatedLabel,
      value: item.value,
    };
  }) ?? [];

  // Translate gender labels
  const genderData = data?.charts.genderDistribution?.filter(item => item.value > 0).map(item => {
    const label = item.label;
    // Translate gender labels
    const translatedLabel = label === 'Male' ? t('students.male') :
                           label === 'Female' ? t('students.female') :
                           label === 'Other' ? t('students.other') :
                           label;
    return {
      name: translatedLabel,
      value: item.value,
    };
  }) ?? [];

  // Translate staff distribution labels
  const staffData = (data?.charts.staffDistribution ?? []).map(item => {
    const label = (item as any).label || (item as any).name || 'Other';
    // Translate common staff role labels
    const translatedLabel = label === 'Teacher' ? t('staff.roles.teacher') :
                           label === 'Admin' ? t('dashboard.admin') :
                           label === 'Librarian' ? t('staff.roles.librarian') :
                           label === 'Accountant' ? t('staff.roles.accountant') :
                           label === 'Principal' ? t('staff.roles.principal') :
                           label === 'Vice Principal' ? t('staff.roles.vicePrincipal') :
                           label === 'Support Staff' ? t('staff.roles.supportStaff') :
                           label === 'Other' ? t('students.other') :
                           label;
    return {
      name: translatedLabel,
      value: item.value,
    };
  });
  // Use only real data from API, no fallback
  const staffDataFinal = staffData;

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

  const greeting = getGreeting(t);

  const highlightItems = [
    { icon: <SchoolIcon sx={{ fontSize: 18 }} />, label: `${data?.summary.totalStudents ?? 0} ${t('dashboard.students')}`, color: '#4a5568' },
    { icon: <GroupsIcon sx={{ fontSize: 18 }} />, label: `${data?.summary.totalStaff ?? 0} ${t('dashboard.staff')}`, color: '#4a5568' },
    { icon: <PersonAddIcon sx={{ fontSize: 18 }} />, label: `+${data?.summary.newAdmissionsThisMonth ?? 0} ${t('dashboard.newThisMonth')}`, color: '#6b7280' },
    { icon: <MenuBookIcon sx={{ fontSize: 18 }} />, label: `${data?.summary.totalBooks ?? 0} ${t('dashboard.totalBooks')}`, color: '#6b7280' },
    { icon: <EmojiEventsIcon sx={{ fontSize: 18 }} />, label: `${data?.summary.activeEcaActivities ?? 0} ${t('dashboard.ecaActivitiesLabel')}`, color: '#6b7280' },
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
          borderRadius: `${R.lg}px`,
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
            borderRadius: `${R.lg}px ${R.lg}px 0 0`,
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
                color: 'text.primary',
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
                  borderRadius: `${R.sm}px`,
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
                borderRadius: `${R.md}px`,
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
              <AutoGraphIcon sx={{ color: isDark ? '#fff' : '#4a5568', fontSize: 18 }} />
              <Typography sx={{ color: isDark ? '#fff' : '#4a5568', fontWeight: 600, fontSize: '0.8rem' }}>
                {t('dashboard.analytics')}
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
                borderRadius: `${R.sm}px`,
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
                borderRadius: `${R.md}px`,
                overflow: 'hidden',
                position: 'relative',
                background: isDark
                  ? `linear-gradient(145deg, ${alpha(stat.color, 0.18)} 0%, ${alpha(stat.color, 0.06)} 100%)`
                  : `linear-gradient(145deg, ${alpha(stat.color, 0.14)} 0%, ${alpha(stat.color, 0.04)} 100%)`,
                backdropFilter: 'blur(10px) saturate(120%)',
                WebkitBackdropFilter: 'blur(10px) saturate(120%)',
                border: `1px solid ${alpha(stat.color, isDark ? 0.2 : 0.25)}`,
                boxShadow: `0 2px 8px ${alpha(stat.color, 0.1)}`,
                transition: 'all 0.3s ease',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: `linear-gradient(180deg, ${alpha('#ffffff', isDark ? 0.03 : 0.15)} 0%, transparent 100%)`,
                  pointerEvents: 'none',
                  borderRadius: `${R.md}px ${R.md}px 0 0`,
                  zIndex: 1,
                },
                '&:hover': {
                  boxShadow: `0 4px 12px ${alpha(stat.color, 0.15)}`,
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
              <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: `${R.md}px`,
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
                <Button
                  onClick={() => navigate(card.path)}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  sx={{ 
                    mt: 2,
                    color: card.color,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    p: 0,
                    minWidth: 'auto',
                    '&:hover': { 
                      backgroundColor: 'transparent',
                      textDecoration: 'underline' 
                    }
                  }}
                >
                  {t('dashboard.viewDetails')}
                </Button>
              </CardContent>
            </LiquidCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <LiquidCard gradient="#1e40af">
            <CardContent>
              <SectionHeader
                title={t('dashboard.enrollmentTrend')}
                subtitle={t('dashboard.monthlyStudentEnrollment')}
                action={
                  <Chip 
                    icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
                    label={`+12% ${t('dashboard.growthLabel')}`} 
                    size="small"
                    sx={{ bgcolor: alpha('#3b82f6', 0.2), color: '#3b82f6', fontWeight: 600 }} 
                  />
                }
              />
              {enrollmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={enrollmentData}>
                    <defs>
                      <linearGradient id="liquidEnrollGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#1e40af" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} vertical={false} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="students" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fill="url(#liquidEnrollGradient)"
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('reports.noData')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </LiquidCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <LiquidCard gradient="#0c4a6e" sx={{ height: '100%' }}>
            <CardContent>
              <SectionHeader title={t('dashboard.genderDistribution')} subtitle={t('dashboard.studentRatio')} />
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
                <DonutChart data={genderData} colors={['#3b82f6', '#0ea5e9', '#1e293b']} size={180} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                  <Typography variant="body2" fontWeight={600}>
                    {t('students.male')}: {data?.summary.totalMaleStudents || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#0ea5e9' }} />
                  <Typography variant="body2" fontWeight={600}>
                    {t('students.female')}: {data?.summary.totalFemaleStudents || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </LiquidCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <LiquidCard gradient="#1e3a8a">
            <CardContent>
              <SectionHeader title={t('dashboard.classwiseEnrollment')} subtitle={t('dashboard.studentsPerGrade')} />
              {classEnrollmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={classEnrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} vertical={false} />
                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="students" 
                      radius={[8, 8, 4, 4]}
                      animationDuration={1500}
                    >
                      {classEnrollmentData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('reports.noData')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </LiquidCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <LiquidCard gradient="#0c4a6e">
            <CardContent>
              <SectionHeader title={t('dashboard.feeStatus')} subtitle={t('dashboard.paymentOverview')} />
              {feeStatusData.length > 0 ? (
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
                        <Typography variant="body2" fontWeight={600}>
                          {item.name}: {item.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('reports.noData')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </LiquidCard>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={6}>
          <LiquidCard gradient="#1e40af">
            <CardContent>
              <SectionHeader title={t('dashboard.ecaActivities')} subtitle={t('dashboard.participationByCategory')} />
              {activityDistribution.length > 0 ? (
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
              ) : (
                <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('reports.noData')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </LiquidCard>
        </Grid>

        <Grid item xs={12} lg={6}>
          <LiquidCard gradient="#0c4a6e">
            <CardContent>
              <SectionHeader title={t('dashboard.staffDistribution')} subtitle={t('dashboard.byDepartment')} />
              {staffData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={staffData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} horizontal={false} />
                    <XAxis type="number" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
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
              ) : (
                <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('reports.noData')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </LiquidCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <LiquidCard>
            <CardContent>
              <SectionHeader
                title={t('dashboard.recentActivities')}
                subtitle={t('dashboard.latestUpdates')}
                action={<NotificationsIcon sx={{ color: theme.palette.text.secondary }} />}
              />
              <List sx={{ py: 0 }}>
                {recentActivities.map((activity, index) => (
                  <Box key={activity.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            background: alpha(activity.color ?? '#007AFF', 0.15),
                            color: activity.color ?? '#007AFF',
                            width: 44,
                            height: 44,
                            borderRadius: `${R.md}px`,
                            boxShadow: `0 4px 16px ${alpha(activity.color ?? '#007AFF', 0.25)}`,
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
                title={t('dashboard.performanceOverview')}
                subtitle={t('dashboard.keyMetricsGlance')}
                action={<EmojiEventsIcon sx={{ color: '#3b82f6' }} />}
              />
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{t('dashboard.attendanceRate')}</Typography>
                  <Typography variant="body2" fontWeight={700} color="#3b82f6">{data?.summary.attendanceRate ?? 0}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={data?.summary.attendanceRate ?? 0}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: alpha('#3b82f6', 0.15),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, #3b82f6 0%, #1e40af 100%)',
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{t('dashboard.feeCollection')}</Typography>
                  <Typography variant="body2" fontWeight={700} color="#0ea5e9">{data?.summary.feeCollectionRate ?? 0}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={data?.summary.feeCollectionRate ?? 0}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: alpha('#0ea5e9', 0.15),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, #0ea5e9 0%, #0c4a6e 100%)',
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{t('dashboard.libraryCirculation')}</Typography>
                  <Typography variant="body2" fontWeight={700} color="#60a5fa">{reportData?.library?.circulationRate ?? 0}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={reportData?.library?.circulationRate ?? 0}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: alpha('#60a5fa', 0.15),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, #60a5fa 0%, #1e3a8a 100%)',
                    }
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{t('dashboard.ecaParticipation')}</Typography>
                  <Typography variant="body2" fontWeight={700} color="#06b6d4">{reportData?.eca?.participationRate ?? 0}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={reportData?.eca?.participationRate ?? 0}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: alpha('#06b6d4', 0.15),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, #06b6d4 0%, #164e63 100%)',
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
          <LiquidCard gradient="#4a5568">
            <CardContent>
              <SectionHeader
                title={t('dashboard.attendanceTrendTitle')}
                subtitle={t('dashboard.monthlyAttendanceRate')}
                action={
                  <Chip
                    label={`${data?.summary.attendanceRate ?? 0}% avg`}
                    size="small"
                    sx={{ bgcolor: alpha('#3b82f6', 0.15), color: '#3b82f6', fontWeight: 600 }}
                  />
                }
              />
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#1e40af" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} vertical={false} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[60, 100]} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#3b82f6"
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
          <LiquidCard gradient="#1e3a8a" sx={{ height: '100%' }}>
            <CardContent>
              <SectionHeader title={t('dashboard.examPerformanceTitle')} subtitle={t('dashboard.averageScoresBySubject')} />
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={examPerformanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} horizontal={false} />
                  <XAxis type="number" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" radius={[0, 8, 8, 0]} animationDuration={1500} name="Avg Score">
                    {examPerformanceData.map((_: any, index: number) => (
                      <Cell key={`exam-${index}`} fill={['#4a5568', '#6b7280', '#4a5568', '#6b7280', '#8b5a5a'][index % 5]} />
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
          <LiquidCard gradient="#4a5568">
            <CardContent>
              <SectionHeader
                title={t('dashboard.monthlyAdmissions')}
                subtitle={t('dashboard.newStudentEnrollments')}
                action={
                  <Chip
                    icon={<PersonAddIcon sx={{ fontSize: 16 }} />}
                    label={`+${data?.summary.newAdmissionsThisMonth ?? 0} this month`}
                    size="small"
                    sx={{ bgcolor: alpha('#4a5568', 0.15), color: '#4a5568', fontWeight: 600 }}
                  />
                }
              />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={admissionsData}>
                  <defs>
                    <linearGradient id="admissionsBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#1e40af" stopOpacity={0.8}/>
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
          <LiquidCard gradient="#6b7280">
            <CardContent>
              <SectionHeader
                title={t('dashboard.feeCollectionTrend')}
                subtitle={t('dashboard.monthlyCollectionOverview')}
                action={
                  <Chip
                    label={`${data?.summary.feeCollectionRate ?? 0}% collected`}
                    size="small"
                    sx={{ bgcolor: alpha('#0ea5e9', 0.15), color: '#0ea5e9', fontWeight: 600 }}
                  />
                }
              />
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={(data?.charts.feeCollection ?? []).map(item => ({
                  name: item.label,
                  amount: item.value,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} vertical={false} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{ fill: '#0ea5e9', r: 4, strokeWidth: 2, stroke: theme.palette.background.paper }}
                    activeDot={{ r: 6, fill: '#0ea5e9' }}
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
            onClick={() => navigate(`/reports`)}
            sx={{ color: '#667eea', fontWeight: 600 }}
          >
            {t('dashboard.viewAllReports')}
          </Button>
        </Box>
      </MotionBox>
    </MotionBox>
  );
}

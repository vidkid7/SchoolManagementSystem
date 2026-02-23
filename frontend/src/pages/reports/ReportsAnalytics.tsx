import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Alert,
  Snackbar,
  alpha,
  useTheme,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  BarChart,
  Bar,
  Line,
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
  ComposedChart,
  RadialBarChart,
  RadialBar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  Download,
  FilterList,
  Refresh,
  Assessment,
  People,
  School,
  AttachMoney,
  CheckCircle,
  LibraryBooks,
  SportsScore,
  NavigateNext,
  TrendingUp,
  Analytics,
  CalendarMonth,
  Print,
  FileCopy,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { apiClient } from '../../services/apiClient';
import { useNepaliNumbers } from '../../hooks/useNepaliNumbers';

const MotionCard = motion.create(Card);

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

const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const GRADIENT_COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

const TAB_ICONS = [
  <People key="enrollment" />,
  <CheckCircle key="attendance" />,
  <AttachMoney key="fee" />,
  <Assessment key="exam" />,
  <LibraryBooks key="library" />,
  <SportsScore key="sports" />,
];

const GRADIENTS = {
  enrollment: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  attendance: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  fee: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  exam: 'linear-gradient(135deg, #614385 0%, #516395 100%)',
  library: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
  sports: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
};

interface EnrollmentData {
  totalStudents: number;
  byClass: Array<{ class: number; section: string; count: number }>;
  byGender: Array<{ gender: string; count: number }>;
  byShift: Array<{ shift: string; count: number }>;
}

interface AttendanceData {
  averageAttendance: number;
  byDate: Array<{ date: string; presentCount: number; absentCount: number; lateCount: number }>;
}

interface FeeData {
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
  byDate: Array<{ date: string; amount: number }>;
  byClass: Array<{ class: number; collected: number; pending: number }>;
}

interface ExamData {
  averageMarks: number;
  averageGPA: number;
  passRate: number;
  gradeDistribution: Array<{ grade: string; count: number; percentage: number }>;
}

interface LibraryData {
  totalBooks: number;
  totalIssued: number;
  totalReturned: number;
  overdueBooks: number;
}

interface ECAData {
  totalActivities: number;
  totalParticipants: number;
  byActivity: Array<{ activityName: string; participantCount: number }>;
}

interface SportsData {
  totalSports: number;
  totalParticipants: number;
  bySport: Array<{ sportName: string; participantCount: number }>;
}

  const ReportsAnalytics: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { formatNumber, formatWithSeparators, formatPercentage } = useNepaliNumbers();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    classId: '',
    section: '',
  });

  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [libraryData, setLibraryData] = useState<LibraryData | null>(null);
  const [ecaData, setEcaData] = useState<ECAData | null>(null);
  const [sportsData, setSportsData] = useState<SportsData | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [enrollmentRes, attendanceRes, feeRes, examRes, libraryRes, ecaRes, sportsRes] = await Promise.allSettled([
        apiClient.get('/api/v1/reports/enrollment'),
        apiClient.get('/api/v1/reports/attendance', { params: { startDate: '2024-01-01', endDate: '2024-12-31' } }),
        apiClient.get('/api/v1/reports/fee-collection', { params: { startDate: '2024-01-01', endDate: '2024-12-31' } }),
        apiClient.get('/api/v1/reports/examination'),
        apiClient.get('/api/v1/reports/library', { params: { startDate: '2024-01-01', endDate: '2024-12-31' } }),
        apiClient.get('/api/v1/reports/eca'),
        apiClient.get('/api/v1/reports/sports'),
      ]);

      if (enrollmentRes.status === 'fulfilled' && enrollmentRes.value.data.success) {
        setEnrollmentData(enrollmentRes.value.data.data);
      }
      if (attendanceRes.status === 'fulfilled' && attendanceRes.value.data.success) {
        setAttendanceData(attendanceRes.value.data.data);
      }
      if (feeRes.status === 'fulfilled' && feeRes.value.data.success) {
        setFeeData(feeRes.value.data.data);
      }
      if (examRes.status === 'fulfilled' && examRes.value.data.success) {
        setExamData(examRes.value.data.data);
      }
      if (libraryRes.status === 'fulfilled' && libraryRes.value.data.success) {
        setLibraryData(libraryRes.value.data.data);
      }
      if (ecaRes.status === 'fulfilled' && ecaRes.value.data.success) {
        setEcaData(ecaRes.value.data.data);
      }
      if (sportsRes.status === 'fulfilled' && sportsRes.value.data.success) {
        setSportsData(sportsRes.value.data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleExport = async (reportType: string, format: 'pdf' | 'excel') => {
    setExporting(reportType);
    try {
      const response = await apiClient.get(`/api/v1/reports/export/${format}/${reportType}`, {
        params: filters,
        responseType: 'blob',
      });
      
      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = reportType === 'fee-collection' ? 'fee-collection' : reportType;
      link.setAttribute('download', `${fileName}-report.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSnackbar({ open: true, message: `${format.toUpperCase()} exported successfully!`, severity: 'success' });
    } catch (error: any) {
      console.error('Export failed:', error);
      let errorMessage = 'Failed to export report';
      if (error.response?.status === 401) {
        errorMessage = 'Please login to export reports';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to export this report';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setExporting(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Function to translate chart labels from backend
  const translateChartLabel = (label: string): string => {
    // Only translate if language is Nepali
    if (i18n.language !== 'ne') {
      return label; // Return original label for English
    }
    
    const translationMap: Record<string, string> = {
      'January': t('dashboard.jan'),
      'February': t('dashboard.feb'),
      'March': t('dashboard.mar'),
      'April': t('dashboard.apr'),
      'May': t('dashboard.may'),
      'June': t('dashboard.jun'),
      'July': t('dashboard.jul'),
      'August': t('dashboard.aug'),
      'September': t('dashboard.sep'),
      'October': t('dashboard.oct'),
      'November': t('dashboard.nov'),
      'December': t('dashboard.dec'),
      'Jan': t('dashboard.jan'),
      'Feb': t('dashboard.feb'),
      'Mar': t('dashboard.mar'),
      'Apr': t('dashboard.apr'),
      'Jun': t('dashboard.jun'),
      'Jul': t('dashboard.jul'),
      'Aug': t('dashboard.aug'),
      'Sep': t('dashboard.sep'),
      'Oct': t('dashboard.oct'),
      'Nov': t('dashboard.nov'),
      'Dec': t('dashboard.dec'),
    };
    return translationMap[label] || label;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, boxShadow: 3, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600}>{label}</Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" component="div" sx={{ color: entry.color }}>
              {entry.name}: {formatWithSeparators(entry.value || 0)}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const enrollmentChartData = useMemo(() => {
    return enrollmentData?.byClass?.map((item: any) => ({
      name: `${t('reports.class')} ${item.class}`,
      students: item.count,
      fill: COLORS[item.class % COLORS.length],
    })) || [];
  }, [enrollmentData, i18n.language, t]);

  const genderChartData = useMemo(() => {
    return enrollmentData?.byGender?.map((item: any) => ({
      name: item.gender === 'male' ? t('dashboard.male') : item.gender === 'female' ? t('dashboard.female') : t('dashboard.other'),
      value: item.count,
    })) || [];
  }, [enrollmentData, i18n.language, t]);

  const attendanceChartData = useMemo(() => {
    return attendanceData?.byDate?.slice(-12).map((item: any) => ({
      date: translateChartLabel(new Date(item.date).toLocaleDateString('en-US', { month: 'short' })),
      present: item.presentCount,
      absent: item.absentCount,
      late: item.lateCount,
    })) || [];
  }, [attendanceData, i18n.language]);

  const feeChartData = useMemo(() => {
    return feeData?.byDate?.map((item: any) => ({
      date: translateChartLabel(new Date(item.date).toLocaleDateString('en-US', { month: 'short' })),
      collected: item.amount / 1000,
    })) || [];
  }, [feeData, i18n.language]);

  const gradeChartData = examData?.gradeDistribution?.map((item: any) => ({
    grade: item.grade,
    students: item.count,
    fill: item.percentage >= 20 ? '#10b981' : item.percentage >= 10 ? '#f59e0b' : '#ef4444',
  })) || [];

  const libraryTreemapData = useMemo(() => [
    { name: t('reports.science'), size: libraryData ? Math.max(libraryData.totalIssued * 0.3, 50) : 120 },
    { name: t('reports.mathematics'), size: libraryData ? Math.max(libraryData.totalIssued * 0.25, 40) : 100 },
    { name: t('reports.english'), size: libraryData ? Math.max(libraryData.totalIssued * 0.2, 30) : 80 },
    { name: t('reports.nepali'), size: libraryData ? Math.max(libraryData.totalIssued * 0.15, 25) : 60 },
    { name: t('reports.history'), size: libraryData ? Math.max(libraryData.totalIssued * 0.1, 20) : 40 },
  ], [libraryData, t, i18n.language]);

  const ecaChartData = ecaData?.byActivity?.map((item: any, index: number) => ({
    activity: item.activityName,
    participants: item.participantCount,
    fill: COLORS[index % COLORS.length],
  })) || [];

  const sportsChartData = sportsData?.bySport?.map((item: any, index: number) => ({
    sport: item.sportName,
    participants: item.participantCount,
    fill: GRADIENT_COLORS[index % GRADIENT_COLORS.length],
  })) || [];

  // Default ECA data with translations
  const defaultEcaData = useMemo(() => [
    { activity: t('reports.art'), participants: 85, fill: '#667eea' },
    { activity: t('reports.music'), participants: 62, fill: '#764ba2' },
    { activity: t('reports.dance'), participants: 48, fill: '#f093fb' },
    { activity: t('reports.scout'), participants: 35, fill: '#f5576c' },
    { activity: t('reports.coding'), participants: 72, fill: '#10b981' },
  ], [t, i18n.language]);

  // Default Sports data with translations
  const defaultSportsData = useMemo(() => [
    { sport: t('reports.football'), participants: 120 },
    { sport: t('reports.basketball'), participants: 85 },
    { sport: t('reports.volleyball'), participants: 65 },
    { sport: t('reports.cricket'), participants: 45 },
    { sport: t('reports.other'), participants: 30 },
  ], [t, i18n.language]);

  const radarData = useMemo(() => [
    { subject: t('reports.math'), A: examData?.averageMarks || 75, fullMark: 100 },
    { subject: t('reports.science'), A: (examData?.averageMarks || 72) - 5, fullMark: 100 },
    { subject: t('reports.english'), A: (examData?.averageMarks || 78) - 8, fullMark: 100 },
    { subject: t('reports.nepali'), A: (examData?.averageMarks || 80) - 10, fullMark: 100 },
    { subject: t('reports.social'), A: (examData?.averageMarks || 70) - 5, fullMark: 100 },
    { subject: t('reports.computer'), A: (examData?.averageMarks || 85) - 15, fullMark: 100 },
  ], [examData, t, i18n.language]);

  const radialData = useMemo(() => [
    { name: t('reports.collected'), value: feeData?.collectionRate || 75, fill: '#10b981' },
    { name: t('reports.pending'), value: 100 - (feeData?.collectionRate || 75), fill: '#e5e7eb' },
  ], [feeData, t, i18n.language]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const tabGradients = [GRADIENTS.enrollment, GRADIENTS.attendance, GRADIENTS.fee, GRADIENTS.exam, GRADIENTS.library, GRADIENTS.sports];

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }} key={i18n.language}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            sx={{ mb: 1, '& .MuiBreadcrumbs-separator': { color: 'text.secondary' } }}
          >
            <Link underline="hover" color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Analytics fontSize="small" />
              {t('menu.dashboard')}
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Assessment fontSize="small" />
              {t('reports.title')}
            </Typography>
          </Breadcrumbs>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em', background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t('reports.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t('reports.comprehensiveAnalytics')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button 
                variant="outlined" 
                startIcon={<Print />}
                sx={{ 
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.05) }
                }}
              >
                {t('reports.print')}
              </Button>
              <Button 
                variant="outlined" 
                startIcon={loading ? <CircularProgress size={18} /> : <Refresh />}
                onClick={fetchAllData}
                disabled={loading}
                sx={{ 
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.05) }
                }}
              >
                {t('reports.refresh')}
              </Button>
            </Box>
          </Box>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Paper 
          elevation={0}
          sx={{ 
            mb: 3, 
            p: 2.5,
            borderRadius: 4,
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`,
            background: theme.palette.mode === 'dark' 
              ? 'rgba(28,28,30,0.6)' 
              : 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterList sx={{ color: theme.palette.primary.main }} />
            <Typography variant="subtitle1" fontWeight={600}>
              {t('reports.filtersDateRange')}
            </Typography>
            <Chip label={t('reports.active')} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', ml: 'auto' }} />
          </Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('reports.startDate')}
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('reports.endDate')}
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                  }
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                select
                label={t('reports.class')}
                value={filters.classId}
                onChange={(e) => handleFilterChange('classId', e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                  }
                }}
              >
                <MenuItem value="">{t('reports.all')}</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
                  <MenuItem key={c} value={c}>{t('reports.class')} {c}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                select
                label={t('reports.section')}
                value={filters.section}
                onChange={(e) => handleFilterChange('section', e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                  }
                }}
              >
                <MenuItem value="">{t('reports.all')}</MenuItem>
                {['A', 'B', 'C', 'D'].map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button 
                fullWidth 
                variant="contained" 
                startIcon={<FilterList />}
                onClick={fetchAllData}
                sx={{ 
                  borderRadius: 2,
                  py: 1,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                  }
                }}
              >
                {t('reports.applyFilters')}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 4,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`,
          background: theme.palette.mode === 'dark' 
            ? 'rgba(28,28,30,0.6)' 
            : 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        }}
      >
        <Box 
          sx={{ 
            px: 2,
            pt: 2,
            pb: 0,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`
              : `linear-gradient(135deg, ${alpha('#fff', 0.9)} 0%, ${alpha('#f8f9fa', 0.9)} 100%)`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable" 
            scrollButtons="auto"
            TabIndicatorProps={{
              sx: {
                height: 3,
                borderRadius: '3px 3px 0 0',
                background: tabGradients[tabValue],
              }
            }}
            sx={{
              '& .MuiTab-root': {
                minHeight: 52,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: 'text.secondary',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                }
              },
              '& .MuiTab-iconWrapper': {
                mr: 1,
                fontSize: '1.1rem',
              }
            }}
          >
            <Tab 
              icon={TAB_ICONS[0]} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('reports.enrollment')}
                  <Chip label={formatNumber(enrollmentData?.totalStudents || 0)} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha('#667eea', 0.15), color: '#667eea' }} />
                </Box>
              } 
            />
            <Tab 
              icon={TAB_ICONS[1]} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('reports.attendance')}
                  <Chip label={`${formatPercentage(attendanceData?.averageAttendance || 0)}`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha('#10b981', 0.15), color: '#10b981' }} />
                </Box>
              } 
            />
            <Tab 
              icon={TAB_ICONS[2]} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('reports.feeCollection')}
                  <Chip label={`${formatPercentage(feeData?.collectionRate || 0)}`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha('#f59e0b', 0.15), color: '#f59e0b' }} />
                </Box>
              } 
            />
            <Tab 
              icon={TAB_ICONS[3]} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('reports.examination')}
                  <Chip label={`${formatPercentage(examData?.passRate || 0)}`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha('#8b5cf6', 0.15), color: '#8b5cf6' }} />
                </Box>
              } 
            />
            <Tab 
              icon={TAB_ICONS[4]} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('reports.library')}
                  <Chip label={formatNumber(libraryData?.totalBooks || 0)} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha('#06b6d4', 0.15), color: '#06b6d4' }} />
                </Box>
              } 
            />
            <Tab 
              icon={TAB_ICONS[5]} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('reports.ecaSports')}
                  <Chip label={formatNumber((ecaData?.totalActivities || 0) + (sportsData?.totalSports || 0))} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha('#ec4899', 0.15), color: '#ec4899' }} />
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* ENROLLMENT TAB */}
        <TabPanel value={tabValue} index={0}>
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People sx={{ color: '#667eea' }} />
                {t('reports.enrollment')} {t('reports.overview')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={exporting === 'enrollment' ? <CircularProgress size={16} /> : <FileCopy />} 
                  onClick={() => handleExport('enrollment', 'pdf')}
                  disabled={exporting === 'enrollment'}
                  sx={{ borderRadius: 2, borderColor: alpha('#667eea', 0.3), color: '#667eea', '&:hover': { borderColor: '#667eea', bgcolor: alpha('#667eea', 0.05) } }}
                >
                  {t('reports.pdf')}
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={exporting === 'enrollment' ? <CircularProgress size={16} /> : <Download />} 
                  onClick={() => handleExport('enrollment', 'excel')}
                  disabled={exporting === 'enrollment'}
                  sx={{ borderRadius: 2, borderColor: alpha('#10b981', 0.3), color: '#10b981', '&:hover': { borderColor: '#10b981', bgcolor: alpha('#10b981', 0.05) } }}
                >
                  {t('reports.excel')}
                </Button>
              </Box>
            </Box>
            <Grid container spacing={3}>
              {/* Summary Cards */}
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    background: GRADIENTS.enrollment, 
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -30,
                      left: -30,
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                      <People sx={{ fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>{t('reports.totalStudentsCount')}</Typography>
                    </Box>
                    <Typography variant="h3" fontWeight={800}>{formatWithSeparators(enrollmentData?.totalStudents || 0)}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <TrendingUp sx={{ fontSize: 16 }} />
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>+12% from last year</Typography>
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    background: GRADIENTS.attendance, 
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                      <School sx={{ fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>{t('reports.activeClasses')}</Typography>
                    </Box>
                    <Typography variant="h3" fontWeight={800}>{formatNumber(enrollmentData?.byClass?.length || 0)}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <TrendingUp sx={{ fontSize: 16 }} />
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>{t('reports.currentlyRunning')}</Typography>
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    background: GRADIENTS.fee, 
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                      <People sx={{ fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>{t('reports.averagePerClass')}</Typography>
                    </Box>
                    <Typography variant="h3" fontWeight={800}>
                      {formatNumber(enrollmentData?.byClass?.length ? Math.round(enrollmentData.totalStudents / enrollmentData.byClass.length) : 0)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <TrendingUp sx={{ fontSize: 16 }} />
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>{t('reports.studentsPerClass')}</Typography>
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Bar Chart - Enrollment by Class */}
              <Grid item xs={12} lg={8}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha('#667eea', 0.15)}`,
                      borderColor: alpha('#667eea', 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <School sx={{ color: '#667eea', fontSize: 20 }} />
                      {t('reports.enrollmentByClass')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={enrollmentChartData}>
                        <defs>
                          <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#667eea" stopOpacity={1} />
                            <stop offset="95%" stopColor="#667eea" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} opacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="students" name={t('reports.students')} radius={[8, 8, 0, 0]} animationDuration={1500} fill="url(#enrollmentGradient)">
                          {enrollmentChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Pie Chart - Gender Distribution */}
              <Grid item xs={12} lg={4}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha('#ec4899', 0.15)}`,
                      borderColor: alpha('#ec4899', 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People sx={{ color: '#ec4899', fontSize: 20 }} />
                      {t('dashboard.genderDistribution')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={genderChartData.length ? genderChartData : [{ name: t('dashboard.male'), value: 52 }, { name: t('dashboard.female'), value: 45 }, { name: t('dashboard.other'), value: 3 }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${formatPercentage(Math.round(percent * 100))}`}
                        >
                          {genderChartData.length ? genderChartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          )) : [
                            <Cell key="1" fill="#3b82f6" />,
                            <Cell key="2" fill="#ec4899" />,
                            <Cell key="3" fill="#8b5cf6" />,
                          ]}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </MotionCard>
              </Grid>
            </Grid>
          </motion.div>
        </TabPanel>

        {/* ATTENDANCE TAB */}
        <TabPanel value={tabValue} index={1}>
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: '#10b981' }} />
                {t('reports.attendance')} {t('reports.overview')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<FileCopy />} onClick={() => handleExport('attendance', 'pdf')} sx={{ borderRadius: 2, borderColor: alpha('#10b981', 0.3), color: '#10b981', '&:hover': { borderColor: '#10b981', bgcolor: alpha('#10b981', 0.05) } }}>
                  {t('reports.pdf')}
                </Button>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleExport('attendance', 'excel')} sx={{ borderRadius: 2, borderColor: alpha('#10b981', 0.3), color: '#10b981', '&:hover': { borderColor: '#10b981', bgcolor: alpha('#10b981', 0.05) } }}>
                  {t('reports.excel')}
                </Button>
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    bgcolor: '#10b981', 
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                      <CheckCircle sx={{ fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>{t('reports.averageAttendance')}</Typography>
                    </Box>
                    <Typography variant="h3" fontWeight={800}>{formatPercentage(attendanceData?.averageAttendance || 0)}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <TrendingUp sx={{ fontSize: 16 }} />
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>+5% improvement</Typography>
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} md={8}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha('#10b981', 0.15)}`,
                      borderColor: alpha('#10b981', 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth sx={{ color: '#10b981', fontSize: 20 }} />
                      {t('reports.attendanceTrend')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={attendanceChartData.length ? attendanceChartData : [
                        { date: t('dashboard.jan'), present: 85, absent: 10, late: 5 },
                        { date: t('dashboard.feb'), present: 88, absent: 8, late: 4 },
                        { date: t('dashboard.mar'), present: 82, absent: 12, late: 6 },
                        { date: t('dashboard.apr'), present: 90, absent: 6, late: 4 },
                        { date: t('dashboard.may'), present: 87, absent: 8, late: 5 },
                        { date: t('dashboard.jun'), present: 92, absent: 5, late: 3 },
                      ]}>
                        <defs>
                          <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} opacity={0.5} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="present" name={t('reports.present')} stroke="#10b981" fill="url(#presentGradient)" stackId="1" />
                        <Area type="monotone" dataKey="late" name={t('reports.late')} stroke="#f59e0b" fill="#f59e0b" stackId="2" />
                        <Area type="monotone" dataKey="absent" name={t('reports.absent')} stroke="#ef4444" fill="#ef4444" stackId="3" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </MotionCard>
              </Grid>
            </Grid>
          </motion.div>
        </TabPanel>

        {/* FEE COLLECTION TAB */}
        <TabPanel value={tabValue} index={2}>
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney sx={{ color: '#f59e0b' }} />
                {t('reports.feeCollection')} {t('reports.overview')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<FileCopy />} onClick={() => handleExport('fee-collection', 'pdf')} sx={{ borderRadius: 2, borderColor: alpha('#f59e0b', 0.3), color: '#f59e0b', '&:hover': { borderColor: '#f59e0b', bgcolor: alpha('#f59e0b', 0.05) } }}>
                  {t('reports.pdf')}
                </Button>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleExport('fee-collection', 'excel')} sx={{ borderRadius: 2, borderColor: alpha('#f59e0b', 0.3), color: '#f59e0b', '&:hover': { borderColor: '#f59e0b', bgcolor: alpha('#f59e0b', 0.05) } }}>
                  {t('reports.excel')}
                </Button>
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    bgcolor: '#667eea', 
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                      <AttachMoney sx={{ fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>{t('reports.totalExpected')}</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight={800}>{t('common.currency')} {formatWithSeparators(feeData?.totalExpected || 0)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    bgcolor: '#10b981', 
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                      <CheckCircle sx={{ fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>{t('reports.totalCollected')}</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight={800}>{t('common.currency')} {formatWithSeparators(feeData?.totalCollected || 0)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    bgcolor: '#f59e0b', 
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                      <CalendarMonth sx={{ fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>{t('reports.totalPending')}</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight={800}>{t('common.currency')} {formatWithSeparators(feeData?.totalPending || 0)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Radial Bar Chart */}
              <Grid item xs={12} md={6}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha('#10b981', 0.15)}`,
                      borderColor: alpha('#10b981', 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ color: '#10b981', fontSize: 20 }} />
                      {t('reports.collectionRate')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadialBarChart innerRadius="30%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                        <RadialBar background dataKey="value" cornerRadius={10} label={{ position: 'insideStart', fill: '#fff', fontSize: 24, fontWeight: 'bold' }} />
                        <Legend iconSize={8} layout="vertical" verticalAlign="middle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Composed Chart */}
              <Grid item xs={12} md={6}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha('#667eea', 0.15)}`,
                      borderColor: alpha('#667eea', 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney sx={{ color: '#667eea', fontSize: 20 }} />
                      {t('reports.feeCollectionTrend')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={feeChartData.length ? feeChartData : [
                        { date: t('dashboard.jan'), collected: 450 },
                        { date: t('dashboard.feb'), collected: 480 },
                        { date: t('dashboard.mar'), collected: 520 },
                        { date: t('dashboard.apr'), collected: 550 },
                        { date: t('dashboard.may'), collected: 580 },
                        { date: t('dashboard.jun'), collected: 620 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} opacity={0.5} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="collected" name={t('reports.collected') + ' (K)'} fill="#667eea" stroke="#667eea" fillOpacity={0.3} />
                        <Bar dataKey="collected" name={t('reports.amount')} barSize={20} fill="#10b981" radius={[4, 4, 0, 0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </MotionCard>
              </Grid>
            </Grid>
          </motion.div>
        </TabPanel>

        {/* EXAMINATION TAB */}
        <TabPanel value={tabValue} index={3}>
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Assessment sx={{ color: '#8b5cf6' }} />
                {t('reports.examination')} {t('reports.overview')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<FileCopy />} onClick={() => handleExport('examination', 'pdf')} sx={{ borderRadius: 2, borderColor: alpha('#8b5cf6', 0.3), color: '#8b5cf6', '&:hover': { borderColor: '#8b5cf6', bgcolor: alpha('#8b5cf6', 0.05) } }}>
                  {t('reports.pdf')}
                </Button>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleExport('examination', 'excel')} sx={{ borderRadius: 2, borderColor: alpha('#8b5cf6', 0.3), color: '#8b5cf6', '&:hover': { borderColor: '#8b5cf6', bgcolor: alpha('#8b5cf6', 0.05) } }}>
                  {t('reports.excel')}
                </Button>
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    bgcolor: '#3b82f6', 
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                      <Assessment sx={{ fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>{t('reports.averageMarks')}</Typography>
                    </Box>
                    <Typography variant="h3" fontWeight={800}>{formatNumber(examData?.averageMarks || 0)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    bgcolor: '#8b5cf6', 
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                      <School sx={{ fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>{t('reports.averageGPA')}</Typography>
                    </Box>
                    <Typography variant="h3" fontWeight={800}>{formatNumber((examData?.averageGPA || 0).toFixed(1))}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    bgcolor: '#10b981', 
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, opacity: 0.9 }}>
                      <CheckCircle sx={{ fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>{t('reports.passRate')}</Typography>
                    </Box>
                    <Typography variant="h3" fontWeight={800}>{formatPercentage(examData?.passRate || 0)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Radar Chart */}
              <Grid item xs={12} md={6}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha('#8b5cf6', 0.15)}`,
                      borderColor: alpha('#8b5cf6', 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assessment sx={{ color: '#8b5cf6', fontSize: 20 }} />
                      {t('reports.subjectPerformance')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name={t('reports.marks')} dataKey="A" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Bar Chart - Grade Distribution */}
              <Grid item xs={12} md={6}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha('#10b981', 0.15)}`,
                      borderColor: alpha('#10b981', 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <School sx={{ color: '#10b981', fontSize: 20 }} />
                      {t('dashboard.gradeDistribution')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={gradeChartData.length ? gradeChartData : [
                        { grade: 'A+', students: 25, fill: '#10b981' },
                        { grade: 'A', students: 40, fill: '#10b981' },
                        { grade: 'B+', students: 35, fill: '#10b981' },
                        { grade: 'B', students: 30, fill: '#f59e0b' },
                        { grade: 'C+', students: 20, fill: '#f59e0b' },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} opacity={0.5} />
                        <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="students" name={t('reports.students')} radius={[4, 4, 0, 0]}>
                          {gradeChartData.length ? gradeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          )) : [
                            <Cell key="1" fill="#10b981" />,
                            <Cell key="2" fill="#10b981" />,
                            <Cell key="3" fill="#10b981" />,
                            <Cell key="4" fill="#f59e0b" />,
                            <Cell key="5" fill="#f59e0b" />,
                          ]}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </MotionCard>
              </Grid>
            </Grid>
          </motion.div>
        </TabPanel>

        {/* LIBRARY TAB */}
        <TabPanel value={tabValue} index={4}>
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LibraryBooks sx={{ color: '#06b6d4' }} />
                {t('reports.library')} {t('reports.overview')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<FileCopy />} onClick={() => handleExport('library', 'pdf')} sx={{ borderRadius: 2, borderColor: alpha('#06b6d4', 0.3), color: '#06b6d4', '&:hover': { borderColor: '#06b6d4', bgcolor: alpha('#06b6d4', 0.05) } }}>
                  {t('reports.pdf')}
                </Button>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleExport('library', 'excel')} sx={{ borderRadius: 2, borderColor: alpha('#06b6d4', 0.3), color: '#06b6d4', '&:hover': { borderColor: '#06b6d4', bgcolor: alpha('#06b6d4', 0.05) } }}>
                  {t('reports.excel')}
                </Button>
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha('#3b82f6', 0.15)}`,
                      borderColor: alpha('#3b82f6', 0.3),
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#3b82f6', 0.1), display: 'inline-flex', mb: 2 }}>
                      <LibraryBooks sx={{ fontSize: 28, color: '#3b82f6' }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>{t('reports.totalBooks')}</Typography>
                    <Typography variant="h3" fontWeight={800} color="primary">{formatWithSeparators(libraryData?.totalBooks || 3456)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha('#06b6d4', 0.15)}`,
                      borderColor: alpha('#06b6d4', 0.3),
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#06b6d4', 0.1), display: 'inline-flex', mb: 2 }}>
                      <School sx={{ fontSize: 28, color: '#06b6d4' }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>{t('reports.booksIssued')}</Typography>
                    <Typography variant="h3" fontWeight={800} color="info.main">{formatNumber(libraryData?.totalIssued || 495)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha('#10b981', 0.15)}`,
                      borderColor: alpha('#10b981', 0.3),
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#10b981', 0.1), display: 'inline-flex', mb: 2 }}>
                      <CheckCircle sx={{ fontSize: 28, color: '#10b981' }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>{t('reports.returned')}</Typography>
                    <Typography variant="h3" fontWeight={800} color="success.main">{formatNumber(libraryData?.totalReturned || 480)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha('#ef4444', 0.15)}`,
                      borderColor: alpha('#ef4444', 0.3),
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#ef4444', 0.1), display: 'inline-flex', mb: 2 }}>
                      <CalendarMonth sx={{ fontSize: 28, color: '#ef4444' }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>{t('reports.overdue')}</Typography>
                    <Typography variant="h3" fontWeight={800} color="error.main">{formatNumber(libraryData?.overdueBooks || 15)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Book Categories Bar Chart */}
              <Grid item xs={12} lg={6}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha('#667eea', 0.15)}`,
                      borderColor: alpha('#667eea', 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LibraryBooks sx={{ color: '#667eea', fontSize: 20 }} />
                      {t('reports.bookCategories')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={libraryTreemapData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} opacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="size" name={t('reports.books')} radius={[8, 8, 0, 0]}>
                          {libraryTreemapData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Line Area Chart */}
              <Grid item xs={12} lg={6}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha('#10b981', 0.15)}`,
                      borderColor: alpha('#10b981', 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ color: '#10b981', fontSize: 20 }} />
                      {t('reports.monthlyCirculation')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={[
                        { month: t('dashboard.jan'), issued: 120, returned: 115 },
                        { month: t('dashboard.feb'), issued: 145, returned: 140 },
                        { month: t('dashboard.mar'), issued: 132, returned: 128 },
                        { month: t('dashboard.apr'), issued: 98, returned: 95 },
                        { month: t('dashboard.may'), issued: 125, returned: 120 },
                        { month: t('dashboard.jun'), issued: 110, returned: 108 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} opacity={0.5} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="issued" name={t('reports.issued')} fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.3} />
                        <Line type="monotone" dataKey="returned" name={t('reports.returned')} stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </MotionCard>
              </Grid>
            </Grid>
          </motion.div>
        </TabPanel>

        {/* ECA & SPORTS TAB */}
        <TabPanel value={tabValue} index={5}>
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SportsScore sx={{ color: '#ec4899' }} />
                {t('reports.ecaSports')} {t('reports.overview')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<FileCopy />} onClick={() => handleExport('eca', 'pdf')} sx={{ borderRadius: 2, borderColor: alpha('#ec4899', 0.3), color: '#ec4899', '&:hover': { borderColor: '#ec4899', bgcolor: alpha('#ec4899', 0.05) } }}>
                  {t('reports.pdf')}
                </Button>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleExport('eca', 'excel')} sx={{ borderRadius: 2, borderColor: alpha('#ec4899', 0.3), color: '#ec4899', '&:hover': { borderColor: '#ec4899', bgcolor: alpha('#ec4899', 0.05) } }}>
                  {t('reports.excel')}
                </Button>
              </Box>
            </Box>
            <Grid container spacing={3}>
              {/* ECA Section */}
              <Grid item xs={12} lg={6}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha('#667eea', 0.15)}`,
                      borderColor: alpha('#667eea', 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People sx={{ color: '#667eea', fontSize: 20 }} />
                        {t('reports.ecaSports')}
                      </Typography>
                      <Chip label={`${formatNumber(ecaData?.totalActivities || 15)} ${t('reports.activities')}`} sx={{ bgcolor: alpha('#667eea', 0.1), color: '#667eea', fontWeight: 600 }} />
                    </Box>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ecaChartData.length ? ecaChartData : defaultEcaData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} opacity={0.5} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <YAxis dataKey="activity" type="category" width={60} axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="participants" name={t('reports.participants')} radius={[0, 4, 4, 0]}>
                          {ecaChartData.length ? ecaChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          )) : [
                            <Cell key="1" fill="#667eea" />,
                            <Cell key="2" fill="#764ba2" />,
                            <Cell key="3" fill="#f093fb" />,
                            <Cell key="4" fill="#f5576c" />,
                            <Cell key="5" fill="#10b981" />,
                          ]}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Sports Section */}
              <Grid item xs={12} lg={6}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha('#f59e0b', 0.15)}`,
                      borderColor: alpha('#f59e0b', 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SportsScore sx={{ color: '#f59e0b', fontSize: 20 }} />
                        {t('reports.sports')}
                      </Typography>
                      <Chip label={`${formatNumber(sportsData?.totalParticipants || 345)} ${t('reports.participants')}`} sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', fontWeight: 600 }} />
                    </Box>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={sportsChartData.length ? sportsChartData : defaultSportsData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="participants"
                          nameKey="sport"
                          label={({ sport, percent }) => `${sport} ${formatPercentage(Math.round(percent * 100))}`}
                        >
                          {(sportsChartData.length ? sportsChartData : [
                            { fill: '#667eea' },
                            { fill: '#10b981' },
                            { fill: '#f59e0b' },
                            { fill: '#ef4444' },
                            { fill: '#8b5cf6' },
                          ]).map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={_entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Summary */}
              <Grid item xs={12}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    background: `linear-gradient(135deg, ${alpha('#667eea', 0.05)} 0%, ${alpha('#ec4899', 0.05)} 100%)`,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Analytics sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                      {t('reports.summary')}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 2.5, bgcolor: alpha('#667eea', 0.1), borderRadius: 3, textAlign: 'center', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', bgcolor: alpha('#667eea', 0.15) } }}>
                          <Typography variant="h4" fontWeight={800} color="primary">{formatNumber(ecaData?.totalActivities || 15)}</Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>{t('reports.ecaActivities')}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 2.5, bgcolor: alpha('#10b981', 0.1), borderRadius: 3, textAlign: 'center', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', bgcolor: alpha('#10b981', 0.15) } }}>
                          <Typography variant="h4" fontWeight={800} color="success.main">{formatNumber(ecaData?.totalParticipants || 302)}</Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>{t('reports.ecaParticipants')}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 2.5, bgcolor: alpha('#f59e0b', 0.1), borderRadius: 3, textAlign: 'center', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', bgcolor: alpha('#f59e0b', 0.15) } }}>
                          <Typography variant="h4" fontWeight={800} color="warning.main">{formatNumber(sportsData?.totalSports || 8)}</Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>{t('reports.sportsActivities')}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 2.5, bgcolor: alpha('#ec4899', 0.1), borderRadius: 3, textAlign: 'center', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', bgcolor: alpha('#ec4899', 0.15) } }}>
                          <Typography variant="h4" fontWeight={800} color="secondary.main">{formatNumber(sportsData?.totalParticipants || 345)}</Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>{t('reports.sportsParticipants')}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </MotionCard>
              </Grid>
            </Grid>
          </motion.div>
        </TabPanel>
      </Paper>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ReportsAnalytics;

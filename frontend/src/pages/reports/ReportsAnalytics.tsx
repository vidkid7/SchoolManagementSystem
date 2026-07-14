import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
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
import { C, useAdminStyles, R } from '../../theme/designTokens';
import type { RootState } from '../../store';

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

const COLORS = [C.primary, C.purple, C.success, C.warning, C.danger, C.info, '#6f5f46', '#7c4d8a'];
const GRADIENT_COLORS = [C.primary, C.warning, C.info, C.danger];

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
  <School key="teacherPerf" />,
];

const GRADIENTS = {
  enrollment: 'linear-gradient(135deg, #0b7d69 0%, #3157a6 100%)',
  attendance: 'linear-gradient(135deg, #16835f 0%, #1689a7 100%)',
  fee: 'linear-gradient(135deg, #d89016 0%, #d85b45 100%)',
  exam: 'linear-gradient(135deg, #3157a6 0%, #0b7d69 100%)',
  library: 'linear-gradient(135deg, #1689a7 0%, #7c4d8a 100%)',
  sports: 'linear-gradient(135deg, #d89016 0%, #d85b45 100%)',
};

const REPORT_TABS = [
  { color: C.primary, gradient: GRADIENTS.enrollment },
  { color: C.success, gradient: GRADIENTS.attendance },
  { color: C.warning, gradient: GRADIENTS.fee },
  { color: C.purple, gradient: GRADIENTS.exam },
  { color: C.info, gradient: GRADIENTS.library },
  { color: C.danger, gradient: GRADIENTS.sports },
  { color: '#7c4d8a', gradient: 'linear-gradient(135deg, #7c4d8a 0%, #1689a7 100%)' },
] as const;

type ReportKey = 'enrollment' | 'attendance' | 'fee' | 'exam' | 'library' | 'eca' | 'sports' | 'teacher';

const REPORT_ROLE_ACCESS: Record<ReportKey, string[]> = {
  enrollment: ['school_admin', 'class_teacher', 'department_head', 'accountant'],
  attendance: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head', 'accountant'],
  fee: ['school_admin', 'accountant'],
  exam: ['school_admin', 'class_teacher', 'subject_teacher', 'department_head', 'accountant'],
  library: ['school_admin', 'librarian', 'accountant'],
  eca: ['school_admin', 'eca_coordinator', 'department_head', 'accountant'],
  sports: ['school_admin', 'sports_coordinator', 'department_head', 'accountant'],
  teacher: ['school_admin', 'department_head', 'accountant'],
};

const REPORT_TYPE_TO_KEY: Record<string, ReportKey> = {
  enrollment: 'enrollment',
  attendance: 'attendance',
  'fee-collection': 'fee',
  examination: 'exam',
  library: 'library',
  eca: 'eca',
  sports: 'sports',
  'teacher-performance': 'teacher',
};

function normalizeRole(role?: string): string {
  return (role ?? '').replace(/([a-z])([A-Z])/g, '$1_$2').replace(/-/g, '_').toLowerCase();
}

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

interface TeacherPerformanceData {
  teacherId: number;
  teacherName: string;
  attendanceRate?: number;
  totalClasses?: number;
  classesAttended?: number;
  syllabusCompletion?: number;
  subjects?: unknown[];
}

  const ReportsAnalytics: React.FC = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { formatNumber, formatWithSeparators, formatPercentage } = useNepaliNumbers();
  const { user } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    classId: '',
    section: '',
    teacherId: '',
  });

  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [libraryData, setLibraryData] = useState<LibraryData | null>(null);
  const [ecaData, setEcaData] = useState<ECAData | null>(null);
  const [sportsData, setSportsData] = useState<SportsData | null>(null);
  const [teacherPerformanceData, setTeacherPerformanceData] = useState<TeacherPerformanceData | null>(null);
  const normalizedRole = normalizeRole(user?.role);
  const canExportReports = ['school_admin', 'department_head', 'accountant'].includes(normalizedRole);
  const allowedReports = useMemo(() => {
    const allowed = new Set<ReportKey>();
    (Object.entries(REPORT_ROLE_ACCESS) as Array<[ReportKey, string[]]>).forEach(([key, roles]) => {
      if (roles.includes(normalizedRole)) {
        allowed.add(key);
      }
    });
    return allowed;
  }, [normalizedRole]);

  // Print functionality
  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    fetchAllData();
  }, [allowedReports]);

  const getDateRangeParams = () => {
    if (filters.startDate && filters.endDate) {
      return { startDate: filters.startDate, endDate: filters.endDate };
    }

    const now = new Date();
    const startDate = `${now.getFullYear()}-01-01`;
    const endDate = `${now.getFullYear()}-12-31`;
    return { startDate, endDate };
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const dateRangeParams = getDateRangeParams();
      const teacherParams = filters.teacherId ? { teacherId: filters.teacherId } : {};

      const fetchReport = async <T,>(
        key: ReportKey,
        request: () => Promise<{ data: { success?: boolean; data: T } }>,
        setter: (data: T | null) => void
      ) => {
        if (!allowedReports.has(key)) {
          setter(null);
          return;
        }

        const response = await request();
        if (response.data.success) {
          setter(response.data.data);
        }
      };

      await Promise.all([
        fetchReport('enrollment', () => apiClient.get('/api/v1/reports/enrollment'), setEnrollmentData),
        fetchReport('attendance', () => apiClient.get('/api/v1/reports/attendance', { params: dateRangeParams }), setAttendanceData),
        fetchReport('fee', () => apiClient.get('/api/v1/reports/fee-collection', { params: dateRangeParams }), setFeeData),
        fetchReport('exam', () => apiClient.get('/api/v1/reports/examination'), setExamData),
        fetchReport('library', () => apiClient.get('/api/v1/reports/library', { params: dateRangeParams }), setLibraryData),
        fetchReport('eca', () => apiClient.get('/api/v1/reports/eca'), setEcaData),
        fetchReport('sports', () => apiClient.get('/api/v1/reports/sports'), setSportsData),
        fetchReport('teacher', () => apiClient.get('/api/v1/reports/teacher-performance', { params: teacherParams }), setTeacherPerformanceData),
      ]);
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
    const reportKey = REPORT_TYPE_TO_KEY[reportType];
    if (!canExportReports || (reportKey && !allowedReports.has(reportKey))) {
      setSnackbar({ open: true, message: t('reports.noPermission'), severity: 'error' });
      return;
    }

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
      
      setSnackbar({ open: true, message: t('reports.exportSuccess'), severity: 'success' });
    } catch (error: any) {
      console.error('Export failed:', error);
      let errorMessage = t('reports.exportFailed');
      if (error.response?.status === 401) {
        errorMessage = t('reports.loginRequired');
      } else if (error.response?.status === 403) {
        errorMessage = t('reports.noPermission');
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
        <Paper sx={{ ...S.GLASS, p: 2 }}>
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
    fill: item.percentage >= 20 ? C.neutral : item.percentage >= 10 ? C.neutral : C.danger,
  })) || [];

  const libraryTreemapData = useMemo(() => {
    if (!libraryData?.totalIssued) return [];
    return [
      { name: t('reports.science'), size: Math.max(libraryData.totalIssued * 0.3, 1) },
      { name: t('reports.mathematics'), size: Math.max(libraryData.totalIssued * 0.25, 1) },
      { name: t('reports.english'), size: Math.max(libraryData.totalIssued * 0.2, 1) },
      { name: t('reports.nepali'), size: Math.max(libraryData.totalIssued * 0.15, 1) },
      { name: t('reports.history'), size: Math.max(libraryData.totalIssued * 0.1, 1) },
    ];
  }, [libraryData, t, i18n.language]);

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

  const radarData = useMemo(() => {
    if (!examData?.averageMarks) return [];
    return [
      { subject: t('reports.math'), A: examData.averageMarks, fullMark: 100 },
      { subject: t('reports.science'), A: examData.averageMarks - 5, fullMark: 100 },
      { subject: t('reports.english'), A: examData.averageMarks - 8, fullMark: 100 },
      { subject: t('reports.nepali'), A: examData.averageMarks - 10, fullMark: 100 },
      { subject: t('reports.social'), A: examData.averageMarks - 5, fullMark: 100 },
      { subject: t('reports.computer'), A: examData.averageMarks - 15, fullMark: 100 },
    ];
  }, [examData, t, i18n.language]);

  const radialData = useMemo(() => {
    if (!feeData?.collectionRate) return [];
    return [
      { name: t('reports.collected'), value: feeData.collectionRate, fill: C.warning },
      { name: t('reports.pending'), value: 100 - feeData.collectionRate, fill: '#e5e7eb' },
    ];
  }, [feeData, t, i18n.language]);

  const activeReportTone = REPORT_TABS[tabValue] ?? REPORT_TABS[0];
  const reportHighlights = [
    {
      label: t('reports.enrollment'),
      value: formatWithSeparators(enrollmentData?.totalStudents || 0),
      helper: t('reports.totalStudentsCount'),
      color: C.primary,
    },
    {
      label: t('reports.attendance'),
      value: formatPercentage(attendanceData?.averageAttendance || 0),
      helper: t('reports.averageAttendance'),
      color: C.success,
    },
    {
      label: t('reports.feeCollection'),
      value: formatPercentage(feeData?.collectionRate || 0),
      helper: t('reports.collectionRate'),
      color: C.warning,
    },
    {
      label: t('reports.library'),
      value: formatNumber(libraryData?.totalBooks || 0),
      helper: t('reports.totalBooks'),
      color: C.info,
    },
  ];

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

  const tabGradients = REPORT_TABS.map((tab) => tab.gradient);

  return (
    <Container
      maxWidth="xl"
      sx={{ mt: { xs: 1.5, md: 2 }, mb: 4 }}
      key={i18n.language}
      className="print-container reports-analytics-page"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            mb: 2.5,
            p: { xs: 2, md: 3 },
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(10,18,17,0.9) 0%, rgba(18,30,28,0.78) 54%, rgba(49,87,166,0.2) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.86) 0%, rgba(238,245,243,0.78) 58%, rgba(49,87,166,0.12) 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.86)'}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 24px 72px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.08)'
              : '0 24px 72px rgba(30,69,63,0.13), inset 0 1px 0 rgba(255,255,255,0.88)',
            backdropFilter: 'blur(36px) saturate(175%)',
            WebkitBackdropFilter: 'blur(36px) saturate(175%)',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.16)}, transparent 38%, ${alpha(C.warning, 0.12)})`,
              pointerEvents: 'none',
            },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.25fr) minmax(340px, 0.75fr)' }, gap: 3, alignItems: 'stretch' }}>
            <Box>
              <Breadcrumbs
                separator={<NavigateNext fontSize="small" />}
                sx={{
                  mb: 1.25,
                  '& .MuiBreadcrumbs-separator': { color: 'text.secondary' },
                  '& a, & p': { fontSize: '0.78rem', fontWeight: 700 },
                }}
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

              <Chip
                icon={<CalendarMonth sx={{ fontSize: 16 }} />}
                label={`${new Date().getFullYear()} reporting workspace`}
                size="small"
                sx={{
                  mb: 1.5,
                  height: 28,
                  borderRadius: 1,
                  fontWeight: 800,
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                }}
              />
              <Typography
                variant="h3"
                fontWeight={900}
                sx={{
                  maxWidth: 760,
                  fontSize: { xs: '1.85rem', md: '2.45rem' },
                  lineHeight: 1.08,
                  color: 'text.primary',
                }}
              >
                {t('reports.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 720, fontWeight: 500 }}>
                {t('reports.comprehensiveAnalytics')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {[
                  { label: t('reports.enrollment'), color: C.primary },
                  { label: t('reports.attendance'), color: C.success },
                  { label: t('reports.feeCollection'), color: C.warning },
                  { label: t('reports.examination'), color: C.purple },
                ].map((item) => (
                  <Chip
                    key={item.label}
                    label={item.label}
                    size="small"
                    sx={{
                      borderRadius: 1,
                      fontWeight: 800,
                      color: item.color,
                      bgcolor: alpha(item.color, theme.palette.mode === 'dark' ? 0.16 : 0.11),
                      border: `1px solid ${alpha(item.color, 0.22)}`,
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                p: { xs: 1.5, md: 2 },
                borderRadius: 1.5,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.58)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.76)'}`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
              }}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.25 }}>
                {reportHighlights.map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      minWidth: 0,
                      p: 1.35,
                      borderRadius: 1.25,
                      bgcolor: alpha(item.color, theme.palette.mode === 'dark' ? 0.13 : 0.08),
                      border: `1px solid ${alpha(item.color, theme.palette.mode === 'dark' ? 0.24 : 0.18)}`,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 800 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 0.25, fontWeight: 900, color: item.color, lineHeight: 1.1 }}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                      {item.helper}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', sm: 'flex-end' }, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={handlePrint}
                  sx={{
                    ...S.BTN_OUTLINE,
                    borderRadius: 1,
                    borderColor: alpha(theme.palette.primary.main, 0.32),
                    bgcolor: alpha(theme.palette.background.paper, 0.32),
                    '&:hover': { borderColor: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.08) },
                  }}
                >
                  {t('reports.print')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={18} /> : <Refresh />}
                  onClick={fetchAllData}
                  disabled={loading}
                  sx={{
                    borderRadius: 1,
                    fontWeight: 850,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: `0 12px 26px ${alpha(theme.palette.primary.main, 0.24)}`,
                  }}
                >
                  {t('reports.refresh')}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Paper
          elevation={0}
          sx={{
            ...S.GLASS,
            mb: 2.5,
            p: { xs: 1.5, md: 2 },
            borderRadius: 1.5,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(145deg, rgba(15,24,23,0.78), rgba(18,30,28,0.58))'
              : 'linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,255,255,0.5))',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <FilterList sx={{ color: theme.palette.primary.main }} />
            <Typography variant="subtitle1" fontWeight={850}>
              {t('reports.filtersDateRange')}
            </Typography>
            <Chip
              label={t('reports.active')}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                ml: 'auto',
                fontWeight: 800,
                color: C.success,
                bgcolor: alpha(C.success, 0.12),
                border: `1px solid ${alpha(C.success, 0.22)}`,
              }}
            />
          </Box>
          <Grid container spacing={1.5} alignItems="center">
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
                    borderRadius: R.lg,
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
                    borderRadius: R.lg,
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
                    borderRadius: R.lg,
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
                    borderRadius: R.lg,
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
                startIcon={<FilterList />}
                onClick={fetchAllData}
                sx={{ ...S.BTN_PRIMARY, py: 1 }}
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
          ...S.GLASS,
          borderRadius: 1.5,
          overflow: 'hidden',
          border: `1px solid ${alpha(activeReportTone.color, theme.palette.mode === 'dark' ? 0.22 : 0.18)}`,
        }}
      >
        <Box
          sx={{
            px: { xs: 1, md: 1.5 },
            pt: 1.25,
            pb: 0,
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${alpha(activeReportTone.color, 0.12)} 0%, rgba(15,24,23,0.72) 100%)`
              : `linear-gradient(135deg, ${alpha(activeReportTone.color, 0.1)} 0%, rgba(255,255,255,0.7) 100%)`,
            backdropFilter: 'blur(18px) saturate(150%)',
          }}
        >
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="scrollable" 
            scrollButtons="auto"
            TabIndicatorProps={{
              sx: {
                height: 4,
                borderRadius: '4px 4px 0 0',
                background: tabGradients[tabValue],
              }
            }}
            sx={{
              '& .MuiTab-root': {
                minHeight: 56,
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.85rem',
                color: 'text.secondary',
                borderRadius: 1.25,
                mr: 0.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: activeReportTone.color,
                  bgcolor: alpha(activeReportTone.color, theme.palette.mode === 'dark' ? 0.12 : 0.08),
                },
                '&.Mui-selected': {
                  color: activeReportTone.color,
                  bgcolor: alpha(activeReportTone.color, theme.palette.mode === 'dark' ? 0.14 : 0.1),
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
                  <Chip label={formatNumber(enrollmentData?.totalStudents || 0)} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(REPORT_TABS[0].color, 0.14), color: REPORT_TABS[0].color, fontWeight: 800 }} />
                </Box>
              } 
            />
            <Tab 
              icon={TAB_ICONS[1]} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('reports.attendance')}
                  <Chip label={`${formatPercentage(attendanceData?.averageAttendance || 0)}`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(REPORT_TABS[1].color, 0.14), color: REPORT_TABS[1].color, fontWeight: 800 }} />
                </Box>
              } 
            />
            <Tab 
              icon={TAB_ICONS[2]} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('reports.feeCollection')}
                  <Chip label={`${formatPercentage(feeData?.collectionRate || 0)}`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(REPORT_TABS[2].color, 0.14), color: REPORT_TABS[2].color, fontWeight: 800 }} />
                </Box>
              } 
            />
            <Tab 
              icon={TAB_ICONS[3]} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('reports.examination')}
                  <Chip label={`${formatPercentage(examData?.passRate || 0)}`} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(REPORT_TABS[3].color, 0.14), color: REPORT_TABS[3].color, fontWeight: 800 }} />
                </Box>
              } 
            />
            <Tab 
              icon={TAB_ICONS[4]} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('reports.library')}
                  <Chip label={formatNumber(libraryData?.totalBooks || 0)} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(REPORT_TABS[4].color, 0.14), color: REPORT_TABS[4].color, fontWeight: 800 }} />
                </Box>
              } 
            />
            <Tab 
              icon={TAB_ICONS[5]} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('reports.ecaSports')}
                  <Chip label={formatNumber((ecaData?.totalActivities || 0) + (sportsData?.totalSports || 0))} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(C.danger, 0.15), color: C.danger }} />
                </Box>
              } 
            />
            <Tab 
              icon={TAB_ICONS[6]} 
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {t('reports.teacherPerformance') || 'Teacher performance'}
                  {teacherPerformanceData && (
                    <Chip label={formatPercentage(teacherPerformanceData.attendanceRate || 0)} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(REPORT_TABS[6].color, 0.14), color: REPORT_TABS[6].color, fontWeight: 800 }} />
                  )}
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
                <People sx={{ color: C.primary }} />
                {t('reports.enrollment')} {t('reports.overview')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={exporting === 'enrollment' ? <CircularProgress size={16} /> : <FileCopy />} 
                  onClick={() => handleExport('enrollment', 'pdf')}
                  disabled={exporting === 'enrollment'}
                  sx={{ ...S.BTN_OUTLINE,  borderRadius: 1, borderColor: alpha(C.primary, 0.34), color: C.primary, '&:hover': { borderColor: C.primary, bgcolor: alpha(C.primary, 0.08) } }}
                >
                  {t('reports.pdf')}
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={exporting === 'enrollment' ? <CircularProgress size={16} /> : <Download />} 
                  onClick={() => handleExport('enrollment', 'excel')}
                  disabled={exporting === 'enrollment'}
                  sx={{ ...S.BTN_OUTLINE,  borderRadius: 1, borderColor: alpha(C.primary, 0.34), color: C.primary, '&:hover': { borderColor: C.primary, bgcolor: alpha(C.primary, 0.08) } }}
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
                    borderRadius: R.lg,
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
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>{t('reports.yearGrowth')}</Typography>
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
                    borderRadius: R.lg,
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
                    borderRadius: R.lg,
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
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <School sx={{ color: C.neutral, fontSize: 20 }} />
                      {t('reports.enrollmentByClass')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={enrollmentChartData}>
                        <defs>
                          <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C.neutral} stopOpacity={1} />
                            <stop offset="95%" stopColor={C.neutral} stopOpacity={0.6} />
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
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha(C.danger, 0.15)}`,
                      borderColor: alpha(C.danger, 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People sx={{ color: C.danger, fontSize: 20 }} />
                      {t('dashboard.genderDistribution')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      {genderChartData.length > 0 ? (
                        <PieChart>
                          <Pie
                            data={genderChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${formatPercentage(Math.round(percent * 100))}`}
                          >
                            {genderChartData.map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                          <Typography variant="body2" color="text.secondary">{t('reports.noData')}</Typography>
                        </Box>
                      )}
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
                <CheckCircle sx={{ color: C.neutral }} />
                {t('reports.attendance')} {t('reports.overview')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<FileCopy />} onClick={() => handleExport('attendance', 'pdf')} sx={{ ...S.BTN_OUTLINE,  borderRadius: R.lg, borderColor: alpha(C.neutral, 0.3), color: C.neutral, '&:hover': { borderColor: C.neutral, bgcolor: alpha(C.neutral, 0.05) } }}>
                  {t('reports.pdf')}
                </Button>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleExport('attendance', 'excel')} sx={{ ...S.BTN_OUTLINE,  borderRadius: R.lg, borderColor: alpha(C.neutral, 0.3), color: C.neutral, '&:hover': { borderColor: C.neutral, bgcolor: alpha(C.neutral, 0.05) } }}>
                  {t('reports.excel')}
                </Button>
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    bgcolor: C.neutral, 
                    color: 'white',
                    borderRadius: R.lg,
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
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>{t('reports.improvement')}</Typography>
                    </Box>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} md={8}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth sx={{ color: C.neutral, fontSize: 20 }} />
                      {t('reports.attendanceTrend')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      {attendanceChartData.length > 0 ? (
                      <AreaChart data={attendanceChartData}>
                        <defs>
                          <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C.neutral} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={C.neutral} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} opacity={0.5} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="present" name={t('reports.present')} stroke={C.neutral} fill="url(#presentGradient)" stackId="1" />
                        <Area type="monotone" dataKey="late" name={t('reports.late')} stroke={C.neutral} fill={C.neutral} stackId="2" />
                        <Area type="monotone" dataKey="absent" name={t('reports.absent')} stroke={C.danger} fill={C.danger} stackId="3" />
                      </AreaChart>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                          <Typography variant="body2" color="text.secondary">{t('reports.noData')}</Typography>
                        </Box>
                      )}
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
                <AttachMoney sx={{ color: C.neutral }} />
                {t('reports.feeCollection')} {t('reports.overview')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<FileCopy />} onClick={() => handleExport('fee-collection', 'pdf')} sx={{ ...S.BTN_OUTLINE,  borderRadius: R.lg, borderColor: alpha(C.neutral, 0.3), color: C.neutral, '&:hover': { borderColor: C.neutral, bgcolor: alpha(C.neutral, 0.05) } }}>
                  {t('reports.pdf')}
                </Button>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleExport('fee-collection', 'excel')} sx={{ ...S.BTN_OUTLINE,  borderRadius: R.lg, borderColor: alpha(C.neutral, 0.3), color: C.neutral, '&:hover': { borderColor: C.neutral, bgcolor: alpha(C.neutral, 0.05) } }}>
                  {t('reports.excel')}
                </Button>
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    bgcolor: C.neutral, 
                    color: 'white',
                    borderRadius: R.lg,
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
                    bgcolor: C.neutral, 
                    color: 'white',
                    borderRadius: R.lg,
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
                    bgcolor: C.neutral, 
                    color: 'white',
                    borderRadius: R.lg,
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
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ color: C.neutral, fontSize: 20 }} />
                      {t('reports.collectionRate')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      {radialData.length > 0 ? (
                        <RadialBarChart innerRadius="30%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
                          <RadialBar background dataKey="value" cornerRadius={10} label={{ position: 'insideStart', fill: '#fff', fontSize: 24, fontWeight: 'bold' }} />
                          <Legend iconSize={8} layout="vertical" verticalAlign="middle" wrapperStyle={{ paddingTop: '20px' }} />
                          <Tooltip content={<CustomTooltip />} />
                        </RadialBarChart>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                          <Typography variant="body2" color="text.secondary">{t('reports.noData')}</Typography>
                        </Box>
                      )}
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
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney sx={{ color: C.neutral, fontSize: 20 }} />
                      {t('reports.feeCollectionTrend')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      {feeChartData.length > 0 ? (
                      <ComposedChart data={feeChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} opacity={0.5} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="collected" name={t('reports.collected') + ' (K)'} fill={C.neutral} stroke={C.neutral} fillOpacity={0.3} />
                        <Bar dataKey="collected" name={t('reports.amount')} barSize={20} fill={C.neutral} radius={[4, 4, 0, 0]} />
                      </ComposedChart>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                          <Typography variant="body2" color="text.secondary">{t('reports.noData')}</Typography>
                        </Box>
                      )}
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
                <Assessment sx={{ color: C.neutral }} />
                {t('reports.examination')} {t('reports.overview')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<FileCopy />} onClick={() => handleExport('examination', 'pdf')} sx={{ ...S.BTN_OUTLINE,  borderRadius: R.lg, borderColor: alpha(C.neutral, 0.3), color: C.neutral, '&:hover': { borderColor: C.neutral, bgcolor: alpha(C.neutral, 0.05) } }}>
                  {t('reports.pdf')}
                </Button>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleExport('examination', 'excel')} sx={{ ...S.BTN_OUTLINE,  borderRadius: R.lg, borderColor: alpha(C.neutral, 0.3), color: C.neutral, '&:hover': { borderColor: C.neutral, bgcolor: alpha(C.neutral, 0.05) } }}>
                  {t('reports.excel')}
                </Button>
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <MotionCard 
                  variants={itemVariants as any} 
                  sx={{ 
                    bgcolor: C.neutral, 
                    color: 'white',
                    borderRadius: R.lg,
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
                    bgcolor: C.neutral, 
                    color: 'white',
                    borderRadius: R.lg,
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
                    bgcolor: C.neutral, 
                    color: 'white',
                    borderRadius: R.lg,
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
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assessment sx={{ color: C.neutral, fontSize: 20 }} />
                      {t('reports.subjectPerformance')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      {radarData.length > 0 ? (
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name={t('reports.marks')} dataKey="A" stroke={C.neutral} fill={C.neutral} fillOpacity={0.6} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                        </RadarChart>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                          <Typography variant="body2" color="text.secondary">{t('reports.noData')}</Typography>
                        </Box>
                      )}
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
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <School sx={{ color: C.neutral, fontSize: 20 }} />
                      {t('dashboard.gradeDistribution')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      {gradeChartData.length > 0 ? (
                      <BarChart data={gradeChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} opacity={0.5} />
                        <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="students" name={t('reports.students')} radius={[4, 4, 0, 0]}>
                          {gradeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                          <Typography variant="body2" color="text.secondary">{t('reports.noData')}</Typography>
                        </Box>
                      )}
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
                <LibraryBooks sx={{ color: C.neutral }} />
                {t('reports.library')} {t('reports.overview')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<FileCopy />} onClick={() => handleExport('library', 'pdf')} sx={{ ...S.BTN_OUTLINE,  borderRadius: R.lg, borderColor: alpha(C.neutral, 0.3), color: C.neutral, '&:hover': { borderColor: C.neutral, bgcolor: alpha(C.neutral, 0.05) } }}>
                  {t('reports.pdf')}
                </Button>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleExport('library', 'excel')} sx={{ ...S.BTN_OUTLINE,  borderRadius: R.lg, borderColor: alpha(C.neutral, 0.3), color: C.neutral, '&:hover': { borderColor: C.neutral, bgcolor: alpha(C.neutral, 0.05) } }}>
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
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ p: 1.5, borderRadius: R.lg, bgcolor: alpha(C.neutral, 0.1), display: 'inline-flex', mb: 2 }}>
                      <LibraryBooks sx={{ fontSize: 28, color: C.neutral }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>{t('reports.totalBooks')}</Typography>
                    <Typography variant="h3" fontWeight={800} color="primary">{formatWithSeparators(libraryData?.totalBooks || 0)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ p: 1.5, borderRadius: R.lg, bgcolor: alpha(C.neutral, 0.1), display: 'inline-flex', mb: 2 }}>
                      <School sx={{ fontSize: 28, color: C.neutral }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>{t('reports.booksIssued')}</Typography>
                    <Typography variant="h3" fontWeight={800} color="info.main">{formatNumber(libraryData?.totalIssued || 0)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ p: 1.5, borderRadius: R.lg, bgcolor: alpha(C.neutral, 0.1), display: 'inline-flex', mb: 2 }}>
                      <CheckCircle sx={{ fontSize: 28, color: C.neutral }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>{t('reports.returned')}</Typography>
                    <Typography variant="h3" fontWeight={800} color="success.main">{formatNumber(libraryData?.totalReturned || 0)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha(C.danger, 0.15)}`,
                      borderColor: alpha(C.danger, 0.3),
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ p: 1.5, borderRadius: R.lg, bgcolor: alpha(C.danger, 0.1), display: 'inline-flex', mb: 2 }}>
                      <CalendarMonth sx={{ fontSize: 28, color: C.danger }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" fontWeight={500}>{t('reports.overdue')}</Typography>
                    <Typography variant="h3" fontWeight={800} color="error.main">{formatNumber(libraryData?.overdueBooks || 0)}</Typography>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Book Categories Bar Chart */}
              <Grid item xs={12} lg={6}>
                <MotionCard 
                  variants={itemVariants as any}
                  elevation={0}
                  sx={{
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LibraryBooks sx={{ color: C.neutral, fontSize: 20 }} />
                      {t('reports.bookCategories')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      {libraryTreemapData.length > 0 ? (
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
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                          <Typography variant="body2" color="text.secondary">{t('reports.noData')}</Typography>
                        </Box>
                      )}
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
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp sx={{ color: C.neutral, fontSize: 20 }} />
                      {t('reports.monthlyCirculation')}
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                        <Typography variant="body2" color="text.secondary">{t('reports.noData')}</Typography>
                      </Box>
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
                <SportsScore sx={{ color: C.danger }} />
                {t('reports.ecaSports')} {t('reports.overview')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<FileCopy />} onClick={() => handleExport('eca', 'pdf')} sx={{ ...S.BTN_OUTLINE,  borderRadius: R.lg, borderColor: alpha(C.danger, 0.3), color: C.danger, '&:hover': { borderColor: C.danger, bgcolor: alpha(C.danger, 0.05) } }}>
                  {t('reports.pdf')}
                </Button>
                <Button variant="outlined" size="small" startIcon={<Download />} onClick={() => handleExport('eca', 'excel')} sx={{ ...S.BTN_OUTLINE,  borderRadius: R.lg, borderColor: alpha(C.danger, 0.3), color: C.danger, '&:hover': { borderColor: C.danger, bgcolor: alpha(C.danger, 0.05) } }}>
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
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <People sx={{ color: C.neutral, fontSize: 20 }} />
                        {t('reports.ecaSports')}
                      </Typography>
                      <Chip label={`${formatNumber(ecaData?.totalActivities || 0)} ${t('reports.activities')}`} sx={{ bgcolor: alpha(C.neutral, 0.1), color: C.neutral, fontWeight: 600 }} />
                    </Box>
                    <ResponsiveContainer width="100%" height={300}>
                      {ecaChartData.length > 0 ? (
                      <BarChart data={ecaChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} opacity={0.5} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <YAxis dataKey="activity" type="category" width={60} axisLine={false} tickLine={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="participants" name={t('reports.participants')} radius={[0, 4, 4, 0]}>
                          {ecaChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                          <Typography variant="body2" color="text.secondary">{t('reports.noData')}</Typography>
                        </Box>
                      )}
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
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 12px 40px ${alpha(C.neutral, 0.15)}`,
                      borderColor: alpha(C.neutral, 0.3),
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SportsScore sx={{ color: C.neutral, fontSize: 20 }} />
                        {t('reports.sports')}
                      </Typography>
                      <Chip label={`${formatNumber(sportsData?.totalParticipants || 0)} ${t('reports.participants')}`} sx={{ bgcolor: alpha(C.neutral, 0.1), color: C.neutral, fontWeight: 600 }} />
                    </Box>
                    <ResponsiveContainer width="100%" height={300}>
                      {sportsChartData.length > 0 ? (
                      <PieChart>
                        <Pie
                          data={sportsChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="participants"
                          nameKey="sport"
                          label={({ sport, percent }) => `${sport} ${formatPercentage(Math.round(percent * 100))}`}
                        >
                          {sportsChartData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={_entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                          <Typography variant="body2" color="text.secondary">{t('reports.noData')}</Typography>
                        </Box>
                      )}
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
                    borderRadius: R.lg,
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    background: `linear-gradient(135deg, ${alpha(C.neutral, 0.05)} 0%, ${alpha(C.danger, 0.05)} 100%)`,
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Analytics sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                      {t('reports.summary')}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 2.5, bgcolor: alpha(C.neutral, 0.1), borderRadius: R.lg, textAlign: 'center', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', bgcolor: alpha(C.neutral, 0.15) } }}>
                          <Typography variant="h4" fontWeight={800} color="primary">{formatNumber(ecaData?.totalActivities || 0)}</Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>{t('reports.ecaActivities')}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 2.5, bgcolor: alpha(C.neutral, 0.1), borderRadius: R.lg, textAlign: 'center', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', bgcolor: alpha(C.neutral, 0.15) } }}>
                          <Typography variant="h4" fontWeight={800} color="success.main">{formatNumber(ecaData?.totalParticipants || 0)}</Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>{t('reports.ecaParticipants')}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 2.5, bgcolor: alpha(C.neutral, 0.1), borderRadius: R.lg, textAlign: 'center', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', bgcolor: alpha(C.neutral, 0.15) } }}>
                          <Typography variant="h4" fontWeight={800} color="warning.main">{formatNumber(sportsData?.totalSports || 0)}</Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>{t('reports.sportsActivities')}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ p: 2.5, bgcolor: alpha(C.danger, 0.1), borderRadius: R.lg, textAlign: 'center', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', bgcolor: alpha(C.danger, 0.15) } }}>
                          <Typography variant="h4" fontWeight={800} color="secondary.main">{formatNumber(sportsData?.totalParticipants || 0)}</Typography>
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

        {/* TEACHER PERFORMANCE TAB */}
        <TabPanel value={tabValue} index={6}>
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School sx={{ color: C.neutral }} />
                {t('reports.teacherPerformance') || 'Teacher performance'} {t('reports.overview')}
              </Typography>
              <TextField
                size="small"
                label={t('reports.teacherId')}
                value={filters.teacherId}
                onChange={(e) => handleFilterChange('teacherId', e.target.value)}
                placeholder="1"
                sx={{ width: 120 }}
              />
              <Button variant="outlined" sx={S.BTN_OUTLINE} size="small" startIcon={<Refresh />} onClick={fetchAllData}>{t('reports.refresh')}</Button>
            </Box>
            {teacherPerformanceData ? (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{ borderRadius: R.lg, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">{t('reports.teacher') || 'Teacher'}</Typography>
                      <Typography variant="h6" fontWeight={700}>{teacherPerformanceData.teacherName}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{ borderRadius: R.lg, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">{t('reports.attendanceRate') || 'Attendance rate'}</Typography>
                      <Typography variant="h5" fontWeight={700} color="primary">{formatPercentage(teacherPerformanceData.attendanceRate ?? 0)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{ borderRadius: R.lg, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">{t('reports.classesAttended') || 'Classes attended'}</Typography>
                      <Typography variant="h5" fontWeight={700}>{teacherPerformanceData.classesAttended ?? 0} / {teacherPerformanceData.totalClasses ?? 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                  <Card sx={{ borderRadius: R.lg, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">{t('reports.syllabusCompletion') || 'Syllabus completion'}</Typography>
                      <Typography variant="h5" fontWeight={700} color="success.main">{formatPercentage(teacherPerformanceData.syllabusCompletion ?? 0)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info">
                {t('reports.teacherPerformanceHint') || 'Enter a Teacher ID and click Refresh to load teacher performance.'}
              </Alert>
            )}
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

// Print-specific styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    
    .print-container, .print-container * {
      visibility: visible;
    }
    
    .print-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    
    /* Hide navigation, filters, and action buttons when printing */
    nav, header, .MuiAppBar-root, .MuiDrawer-root,
    button, .MuiButton-root, .MuiIconButton-root,
    .MuiBreadcrumbs-root, .MuiTabs-root {
      display: none !important;
    }
    
    /* Optimize chart sizes for print */
    .recharts-wrapper {
      width: 100% !important;
      height: auto !important;
    }
    
    /* Remove shadows and borders for cleaner print */
    .MuiPaper-root {
      box-shadow: none !important;
      border: 1px solid #e0e0e0 !important;
    }
    
    /* Ensure proper page breaks */
    .MuiGrid-item {
      page-break-inside: avoid;
    }
    
    /* Adjust colors for print */
    * {
      color-adjust: exact;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

// Inject print styles
if (typeof document !== 'undefined') {
  const styleElement = document.getElementById('print-styles');
  if (!styleElement) {
    const style = document.createElement('style');
    style.id = 'print-styles';
    style.textContent = printStyles;
    document.head.appendChild(style);
  }
}

export default ReportsAnalytics;

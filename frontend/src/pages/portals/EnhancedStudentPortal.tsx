import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import {
  Box,
  Grid,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { apiClient, resolveApiAssetUrl } from '../../services/apiClient';
import type { RootState } from '../../store';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';
import { openFinanceReceipt } from '../finance/financeReceipt';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface StudentPortalRecord {
  id?: number | string;
  studentId?: number;
  studentCode?: string;
  percentage?: number;
  present?: number;
  absent?: number;
  late?: number;
  total?: number;
  pending?: number;
  paid?: number;
  gpa?: number;
  subject?: string;
  subjectName?: string;
  grade?: string;
  marks?: number | string;
  obtainedMarks?: number;
  totalMarks?: number;
  dueDate?: string;
  title?: string;
  name?: string;
  status?: string;
  day?: string;
  dayOfWeek?: string;
  period?: number | string;
  periodNumber?: number;
  time?: string;
  startTime?: string;
  endTime?: string;
  teacher?: string;
  teacherName?: string;
  room?: string;
  roomNumber?: string;
  location?: string;
  certificateType?: string;
  pdfUrl?: string;
  issueDate?: string;
  createdAt?: string;
  bookTitle?: string;
  borrowDate?: string;
  activityName?: string;
  description?: string;
  category?: string;
  academicYear?: string;
  className?: string;
  result?: string;
  remark?: string;
  comment?: string;
  date?: string;
  entries?: StudentPortalRecord[];
  periods?: StudentPortalRecord[];
  timetable?: StudentPortalRecord[];
  schedule?: StudentPortalRecord[];
}

interface StudentPaymentRecord extends StudentPortalRecord {
  paymentId?: number;
  receiptNumber?: string;
  invoiceNumber?: string;
  amount?: number;
  paymentDate?: string;
  paymentMethod?: string;
  status?: string;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={`student-portal-tabpanel-${index}`}
      aria-labelledby={`student-portal-tab-${index}`}
      hidden={value !== index}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const asArray = (value: unknown, keys: string[] = []): StudentPortalRecord[] => {
  if (Array.isArray(value)) return value as StudentPortalRecord[];
  if (typeof value !== 'object' || value === null) return [];
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const nested = record[key];
    if (Array.isArray(nested)) return nested as StudentPortalRecord[];
  }
  return [];
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback;
  const response = (error as { response?: { data?: { message?: unknown } } }).response;
  return typeof response?.data?.message === 'string' ? response.data.message : fallback;
};

export const EnhancedStudentPortal: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { user } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingCV, setDownloadingCV] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [paymentHistoryError, setPaymentHistoryError] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<StudentPaymentRecord[]>([]);

  const [studentId, setStudentId] = useState<number | null>(null);
  const [profile, setProfile] = useState<StudentPortalRecord | null>(null);
  const [attendance, setAttendance] = useState<StudentPortalRecord | null>(null);
  const [grades, setGrades] = useState<StudentPortalRecord[]>([]);
  const [fees, setFees] = useState<StudentPortalRecord | null>(null);
  const [certificates, setCertificates] = useState<StudentPortalRecord[]>([]);
  const [library, setLibrary] = useState<StudentPortalRecord[]>([]);
  const [eca, setECA] = useState<StudentPortalRecord[]>([]);
  const [history, setHistory] = useState<StudentPortalRecord[]>([]);
  const [remarks, setRemarks] = useState<StudentPortalRecord[]>([]);
  const [timetable, setTimetable] = useState<StudentPortalRecord | null>(null);
  const [assignments, setAssignments] = useState<StudentPortalRecord[]>([]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const results = await Promise.allSettled([
        apiClient.get('/api/v1/students/me/attendance/summary'),
        apiClient.get('/api/v1/students/me/grades'),
        apiClient.get('/api/v1/students/me/fees/summary'),
        apiClient.get('/api/v1/students/me/profile'),
        apiClient.get('/api/v1/students/me/timetable'),
        apiClient.get('/api/v1/students/me/assignments'),
      ]);

      const hasFailures = results.some(result => result.status === 'rejected');
      if (hasFailures) {
        setError(t('portal.failedToLoadData'));
      }

      if (results[0].status === 'fulfilled') {
        setAttendance(results[0].value.data.data);
      }
      if (results[1].status === 'fulfilled') {
        setGrades(asArray(results[1].value.data.data, ['grades', 'items', 'rows', 'data']));
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
      if (results[4].status === 'fulfilled') {
        setTimetable(results[4].value.data.data);
      }
      if (results[5].status === 'fulfilled') {
        const assignmentData = results[5].value.data.data;
        setAssignments(asArray(assignmentData, ['assignments', 'items', 'rows', 'data']));
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t('portal.failedToLoadData')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // fetchAllData synchronizes the view with the student APIs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAllData();
  }, [fetchAllData]);

  const fetchCertificates = useCallback(async () => {
    if (!studentId) return;
    try {
      const response = await apiClient.get(`/api/v1/students/${studentId}/certificates`);
      setCertificates(asArray(response.data.data, ['certificates', 'items', 'rows', 'data']));
    } catch {
      setCertificates([]);
      setError(t('portal.failedToLoadData'));
    }
  }, [studentId, t]);

  const fetchLibrary = useCallback(async () => {
    if (!studentId) return;
    try {
      const response = await apiClient.get(`/api/v1/students/${studentId}/library`);
      setLibrary(asArray(response.data.data, ['library', 'books', 'items', 'rows', 'data']));
    } catch {
      setLibrary([]);
      setError(t('portal.failedToLoadData'));
    }
  }, [studentId, t]);

  const fetchECA = useCallback(async () => {
    if (!studentId) return;
    try {
      const response = await apiClient.get(`/api/v1/students/${studentId}/eca`);
      setECA(asArray(response.data.data, ['eca', 'activities', 'items', 'rows', 'data']));
    } catch {
      setECA([]);
      setError(t('portal.failedToLoadData'));
    }
  }, [studentId, t]);

  const fetchHistory = useCallback(async () => {
    if (!studentId) return;
    try {
      const response = await apiClient.get(`/api/v1/students/${studentId}/history`);
      setHistory(asArray(response.data.data, ['history', 'records', 'items', 'rows', 'data']));
    } catch {
      setHistory([]);
      setError(t('portal.failedToLoadData'));
    }
  }, [studentId, t]);

  const fetchRemarks = useCallback(async () => {
    if (!studentId) return;
    try {
      const response = await apiClient.get(`/api/v1/students/${studentId}/remarks`);
      setRemarks(asArray(response.data.data, ['remarks', 'items', 'rows', 'data']));
    } catch {
      setRemarks([]);
      setError(t('portal.failedToLoadData'));
    }
  }, [studentId, t]);

  useEffect(() => {
    if (!studentId) return;
    // Tab-specific requests synchronize remote student records into local view state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tabValue === 5 && certificates.length === 0) void fetchCertificates();
    if (tabValue === 6 && library.length === 0) void fetchLibrary();
    if (tabValue === 7 && eca.length === 0) void fetchECA();
    if (tabValue === 8 && history.length === 0) void fetchHistory();
    if (tabValue === 9 && remarks.length === 0) void fetchRemarks();
  }, [tabValue, studentId, certificates.length, library.length, eca.length, history.length, remarks.length, fetchCertificates, fetchLibrary, fetchECA, fetchHistory, fetchRemarks]);

  const handleDownloadCV = async () => {
    if (!studentId) {
      setError(t('portal.profileNotSetUp'));
      return;
    }
    try {
      setDownloadingCV(true);
      const response = await apiClient.get(`/api/v1/cv/${studentId}/download`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `CV_${studentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      setError(t('portal.failedToLoadData'));
    } finally {
      setDownloadingCV(false);
    }
  };

  const openPaymentHistory = async () => {
    if (!studentId) {
      setError(t('portal.profileNotSetUp'));
      return;
    }
    setPaymentHistoryOpen(true);
    setPaymentHistoryLoading(true);
    setPaymentHistoryError('');
    try {
      const response = await apiClient.get(`/api/v1/finance/payments/student/${studentId}`);
      setPaymentHistory(asArray(response.data?.data, ['payments', 'items', 'rows', 'data']) as StudentPaymentRecord[]);
    } catch {
      setPaymentHistory([]);
      setPaymentHistoryError(t('portal.failedToLoadData'));
    } finally {
      setPaymentHistoryLoading(false);
    }
  };

  const handlePrintReceipt = (payment: StudentPaymentRecord) => {
    openFinanceReceipt({
      title: t('portal.receiptTitle'),
      reference: payment.receiptNumber || payment.invoiceNumber || String(payment.paymentId ?? ''),
      fields: [
        { label: t('portal.receiptAmount'), value: payment.amount ?? '' },
        { label: t('portal.receiptDate'), value: payment.paymentDate ?? '' },
        { label: t('portal.receiptMethod'), value: payment.paymentMethod ?? '' },
        { label: t('portal.receiptStatus'), value: payment.status ?? '' },
      ],
    });
  };

  const attendancePercentage = attendance?.percentage || 0;
  const avgGPA = grades.length > 0
    ? (grades.reduce((sum, grade) => sum + (Number(grade.gpa) || 0), 0) / grades.length).toFixed(2)
    : '0.00';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body2" color="text.secondary">{t('portal.studentPortalLoading')}</Typography>
      </Box>
    );
  }

  const feeAccent = (fees?.pending ?? 0) > 0 ? C.warning : C.success;

  const statCards = [
    {
      title: t('portal.attendance'),
      value: `${attendancePercentage}%`,
      subtitle: `${attendance?.present || 0} / ${attendance?.total || 0} ${t('portal.daysLabel')}`,
      icon: <SchoolIcon sx={{ fontSize: 24 }} />,
      accent: C.primary,
      progress: attendancePercentage,
    },
    {
      title: t('portal.avgGPA'),
      value: avgGPA,
      subtitle: `${grades.length} ${t('portal.subjectsLabel')}`,
      icon: <TrendingUpIcon sx={{ fontSize: 24 }} />,
      accent: C.success,
      progress: (parseFloat(avgGPA) / 4.0) * 100,
    },
    {
      title: t('portal.feePending'),
      value: `${t('common.currency')}. ${(fees?.pending || 0).toLocaleString()}`,
      subtitle: `${t('common.total')}: ${t('common.currency')}. ${(fees?.total || 0).toLocaleString()}`,
      icon: <MoneyIcon sx={{ fontSize: 24 }} />,
      accent: feeAccent,
      progress: fees?.total ? ((fees?.paid || 0) / fees.total) * 100 : 0,
    },
    {
      title: t('portal.certificates'),
      value: `${certificates.length}`,
      subtitle: t('portal.available'),
      icon: <CertificateIcon sx={{ fontSize: 24 }} />,
      accent: C.purple,
      progress: null,
    },
  ];

  const thStyle = {
    bgcolor: S.TH_BG,
    '& th': {
      fontWeight: 700,
      color: theme.palette.text.primary,
      borderBottom: `2px solid ${alpha(C.primary, 0.2)}`,
    },
  };

  return (
    <Box sx={{
      p: { xs: 2, md: 3 },
      mt: { xs: 7, sm: 8 },
      minHeight: '100vh',
      background: S.dark
        ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
    }}>
      {/* Header */}
      <Box sx={{
        ...S.PAGE_HEADER,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{
            width: 56, height: 56,
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.purple} 100%)`,
            fontSize: '1.4rem', fontWeight: 700,
            boxShadow: `0 4px 14px ${alpha(C.primary, 0.4)}`,
          }}>
            {user?.firstName?.[0] || user?.username?.[0] || 'S'}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{
              background: `linear-gradient(135deg, ${C.primary} 0%, ${C.purple} 100%)`,
              backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {t('portal.welcomeUser', { name: user?.firstName || t('portal.studentPortal') })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile?.studentCode ? t('portal.studentCode', { code: profile.studentCode }) : t('portal.studentPortal')}
            </Typography>
          </Box>
        </Box>
        <Tooltip title={t('portal.refreshData')}>
          <IconButton onClick={fetchAllData} sx={S.BTN_PRIMARY}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: R.md }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Box sx={{
              ...S.STAT_CARD(card.accent),
              p: 2.5,
              '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 28px ${alpha(card.accent, 0.18)}` },
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ pl: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color: card.accent, lineHeight: 1.2, mt: 0.5 }}>
                    {card.value}
                  </Typography>
                </Box>
                <Box sx={S.ICON_BOX(card.accent, 44)}>
                  {card.icon}
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', pl: 1 }}>{card.subtitle}</Typography>
              {card.progress !== null && (
                <LinearProgress variant="determinate" value={Math.min(card.progress || 0, 100)} sx={{
                  mt: 1.5, ml: 1, height: 5, borderRadius: R.xs,
                  bgcolor: alpha(card.accent, 0.12),
                  '& .MuiLinearProgress-bar': { borderRadius: R.xs, bgcolor: card.accent },
                }} />
              )}
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Tabs Section */}
      <Box sx={{ ...S.GLASS, overflow: 'hidden' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto" sx={{
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
          '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.875rem', py: 2, minHeight: 56 },
          '& .MuiTabs-indicator': S.TAB_INDICATOR,
          '& .Mui-selected': { color: `${C.primary} !important` },
        }}>
          <Tab id="student-portal-tab-0" aria-controls="student-portal-tabpanel-0" icon={<AssignmentIcon />} iconPosition="start" label={t('portal.grades')} />
          <Tab id="student-portal-tab-1" aria-controls="student-portal-tabpanel-1" icon={<SchoolIcon />} iconPosition="start" label={t('portal.attendance')} />
          <Tab id="student-portal-tab-2" aria-controls="student-portal-tabpanel-2" icon={<ReceiptIcon />} iconPosition="start" label={t('portal.fees')} />
          <Tab id="student-portal-tab-3" aria-controls="student-portal-tabpanel-3" icon={<CalendarIcon />} iconPosition="start" label={t('portal.timetable')} />
          <Tab id="student-portal-tab-4" aria-controls="student-portal-tabpanel-4" icon={<AssignmentIcon />} iconPosition="start" label={t('portal.assignments')} />
          <Tab id="student-portal-tab-5" aria-controls="student-portal-tabpanel-5" icon={<CertificateIcon />} iconPosition="start" label={t('portal.certificates')} />
          <Tab id="student-portal-tab-6" aria-controls="student-portal-tabpanel-6" icon={<BookIcon />} iconPosition="start" label={t('portal.library')} />
          <Tab id="student-portal-tab-7" aria-controls="student-portal-tabpanel-7" icon={<TrophyIcon />} iconPosition="start" label={t('portal.ecaAndSports')} />
          <Tab id="student-portal-tab-8" aria-controls="student-portal-tabpanel-8" icon={<HistoryIcon />} iconPosition="start" label={t('portal.history')} />
          <Tab id="student-portal-tab-9" aria-controls="student-portal-tabpanel-9" icon={<CommentIcon />} iconPosition="start" label={t('common.remarks')} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Grades Tab */}
          <TabPanel value={tabValue} index={0}>
            <TableContainer sx={{ borderRadius: R.md, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={thStyle}>
                    <TableCell>{t('portal.subject')}</TableCell>
                    <TableCell>{t('portal.gradeLabel')}</TableCell>
                    <TableCell>{t('portal.gpa')}</TableCell>
                    <TableCell>{t('portal.marks')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grades.map((item, idx) => (
                    <TableRow key={idx} sx={S.TR_HOVER}>
                      <TableCell sx={{ ...S.TD, fontWeight: 600 }}>{item.subject || item.subjectName}</TableCell>
                      <TableCell sx={S.TD}>
                        <Chip label={item.grade} size="small" sx={S.CHIP(C.primary)} />
                      </TableCell>
                      <TableCell sx={S.TD}>{item.gpa?.toFixed(2)}</TableCell>
                      <TableCell sx={S.TD}>{item.marks || item.obtainedMarks}{item.totalMarks ? `/${item.totalMarks}` : ''}</TableCell>
                    </TableRow>
                  ))}
                  {grades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ ...S.EMPTY_STATE, py: 6 }}>
                        {t('portal.noGradesYet')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
              <Button startIcon={<DownloadIcon />} sx={S.BTN_OUTLINE}
                onClick={() => navigate('/my-certificates')}>
                {t('portal.downloadReportCard')}
              </Button>
              <Button startIcon={<DownloadIcon />} sx={S.BTN_OUTLINE}
                onClick={() => void handleDownloadCV()}
                disabled={!studentId || downloadingCV}>
                {downloadingCV ? t('portal.downloading') : t('portal.downloadCV')}
              </Button>
            </Box>
          </TabPanel>

          {/* Attendance Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ ...S.GLASS_ELEVATED, p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>{t('portal.attendanceSummary')}</Typography>
                  {[
                    { label: t('attendance.present'), value: `${attendance?.present || 0} ${t('portal.daysLabel')}`, color: C.success },
                    { label: t('attendance.absent'), value: `${attendance?.absent || 0} ${t('portal.daysLabel')}`, color: C.danger },
                    { label: t('attendance.late'), value: `${attendance?.late || 0} ${t('portal.daysLabel')}`, color: C.warning },
                    { label: t('common.total'), value: `${attendance?.total || 0} ${t('portal.daysLabel')}`, color: theme.palette.text.primary },
                  ].map((row) => (
                    <Box key={row.label} sx={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      py: 1.5, borderBottom: `1px solid ${S.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    }}>
                      <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: row.color }}>{row.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ ...S.STAT_CARD(C.primary), p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>{t('portal.attendanceRate')}</Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex', my: 2 }}>
                    <CircularProgress variant="determinate" value={100} size={140} thickness={5}
                      sx={{ color: alpha(C.primary, 0.15), position: 'absolute', left: 0 }} />
                    <CircularProgress variant="determinate" value={attendancePercentage} size={140} thickness={5}
                      sx={{ color: C.primary }} />
                    <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <Typography variant="h4" fontWeight={800} sx={{ color: C.primary }}>{attendancePercentage}%</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {attendancePercentage >= 75
                      ? `✅ ${t('portal.goodAttendance')}`
                      : `⚠️ ${t('portal.belowMinAttendance')}`}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Fees Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ ...S.GLASS_ELEVATED, p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>{t('portal.feeSummary')}</Typography>
                  {[
                    { label: t('portal.totalFee'), value: `${t('common.currency')}. ${(fees?.total || 0).toLocaleString()}`, color: theme.palette.text.primary },
                    { label: t('portal.paidLabel'), value: `${t('common.currency')}. ${(fees?.paid || 0).toLocaleString()}`, color: C.success },
                    { label: t('common.pending'), value: `${t('common.currency')}. ${(fees?.pending || 0).toLocaleString()}`, color: (fees?.pending ?? 0) > 0 ? C.danger : C.success },
                  ].map((row) => (
                    <Box key={row.label} sx={{
                      display: 'flex', justifyContent: 'space-between', py: 1.5,
                      borderBottom: `1px solid ${S.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                    }}>
                      <Typography color="text.secondary">{row.label}</Typography>
                      <Typography fontWeight={700} sx={{ color: row.color }}>{row.value}</Typography>
                    </Box>
                  ))}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">{t('portal.paymentProgress')}</Typography>
                    <LinearProgress variant="determinate"
                      value={fees?.total ? Math.min(((fees?.paid || 0) / fees.total) * 100, 100) : 0}
                      sx={{
                        height: 10, borderRadius: R.xs,
                        bgcolor: alpha(C.success, 0.12),
                        '& .MuiLinearProgress-bar': { borderRadius: R.xs, bgcolor: C.success },
                      }} />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ ...S.GLASS_ELEVATED, p: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>{t('portal.paymentActions')}</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button fullWidth sx={S.BTN_PRIMARY} disabled title={t('portal.payOnlineUnavailable')}>
                      {t('portal.payOnline')}
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {t('portal.payOnlineUnavailable')}
                    </Typography>
                    <Button fullWidth sx={S.BTN_OUTLINE} onClick={() => void openPaymentHistory()} disabled={!studentId}>
                      {t('portal.viewPaymentHistory')}
                    </Button>
                    <Button fullWidth startIcon={<DownloadIcon />} sx={S.BTN_OUTLINE} onClick={() => void openPaymentHistory()} disabled={!studentId}>
                      {t('portal.downloadReceipt')}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Timetable Tab */}
          <TabPanel value={tabValue} index={3}>
            {(() => {
              const entries = asArray(timetable, ['entries', 'periods', 'timetable', 'schedule']);
              if (!timetable || entries.length === 0) {
                return (
                  <Box sx={S.EMPTY_STATE}>
                    <CalendarIcon sx={{ fontSize: 64, color: alpha(C.primary, 0.3), mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>{t('portal.noTimetableData')}</Typography>
                    <Typography variant="body2" color="text.secondary">{t('portal.timetableWillAppear')}</Typography>
                    <Button sx={{ ...S.BTN_PRIMARY, mt: 3 }}
                      onClick={() => navigate('/calendar')}>
                      {t('portal.viewSchoolCalendar')}
                    </Button>
                  </Box>
                );
              }
              return (
                <TableContainer sx={{ borderRadius: R.md, overflow: 'hidden' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={thStyle}>
                        <TableCell>{t('portal.dayLabel')}</TableCell>
                        <TableCell>{t('portal.period')}</TableCell>
                        <TableCell>{t('portal.subject')}</TableCell>
                        <TableCell>{t('portal.time')}</TableCell>
                        <TableCell>{t('portal.teacherLabel')}</TableCell>
                        <TableCell>{t('portal.room')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entries.map((entry, idx) => (
                        <TableRow key={idx} sx={S.TR_HOVER}>
                          <TableCell sx={{ ...S.TD, fontWeight: 600 }}>{entry.day || entry.dayOfWeek || '—'}</TableCell>
                          <TableCell sx={S.TD}>{entry.period || entry.periodNumber || idx + 1}</TableCell>
                          <TableCell sx={S.TD}>{entry.subject || entry.subjectName || '—'}</TableCell>
                          <TableCell sx={S.TD}>{entry.time || (entry.startTime && entry.endTime ? `${entry.startTime} - ${entry.endTime}` : '—')}</TableCell>
                          <TableCell sx={S.TD}>{entry.teacher || entry.teacherName || '—'}</TableCell>
                          <TableCell sx={S.TD}>{entry.room || entry.roomNumber || entry.location || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}
          </TabPanel>

          {/* Assignments Tab */}
          <TabPanel value={tabValue} index={4}>
            <TableContainer sx={{ borderRadius: R.md, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={thStyle}>
                    <TableCell>{t('portal.titleLabel')}</TableCell>
                    <TableCell>{t('portal.subject')}</TableCell>
                    <TableCell>{t('portal.dueDateLabel')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell>{t('portal.totalMarks')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((item, idx) => (
                    <TableRow key={idx} sx={S.TR_HOVER}>
                      <TableCell sx={{ ...S.TD, fontWeight: 600 }}>{item.title || item.name || '—'}</TableCell>
                      <TableCell sx={S.TD}>{item.subject || item.subjectName || '—'}</TableCell>
                      <TableCell sx={S.TD}>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell sx={S.TD}>
                        <Chip label={item.status || t('common.pending').toLowerCase()} size="small" sx={
                          item.status === 'submitted' || item.status === 'completed'
                            ? S.CHIP(C.success)
                            : item.status === 'overdue' ? S.CHIP(C.danger) : S.CHIP(C.warning)
                        } />
                      </TableCell>
                      <TableCell sx={S.TD}>{item.totalMarks || item.marks || '—'}</TableCell>
                    </TableRow>
                  ))}
                  {assignments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ ...S.EMPTY_STATE, py: 6 }}>
                        {t('portal.noAssignments')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Certificates Tab */}
          <TabPanel value={tabValue} index={5}>
            {!studentId ? (
              <Alert severity="info" sx={{ borderRadius: R.md }}>{t('portal.profileNotSetUp')}</Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {certificates.map((cert, idx) => (
                  <ListItem key={idx} sx={{
                    mb: 1.5, ...S.GLASS,
                    '&:hover': { transform: 'translateX(4px)' }, transition: 'transform 0.2s',
                  }}>
                    <ListItemIcon>
                      <Box sx={S.ICON_BOX(C.info, 40)}>
                        <CertificateIcon fontSize="small" />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight={600}>{cert.name || cert.certificateType}</Typography>}
                      secondary={`${t('portal.issuedLabel')}: ${cert.issueDate || cert.createdAt}`}
                    />
                    <IconButton size="small" aria-label={t('common.view')} sx={{ ...S.BTN_ICON, mr: 1 }} onClick={() => navigate('/my-certificates')}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label={t('portal.downloadCertificate')}
                      sx={S.BTN_ICON}
                      disabled={!cert.pdfUrl}
                      onClick={() => cert.pdfUrl && window.open(resolveApiAssetUrl(cert.pdfUrl), '_blank', 'noopener,noreferrer')}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </ListItem>
                ))}
                {certificates.length === 0 && (
                  <Box sx={S.EMPTY_STATE}>
                    <CertificateIcon sx={{ fontSize: 64, color: alpha(C.primary, 0.3), mb: 2 }} />
                    <Typography color="text.secondary">{t('portal.noCertificates')}</Typography>
                  </Box>
                )}
              </List>
            )}
          </TabPanel>

          {/* Library Tab */}
          <TabPanel value={tabValue} index={6}>
            {!studentId ? (
              <Alert severity="info" sx={{ borderRadius: R.md }}>{t('portal.profileNotSetUp')}</Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {library.map((book, idx) => (
                  <ListItem key={idx} sx={{ mb: 1.5, ...S.GLASS }}>
                    <ListItemIcon>
                      <Box sx={S.ICON_BOX(C.success, 40)}>
                        <BookIcon fontSize="small" />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight={600}>{book.bookTitle || book.title}</Typography>}
                      secondary={`${t('portal.borrowed')}: ${book.borrowDate} | ${t('portal.dueLabel')}: ${book.dueDate}`}
                    />
                    <Chip label={book.status || t('portal.borrowed')} size="small"
                      sx={book.status === 'returned' ? S.CHIP(C.success) : S.CHIP(C.warning)} />
                  </ListItem>
                ))}
                {library.length === 0 && (
                  <Box sx={S.EMPTY_STATE}>
                    <BookIcon sx={{ fontSize: 64, color: alpha(C.primary, 0.3), mb: 2 }} />
                    <Typography color="text.secondary">{t('portal.noBooksFound')}</Typography>
                  </Box>
                )}
              </List>
            )}
          </TabPanel>

          {/* ECA & Sports Tab */}
          <TabPanel value={tabValue} index={7}>
            {!studentId ? (
              <Alert severity="info" sx={{ borderRadius: R.md }}>{t('portal.profileNotSetUp')}</Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {eca.map((activity, idx) => (
                  <ListItem key={idx} sx={{ mb: 1.5, ...S.GLASS }}>
                    <ListItemIcon>
                      <Box sx={S.ICON_BOX(C.purple, 40)}>
                        <TrophyIcon fontSize="small" />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight={600}>{activity.name || activity.activityName}</Typography>}
                      secondary={activity.description || activity.category}
                    />
                    <Chip label={activity.status || t('common.active')} size="small"
                      sx={S.CHIP(activity.status === 'inactive' ? C.neutral : C.success)} />
                  </ListItem>
                ))}
                {eca.length === 0 && (
                  <Box sx={S.EMPTY_STATE}>
                    <TrophyIcon sx={{ fontSize: 64, color: alpha(C.primary, 0.3), mb: 2 }} />
                    <Typography color="text.secondary">{t('portal.noEca')}</Typography>
                  </Box>
                )}
              </List>
            )}
          </TabPanel>

          {/* History Tab */}
          <TabPanel value={tabValue} index={8}>
            {!studentId ? (
              <Alert severity="info" sx={{ borderRadius: R.md }}>{t('portal.profileNotSetUp')}</Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {history.map((record, idx) => (
                  <ListItem key={idx} sx={{ mb: 1.5, ...S.GLASS }}>
                    <ListItemIcon>
                      <Box sx={S.ICON_BOX(C.primary, 40)}>
                        <HistoryIcon fontSize="small" />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight={600}>{record.academicYear} {'—'} {t('portal.classLabel')} {record.className}</Typography>}
                      secondary={`${t('portal.resultLabel')}: ${record.result || 'N/A'}`}
                    />
                  </ListItem>
                ))}
                {history.length === 0 && (
                  <Box sx={S.EMPTY_STATE}>
                    <HistoryIcon sx={{ fontSize: 64, color: alpha(C.primary, 0.3), mb: 2 }} />
                    <Typography color="text.secondary">{t('portal.noAcademicHistory')}</Typography>
                  </Box>
                )}
              </List>
            )}
          </TabPanel>

          {/* Remarks Tab */}
          <TabPanel value={tabValue} index={9}>
            {!studentId ? (
              <Alert severity="info" sx={{ borderRadius: R.md }}>{t('portal.profileNotSetUp')}</Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {remarks.map((remark, idx) => (
                  <ListItem key={idx} sx={{ mb: 1.5, ...S.GLASS, alignItems: 'flex-start' }}>
                    <ListItemIcon sx={{ mt: 1 }}>
                      <Avatar sx={{
                        width: 36, height: 36,
                        background: `linear-gradient(135deg, ${C.success} 0%, ${C.primary} 100%)`,
                        fontSize: '0.875rem', fontWeight: 700,
                      }}>
                        {remark.teacherName?.[0] || 'T'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight={600}>{remark.remark || remark.comment}</Typography>}
                      secondary={t('portal.remarkBy', { teacher: remark.teacherName, date: remark.date })}
                    />
                  </ListItem>
                ))}
                {remarks.length === 0 && (
                  <Box sx={S.EMPTY_STATE}>
                    <CommentIcon sx={{ fontSize: 64, color: alpha(C.primary, 0.3), mb: 2 }} />
                    <Typography color="text.secondary">{t('portal.noRemarksYet')}</Typography>
                  </Box>
                )}
              </List>
            )}
          </TabPanel>
        </Box>
      </Box>
      <Dialog open={paymentHistoryOpen} onClose={() => setPaymentHistoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('portal.paymentHistoryTitle')}</DialogTitle>
        <DialogContent dividers>
          {paymentHistoryError ? (
            <Alert severity="error">{paymentHistoryError}</Alert>
          ) : paymentHistoryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>
          ) : paymentHistory.length === 0 ? (
            <Typography color="text.secondary">{t('portal.noPaymentHistory')}</Typography>
          ) : (
            <List>
              {paymentHistory.map((payment, index) => (
                <ListItem key={payment.paymentId ?? index} divider>
                  <ListItemText
                    primary={`${t('portal.receiptAmount')}: ${t('common.currency')}. ${Number(payment.amount || 0).toLocaleString()}`}
                    secondary={`${payment.receiptNumber || payment.invoiceNumber || ''} · ${payment.paymentDate || '—'} · ${payment.paymentMethod || '—'} · ${payment.status || '—'}`}
                  />
                  <Button size="small" startIcon={<DownloadIcon />} onClick={() => handlePrintReceipt(payment)}>
                    {t('portal.downloadReceipt')}
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentHistoryOpen(false)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedStudentPortal;

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
  Divider,
  Avatar,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import { C, useAdminStyles } from '../../theme/designTokens';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  EventNote as EventIcon,
  Receipt as ReceiptIcon,
  EmojiEvents as TrophyIcon,
  MenuBook as BookIcon,
  CalendarMonth as CalendarIcon,
  Notifications as NotificationIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { useTranslation } from 'react-i18next';

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

interface DashboardData {
  attendance: { present: number; total: number; percentage: number } | null;
  grades: Array<{ subject: string; grade: string; gpa: number }>;
  fees: { paid: number; pending: number; total: number } | null;
  assignments: Array<{ title: string; subject: string; dueDate: string; status: string }>;
  notices: Array<{ id: number; title: string; date: string }>;
  timetable: Array<{ period: number; subject: string; teacher: string; time: string }>;
}

const StudentPortal: React.FC = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState<DashboardData>({
    attendance: null,
    grades: [],
    fees: null,
    assignments: [],
    notices: [],
    timetable: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const S = useAdminStyles(theme);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [attendanceRes, gradesRes, feesRes, assignmentsRes, noticesRes, timetableRes] = await Promise.allSettled([
          apiClient.get('/api/v1/students/me/attendance/summary'),
          apiClient.get('/api/v1/students/me/grades'),
          apiClient.get('/api/v1/students/me/fees/summary'),
          apiClient.get('/api/v1/students/me/assignments'),
          apiClient.get('/api/v1/announcements'),
          apiClient.get('/api/v1/students/me/timetable'),
        ]);

        setData({
          attendance: attendanceRes.status === 'fulfilled' ? attendanceRes.value.data?.data : null,
          grades: gradesRes.status === 'fulfilled' ? (gradesRes.value.data?.data || []) : [],
          fees: feesRes.status === 'fulfilled' ? feesRes.value.data?.data : null,
          assignments: assignmentsRes.status === 'fulfilled' ? (assignmentsRes.value.data?.data || []) : [],
          notices: noticesRes.status === 'fulfilled' ? (noticesRes.value.data?.data || []) : [],
          timetable: timetableRes.status === 'fulfilled' ? (timetableRes.value.data?.data || []) : [],
        });
      } catch {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const attendancePct = data.attendance?.percentage ?? 0;
  const attendanceColor = attendancePct >= 75 ? 'success' : 'error';
  const avgGpa = data.grades.length > 0
    ? (data.grades.reduce((sum, g) => sum + g.gpa, 0) / data.grades.length).toFixed(2)
    : '—';
  const pendingAssignments = data.assignments.filter(a => a.status === 'pending').length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ ...S.PAGE_HEADER, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={S.ICON_BOX(C.primary, 48)}>
          <SchoolIcon />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700}>{t('portal.studentPortal')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('common.overview')}</Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={S.STAT_CARD(C.primary)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={S.ICON_BOX(C.primary, 36)}><SchoolIcon fontSize="small" /></Box>
                <Typography variant="body2" color="text.secondary">{t('portal.attendance')}</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color={`${attendanceColor}.main`}>
                {data.attendance ? `${attendancePct}%` : '—'}
              </Typography>
              {data.attendance && (
                <LinearProgress variant="determinate" value={attendancePct} color={attendanceColor} sx={{ mt: 1, borderRadius: 1 }} />
              )}
            </CardContent>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={S.STAT_CARD(C.info)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={S.ICON_BOX(C.info, 36)}><AssignmentIcon fontSize="small" /></Box>
                <Typography variant="body2" color="text.secondary">{t('portal.gpa')}</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="info.main">{avgGpa}</Typography>
              <Typography variant="body2" color="text.secondary">
                {data.grades.length} {t('portal.subjectsLabel')}
              </Typography>
            </CardContent>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={S.STAT_CARD(C.warning)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={S.ICON_BOX(C.warning, 36)}><ReceiptIcon fontSize="small" /></Box>
                <Typography variant="body2" color="text.secondary">{t('portal.feeStatus')}</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color={data.fees && data.fees.pending > 0 ? 'warning.main' : 'success.main'}>
                {data.fees ? `${t('common.currency')} ${data.fees.pending.toLocaleString()}` : '—'}
              </Typography>
              {data.fees && (
                <Typography variant="body2" color="text.secondary">
                  {t('portal.pendingOf')} {t('common.currency')} {data.fees.total.toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={S.STAT_CARD(C.purple)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={S.ICON_BOX(C.purple, 36)}><AssignmentIcon fontSize="small" /></Box>
                <Typography variant="body2" color="text.secondary">{t('portal.assignments')}</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="secondary.main">{pendingAssignments}</Typography>
              <Typography variant="body2" color="text.secondary">{t('portal.pendingAssignments')}</Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Paper sx={{ ...S.GLASS_ELEVATED, mb: 3, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          TabIndicatorProps={{ sx: S.TAB_INDICATOR }}
        >
          <Tab icon={<CalendarIcon />} label={t('academic.timetable')} sx={S.TAB_ACTIVE} />
          <Tab icon={<AssignmentIcon />} label={t('portal.assignments')} sx={S.TAB_ACTIVE} />
          <Tab icon={<SchoolIcon />} label={t('portal.performance')} sx={S.TAB_ACTIVE} />
          <Tab icon={<NotificationIcon />} label={t('communication.announcements')} sx={S.TAB_ACTIVE} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* Timetable */}
          <TabPanel value={tabValue} index={0}>
            {data.timetable.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noData')}</Typography>
            ) : (
              <List>
                {data.timetable.map((item) => (
                  <ListItem key={item.period} divider sx={S.TR_HOVER}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: C.primary, width: 32, height: 32, fontSize: 14, borderRadius: '8px' }}>
                        {item.period}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText primary={item.subject} secondary={`${item.teacher} | ${item.time}`} />
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          {/* Assignments */}
          <TabPanel value={tabValue} index={1}>
            {data.assignments.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noData')}</Typography>
            ) : (
              <List>
                {data.assignments.map((item, idx) => (
                  <ListItem key={idx} divider sx={S.TR_HOVER}>
                    <ListItemIcon>
                      {item.status === 'submitted' ? <CheckIcon color="success" /> : <WarningIcon color="warning" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      secondary={`${item.subject} | ${t('portal.due')}: ${item.dueDate}`}
                    />
                    <Chip
                      label={item.status}
                      color={item.status === 'submitted' ? 'success' : 'warning'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>

          {/* Grades */}
          <TabPanel value={tabValue} index={2}>
            {data.grades.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noData')}</Typography>
            ) : (
              <>
                <List>
                  {data.grades.map((item, idx) => (
                    <ListItem key={idx} divider sx={S.TR_HOVER}>
                      <ListItemIcon><BookIcon color="primary" /></ListItemIcon>
                      <ListItemText primary={item.subject} secondary={`${t('portal.gpa')}: ${item.gpa}`} />
                      <Chip label={item.grade} color="primary" />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Button startIcon={<DownloadIcon />} sx={S.BTN_OUTLINE}>
                    {t('portal.downloadReportCard')}
                  </Button>
                  <Button startIcon={<DownloadIcon />} sx={S.BTN_OUTLINE}>
                    {t('portal.downloadCV')}
                  </Button>
                </Box>
              </>
            )}
          </TabPanel>

          {/* Announcements */}
          <TabPanel value={tabValue} index={3}>
            {data.notices.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noData')}</Typography>
            ) : (
              <List>
                {data.notices.map((item) => (
                  <ListItem key={item.id} divider sx={S.TR_HOVER}>
                    <ListItemIcon><EventIcon color="info" /></ListItemIcon>
                    <ListItemText primary={item.title} secondary={item.date} />
                  </ListItem>
                ))}
              </List>
            )}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default StudentPortal;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
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
  CircularProgress,
  useTheme,
} from '@mui/material';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import {
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  School as SchoolIcon,
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
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
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

interface ChildInfo {
  id: number;
  name: string;
  class: string;
  section: string;
  rollNo: number;
}

const ParentPortal: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [tabValue, setTabValue] = useState(0);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [attendanceData, setAttendanceData] = useState<{ present: number; total: number; percentage: number } | null>(null);
  const [feeData, setFeeData] = useState<{
    invoices: Array<{ id: number; month: string; amount: number; status: string; paidDate?: string; dueDate?: string }>;
    totalPaid: number;
    totalPending: number;
  } | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; type: string; date: string }>>([]);
  const [grades, setGrades] = useState<Array<{ subject: string; midterm?: string; final?: string; gpa?: number }>>([]);
  const [libraryData, setLibraryData] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activities, setActivities] = useState<{ eca: any[]; sports: any[] }>({ eca: [], sports: [] });
  const [behavior, setBehavior] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient.get('/api/v1/parents/children').then((res) => {
      const list = res.data?.data || [];
      setChildren(list.map((c: any) => ({ id: c.studentId ?? c.id, name: c.name, class: c.class ?? '', section: c.section ?? '', rollNo: c.rollNo ?? 0 })));
    }).catch(() => { setChildren([]); setError(t('portal.failedToLoadData')); }).finally(() => setLoading(false));
  }, []);

  const selectedChild = children[selectedChildIndex];
  useEffect(() => {
    if (!selectedChild?.id) return;
    setLoading(true);

    const fetchChildData = async () => {
      const [summaryRes, assignRes, actRes, behRes, certRes] = await Promise.allSettled([
        apiClient.get(`/api/v1/parents/children/${selectedChild.id}/summary`),
        apiClient.get(`/api/v1/parents/children/${selectedChild.id}/assignments`),
        apiClient.get(`/api/v1/parents/children/${selectedChild.id}/activities`),
        apiClient.get(`/api/v1/parents/children/${selectedChild.id}/behavior`),
        apiClient.get(`/api/v1/parents/children/${selectedChild.id}/certificates`),
      ]);

      if (summaryRes.status === 'fulfilled') {
        const d = summaryRes.value.data?.data || {};
        setAttendanceData(d.attendance ? { present: d.attendance.present ?? 0, total: d.attendance.total ?? 0, percentage: d.attendance.percentage ?? 0 } : null);
        setFeeData(d.fees ? { invoices: d.fees.invoices ?? [], totalPaid: d.fees.totalPaid ?? 0, totalPending: d.fees.totalPending ?? 0 } : null);
        setNotifications(d.notifications ?? []);
        setGrades(d.grades ?? []);
        setLibraryData(d.library ?? []);
      } else {
        setAttendanceData(null);
        setFeeData(null);
        setNotifications([]);
        setGrades([]);
        setLibraryData([]);
      }

      setAssignments(assignRes.status === 'fulfilled' ? (assignRes.value.data?.data || []) : []);
      setActivities(actRes.status === 'fulfilled' ? (actRes.value.data?.data || { eca: [], sports: [] }) : { eca: [], sports: [] });
      setBehavior(behRes.status === 'fulfilled' ? (behRes.value.data?.data || []) : []);
      setCertificates(certRes.status === 'fulfilled' ? (certRes.value.data?.data || []) : []);
      setLoading(false);
    };

    fetchChildData();
  }, [selectedChild?.id]);

  useEffect(() => {
    Promise.allSettled([
      apiClient.get('/api/v1/communication/announcements', { params: { limit: 20 } }),
      apiClient.get('/api/v1/parents/calendar'),
    ]).then(([annRes, calRes]) => {
      setAnnouncements(annRes.status === 'fulfilled' ? (annRes.value.data?.data || []) : []);
      setCalendar(calRes.status === 'fulfilled' ? (calRes.value.data?.data || []) : []);
    });
  }, []);

  const attendancePct = attendanceData?.percentage ?? 0;
  const attendanceColor = attendancePct >= 75 ? 'success' : 'error';

  if (loading && children.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, mt: { xs: 7, sm: 8 } }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {/* Header */}
      <Box sx={{ ...S.PAGE_HEADER, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={S.ICON_BOX(C.primary, 48)}>
            <PersonIcon />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>{t('portal.parentPortal')}</Typography>
            <Typography variant="body2" color="text.secondary">{t('portal.childOverview')}</Typography>
          </Box>
        </Box>
        <FormControl sx={{ minWidth: 220 }}>
          <InputLabel>{t('portal.selectChild')}</InputLabel>
          <Select
            value={selectedChildIndex}
            onChange={(e) => setSelectedChildIndex(Number(e.target.value))}
            label={t('portal.selectChild')}
            sx={S.SELECT}
          >
            {children.map((child, idx) => (
              <MenuItem key={child.id} value={idx}>
                {child.name} — {t('portal.classLabel')} {child.class}{child.section}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: R.sm }} />}

      {/* Selected Child Info */}
      {selectedChild && (
        <Paper sx={{ ...S.GLASS_ELEVATED, p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: C.primary, width: 56, height: 56, borderRadius: R.sm, fontSize: 24, fontWeight: 700 }}>
              {selectedChild.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>{selectedChild.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('portal.classLabel')} {selectedChild.class}-{selectedChild.section} | {t('portal.rollNo')}: {selectedChild.rollNo}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={S.STAT_CARD(C.primary)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={S.ICON_BOX(C.primary, 36)}><SchoolIcon fontSize="small" /></Box>
                <Typography variant="body2" color="text.secondary">{t('portal.attendance')}</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color={attendanceData ? `${attendanceColor}.main` : 'text.secondary'}>
                {attendanceData ? `${attendancePct}%` : '—'}
              </Typography>
              {attendanceData && (
                <>
                  <LinearProgress
                    variant="determinate"
                    value={attendancePct}
                    color={attendanceColor as 'success' | 'error'}
                    sx={{ mt: 1, borderRadius: R.xs }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {attendanceData.present}/{attendanceData.total} {t('portal.daysLabel')}
                  </Typography>
                </>
              )}
            </CardContent>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={S.STAT_CARD(C.warning)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={S.ICON_BOX(C.warning, 36)}><ReceiptIcon fontSize="small" /></Box>
                <Typography variant="body2" color="text.secondary">{t('portal.feePending')}</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color={feeData && feeData.totalPending > 0 ? 'warning.main' : 'success.main'}>
                {feeData ? `${t('common.currency')} ${feeData.totalPending.toLocaleString()}` : '—'}
              </Typography>
              {feeData && (
                <Typography variant="body2" color="text.secondary">
                  {t('portal.paidLabel')}: {t('common.currency')} {feeData.totalPaid.toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Box sx={S.STAT_CARD(C.info)}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={S.ICON_BOX(C.info, 36)}><NotificationIcon fontSize="small" /></Box>
                <Typography variant="body2" color="text.secondary">{t('portal.notifications')}</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} color="info.main">
                {notifications.filter(n => n.type === 'warning').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('portal.alertsAttention')}
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ ...S.GLASS_ELEVATED, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          TabIndicatorProps={{ sx: S.TAB_INDICATOR }}
        >
          <Tab icon={<ReceiptIcon />} label={t('portal.fees')} sx={S.TAB_ACTIVE} />
          <Tab icon={<SchoolIcon />} label={t('portal.grades')} sx={S.TAB_ACTIVE} />
          <Tab icon={<AssignmentIcon />} label={t('portal.assignments')} sx={S.TAB_ACTIVE} />
          <Tab icon={<LibraryIcon />} label={t('portal.library')} sx={S.TAB_ACTIVE} />
          <Tab icon={<SportsIcon />} label={t('portal.activities')} sx={S.TAB_ACTIVE} />
          <Tab icon={<BehaviorIcon />} label={t('portal.behavior')} sx={S.TAB_ACTIVE} />
          <Tab icon={<CalendarIcon />} label={t('portal.calendar')} sx={S.TAB_ACTIVE} />
          <Tab icon={<CertificateIcon />} label={t('portal.certificates')} sx={S.TAB_ACTIVE} />
          <Tab icon={<NotificationIcon />} label={t('portal.notifications')} sx={S.TAB_ACTIVE} />
          <Tab icon={<AnnouncementIcon />} label={t('portal.announcements')} sx={S.TAB_ACTIVE} />
          <Tab icon={<MessageIcon />} label={t('portal.messages')} sx={S.TAB_ACTIVE} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* Fees */}
          <TabPanel value={tabValue} index={0}>
            {feeData && feeData.invoices.length > 0 ? (
              <List>
                {feeData.invoices.map((inv) => (
                  <ListItem key={inv.id} divider sx={S.TR_HOVER}>
                    <ListItemIcon>
                      {inv.status === 'paid' ? (
                        <CheckIcon sx={{ color: C.success }} />
                      ) : inv.status === 'pending' ? (
                        <WarningIcon sx={{ color: C.warning }} />
                      ) : (
                        <ScheduleIcon sx={{ color: C.info }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={inv.month}
                      secondary={`${t('common.currency')} ${inv.amount.toLocaleString()}`}
                    />
                    <Chip
                      label={inv.status.toUpperCase()}
                      color={inv.status === 'paid' ? 'success' : inv.status === 'pending' ? 'warning' : 'default'}
                      size="small"
                      sx={{ borderRadius: R.xs }}
                    />
                    {inv.status === 'pending' && (
                      <Button
                        sx={{ ...S.BTN_PRIMARY, ml: 1 }}
                        size="small"
                        startIcon={<PaymentIcon />}
                      >
                        {t('portal.payNow')}
                      </Button>
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noData')}</Typography>
            )}
          </TabPanel>

          {/* Grades */}
          <TabPanel value={tabValue} index={1}>
            {grades.length > 0 ? (
              <List>
                {grades.map((g, idx) => (
                  <ListItem key={idx} divider sx={S.TR_HOVER}>
                    <ListItemText
                      primary={g.subject}
                      secondary={`${t('portal.midterm')}: ${g.midterm ?? '—'} | ${t('portal.final')}: ${g.final ?? '—'} | ${t('portal.gpa')}: ${g.gpa ?? '—'}`}
                    />
                    <Chip label={g.final ?? '—'} color="primary" sx={{ borderRadius: R.xs }} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noData')}</Typography>
            )}
          </TabPanel>

          {/* Assignments */}
          <TabPanel value={tabValue} index={2}>
            {assignments.length > 0 ? (
              <List>
                {assignments.map((assign: any) => (
                  <ListItem key={assign.id} divider sx={S.TR_HOVER}>
                    <ListItemIcon>
                      <AssignmentIcon sx={{ color: assign.status === 'submitted' ? C.success : C.warning }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={assign.title}
                      secondary={`${t('portal.subjectLabel')}: ${assign.subject} | ${t('portal.dueLabel')}: ${assign.dueDate}${assign.submittedAt ? ` | ${t('portal.submittedAt')}: ${assign.submittedAt}` : ''}`}
                    />
                    <Chip
                      label={assign.status.toUpperCase()}
                      color={assign.status === 'submitted' ? 'success' : assign.status === 'graded' ? 'info' : 'warning'}
                      size="small"
                      sx={{ borderRadius: R.xs }}
                    />
                    {assign.grade && (
                      <Chip label={`${t('portal.gradeLabel')}: ${assign.grade}`} color="primary" size="small" sx={{ ml: 1, borderRadius: R.xs }} />
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noAssignments')}</Typography>
            )}
          </TabPanel>

          {/* Library */}
          <TabPanel value={tabValue} index={3}>
            {libraryData.length > 0 ? (
              <List>
                {libraryData.map((book: any, idx: number) => (
                  <ListItem key={idx} divider sx={S.TR_HOVER}>
                    <ListItemIcon>
                      <LibraryIcon sx={{ color: C.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={book.title || book.bookTitle || '—'}
                      secondary={`${t('portal.borrowed')}: ${book.borrowDate || book.issuedDate || '—'} | ${t('portal.dueLabel')}: ${book.dueDate || book.returnDate || '—'}${book.fine ? ` | ${t('portal.fineLabel')}: ${t('common.currency')} ${book.fine}` : ''}`}
                    />
                    <Chip
                      label={book.status || t('portal.borrowed')}
                      size="small"
                      color={book.status === 'returned' ? 'success' : book.status === 'overdue' ? 'error' : 'warning'}
                      sx={{ borderRadius: R.xs }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noBooksFound')}</Typography>
            )}
          </TabPanel>

          {/* Activities */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" fontWeight={600} gutterBottom>{t('portal.ecaActivities')}</Typography>
            {activities.eca.length > 0 ? (
              <List>
                {activities.eca.map((eca: any, idx: number) => (
                  <ListItem key={idx} divider sx={S.TR_HOVER}>
                    <ListItemIcon>
                      <SportsIcon sx={{ color: C.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={eca.name}
                      secondary={`${t('portal.categoryLabel')}: ${eca.category} | ${t('portal.enrolledLabel')}: ${eca.enrolledDate}`}
                    />
                    <Chip label={eca.status} color="success" size="small" sx={{ borderRadius: R.xs }} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info" sx={{ mb: 2, borderRadius: R.md }}>{t('portal.noEca')}</Alert>
            )}

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>{t('portal.sportsActivitiesLabel')}</Typography>
            {activities.sports.length > 0 ? (
              <List>
                {activities.sports.map((sport: any, idx: number) => (
                  <ListItem key={idx} divider sx={S.TR_HOVER}>
                    <ListItemIcon>
                      <SportsIcon sx={{ color: C.purple }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={sport.name}
                      secondary={`${t('portal.categoryLabel')}: ${sport.category} | ${t('portal.enrolledLabel')}: ${sport.enrolledDate}`}
                    />
                    <Chip label={sport.status} color="success" size="small" sx={{ borderRadius: R.xs }} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info" sx={{ borderRadius: R.md }}>{t('portal.noSports')}</Alert>
            )}
          </TabPanel>

          {/* Behavior */}
          <TabPanel value={tabValue} index={5}>
            {behavior.length > 0 ? (
              <List>
                {behavior.map((record: any, idx: number) => (
                  <ListItem key={idx} divider sx={S.TR_HOVER}>
                    <ListItemIcon>
                      <BehaviorIcon sx={{ color: record.type === 'positive' ? C.success : C.warning }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={record.title || record.description}
                      secondary={`${t('portal.dateLabel')}: ${record.date} | ${t('portal.teacherLabel')}: ${record.teacher || '—'}`}
                    />
                    <Chip
                      label={record.type}
                      color={record.type === 'positive' ? 'success' : record.type === 'negative' ? 'error' : 'default'}
                      size="small"
                      sx={{ borderRadius: R.xs }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noBehavior')}</Typography>
            )}
          </TabPanel>

          {/* Calendar */}
          <TabPanel value={tabValue} index={6}>
            {calendar.length > 0 ? (
              <List>
                {calendar.map((event: any) => (
                  <ListItem key={event.id} divider sx={S.TR_HOVER}>
                    <ListItemIcon>
                      <CalendarIcon sx={{ color: C.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={event.title}
                      secondary={
                        <>
                          <Typography variant="caption" component="span" color="text.secondary">
                            {event.date} | {event.type}
                          </Typography>
                          {event.description && (
                            <Typography variant="body2" color="text.secondary" component="p">
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
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noEvents')}</Typography>
            )}
          </TabPanel>

          {/* Certificates */}
          <TabPanel value={tabValue} index={7}>
            {certificates.length > 0 ? (
              <List>
                {certificates.map((cert: any) => (
                  <ListItem key={cert.id} divider sx={S.TR_HOVER}>
                    <ListItemIcon>
                      <CertificateIcon sx={{ color: C.primary }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={cert.title}
                      secondary={`${t('portal.typeLabel')}: ${cert.type} | ${t('portal.issuedLabel')}: ${cert.issueDate}`}
                    />
                    {cert.downloadUrl && (
                      <Button
                        sx={S.BTN_OUTLINE}
                        size="small"
                        href={cert.downloadUrl}
                        target="_blank"
                      >
                        {t('portal.download')}
                      </Button>
                    )}
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noCertificates')}</Typography>
            )}
          </TabPanel>

          {/* Notifications */}
          <TabPanel value={tabValue} index={8}>
            {notifications.length > 0 ? notifications.map((n) => (
              <Alert
                key={n.id}
                severity={n.type === 'warning' ? 'warning' : 'info'}
                sx={{ mb: 1, borderRadius: R.md }}
              >
                <Typography variant="body2">{n.title}</Typography>
                <Typography variant="caption" color="text.secondary">{n.date}</Typography>
              </Alert>
            )) : (
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noData')}</Typography>
            )}
          </TabPanel>

          {/* Announcements */}
          <TabPanel value={tabValue} index={9}>
            {announcements.length > 0 ? (
              <List>
                {announcements.map((ann: any, idx: number) => (
                  <ListItem key={ann.id || idx} divider sx={S.TR_HOVER}>
                    <ListItemIcon>
                      <AnnouncementIcon sx={{ color: C.info }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={ann.title || t('portal.announcements')}
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary" component="span">
                            {ann.date || ann.createdAt ? new Date(ann.date || ann.createdAt).toLocaleDateString() : ''}
                          </Typography>
                          {(ann.content || ann.message) && (
                            <Typography variant="body2" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
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
              <Typography variant="body2" color="text.secondary" sx={S.EMPTY_STATE}>{t('portal.noAnnouncements')}</Typography>
            )}
          </TabPanel>

          {/* Messages */}
          <TabPanel value={tabValue} index={10}>
            <Alert severity="info" sx={{ mb: 2, borderRadius: R.md }}>
              {t('portal.messagingInfo')}
            </Alert>
            <Button
              sx={S.BTN_PRIMARY}
              startIcon={<MessageIcon />}
              fullWidth
              onClick={() => navigate('/communication/messages')}
            >
              {t('portal.openMessages')}
            </Button>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
};

export default ParentPortal;

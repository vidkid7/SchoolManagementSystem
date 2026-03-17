import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip, useTheme,
} from '@mui/material';
import {
  LocalLibrary as LibraryIcon,
  MenuBook as BookIcon,
  SwapHoriz as CirculationIcon,
  Payment as FineIcon,
  Assessment as ReportIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  Bookmark as IssuedIcon,
  Warning as OverdueIcon,
  EventSeat as ReservationIcon,
  Notifications as AnnouncementIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';
import { C, useAdminStyles } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';

interface LibraryStats {
  totalBooks: number;
  booksIssued: number;
  overdue: number;
  reservations: number;
}

interface Book {
  id: number;
  title: string;
  author?: string;
  isbn?: string;
  category?: string;
  status?: string;
  copies?: number;
  availableCopies?: number;
  publishedYear?: number;
}

interface Fine {
  id: number;
  studentId?: number;
  studentName?: string;
  bookTitle?: string;
  amount: number;
  reason?: string;
  status?: string;
  date?: string;
  dueDate?: string;
}

interface ProfileData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  status: string;
}

const authHdr = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}</div>;
}

const LibrarianPortal: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<LibraryStats>({ totalBooks: 0, booksIssued: 0, overdue: 0, reservations: 0 });
  const [books, setBooks] = useState<Book[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [statsRes, booksRes, finesRes, profileRes] = await Promise.all([
        apiClient.get('/api/v1/library/statistics', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
        apiClient.get('/api/v1/library/books?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/library/fines?limit=50', authHdr(accessToken)).catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/users/me', authHdr(accessToken)).catch(() => ({ data: { data: null } })),
      ]);
      const s = statsRes.data?.data;
      if (s) {
        setStats({
          totalBooks: s.totalBooks ?? 0,
          booksIssued: s.booksIssued ?? s.issuedBooks ?? 0,
          overdue: s.overdue ?? s.overdueBooks ?? 0,
          reservations: s.reservations ?? s.activeReservations ?? 0,
        });
      }
      const bk = booksRes.data?.data;
      setBooks(Array.isArray(bk) ? bk : bk?.books ?? []);
      const fn = finesRes.data?.data;
      setFines(Array.isArray(fn) ? fn : fn?.fines ?? []);
      setProfile(profileRes.data?.data ?? null);
    } catch {
      setError(t('portal.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, mt: { xs: 7, sm: 8 } }}>
      <Paper sx={S.PAGE_HEADER}>
        <Box display="flex" alignItems="center" gap={2}>
          <LibraryIcon sx={{ fontSize: 32, color: C.primary }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{t('portal.librarianPortal')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('portal.welcome')}, {user?.firstName || user?.username} — {t('roles.categories.library')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: t('portal.totalBooksLib'), value: stats.totalBooks, icon: <BookIcon />, color: C.primary },
          { label: t('portal.issuedBooksLib'), value: stats.booksIssued, icon: <IssuedIcon />, color: C.info },
          { label: t('portal.overdueBooksLib'), value: stats.overdue, icon: <OverdueIcon />, color: C.danger },
          { label: t('portal.reservations'), value: stats.reservations, icon: <ReservationIcon />, color: C.warning },
        ].map(stat => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Box sx={S.STAT_CARD(stat.color)}>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={S.ICON_BOX(stat.color, 36)}>{stat.icon}</Box>
                <Typography variant="h4" fontWeight={700}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<LibraryIcon />} iconPosition="start" label={t('portal.dashboard')} />
        <Tab icon={<BookIcon />} iconPosition="start" label={t('library.books')} />
        <Tab icon={<CirculationIcon />} iconPosition="start" label={t('portal.circulation')} />
        <Tab icon={<FineIcon />} iconPosition="start" label={t('portal.fines')} />
        <Tab icon={<ReportIcon />} iconPosition="start" label={t('finance.reports')} />
        <Tab icon={<PersonIcon />} iconPosition="start" label={t('portal.profileAndLinks')} />
      </Tabs>

      {/* Dashboard */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.libraryOverview')}</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>{t('portal.collectionSummary')}</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>{t('portal.totalBooksLib')}:</strong> {stats.totalBooks}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.currentlyIssued')}:</strong> {stats.booksIssued}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.available')}:</strong> {stats.totalBooks - stats.booksIssued}</Typography>
                <Typography variant="body2" mt={1} color="error.main"><strong>{t('portal.overdueReturns')}:</strong> {stats.overdue}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>{t('portal.quickActions')}</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button sx={S.BTN_OUTLINE} size="small" onClick={() => navigate(`/library`)}>{t('portal.libraryDashboard')}</Button>
                  <Button sx={S.BTN_OUTLINE} size="small" onClick={() => navigate(`/library/books`)}>{t('portal.manageBooks')}</Button>
                  <Button sx={S.BTN_OUTLINE} size="small" onClick={() => navigate(`/library/circulation`)}>{t('portal.issueReturn')}</Button>
                </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Recent overdue fines */}
        {fines.filter(f => f.status === 'pending' || f.status === 'unpaid').length > 0 && (
          <>
            <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.pendingFines')}</Typography>
            <TableContainer component={Paper} sx={S.GLASS}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: S.TH_BG }}>
                    <TableCell>{t('portal.student')}</TableCell>
                    <TableCell>{t('portal.book')}</TableCell>
                    <TableCell>{t('portal.amount')}</TableCell>
                    <TableCell>{t('portal.reason')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fines.filter(f => f.status === 'pending' || f.status === 'unpaid').slice(0, 10).map(f => (
                    <TableRow key={f.id} hover>
                      <TableCell>{f.studentName || `Student #${f.studentId || '—'}`}</TableCell>
                      <TableCell>{f.bookTitle || '—'}</TableCell>
                      <TableCell><strong>{t('common.currency')} {Number(f.amount).toLocaleString()}</strong></TableCell>
                      <TableCell>{f.reason || '—'}</TableCell>
                      <TableCell><Chip label={f.status || 'pending'} size="small" color="warning" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </TabPanel>

      {/* Book Catalog */}
      <TabPanel value={tab} index={1}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.bookCatalog')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell>{t('common.title')}</TableCell>
                <TableCell>{t('portal.author')}</TableCell>
                <TableCell>ISBN</TableCell>
                <TableCell>{t('common.category')}</TableCell>
                <TableCell>{t('portal.copies')}</TableCell>
                <TableCell>{t('portal.available')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {books.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('messages.noData')}</Typography></TableCell></TableRow>
              ) : books.map(b => (
                <TableRow key={b.id} hover>
                  <TableCell><strong>{b.title}</strong></TableCell>
                  <TableCell>{b.author || '—'}</TableCell>
                  <TableCell>{b.isbn || '—'}</TableCell>
                  <TableCell>{b.category || '—'}</TableCell>
                  <TableCell>{b.copies ?? '—'}</TableCell>
                  <TableCell>{b.availableCopies ?? '—'}</TableCell>
                  <TableCell>
                    <Chip label={b.status || 'available'} size="small"
                      color={b.status === 'available' || !b.status ? 'success' : b.status === 'issued' ? 'warning' : 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Circulation */}
      <TabPanel value={tab} index={2}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.circulation')}</Typography>
        <Box sx={{ ...S.GLASS, p: 3, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">{t('portal.totalBooksLib')}</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.totalBooks}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">{t('portal.currentlyIssued')}</Typography>
                <Typography variant="h5" fontWeight={700} color="info.main">{stats.booksIssued}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">{t('portal.overdue')}</Typography>
                <Typography variant="h5" fontWeight={700} color="error.main">{stats.overdue}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">{t('portal.reservations')}</Typography>
                <Typography variant="h5" fontWeight={700} color="warning.main">{stats.reservations}</Typography>
              </Grid>
            </Grid>
        </Box>
        <Box display="flex" gap={2}>
          <Button sx={S.BTN_PRIMARY} startIcon={<CirculationIcon />} onClick={() => navigate(`/library/circulation`)}>
            {t('portal.issueReturnBooks')}
          </Button>
          <Button sx={S.BTN_OUTLINE} startIcon={<ReservationIcon />} onClick={() => navigate(`/library/reservations`)}>
            {t('portal.manageReservations')}
          </Button>
        </Box>
      </TabPanel>

      {/* Fines */}
      <TabPanel value={tab} index={3}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.fines')}</Typography>
        <TableContainer component={Paper} sx={S.GLASS}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: S.TH_BG }}>
                <TableCell>{t('portal.student')}</TableCell>
                <TableCell>{t('portal.book')}</TableCell>
                <TableCell>{t('portal.amount')}</TableCell>
                <TableCell>{t('portal.reason')}</TableCell>
                <TableCell>{t('common.date')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fines.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>{t('messages.noData')}</Typography></TableCell></TableRow>
              ) : fines.map(f => (
                <TableRow key={f.id} hover>
                  <TableCell>{f.studentName || `Student #${f.studentId || '—'}`}</TableCell>
                  <TableCell>{f.bookTitle || '—'}</TableCell>
                  <TableCell><strong>{t('common.currency')} {Number(f.amount).toLocaleString()}</strong></TableCell>
                  <TableCell>{f.reason || '—'}</TableCell>
                  <TableCell>{f.date ? new Date(f.date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <Chip label={f.status || 'pending'} size="small"
                      color={f.status === 'paid' ? 'success' : f.status === 'waived' ? 'info' : 'warning'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Reports */}
      <TabPanel value={tab} index={4}>
        <Typography variant="h6" fontWeight={600} mb={2}>{t('portal.libraryReports')}</Typography>
        <Grid container spacing={2}>
          {[
            { label: t('portal.collectionReport'), desc: t('portal.collectionReportDesc'), path: '/library/reports' },
            { label: t('portal.circulationReport'), desc: t('portal.circulationReportDesc'), path: '/library/reports' },
            { label: t('portal.fineReport'), desc: t('portal.fineReportDesc'), path: '/library/reports' },
          ].map(r => (
            <Grid item xs={12} sm={4} key={r.label}>
              <Box sx={{ ...S.GLASS, p: 3, cursor: 'pointer', textAlign: 'center' }} onClick={() => navigate(r.path)}>
                  <ReportIcon sx={{ fontSize: 40, color: C.primary, mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600}>{r.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{r.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Profile & Links */}
      <TabPanel value={tab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>{t('portal.myProfile')}</Typography>
                  <Chip label={profile?.role || t('portal.librarian')} color="primary" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>{t('common.name')}:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.username')}:</strong> {profile?.username ?? user?.username}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.email')}:</strong> {profile?.email ?? user?.email ?? '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>{t('portal.phone')}:</strong> {profile?.phoneNumber || '—'}</Typography>
                <Box mt={2}>
                  <Button sx={S.BTN_OUTLINE} size="small" onClick={() => navigate(`/communication/messages`)}>{t('portal.contactAdmin')}</Button>
                </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ ...S.GLASS, p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>{t('portal.quickLinks')}</Typography>
                <Divider sx={{ mb: 1 }} />
                <List dense>
                  {[
                    { label: t('portal.libraryDashboard'), path: '/library', icon: <LibraryIcon color="primary" /> },
                    { label: t('library.books'), path: '/library/books', icon: <BookIcon color="primary" /> },
                    { label: t('portal.circulation'), path: '/library/circulation', icon: <CirculationIcon color="primary" /> },
                    { label: t('communication.messages'), path: '/communication/messages', icon: <MessageIcon color="primary" /> },
                    { label: t('menu.calendar'), path: '/calendar', icon: <CalendarIcon color="primary" /> },
                  ].map(l => (
                    <ListItem key={l.path} button onClick={() => navigate(l.path)}>
                      <ListItemIcon>{l.icon}</ListItemIcon>
                      <ListItemText primary={l.label} />
                    </ListItem>
                  ))}
                </List>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default LibrarianPortal;

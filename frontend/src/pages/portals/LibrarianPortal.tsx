import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Avatar, List, ListItem,
  ListItemIcon, ListItemText, Chip, CircularProgress, Alert, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Tooltip,
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
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { RootState } from '../../store';

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
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<LibraryStats>({ totalBooks: 0, booksIssued: 0, overdue: 0, reservations: 0 });
  const [books, setBooks] = useState<Book[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

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
      setError('Failed to load library dashboard');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
          <LibraryIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={700}>Librarian Portal</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome, {user?.firstName || user?.username} — Library Management
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total Books', value: stats.totalBooks, icon: <BookIcon />, color: 'primary.main' },
          { label: 'Books Issued', value: stats.booksIssued, icon: <IssuedIcon />, color: 'info.main' },
          { label: 'Overdue', value: stats.overdue, icon: <OverdueIcon />, color: 'error.main' },
          { label: 'Reservations', value: stats.reservations, icon: <ReservationIcon />, color: 'warning.main' },
        ].map(stat => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Box sx={{ color: stat.color, fontSize: 32 }}>{stat.icon}</Box>
                <Typography variant="h4" fontWeight={700}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<LibraryIcon />} iconPosition="start" label="Dashboard" />
        <Tab icon={<BookIcon />} iconPosition="start" label="Book Catalog" />
        <Tab icon={<CirculationIcon />} iconPosition="start" label="Circulation" />
        <Tab icon={<FineIcon />} iconPosition="start" label="Fines" />
        <Tab icon={<ReportIcon />} iconPosition="start" label="Reports" />
        <Tab icon={<PersonIcon />} iconPosition="start" label="Profile & Links" />
      </Tabs>

      {/* Dashboard */}
      <TabPanel value={tab} index={0}>
        <Typography variant="h6" fontWeight={600} mb={2}>Library Overview</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Collection Summary</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>Total Books:</strong> {stats.totalBooks}</Typography>
                <Typography variant="body2" mt={1}><strong>Currently Issued:</strong> {stats.booksIssued}</Typography>
                <Typography variant="body2" mt={1}><strong>Available:</strong> {stats.totalBooks - stats.booksIssued}</Typography>
                <Typography variant="body2" mt={1} color="error.main"><strong>Overdue Returns:</strong> {stats.overdue}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Quick Actions</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1}>
                  <Button variant="outlined" size="small" onClick={() => navigate('/library')}>Library Dashboard</Button>
                  <Button variant="outlined" size="small" onClick={() => navigate('/library/books')}>Manage Books</Button>
                  <Button variant="outlined" size="small" onClick={() => navigate('/library/circulation')}>Issue / Return</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent overdue fines */}
        {fines.filter(f => f.status === 'pending' || f.status === 'unpaid').length > 0 && (
          <>
            <Typography variant="h6" fontWeight={600} mb={2}>Pending Fines</Typography>
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>Student</TableCell>
                    <TableCell>Book</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fines.filter(f => f.status === 'pending' || f.status === 'unpaid').slice(0, 10).map(f => (
                    <TableRow key={f.id} hover>
                      <TableCell>{f.studentName || `Student #${f.studentId || '—'}`}</TableCell>
                      <TableCell>{f.bookTitle || '—'}</TableCell>
                      <TableCell><strong>Rs {Number(f.amount).toLocaleString()}</strong></TableCell>
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
        <Typography variant="h6" fontWeight={600} mb={2}>Book Catalog</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>ISBN</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Copies</TableCell>
                <TableCell>Available</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {books.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No books found.</Typography></TableCell></TableRow>
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
        <Typography variant="h6" fontWeight={600} mb={2}>Circulation</Typography>
        <Card sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Total Books</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.totalBooks}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Currently Issued</Typography>
                <Typography variant="h5" fontWeight={700} color="info.main">{stats.booksIssued}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Overdue</Typography>
                <Typography variant="h5" fontWeight={700} color="error.main">{stats.overdue}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">Reservations</Typography>
                <Typography variant="h5" fontWeight={700} color="warning.main">{stats.reservations}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Box display="flex" gap={2}>
          <Button variant="contained" startIcon={<CirculationIcon />} onClick={() => navigate('/library/circulation')}>
            Issue / Return Books
          </Button>
          <Button variant="outlined" startIcon={<ReservationIcon />} onClick={() => navigate('/library/reservations')}>
            Manage Reservations
          </Button>
        </Box>
      </TabPanel>

      {/* Fines */}
      <TabPanel value={tab} index={3}>
        <Typography variant="h6" fontWeight={600} mb={2}>Fines</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>Student</TableCell>
                <TableCell>Book</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fines.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>No fines recorded.</Typography></TableCell></TableRow>
              ) : fines.map(f => (
                <TableRow key={f.id} hover>
                  <TableCell>{f.studentName || `Student #${f.studentId || '—'}`}</TableCell>
                  <TableCell>{f.bookTitle || '—'}</TableCell>
                  <TableCell><strong>Rs {Number(f.amount).toLocaleString()}</strong></TableCell>
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
        <Typography variant="h6" fontWeight={600} mb={2}>Library Reports</Typography>
        <Grid container spacing={2}>
          {[
            { label: 'Collection Report', desc: 'Overview of total collection and categorization', path: '/library/reports' },
            { label: 'Circulation Report', desc: 'Issue, return, and overdue statistics', path: '/library/reports' },
            { label: 'Fine Report', desc: 'Fine collection and pending amounts', path: '/library/reports' },
          ].map(r => (
            <Grid item xs={12} sm={4} key={r.label}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, cursor: 'pointer' }} onClick={() => navigate(r.path)}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <ReportIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600}>{r.label}</Typography>
                  <Typography variant="body2" color="text.secondary">{r.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Profile & Links */}
      <TabPanel value={tab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="h6" fontWeight={600}>My Profile</Typography>
                  <Chip label={profile?.role || 'Librarian'} color="primary" size="small" />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2"><strong>Name:</strong> {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</Typography>
                <Typography variant="body2" mt={1}><strong>Username:</strong> {profile?.username ?? user?.username}</Typography>
                <Typography variant="body2" mt={1}><strong>Email:</strong> {profile?.email ?? user?.email ?? '—'}</Typography>
                <Typography variant="body2" mt={1}><strong>Phone:</strong> {profile?.phoneNumber || '—'}</Typography>
                <Box mt={2}>
                  <Button variant="outlined" color="primary" size="small" onClick={() => navigate('/communication/messages')}>Contact Admin</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Quick Links</Typography>
                <Divider sx={{ mb: 1 }} />
                <List dense>
                  {[
                    { label: 'Library Dashboard', path: '/library', icon: <LibraryIcon color="primary" /> },
                    { label: 'Book Catalog', path: '/library/books', icon: <BookIcon color="primary" /> },
                    { label: 'Circulation', path: '/library/circulation', icon: <CirculationIcon color="primary" /> },
                    { label: 'Messages', path: '/communication/messages', icon: <MessageIcon color="primary" /> },
                    { label: 'Calendar', path: '/calendar', icon: <CalendarIcon color="primary" /> },
                  ].map(l => (
                    <ListItem key={l.path} button onClick={() => navigate(l.path)}>
                      <ListItemIcon>{l.icon}</ListItemIcon>
                      <ListItemText primary={l.label} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default LibrarianPortal;

/**
 * Book Circulation Management
 * Issue and return books, manage borrowing history
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Assignment as IssueIcon,
  AssignmentReturn as ReturnIcon,
  Payment as PaymentIcon,
  Update as RenewIcon,
  Bookmark as ReserveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface Circulation {
  circulationId: number;
  bookTitle: string;
  accessionNumber: string;
  memberName: string;
  memberType: 'student' | 'staff';
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned' | 'overdue';
  fineAmount?: number;
  finePaid?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export function BookCirculation() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [tabValue, setTabValue] = useState(0);
  const [circulations, setCirculations] = useState<Circulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Issue Dialog
  const [issueDialog, setIssueDialog] = useState(false);
  const [issueForm, setIssueForm] = useState({
    bookId: '',
    memberId: '',
    memberType: 'student',
    dueDate: '',
  });

  // Return Dialog
  const [returnDialog, setReturnDialog] = useState(false);
  const [selectedCirculation, setSelectedCirculation] = useState<Circulation | null>(null);
  const [fineAmount, setFineAmount] = useState(0);

  // Reservations
  const [reservations, setReservations] = useState<any[]>([]);
  const [reservationBookId, setReservationBookId] = useState('');
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reserveDialog, setReserveDialog] = useState(false);
  const [reserveForm, setReserveForm] = useState({ bookId: '', studentId: '' });

  // Fines by student
  const [finesStudentId, setFinesStudentId] = useState('');
  const [finesList, setFinesList] = useState<any[]>([]);
  const [finesLoading, setFinesLoading] = useState(false);

  useEffect(() => {
    if (tabValue < 3) fetchCirculations();
    else if (tabValue === 3 && reservationBookId) fetchReservations();
    else if (tabValue === 4 && finesStudentId) fetchFines();
  }, [tabValue, page, rowsPerPage, reservationBookId, finesStudentId]);

  const fetchCirculations = async () => {
    try {
      setLoading(true);
      const status = tabValue === 0 ? 'issued' : tabValue === 1 ? 'overdue' : 'returned';
      const response = await apiClient.get('/library/circulation', {
        params: {
          status,
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      setCirculations(response.data?.data || []);
      setTotal(response.data?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch circulations:', err);
      setCirculations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueBook = async () => {
    try {
      await apiClient.post('/library/issue', issueForm);
      setSuccess(t('library.bookIssuedSuccess'));
      setIssueDialog(false);
      fetchCirculations();
      setTimeout(() => setSuccess(''), 3000);
      setIssueForm({
        bookId: '',
        memberId: '',
        memberType: 'student',
        dueDate: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || t('library.failedToIssueBook'));
    }
  };

  const handleReturnBook = async () => {
    if (!selectedCirculation) return;

    try {
      await apiClient.post(`/library/return/${selectedCirculation.circulationId}`, {
        fineAmount,
      });
      setSuccess(t('library.bookReturnedSuccess'));
      setReturnDialog(false);
      setSelectedCirculation(null);
      fetchCirculations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('library.failedToReturnBook'));
    }
  };

  const handlePayFine = async (circulationId: number) => {
    try {
      await apiClient.post(`/library/pay-fine/${circulationId}`);
      setSuccess(t('library.finePaidSuccess'));
      fetchCirculations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('library.failedToProcessPayment'));
    }
  };

  const handleRenew = async (circulationId: number) => {
    try {
      await apiClient.post('/library/renew', { circulationId });
      setSuccess(t('library.bookRenewedSuccess'));
      fetchCirculations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('library.failedToRenewBook'));
    }
  };

  const fetchReservations = async () => {
    if (!reservationBookId) return;
    setReservationsLoading(true);
    try {
      const res = await apiClient.get('/library/reservations', { params: { bookId: reservationBookId } });
      setReservations(res.data?.data ?? []);
    } catch {
      setReservations([]);
    } finally {
      setReservationsLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    try {
      await apiClient.put(`/library/reservations/${reservationId}/cancel`, { reason: 'Cancelled by staff' });
      setSuccess(t('library.reservationCancelled'));
      fetchReservations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('library.failedToCancelReservation'));
    }
  };

  const handleReserveBook = async () => {
    try {
      await apiClient.post('/library/reserve', {
        bookId: parseInt(reserveForm.bookId, 10),
        studentId: parseInt(reserveForm.studentId, 10),
      });
      setSuccess(t('library.bookReservedSuccess'));
      setReserveDialog(false);
      setReserveForm({ bookId: '', studentId: '' });
      if (reservationBookId) fetchReservations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('library.failedToReserveBook'));
    }
  };

  const fetchFines = async () => {
    if (!finesStudentId) return;
    setFinesLoading(true);
    try {
      const res = await apiClient.get(`/library/fines/${finesStudentId}`);
      setFinesList(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setFinesList([]);
    } finally {
      setFinesLoading(false);
    }
  };

  const handlePayFineById = async (fineId: number, amount: number) => {
    try {
      await apiClient.post(`/library/fines/${fineId}/pay`, {
        amount: Math.max(0.01, amount),
        paymentMethod: 'cash',
      });
      setSuccess(t('library.finePaidSuccess'));
      fetchFines();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('library.failedToProcessPayment'));
    }
  };

  const openReturnDialog = (circulation: Circulation) => {
    setSelectedCirculation(circulation);
    // Calculate fine if overdue
    if (circulation.status === 'overdue') {
      const dueDate = new Date(circulation.dueDate);
      const today = new Date();
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      setFineAmount(daysOverdue * 10); // NPR 10 per day
    } else {
      setFineAmount(0);
    }
    setReturnDialog(true);
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            {t('library.bookCirculation')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined" sx={S.BTN_OUTLINE}
              startIcon={<ReserveIcon />}
              onClick={() => setReserveDialog(true)}
            >
              {t('library.reserveBook')}
            </Button>
            <Button
              variant="contained"
              startIcon={<IssueIcon />}
              onClick={() => setIssueDialog(true)}
              sx={S.BTN_PRIMARY}
            >
              {t('library.issueBook')}
            </Button>
          </Box>
        </Box>
      </Paper>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={S.GLASS}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label={t('library.issuedBooks')} />
          <Tab label={t('library.overdueBooksTab')} />
          <Tab label={t('library.returnHistory')} />
          <Tab label={t('library.reservations')} />
          <Tab label={t('library.finesByStudent')} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('library.bookTitle')}</TableCell>
                  <TableCell>{t('library.accessionNo')}</TableCell>
                  <TableCell>{t('library.member')}</TableCell>
                  <TableCell>{t('library.issueDate')}</TableCell>
                  <TableCell>{t('library.dueDate')}</TableCell>
                  <TableCell>{t('library.status')}</TableCell>
                  <TableCell align="center">{t('library.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow sx={S.TR_HOVER}>
                    <TableCell colSpan={7} align="center" sx={S.TD}>{t('library.loading')}</TableCell>
                  </TableRow>
                ) : circulations.length === 0 ? (
                  <TableRow sx={S.TR_HOVER}>
                    <TableCell colSpan={7} align="center" sx={S.TD}>{t('library.noIssuedBooks')}</TableCell>
                  </TableRow>
                ) : (
                  circulations.map((circulation) => (
                    <TableRow key={circulation.circulationId} sx={S.TR_HOVER}>
                      <TableCell sx={S.TD}>{circulation.bookTitle}</TableCell>
                      <TableCell sx={S.TD}>{circulation.accessionNumber}</TableCell>
                      <TableCell sx={S.TD}>
                        {circulation.memberName}
                        <Chip
                          label={circulation.memberType}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </TableCell>
                      <TableCell sx={S.TD}>{new Date(circulation.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell sx={S.TD}>{new Date(circulation.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell sx={S.TD}>
                        <Chip
                          label={circulation.status}
                          color={circulation.status === 'overdue' ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center" sx={S.TD}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<RenewIcon />}
                          onClick={() => handleRenew(circulation.circulationId)}
                          sx={{ ...S.BTN_OUTLINE,  mr: 0.5 }}
                        >
                          {t('library.renew')}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined" sx={S.BTN_OUTLINE}
                          startIcon={<ReturnIcon />}
                          onClick={() => openReturnDialog(circulation)}
                        >
                          {t('library.return')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('library.bookTitle')}</TableCell>
                  <TableCell>{t('library.member')}</TableCell>
                  <TableCell>{t('library.dueDate')}</TableCell>
                  <TableCell>{t('library.daysOverdue')}</TableCell>
                  <TableCell align="right">{t('library.fineAmount')}</TableCell>
                  <TableCell align="center">{t('library.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow sx={S.TR_HOVER}>
                    <TableCell colSpan={6} align="center" sx={S.TD}>{t('library.loading')}</TableCell>
                  </TableRow>
                ) : circulations.length === 0 ? (
                  <TableRow sx={S.TR_HOVER}>
                    <TableCell colSpan={6} align="center" sx={S.TD}>{t('library.noOverdueBooks')}</TableCell>
                  </TableRow>
                ) : (
                  circulations.map((circulation) => {
                    const daysOverdue = Math.floor(
                      (new Date().getTime() - new Date(circulation.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <TableRow key={circulation.circulationId} sx={S.TR_HOVER}>
                        <TableCell sx={S.TD}>{circulation.bookTitle}</TableCell>
                        <TableCell sx={S.TD}>{circulation.memberName}</TableCell>
                        <TableCell sx={S.TD}>{new Date(circulation.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell sx={S.TD}>
                          <Chip label={`${daysOverdue} days`} color="error" size="small" />
                        </TableCell>
                        <TableCell align="right" sx={S.TD}>NPR {(daysOverdue * 10).toLocaleString()}</TableCell>
                        <TableCell align="center" sx={S.TD}>
                          <Button
                            size="small"
                            variant="outlined" sx={S.BTN_OUTLINE}
                            startIcon={<ReturnIcon />}
                            onClick={() => openReturnDialog(circulation)}
                          >
                            {t('library.return')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('library.bookTitle')}</TableCell>
                  <TableCell>{t('library.member')}</TableCell>
                  <TableCell>{t('library.issueDate')}</TableCell>
                  <TableCell>{t('library.returnDate')}</TableCell>
                  <TableCell align="right">{t('library.fine')}</TableCell>
                  <TableCell>{t('library.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow sx={S.TR_HOVER}>
                    <TableCell colSpan={6} align="center" sx={S.TD}>{t('library.loading')}</TableCell>
                  </TableRow>
                ) : circulations.length === 0 ? (
                  <TableRow sx={S.TR_HOVER}>
                    <TableCell colSpan={6} align="center" sx={S.TD}>{t('library.noReturnHistory')}</TableCell>
                  </TableRow>
                ) : (
                  circulations.map((circulation) => (
                    <TableRow key={circulation.circulationId} sx={S.TR_HOVER}>
                      <TableCell sx={S.TD}>{circulation.bookTitle}</TableCell>
                      <TableCell sx={S.TD}>{circulation.memberName}</TableCell>
                      <TableCell sx={S.TD}>{new Date(circulation.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell sx={S.TD}>
                        {circulation.returnDate
                          ? new Date(circulation.returnDate).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell align="right" sx={S.TD}>
                        {circulation.fineAmount ? `NPR ${circulation.fineAmount}` : '-'}
                      </TableCell>
                      <TableCell sx={S.TD}>
                        {circulation.fineAmount && !circulation.finePaid ? (
                          <Button
                            size="small"
                            variant="outlined" sx={S.BTN_OUTLINE}
                            color="error"
                            startIcon={<PaymentIcon />}
                            onClick={() => handlePayFine(circulation.circulationId)}
                          >
                            {t('library.payFine')}
                          </Button>
                        ) : (
                          <Chip label={t('library.completed')} color="success" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              size="small"
              label={t('library.bookId')}
              value={reservationBookId}
              onChange={(e) => setReservationBookId(e.target.value)}
              placeholder={t('library.enterBookId')}
              sx={{ width: 160 }}
            />
            <Button variant="contained" sx={S.BTN_PRIMARY} onClick={fetchReservations} disabled={!reservationBookId || reservationsLoading}>
              {t('library.loadReservations')}
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>{t('library.book')}</TableCell>
                  <TableCell>{t('library.student')}</TableCell>
                  <TableCell>{t('library.status')}</TableCell>
                  <TableCell>{t('library.date')}</TableCell>
                  <TableCell align="center">{t('library.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reservationsLoading ? (
                  <TableRow sx={S.TR_HOVER}><TableCell colSpan={6} align="center" sx={S.TD}>{t('library.loading')}</TableCell></TableRow>
                ) : reservations.length === 0 ? (
                  <TableRow sx={S.TR_HOVER}><TableCell colSpan={6} align="center" sx={S.TD}>{t('library.noReservations')}</TableCell></TableRow>
                ) : (
                  reservations.map((r: any) => (
                    <TableRow key={r.reservationId ?? r.id} sx={S.TR_HOVER}>
                      <TableCell sx={S.TD}>{r.reservationId ?? r.id}</TableCell>
                      <TableCell sx={S.TD}>{r.Book?.title ?? r.bookTitle ?? r.bookId}</TableCell>
                      <TableCell sx={S.TD}>{r.Student ? `${r.Student.firstNameEn ?? ''} ${r.Student.lastNameEn ?? ''}`.trim() : r.studentId}</TableCell>
                      <TableCell sx={S.TD}><Chip label={r.status ?? 'pending'} size="small" /></TableCell>
                      <TableCell sx={S.TD}>{r.reservationDate ? new Date(r.reservationDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell align="center" sx={S.TD}>
                        {r.status !== 'cancelled' && r.status !== 'fulfilled' && (
                          <Button size="small" color="error" startIcon={<CancelIcon />} onClick={() => handleCancelReservation(r.reservationId ?? r.id)}>
                            {t('library.cancel')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              size="small"
              label={t('library.studentId')}
              value={finesStudentId}
              onChange={(e) => setFinesStudentId(e.target.value)}
              placeholder={t('library.enterStudentId')}
              sx={{ width: 160 }}
            />
            <Button variant="contained" sx={S.BTN_PRIMARY} onClick={fetchFines} disabled={!finesStudentId || finesLoading}>
              {t('library.loadFines')}
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('library.fineId')}</TableCell>
                  <TableCell>{t('library.amount')}</TableCell>
                  <TableCell>{t('library.balance')}</TableCell>
                  <TableCell>{t('library.reason')}</TableCell>
                  <TableCell>{t('library.status')}</TableCell>
                  <TableCell align="center">{t('library.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {finesLoading ? (
                  <TableRow sx={S.TR_HOVER}><TableCell colSpan={6} align="center" sx={S.TD}>{t('library.loading')}</TableCell></TableRow>
                ) : finesList.length === 0 ? (
                  <TableRow sx={S.TR_HOVER}><TableCell colSpan={6} align="center" sx={S.TD}>{t('library.noFines')}</TableCell></TableRow>
                ) : (
                  finesList.map((f: any) => {
                    const balance = parseFloat(f.balance ?? f.fineAmount ?? 0);
                    const paid = (f.status ?? '').toLowerCase() === 'paid';
                    return (
                      <TableRow key={f.fineId ?? f.id} sx={S.TR_HOVER}>
                        <TableCell sx={S.TD}>{f.fineId ?? f.id}</TableCell>
                        <TableCell sx={S.TD}>NPR {parseFloat(f.fineAmount ?? 0).toLocaleString()}</TableCell>
                        <TableCell sx={S.TD}>NPR {balance.toLocaleString()}</TableCell>
                        <TableCell sx={S.TD}>{f.fineReason ?? '-'}</TableCell>
                        <TableCell sx={S.TD}><Chip label={f.status ?? 'pending'} size="small" color={paid ? 'success' : 'warning'} /></TableCell>
                        <TableCell align="center" sx={S.TD}>
                          {!paid && balance > 0 && (
                            <Button size="small" variant="outlined" sx={S.BTN_OUTLINE} startIcon={<PaymentIcon />} onClick={() => handlePayFineById(f.fineId ?? f.id, balance)}>
                              {t('library.pay')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TablePagination
          component="div"
          count={tabValue < 3 ? total : (tabValue === 3 ? reservations.length : finesList.length)}
          page={tabValue < 3 ? page : 0}
          onPageChange={(_, newPage) => tabValue < 3 && setPage(newPage)}
          rowsPerPage={tabValue < 3 ? rowsPerPage : 10}
          onRowsPerPageChange={(e) => { if (tabValue < 3) { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); } }}
        />
      </Paper>

      {/* Issue Book Dialog */}
      <Dialog open={issueDialog} onClose={() => setIssueDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('library.issueBook')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label={t('library.bookIdAccession')}
                value={issueForm.bookId}
                onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label={t('library.memberType')}
                value={issueForm.memberType}
                onChange={(e) => setIssueForm({ ...issueForm, memberType: e.target.value })}
                required
                fullWidth
              >
                <MenuItem value="student">{t('library.student')}</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('library.memberId')}
                value={issueForm.memberId}
                onChange={(e) => setIssueForm({ ...issueForm, memberId: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('library.dueDate')}
                type="date"
                value={issueForm.dueDate}
                onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueDialog(false)}>{t('library.cancel')}</Button>
          <Button onClick={handleIssueBook} variant="contained" sx={S.BTN_PRIMARY}>
            {t('library.issueBook')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Book Dialog */}
      <Dialog open={returnDialog} onClose={() => setReturnDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('library.returnBook')}</DialogTitle>
        <DialogContent>
          {selectedCirculation && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>{t('library.book')}:</strong> {selectedCirculation.bookTitle}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>{t('library.member')}:</strong> {selectedCirculation.memberName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>{t('library.issueDate')}:</strong> {new Date(selectedCirculation.issueDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>{t('library.dueDate')}:</strong> {new Date(selectedCirculation.dueDate).toLocaleDateString()}
              </Typography>
              {fineAmount > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    <strong>{t('library.fineAmount')}:</strong> NPR {fineAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption">
                    {t('library.finePerDay')}
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialog(false)}>{t('library.cancel')}</Button>
          <Button onClick={handleReturnBook} variant="contained" sx={S.BTN_PRIMARY} color="success">
            {t('library.confirmReturn')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reserve Book Dialog */}
      <Dialog open={reserveDialog} onClose={() => setReserveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('library.reserveBook')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label={t('library.bookId')}
                value={reserveForm.bookId}
                onChange={(e) => setReserveForm({ ...reserveForm, bookId: e.target.value })}
                required
                fullWidth
                type="number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('library.studentId')}
                value={reserveForm.studentId}
                onChange={(e) => setReserveForm({ ...reserveForm, studentId: e.target.value })}
                required
                fullWidth
                type="number"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReserveDialog(false)}>{t('library.cancel')}</Button>
          <Button onClick={handleReserveBook} variant="contained" sx={S.BTN_PRIMARY} disabled={!reserveForm.bookId || !reserveForm.studentId}>
            {t('library.reserveBook')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BookCirculation;

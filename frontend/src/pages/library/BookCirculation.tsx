import { YearSelectableDateField } from '../../components/YearSelectableDatePicker/YearSelectableDatePicker';
/**
 * Book Circulation Management
 * Issue and return books, manage borrowing history
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useAdminStyles } from '../../theme/designTokens';
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
  Autocomplete,
  TextField,
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
import { createIssueBookPayload } from './issueBookPayload';
import { createReserveBookPayload } from './reserveBookPayload';
import { CirculationRow as Circulation, normalizeCirculation } from './circulationRow';
import { calculateOverdueFine, getOverdueDays } from './circulationFine';

interface BookOption {
  bookId: number;
  accessionNumber: string;
  title: string;
  availableCopies: number;
  available_copies?: number;
}

interface StudentOption {
  studentId: number;
  studentCode: string;
  firstNameEn?: string;
  lastNameEn?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface ReservationRow {
  reservationId?: number;
  id?: number;
  book?: { title?: string };
  Book?: { title?: string };
  bookTitle?: string;
  bookId?: number;
  student?: { firstNameEn?: string; lastNameEn?: string };
  Student?: { firstNameEn?: string; lastNameEn?: string };
  studentId?: number;
  status?: string;
  reservationDate?: string;
}

interface FineRow {
  fineId?: number;
  id?: number;
  balance?: string | number;
  fineAmount?: string | number;
  fineReason?: string;
  status?: string;
}

interface ApiErrorPayload {
  message?: string;
  error?: string;
  errors?: Array<{ message?: string }>;
}

function getApiErrorPayload(error: unknown): ApiErrorPayload {
  if (!error || typeof error !== 'object') return {};
  const response = (error as { response?: { data?: unknown } }).response;
  return response?.data && typeof response.data === 'object' ? response.data as ApiErrorPayload : {};
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
  const location = useLocation();
  const navigate = useNavigate();
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
  const [issueBooks, setIssueBooks] = useState<BookOption[]>([]);
  const [issueStudents, setIssueStudents] = useState<StudentOption[]>([]);
  const [selectedIssueBook, setSelectedIssueBook] = useState<BookOption | null>(null);
  const [selectedIssueStudent, setSelectedIssueStudent] = useState<StudentOption | null>(null);
  const [issueBookSearch, setIssueBookSearch] = useState('');
  const [issueStudentSearch, setIssueStudentSearch] = useState('');
  const [issueBooksLoading, setIssueBooksLoading] = useState(false);
  const [issueStudentsLoading, setIssueStudentsLoading] = useState(false);
  const [issueForm, setIssueForm] = useState({ dueDate: '' });

  const closeIssueDialog = () => {
    setIssueDialog(false);
    setSelectedIssueBook(null);
    setSelectedIssueStudent(null);
    setIssueBookSearch('');
    setIssueStudentSearch('');
    setIssueForm({ dueDate: '' });
  };

  useEffect(() => {
    if (!location.state?.openIssueDialog) return;
    void Promise.resolve().then(() => {
      setError('');
      setIssueDialog(true);
      navigate(location.pathname, { replace: true, state: null });
    });
  }, [location.pathname, location.state, navigate]);

  // Return Dialog
  const [returnDialog, setReturnDialog] = useState(false);
  const [selectedCirculation, setSelectedCirculation] = useState<Circulation | null>(null);
  const [fineAmount, setFineAmount] = useState(0);

  // Reservations
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [reservationBookId, setReservationBookId] = useState('');
  const [selectedReservationBook, setSelectedReservationBook] = useState<BookOption | null>(null);
  const [reservationBooks, setReservationBooks] = useState<BookOption[]>([]);
  const [reservationBookSearch, setReservationBookSearch] = useState('');
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reserveDialog, setReserveDialog] = useState(false);
  const [reserveBookOptions, setReserveBookOptions] = useState<BookOption[]>([]);
  const [reserveStudentOptions, setReserveStudentOptions] = useState<StudentOption[]>([]);
  const [reserveBookSearch, setReserveBookSearch] = useState('');
  const [reserveStudentSearch, setReserveStudentSearch] = useState('');
  const [selectedReserveBook, setSelectedReserveBook] = useState<BookOption | null>(null);
  const [selectedReserveStudent, setSelectedReserveStudent] = useState<StudentOption | null>(null);
  const [reserveBooksLoading, setReserveBooksLoading] = useState(false);
  const [reserveStudentsLoading, setReserveStudentsLoading] = useState(false);

  // Fines by student
  const [finesStudentId, setFinesStudentId] = useState('');
  const [finesList, setFinesList] = useState<FineRow[]>([]);
  const [finesLoading, setFinesLoading] = useState(false);

  useEffect(() => {
    if (!issueDialog) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIssueBooksLoading(true);
      try {
        const response = await apiClient.get('/library/books', {
          params: { search: issueBookSearch || undefined, page: 1, limit: 20 },
        });
        const data = response.data?.data;
        const books: BookOption[] = Array.isArray(data) ? data : data?.books || [];
        if (!cancelled) setIssueBooks(books.filter((book) => Number(book.availableCopies ?? book.available_copies) > 0));
      } catch {
        if (!cancelled) setIssueBooks([]);
      } finally {
        if (!cancelled) setIssueBooksLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [issueDialog, issueBookSearch]);

  useEffect(() => {
    if (!issueDialog) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIssueStudentsLoading(true);
      try {
        const response = await apiClient.get('/api/v1/students', {
          params: { search: issueStudentSearch || undefined, page: 1, limit: 20 },
        });
        if (!cancelled) setIssueStudents(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch {
        if (!cancelled) setIssueStudents([]);
      } finally {
        if (!cancelled) setIssueStudentsLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [issueDialog, issueStudentSearch]);

  useEffect(() => {
    if (!reserveDialog && tabValue !== 3) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (reserveDialog) setReserveBooksLoading(true);
      try {
        const response = await apiClient.get('/library/books', {
          params: { search: reservationBookSearch || undefined, page: 1, limit: 20 },
        });
        const data = response.data?.data;
        const books: BookOption[] = Array.isArray(data) ? data : data?.books || [];
        if (!cancelled) {
          setReservationBooks(books);
          setReserveBookOptions(books);
        }
      } catch {
        if (!cancelled) {
          setReservationBooks([]);
          setReserveBookOptions([]);
        }
      } finally {
        if (!cancelled && reserveDialog) setReserveBooksLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reserveDialog, tabValue, reservationBookSearch]);

  useEffect(() => {
    if (!reserveDialog) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setReserveStudentsLoading(true);
      try {
        const response = await apiClient.get('/api/v1/students', {
          params: { search: reserveStudentSearch || undefined, page: 1, limit: 20 },
        });
        if (!cancelled) setReserveStudentOptions(Array.isArray(response.data?.data) ? response.data.data : []);
      } catch {
        if (!cancelled) setReserveStudentOptions([]);
      } finally {
        if (!cancelled) setReserveStudentsLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reserveDialog, reserveStudentSearch]);

  const fetchCirculations = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const status = tabValue === 0 ? 'issued' : tabValue === 1 ? 'overdue' : 'returned';
      const response = await apiClient.get('/library/circulation', {
        params: {
          status,
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      setCirculations(rows.map(normalizeCirculation));
      setTotal(response.data?.meta?.total || 0);
    } catch {
      setCirculations([]);
      setTotal(0);
      setError(t('library.failedToLoadCirculation'));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, t, tabValue]);

  const handleIssueBook = async () => {
    if (!selectedIssueBook || !selectedIssueStudent) {
      setError('Select an available book and a student before issuing.');
      return;
    }
    try {
      const payload = createIssueBookPayload(selectedIssueBook, selectedIssueStudent, issueForm.dueDate);
      await apiClient.post('/library/issue', payload);
      setSuccess(t('library.bookIssuedSuccess'));
      closeIssueDialog();
      fetchCirculations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (requestError: unknown) {
      const responseData = getApiErrorPayload(requestError);
      const validationMessages = Array.isArray(responseData?.errors)
        ? responseData.errors.map((item) => item.message).filter((message): message is string => Boolean(message))
        : [];
      setError(validationMessages.join(' ') || responseData?.message || responseData?.error || t('library.failedToIssueBook'));
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
    } catch (requestError: unknown) {
      setError(getApiErrorPayload(requestError).message || t('library.failedToReturnBook'));
    }
  };

  const handlePayFine = async (circulationId: number) => {
    try {
      await apiClient.post(`/library/pay-fine/${circulationId}`);
      setSuccess(t('library.finePaidSuccess'));
      fetchCirculations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (requestError: unknown) {
      setError(getApiErrorPayload(requestError).message || t('library.failedToProcessPayment'));
    }
  };

  const handleRenew = async (circulationId: number) => {
    try {
      await apiClient.post('/library/renew', { circulationId });
      setSuccess(t('library.bookRenewedSuccess'));
      fetchCirculations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (requestError: unknown) {
      setError(getApiErrorPayload(requestError).message || t('library.failedToRenewBook'));
    }
  };

  const fetchReservations = useCallback(async () => {
    if (!reservationBookId) return;
    setReservationsLoading(true);
    try {
      const res = await apiClient.get('/library/reservations', { params: { bookId: reservationBookId } });
      setReservations(Array.isArray(res.data?.data) ? res.data.data as ReservationRow[] : []);
    } catch {
      setReservations([]);
    } finally {
      setReservationsLoading(false);
    }
  }, [reservationBookId]);

  useEffect(() => {
    if (tabValue < 3) void Promise.resolve().then(fetchCirculations);
    else if (tabValue === 3 && reservationBookId) void Promise.resolve().then(fetchReservations);
  }, [fetchCirculations, fetchReservations, page, reservationBookId, rowsPerPage, tabValue]);

  const handleCancelReservation = async (reservationId: number) => {
    try {
      await apiClient.put(`/library/reservations/${reservationId}/cancel`, { reason: 'Cancelled by staff' });
      setSuccess(t('library.reservationCancelled'));
      fetchReservations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (requestError: unknown) {
      setError(getApiErrorPayload(requestError).message || t('library.failedToCancelReservation'));
    }
  };

  const handleReserveBook = async () => {
    try {
      await apiClient.post('/library/reserve', {
        ...createReserveBookPayload(selectedReserveBook!, selectedReserveStudent!),
      });
      setSuccess(t('library.bookReservedSuccess'));
      setReserveDialog(false);
      setSelectedReserveBook(null);
      setSelectedReserveStudent(null);
      if (reservationBookId) fetchReservations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (requestError: unknown) {
      const responseData = getApiErrorPayload(requestError);
      setError(responseData.error || responseData.message || t('library.failedToReserveBook'));
    }
  };

  const fetchFines = async () => {
    if (!/^[1-9]\d*$/.test(finesStudentId)) return;
    setFinesLoading(true);
    try {
      const res = await apiClient.get(`/library/fines/${finesStudentId}`);
      setFinesList(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (requestError: unknown) {
      setFinesList([]);
      setError(getApiErrorPayload(requestError).message || t('library.failedToFetchFines'));
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
    } catch (requestError: unknown) {
      setError(getApiErrorPayload(requestError).message || t('library.failedToProcessPayment'));
    }
  };

  const openReturnDialog = (circulation: Circulation) => {
    setSelectedCirculation(circulation);
    setFineAmount(circulation.status === 'overdue' ? calculateOverdueFine(circulation.dueDate) : 0);
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
              onClick={() => {
                setError('');
                setSelectedReserveBook(null);
                setSelectedReserveStudent(null);
                setReserveBookSearch('');
                setReserveStudentSearch('');
                setReserveDialog(true);
              }}
            >
              {t('library.reserveBook')}
            </Button>
            <Button
              variant="contained"
              startIcon={<IssueIcon />}
              onClick={() => { setError(''); setIssueDialog(true); }}
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
                    <TableCell colSpan={7} align="center" sx={S.TD}>{error ? t('library.circulationUnavailable') : t('library.noIssuedBooks')}</TableCell>
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
                    <TableCell colSpan={6} align="center" sx={S.TD}>{error ? t('library.circulationUnavailable') : t('library.noOverdueBooks')}</TableCell>
                  </TableRow>
                ) : (
                  circulations.map((circulation) => {
                    const daysOverdue = getOverdueDays(circulation.dueDate);
                    return (
                      <TableRow key={circulation.circulationId} sx={S.TR_HOVER}>
                        <TableCell sx={S.TD}>{circulation.bookTitle}</TableCell>
                        <TableCell sx={S.TD}>{circulation.memberName}</TableCell>
                        <TableCell sx={S.TD}>{new Date(circulation.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell sx={S.TD}>
                          <Chip label={`${daysOverdue} days`} color="error" size="small" />
                        </TableCell>
                        <TableCell align="right" sx={S.TD}>NPR {calculateOverdueFine(circulation.dueDate).toLocaleString()}</TableCell>
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
            <Autocomplete
              size="small"
              options={reservationBooks}
              value={selectedReservationBook}
              inputValue={reservationBookSearch}
              loading={reserveBooksLoading}
              getOptionLabel={(book) => `${book.title} (${book.accessionNumber})`}
              isOptionEqualToValue={(option, value) => option.bookId === value.bookId}
              onInputChange={(_, value, reason) => {
                setReservationBookSearch(value);
                if (reason === 'input' || reason === 'clear') {
                  setReservationBookId('');
                  setSelectedReservationBook(null);
                }
              }}
              onChange={(_, book) => {
                setReservationBookId(book ? String(book.bookId) : '');
                setSelectedReservationBook(book);
                setReservationBookSearch(book ? `${book.title} (${book.accessionNumber})` : '');
              }}
              renderInput={(params) => <TextField {...params} label={t('library.book')} />}
              sx={{ width: 360 }}
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
                  reservations.map((r) => {
                    const reservationId = r.reservationId ?? r.id;
                    return (
                      <TableRow key={reservationId ?? `${r.bookId}-${r.studentId}`} sx={S.TR_HOVER}>
                        <TableCell sx={S.TD}>{reservationId}</TableCell>
                        <TableCell sx={S.TD}>{r.book?.title ?? r.Book?.title ?? r.bookTitle ?? r.bookId}</TableCell>
                        <TableCell sx={S.TD}>{r.student ? `${r.student.firstNameEn ?? ''} ${r.student.lastNameEn ?? ''}`.trim() : r.Student ? `${r.Student.firstNameEn ?? ''} ${r.Student.lastNameEn ?? ''}`.trim() : r.studentId}</TableCell>
                        <TableCell sx={S.TD}><Chip label={r.status ?? 'pending'} size="small" /></TableCell>
                        <TableCell sx={S.TD}>{r.reservationDate ? new Date(r.reservationDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell align="center" sx={S.TD}>
                          {r.status !== 'cancelled' && r.status !== 'fulfilled' && reservationId !== undefined && (
                            <Button size="small" color="error" startIcon={<CancelIcon />} onClick={() => handleCancelReservation(reservationId)}>
                              {t('library.cancel')}
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

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              size="small"
              label={t('library.studentId')}
              type="number"
              inputProps={{ min: 1, step: 1 }}
              value={finesStudentId}
              onChange={(e) => setFinesStudentId(e.target.value)}
              placeholder={t('library.enterStudentId')}
              sx={{ width: 160 }}
            />
            <Button variant="contained" sx={S.BTN_PRIMARY} onClick={fetchFines} disabled={!/^[1-9]\d*$/.test(finesStudentId) || finesLoading}>
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
                  finesList.map((f) => {
                    const balance = Number(f.balance ?? f.fineAmount ?? 0);
                    const fineAmountValue = Number(f.fineAmount ?? 0);
                    const fineId = f.fineId ?? f.id;
                    const paid = (f.status ?? '').toLowerCase() === 'paid';
                    return (
                      <TableRow key={fineId ?? 'unknown-fine'} sx={S.TR_HOVER}>
                        <TableCell sx={S.TD}>{fineId}</TableCell>
                        <TableCell sx={S.TD}>NPR {fineAmountValue.toLocaleString()}</TableCell>
                        <TableCell sx={S.TD}>NPR {balance.toLocaleString()}</TableCell>
                        <TableCell sx={S.TD}>{f.fineReason ?? '-'}</TableCell>
                        <TableCell sx={S.TD}><Chip label={f.status ?? 'pending'} size="small" color={paid ? 'success' : 'warning'} /></TableCell>
                        <TableCell align="center" sx={S.TD}>
                          {!paid && balance > 0 && fineId !== undefined && (
                            <Button size="small" variant="outlined" sx={S.BTN_OUTLINE} startIcon={<PaymentIcon />} onClick={() => handlePayFineById(fineId, balance)}>
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
          rowsPerPageOptions={[10, 20, 50, 100]}
          onRowsPerPageChange={(e) => { if (tabValue < 3) { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); } }}
        />
      </Paper>

      {/* Issue Book Dialog */}
      <Dialog open={issueDialog} onClose={closeIssueDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{t('library.issueBook')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={issueBooks}
                value={selectedIssueBook}
                loading={issueBooksLoading}
                getOptionLabel={(book) => `${book.title} · ${book.accessionNumber}`}
                isOptionEqualToValue={(option, value) => option.bookId === value.bookId}
                onChange={(_, book) => setSelectedIssueBook(book)}
                onInputChange={(_, value, reason) => { if (reason === 'input' || reason === 'clear') setIssueBookSearch(value); }}
                noOptionsText={issueBooksLoading ? 'Loading books…' : 'No available books found'}
                renderInput={(params) => <TextField {...params} label="Available book" required />}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={issueStudents}
                value={selectedIssueStudent}
                loading={issueStudentsLoading}
                getOptionLabel={(student) => `${[student.firstNameEn, student.lastNameEn].filter(Boolean).join(' ')} · ${student.studentCode}`}
                isOptionEqualToValue={(option, value) => option.studentId === value.studentId}
                onChange={(_, student) => setSelectedIssueStudent(student)}
                onInputChange={(_, value, reason) => { if (reason === 'input' || reason === 'clear') setIssueStudentSearch(value); }}
                noOptionsText={issueStudentsLoading ? 'Searching students…' : 'No students found'}
                renderInput={(params) => <TextField {...params} label={t('library.student')} required />}
              />
            </Grid>
            <Grid item xs={12}>
              <YearSelectableDateField
                label={t('library.dueDate')}
                value={issueForm.dueDate}
                onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeIssueDialog}>{t('library.cancel')}</Button>
          <Button onClick={handleIssueBook} variant="contained" sx={S.BTN_PRIMARY} disabled={!selectedIssueBook || !selectedIssueStudent}>
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
              <Autocomplete
                options={reserveBookOptions.filter((book) => Number(book.availableCopies) <= 0)}
                value={selectedReserveBook}
                inputValue={reserveBookSearch}
                loading={reserveBooksLoading}
                getOptionLabel={(book) => `${book.title} (${book.accessionNumber})`}
                isOptionEqualToValue={(option, value) => option.bookId === value.bookId}
                onInputChange={(_, value, reason) => {
                  setReserveBookSearch(value);
                  if (reason === 'input' || reason === 'clear') {
                    setSelectedReserveBook(null);
                  }
                }}
                onChange={(_, book) => {
                  setSelectedReserveBook(book);
                }}
                noOptionsText={reserveBooksLoading ? t('library.loading') : 'No unavailable books found'}
                renderInput={(params) => <TextField {...params} label={t('library.book')} required />}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={reserveStudentOptions}
                value={selectedReserveStudent}
                inputValue={reserveStudentSearch}
                loading={reserveStudentsLoading}
                getOptionLabel={(student) => `${[student.firstNameEn, student.lastNameEn].filter(Boolean).join(' ')} (${student.studentCode})`}
                isOptionEqualToValue={(option, value) => option.studentId === value.studentId}
                onInputChange={(_, value, reason) => {
                  setReserveStudentSearch(value);
                  if (reason === 'input' || reason === 'clear') {
                    setSelectedReserveStudent(null);
                  }
                }}
                onChange={(_, student) => {
                  setSelectedReserveStudent(student);
                }}
                renderInput={(params) => <TextField {...params} label={t('library.student')} required />}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReserveDialog(false)}>{t('library.cancel')}</Button>
          <Button onClick={handleReserveBook} variant="contained" sx={S.BTN_PRIMARY} disabled={!selectedReserveBook || !selectedReserveStudent}>
            {t('library.reserveBook')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BookCirculation;

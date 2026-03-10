/**
 * Book Circulation Management
 * Issue and return books, manage borrowing history
 */

import { useState, useEffect } from 'react';
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
import api from '../../config/api';

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
      const response = await api.get('/library/circulation', {
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
      await api.post('/library/issue', issueForm);
      setSuccess('Book issued successfully');
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
      setError(err.response?.data?.message || 'Failed to issue book');
    }
  };

  const handleReturnBook = async () => {
    if (!selectedCirculation) return;

    try {
      await api.post(`/library/return/${selectedCirculation.circulationId}`, {
        fineAmount,
      });
      setSuccess('Book returned successfully');
      setReturnDialog(false);
      setSelectedCirculation(null);
      fetchCirculations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to return book');
    }
  };

  const handlePayFine = async (circulationId: number) => {
    try {
      await api.post(`/library/pay-fine/${circulationId}`);
      setSuccess('Fine paid successfully');
      fetchCirculations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process payment');
    }
  };

  const handleRenew = async (circulationId: number) => {
    try {
      await api.post('/library/renew', { circulationId });
      setSuccess('Book renewed successfully');
      fetchCirculations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to renew book');
    }
  };

  const fetchReservations = async () => {
    if (!reservationBookId) return;
    setReservationsLoading(true);
    try {
      const res = await api.get('/library/reservations', { params: { bookId: reservationBookId } });
      setReservations(res.data?.data ?? []);
    } catch {
      setReservations([]);
    } finally {
      setReservationsLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    try {
      await api.put(`/library/reservations/${reservationId}/cancel`, { reason: 'Cancelled by staff' });
      setSuccess('Reservation cancelled');
      fetchReservations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  const handleReserveBook = async () => {
    try {
      await api.post('/library/reserve', {
        bookId: parseInt(reserveForm.bookId, 10),
        studentId: parseInt(reserveForm.studentId, 10),
      });
      setSuccess('Book reserved successfully');
      setReserveDialog(false);
      setReserveForm({ bookId: '', studentId: '' });
      if (reservationBookId) fetchReservations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reserve book');
    }
  };

  const fetchFines = async () => {
    if (!finesStudentId) return;
    setFinesLoading(true);
    try {
      const res = await api.get(`/library/fines/${finesStudentId}`);
      setFinesList(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setFinesList([]);
    } finally {
      setFinesLoading(false);
    }
  };

  const handlePayFineById = async (fineId: number, amount: number) => {
    try {
      await api.post(`/library/fines/${fineId}/pay`, {
        amount: Math.max(0.01, amount),
        paymentMethod: 'cash',
      });
      setSuccess('Fine paid successfully');
      fetchFines();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to pay fine');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Book Circulation
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ReserveIcon />}
            onClick={() => setReserveDialog(true)}
          >
            Reserve Book
          </Button>
          <Button
            variant="contained"
            startIcon={<IssueIcon />}
            onClick={() => setIssueDialog(true)}
          >
            Issue Book
          </Button>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Issued Books" />
          <Tab label="Overdue Books" />
          <Tab label="Return History" />
          <Tab label="Reservations" />
          <Tab label="Fines by Student" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Book Title</TableCell>
                  <TableCell>Accession No.</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Loading...</TableCell>
                  </TableRow>
                ) : circulations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No issued books</TableCell>
                  </TableRow>
                ) : (
                  circulations.map((circulation) => (
                    <TableRow key={circulation.circulationId}>
                      <TableCell>{circulation.bookTitle}</TableCell>
                      <TableCell>{circulation.accessionNumber}</TableCell>
                      <TableCell>
                        {circulation.memberName}
                        <Chip
                          label={circulation.memberType}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </TableCell>
                      <TableCell>{new Date(circulation.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(circulation.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={circulation.status}
                          color={circulation.status === 'overdue' ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<RenewIcon />}
                          onClick={() => handleRenew(circulation.circulationId)}
                          sx={{ mr: 0.5 }}
                        >
                          Renew
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ReturnIcon />}
                          onClick={() => openReturnDialog(circulation)}
                        >
                          Return
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
              <TableHead>
                <TableRow>
                  <TableCell>Book Title</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Days Overdue</TableCell>
                  <TableCell align="right">Fine Amount</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Loading...</TableCell>
                  </TableRow>
                ) : circulations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No overdue books</TableCell>
                  </TableRow>
                ) : (
                  circulations.map((circulation) => {
                    const daysOverdue = Math.floor(
                      (new Date().getTime() - new Date(circulation.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <TableRow key={circulation.circulationId}>
                        <TableCell>{circulation.bookTitle}</TableCell>
                        <TableCell>{circulation.memberName}</TableCell>
                        <TableCell>{new Date(circulation.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip label={`${daysOverdue} days`} color="error" size="small" />
                        </TableCell>
                        <TableCell align="right">NPR {(daysOverdue * 10).toLocaleString()}</TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ReturnIcon />}
                            onClick={() => openReturnDialog(circulation)}
                          >
                            Return
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
              <TableHead>
                <TableRow>
                  <TableCell>Book Title</TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell>Issue Date</TableCell>
                  <TableCell>Return Date</TableCell>
                  <TableCell align="right">Fine</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Loading...</TableCell>
                  </TableRow>
                ) : circulations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No return history</TableCell>
                  </TableRow>
                ) : (
                  circulations.map((circulation) => (
                    <TableRow key={circulation.circulationId}>
                      <TableCell>{circulation.bookTitle}</TableCell>
                      <TableCell>{circulation.memberName}</TableCell>
                      <TableCell>{new Date(circulation.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {circulation.returnDate
                          ? new Date(circulation.returnDate).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {circulation.fineAmount ? `NPR ${circulation.fineAmount}` : '-'}
                      </TableCell>
                      <TableCell>
                        {circulation.fineAmount && !circulation.finePaid ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<PaymentIcon />}
                            onClick={() => handlePayFine(circulation.circulationId)}
                          >
                            Pay Fine
                          </Button>
                        ) : (
                          <Chip label="Completed" color="success" size="small" />
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
              label="Book ID"
              value={reservationBookId}
              onChange={(e) => setReservationBookId(e.target.value)}
              placeholder="Enter book ID"
              sx={{ width: 160 }}
            />
            <Button variant="contained" onClick={fetchReservations} disabled={!reservationBookId || reservationsLoading}>
              Load Reservations
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Book</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reservationsLoading ? (
                  <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
                ) : reservations.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">No reservations (enter Book ID and Load)</TableCell></TableRow>
                ) : (
                  reservations.map((r: any) => (
                    <TableRow key={r.reservationId ?? r.id}>
                      <TableCell>{r.reservationId ?? r.id}</TableCell>
                      <TableCell>{r.Book?.title ?? r.bookTitle ?? r.bookId}</TableCell>
                      <TableCell>{r.Student ? `${r.Student.firstNameEn ?? ''} ${r.Student.lastNameEn ?? ''}`.trim() : r.studentId}</TableCell>
                      <TableCell><Chip label={r.status ?? 'pending'} size="small" /></TableCell>
                      <TableCell>{r.reservationDate ? new Date(r.reservationDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell align="center">
                        {r.status !== 'cancelled' && r.status !== 'fulfilled' && (
                          <Button size="small" color="error" startIcon={<CancelIcon />} onClick={() => handleCancelReservation(r.reservationId ?? r.id)}>
                            Cancel
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
              label="Student ID"
              value={finesStudentId}
              onChange={(e) => setFinesStudentId(e.target.value)}
              placeholder="Enter student ID"
              sx={{ width: 160 }}
            />
            <Button variant="contained" onClick={fetchFines} disabled={!finesStudentId || finesLoading}>
              Load Fines
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fine ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {finesLoading ? (
                  <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
                ) : finesList.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">No fines (enter Student ID and Load)</TableCell></TableRow>
                ) : (
                  finesList.map((f: any) => {
                    const balance = parseFloat(f.balance ?? f.fineAmount ?? 0);
                    const paid = (f.status ?? '').toLowerCase() === 'paid';
                    return (
                      <TableRow key={f.fineId ?? f.id}>
                        <TableCell>{f.fineId ?? f.id}</TableCell>
                        <TableCell>NPR {parseFloat(f.fineAmount ?? 0).toLocaleString()}</TableCell>
                        <TableCell>NPR {balance.toLocaleString()}</TableCell>
                        <TableCell>{f.fineReason ?? '-'}</TableCell>
                        <TableCell><Chip label={f.status ?? 'pending'} size="small" color={paid ? 'success' : 'warning'} /></TableCell>
                        <TableCell align="center">
                          {!paid && balance > 0 && (
                            <Button size="small" variant="outlined" startIcon={<PaymentIcon />} onClick={() => handlePayFineById(f.fineId ?? f.id, balance)}>
                              Pay
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
        <DialogTitle>Issue Book</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Book ID / Accession Number"
                value={issueForm.bookId}
                onChange={(e) => setIssueForm({ ...issueForm, bookId: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Member Type"
                value={issueForm.memberType}
                onChange={(e) => setIssueForm({ ...issueForm, memberType: e.target.value })}
                required
                fullWidth
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Member ID"
                value={issueForm.memberId}
                onChange={(e) => setIssueForm({ ...issueForm, memberId: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Due Date"
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
          <Button onClick={() => setIssueDialog(false)}>Cancel</Button>
          <Button onClick={handleIssueBook} variant="contained">
            Issue Book
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Book Dialog */}
      <Dialog open={returnDialog} onClose={() => setReturnDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Return Book</DialogTitle>
        <DialogContent>
          {selectedCirculation && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Book:</strong> {selectedCirculation.bookTitle}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Member:</strong> {selectedCirculation.memberName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Issue Date:</strong> {new Date(selectedCirculation.issueDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Due Date:</strong> {new Date(selectedCirculation.dueDate).toLocaleDateString()}
              </Typography>
              {fineAmount > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body1">
                    <strong>Fine Amount:</strong> NPR {fineAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption">
                    (NPR 10 per day overdue)
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialog(false)}>Cancel</Button>
          <Button onClick={handleReturnBook} variant="contained" color="success">
            Confirm Return
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reserve Book Dialog */}
      <Dialog open={reserveDialog} onClose={() => setReserveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reserve Book</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Book ID"
                value={reserveForm.bookId}
                onChange={(e) => setReserveForm({ ...reserveForm, bookId: e.target.value })}
                required
                fullWidth
                type="number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Student ID"
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
          <Button onClick={() => setReserveDialog(false)}>Cancel</Button>
          <Button onClick={handleReserveBook} variant="contained" disabled={!reserveForm.bookId || !reserveForm.studentId}>
            Reserve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BookCirculation;

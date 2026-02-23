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

  useEffect(() => {
    fetchCirculations();
  }, [tabValue, page, rowsPerPage]);

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
        <Button
          variant="contained"
          startIcon={<IssueIcon />}
          onClick={() => setIssueDialog(true)}
        >
          Issue Book
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Issued Books" />
          <Tab label="Overdue Books" />
          <Tab label="Return History" />
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

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
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
    </Box>
  );
}

export default BookCirculation;

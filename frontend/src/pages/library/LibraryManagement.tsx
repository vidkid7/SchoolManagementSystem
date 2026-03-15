/**
 * Library Management Page
 * 
 * Manage book circulation, fines, and reservations
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
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tabs,
  Tab,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Book as BookIcon,
  Assignment as IssueIcon,
  AssignmentReturn as ReturnIcon,
  Payment as PaymentIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

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

interface Book {
  id: number;
  accession_number: string;
  title: string;
  author: string;
  isbn?: string;
  category: string;
  total_copies: number;
  available_copies: number;
}

interface Circulation {
  id: number;
  student_name: string;
  book_title: string;
  issue_date: string;
  due_date: string;
  return_date?: string;
  status: 'issued' | 'returned' | 'overdue';
  fine_amount?: number;
}

export const LibraryManagement = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [tabValue, setTabValue] = useState(0);
  const [books, setBooks] = useState<Book[]>([]);
  const [circulations, setCirculations] = useState<Circulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Issue/Return Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');

  useEffect(() => {
    if (tabValue === 0) {
      fetchBooks();
    } else {
      fetchCirculations();
    }
  }, [tabValue, page, rowsPerPage, search]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
      });

      const response = await apiClient.get(`/api/v1/library/books?${params}`);
      const result = response.data?.data;
      setBooks(result?.books || []);
      setTotal(result?.total || 0);
    } catch (error) {
      // Silently handle error - set empty arrays as fallback
      setBooks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCirculations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        status: 'issued',
      });

      const response = await apiClient.get(`/api/v1/library/circulation?${params}`);
      setCirculations(response.data?.data || []);
      setTotal(response.data?.meta?.total || response.data?.total || 0);
    } catch (error) {
      // Silently handle error - set empty arrays as fallback
      setCirculations([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedStudentId('');
    setSelectedBookId('');
  };

  const handleIssueBook = async () => {
    try {
      await apiClient.post('/api/v1/library/issue', {
        student_id: selectedStudentId,
        book_id: selectedBookId,
      });

      setSuccess(t('library.bookIssuedSuccess'));
      handleCloseDialog();
      fetchBooks();
      fetchCirculations();
    } catch (error: any) {
      console.error('Failed to issue book:', error);
      setError(error.response?.data?.message || t('library.failedToIssueBook'));
    }
  };

  const handleReturnBook = async (circulationId: number) => {
    try {
      await apiClient.post('/api/v1/library/return', {
        circulation_id: circulationId,
      });

      setSuccess(t('library.bookReturnedSuccess'));
      fetchCirculations();
      fetchBooks();
    } catch (error: any) {
      console.error('Failed to return book:', error);
      setError(error.response?.data?.message || t('library.failedToReturnBook'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued': return 'primary';
      case 'returned': return 'success';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('library.libraryManagement')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<IssueIcon />}
            onClick={handleOpenDialog}
          >
            {t('library.issueBook')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => alert(t('library.addBook'))}
            sx={S.BTN_PRIMARY}
          >
            {t('library.addBook')}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={S.GLASS}>
            <CardContent>
              <Typography variant="h4" color="primary">
                {(books || []).reduce((sum, book) => sum + book.total_copies, 0)}
              </Typography>
              <Typography variant="caption">
                {t('library.totalBooks')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={S.GLASS}>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {(books || []).reduce((sum, book) => sum + book.available_copies, 0)}
              </Typography>
              <Typography variant="caption">
                {t('library.available')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={S.GLASS}>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {(circulations || []).filter(c => c.status === 'issued').length}
              </Typography>
              <Typography variant="caption">
                {t('library.issued')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={S.GLASS}>
            <CardContent>
              <Typography variant="h4" color="error.main">
                {(circulations || []).filter(c => c.status === 'overdue').length}
              </Typography>
              <Typography variant="caption">
                {t('library.overdue')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={S.GLASS}>
        <Tabs value={tabValue} onChange={(_e, newValue) => setTabValue(newValue)}>
          <Tab icon={<BookIcon />} label={t('library.books')} />
          <Tab icon={<IssueIcon />} label={t('library.issuedBooks')} />
        </Tabs>

        {/* Books Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <TextField
              label={t('library.searchBooks')}
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                endAdornment: <SearchIcon />,
              }}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('library.accessionNo')}</TableCell>
                  <TableCell>{t('library.bookTitle')}</TableCell>
                  <TableCell>{t('library.author')}</TableCell>
                  <TableCell>{t('library.category')}</TableCell>
                  <TableCell align="center">{t('library.totalCopies')}</TableCell>
                  <TableCell align="center">{t('library.available')}</TableCell>
                  <TableCell align="center">{t('library.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {t('library.loading')}
                    </TableCell>
                  </TableRow>
                ) : books.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {t('library.noBooksFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  (books || []).map((book) => (
                    <TableRow key={book.id} hover>
                      <TableCell>{book.accession_number}</TableCell>
                      <TableCell>{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.category}</TableCell>
                      <TableCell align="center">{book.total_copies}</TableCell>
                      <TableCell align="center">
                        <Typography
                          color={book.available_copies === 0 ? 'error' : 'success'}
                          fontWeight="bold"
                        >
                          {book.available_copies}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={book.available_copies > 0 ? t('library.available') : t('library.notAvailable')}
                          color={book.available_copies > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TabPanel>

        {/* Issued Books Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('library.student')}</TableCell>
                  <TableCell>{t('library.book')}</TableCell>
                  <TableCell>{t('library.issueDate')}</TableCell>
                  <TableCell>{t('library.dueDate')}</TableCell>
                  <TableCell>{t('library.status')}</TableCell>
                  <TableCell>{t('library.fine')}</TableCell>
                  <TableCell align="right">{t('library.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {t('library.loading')}
                    </TableCell>
                  </TableRow>
                ) : circulations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {t('library.noIssuedBooks')}
                    </TableCell>
                  </TableRow>
                ) : (
                  (circulations || []).map((circulation) => (
                    <TableRow key={circulation.id} hover>
                      <TableCell>{circulation.student_name}</TableCell>
                      <TableCell>{circulation.book_title}</TableCell>
                      <TableCell>{circulation.issue_date}</TableCell>
                      <TableCell>{circulation.due_date}</TableCell>
                      <TableCell>
                        <Chip
                          label={circulation.status}
                          color={getStatusColor(circulation.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {circulation.fine_amount ? (
                          <Typography color="error">
                            रू {circulation.fine_amount}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleReturnBook(circulation.id)}
                          title={t('library.returnBook')}
                        >
                          <ReturnIcon />
                        </IconButton>
                        {circulation.fine_amount && circulation.fine_amount > 0 && (
                          <IconButton
                            size="small"
                            color="success"
                            title={t('library.payFine')}
                          >
                            <PaymentIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 20, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TabPanel>
      </Paper>

      {/* Issue Book Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('library.issueBook')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label={t('library.studentId')}
                fullWidth
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                placeholder={t('library.enterStudentId')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('library.bookAccessionNumber')}
                fullWidth
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                placeholder={t('library.enterAccessionNumber')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('library.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleIssueBook}
            disabled={!selectedStudentId || !selectedBookId}
          >
            {t('library.issueBook')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/**
 * Book Catalog Management
 * Add, update, delete books in the library catalog
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
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface Book {
  bookId: number;
  accessionNumber: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  category: string;
  totalCopies: number;
  availableCopies: number;
  location?: string;
  price?: number;
}

export function BookCatalog() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    accessionNumber: '',
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publicationYear: '',
    category: '',
    totalCopies: '1',
    location: '',
    price: '',
  });

  useEffect(() => {
    fetchBooks();
  }, [page, rowsPerPage, search, categoryFilter]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;

      const response = await apiClient.get('/library/books', { params });
      const respData = response.data?.data;
      setBooks(Array.isArray(respData) ? respData : (respData?.books || []));
      setTotal(respData?.total || response.data?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch books:', err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        accessionNumber: book.accessionNumber,
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        publisher: book.publisher || '',
        publicationYear: book.publicationYear?.toString() || '',
        category: book.category,
        totalCopies: book.totalCopies.toString(),
        location: book.location || '',
        price: book.price?.toString() || '',
      });
    } else {
      setEditingBook(null);
      setFormData({
        accessionNumber: '',
        title: '',
        author: '',
        isbn: '',
        publisher: '',
        publicationYear: '',
        category: '',
        totalCopies: '1',
        location: '',
        price: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBook(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      if (editingBook) {
        await apiClient.put(`/library/books/${editingBook.bookId}`, formData);
        setSuccess(t('library.bookUpdatedSuccess'));
      } else {
        await apiClient.post('/library/books', formData);
        setSuccess(t('library.bookAddedSuccess'));
      }
      handleCloseDialog();
      fetchBooks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('library.failedToSaveBook'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('library.confirmDeleteBook'))) return;

    try {
      await apiClient.delete(`/library/books/${id}`);
      setSuccess(t('library.bookDeletedSuccess'));
      fetchBooks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || t('library.failedToDeleteBook'));
    }
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            {t('library.bookCatalog')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={S.BTN_PRIMARY}
          >
            {t('library.addBook')}
          </Button>
        </Box>
      </Paper>

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper sx={{ ...S.GLASS, p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder={t('library.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label={t('library.category')}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">{t('library.allCategories')}</MenuItem>
              <MenuItem value="Fiction">{t('library.fiction')}</MenuItem>
              <MenuItem value="Non-Fiction">{t('library.nonFiction')}</MenuItem>
              <MenuItem value="Science">{t('library.science')}</MenuItem>
              <MenuItem value="History">{t('library.history')}</MenuItem>
              <MenuItem value="Reference">{t('library.reference')}</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={S.GLASS}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>{t('library.accessionNo')}</TableCell>
                <TableCell>{t('library.bookTitle')}</TableCell>
                <TableCell>{t('library.author')}</TableCell>
                <TableCell>{t('library.category')}</TableCell>
                <TableCell>{t('library.isbn')}</TableCell>
                <TableCell align="center">{t('library.totalCopies')}</TableCell>
                <TableCell align="center">{t('library.available')}</TableCell>
                <TableCell align="center">{t('library.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={8} align="center" sx={S.TD}>{t('library.loading')}</TableCell>
                </TableRow>
              ) : books.length === 0 ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={8} align="center" sx={S.TD}>
                    {t('library.noBooksFoundAdd')}
                  </TableCell>
                </TableRow>
              ) : (
                books.map((book) => (
                  <TableRow key={book.bookId} sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{book.accessionNumber}</TableCell>
                    <TableCell sx={S.TD}>{book.title}</TableCell>
                    <TableCell sx={S.TD}>{book.author}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip label={book.category} size="small" />
                    </TableCell>
                    <TableCell sx={S.TD}>{book.isbn || '-'}</TableCell>
                    <TableCell align="center" sx={S.TD}>{book.totalCopies}</TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <Chip
                        label={book.availableCopies}
                        size="small"
                        color={book.availableCopies > 0 ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(book)}
                        title={t('library.edit')}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(book.bookId)}
                        title={t('library.delete')}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBook ? t('library.editBook') : t('library.addNewBook')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('library.accessionNumber')}
                value={formData.accessionNumber}
                onChange={(e) => setFormData({ ...formData, accessionNumber: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('library.isbn')}
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t('library.bookTitle')}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('library.author')}
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('library.publisher')}
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label={t('library.publicationYear')}
                type="number"
                value={formData.publicationYear}
                onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label={t('library.category')}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                fullWidth
              >
                <MenuItem value="Fiction">{t('library.fiction')}</MenuItem>
                <MenuItem value="Non-Fiction">{t('library.nonFiction')}</MenuItem>
                <MenuItem value="Science">{t('library.science')}</MenuItem>
                <MenuItem value="History">{t('library.history')}</MenuItem>
                <MenuItem value="Reference">{t('library.reference')}</MenuItem>
                <MenuItem value="Textbook">{t('library.textbook')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label={t('library.totalCopies')}
                type="number"
                value={formData.totalCopies}
                onChange={(e) => setFormData({ ...formData, totalCopies: e.target.value })}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('library.locationShelf')}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('library.priceNPR')}
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                fullWidth
              />
            </Grid>
          </Grid>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('library.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" sx={S.BTN_PRIMARY}>
            {editingBook ? t('library.update') : t('library.addBook')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BookCatalog;

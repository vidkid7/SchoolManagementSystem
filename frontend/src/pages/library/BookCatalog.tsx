/**
 * Book Catalog Management
 * Add, update, delete books in the library catalog
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { BookFormErrors, BookFormValues, validateBookForm } from './bookFormValidation';

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

interface BookCategory {
  categoryId: number;
  name: string;
}

const toNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizeBook = (book: any): Book => ({
  bookId: toNumber(book?.bookId ?? book?.id),
  accessionNumber: book?.accessionNumber ?? book?.accession_number ?? '',
  title: book?.title ?? '',
  author: book?.author ?? '',
  isbn: book?.isbn ?? '',
  publisher: book?.publisher ?? '',
  publicationYear: book?.publicationYear ?? book?.publication_year,
  category: book?.category ?? '',
  totalCopies: toNumber(book?.totalCopies ?? book?.total_copies ?? book?.copies, 1),
  availableCopies: toNumber(book?.availableCopies ?? book?.available_copies),
  location: book?.location ?? '',
  price: book?.price,
});

export function BookCatalog({ initialAddDialogOpen = false }: { initialAddDialogOpen?: boolean } = {}) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [openDialog, setOpenDialog] = useState(initialAddDialogOpen);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<BookFormErrors>({});
  const bookRequestVersion = useRef(0);

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
    const requestVersion = ++bookRequestVersion.current;
    if (search !== debouncedSearch) {
      setLoading(true);
      return () => {
        if (bookRequestVersion.current === requestVersion) bookRequestVersion.current += 1;
      };
    }

    fetchBooks(debouncedSearch, requestVersion);
    return () => {
      if (bookRequestVersion.current === requestVersion) bookRequestVersion.current += 1;
    };
  }, [page, rowsPerPage, search, debouncedSearch, categoryFilter]);

  useEffect(() => {
    if (location.state?.openAddDialog) {
      setOpenDialog(true);
      navigate('/library/books', { replace: true, state: null });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    let active = true;
    apiClient.get('/library/categories')
      .then((response) => {
        const data = response.data?.data;
        if (active && Array.isArray(data)) {
          setCategories(data.filter((category: unknown): category is BookCategory =>
            Boolean(category && typeof category === 'object' && 'name' in category && typeof category.name === 'string')
          ));
        }
      })
      .catch(() => {
        if (active) setCategories(['Fiction', 'Non-Fiction', 'Science', 'History', 'Reference', 'Textbook'].map((name, index) => ({ categoryId: index + 1, name })));
      });

    return () => { active = false; };
  }, []);

  const fetchBooks = async (searchTerm = debouncedSearch, requestVersion = ++bookRequestVersion.current) => {
    try {
      setLoading(true);
      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.category = categoryFilter;

      const response = await apiClient.get('/library/books', { params });
      if (bookRequestVersion.current !== requestVersion) return;
      const respData = response.data?.data;
      const list = Array.isArray(respData) ? respData : (respData?.books || []);
      setBooks(list.map(normalizeBook));
      setTotal(toNumber(respData?.total ?? response.data?.meta?.total, list.length));
    } catch (err) {
      if (bookRequestVersion.current === requestVersion) {
        console.error('Failed to fetch books:', err);
        setBooks([]);
      }
    } finally {
      if (bookRequestVersion.current === requestVersion) setLoading(false);
    }
  };

  const handleOpenDialog = (book?: Book) => {
    setFormErrors({});
    setError('');
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
    setFormErrors({});
  };

  const updateFormField = (field: keyof BookFormValues, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  };

  const formErrorMessage = (field: keyof BookFormValues) => {
    const validationError = formErrors[field];
    if (!validationError) return undefined;
    if (validationError === 'required') return t('validation.required');
    if (validationError === 'minLength') return t('validation.minLength', { min: 3 });
    if (validationError === 'maxLength') return t('validation.maxLength', { max: field === 'accessionNumber' ? 50 : 255 });
    return t('library.copiesPositiveInteger');
  };

  const handleSubmit = async () => {
    const validationErrors = validateBookForm(formData);
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setError('');
      return;
    }

    try {
      const copies = Number(formData.totalCopies);
      const publicationYear = formData.publicationYear ? Number(formData.publicationYear) : undefined;
      const price = formData.price ? Number(formData.price) : undefined;

      const payload = {
        accessionNumber: formData.accessionNumber.trim(),
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || undefined,
        publisher: formData.publisher.trim() || undefined,
        publicationYear: Number.isFinite(publicationYear) ? publicationYear : undefined,
        category: formData.category,
        copies,
        location: formData.location.trim() || undefined,
        price: Number.isFinite(price) ? price : undefined,
      };

      if (editingBook) {
        await apiClient.put(`/library/books/${editingBook.bookId}`, payload);
        setSuccess(t('library.bookUpdatedSuccess'));
      } else {
        await apiClient.post('/library/books', payload);
        setSuccess(t('library.bookAddedSuccess'));
      }
      handleCloseDialog();
      fetchBooks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const responseData = err.response?.data;
      const fieldMessages = Array.isArray(responseData?.errors)
        ? responseData.errors.map((item: { message?: string }) => item.message).filter(Boolean)
        : [];
      setError(fieldMessages.length ? fieldMessages.join(' ') : responseData?.message || t('library.failedToSaveBook'));
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
              {categories.map((category) => <MenuItem key={category.categoryId} value={category.name}>{category.name}</MenuItem>)}
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
          rowsPerPageOptions={[10, 20, 50, 100]}
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
                onChange={(e) => updateFormField('accessionNumber', e.target.value)}
                error={Boolean(formErrors.accessionNumber)}
                helperText={formErrorMessage('accessionNumber')}
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
                onChange={(e) => updateFormField('title', e.target.value)}
                error={Boolean(formErrors.title)}
                helperText={formErrorMessage('title')}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label={t('library.author')}
                value={formData.author}
                onChange={(e) => updateFormField('author', e.target.value)}
                error={Boolean(formErrors.author)}
                helperText={formErrorMessage('author')}
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
                onChange={(e) => updateFormField('category', e.target.value)}
                error={Boolean(formErrors.category)}
                helperText={formErrorMessage('category')}
                required
                fullWidth
              >
                {categories.map((category) => <MenuItem key={category.categoryId} value={category.name}>{category.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label={t('library.totalCopies')}
                type="number"
                value={formData.totalCopies}
                onChange={(e) => updateFormField('totalCopies', e.target.value)}
                error={Boolean(formErrors.totalCopies)}
                helperText={formErrorMessage('totalCopies')}
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

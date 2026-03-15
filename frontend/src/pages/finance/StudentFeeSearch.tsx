/**
 * Student Fee Search Page
 * Search students by fee status and view financial details
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Chip,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface StudentFeeInfo {
  studentId: number;
  studentName: string;
  className: string;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  overdueAmount: number;
  lastPaymentDate?: string;
  status: 'paid' | 'partial' | 'overdue' | 'pending';
}

export function StudentFeeSearch() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feeStatus, setFeeStatus] = useState('');
  const [students, setStudents] = useState<StudentFeeInfo[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentFeeInfo | null>(null);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (feeStatus) params.status = feeStatus;

      const response = await apiClient.get('/finance/students/fee-status', { params });
      setStudents(response.data?.data || []);
    } catch (err) {
      console.error('Failed to search students:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'overdue': return 'error';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        {t('finance.studentFeeSearch')}
      </Typography>

      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label={t('finance.searchStudent')}
              placeholder={t('finance.searchStudentPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('finance.feeStatus')}</InputLabel>
              <Select
                value={feeStatus}
                label={t('finance.feeStatus')}
                onChange={(e) => setFeeStatus(e.target.value)}
              >
                <MenuItem value="">{t('finance.allStatuses')}</MenuItem>
                <MenuItem value="paid">{t('finance.paid')}</MenuItem>
                <MenuItem value="partial">{t('finance.partial')}</MenuItem>
                <MenuItem value="pending">{t('finance.pending')}</MenuItem>
                <MenuItem value="overdue">{t('finance.overdue')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="contained" sx={S.BTN_PRIMARY}
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
              fullWidth
              size="large"
            >
              {t('common.search')}
            </Button>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="outlined" sx={S.BTN_OUTLINE}
              onClick={() => {
                setSearchQuery('');
                setFeeStatus('');
                setStudents([]);
                setSelectedStudent(null);
              }}
              fullWidth
              size="large"
            >
              {t('common.clear')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {selectedStudent && (
        <Card sx={{ ...S.GLASS, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('finance.studentFinancialSummary')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  {t('finance.studentName')}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedStudent.studentName}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  {t('finance.className')}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedStudent.className}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  {t('finance.totalInvoiced')}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  NPR {selectedStudent.totalInvoiced.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  {t('finance.totalPaid')}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="success.main">
                  NPR {selectedStudent.totalPaid.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  {t('finance.balance')}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="error.main">
                  NPR {selectedStudent.balance.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  {t('finance.overdueAmount')}
                </Typography>
                <Typography variant="body1" fontWeight={600} color="error.main">
                  NPR {selectedStudent.overdueAmount.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  {t('finance.lastPayment')}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedStudent.lastPaymentDate
                    ? new Date(selectedStudent.lastPaymentDate).toLocaleDateString()
                    : t('finance.noPayments')}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  {t('finance.status')}
                </Typography>
                <Chip
                  label={selectedStudent.status}
                  color={getStatusColor(selectedStudent.status)}
                  size="small"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                startIcon={<ReceiptIcon />}
                onClick={() => navigate(`/finance/invoices?studentId=${selectedStudent.studentId}`)}
              >
                {t('finance.viewInvoices')}
              </Button>
              <Button
                variant="outlined" sx={S.BTN_OUTLINE}
                startIcon={<PaymentIcon />}
                onClick={() => navigate(`/finance/payments/student/${selectedStudent.studentId}`)}
              >
                {t('finance.paymentHistory')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {students.length > 0 && (
        <Paper sx={{ ...S.GLASS }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell>{t('finance.studentId')}</TableCell>
                  <TableCell>{t('finance.studentName')}</TableCell>
                  <TableCell>{t('finance.className')}</TableCell>
                  <TableCell align="right">{t('finance.totalInvoiced')}</TableCell>
                  <TableCell align="right">{t('finance.totalPaid')}</TableCell>
                  <TableCell align="right">{t('finance.balance')}</TableCell>
                  <TableCell>{t('finance.status')}</TableCell>
                  <TableCell align="center">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.studentId} hover sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>#{student.studentId}</TableCell>
                    <TableCell sx={S.TD}>{student.studentName}</TableCell>
                    <TableCell sx={S.TD}>{student.className}</TableCell>
                    <TableCell align="right" sx={S.TD}>NPR {student.totalInvoiced.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={S.TD}>NPR {student.totalPaid.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={S.TD}>
                      <Typography
                        color={student.balance > 0 ? 'error' : 'success'}
                        fontWeight={600}
                      >
                        NPR {student.balance.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={S.TD}>
                      <Chip
                        label={student.status}
                        color={getStatusColor(student.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedStudent(student)}
                        title={t('finance.viewDetails')}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/finance/invoices?studentId=${student.studentId}`)}
                        title={t('finance.viewInvoices')}
                      >
                        <ReceiptIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {!loading && students.length === 0 && searchQuery && (
        <Paper sx={{ ...S.GLASS, p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {t('finance.noStudentsFound')}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default StudentFeeSearch;

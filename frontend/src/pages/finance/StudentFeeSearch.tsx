/**
 * Student Fee Search Page
 * Search students by fee status and view financial details
 */

import { useState } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

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
  const navigate = useNavigate();
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

      const response = await api.get('/finance/students/fee-status', { params });
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
        Student Fee Search
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="Search Student"
              placeholder="Name, ID, or Roll Number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Fee Status</InputLabel>
              <Select
                value={feeStatus}
                label="Fee Status"
                onChange={(e) => setFeeStatus(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="partial">Partial</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
              fullWidth
              size="large"
            >
              Search
            </Button>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchQuery('');
                setFeeStatus('');
                setStudents([]);
                setSelectedStudent(null);
              }}
              fullWidth
              size="large"
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {selectedStudent && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Student Financial Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  Student Name
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedStudent.studentName}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  Class
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedStudent.className}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  Total Invoiced
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  NPR {selectedStudent.totalInvoiced.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  Total Paid
                </Typography>
                <Typography variant="body1" fontWeight={600} color="success.main">
                  NPR {selectedStudent.totalPaid.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  Balance
                </Typography>
                <Typography variant="body1" fontWeight={600} color="error.main">
                  NPR {selectedStudent.balance.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  Overdue Amount
                </Typography>
                <Typography variant="body1" fontWeight={600} color="error.main">
                  NPR {selectedStudent.overdueAmount.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  Last Payment
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedStudent.lastPaymentDate
                    ? new Date(selectedStudent.lastPaymentDate).toLocaleDateString()
                    : 'No payments'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography color="text.secondary" variant="body2">
                  Status
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
                variant="outlined"
                startIcon={<ReceiptIcon />}
                onClick={() => navigate(`/finance/invoices?studentId=${selectedStudent.studentId}`)}
              >
                View Invoices
              </Button>
              <Button
                variant="outlined"
                startIcon={<PaymentIcon />}
                onClick={() => navigate(`/finance/payments/student/${selectedStudent.studentId}`)}
              >
                Payment History
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {students.length > 0 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell align="right">Total Invoiced</TableCell>
                  <TableCell align="right">Total Paid</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.studentId} hover>
                    <TableCell>#{student.studentId}</TableCell>
                    <TableCell>{student.studentName}</TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell align="right">NPR {student.totalInvoiced.toLocaleString()}</TableCell>
                    <TableCell align="right">NPR {student.totalPaid.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Typography
                        color={student.balance > 0 ? 'error' : 'success'}
                        fontWeight={600}
                      >
                        NPR {student.balance.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.status}
                        color={getStatusColor(student.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => setSelectedStudent(student)}
                        title="View Details"
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/finance/invoices?studentId=${student.studentId}`)}
                        title="View Invoices"
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
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No students found matching your search criteria
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default StudentFeeSearch;

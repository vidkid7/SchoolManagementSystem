/**
 * Student Library Component
 * 
 * Displays student's library borrowing history and statistics
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  alpha,
  useTheme,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  MenuBook as BookIcon,
  CheckCircle as ReturnedIcon,
  Schedule as BorrowedIcon,
  Warning as OverdueIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { motion } from 'framer-motion';
import { useNepaliNumbers } from '../../hooks/useNepaliNumbers';

const MotionCard = motion.create(Card);

interface LibraryRecord {
  id: number;
  bookTitle: string;
  bookCode: string;
  author: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  fine?: number;
}

interface LibraryStats {
  totalBorrowed: number;
  currentlyBorrowed: number;
  returned: number;
  overdue: number;
  totalFines: number;
}

interface StudentLibraryProps {
  studentId: number;
}

export const StudentLibrary = ({ studentId }: StudentLibraryProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { formatNumber } = useNepaliNumbers();
  
  const [records, setRecords] = useState<LibraryRecord[]>([]);
  const [stats, setStats] = useState<LibraryStats>({ 
    totalBorrowed: 0, 
    currentlyBorrowed: 0, 
    returned: 0, 
    overdue: 0,
    totalFines: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLibraryData();
  }, [studentId]);

  const fetchLibraryData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch library records
      const response = await apiClient.get(`/api/v1/students/${studentId}/library`);
      const data = response.data.data || {};
      
      setRecords(data.records || []);
      setStats(data.stats || { 
        totalBorrowed: 0, 
        currentlyBorrowed: 0, 
        returned: 0, 
        overdue: 0,
        totalFines: 0 
      });
    } catch (err: any) {
      console.error('Failed to fetch library data:', err);
      setError(t('messages.error') + ' (' + t('library.showingSampleData') + ')');
      
      // Set mock data for demonstration if API fails
      setRecords([
        {
          id: 1,
          bookTitle: 'Introduction to Computer Science',
          bookCode: 'CS-101',
          author: 'John Doe',
          borrowDate: '2024-01-15',
          dueDate: '2024-02-15',
          returnDate: '2024-02-10',
          status: 'returned',
        },
        {
          id: 2,
          bookTitle: 'Advanced Mathematics',
          bookCode: 'MATH-201',
          author: 'Jane Smith',
          borrowDate: '2024-02-01',
          dueDate: '2024-03-01',
          status: 'borrowed',
        },
        {
          id: 3,
          bookTitle: 'Physics Fundamentals',
          bookCode: 'PHY-101',
          author: 'Robert Johnson',
          borrowDate: '2024-01-20',
          dueDate: '2024-02-20',
          status: 'overdue',
          fine: 50,
        },
      ]);
      setStats({
        totalBorrowed: 15,
        currentlyBorrowed: 3,
        returned: 11,
        overdue: 1,
        totalFines: 50,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'returned':
        return 'success';
      case 'borrowed':
        return 'info';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

const getStatusLabel = (status: string) => {
    switch (status) {
      case 'returned':
        return t('library.returned');
      case 'borrowed':
        return t('library.borrowed');
      case 'overdue':
        return t('library.overdue');
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error} (Showing sample data)
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2.4}>
          <MotionCard 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            sx={{ 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
            }}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BookIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">{t('library.totalBorrowed')}</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                {formatNumber(stats.totalBorrowed)}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        
        <Grid item xs={6} md={2.4}>
          <MotionCard 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            sx={{ 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
            }}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BorrowedIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">{t('library.currentlyBorrowed')}</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                {formatNumber(stats.currentlyBorrowed)}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        
        <Grid item xs={6} md={2.4}>
          <MotionCard 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            sx={{ 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
            }}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ReturnedIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">{t('library.returned')}</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                {formatNumber(stats.returned)}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        
        <Grid item xs={6} md={2.4}>
          <MotionCard 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }} 
            sx={{ 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
            }}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <OverdueIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">{t('library.overdue')}</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.error.main }}>
                {formatNumber(stats.overdue)}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
        
        <Grid item xs={6} md={2.4}>
          <MotionCard 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }} 
            sx={{ 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
            }}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">{t('library.totalFines')}</Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                रू {formatNumber(stats.totalFines)}
              </Typography>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Library Records Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
<TableCell sx={{ fontWeight: 600 }}>{t('library.bookCode')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('library.bookTitle')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('library.author')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('library.borrowDate')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('library.dueDate')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('library.returnDate')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('library.status')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('library.fine')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <BookIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                    <Typography color="text.secondary">{t('library.noRecords')}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              records.map((record, index) => (
                <TableRow 
                  key={record.id} 
                  hover
                  sx={{ 
                    animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                    '@keyframes fadeInUp': {
                      from: { opacity: 0, transform: 'translateY(10px)' },
                      to: { opacity: 1, transform: 'translateY(0)' },
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {record.bookCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BookIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>
                        {record.bookTitle}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {record.author}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(record.borrowDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(record.dueDate).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {record.returnDate ? new Date(record.returnDate).toLocaleDateString() : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(record.status)}
                      color={getStatusColor(record.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    {record.fine ? (
                      <Typography variant="body2" color="error" fontWeight={600}>
                        रू {formatNumber(record.fine)}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {records.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">
            💡 Tip: Return books on time to avoid fines. Current fine rate: रू 5 per day for overdue books.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StudentLibrary;

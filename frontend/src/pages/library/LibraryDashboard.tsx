/**
 * Library Dashboard
 * Overview of library statistics and quick actions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  Book as BookIcon,
  Assignment as IssueIcon,
  AssignmentReturn as ReturnIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import api from '../../config/api';

interface LibraryStats {
  totalBooks: number;
  availableBooks: number;
  issuedBooks: number;
  overdueBooks: number;
  totalMembers: number;
  finesCollected: number;
}

interface RecentActivity {
  id: number;
  type: 'issue' | 'return';
  bookTitle: string;
  memberName: string;
  date: string;
}

export function LibraryDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LibraryStats>({
    totalBooks: 0,
    availableBooks: 0,
    issuedBooks: 0,
    overdueBooks: 0,
    totalMembers: 0,
    finesCollected: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activitiesRes] = await Promise.all([
        api.get('/library/statistics').catch(() => ({ data: { data: null } })),
        api.get('/library/recent-activities?limit=5').catch(() => ({ data: { data: [] } })),
      ]);

      if (statsRes.data?.data) {
        setStats(prev => ({ ...prev, ...statsRes.data.data }));
      }
      setRecentActivities(activitiesRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Books',
      value: stats.totalBooks.toString(),
      icon: <BookIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: '#1976d2',
      action: () => navigate('/library/books'),
    },
    {
      title: 'Available',
      value: stats.availableBooks.toString(),
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: '#2e7d32',
      action: () => navigate('/library/books'),
    },
    {
      title: 'Issued',
      value: stats.issuedBooks.toString(),
      icon: <IssueIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      color: '#0288d1',
      action: () => navigate('/library/circulation'),
    },
    {
      title: 'Overdue',
      value: stats.overdueBooks.toString(),
      icon: <WarningIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      color: '#d32f2f',
      action: () => navigate('/library/circulation?status=overdue'),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Library Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/library/books/new')}
          >
            Add Book
          </Button>
          <Button
            variant="outlined"
            startIcon={<IssueIcon />}
            onClick={() => navigate('/library/issue')}
          >
            Issue Book
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
              onClick={card.action}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {card.value}
                    </Typography>
                  </Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Recent Activities
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {recentActivities.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                No recent activities
              </Typography>
            ) : (
              <List>
                {recentActivities.map((activity) => (
                  <ListItem
                    key={activity.id}
                    secondaryAction={
                      <Chip
                        label={activity.type}
                        size="small"
                        color={activity.type === 'issue' ? 'primary' : 'success'}
                      />
                    }
                  >
                    <ListItemText
                      primary={activity.bookTitle}
                      secondary={`${activity.memberName} • ${new Date(activity.date).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<BookIcon />}
                onClick={() => navigate('/library/books')}
              >
                Manage Books
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<IssueIcon />}
                onClick={() => navigate('/library/circulation')}
              >
                Book Circulation
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ReturnIcon />}
                onClick={() => navigate('/library/return')}
              >
                Return Books
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<CategoryIcon />}
                onClick={() => navigate('/library/categories')}
              >
                Manage Categories
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/library/reports')}
              >
                Library Reports
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Statistics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Total Members</Typography>
                <Typography fontWeight={600}>{stats.totalMembers}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Fines Collected</Typography>
                <Typography fontWeight={600} color="success.main">
                  NPR {(stats.finesCollected ?? 0).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Utilization Rate</Typography>
                <Typography fontWeight={600}>
                  {stats.totalBooks > 0
                    ? ((stats.issuedBooks / stats.totalBooks) * 100).toFixed(1)
                    : 0}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default LibraryDashboard;

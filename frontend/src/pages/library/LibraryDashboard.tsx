/**
 * Library Dashboard
 * Overview of library statistics and quick actions
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { useTranslation } from 'react-i18next';
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
import apiClient from '../../services/apiClient';

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
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
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
        apiClient.get('/library/statistics').catch(() => ({ data: { data: null } })),
        apiClient.get('/library/recent-activities?limit=5').catch(() => ({ data: { data: [] } })),
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
      title: t('library.totalBooks'),
      value: stats.totalBooks.toString(),
      icon: <BookIcon sx={{ fontSize: 40, color: C.primary }} />,
      color: C.primary,
      action: () => navigate(`/library/books`),
    },
    {
      title: t('library.available'),
      value: stats.availableBooks.toString(),
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: C.primary }} />,
      color: C.primary,
      action: () => navigate(`/library/books`),
    },
    {
      title: t('library.issued'),
      value: stats.issuedBooks.toString(),
      icon: <IssueIcon sx={{ fontSize: 40, color: C.neutral }} />,
      color: C.neutral,
      action: () => navigate(`/library/circulation`),
    },
    {
      title: t('library.overdue'),
      value: stats.overdueBooks.toString(),
      icon: <WarningIcon sx={{ fontSize: 40, color: C.danger }} />,
      color: C.danger,
      action: () => navigate(`/library/circulation?status=overdue`),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          {t('library.libraryDashboard')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/library/books/new`)}
            sx={S.BTN_PRIMARY}
          >
            {t('library.addBook')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<IssueIcon />}
            onClick={() => navigate(`/library/issue`)}
          >
            {t('library.issueBook')}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                ...S.GLASS,
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
          <Paper sx={{ ...S.GLASS, p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('library.recentActivities')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {recentActivities.length === 0 ? (
              <Typography color="text.secondary" align="center" py={4}>
                {t('library.noRecentActivities')}
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
          <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('library.quickActions')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<BookIcon />}
                onClick={() => navigate(`/library/books`)}
              >
                {t('library.manageBooks')}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<IssueIcon />}
                onClick={() => navigate(`/library/circulation`)}
              >
                {t('library.bookCirculation')}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ReturnIcon />}
                onClick={() => navigate(`/library/return`)}
              >
                {t('library.returnBooks')}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<CategoryIcon />}
                onClick={() => navigate(`/library/categories`)}
              >
                {t('library.manageCategories')}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(`/library/reports`)}
              >
                {t('library.libraryReports')}
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ ...S.GLASS, p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t('library.statistics')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">{t('library.totalMembers')}</Typography>
                <Typography fontWeight={600}>{stats.totalMembers}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">{t('library.finesCollected')}</Typography>
                <Typography fontWeight={600} color="success.main">
                  NPR {(stats.finesCollected ?? 0).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">{t('library.utilizationRate')}</Typography>
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

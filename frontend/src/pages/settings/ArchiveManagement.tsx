/**
 * Archive Management
 * 
 * Exclusive access for School_Admin only
 * 
 * Features:
 * - Archive academic year data
 * - View all archives
 * - View archive details
 * - Restore archived data
 * - Delete expired archives
 * - Clean up old archives
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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
} from '@mui/material';
import {
  Archive as ArchiveIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CleaningServices as CleanIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as InProgressIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface Archive {
  archiveId: number;
  academicYearId: number;
  academicYearName: string;
  archivedAt: string;
  archivedBy: number;
  archiverName?: string;
  status: 'in_progress' | 'completed' | 'failed' | 'restored';
  tablesArchived?: string[];
  recordCounts?: Record<string, number>;
  retentionUntil: string;
  size?: number;
}

interface AcademicYear {
  academicYearId: number;
  yearName: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export const ArchiveManagement = () => {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<Archive | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchArchives();
    fetchAcademicYears();
  }, [statusFilter]);

  const fetchArchives = async () => {
    try {
      setLoading(true);
      setError('');
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await apiClient.get('/api/v1/archive', { params });
      setArchives(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch archives:', err);
      setError(err.response?.data?.error?.message || 'Failed to load archives');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await apiClient.get('/api/v1/academic/years');
      setAcademicYears(response.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch academic years:', err);
    }
  };

  const handleArchiveYear = async () => {
    if (!selectedYearId) return;

    const year = academicYears.find(y => y.academicYearId === selectedYearId);
    if (!year) return;

    if (!window.confirm(
      `Are you sure you want to archive academic year "${year.yearName}"? This will move all data for this year to long-term storage.`
    )) {
      return;
    }

    try {
      setArchiving(true);
      setError('');
      setSuccess('');
      const response = await apiClient.post('/api/v1/archive/academic-year', {
        academicYearId: selectedYearId,
      });
      setSuccess(`Academic year "${year.yearName}" archived successfully`);
      setArchiveDialogOpen(false);
      setSelectedYearId('');
      fetchArchives();
    } catch (err: any) {
      console.error('Failed to archive year:', err);
      setError(err.response?.data?.error?.message || 'Failed to archive academic year');
    } finally {
      setArchiving(false);
    }
  };

  const handleRestoreArchive = async () => {
    if (!selectedArchive) return;

    if (!window.confirm(
      `WARNING: Restoring archived data for "${selectedArchive.academicYearName}" will restore all archived records. Continue?`
    )) {
      return;
    }

    try {
      setRestoring(true);
      setError('');
      setSuccess('');
      const response = await apiClient.post(`/api/v1/archive/${selectedArchive.archiveId}/restore`);
      setSuccess(`Archive for "${selectedArchive.academicYearName}" restored successfully`);
      setRestoreDialogOpen(false);
      setSelectedArchive(null);
      fetchArchives();
    } catch (err: any) {
      console.error('Failed to restore archive:', err);
      setError(err.response?.data?.error?.message || 'Failed to restore archive');
    } finally {
      setRestoring(false);
    }
  };

  const handleCleanupArchives = async () => {
    if (!window.confirm(
      'This will permanently delete all expired archives. This action cannot be undone. Continue?'
    )) {
      return;
    }

    try {
      setCleaning(true);
      setError('');
      setSuccess('');
      const response = await apiClient.post('/api/v1/archive/cleanup');
      setSuccess(`Cleaned up ${response.data.data.deletedCount} expired archives`);
      fetchArchives();
    } catch (err: any) {
      console.error('Failed to cleanup archives:', err);
      setError(err.response?.data?.error?.message || 'Failed to cleanup archives');
    } finally {
      setCleaning(false);
    }
  };

  const handleViewDetails = async (archive: Archive) => {
    try {
      const response = await apiClient.get(`/api/v1/archive/${archive.archiveId}`);
      setSelectedArchive(response.data.data);
      setDetailsDialogOpen(true);
    } catch (err: any) {
      console.error('Failed to fetch archive details:', err);
      setError(err.response?.data?.error?.message || 'Failed to load archive details');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'failed':
        return <ErrorIcon />;
      case 'in_progress':
        return <InProgressIcon />;
      case 'restored':
        return <UndoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getStatusColor = (status: string): any => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'in_progress':
        return 'warning';
      case 'restored':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTotalRecords = (recordCounts?: Record<string, number>): number => {
    if (!recordCounts) return 0;
    return Object.values(recordCounts).reduce((sum, count) => sum + count, 0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Archive Management / अभिलेख व्यवस्थापन
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CleanIcon />}
            onClick={handleCleanupArchives}
            disabled={cleaning}
            color="error"
          >
            {cleaning ? <CircularProgress size={24} /> : 'Cleanup Expired / म्याद सकिएको सफा गर्नुहोस्'}
          </Button>
          <Button
            variant="contained"
            startIcon={<ArchiveIcon />}
            onClick={() => setArchiveDialogOpen(true)}
          >
            Archive Year / वर्ष अभिलेख गर्नुहोस्
          </Button>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {archives.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Archives / कुल अभिलेख
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {archives.filter(a => a.status === 'completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed / पूर्ण भएको
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {archives.filter(a => a.status === 'in_progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress / प्रगतिमा
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {archives.filter(a => a.status === 'failed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed / असफल
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Archives List */}
      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Archives / अभिलेखहरू
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status / स्थिति</InputLabel>
              <Select
                value={statusFilter}
                label="Status / स्थिति"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All / सबै</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="restored">Restored</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchArchives}
              disabled={loading}
            >
              Refresh / ताजा गर्नुहोस्
            </Button>
          </Box>
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Academic Year / शैक्षिक वर्ष</TableCell>
                <TableCell>Archived Date / अभिलेख मिति</TableCell>
                <TableCell>Records / रेकर्डहरू</TableCell>
                <TableCell>Status / स्थिति</TableCell>
                <TableCell>Retention Until / अवधि सम्म</TableCell>
                <TableCell align="right">Actions / कार्यहरू</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : archives.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">
                      No archives found / कुनै अभिलेख फेला परेन
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                archives.map((archive) => (
                  <TableRow key={archive.archiveId} hover>
                    <TableCell>{archive.archiveId}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {archive.academicYearName}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(archive.archivedAt)}</TableCell>
                    <TableCell>
                      {getTotalRecords(archive.recordCounts).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(archive.status)}
                        label={archive.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(archive.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(archive.retentionUntil)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        title="View Details"
                        onClick={() => handleViewDetails(archive)}
                      >
                        <ViewIcon />
                      </IconButton>
                      {archive.status === 'completed' && (
                        <IconButton
                          size="small"
                          title="Restore Archive"
                          color="primary"
                          onClick={() => {
                            setSelectedArchive(archive);
                            setRestoreDialogOpen(true);
                          }}
                        >
                          <RestoreIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Archive Year Dialog */}
      <Dialog open={archiveDialogOpen} onClose={() => !archiving && setArchiveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Archive Academic Year / शैक्षिक वर्ष अभिलेख गर्नुहोस्</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Archiving will move all data for the selected academic year to long-term storage. This includes students, attendance, grades, and all related records.
            </Alert>
            <FormControl fullWidth>
              <InputLabel>Select Academic Year / शैक्षिक वर्ष छान्नुहोस्</InputLabel>
              <Select
                value={selectedYearId}
                label="Select Academic Year / शैक्षिक वर्ष छान्नुहोस्"
                onChange={(e) => setSelectedYearId(e.target.value as number)}
              >
                {academicYears
                  .filter(year => !year.isCurrent)
                  .map((year) => (
                    <MenuItem key={year.academicYearId} value={year.academicYearId}>
                      {year.yearName} ({year.startDate} - {year.endDate})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialogOpen(false)} disabled={archiving}>
            Cancel / रद्द गर्नुहोस्
          </Button>
          <Button
            variant="contained"
            onClick={handleArchiveYear}
            disabled={archiving || !selectedYearId}
            startIcon={archiving ? <CircularProgress size={20} /> : <ArchiveIcon />}
          >
            {archiving ? 'Archiving...' : 'Archive / अभिलेख गर्नुहोस्'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Archive Details / अभिलेख विवरण</DialogTitle>
        <DialogContent>
          {selectedArchive && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Academic Year / शैक्षिक वर्ष
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedArchive.academicYearName}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status / स्थिति
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedArchive.status)}
                    label={selectedArchive.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(selectedArchive.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Archived Date / अभिलेख मिति
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedArchive.archivedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Retention Until / अवधि सम्म
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedArchive.retentionUntil)}
                  </Typography>
                </Grid>
                {selectedArchive.size && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Archive Size / अभिलेख आकार
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatBytes(selectedArchive.size)}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {selectedArchive.recordCounts && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Record Counts / रेकर्ड गणना
                  </Typography>
                  <List dense>
                    {Object.entries(selectedArchive.recordCounts).map(([table, count]) => (
                      <ListItem key={table}>
                        <ListItemText
                          primary={table.replace(/_/g, ' ').toUpperCase()}
                          secondary={`${count.toLocaleString()} records`}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Total: {getTotalRecords(selectedArchive.recordCounts).toLocaleString()} records
                  </Typography>
                </>
              )}

              {selectedArchive.tablesArchived && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Archived Tables / अभिलेख गरिएका तालिकाहरू
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedArchive.tablesArchived.map((table) => (
                      <Chip key={table} label={table} size="small" />
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close / बन्द गर्नुहोस्
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => !restoring && setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Confirm Restore / पुनर्स्थापना पुष्टि गर्नुहोस्
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            WARNING: Restoring archived data will restore all records for this academic year. Ensure this is what you want to do.
          </Alert>
          {selectedArchive && (
            <Box>
              <Typography variant="body1" gutterBottom>
                You are about to restore archive for:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.100', mt: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {selectedArchive.academicYearName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getTotalRecords(selectedArchive.recordCounts).toLocaleString()} records
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)} disabled={restoring}>
            Cancel / रद्द गर्नुहोस्
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRestoreArchive}
            disabled={restoring}
            startIcon={restoring ? <CircularProgress size={20} /> : <RestoreIcon />}
          >
            {restoring ? 'Restoring...' : 'Restore / पुनर्स्थापना गर्नुहोस्'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

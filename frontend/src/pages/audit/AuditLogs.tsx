import React, { useState, useEffect } from 'react';
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
  TablePagination,
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Collapse,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import apiClient from '../../services/apiClient';

/**
 * Audit Logs Page
 * Requirements: 38.5, 38.6, 38.7
 */

interface AuditLog {
  auditLogId: number;
  userId: number | null;
  entityType: string;
  entityId: number;
  action: 'create' | 'update' | 'delete' | 'restore';
  oldValue: any;
  newValue: any;
  changedFields: string[] | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any> | null;
  timestamp: string;
}

interface AuditLogStats {
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByEntityType: Record<string, number>;
  oldestLog: string | null;
  newestLog: string | null;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalLogs, setTotalLogs] = useState(0);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    userId: '',
    entityType: '',
    entityId: '',
    action: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    ipAddress: '',
    search: ''
  });

  useEffect(() => {
    fetchAuditLogs();
    fetchStats();
  }, [page, rowsPerPage]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {
        page: page + 1,
        limit: rowsPerPage
      };

      if (filters.userId) params.userId = filters.userId;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.entityId) params.entityId = filters.entityId;
      if (filters.action) params.action = filters.action;
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();
      if (filters.ipAddress) params.ipAddress = filters.ipAddress;
      if (filters.search) params.search = filters.search;

      const response = await apiClient.get('/api/v1/audit/logs', { params });

      setLogs(response.data.data);
      setTotalLogs(response.data.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/v1/audit/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setPage(0);
    fetchAuditLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      userId: '',
      entityType: '',
      entityId: '',
      action: '',
      startDate: null,
      endDate: null,
      ipAddress: '',
      search: ''
    });
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (filters.userId) params.userId = filters.userId;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.entityId) params.entityId = filters.entityId;
      if (filters.action) params.action = filters.action;
      if (filters.startDate) params.startDate = filters.startDate.toISOString();
      if (filters.endDate) params.endDate = filters.endDate.toISOString();

      const response = await apiClient.get('/api/v1/audit/export', { params });
      
      // Download as JSON
      const dataStr = JSON.stringify(response.data.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString()}.json`;
      link.click();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to export audit logs');
    }
  };

  const handleRotateLogs = async () => {
    if (!window.confirm('Are you sure you want to delete logs older than 1 year? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiClient.post('/api/v1/audit/rotate', { retentionDays: 365 });
      alert(`Successfully deleted ${response.data.data.deletedCount} old audit logs`);
      fetchAuditLogs();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to rotate audit logs');
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'success';
      case 'update': return 'info';
      case 'delete': return 'error';
      case 'restore': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Audit Logs</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAuditLogs}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleRotateLogs}
            >
              Rotate Logs
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Logs
                  </Typography>
                  <Typography variant="h4">{stats.totalLogs.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Creates
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.logsByAction.create || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Updates
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats.logsByAction.update || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Deletes
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.logsByAction.delete || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showFilters}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="User ID"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Entity Type"
                  value={filters.entityType}
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Entity ID"
                  value={filters.entityId}
                  onChange={(e) => handleFilterChange('entityId', e.target.value)}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    label="Action"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="create">Create</MenuItem>
                    <MenuItem value="update">Update</MenuItem>
                    <MenuItem value="delete">Delete</MenuItem>
                    <MenuItem value="restore">Restore</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="IP Address"
                  value={filters.ipAddress}
                  onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search entity type or fields"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<FilterIcon />}
                    onClick={handleApplyFilters}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Audit Logs Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Entity</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Changed Fields</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <React.Fragment key={log.auditLogId}>
                      <TableRow hover>
                        <TableCell>{log.auditLogId}</TableCell>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>{log.userId || 'System'}</TableCell>
                        <TableCell>
                          {log.entityType} #{log.entityId}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.action.toUpperCase()}
                            color={getActionColor(log.action) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {log.changedFields && log.changedFields.length > 0 ? (
                            <Typography variant="body2">
                              {log.changedFields.join(', ')}
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{log.ipAddress || '-'}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedRow(
                              expandedRow === log.auditLogId ? null : log.auditLogId
                            )}
                          >
                            {expandedRow === log.auditLogId ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={8} sx={{ py: 0 }}>
                          <Collapse in={expandedRow === log.auditLogId}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Grid container spacing={2}>
                                {log.oldValue && (
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      Old Value:
                                    </Typography>
                                    <Paper sx={{ p: 1, bgcolor: 'white' }}>
                                      <pre style={{ margin: 0, fontSize: '0.75rem', overflow: 'auto' }}>
                                        {JSON.stringify(log.oldValue, null, 2)}
                                      </pre>
                                    </Paper>
                                  </Grid>
                                )}
                                {log.newValue && (
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      New Value:
                                    </Typography>
                                    <Paper sx={{ p: 1, bgcolor: 'white' }}>
                                      <pre style={{ margin: 0, fontSize: '0.75rem', overflow: 'auto' }}>
                                        {JSON.stringify(log.newValue, null, 2)}
                                      </pre>
                                    </Paper>
                                  </Grid>
                                )}
                                {log.userAgent && (
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2">
                                      User Agent: {log.userAgent}
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalLogs}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default AuditLogs;

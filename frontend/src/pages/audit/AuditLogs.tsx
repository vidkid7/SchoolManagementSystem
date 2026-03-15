import React, { useState, useEffect } from 'react';
import {
  Box,
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
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material';
import {
  History as HistoryIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTranslation } from 'react-i18next';
import apiClient from '../../services/apiClient';
import { useAdminStyles, C, getStatusColor } from '../../theme/designTokens';

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
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);

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
    search: '',
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
        limit: rowsPerPage,
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
      setError(err.response?.data?.error?.message || t('audit.failedToFetch'));
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
      search: '',
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
      setError(err.response?.data?.error?.message || t('audit.failedToExport'));
    }
  };

  const handleRotateLogs = async () => {
    if (!window.confirm(t('audit.rotateConfirm'))) {
      return;
    }

    try {
      const response = await apiClient.post('/api/v1/audit/rotate', { retentionDays: 365 });
      alert(t('audit.rotateSuccess', { count: response.data.data.deletedCount }));
      fetchAuditLogs();
      fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('audit.failedToRotate'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const TH_CELL_SX = {
    background: S.TH_BG,
    color: theme.palette.text.secondary,
    fontWeight: 700,
    fontSize: '0.72rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  };

  const statCards = [
    {
      label: t('audit.totalLogs'),
      value: stats?.totalLogs ?? 0,
      accent: C.primary,
      icon: <HistoryIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: t('audit.creates'),
      value: stats?.logsByAction?.create ?? 0,
      accent: C.success,
      icon: <AddIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: t('audit.updates'),
      value: stats?.logsByAction?.update ?? 0,
      accent: C.info,
      icon: <EditIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: t('audit.deletes'),
      value: stats?.logsByAction?.delete ?? 0,
      accent: C.danger,
      icon: <DeleteIcon sx={{ fontSize: 18 }} />,
    },
    {
      label: t('audit.restores'),
      value: stats?.logsByAction?.restore ?? 0,
      accent: C.warning,
      icon: <RestoreIcon sx={{ fontSize: 18 }} />,
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }}>

        {/* Page Header */}
        <Box
          sx={{
            ...S.PAGE_HEADER,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={S.ICON_BOX(C.primary, 44)}>
              <HistoryIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                {t('audit.title')}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {t('audit.subtitle')}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title={t('audit.refresh')}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchAuditLogs} sx={S.BTN_OUTLINE}>
                {t('audit.refresh')}
              </Button>
            </Tooltip>
            <Tooltip title={t('audit.export')}>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport} sx={S.BTN_OUTLINE}>
                {t('audit.export')}
              </Button>
            </Tooltip>
            <Tooltip title={t('audit.rotateLogs')}>
              <Button variant="text" startIcon={<DeleteIcon />} onClick={handleRotateLogs} sx={{ ...S.BTN_GHOST, color: C.danger }}>
                {t('audit.rotateLogs')}
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          {statCards.map(({ label, value, accent, icon }) => (
            <Box key={label} sx={{ ...S.STAT_CARD(accent), p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={S.ICON_BOX(accent, 36)}>
                  {icon}
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary, display: 'block', lineHeight: 1.3 }}
                  >
                    {label}
                  </Typography>
                  <Typography variant="h4" sx={{ color: accent, fontWeight: 700, lineHeight: 1.2 }}>
                    {value.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Filters Card */}
        <Box sx={{ ...S.GLASS, p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {t('audit.filters')}
            </Typography>
            <IconButton size="small" sx={S.BTN_ICON} onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showFilters}>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {/* Search — full width at top */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('audit.search')}
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder={t('audit.searchPlaceholder')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={S.TF}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label={t('audit.userId')}
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    type="number"
                    sx={S.TF}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label={t('audit.entityType')}
                    value={filters.entityType}
                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                    sx={S.TF}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label={t('audit.entityId')}
                    value={filters.entityId}
                    onChange={(e) => handleFilterChange('entityId', e.target.value)}
                    type="number"
                    sx={S.TF}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth sx={S.TF}>
                    <InputLabel>{t('audit.action')}</InputLabel>
                    <Select
                      value={filters.action}
                      onChange={(e) => handleFilterChange('action', e.target.value)}
                      label={t('audit.action')}
                    >
                      <MenuItem value="">{t('audit.allActions')}</MenuItem>
                      <MenuItem value="create">Create</MenuItem>
                      <MenuItem value="update">Update</MenuItem>
                      <MenuItem value="delete">Delete</MenuItem>
                      <MenuItem value="restore">Restore</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label={t('audit.startDate')}
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    slotProps={{ textField: { fullWidth: true, sx: S.TF } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label={t('audit.endDate')}
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    slotProps={{ textField: { fullWidth: true, sx: S.TF } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label={t('audit.ipAddress')}
                    value={filters.ipAddress}
                    onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
                    sx={S.TF}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" startIcon={<FilterIcon />} onClick={handleApplyFilters} sx={S.BTN_PRIMARY}>
                      {t('audit.applyFilters')}
                    </Button>
                    <Button variant="outlined" onClick={handleClearFilters} sx={S.BTN_OUTLINE}>
                      {t('audit.clearFilters')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Audit Logs Table */}
        <Box sx={{ ...S.GLASS, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={TH_CELL_SX}>{t('audit.id')}</TableCell>
                  <TableCell sx={TH_CELL_SX}>{t('audit.timestamp')}</TableCell>
                  <TableCell sx={TH_CELL_SX}>{t('audit.userId')}</TableCell>
                  <TableCell sx={TH_CELL_SX}>{t('audit.entity')}</TableCell>
                  <TableCell sx={TH_CELL_SX}>{t('audit.action')}</TableCell>
                  <TableCell sx={TH_CELL_SX}>{t('audit.changedFields')}</TableCell>
                  <TableCell sx={TH_CELL_SX}>{t('audit.ipAddress')}</TableCell>
                  <TableCell sx={TH_CELL_SX}>{t('audit.details')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} sx={{ color: C.primary }} />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: theme.palette.text.secondary }}>
                      {t('audit.noLogsFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const { fg, bg, border } = getStatusColor(log.action);
                    return (
                      <React.Fragment key={log.auditLogId}>
                        <TableRow sx={S.TR_HOVER}>
                          <TableCell sx={S.TD}>{log.auditLogId}</TableCell>
                          <TableCell sx={S.TD}>{formatDate(log.timestamp)}</TableCell>
                          <TableCell sx={S.TD}>{log.userId ?? t('audit.system')}</TableCell>
                          <TableCell sx={S.TD}>
                            {log.entityType} #{log.entityId}
                          </TableCell>
                          <TableCell sx={S.TD}>
                            <Chip
                              label={log.action.toUpperCase()}
                              size="small"
                              sx={{
                                color: fg,
                                background: bg,
                                border: `1px solid ${border}`,
                                fontWeight: 600,
                                fontSize: '0.72rem',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={S.TD}>
                            {log.changedFields && log.changedFields.length > 0 ? (
                              <Typography variant="body2">
                                {log.changedFields.join(', ')}
                              </Typography>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell sx={S.TD}>{log.ipAddress || '-'}</TableCell>
                          <TableCell sx={S.TD}>
                            <IconButton
                              size="small"
                              sx={S.BTN_ICON}
                              onClick={() =>
                                setExpandedRow(expandedRow === log.auditLogId ? null : log.auditLogId)
                              }
                            >
                              {expandedRow === log.auditLogId ? (
                                <ExpandLessIcon fontSize="small" />
                              ) : (
                                <ExpandMoreIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={8} sx={{ py: 0, ...S.TD }}>
                            <Collapse in={expandedRow === log.auditLogId}>
                              <Box
                                sx={{
                                  p: 2,
                                  background: S.dark
                                    ? 'rgba(255,255,255,0.03)'
                                    : 'rgba(0,122,255,0.02)',
                                }}
                              >
                                <Grid container spacing={2}>
                                  {log.oldValue && (
                                    <Grid item xs={12} md={6}>
                                      <Typography
                                        variant="subtitle2"
                                        gutterBottom
                                        sx={{ color: theme.palette.text.secondary }}
                                      >
                                        {t('audit.oldValue')}:
                                      </Typography>
                                      <Box sx={{ ...S.GLASS, p: 1.5 }}>
                                        <Box
                                          component="pre"
                                          sx={{
                                            margin: 0,
                                            fontSize: '0.75rem',
                                            overflow: 'auto',
                                            color: 'inherit',
                                          }}
                                        >
                                          {JSON.stringify(log.oldValue, null, 2)}
                                        </Box>
                                      </Box>
                                    </Grid>
                                  )}
                                  {log.newValue && (
                                    <Grid item xs={12} md={6}>
                                      <Typography
                                        variant="subtitle2"
                                        gutterBottom
                                        sx={{ color: theme.palette.text.secondary }}
                                      >
                                        {t('audit.newValue')}:
                                      </Typography>
                                      <Box sx={{ ...S.GLASS, p: 1.5 }}>
                                        <Box
                                          component="pre"
                                          sx={{
                                            margin: 0,
                                            fontSize: '0.75rem',
                                            overflow: 'auto',
                                            color: 'inherit',
                                          }}
                                        >
                                          {JSON.stringify(log.newValue, null, 2)}
                                        </Box>
                                      </Box>
                                    </Grid>
                                  )}
                                  {log.userAgent && (
                                    <Grid item xs={12}>
                                      <Typography
                                        variant="subtitle2"
                                        sx={{ color: theme.palette.text.secondary }}
                                      >
                                        {t('audit.userAgent')}: {log.userAgent}
                                      </Typography>
                                    </Grid>
                                  )}
                                </Grid>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
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
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default AuditLogs;

/**
 * Student List Page
 * 
 * Displays list of students with filters, search, and actions
 * Updated: Fixed React key warnings
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Avatar,
  alpha,
  useTheme,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  TrendingUp,
  School as SchoolIcon,
  CheckCircle as ActiveIcon,
  Group as GroupIcon,
  Refresh as RefreshIcon,
  Psychology as FuzzyIcon,
  Bolt as ExactIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { motion } from 'framer-motion';
import { useNepaliNumbers } from '../../hooks/useNepaliNumbers';

const MotionCard = motion.create(Card);

interface Student {
  studentId: number;
  studentCode: string;
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  currentClassId?: number;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  photoUrl?: string;
  phone?: string;
  email?: string;
  rollNumber?: number;
  class?: {
    classId: number;
    gradeLevel: number;
    section: string;
  };
}

interface FuzzySearchResult {
  student: Student;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'phonetic';
  matchedField: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; labelKey: string }> = {
  active: { color: '#10b981', bg: '#10b981', labelKey: 'students.active' },
  inactive: { color: '#6b7280', bg: '#6b7280', labelKey: 'students.inactive' },
  graduated: { color: '#3b82f6', bg: '#3b82f6', labelKey: 'students.graduated' },
  transferred: { color: '#f59e0b', bg: '#f59e0b', labelKey: 'students.transferred' },
};

export const StudentList = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { formatNumber, formatWithSeparators } = useNepaliNumbers();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Fuzzy search
  const [searchMode, setSearchMode] = useState<'exact' | 'fuzzy'>('exact');
  const [fuzzyResults, setFuzzyResults] = useState<FuzzySearchResult[]>([]);

  useEffect(() => {
    if (searchMode === 'fuzzy' && search) {
      performFuzzySearch();
    } else {
      fetchStudents();
    }
  }, [page, rowsPerPage, search, classFilter, sectionFilter, statusFilter, searchMode]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(search && { search }),
        ...(classFilter && { class: classFilter }),
        ...(sectionFilter && { section: sectionFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await apiClient.get(`/api/v1/students?${params}`);
      setStudents(response.data.data || []);
      setTotal(response.data.meta?.total || response.data.total || 0);
      setFuzzyResults([]);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const performFuzzySearch = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        query: search,
        threshold: '0.4',
        limit: '50',
      });

      const response = await apiClient.get(`/api/v1/students/search/fuzzy?${params}`);
      const results = response.data.data || [];
      setFuzzyResults(results);
      setStudents(results.map((r: FuzzySearchResult) => r.student));
      setTotal(results.length);
    } catch (error) {
      console.error('Failed to perform fuzzy search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setSearch('');
    setClassFilter('');
    setSectionFilter('');
    setStatusFilter('');
    setSearchMode('exact');
  };

  const hasActiveFilters = search || classFilter || sectionFilter || statusFilter;

  const getMatchTypeBadge = (studentId: number) => {
    if (searchMode !== 'fuzzy' || !search) return null;
    
    const result = fuzzyResults.find(r => r.student.studentId === studentId);
    if (!result) return null;

    const colors = {
      exact: { bg: '#10b981', text: '#fff' },
      fuzzy: { bg: '#f59e0b', text: '#fff' },
      phonetic: { bg: '#6366f1', text: '#fff' },
    };

    const color = colors[result.matchType];
    const score = Math.round(result.score * 100);

    return (
      <Tooltip title={`Match: ${result.matchedField} (${score}% similarity)`}>
        <Chip
          label={result.matchType.toUpperCase()}
          size="small"
          sx={{
            bgcolor: color.bg,
            color: color.text,
            fontWeight: 700,
            fontSize: '0.65rem',
            height: 20,
            ml: 1,
          }}
        />
      </Tooltip>
    );
  };

  return (
    <Box sx={{ mt: 2, mb: 4 }} key={i18n.language}>
      {/* Header Section */}
      <MotionCard 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        elevation={0}
        sx={{ 
          mb: 3,
          borderRadius: 4,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(28,28,30,0.4) 0%, rgba(28,28,30,0.6) 100%)' 
            : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.5) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
          color: theme.palette.text.primary,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
              }}>
                <PeopleIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                  {t('students.title')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, opacity: 0.9 }}>
                  <TrendingUp sx={{ fontSize: 16 }} />
                  <Typography variant="body2">
                    {formatWithSeparators(total)} {t('dashboard.totalStudents').toLowerCase()}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => fetchStudents()}
                sx={{ 
                  borderRadius: 2,
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': { 
                    borderColor: 'rgba(255,255,255,0.5)', 
                    bgcolor: 'rgba(255,255,255,0.1)' 
                  }
                }}
              >
                {t('common.refresh')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => navigate('/students/bulk-import')}
                sx={{ 
                  borderRadius: 2,
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': { 
                    borderColor: 'rgba(255,255,255,0.5)', 
                    bgcolor: 'rgba(255,255,255,0.1)' 
                  }
                }}
              >
                {t('common.import')}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/students/create')}
                sx={{ 
                  borderRadius: 2,
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  fontWeight: 700,
                  px: 3,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                  }
                }}
              >
                {t('students.addStudent')}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </MotionCard>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { icon: <PeopleIcon />, labelKey: 'dashboard.totalStudents', value: total, gradient: 'linear-gradient(135deg, #475569 0%, #334155 100%)', color: '#475569' },
          { icon: <ActiveIcon />, labelKey: 'students.active', value: students.filter(s => s.status === 'active').length || 0, gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#059669' },
          { icon: <SchoolIcon />, labelKey: 'students.class', value: new Set(students.map(s => s.class?.gradeLevel).filter(Boolean)).size || 0, gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#2563eb' },
          { icon: <GroupIcon />, labelKey: 'students.section', value: new Set(students.map(s => s.class?.section).filter(Boolean)).size || 0, gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#d97706' },
        ].map((stat, index) => {
          return (
          <Grid item xs={6} md={3} key={stat.labelKey}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              elevation={0}
              whileHover={{ scale: 1.02, y: -4 }}
              sx={{
                borderRadius: 4,
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`,
                background: theme.palette.mode === 'dark' ? 'rgba(28,28,30,0.6)' : 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                color: theme.palette.text.primary,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  boxShadow: `0 12px 32px ${alpha(stat.color, 0.2)}`,
                },
                '&::before': {
                  content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: stat.gradient,
                }
              }}
            >
              <Box sx={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: stat.gradient, opacity: 0.08 }} />
              <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 3, 
                  background: stat.gradient,
                  color: '#fff',
                  boxShadow: `0 4px 12px ${alpha(stat.color, 0.3)}`,
                  display: 'flex',
                }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={800}>{formatWithSeparators(stat.value)}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>{t(stat.labelKey)}</Typography>
                </Box>
              </CardContent>
            </MotionCard>
          </Grid>
        )})}
      </Grid>

      {/* Filters */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 2.5, 
          mb: 3,
          borderRadius: 4,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`,
          background: theme.palette.mode === 'dark' 
            ? 'rgba(28,28,30,0.6)' 
            : 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="subtitle1" fontWeight={600}>
            {t('common.filter')} & {t('common.search')}
          </Typography>
          {hasActiveFilters && (
            <Chip 
              label={`${formatNumber([search && '1', classFilter && '1', sectionFilter && '1', statusFilter && '1'].filter(Boolean).length)} ${t('common.active')}`}
              size="small"
              color="primary"
              sx={{ ml: 'auto', height: 22, fontSize: '0.7rem' }}
            />
          )}
        </Box>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label={t('common.search')}
              placeholder={`${t('students.firstName')}, ${t('students.studentId')}, ${t('students.contactNumber')}...`}
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <ToggleButtonGroup
                      value={searchMode}
                      exclusive
                      onChange={(_e, newMode) => newMode && setSearchMode(newMode)}
                      size="small"
                      sx={{ height: 28 }}
                    >
                      <ToggleButton value="exact" sx={{ px: 1.5, py: 0.5 }}>
                        <Tooltip title={t('students.exactSearch') || 'Exact Search'}>
                          <ExactIcon fontSize="small" />
                        </Tooltip>
                      </ToggleButton>
                      <ToggleButton value="fuzzy" sx={{ px: 1.5, py: 0.5 }}>
                        <Tooltip title={t('students.fuzzySearch') || 'Fuzzy Search (handles typos)'}>
                          <Badge badgeContent="AI" color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.5rem', height: 14, minWidth: 14 } }}>
                            <FuzzyIcon fontSize="small" />
                          </Badge>
                        </Tooltip>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                }
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('students.class')}</InputLabel>
              <Select
                value={classFilter}
                label={t('students.class')}
                onChange={(e) => setClassFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">{t('reports.all')} {t('students.class')}</MenuItem>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((c) => (
                  <MenuItem key={c} value={c}>{t('students.class')} {formatNumber(c)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('students.section')}</InputLabel>
              <Select
                value={sectionFilter}
                label={t('students.section')}
                onChange={(e) => setSectionFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">{t('reports.all')} {t('students.section')}</MenuItem>
                {['A', 'B', 'C'].map((s) => (
                  <MenuItem key={s} value={s}>{t('students.section')} {s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('students.status')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('students.status')}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">{t('reports.all')} {t('students.status')}</MenuItem>
                <MenuItem value="active">{t('students.active')}</MenuItem>
                <MenuItem value="inactive">{t('students.inactive')}</MenuItem>
                <MenuItem value="graduated">{t('students.graduated')}</MenuItem>
                <MenuItem value="transferred">{t('students.transferred')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              sx={{ 
                borderRadius: 2,
                borderColor: alpha(theme.palette.primary.main, 0.3),
                '&:hover': { borderColor: theme.palette.primary.main }
              }}
            >
              {t('common.clear')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Student Table */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 4,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`,
          background: theme.palette.mode === 'dark' 
            ? 'rgba(28,28,30,0.6)' 
            : 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Table Header Bar */}
        <Box sx={{ 
          px: 3, 
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.primary.main, 0.02),
        }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {t('students.studentList')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('common.showing')} {formatNumber(students.length)} {t('common.of').toLowerCase()} {formatWithSeparators(total)} {t('students.title').toLowerCase()}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ 
                bgcolor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.background.default, 0.8)
                  : alpha(theme.palette.primary.main, 0.04)
              }}>
                <TableCell sx={{ fontWeight: 700 }}>{t('students.photo') || 'Photo'}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('students.studentId')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('students.firstName')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('students.class')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('students.section')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('students.contactNumber')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('students.status')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{t('common.actions') || 'Actions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow key="loading">
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">{t('common.loading')}</Typography>
                  </TableCell>
                </TableRow>
              )}
              {!loading && students.length === 0 && (
                <TableRow key="no-data">
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                      <Typography color="text.secondary">{t('messages.noData')}</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {!loading && students.length > 0 && students.map((student, index) => (
                <TableRow 
                  key={student.studentId} 
                  hover
                  sx={{ 
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: `fadeInUp 0.4s ease-out ${index * 0.03}s both`,
                    '@keyframes fadeInUp': {
                      from: { opacity: 0, transform: 'translateY(10px)' },
                      to: { opacity: 1, transform: 'translateY(0)' },
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.06),
                      transform: 'translateX(4px)',
                      boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.12)}`,
                      borderLeft: `3px solid ${theme.palette.primary.main}`,
                    },
                    borderLeft: `3px solid transparent`,
                  }}
                >
                  <TableCell>
                    <Avatar
                      src={student.photoUrl}
                      alt={`${student.firstNameEn} ${student.lastNameEn}`}
                      sx={{ 
                        width: 44, 
                        height: 44,
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`
                      }}
                    >
                      {student.firstNameEn?.[0] || student.lastNameEn?.[0] || '?'}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {student.studentCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" fontWeight={600}>
                        {`${student.firstNameEn || ''} ${student.lastNameEn || ''}`}
                      </Typography>
                      {getMatchTypeBadge(student.studentId)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={student.class?.gradeLevel ? formatNumber(student.class.gradeLevel.toString()) : '-'} 
                      size="small"
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {student.class?.section || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {student.phone || student.email || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t(STATUS_CONFIG[student.status]?.labelKey || student.status)}
                      size="small"
                      sx={{
                        bgcolor: alpha(STATUS_CONFIG[student.status]?.bg || '#6b7280', 0.12),
                        color: STATUS_CONFIG[student.status]?.color || '#6b7280',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/students/${student.studentId}`)}
                        title={t('common.view')}
                        sx={{
                          color: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.primary.main, 0.15),
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/students/${student.studentId}/edit`)}
                        title={t('common.edit')}
                        sx={{
                          color: theme.palette.warning.main,
                          bgcolor: alpha(theme.palette.warning.main, 0.08),
                          '&:hover': { 
                            bgcolor: alpha(theme.palette.warning.main, 0.15),
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 20, 50, 100]}
          component="div"
          count={total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        />
      </Paper>
    </Box>
  );
};

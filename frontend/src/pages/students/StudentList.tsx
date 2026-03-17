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
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { apiClient } from '../../services/apiClient';
import { motion } from 'framer-motion';
import { useNepaliNumbers } from '../../hooks/useNepaliNumbers';
import { C, useAdminStyles } from '../../theme/designTokens';

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
  active: { color: C.success, bg: C.success, labelKey: 'students.active' },
  inactive: { color: C.neutral, bg: C.neutral, labelKey: 'students.inactive' },
  graduated: { color: C.primary, bg: C.primary, labelKey: 'students.graduated' },
  transferred: { color: C.warning, bg: C.warning, labelKey: 'students.transferred' },
};

export const StudentList = () => {
  const { t, i18n } = useTranslation();
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const theme = useTheme();
  const S = useAdminStyles(theme);
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
      exact: { bg: C.success, text: '#fff' },
      fuzzy: { bg: C.warning, text: '#fff' },
      phonetic: { bg: C.purple, text: '#fff' },
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

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh' }} key={i18n.language}>
      {/* Hero Header — Liquid Glass (matching Dashboard) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            mb: 3,
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            background: isDark
              ? 'linear-gradient(135deg, rgba(102,126,234,0.12) 0%, rgba(118,75,162,0.08) 50%, rgba(240,147,251,0.06) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.62) 100%)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            border: isDark
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(255,255,255,0.65)',
            boxShadow: isDark
              ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.3)'
              : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 8px 32px rgba(102,126,234,0.08)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '45%',
              background: isDark
                ? 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)',
              pointerEvents: 'none',
              borderRadius: '24px 24px 0 0',
              zIndex: 1,
            },
          }}
        >
          <Box sx={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(102,126,234,0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(102,126,234,0.12) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)', animation: 'liquidFloat 8s ease-in-out infinite' }} />
          <Box sx={{ position: 'absolute', bottom: -40, left: '30%', width: 160, height: 160, borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(240,147,251,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(240,147,251,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(30px)', animation: 'liquidFloat 10s ease-in-out infinite reverse' }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <PeopleIcon sx={{ fontSize: 32, color: C.neutral }} />
                <Typography variant="h4" fontWeight={800} sx={{
                  color: 'text.primary',
                  letterSpacing: '-0.02em',
                }}>
                  {t('students.title')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <TrendingUp sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {formatWithSeparators(total)} {t('dashboard.totalStudents').toLowerCase()}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Tooltip title={t('common.refresh')}>
                <span>
                <IconButton
                  onClick={() => fetchStudents()}
                  disabled={loading}
                  sx={{
                    background: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(102, 126, 234, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    p: 1.2,
                    '&:hover': {
                      background: isDark
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(102, 126, 234, 0.2)',
                    }
                  }}
                >
                  <RefreshIcon sx={{
                    fontSize: 20,
                    animation: loading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    }
                  }} />
                </IconButton>
                </span>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => navigate(`/students/bulk-import`)}
                sx={{
                  borderRadius: 2,
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(102,126,234,0.3)',
                  color: isDark ? 'rgba(255,255,255,0.9)' : C.neutral,
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(102,126,234,0.5)',
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(102,126,234,0.05)',
                  }
                }}
              >
                {t('common.import')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/students/bulk-add`)}
                sx={{
                  borderRadius: 2,
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(102,126,234,0.3)',
                  color: isDark ? 'rgba(255,255,255,0.9)' : C.neutral,
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(102,126,234,0.5)',
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(102,126,234,0.05)',
                  }
                }}
              >
                {t('students.bulkAdd')}
              </Button>
              <Button
                startIcon={<AddIcon />}
                onClick={() => navigate(`/students/create`)}
                sx={{
                  borderRadius: 2,
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(102,126,234,0.35) 0%, rgba(118,75,162,0.3) 100%)'
                    : 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.15) 100%)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: isDark ? '1px solid rgba(102,126,234,0.3)' : '1px solid rgba(102,126,234,0.25)',
                  color: isDark ? '#fff' : C.neutral,
                  fontWeight: 600,
                  boxShadow: isDark
                    ? '0 6px 20px rgba(102,126,234,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 6px 20px rgba(102,126,234,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
                  transition: 'all 0.4s cubic-bezier(0.2, 0, 0, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: isDark
                      ? '0 12px 32px rgba(102,126,234,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'
                      : '0 12px 32px rgba(102,126,234,0.25), inset 0 1px 0 rgba(255,255,255,0.7)',
                  }
                }}
              >
                {t('students.addStudent')}
              </Button>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Quick Stats - Matching Dashboard Style */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { icon: <PeopleIcon />, labelKey: 'dashboard.totalStudents', value: total, color: C.neutral, bg: 'linear-gradient(135deg, #475569 0%, #334155 100%)' },
          { icon: <ActiveIcon />, labelKey: 'students.active', value: students.filter(s => s.status === 'active').length || 0, color: C.success, bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
          { icon: <SchoolIcon />, labelKey: 'students.class', value: new Set(students.map(s => s.class?.gradeLevel).filter(Boolean)).size || 0, color: C.primary, bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' },
          { icon: <GroupIcon />, labelKey: 'students.section', value: new Set(students.map(s => s.class?.section).filter(Boolean)).size || 0, color: C.warning, bg: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)' },
        ].map((stat, index) => (
          <Grid item xs={6} md={3} key={stat.labelKey}>
            <MotionCard
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1, type: 'spring', stiffness: 120, damping: 12 }}
              whileHover={{ scale: 1.04, y: -6 }}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                position: 'relative',
                background: isDark
                  ? `linear-gradient(145deg, ${alpha(stat.color, 0.18)} 0%, ${alpha(stat.color, 0.06)} 100%)`
                  : `linear-gradient(145deg, ${alpha(stat.color, 0.14)} 0%, ${alpha(stat.color, 0.04)} 100%)`,
                backdropFilter: 'blur(10px) saturate(120%)',
                WebkitBackdropFilter: 'blur(10px) saturate(120%)',
                border: `1px solid ${alpha(stat.color, isDark ? 0.2 : 0.25)}`,
                boxShadow: `0 2px 8px ${alpha(stat.color, 0.1)}`,
                transition: 'all 0.3s ease',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '50%',
                  background: `linear-gradient(180deg, ${alpha('#ffffff', isDark ? 0.03 : 0.15)} 0%, transparent 100%)`,
                  pointerEvents: 'none',
                  borderRadius: '8px 8px 0 0',
                  zIndex: 1,
                },
                '&:hover': {
                  boxShadow: `0 4px 12px ${alpha(stat.color, 0.15)}`,
                  border: `1px solid ${alpha(stat.color, isDark ? 0.3 : 0.35)}`,
                },
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${alpha(stat.color, isDark ? 0.15 : 0.1)} 0%, transparent 70%)`,
                  pointerEvents: 'none',
                  filter: 'blur(20px)',
                }}
              />
              <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: stat.bg,
                      color: '#fff',
                      boxShadow: `0 4px 12px ${alpha(stat.color, 0.3)}`,
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5, color: 'text.primary' }}>
                  {formatWithSeparators(stat.value)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {t(stat.labelKey)}
                </Typography>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* Filters - Matching Dashboard Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Box
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            background: isDark
              ? 'rgba(30, 30, 40, 0.6)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: isDark
              ? '0 2px 8px rgba(0,0,0,0.3)'
              : '0 2px 8px rgba(0,0,0,0.04)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '30%',
              background: isDark
                ? 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 1,
              borderRadius: '8px 8px 0 0',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, position: 'relative', zIndex: 2 }}>
            <FilterIcon sx={{ color: C.neutral }} />
            <Typography variant="subtitle1" fontWeight={700}>
              {t('common.filter')} & {t('common.search')}
            </Typography>
            {hasActiveFilters && (
              <Chip 
                label={`${formatNumber([search && '1', classFilter && '1', sectionFilter && '1', statusFilter && '1'].filter(Boolean).length)} ${t('common.active')}`}
                size="small"
                sx={{
                  ml: 'auto',
                  height: 22,
                  fontSize: '0.7rem',
                  bgcolor: alpha(C.neutral, 0.15),
                  color: C.neutral,
                  fontWeight: 700,
                }}
              />
            )}
          </Box>
          <Grid container spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 2 }}>
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
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
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
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  }}
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
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  }}
                >
                  <MenuItem value="">{t('reports.all')} {t('students.section')}</MenuItem>
                  {['A', 'B', 'C', 'D', 'E'].map((s) => (
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
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  }}
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
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                  '&:hover': {
                    borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  },
                  '&:disabled': {
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  }
                }}
              >
                {t('common.clear')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </motion.div>

      {/* Student Table */}
      <Paper 
        elevation={0}
        sx={{ 
          ...S.GLASS,
          borderRadius: 2,
          overflow: 'hidden',
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
              <TableRow sx={{ bgcolor: S.TH_BG }}>
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
                        bgcolor: alpha(STATUS_CONFIG[student.status]?.bg || C.neutral, 0.12),
                        color: STATUS_CONFIG[student.status]?.color || C.neutral,
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

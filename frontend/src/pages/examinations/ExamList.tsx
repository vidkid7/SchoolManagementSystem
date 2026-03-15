/**
 * Exam List Page
 * View and manage all examinations
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
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
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Grade as GradeIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface Exam {
  examId: number;
  name: string;
  type: string;
  className: string;
  subjectName: string;
  examDate: string;
  fullMarks: number;
  status: string;
}

const statusColors: Record<string, any> = {
  scheduled: 'info',
  ongoing: 'warning',
  completed: 'success',
  cancelled: 'error',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Scheduled',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const examTypes: Record<string, string> = {
  unit_test: 'Unit Test',
  first_terminal: 'First Terminal',
  second_terminal: 'Second Terminal',
  final: 'Final',
  practical: 'Practical',
  project: 'Project',
};

export function ExamList() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Build query parameters
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (classFilter) params.classId = classFilter;
      
      // Fetch from API
      const response = await apiClient.get('/examinations', { params });
      const apiExams = response.data?.data || [];
      
      // Transform API data to match our interface
      const transformedExams = apiExams.map((exam: any) => ({
        examId: exam.examId || exam.id,
        name: exam.name || exam.examName,
        type: exam.type || exam.examType,
        className: exam.className || `Class ${exam.classId}`,
        subjectName: exam.subjectName || exam.subject?.name || 'N/A',
        examDate: exam.examDate || exam.date,
        fullMarks: exam.fullMarks || exam.totalMarks || 100,
        status: exam.status || 'scheduled',
      }));
      
      setExams(transformedExams);
    } catch (error: any) {
      console.error('Failed to fetch exams:', error);
      setError(error.response?.data?.message || t('examinations.failedToLoadExaminations'));
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    if (statusFilter || typeFilter || classFilter) {
      fetchExams();
    }
  }, [statusFilter, typeFilter, classFilter]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, exam: Exam) => {
    setAnchorEl(event.currentTarget);
    setSelectedExam(exam);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: string) => {
    if (!selectedExam) return;
    
    handleMenuClose();
    
    switch (action) {
      case 'view':
        navigate(`/examinations/${selectedExam.examId}`);
        break;
      case 'edit':
        navigate(`/examinations/${selectedExam.examId}/edit`);
        break;
      case 'grades':
        navigate(`/examinations/grades`);
        break;
      case 'delete':
        handleDelete();
        break;
    }
  };

  const handleDelete = async () => {
    if (!selectedExam) return;
    
    if (window.confirm(t('examinations.confirmDeleteExam'))) {
      try {
        await apiClient.delete(`/examinations/${selectedExam.examId}`);
        setSuccess(t('examinations.examDeletedSuccessfully'));
        setTimeout(() => setSuccess(''), 3000);
        fetchExams();
      } catch (error: any) {
        setError(error.response?.data?.message || t('examinations.failedToDeleteExam'));
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  return (
    <Box>
      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            {t('examinations.examinationManagement')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/examinations/create`)}
            sx={S.BTN_PRIMARY}
          >
            {t('examinations.createExam')}
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>{t('common.status')}</InputLabel>
              <Select
                value={statusFilter}
                label={t('common.status')}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">{t('examinations.allStatuses')}</MenuItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>{t('examinations.examType')}</InputLabel>
              <Select
                value={typeFilter}
                label={t('examinations.examType')}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">{t('examinations.allTypes')}</MenuItem>
                {Object.entries(examTypes).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>{t('common.class')}</InputLabel>
              <Select
                value={classFilter}
                label={t('common.class')}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <MenuItem value="">{t('common.allClasses')}</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                  <MenuItem key={cls} value={cls}>{t('common.class')} {cls}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ ...S.GLASS }}>
          <Table>
            <TableHead sx={{ bgcolor: S.TH_BG }}>
              <TableRow>
                <TableCell>{t('examinations.examName')}</TableCell>
                <TableCell>{t('examinations.type')}</TableCell>
                <TableCell>{t('common.class')}</TableCell>
                <TableCell>{t('common.subject')}</TableCell>
                <TableCell>{t('examinations.date')}</TableCell>
                <TableCell>{t('examinations.fullMarks')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow sx={S.TR_HOVER}>
                  <TableCell colSpan={8} align="center" sx={S.TD}>
                    <Typography color="text.secondary">
                      {t('examinations.noExaminationsFound')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.examId} hover sx={S.TR_HOVER}>
                    <TableCell sx={S.TD}>{exam.name}</TableCell>
                    <TableCell sx={S.TD}>{examTypes[exam.type] || exam.type}</TableCell>
                    <TableCell sx={S.TD}>{exam.className}</TableCell>
                    <TableCell sx={S.TD}>{exam.subjectName}</TableCell>
                    <TableCell sx={S.TD}>
                      {new Date(exam.examDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={S.TD}>{exam.fullMarks}</TableCell>
                    <TableCell sx={S.TD}>
                      <Chip
                        label={statusLabels[exam.status] || exam.status}
                        color={statusColors[exam.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, exam)}
                      >
                        <MoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction('view')}>
          <ViewIcon sx={{ mr: 1 }} fontSize="small" />
          {t('examinations.viewDetails')}
        </MenuItem>
        <MenuItem onClick={() => handleAction('edit')}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          {t('common.edit')}
        </MenuItem>
        <MenuItem onClick={() => handleAction('grades')}>
          <GradeIcon sx={{ mr: 1 }} fontSize="small" />
          {t('examinations.enterGrades')}
        </MenuItem>
        <MenuItem onClick={() => handleAction('delete')}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          {t('common.delete')}
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default ExamList;

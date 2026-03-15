/**
 * Exam Details Page
 * View detailed information about a specific exam
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
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Grade as GradeIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface ExamDetails {
  examId: number;
  name: string;
  type: string;
  className: string;
  subjectName: string;
  examDate: string;
  fullMarks: number;
  passMarks: number;
  status: string;
  description?: string;
  duration?: number;
  totalStudents?: number;
  gradesEntered?: number;
}

const statusColors: Record<string, any> = {
  scheduled: 'info',
  ongoing: 'warning',
  completed: 'success',
  cancelled: 'error',
};

export function ExamDetails() {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { municipalitySlug, examId } = useParams();
  const navigate = useSlugNavigate();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExamDetails();
  }, [examId]);

  const fetchExamDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await apiClient.get(`/examinations/${examId}`);
      const data = response.data?.data || response.data;
      
      setExam({
        examId: data.examId || data.id,
        name: data.name || data.examName,
        type: data.type || data.examType,
        className: data.className || `Class ${data.classId}`,
        subjectName: data.subjectName || data.subject?.name || 'N/A',
        examDate: data.examDate || data.date,
        fullMarks: data.fullMarks || data.totalMarks || 100,
        passMarks: data.passMarks || 40,
        status: data.status || 'scheduled',
        description: data.description,
        duration: data.duration,
        totalStudents: data.totalStudents,
        gradesEntered: data.gradesEntered,
      });
    } catch (error: any) {
      console.error('Failed to fetch exam details:', error);
      setError(error.response?.data?.message || t('examinations.failedToLoadExamDetails'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!exam) return;
    
    if (window.confirm(t('examinations.confirmDeleteExam'))) {
      try {
        await apiClient.delete(`/examinations/${exam.examId}`);
        navigate(`/examinations/list`);
      } catch (error: any) {
        setError(error.response?.data?.message || t('examinations.failedToDeleteExam'));
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !exam) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || t('examinations.examNotFound')}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(`/examinations/list`)}
          sx={{ mt: 2 }}
        >
          {t('common.back')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ ...S.GLASS, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate(`/examinations/list`)}
              sx={S.BTN_GHOST}
            >
              {t('common.back')}
            </Button>
            <Typography variant="h5" fontWeight={600}>
              {exam.name}
            </Typography>
            <Chip
              label={exam.status}
              color={statusColors[exam.status] || 'default'}
              size="small"
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/examinations/${exam.examId}/edit`)}
              sx={S.BTN_OUTLINE}
            >
              {t('common.edit')}
            </Button>
            <Button
              variant="contained"
              startIcon={<GradeIcon />}
              onClick={() => navigate(`/examinations/grades`)}
              sx={S.BTN_PRIMARY}
            >
              {t('examinations.enterGrades')}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              sx={{ ...S.BTN_OUTLINE, ...S.BTN_DANGER }}
            >
              {t('common.delete')}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('examinations.examName')}
            </Typography>
            <Typography variant="body1" fontWeight={500} mb={2}>
              {exam.name}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('examinations.type')}
            </Typography>
            <Typography variant="body1" fontWeight={500} mb={2}>
              {exam.type}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('common.class')}
            </Typography>
            <Typography variant="body1" fontWeight={500} mb={2}>
              {exam.className}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('common.subject')}
            </Typography>
            <Typography variant="body1" fontWeight={500} mb={2}>
              {exam.subjectName}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('examinations.date')}
            </Typography>
            <Typography variant="body1" fontWeight={500} mb={2}>
              {new Date(exam.examDate).toLocaleDateString()}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('examinations.fullMarks')}
            </Typography>
            <Typography variant="body1" fontWeight={500} mb={2}>
              {exam.fullMarks}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {t('examinations.passMarks')}
            </Typography>
            <Typography variant="body1" fontWeight={500} mb={2}>
              {exam.passMarks}
            </Typography>

            {exam.duration && (
              <>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {t('examinations.duration')}
                </Typography>
                <Typography variant="body1" fontWeight={500} mb={2}>
                  {exam.duration} {t('examinations.minutes')}
                </Typography>
              </>
            )}
          </Grid>

          {exam.description && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('common.description')}
              </Typography>
              <Typography variant="body1">
                {exam.description}
              </Typography>
            </Grid>
          )}

          {(exam.totalStudents !== undefined || exam.gradesEntered !== undefined) && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                {t('examinations.gradeStatus')}
              </Typography>
              <Grid container spacing={2}>
                {exam.totalStudents !== undefined && (
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ ...S.GLASS, p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {exam.totalStudents}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('examinations.totalStudents')}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {exam.gradesEntered !== undefined && (
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ ...S.GLASS, p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {exam.gradesEntered}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('examinations.gradesEntered')}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
}

export default ExamDetails;

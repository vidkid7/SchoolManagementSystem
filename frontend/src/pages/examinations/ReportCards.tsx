/**
 * Report Cards Page
 * Generate and view student report cards
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Stack,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Send as SendIcon,
  Assessment as ReportIcon,
  School as SchoolIcon,
  CheckCircle as CheckIcon,
  CalendarToday as CalendarIcon,
  Class as ClassIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import apiClient from '../../services/apiClient';
import { useCurrentAcademicYear } from '../../hooks/useCurrentAcademicYear';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface Student {
  studentId: number;
  studentCode: string;
  firstName: string;
  lastName: string;
  rollNumber: number;
}


export function ReportCards() {
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const { currentYear, academicYears } = useCurrentAcademicYear();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  
  const [filters, setFilters] = useState({
    academicYear: '',
    term: '',
    class: '',
    section: '',
  });

  const [classes, setClasses] = useState<any[]>([]);

  // Auto-select current year when it loads
  useEffect(() => {
    if (currentYear && !filters.academicYear) {
      setFilters(prev => ({ ...prev, academicYear: String(currentYear.academicYearId) }));
    }
  }, [currentYear]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (filters.class) {
      fetchStudents();
    }
  }, [filters.class, filters.section]);

  const fetchInitialData = async () => {
    try {
      const classesRes = await apiClient.get('/academic/classes').catch(() => ({ data: { data: [] } }));
      setClasses(classesRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  };

  const fetchStudents = async () => {
    if (!filters.class) {
      setStudents([]);
      return;
    }
    
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        classId: filters.class,
        limit: 100,
      };
      if (filters.section) {
        params.section = filters.section;
      }
      
      const response = await apiClient.get('/students', { params });
      const apiStudents = response.data?.data || [];
      const mappedStudents = apiStudents.map((student: any) => ({
        studentId: student.studentId,
        studentCode: student.studentCode || '',
        firstName: student.firstNameEn || student.firstName || '',
        lastName: student.lastNameEn || student.lastName || '',
        rollNumber: student.rollNumber || 0,
      }));
      
      setStudents(mappedStudents);
      setSelectedStudent('');
      
      if (mappedStudents.length === 0) {
        setError(t('examinations.noStudentsFound'));
      }
    } catch (err: any) {
      console.error('Failed to fetch students:', err);
      setError(err.response?.data?.message || t('examinations.failedToFetchStudents'));
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters({
      ...filters,
      [name]: value,
    });
    if (name === 'class') {
      setStudents([]);
      setSelectedStudent('');
    }
  };

  const handleGenerateReport = async (studentId?: string) => {
    const targetStudent = studentId || selectedStudent;
    if (!targetStudent) {
      setError(t('examinations.pleaseSelectStudent'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filters.term) params.append('termId', filters.term);
      if (filters.academicYear) params.append('academicYearId', filters.academicYear);
      params.append('language', 'bilingual');
      params.append('format', 'ledger');

      const response = await apiClient.get(`/examinations/report-card/${targetStudent}?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_card_${targetStudent}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(t('examinations.reportCardDownloaded'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      // Handle different error scenarios
      if (err.response?.status === 500) {
        setError(t('examinations.reportCardGenerationError'));
      } else if (err.response?.status === 404) {
        setError(t('examinations.reportCardNotFound'));
      } else {
        setError(err.response?.data?.message || t('examinations.failedToGenerateReportCard'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (students.length === 0) {
      setError(t('examinations.noStudentsForCriteria'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      for (const student of students) {
        await handleGenerateReport(student.studentId.toString());
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setSuccess(t('examinations.downloadedReportCards', { count: students.length }));
    } catch (err: any) {
      setError(t('examinations.failedToDownloadReportCards'));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEmail = async () => {
    if (students.length === 0) {
      setError(t('examinations.noStudentsForCriteria'));
      return;
    }

    try {
      setLoading(true);
      setSuccess(t('examinations.sendingReportCards'));
      
      await apiClient.post('/examinations/reports/email', {
        studentIds: students.map(s => s.studentId),
        termId: filters.term,
        academicYearId: filters.academicYear,
      });
      
      setSuccess(t('examinations.reportCardsSentViaEmail'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('examinations.failedToSendReportCards'));
    } finally {
      setLoading(false);
    }
  };

  const GLASS = S.GLASS;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: R.lg,
              background: C.primaryBg,
              border: `1px solid ${alpha(C.primary, 0.2)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ReportIcon sx={{ fontSize: 24, color: C.primary }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {t('examinations.generateReportCards')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('examinations.selectCriteriaToGenerate')}
            </Typography>
          </Box>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3, ...GLASS }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3, ...GLASS }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters Card */}
      <Paper sx={{ ...GLASS, p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon sx={{ fontSize: 20, color: C.primary }} />
          {t('examinations.selectCriteria')}
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('academic.academicYear')}</InputLabel>
              <Select
                value={filters.academicYear}
                label={t('academic.academicYear')}
                onChange={(e) => handleFilterChange('academicYear', e.target.value)}
              >
                <MenuItem value="">{t('common.select')} {t('academic.academicYear')}</MenuItem>
                {academicYears.map((year) => (
                  <MenuItem key={year.academicYearId} value={year.academicYearId}>
                    {year.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('examinations.term')}</InputLabel>
              <Select
                value={filters.term}
                label={t('examinations.term')}
                onChange={(e) => handleFilterChange('term', e.target.value)}
              >
                <MenuItem value="">{t('common.select')} {t('examinations.term')}</MenuItem>
                <MenuItem value="1">{t('examinations.firstTerm')}</MenuItem>
                <MenuItem value="2">{t('examinations.secondTerm')}</MenuItem>
                <MenuItem value="3">{t('examinations.thirdTerm')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('common.class')}</InputLabel>
              <Select
                value={filters.class}
                label={t('common.class')}
                onChange={(e) => handleFilterChange('class', e.target.value)}
              >
                <MenuItem value="">{t('common.select')} {t('common.class')}</MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls.classId} value={cls.classId}>
                    {t('common.class')} {cls.gradeLevel}{cls.section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('common.section')} ({t('common.optional')})</InputLabel>
              <Select
                value={filters.section}
                label={`${t('common.section')} (${t('common.optional')})`}
                onChange={(e) => handleFilterChange('section', e.target.value)}
              >
                <MenuItem value="">{t('common.allSections')}</MenuItem>
                <MenuItem value="A">{t('common.section')} A</MenuItem>
                <MenuItem value="B">{t('common.section')} B</MenuItem>
                <MenuItem value="C">{t('common.section')} C</MenuItem>
                <MenuItem value="D">{t('common.section')} D</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('students.student')}</InputLabel>
              <Select
                value={selectedStudent}
                label={t('students.student')}
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <MenuItem value="">{t('common.allStudents')}</MenuItem>
                {students.length === 0 ? (
                  <MenuItem value="" disabled>{t('examinations.noStudentsFound')}</MenuItem>
                ) : (
                  students.map((student) => (
                    <MenuItem key={student.studentId} value={String(student.studentId)}>
                      {student.rollNumber} - {student.firstName} {student.lastName}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            sx={S.BTN_PRIMARY}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ReportIcon />}
            onClick={() => handleGenerateReport()}
            disabled={loading || !selectedStudent || !filters.term || !filters.academicYear}
          >
            {t('examinations.generateReport')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleBulkDownload}
            disabled={loading || students.length === 0 || !filters.term || !filters.academicYear}
            sx={{ ...S.BTN_OUTLINE, 
              borderColor: C.primary,
              color: C.primary,
              '&:hover': { borderColor: C.primary, bgcolor: C.primaryBg },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {t('examinations.downloadAllPDF')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<SendIcon />}
            onClick={handleBulkEmail}
            disabled={loading || students.length === 0 || !filters.term || !filters.academicYear}
            sx={{ ...S.BTN_OUTLINE, 
              borderColor: C.purple,
              color: C.purple,
              '&:hover': { borderColor: C.purple, bgcolor: C.purpleBg },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {t('examinations.emailToParents')}
          </Button>
        </Stack>
        
        {(!filters.term || !filters.academicYear) && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {t('examinations.selectAcademicYearAndTerm')}
          </Typography>
        )}
      </Paper>

      {/* Students Table */}
      {students.length > 0 && (
        <Paper sx={{ ...GLASS, p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SchoolIcon sx={{ fontSize: 20, color: C.primary }} />
              {t('students.students')}
              <Chip label={students.length} size="small" sx={{ bgcolor: C.primaryBg, color: C.primary, fontWeight: 600 }} />
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>{t('students.rollNumber')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('students.studentId')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('common.name')}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow 
                    key={student.studentId}
                    sx={{ ...S.TR_HOVER, '&:hover': { bgcolor: alpha(C.primary, 0.05) } }}
                  >
                    <TableCell sx={S.TD}>{student.rollNumber}</TableCell>
                    <TableCell sx={S.TD}>{student.studentCode}</TableCell>
                    <TableCell sx={S.TD}>{student.firstName} {student.lastName}</TableCell>
                    <TableCell align="right" sx={S.TD}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleGenerateReport(student.studentId.toString())}
                        disabled={loading}
                        sx={{ ...S.BTN_OUTLINE, 
                          borderColor: C.primary,
                          color: C.primary,
                          '&:hover': { borderColor: C.primary, bgcolor: C.primaryBg },
                          textTransform: 'none',
                          fontSize: '0.75rem',
                        }}
                      >
                        {t('common.download')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Info Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ ...GLASS, p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon sx={{ fontSize: 20, color: C.success }} />
              {t('examinations.reportCardFeatures')}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1.5}>
              {[
                t('examinations.subjectWiseMarks'),
                t('examinations.overallGPA'),
                t('examinations.attendancePercentage'),
                t('examinations.teacherRemarks'),
                t('examinations.classRank'),
                t('examinations.comparisonPrevious'),
                t('examinations.bilingual'),
                t('examinations.principalSignature'),
              ].map((feature, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: C.success,
                    }}
                  />
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ ...GLASS, p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ClassIcon sx={{ fontSize: 20, color: C.purple }} />
              {t('examinations.quickActions')}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(`/examinations/grades`)}
                sx={{ ...S.BTN_OUTLINE, 
                  borderColor: C.primary,
                  color: C.primary,
                  '&:hover': { borderColor: C.primary, bgcolor: C.primaryBg },
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  py: 1.5,
                }}
              >
                {t('examinations.enterGradesFirst')}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(`/examinations/grading-scheme`)}
                sx={{ ...S.BTN_OUTLINE, 
                  borderColor: C.purple,
                  color: C.purple,
                  '&:hover': { borderColor: C.purple, bgcolor: C.purpleBg },
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  py: 1.5,
                }}
              >
                {t('examinations.configureGradingScheme')}
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(`/examinations/list`)}
                sx={{ ...S.BTN_OUTLINE, 
                  borderColor: C.neutral,
                  color: C.neutral,
                  '&:hover': { borderColor: C.neutral, bgcolor: C.neutralBg },
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  py: 1.5,
                }}
              >
                {t('examinations.viewAllExams')}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ReportCards;

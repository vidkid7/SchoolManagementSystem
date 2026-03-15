/**
 * Grade Entry Page
 * 
 * Teacher interface for entering and managing exam grades
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

interface Student {
  id: number;
  student_id: string;
  roll_number: number;
  first_name: string;
  last_name: string;
  theory_marks?: number;
  practical_marks?: number;
  total_marks?: number;
  grade?: string;
  grade_point?: number;
  status?: 'entered' | 'pending';
}

export const GradeEntry = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const S = useAdminStyles(theme);

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const theoryMarks = 75;
  const practicalMarks = 25;
  const hasPractical = true;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [subjectsRes, classesRes, examsRes] = await Promise.all([
        apiClient.get('/academic/subjects'),
        apiClient.get('/academic/classes'),
        apiClient.get('/examinations'),
      ]);
      setSubjects(subjectsRes.data?.data || []);
      setClasses(classesRes.data?.data || []);
      setExams(examsRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setSubjects([
        { subjectId: 1, nameEn: 'Mathematics', nameNp: 'गणित' },
        { subjectId: 2, nameEn: 'Science', nameNp: 'विज्ञान' },
        { subjectId: 3, nameEn: 'English', nameNp: 'अंग्रेजी' },
        { subjectId: 4, nameEn: 'Nepali', nameNp: 'नेपाली' },
        { subjectId: 5, nameEn: 'Social Studies', nameNp: 'सामाजिक' },
      ]);
    }
  };

  useEffect(() => {
    if (selectedExam && selectedClass && selectedSection && selectedSubject) {
      fetchStudents();
    }
  }, [selectedExam, selectedClass, selectedSection, selectedSubject]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch students from API
      const response = await apiClient.get('/students', {
        params: {
          classId: selectedClass,
          section: selectedSection,
          status: 'active',
        },
      });

      const apiStudents = response.data?.data || [];
      
      // Initialize students with empty grades
      const studentsWithGrades: Student[] = apiStudents.map((student: any) => ({
        id: student.studentId || student.id,
        student_id: student.studentId || student.id,
        roll_number: student.rollNumber || student.roll_number || 0,
        first_name: student.firstName || student.first_name || '',
        last_name: student.lastName || student.last_name || '',
        theory_marks: undefined,
        practical_marks: undefined,
        total_marks: undefined,
        grade: undefined,
        grade_point: undefined,
        status: 'pending' as const,
      }));

      setStudents(studentsWithGrades);

      // Fetch existing grades from grade-entry API if any
      if (selectedExam) {
        try {
          const gradesResponse = await apiClient.get(`/grades/exam/${selectedExam}`);
          const gradeList = gradesResponse.data?.data || [];
          const gradesMap = new Map(
            gradeList.map((g: any) => [g.studentId || g.student_id, g])
          );

          setStudents(studentsWithGrades.map((student: Student) => {
            const existingGrade: any = gradesMap.get(student.id);
            if (existingGrade) {
              return {
                ...student,
                theory_marks: existingGrade.theoryMarks || existingGrade.theory_marks,
                practical_marks: existingGrade.practicalMarks || existingGrade.practical_marks,
                total_marks: existingGrade.totalMarks || existingGrade.total_marks,
                grade: existingGrade.grade,
                grade_point: existingGrade.gradePoint || existingGrade.grade_point,
                status: 'entered' as const,
              };
            }
            return student;
          }));
        } catch (err) {
          // No existing grades, that's fine
          console.log('No existing grades found');
        }
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setError(t('examinations.failedToLoadStudents'));
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrade = (totalMarks: number): { grade: string; gradePoint: number } => {
    if (totalMarks >= 90) return { grade: 'A+', gradePoint: 4.0 };
    if (totalMarks >= 80) return { grade: 'A', gradePoint: 3.6 };
    if (totalMarks >= 70) return { grade: 'B+', gradePoint: 3.2 };
    if (totalMarks >= 60) return { grade: 'B', gradePoint: 2.8 };
    if (totalMarks >= 50) return { grade: 'C+', gradePoint: 2.4 };
    if (totalMarks >= 40) return { grade: 'C', gradePoint: 2.0 };
    if (totalMarks >= 35) return { grade: 'D', gradePoint: 1.6 };
    return { grade: 'NG', gradePoint: 0.0 };
  };

  const handleMarksChange = (studentId: number, field: 'theory_marks' | 'practical_marks', value: string) => {
    const marks = value === '' ? undefined : parseFloat(value);
    
    setStudents(students.map(student => {
      if (student.id !== studentId) return student;

      const updatedStudent = { ...student, [field]: marks };
      
      // Calculate total and grade
      const theory = updatedStudent.theory_marks || 0;
      const practical = hasPractical ? (updatedStudent.practical_marks || 0) : 0;
      const total = theory + practical;
      
      const { grade, gradePoint } = calculateGrade(total);
      
      return {
        ...updatedStudent,
        total_marks: total,
        grade,
        grade_point: gradePoint,
        status: 'pending' as const,
      };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const gradesData = students
        .filter(s => s.theory_marks !== undefined)
        .map(student => ({
          studentId: student.id,
          examId: selectedExam,
          subjectId: selectedSubject,
          theoryMarks: student.theory_marks || 0,
          practicalMarks: hasPractical ? (student.practical_marks || 0) : null,
          totalMarks: student.total_marks || 0,
          grade: student.grade || '',
          gradePoint: student.grade_point || 0,
        }));

      if (gradesData.length === 0) {
        setError(t('examinations.enterGradesForAtLeastOne'));
        return;
      }

      // Save grades via grade-entry API
      await apiClient.post('/grades/bulk', {
        examId: Number(selectedExam),
        grades: gradesData,
      });

      setSuccess(t('examinations.successfullySavedGrades', { count: gradesData.length }));
      
      // Update status
      setStudents(students.map(student => ({
        ...student,
        status: student.theory_marks !== undefined ? 'entered' as const : 'pending' as const,
      })));
    } catch (error: any) {
      console.error('Failed to save grades:', error);
      setError(error.response?.data?.message || t('examinations.failedToSaveGrades'));
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        // For now, show a message that the feature is coming soon
        // In production, you would parse the Excel/CSV file and populate the grades
        setSuccess(t('examinations.importFeatureComingSoon'));
      } catch (error) {
        setError(t('examinations.failedToImportGrades'));
      }
    };
    
    input.click();
  };

  const handleExport = () => {
    if (students.length === 0) {
      setError(t('examinations.noDataToExport'));
      return;
    }

    try {
      // Create CSV content
      const headers = [
        t('students.rollNumber'),
        t('students.studentId'),
        t('common.name'),
        t('examinations.theory') + ` (${t('common.max')}: ${theoryMarks})`,
        hasPractical ? t('examinations.practical') + ` (${t('common.max')}: ${practicalMarks})` : null,
        t('examinations.total'),
        t('examinations.grade'),
        'GPA',
      ].filter(Boolean);

      const rows = students.map(student => [
        student.roll_number,
        student.student_id,
        `${student.first_name} ${student.last_name}`,
        student.theory_marks ?? '',
        hasPractical ? (student.practical_marks ?? '') : null,
        student.total_marks?.toFixed(1) ?? '',
        student.grade ?? '',
        student.grade_point?.toFixed(1) ?? '',
      ].filter((_, index) => hasPractical || index !== 4));

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const examName = exams.find(e => e.examId === selectedExam || e.id === selectedExam)?.name || 'exam';
      const subjectName = subjects.find(s => s.subjectId.toString() === selectedSubject)?.nameEn || 'subject';
      const fileName = `grades_${examName}_${subjectName}_class${selectedClass}${selectedSection}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(t('examinations.exportedSuccessfully'));
    } catch (error) {
      console.error('Export error:', error);
      setError(t('examinations.failedToExportGrades'));
    }
  };

  const getEnteredCount = () => students.filter(s => s.status === 'entered').length;
  const getPendingCount = () => students.filter(s => s.status === 'pending').length;

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
            <AssessmentIcon sx={{ fontSize: 24, color: C.primary }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              {t('examinations.gradeEntry')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('examinations.enterStudentGrades')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${t('examinations.entered')}: ${getEnteredCount()}`}
              sx={{
                bgcolor: C.successBg,
                color: C.success,
                fontWeight: 600,
                border: `1px solid ${alpha(C.success, 0.2)}`,
              }}
            />
            <Chip
              label={`${t('examinations.pending')}: ${getPendingCount()}`}
              sx={{
                bgcolor: C.warningBg,
                color: C.warning,
                fontWeight: 600,
                border: `1px solid ${alpha(C.warning, 0.2)}`,
              }}
            />
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, ...S.GLASS }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, ...S.GLASS }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('examinations.exam')}</InputLabel>
              <Select
                value={selectedExam}
                label={t('examinations.exam')}
                onChange={(e) => setSelectedExam(e.target.value)}
              >
                <MenuItem value="">{t('common.select')} {t('examinations.exam')}</MenuItem>
                {exams.length === 0 ? (
                  <MenuItem value="" disabled>{t('examinations.noExamsAvailable')}</MenuItem>
                ) : (
                  exams.map((exam) => (
                    <MenuItem key={exam.examId || exam.id} value={exam.examId || exam.id}>
                      {exam.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('common.class')}</InputLabel>
              <Select
                value={selectedClass}
                label={t('common.class')}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <MenuItem value="">{t('common.select')} {t('common.class')}</MenuItem>
                {classes.length === 0 ? (
                  [...Array(12)].map((_, i) => (
                    <MenuItem key={i + 1} value={(i + 1).toString()}>
                      {t('common.class')} {i + 1}
                    </MenuItem>
                  ))
                ) : (
                  classes.map((cls) => (
                    <MenuItem key={cls.classId} value={cls.classId}>
                      {t('common.class')} {cls.gradeLevel}{cls.section}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('common.section')}</InputLabel>
              <Select
                value={selectedSection}
                label={t('common.section')}
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <MenuItem value="">{t('common.select')} {t('common.section')}</MenuItem>
                <MenuItem value="A">{t('common.section')} A</MenuItem>
                <MenuItem value="B">{t('common.section')} B</MenuItem>
                <MenuItem value="C">{t('common.section')} C</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('common.subject')}</InputLabel>
              <Select
                value={selectedSubject}
                label={t('common.subject')}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <MenuItem value="">{t('common.select')} {t('common.subject')}</MenuItem>
                {subjects.length === 0 ? (
                  <MenuItem value="" disabled>
                    {t('common.loading')}...
                  </MenuItem>
                ) : (
                  subjects.map((subject) => (
                    <MenuItem key={subject.subjectId} value={subject.subjectId.toString()}>
                      {subject.nameEn}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                sx={{ ...S.BTN_OUTLINE, 
                  borderColor: C.primary,
                  color: C.primary,
                  '&:hover': { borderColor: C.primary, bgcolor: C.primaryBg },
                  textTransform: 'none',
                }}
              >
                {t('common.export')}
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<UploadIcon />}
                onClick={handleBulkImport}
                sx={{ ...S.BTN_OUTLINE, 
                  borderColor: C.primary,
                  color: C.primary,
                  '&:hover': { borderColor: C.primary, bgcolor: C.primaryBg },
                  textTransform: 'none',
                }}
              >
                {t('common.import')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Grade Entry Table */}
      {loading ? (
        <Paper sx={{ ...S.GLASS, p: 3 }}>
          <Typography align="center">{t('common.loading')}...</Typography>
        </Paper>
      ) : students.length === 0 ? (
        <Paper sx={{ ...S.GLASS, p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {t('examinations.selectAllCriteria')}
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ ...S.GLASS }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: S.TH_BG }}>
                <TableRow sx={{ bgcolor: alpha(C.primary, 0.05) }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t('students.rollNumber')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('students.studentId')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('common.name')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    {t('examinations.theory')}<br />
                    ({t('common.max')}: {theoryMarks})
                  </TableCell>
                  {hasPractical && (
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      {t('examinations.practical')}<br />
                      ({t('common.max')}: {practicalMarks})
                    </TableCell>
                  )}
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{t('examinations.total')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{t('examinations.grade')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>GPA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{t('common.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} hover sx={{ ...S.TR_HOVER, '&:hover': { bgcolor: alpha(C.primary, 0.03) } }}>
                    <TableCell sx={S.TD}>{student.roll_number}</TableCell>
                    <TableCell sx={S.TD}>{student.student_id}</TableCell>
                    <TableCell sx={S.TD}>{`${student.first_name} ${student.last_name}`}</TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <TextField
                        type="number"
                        size="small"
                        value={student.theory_marks ?? ''}
                        onChange={(e) => handleMarksChange(student.id, 'theory_marks', e.target.value)}
                        inputProps={{ min: 0, max: theoryMarks, step: 0.5 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    {hasPractical && (
                      <TableCell align="center" sx={S.TD}>
                        <TextField
                          type="number"
                          size="small"
                          value={student.practical_marks ?? ''}
                          onChange={(e) => handleMarksChange(student.id, 'practical_marks', e.target.value)}
                          inputProps={{ min: 0, max: practicalMarks, step: 0.5 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                    )}
                    <TableCell align="center" sx={S.TD}>
                      <Typography fontWeight="bold">
                        {student.total_marks?.toFixed(1) || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={S.TD}>
                      <Chip
                        label={student.grade || '-'}
                        sx={{
                          bgcolor: student.grade === 'NG' ? C.warningBg : C.successBg,
                          color: student.grade === 'NG' ? C.warning : C.success,
                          fontWeight: 600,
                          border: `1px solid ${alpha(student.grade === 'NG' ? C.warning : C.success, 0.2)}`,
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={S.TD}>
                      {student.grade_point?.toFixed(1) || '-'}
                    </TableCell>
                    <TableCell align="center" sx={S.TD}>
                      {student.status === 'entered' ? (
                        <IconButton size="small" sx={{ color: C.success }}>
                          <CheckIcon />
                        </IconButton>
                      ) : (
                        <Chip 
                          label={t('examinations.pending')} 
                          size="small" 
                          sx={{
                            bgcolor: C.warningBg,
                            color: C.warning,
                            fontWeight: 600,
                            border: `1px solid ${alpha(C.warning, 0.2)}`,
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving || students.length === 0}
              sx={{ ...S.BTN_PRIMARY, minWidth: 200 }}
            >
              {saving ? `${t('common.saving')}...` : t('examinations.saveGrades')}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

/**
 * Grade Entry Page
 * 
 * Teacher interface for entering and managing exam grades
 */

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import api from '../../config/api';

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
        api.get('/academic/subjects'),
        api.get('/academic/classes'),
        api.get('/examinations'),
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
      const response = await api.get('/students', {
        params: {
          classId: selectedClass,
          section: selectedSection,
          status: 'active',
        },
      });

      const apiStudents = response.data?.data || [];
      
      // Initialize students with empty grades
      const studentsWithGrades = apiStudents.map((student: any) => ({
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

      // Fetch existing grades if any
      if (selectedExam) {
        try {
          const gradesResponse = await api.get(`/examinations/${selectedExam}/grades`, {
            params: {
              classId: selectedClass,
              section: selectedSection,
              subjectId: selectedSubject,
            },
          });

          // Merge existing grades
          const gradesMap = new Map(
            gradesResponse.data.data.map((g: any) => [g.studentId || g.student_id, g])
          );

          setStudents(studentsWithGrades.map((student) => {
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
      setError('Failed to load students. Please ensure the backend is running and students are seeded.');
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
        setError('Please enter grades for at least one student');
        return;
      }

      // Save grades via API
      await api.post(`/examinations/${selectedExam}/grades`, {
        grades: gradesData,
      });

      setSuccess(`Successfully saved grades for ${gradesData.length} students`);
      
      // Update status
      setStudents(students.map(student => ({
        ...student,
        status: student.theory_marks !== undefined ? 'entered' as const : 'pending' as const,
      })));
    } catch (error: any) {
      console.error('Failed to save grades:', error);
      setError(error.response?.data?.message || 'Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = () => {
    // In a real app, this would open a file upload dialog
    alert('Bulk import feature - Upload Excel file with grades');
  };

  const handleExport = () => {
    // In a real app, this would download an Excel template
    alert('Export feature - Download grade entry template');
  };

  const getEnteredCount = () => students.filter(s => s.status === 'entered').length;
  const getPendingCount = () => students.filter(s => s.status === 'pending').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Grade Entry / ग्रेड प्रविष्टि
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export Template / टेम्प्लेट निर्यात
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleBulkImport}
          >
            Bulk Import / थोक आयात
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Exam / परीक्षा</InputLabel>
              <Select
                value={selectedExam}
                label="Exam / परीक्षा"
                onChange={(e) => setSelectedExam(e.target.value)}
              >
                <MenuItem value="">Select Exam</MenuItem>
                {exams.length === 0 ? (
                  <MenuItem value="" disabled>No exams available</MenuItem>
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
            <FormControl fullWidth>
              <InputLabel>Class / कक्षा</InputLabel>
              <Select
                value={selectedClass}
                label="Class / कक्षा"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <MenuItem value="">Select Class</MenuItem>
                {classes.length === 0 ? (
                  [...Array(12)].map((_, i) => (
                    <MenuItem key={i + 1} value={(i + 1).toString()}>
                      Class {i + 1}
                    </MenuItem>
                  ))
                ) : (
                  classes.map((cls) => (
                    <MenuItem key={cls.classId} value={cls.classId}>
                      Class {cls.gradeLevel}{cls.section}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Section / खण्ड</InputLabel>
              <Select
                value={selectedSection}
                label="Section / खण्ड"
                onChange={(e) => setSelectedSection(e.target.value)}
              >
                <MenuItem value="A">Section A</MenuItem>
                <MenuItem value="B">Section B</MenuItem>
                <MenuItem value="C">Section C</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Subject / विषय</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject / विषय"
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {subjects.length === 0 ? (
                  <MenuItem value="" disabled>
                    Loading subjects... / विषयहरू लोड हुँदैछ...
                  </MenuItem>
                ) : (
                  subjects.map((subject) => (
                    <MenuItem key={subject.subjectId} value={subject.subjectId.toString()}>
                      {subject.nameEn} / {subject.nameNp}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`Entered: ${getEnteredCount()}`}
                color="success"
                size="small"
              />
              <Chip
                label={`Pending: ${getPendingCount()}`}
                color="warning"
                size="small"
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Grade Entry Table */}
      {loading ? (
        <Paper sx={{ p: 3 }}>
          <Typography align="center">Loading... / लोड हुँदैछ...</Typography>
        </Paper>
      ) : students.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography align="center">
            Please select exam, class, section, and subject / कृपया परीक्षा, कक्षा, खण्ड र विषय चयन गर्नुहोस्
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Roll No. / रोल नं</TableCell>
                  <TableCell>Student ID / विद्यार्थी ID</TableCell>
                  <TableCell>Name / नाम</TableCell>
                  <TableCell align="center">
                    Theory / सैद्धान्तिक<br />
                    (Max: {theoryMarks})
                  </TableCell>
                  {hasPractical && (
                    <TableCell align="center">
                      Practical / प्रयोगात्मक<br />
                      (Max: {practicalMarks})
                    </TableCell>
                  )}
                  <TableCell align="center">Total / कुल</TableCell>
                  <TableCell align="center">Grade / ग्रेड</TableCell>
                  <TableCell align="center">GPA</TableCell>
                  <TableCell align="center">Status / स्थिति</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>{student.roll_number}</TableCell>
                    <TableCell>{student.student_id}</TableCell>
                    <TableCell>{`${student.first_name} ${student.last_name}`}</TableCell>
                    <TableCell align="center">
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
                      <TableCell align="center">
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
                    <TableCell align="center">
                      <Typography fontWeight="bold">
                        {student.total_marks?.toFixed(1) || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={student.grade || '-'}
                        color={student.grade === 'NG' ? 'error' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {student.grade_point?.toFixed(1) || '-'}
                    </TableCell>
                    <TableCell align="center">
                      {student.status === 'entered' ? (
                        <IconButton size="small" color="success">
                          <CheckIcon />
                        </IconButton>
                      ) : (
                        <Chip label="Pending" size="small" color="warning" />
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
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving || students.length === 0}
              sx={{ minWidth: 200 }}
            >
              {saving ? 'Saving... / बचत गर्दै...' : 'Save Grades / ग्रेड बचत गर्नुहोस्'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

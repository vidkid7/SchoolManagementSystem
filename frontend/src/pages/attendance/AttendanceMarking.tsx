/**
 * Attendance Marking Page
 * 
 * Period-wise attendance marking with offline support
 */

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  Schedule as LateIcon,
  EventAvailable as ExcusedIcon,
  CloudDone as SyncedIcon,
  CloudOff as OfflineIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  roll_number: number;
  photo_url?: string;
  attendance_status?: 'present' | 'absent' | 'late' | 'excused';
}

interface ClassInfo {
  classId: number;
  gradeLevel: number;
  section: string;
}

export const AttendanceMarking = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const S = useAdminStyles(theme);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const gradeLevels = [...new Set(classes.map((cls) => cls.gradeLevel))].sort((a, b) => a - b);
  const sections = [...new Set(classes
    .filter((cls) => cls.gradeLevel.toString() === selectedClass)
    .map((cls) => cls.section))].sort();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
    }
  }, [selectedClass, selectedSection]);

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/academic/classes');
      const classesData = response.data?.data || [];
      setClasses(Array.isArray(classesData) ? classesData.map((row: Record<string, unknown>) => ({
        classId: Number(row.classId ?? row.class_id ?? row.id),
        gradeLevel: Number(row.gradeLevel ?? row.grade_level),
        section: String(row.section ?? ''),
      })).filter((row: ClassInfo) => Number.isFinite(row.classId) && Number.isFinite(row.gradeLevel) && row.section) : []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      setError(t('academic.failedToLoad'));
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchStudents = async () => {
    const selectedClassData = classes.find((cls) =>
      cls.gradeLevel.toString() === selectedClass && cls.section === selectedSection
    );
    if (!selectedClassData) {
      setStudents([]);
      setError(t('attendance.selectClassSectionPeriodError'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.get('/students', {
        params: {
          classId: selectedClassData.classId,
          section: selectedSection,
          status: 'active',
        },
      });
      
      const studentsData = response.data?.data?.students || response.data?.data || response.data || [];
      const studentsWithStatus = Array.isArray(studentsData) 
        ? studentsData.map((student: any) => ({
            id: student.studentId || student.id,
            student_id: student.studentId || student.id,
            first_name: student.firstNameEn || student.first_name || '',
            last_name: student.lastNameEn || student.last_name || '',
            roll_number: student.rollNumber || student.roll_number || 0,
            photo_url: student.photoUrl || student.photo_url,
            attendance_status: 'present' as const,
          }))
        : [];
      
      setStudents(studentsWithStatus);
      
      if (studentsWithStatus.length === 0) {
        setError(t('attendance.noStudentsFound'));
      }
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      setError(error.response?.data?.message || t('attendance.failedToMarkAttendance'));
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: number, status: 'present' | 'absent' | 'late' | 'excused') => {
    setStudents(students.map(student =>
      student.id === studentId
        ? { ...student, attendance_status: status }
        : student
    ));
  };

  const handleMarkAllPresent = () => {
    setStudents(students.map(student => ({
      ...student,
      attendance_status: 'present' as const,
    })));
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSection || !selectedPeriod) {
      setError(t('attendance.selectClassSectionPeriodError'));
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (isOnline) {
        const selectedClassData = classes.find((cls) =>
          cls.gradeLevel.toString() === selectedClass && cls.section === selectedSection
        );
        if (!selectedClassData) {
          setError(t('attendance.selectClassSectionPeriodError'));
          return;
        }

        const today = new Date();
        const dateISO = today.toISOString().split('T')[0] + 'T00:00:00.000Z';

        const promises = students.map(student =>
          apiClient.post('/attendance/student/mark', {
            studentId: student.id,
            classId: selectedClassData.classId,
            date: dateISO,
            status: student.attendance_status,
            periodNumber: parseInt(selectedPeriod),
            remarks: '',
          })
        );

        await Promise.all(promises);
        setShowSuccess(true);
        setError('');
        
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      } else {
        localStorage.setItem('pending_attendance', JSON.stringify({
          classId: selectedClass,
          section: selectedSection,
          students: students.map(s => ({
            studentId: s.id,
            status: s.attendance_status,
          })),
          date: new Date().toISOString(),
          periodNumber: parseInt(selectedPeriod),
          timestamp: new Date().toISOString(),
        }));
        setShowSuccess(true);
        
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Failed to save attendance:', error);
      const errorMessage = error.response?.data?.message || error.message || t('attendance.failedToMarkAttendance');
      setError(errorMessage);
      setShowSuccess(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ fontSize: 32, color: C.primary, display: 'flex' }}>
              <SyncedIcon sx={{ fontSize: 32, color: isOnline ? C.primary : C.warning }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {t('attendance.markAttendance')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isOnline ? t('attendance.online') : t('attendance.offline')}
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={isOnline ? <SyncedIcon /> : <OfflineIcon />}
            label={isOnline ? t('attendance.online') : t('attendance.offline')}
            color={isOnline ? 'success' : 'warning'}
          />
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: R.md }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: R.md }} onClose={() => setShowSuccess(false)}>
          {t('attendance.attendanceSavedSuccess')}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={S.TF}>
              <InputLabel>{t('common.class')}</InputLabel>
              <Select
                value={selectedClass}
                label={t('common.class')}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection('');
                  setStudents([]);
                }}
                disabled={classesLoading || gradeLevels.length === 0}
              >
                {gradeLevels.map((gradeLevel) => (
                  <MenuItem key={gradeLevel} value={gradeLevel.toString()}>
                    {t('common.class')} {gradeLevel}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={S.TF}>
              <InputLabel>{t('common.section')}</InputLabel>
              <Select
                value={selectedSection}
                label={t('common.section')}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setStudents([]);
                }}
                disabled={!selectedClass || sections.length === 0}
              >
                {sections.map((section) => (
                  <MenuItem key={section} value={section}>
                    {t('common.section')} {section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={S.TF}>
              <InputLabel>{t('attendance.period')}</InputLabel>
              <Select
                value={selectedPeriod}
                label={t('attendance.period')}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => (
                  <MenuItem key={period} value={period.toString()}>
                    {t('attendance.period')} {period}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleMarkAllPresent}
              disabled={students.length === 0}
              sx={{ ...S.BTN_PRIMARY,  ...S.BTN_SUCCESS, height: '56px' }}
            >
              {t('attendance.markAllPresent')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Student List */}
      {loading ? (
        <Paper sx={{ ...S.GLASS, p: 3 }}>
          <Typography align="center">{t('attendance.loadingStudents')}</Typography>
        </Paper>
      ) : students.length === 0 ? (
        <Paper sx={{ ...S.GLASS, p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {selectedClass && selectedSection 
              ? t('attendance.noStudentsFound')
              : t('attendance.selectClassSectionPeriod')
            }
          </Typography>
          {selectedClass && selectedSection && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('attendance.noStudentsEnrolled', { class: selectedClass, section: selectedSection })}
              <br />
              {t('attendance.checkStudentsHint')}
            </Typography>
          )}
          {!selectedClass && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('attendance.selectClassStep')}
              <br />
              {t('attendance.selectSectionStep')}
              <br />
              {t('attendance.selectPeriodStep')}
              <br />
              {t('attendance.studentsAppearStep')}
            </Typography>
          )}
        </Paper>
      ) : (
        <>
          <Grid container spacing={2}>
            {students.map((student) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={student.id}>
                <Card sx={S.GLASS}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={student.photo_url}
                        sx={{ width: 50, height: 50, mr: 2 }}
                      >
                        {student.first_name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {`${student.first_name} ${student.last_name}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('attendance.roll')}: {student.roll_number}
                        </Typography>
                      </Box>
                    </Box>

                    <ToggleButtonGroup
                      value={student.attendance_status}
                      exclusive
                      onChange={(_e, value) => value && handleStatusChange(student.id, value)}
                      fullWidth
                      size="small"
                    >
                      <Tooltip title={t('attendance.present')} arrow>
                        <ToggleButton value="present" color="success">
                          <PresentIcon fontSize="small" />
                        </ToggleButton>
                      </Tooltip>
                      <Tooltip title={t('attendance.absent')} arrow>
                        <ToggleButton value="absent" color="error">
                          <AbsentIcon fontSize="small" />
                        </ToggleButton>
                      </Tooltip>
                      <Tooltip title={t('attendance.late')} arrow>
                        <ToggleButton value="late" color="warning">
                          <LateIcon fontSize="small" />
                        </ToggleButton>
                      </Tooltip>
                      <Tooltip title={t('attendance.excused')} arrow>
                        <ToggleButton value="excused" color="info">
                          <ExcusedIcon fontSize="small" />
                        </ToggleButton>
                      </Tooltip>
                    </ToggleButtonGroup>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Save Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Tooltip 
              title={t('attendance.saveTooltip')}
              arrow
            >
              <span>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSave}
                  disabled={saving || students.length === 0 || !selectedPeriod}
                  sx={{ ...S.BTN_PRIMARY, minWidth: 200 }}
                >
                  {saving ? t('attendance.savingAttendance') : t('attendance.saveAttendance')}
                </Button>
              </span>
            </Tooltip>
          </Box>

          {/* Legend */}
          <Paper sx={{ ...S.GLASS, p: 2, mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('attendance.legend')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PresentIcon color="success" />
                <Typography variant="body2">{t('attendance.present')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AbsentIcon color="error" />
                <Typography variant="body2">{t('attendance.absent')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LateIcon color="warning" />
                <Typography variant="body2">{t('attendance.late')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ExcusedIcon color="info" />
                <Typography variant="body2">{t('attendance.excused')}</Typography>
              </Box>
            </Box>
          </Paper>
        </>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        message={isOnline ? t('attendance.attendanceSavedSuccess') : t('attendance.attendanceSavedOffline')}
      />
    </Box>
  );
};

/**
 * Subject Teachers View Page
 * 
 * View all teachers assigned to a specific subject in a class
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
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
  IconButton,
  Alert,
  CircularProgress,
  alpha,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

interface SubjectTeacher {
  staffId: number;
  firstNameEn: string;
  lastNameEn: string;
  firstNameNp?: string;
  lastNameNp?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  photoUrl?: string;
  highestQualification?: string;
  specialization?: string;
}

interface AcademicYearRow {
  academicYearId?: number;
  academic_year_id?: number;
  id?: number;
  isCurrent?: boolean;
  is_current?: boolean;
}

interface ClassRow {
  classId?: number;
  class_id?: number;
  id?: number;
  gradeLevel?: number;
  grade_level?: number;
  section?: string;
}

interface SubjectRow {
  subjectId?: number;
  subject_id?: number;
  id?: number;
  nameEn?: string;
  name_en?: string;
  nameNp?: string;
  name_np?: string;
}

export const SubjectTeachersView = () => {
  const { t, i18n } = useTranslation();
  const { classId, subjectId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isNepali = i18n.language === 'ne';

  const [teachers, setTeachers] = useState<SubjectTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [className, setClassName] = useState('');
  const [subjectName, setSubjectName] = useState('');

  useEffect(() => {
    // Validate URL parameters before fetching
    if (!classId || classId === 'undefined' || !subjectId || subjectId === 'undefined') {
      setError('Invalid class or subject ID. Please go back and try again.');
      setLoading(false);
      return;
    }
    
    fetchSubjectTeachers();
  }, [classId, subjectId]);

  const fetchSubjectTeachers = async () => {
    try {
      setLoading(true);
      setError('');

      const [yearsResponse, classesResponse, subjectsResponse] = await Promise.all([
        apiClient.get('/api/v1/academic/years'),
        apiClient.get('/api/v1/academic/classes'),
        apiClient.get('/api/v1/academic/subjects')
      ]);

      const years: AcademicYearRow[] = yearsResponse.data?.data || [];
      const currentYear = years.find((year) => year.isCurrent || year.is_current) || years[0];
      const academicYearId = currentYear?.academicYearId || currentYear?.academic_year_id || currentYear?.id;

      if (!academicYearId) {
        setError('No academic year found');
        setTeachers([]);
        return;
      }

      const response = await apiClient.get(
        `/api/v1/staff/class/${classId}/subject/${subjectId}/teachers?academicYearId=${academicYearId}`
      );
      
      setTeachers(response.data.data || []);

      const classes: ClassRow[] = classesResponse.data?.data || [];
      const classInfo = classes.find((cls) => {
        const id = cls.classId || cls.class_id || cls.id;
        return id === Number(classId);
      });

      if (classInfo) {
        const gradeLevel = classInfo.gradeLevel ?? classInfo.grade_level ?? classId;
        setClassName(`Grade ${gradeLevel}${classInfo.section ? ` - ${classInfo.section}` : ''}`);
      } else {
        setClassName(`Class ${classId}`);
      }

      const subjects: SubjectRow[] = subjectsResponse.data?.data || [];
      const subject = subjects.find((subj) => {
        const id = subj.subjectId || subj.subject_id || subj.id;
        return id === Number(subjectId);
      });
      setSubjectName(
        isNepali
          ? (subject?.nameNp || subject?.name_np || '')
          : (subject?.nameEn || subject?.name_en || '')
      );
    } catch (error: any) {
      console.error('Failed to fetch subject teachers:', error);
      if (error.response?.status === 404) {
        setError('No teachers assigned to this subject');
      } else {
        setError('Failed to load subject teachers');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
          variant="text"
        >
          {t('common.back')}
        </Button>
        
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Unable to load teachers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please return to the previous page and try again.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
          variant="text"
        >
          {t('common.back')}
        </Button>
        
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
          {subjectName} Teachers - {className}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View all teachers assigned to teach {subjectName} in {className}
        </Typography>
      </Box>

      {error && teachers.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Card */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{ borderRadius: 2 }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SchoolIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Teachers
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                    {teachers.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {teachers.length > 0 ? (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 600 }}>Teacher</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Position</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Qualification</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.staffId} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={teacher.photoUrl}
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontWeight: 600
                        }}
                      >
                        {teacher.firstNameEn.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {isNepali && teacher.firstNameNp
                            ? `${teacher.firstNameNp} ${teacher.lastNameNp || ''}`
                            : `${teacher.firstNameEn} ${teacher.lastNameEn}`
                          }
                        </Typography>
                        {teacher.specialization && (
                          <Typography variant="caption" color="text.secondary">
                            {teacher.specialization}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={teacher.position || 'Teacher'} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {teacher.highestQualification || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {teacher.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{teacher.email}</Typography>
                        </Box>
                      )}
                      {teacher.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">{teacher.phone}</Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/staff/${teacher.staffId}`)}
                        title="View Profile"
                      >
                        <PersonIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => navigate(`/staff/${teacher.staffId}/assignments`)}
                        title="Manage Assignments"
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
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No Teachers Assigned
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            No teachers have been assigned to teach {subjectName} in {className} yet.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/staff')}
          >
            Go to Staff Management
          </Button>
        </Paper>
      )}
    </Box>
  );
};

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

const SUBJECTS = [
  { subjectId: 1, subjectName: 'Mathematics', subjectNameNp: 'गणित' },
  { subjectId: 2, subjectName: 'Science', subjectNameNp: 'विज्ञान' },
  { subjectId: 3, subjectName: 'English', subjectNameNp: 'अंग्रेजी' },
  { subjectId: 4, subjectName: 'Nepali', subjectNameNp: 'नेपाली' },
  { subjectId: 5, subjectName: 'Social Studies', subjectNameNp: 'सामाजिक अध्ययन' },
  { subjectId: 6, subjectName: 'Computer Science', subjectNameNp: 'कम्प्युटर विज्ञान' },
  { subjectId: 7, subjectName: 'Physics', subjectNameNp: 'भौतिक विज्ञान' },
  { subjectId: 8, subjectName: 'Chemistry', subjectNameNp: 'रसायन विज्ञान' },
  { subjectId: 9, subjectName: 'Biology', subjectNameNp: 'जीवविज्ञान' },
  { subjectId: 10, subjectName: 'Economics', subjectNameNp: 'अर्थशास्त्र' },
];

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
      
      // Get current academic year (you might want to fetch this from an API)
      const academicYearId = 1; // Default to 1 for now
      
      const response = await apiClient.get(
        `/api/v1/staff/class/${classId}/subject/${subjectId}/teachers?academicYearId=${academicYearId}`
      );
      
      setTeachers(response.data.data || []);
      setClassName(`Class ${classId}`); // You might want to fetch actual class name
      
      // Get subject name
      const subject = SUBJECTS.find(s => s.subjectId === parseInt(subjectId as string));
      setSubjectName(isNepali ? subject?.subjectNameNp || '' : subject?.subjectName || '');
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

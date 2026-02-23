/**
 * Class Teacher View Page
 * 
 * View class teacher details for a specific class
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
  Divider,
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

interface ClassTeacher {
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

export const ClassTeacherView = () => {
  const { t, i18n } = useTranslation();
  const { classId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isNepali = i18n.language === 'ne';

  const [teacher, setTeacher] = useState<ClassTeacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [className, setClassName] = useState('');

  useEffect(() => {
    fetchClassTeacher();
  }, [classId]);

  const fetchClassTeacher = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get current academic year (you might want to fetch this from an API)
      const academicYearId = 1; // Default to 1 for now
      
      const response = await apiClient.get(
        `/api/v1/staff/class/${classId}/teacher?academicYearId=${academicYearId}`
      );
      
      setTeacher(response.data.data);
      setClassName(`Class ${classId}`); // You might want to fetch actual class name
    } catch (error: any) {
      console.error('Failed to fetch class teacher:', error);
      if (error.response?.status === 404) {
        setError('No class teacher assigned to this class');
      } else {
        setError('Failed to load class teacher information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManageAssignments = () => {
    if (teacher) {
      navigate(`/staff/${teacher.staffId}/assignments`);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/academic')}
          sx={{ mb: 2 }}
          variant="text"
        >
          {t('common.back')}
        </Button>
        
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
          {t('staff.form.classTeacher')} - {className}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View class teacher information and contact details
        </Typography>
      </Box>

      {error && !teacher && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {teacher ? (
        <Grid container spacing={3}>
          {/* Teacher Profile Card */}
          <Grid item xs={12} md={4}>
            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              sx={{ borderRadius: 2 }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  src={teacher.photoUrl}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mx: 'auto', 
                    mb: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    fontSize: 48,
                    fontWeight: 600,
                    color: theme.palette.primary.main
                  }}
                >
                  {teacher.firstNameEn.charAt(0)}
                </Avatar>
                
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {isNepali && teacher.firstNameNp
                    ? `${teacher.firstNameNp} ${teacher.lastNameNp || ''}`
                    : `${teacher.firstNameEn} ${teacher.lastNameEn}`
                  }
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {teacher.position || 'Teacher'}
                </Typography>

                <Chip 
                  label={t('staff.form.classTeacher')}
                  color="primary"
                  sx={{ mb: 2 }}
                />

                <Divider sx={{ my: 2 }} />

                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleManageAssignments}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Manage Assignments
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<PersonIcon />}
                  onClick={() => navigate(`/staff/${teacher.staffId}`)}
                  fullWidth
                >
                  View Full Profile
                </Button>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Teacher Details */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              {/* Contact Information */}
              <Grid item xs={12}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  sx={{ borderRadius: 2 }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 4, height: 20, bgcolor: 'primary.main', borderRadius: 1 }} />
                      Contact Information
                    </Typography>

                    <Grid container spacing={2}>
                      {teacher.email && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.5,
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <EmailIcon sx={{ color: 'info.main', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Email
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {teacher.email}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}

                      {teacher.phone && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.5,
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <PhoneIcon sx={{ color: 'success.main', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Phone
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {teacher.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </MotionCard>
              </Grid>

              {/* Qualifications */}
              <Grid item xs={12}>
                <MotionCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  sx={{ borderRadius: 2 }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 4, height: 20, bgcolor: 'primary.main', borderRadius: 1 }} />
                      Qualifications
                    </Typography>

                    <Grid container spacing={2}>
                      {teacher.highestQualification && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.5,
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <SchoolIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Highest Qualification
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {teacher.highestQualification}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}

                      {teacher.specialization && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.5,
                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <SchoolIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Specialization
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {teacher.specialization}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}

                      {teacher.department && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.5,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <SchoolIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Department
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {teacher.department}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </MotionCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No Class Teacher Assigned
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This class does not have a class teacher assigned yet.
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

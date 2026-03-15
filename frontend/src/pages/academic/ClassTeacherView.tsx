/**
 * Class Teacher View Page
 * 
 * View class teacher details for a specific class
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
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
import { C, useAdminStyles, R } from '../../theme/designTokens';
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

export const ClassTeacherView = () => {
  const { t, i18n } = useTranslation();
  const { classId } = useParams();
  const navigate = useSlugNavigate();
  const theme = useTheme();
  const S = useAdminStyles(theme);
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

      const [yearsResponse, classesResponse] = await Promise.all([
        apiClient.get('/api/v1/academic/years'),
        apiClient.get('/api/v1/academic/classes')
      ]);

      const years: AcademicYearRow[] = yearsResponse.data?.data || [];
      const currentYear = years.find((year) => year.isCurrent || year.is_current) || years[0];
      const academicYearId = currentYear?.academicYearId || currentYear?.academic_year_id || currentYear?.id;

      if (!academicYearId) {
        setError('No academic year found');
        setTeacher(null);
        return;
      }

      const response = await apiClient.get(
        `/api/v1/staff/class/${classId}/teacher?academicYearId=${academicYearId}`
      );

      setTeacher(response.data.data);

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
          {t('staff.classTeacherView.subtitle')}
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
              sx={{ ...S.GLASS }}
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
                  {teacher.position || t('staff.positions.teacher')}
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
                  sx={{ ...S.BTN_PRIMARY, mb: 1 }}
                >
                  {t('staff.manageAssignments')}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<PersonIcon />}
                  onClick={() => navigate(`/staff/${teacher.staffId}`)}
                  fullWidth
                  sx={{ ...S.BTN_OUTLINE }}
                >
                  {t('staff.viewFullProfile')}
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
                  sx={{ ...S.GLASS }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 4, height: 20, bgcolor: 'primary.main', borderRadius: R.sm }} />
                      {t('staff.classTeacherView.contactInformation')}
                    </Typography>

                    <Grid container spacing={2}>
                      {teacher.email && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: R.md,
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
                                {t('common.email')}
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
                                borderRadius: R.md,
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
                                {t('common.phone')}
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
                  sx={{ ...S.GLASS }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 4, height: 20, bgcolor: 'primary.main', borderRadius: R.sm }} />
                      {t('staff.classTeacherView.qualifications')}
                    </Typography>

                    <Grid container spacing={2}>
                      {teacher.highestQualification && (
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: R.md,
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
                                {t('staff.classTeacherView.highestQualification')}
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
                                borderRadius: R.md,
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
                                {t('staff.form.specialization')}
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
                                borderRadius: R.md,
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
                                {t('staff.department')}
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
        <Paper sx={{ ...S.GLASS, p: 4, textAlign: 'center' }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            {t('staff.classTeacherView.noClassTeacherAssigned')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('staff.classTeacherView.noClassTeacherDescription')}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/staff')}
            sx={{ ...S.BTN_PRIMARY }}
          >
            {t('staff.classTeacherView.goToStaffManagement')}
          </Button>
        </Paper>
      )}
    </Box>
  );
};

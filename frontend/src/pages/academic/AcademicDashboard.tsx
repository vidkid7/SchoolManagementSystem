/**
 * Academic Dashboard
 * 
 * Central hub for all academic management features
 */

import React from 'react';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Paper,
  useTheme,
} from '@mui/material';
import {
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  MenuBook as BookIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useTranslation } from 'react-i18next';

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

export const AcademicDashboard = () => {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const navigate = useSlugNavigate();

  const features: FeatureCard[] = [
    {
      title: t('academic.classesSubjects'),
      description: t('academic.classesSubjectsDesc'),
      icon: <SchoolIcon sx={{ fontSize: 50 }} />,
      path: '/academic/classes',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: t('academic.academicYears'),
      description: t('academic.academicYearsDesc'),
      icon: <CalendarIcon sx={{ fontSize: 50 }} />,
      path: '/academic/years',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: t('academic.classSubjectAssignment'),
      description: t('academic.classSubjectAssignmentDesc'),
      icon: <AssignmentIcon sx={{ fontSize: 50 }} />,
      path: '/academic/class-subjects',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: t('academic.timetable'),
      description: t('academic.timetableDesc'),
      icon: <ScheduleIcon sx={{ fontSize: 50 }} />,
      path: '/academic/timetable',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
      title: t('academic.syllabus'),
      description: t('academic.syllabusDesc'),
      icon: <BookIcon sx={{ fontSize: 50 }} />,
      path: '/academic/syllabus',
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    {
      title: t('academic.academicCalendar'),
      description: t('academic.academicCalendarDesc'),
      icon: <EventIcon sx={{ fontSize: 50 }} />,
      path: '/academic/calendar',
      color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    },
  ];

  return (
    <Box>
      <Paper sx={S.PAGE_HEADER}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SchoolIcon sx={{ fontSize: 32, color: C.primary }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>{t('academic.dashboardTitle')}</Typography>
            <Typography variant="body2" color="text.secondary">{t('academic.dashboardSubtitle')}</Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                ...S.GLASS,
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(feature.path)}
                sx={{ height: '100%' }}
              >
                <CardContent
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 4,
                  }}
                >
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: feature.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

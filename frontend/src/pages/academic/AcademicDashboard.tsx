/**
 * Academic Dashboard
 * 
 * Central hub for all academic management features
 */

import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import {
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  MenuBook as BookIcon,
  Assignment as AssignmentIcon,
  Event as EventIcon,
} from '@mui/icons-material';

interface FeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

export const AcademicDashboard = () => {
  const navigate = useNavigate();

  const features: FeatureCard[] = [
    {
      title: 'Classes & Subjects',
      description: 'Manage classes, sections, and subjects',
      icon: <SchoolIcon sx={{ fontSize: 50 }} />,
      path: '/academic/classes',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      title: 'Academic Years',
      description: 'Manage academic years and terms',
      icon: <CalendarIcon sx={{ fontSize: 50 }} />,
      path: '/academic/years',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      title: 'Class-Subject Assignment',
      description: 'Assign subjects to classes and teachers',
      icon: <AssignmentIcon sx={{ fontSize: 50 }} />,
      path: '/academic/class-subjects',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      title: 'Timetable',
      description: 'Create and manage class timetables',
      icon: <ScheduleIcon sx={{ fontSize: 50 }} />,
      path: '/academic/timetable',
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
      title: 'Syllabus',
      description: 'Manage subject syllabus and topics',
      icon: <BookIcon sx={{ fontSize: 50 }} />,
      path: '/academic/syllabus',
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    {
      title: 'Academic Calendar',
      description: 'View and manage school events',
      icon: <EventIcon sx={{ fontSize: 50 }} />,
      path: '/academic/calendar',
      color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Academic Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all academic aspects of your school
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
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

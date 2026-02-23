/**
 * Staff Detail Page
 * 
 * Displays comprehensive staff information
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Button,
  Chip,
  Card,
  CardContent,
  Paper,
  alpha,
  useTheme,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Edit as EditIcon,
  ArrowBack as BackIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  ContactEmergency as EmergencyIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Description as DocumentIcon,
  CalendarMonth as CalendarIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import apiClient from '../../services/apiClient';
import { motion } from 'framer-motion';
import StaffDocuments from './StaffDocuments';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

interface Staff {
  staffId: number;
  staffCode: string;
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  dateOfBirthBs?: string;
  gender?: string;
  position?: string;
  department?: string;
  qualification?: string;
  specialization?: string;
  joiningDateBs?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  status?: string;
  photoUrl?: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; labelKey: string }> = {
  active: { color: '#10b981', bg: '#10b981', labelKey: 'staff.active' },
  inactive: { color: '#6b7280', bg: '#6b7280', labelKey: 'staff.inactive' },
  on_leave: { color: '#f59e0b', bg: '#f59e0b', labelKey: 'staff.onLeave' },
};

const InfoCard = ({ icon, title, children, color = 'primary' }: { icon: React.ReactNode; title: string; children: React.ReactNode; color?: string }) => {
  const theme = useTheme();
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        borderRadius: 3, 
        bgcolor: 'background.paper',
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderColor: alpha(theme.palette.primary.main, 0.2),
        }
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: 36, 
          height: 36, 
          borderRadius: 2,
          bgcolor: alpha(theme.palette[color as keyof typeof theme.palette]?.main || theme.palette.primary.main, 0.1),
        }}>
          {icon}
        </Box>
        {title}
      </Typography>
      {children}
    </Paper>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | undefined }) => {
  const theme = useTheme();
  return (
    <ListItem sx={{ px: 0, py: 1 }}>
      <ListItemIcon sx={{ minWidth: 40 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'text.secondary'
        }}>
          {icon}
        </Box>
      </ListItemIcon>
      <ListItemText 
        primary={
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 0.25 }}>
            {label}
          </Typography>
        }
        secondary={
          <Typography variant="body1" sx={{ fontWeight: 500, color: 'text.primary' }}>
            {value || '-'}
          </Typography>
        }
      />
    </ListItem>
  );
};

export const StaffDetail = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bottomTabValue, setBottomTabValue] = useState(0);

  useEffect(() => {
    fetchStaff();
  }, [id]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/v1/staff/${id}`);
      setStaff(response.data.data);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setError('Failed to load staff details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) {
      return;
    }
    try {
      await apiClient.delete(`/api/v1/staff/${id}`);
      navigate('/staff');
    } catch (err) {
      console.error('Failed to delete staff:', err);
      setError('Failed to delete staff');
    }
  };

  const getStatusColor = (status: string) => {
    return STATUS_CONFIG[status]?.color || '#6b7280';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !staff) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Staff not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/staff')} sx={{ mt: 2 }}>
          {t('common.back')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <MotionBox 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => navigate('/staff')} 
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2), transform: 'translateX(-4px)' }
            }}
          >
            <BackIcon sx={{ color: theme.palette.primary.main }} />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {t('staff.staffDetails')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            sx={{ borderRadius: 2 }}
          >
            {t('common.delete')}
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/staff/${id}/edit`)}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {t('staff.edit')}
          </Button>
        </Box>
      </MotionBox>

      <Grid container spacing={4}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <MotionCard
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            sx={{ 
              borderRadius: 4, 
              overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 100,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.secondary.main, 0.8)})`,
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', py: 5, position: 'relative', pt: 10 }}>
              <Avatar
                src={staff.photoUrl}
                sx={{ 
                  width: 140, 
                  height: 140, 
                  mx: 'auto', 
                  mb: 2.5, 
                  bgcolor: 'background.paper',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  border: `4px solid ${theme.palette.background.paper}`,
                }}
              >
                <PersonIcon sx={{ fontSize: 56, color: theme.palette.primary.main }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                {staff.firstNameEn} {staff.middleNameEn} {staff.lastNameEn}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontFamily: 'monospace', fontWeight: 500 }}>
                {staff.staffCode}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label={t(`staff.positions.${staff.position}`) || staff.position}
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 1,
                  }}
                />
                <Chip
                  label={t(`staff.departments.${staff.department}`) || staff.department}
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 1,
                  }}
                />
              </Box>
              {staff.status && (
                <Chip
                  label={t(STATUS_CONFIG[staff.status]?.labelKey) || staff.status}
                  sx={{
                    bgcolor: alpha(getStatusColor(staff.status), 0.15),
                    color: getStatusColor(staff.status),
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                />
              )}
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Details */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <InfoCard icon={<PersonIcon sx={{ color: theme.palette.primary.main }} />} title={t('staff.form.personalInfo')}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <InfoRow icon={<PersonIcon fontSize="small" />} label={t('staff.firstName')} value={`${staff.firstNameEn} ${staff.middleNameEn || ''} ${staff.lastNameEn}`} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoRow icon={<BadgeIcon fontSize="small" />} label={t('staff.form.gender')} value={staff.gender ? t(`staff.form.${staff.gender}`) : undefined} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoRow icon={<CalendarIcon fontSize="small" />} label={t('staff.form.dateOfBirth')} value={staff.dateOfBirthBs} />
                    </Grid>
                  </Grid>
                </InfoCard>
              </MotionBox>
            </Grid>

            {/* Employment Information */}
            <Grid item xs={12}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <InfoCard icon={<WorkIcon sx={{ color: theme.palette.primary.main }} />} title={t('staff.form.employmentInfo')}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <InfoRow icon={<WorkIcon fontSize="small" />} label={t('staff.position')} value={t(`staff.positions.${staff.position}`) || staff.position} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoRow icon={<WorkIcon fontSize="small" />} label={t('staff.department')} value={t(`staff.departments.${staff.department}`) || staff.department} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <InfoRow icon={<CalendarIcon fontSize="small" />} label={t('staff.form.joiningDate')} value={staff.joiningDateBs} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoRow icon={<SchoolIcon fontSize="small" />} label={t('staff.form.qualification')} value={staff.qualification} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoRow icon={<SchoolIcon fontSize="small" />} label={t('staff.form.specialization')} value={staff.specialization} />
                    </Grid>
                  </Grid>
                </InfoCard>
              </MotionBox>
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <InfoCard icon={<PhoneIcon sx={{ color: theme.palette.primary.main }} />} title={t('staff.form.contactInfo')}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <InfoRow icon={<PhoneIcon fontSize="small" />} label={t('staff.contactNumber')} value={staff.phone} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoRow icon={<EmailIcon fontSize="small" />} label={t('staff.email')} value={staff.email} />
                    </Grid>
                    <Grid item xs={12}>
                      <InfoRow icon={<LocationIcon fontSize="small" />} label={t('staff.form.address')} value={`${staff.address || '-'}, ${staff.city || ''}, ${staff.district || ''}`} />
                    </Grid>
                  </Grid>
                </InfoCard>
              </MotionBox>
            </Grid>

            {/* Emergency Contact */}
            <Grid item xs={12}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <InfoCard icon={<EmergencyIcon sx={{ color: theme.palette.warning.main }} />} title={t('staff.form.emergencyContact')} color="warning">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <InfoRow icon={<PersonIcon fontSize="small" />} label={t('staff.form.emergencyContactName')} value={staff.emergencyContactName} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <InfoRow icon={<PhoneIcon fontSize="small" />} label={t('staff.form.emergencyContactNumber')} value={staff.emergencyContactNumber} />
                    </Grid>
                  </Grid>
                </InfoCard>
              </MotionBox>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Bottom Tabs for Documents and Assignments */}
      <MotionBox
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        sx={{ mt: 5 }}
      >
        <Paper 
          sx={{ 
            borderRadius: 4, 
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <Box sx={{ 
            bgcolor: alpha(theme.palette.primary.main, 0.02), 
            borderBottom: 1, 
            borderColor: 'divider',
            px: 3,
            pt: 2,
          }}>
            <Tabs
              value={bottomTabValue}
              onChange={(_, newValue) => setBottomTabValue(newValue)}
              variant="fullWidth"
              TabIndicatorProps={{
                sx: { 
                  height: 4, 
                  borderRadius: '4px 4px 0 0',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                }
              }}
              sx={{
                maxWidth: 500,
                mx: 'auto',
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  borderRadius: '12px 12px 0 0',
                  mx: 0.5,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                  '&.Mui-selected': {
                    bgcolor: 'background.paper',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                  }
                }
              }}
            >
              <Tab 
                icon={<DocumentIcon />} 
                iconPosition="start" 
                label="Documents" 
              />
              {staff.position === 'teacher' && (
                <Tab 
                  icon={<AssignmentIcon />} 
                  iconPosition="start" 
                  label="Assignments" 
                />
              )}
            </Tabs>
          </Box>

          <Box sx={{ p: 3, bgcolor: 'background.paper', minHeight: 400 }}>
            {bottomTabValue === 0 && (
              <StaffDocuments staffId={staff.staffId} />
            )}
            {bottomTabValue === 1 && staff.position === 'teacher' && (
              <Box sx={{ 
                textAlign: 'center', 
                py: 8,
                px: 4,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.main, 0.03)} 100%)`,
                borderRadius: 4,
                border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`
              }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <AssignmentIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                </Box>
                <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 700, color: 'text.primary' }}>
                  Teacher Assignments
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 420, mx: 'auto', lineHeight: 1.7 }}>
                  Manage class and subject assignments for this teacher. Track teaching responsibilities and schedules.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate(`/staff/${staff.staffId}/assignments`)}
                  sx={{ 
                    px: 5, 
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 600,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                    '&:hover': {
                      boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Manage Assignments
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </MotionBox>
    </Box>
  );
};

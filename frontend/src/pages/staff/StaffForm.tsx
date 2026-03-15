/**
 * Staff Form Component
 * 
 * Reusable form for creating and editing staff
 */

import { useState, useEffect, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  IconButton,
  Alert,
  alpha,
  useTheme,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';
import { 
  PhotoCamera, 
  Save as SaveIcon, 
  Cancel as CancelIcon, 
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  ContactEmergency as EmergencyIcon,
  Badge as BadgeIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);
const MotionBox = motion.create(Box);

interface StaffFormData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth_bs: string;
  gender: 'male' | 'female' | 'other';
  position: string;
  department: string;
  qualification: string;
  specialization?: string;
  joining_date_bs: string;
  contact_number: string;
  email: string;
  address: string;
  city: string;
  district: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
  status: 'active' | 'inactive' | 'on_leave';
  role?: string;
}

const FormSection = ({ icon, title, children, color = 'primary' }: { icon: React.ReactNode; title: string; children: React.ReactNode; color?: string }) => {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const paletteColor = (theme.palette as any)[color]?.main || theme.palette.primary.main;
  return (
    <Paper 
      elevation={0}
      sx={{ 
        ...S.GLASS,
        p: 4, 
        '&:hover': {
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          borderColor: alpha(paletteColor, 0.15),
        }
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={S.ICON_BOX(paletteColor)}>
          {icon}
        </Box>
        {title}
      </Typography>
      {children}
    </Paper>
  );
};

const StyledTextField = forwardRef<HTMLDivElement, any>((props, ref) => {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  return (
    <TextField
      {...props}
      ref={ref}
      sx={{
        ...S.TF,
        ...props.sx
      }}
    />
  );
});

StyledTextField.displayName = 'StyledTextField';

const StyledSelect = forwardRef<HTMLDivElement, any>((props, ref) => {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  return (
    <Select
      {...props}
      ref={ref}
      sx={{
        ...S.SELECT,
        ...props.sx
      }}
    />
  );
});

StyledSelect.displayName = 'StyledSelect';

export const StaffForm = () => {
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const { id, municipalitySlug } = useParams<{ id?: string; municipalitySlug: string }>();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<StaffFormData>({
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      date_of_birth_bs: '',
      gender: 'male',
      position: '',
      department: 'academic',
      qualification: '',
      specialization: '',
      joining_date_bs: '',
      contact_number: '',
      email: '',
      address: '',
      city: '',
      district: '',
      emergency_contact_name: '',
      emergency_contact_number: '',
      status: 'active',
      role: '',
    },
  });

  useEffect(() => {
    if (isEdit) {
      fetchStaff();
    }
  }, [id]);

  const fetchStaff = async () => {
    try {
      const response = await apiClient.get(`/api/v1/staff/${id}`);
      const data = response.data.data || response.data;
      
      const addressParts = (data.addressEn || '').split(',').map((s: string) => s.trim());
      const city = addressParts.length > 1 ? addressParts[addressParts.length - 2] : '';
      const district = addressParts.length > 0 ? addressParts[addressParts.length - 1] : '';
      const address = addressParts.length > 2 ? addressParts.slice(0, -2).join(', ') : addressParts[0] || '';
      
      const emergencyContactParts = (data.emergencyContact || '').split(':').map((s: string) => s.trim());
      const emergencyContactName = emergencyContactParts.length > 1 ? emergencyContactParts[0] : '';
      const emergencyContactNumber = emergencyContactParts.length > 1 ? emergencyContactParts[1] : data.emergencyContact || '';
      
      // Normalize position and department values to snake_case
      const normalizeValue = (value: string): string => {
        if (!value) return '';
        return value.toLowerCase().replace(/\s+/g, '_');
      };
      
      reset({
        first_name: data.firstNameEn || '',
        middle_name: data.middleNameEn || '',
        last_name: data.lastNameEn || '',
        date_of_birth_bs: data.dateOfBirthBS || '',
        gender: data.gender || 'male',
        position: normalizeValue(data.position) || '',
        department: normalizeValue(data.department) || 'academic',
        qualification: data.highestQualification || '',
        specialization: data.specialization || '',
        joining_date_bs: data.dateOfBirthBS || '',
        contact_number: data.phone || '',
        email: data.email || '',
        address: address,
        city: city,
        district: district,
        emergency_contact_name: emergencyContactName,
        emergency_contact_number: emergencyContactNumber,
        status: data.status || 'active',
        role: data.role || '',
      });
      
      if (data.photoUrl) {
        setPhotoPreview(data.photoUrl);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      setError(t('staff.form.errorMessage'));
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024) {
        setError(t('staff.form.fileSizeExceeded'));
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: StaffFormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const apiData = {
        firstNameEn: data.first_name,
        middleNameEn: data.middle_name || null,
        lastNameEn: data.last_name,
        dateOfBirthBS: data.date_of_birth_bs,
        gender: data.gender,
        position: data.position,
        department: data.department,
        highestQualification: data.qualification,
        specialization: data.specialization || null,
        joinDate: data.joining_date_bs || new Date().toISOString().split('T')[0],
        phone: data.contact_number,
        email: data.email,
        addressEn: `${data.address}, ${data.city}, ${data.district}`,
        emergencyContact: `${data.emergency_contact_name}: ${data.emergency_contact_number}`,
        status: data.status,
        category: 'teaching',
        employmentType: 'full_time',
      };

      let staffId = id;

      if (isEdit) {
        await apiClient.put(`/api/v1/staff/${id}`, apiData);
      } else {
        const response = await apiClient.post('/api/v1/staff', apiData);
        staffId = response.data.data?.staffId || response.data.staffId;
      }

      if (photoFile && staffId) {
        try {
          const photoFormData = new FormData();
          photoFormData.append('photo', photoFile);
          await apiClient.post(`/api/v1/staff/${staffId}/photo`, photoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (photoError) {
          console.error('Failed to upload photo:', photoError);
        }
      }

      setSuccess(t('staff.form.successMessage'));
      setTimeout(() => {
        navigate(`/staff`);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to save staff:', error);
      setError(error.response?.data?.message || t('staff.form.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <MotionBox 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={() => navigate(`/staff`)} 
            sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              transition: 'all 0.2s ease',
              '&:hover': { 
                bgcolor: alpha(theme.palette.primary.main, 0.2), 
                transform: 'translateX(-4px)' 
              }
            }}
          >
            <ArrowBackIcon sx={{ color: theme.palette.primary.main }} />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {isEdit ? t('staff.editStaff') : t('staff.addStaff')}
          </Typography>
        </Box>
      </MotionBox>

      {error && (
        <MotionBox
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert severity="error" sx={{ mb: 3, borderRadius: R.lg }} onClose={() => setError('')}>
            {error}
          </Alert>
        </MotionBox>
      )}

      {success && (
        <MotionBox
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert severity="success" sx={{ mb: 3, borderRadius: R.lg }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </MotionBox>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={4}>
          {/* Photo Upload Card */}
          <Grid item xs={12} md={4}>
            <MotionCard
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              sx={{ 
                ...S.GLASS,
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 80,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.85)}, ${alpha(theme.palette.secondary.main, 0.85)})`,
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 5, position: 'relative', pt: 10 }}>
                <Avatar
                  src={photoPreview}
                  sx={{ 
                    width: 130, 
                    height: 130, 
                    mx: 'auto', 
                    mb: 2.5, 
                    bgcolor: 'background.paper',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    border: `4px solid ${theme.palette.background.paper}`,
                  }}
                >
                  <PhotoCamera sx={{ fontSize: 48, color: theme.palette.primary.main }} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {isEdit ? t('staff.form.updatePhoto') : t('staff.form.uploadPhotoLabel')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {t('staff.form.photoRequirements')}
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="photo-upload"
                  type="file"
                  onChange={handlePhotoChange}
                />
                <label htmlFor="photo-upload">
                  <Button 
                    variant="outlined" 
                    component="span" 
                    startIcon={<PhotoCamera />}
                    sx={{ 
                      ...S.BTN_OUTLINE,
                      px: 3,
                      py: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }
                    }}
                  >
                    {t('staff.form.uploadPhoto')}
                  </Button>
                </label>
              </CardContent>
            </MotionCard>
          </Grid>

          {/* Personal Information */}
          <Grid item xs={12} md={8}>
            <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <FormSection icon={<PersonIcon sx={{ color: theme.palette.primary.main }} />} title={t('staff.form.personalInfo')}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="first_name"
                      control={control}
                      rules={{ required: t('staff.form.required') }}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={`${t('staff.firstName')} *`}
                          fullWidth
                          error={!!errors.first_name}
                          helperText={errors.first_name?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="middle_name"
                      control={control}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={t('staff.form.middleName')}
                          fullWidth
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="last_name"
                      control={control}
                      rules={{ required: t('staff.form.required') }}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={`${t('staff.lastName')} *`}
                          fullWidth
                          error={!!errors.last_name}
                          helperText={errors.last_name?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="date_of_birth_bs"
                      control={control}
                      rules={{ 
                        required: t('staff.form.required'),
                        pattern: {
                          value: /^\d{4}-\d{2}-\d{2}$/,
                          message: t('staff.form.dateFormatError')
                        }
                      }}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={`${t('staff.form.dateOfBirth')} *`}
                          fullWidth
                          placeholder="2055-01-15"
                          error={!!errors.date_of_birth_bs}
                          helperText={errors.date_of_birth_bs?.message || t('staff.form.dateFormatHint')}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="gender"
                      control={control}
                      rules={{ required: t('staff.form.required') }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.gender}>
                          <InputLabel>{t('staff.form.gender')} *</InputLabel>
                          <StyledSelect {...field} label={`${t('staff.form.gender')} *`}>
                            <MenuItem value="male">{t('staff.form.male')}</MenuItem>
                            <MenuItem value="female">{t('staff.form.female')}</MenuItem>
                            <MenuItem value="other">{t('staff.form.other')}</MenuItem>
                          </StyledSelect>
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </FormSection>
            </MotionBox>
          </Grid>

          {/* Employment Information */}
          <Grid item xs={12}>
            <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <FormSection icon={<WorkIcon sx={{ color: theme.palette.primary.main }} />} title={t('staff.form.employmentInfo')}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={4}>
                    <Controller
                      name="position"
                      control={control}
                      rules={{ required: t('staff.form.required') }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.position}>
                          <InputLabel>{t('staff.position')} *</InputLabel>
                          <StyledSelect {...field} label={`${t('staff.position')} *`} value={field.value || ''}>
                            <MenuItem value="principal">{t('staff.positions.principal')}</MenuItem>
                            <MenuItem value="vice_principal">{t('staff.positions.vicePrincipal')}</MenuItem>
                            <MenuItem value="teacher">{t('staff.positions.teacher')}</MenuItem>
                            <MenuItem value="accountant">{t('staff.positions.accountant')}</MenuItem>
                            <MenuItem value="librarian">{t('staff.positions.librarian')}</MenuItem>
                            <MenuItem value="support_staff">{t('staff.positions.supportStaff')}</MenuItem>
                            <MenuItem value="office_staff">{t('staff.positions.officeStaff')}</MenuItem>
                            <MenuItem value="sports_coordinator">{t('staff.positions.sportsCoordinator')}</MenuItem>
                            <MenuItem value="class_teacher">{t('staff.positions.classTeacher')}</MenuItem>
                            <MenuItem value="subject_teacher">{t('staff.positions.subjectTeacher')}</MenuItem>
                            <MenuItem value="department_head">{t('staff.positions.departmentHead')}</MenuItem>
                            <MenuItem value="eca_coordinator">{t('staff.positions.ecaCoordinator')}</MenuItem>
                            <MenuItem value="transport_manager">{t('staff.positions.transportManager')}</MenuItem>
                            <MenuItem value="hostel_warden">{t('staff.positions.hostelWarden')}</MenuItem>
                            <MenuItem value="school_administrator">{t('staff.positions.schoolAdministrator')}</MenuItem>
                          </StyledSelect>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="department"
                      control={control}
                      rules={{ required: t('staff.form.required') }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.department}>
                          <InputLabel>{t('staff.department')} *</InputLabel>
                          <StyledSelect {...field} label={`${t('staff.department')} *`} value={field.value || ''}>
                            <MenuItem value="academic">{t('staff.departments.academic')}</MenuItem>
                            <MenuItem value="administration">{t('staff.departments.administration')}</MenuItem>
                            <MenuItem value="support">{t('staff.departments.support')}</MenuItem>
                            <MenuItem value="sports">{t('staff.departments.sports')}</MenuItem>
                            <MenuItem value="science">{t('staff.departments.science')}</MenuItem>
                            <MenuItem value="extra_curricular">{t('staff.departments.extraCurricular')}</MenuItem>
                            <MenuItem value="transport">{t('staff.departments.transport')}</MenuItem>
                            <MenuItem value="hostel">{t('staff.departments.hostel')}</MenuItem>
                            <MenuItem value="finance">{t('staff.departments.finance')}</MenuItem>
                          </StyledSelect>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Controller
                      name="joining_date_bs"
                      control={control}
                      rules={{ 
                        required: t('staff.form.required'),
                        pattern: {
                          value: /^\d{4}-\d{2}-\d{2}$/,
                          message: t('staff.form.dateFormatError')
                        }
                      }}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={`${t('staff.form.joiningDate')} *`}
                          fullWidth
                          placeholder="2078-04-01"
                          error={!!errors.joining_date_bs}
                          helperText={errors.joining_date_bs?.message || t('staff.form.dateFormatHint')}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="qualification"
                      control={control}
                      rules={{ required: t('staff.form.required') }}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={`${t('staff.form.qualification')} *`}
                          fullWidth
                          error={!!errors.qualification}
                          helperText={errors.qualification?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BadgeIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="specialization"
                      control={control}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={t('staff.form.specialization')}
                          fullWidth
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BadgeIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>{t('staff.status')}</InputLabel>
                          <StyledSelect {...field} label={t('staff.status')}>
                            <MenuItem value="active">{t('staff.active')}</MenuItem>
                            <MenuItem value="inactive">{t('staff.inactive')}</MenuItem>
                            <MenuItem value="on_leave">{t('staff.onLeave')}</MenuItem>
                          </StyledSelect>
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>{t('staff.role')}</InputLabel>
                          <StyledSelect {...field} label={t('staff.role')} value={field.value || ''}>
                            <MenuItem value="">{t('staff.roles.none')}</MenuItem>
                            <MenuItem value="School_Admin">{t('staff.roles.schoolAdmin')}</MenuItem>
                            <MenuItem value="Class_Teacher">{t('staff.roles.classTeacher')}</MenuItem>
                            <MenuItem value="Subject_Teacher">{t('staff.roles.subjectTeacher')}</MenuItem>
                            <MenuItem value="Accountant">{t('staff.roles.accountant')}</MenuItem>
                            <MenuItem value="Librarian">{t('staff.roles.librarian')}</MenuItem>
                          </StyledSelect>
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </FormSection>
            </MotionBox>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <FormSection icon={<PhoneIcon sx={{ color: theme.palette.primary.main }} />} title={t('staff.form.contactInfo')}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="contact_number"
                      control={control}
                      rules={{ 
                        required: t('staff.form.required'),
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: t('staff.form.phoneValidation')
                        }
                      }}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={`${t('staff.contactNumber')} *`}
                          fullWidth
                          placeholder="9841234567"
                          error={!!errors.contact_number}
                          helperText={errors.contact_number?.message || t('staff.form.phoneHelperText')}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="email"
                      control={control}
                      rules={{ 
                        required: t('staff.form.required'),
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: t('staff.form.emailValidation')
                        }
                      }}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={`${t('staff.email')} *`}
                          type="email"
                          fullWidth
                          placeholder="staff@example.com"
                          error={!!errors.email}
                          helperText={errors.email?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="address"
                      control={control}
                      rules={{ required: t('staff.form.required') }}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={`${t('staff.form.address')} *`}
                          fullWidth
                          error={!!errors.address}
                          helperText={errors.address?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="city"
                      control={control}
                      rules={{ required: t('staff.form.required') }}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={`${t('staff.form.city')} *`}
                          fullWidth
                          error={!!errors.city}
                          helperText={errors.city?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="district"
                      control={control}
                      rules={{ required: t('staff.form.required') }}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={`${t('staff.form.district')} *`}
                          fullWidth
                          error={!!errors.district}
                          helperText={errors.district?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </FormSection>
            </MotionBox>
          </Grid>

          {/* Emergency Contact */}
          <Grid item xs={12}>
            <MotionBox initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <FormSection icon={<EmergencyIcon sx={{ color: theme.palette.warning.main }} />} title={t('staff.form.emergencyContact')} color="warning">
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={6}>
                    <Controller
                      name="emergency_contact_name"
                      control={control}
                      rules={{ required: t('staff.form.required') }}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={`${t('staff.form.emergencyContactName')} *`}
                          fullWidth
                          error={!!errors.emergency_contact_name}
                          helperText={errors.emergency_contact_name?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Controller
                      name="emergency_contact_number"
                      control={control}
                      rules={{ 
                        required: t('staff.form.required'),
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: t('staff.form.phoneValidation')
                        }
                      }}
                      render={({ field }) => (
                        <StyledTextField
                          {...field}
                          label={`${t('staff.form.emergencyContactNumber')} *`}
                          fullWidth
                          placeholder="9841234567"
                          error={!!errors.emergency_contact_number}
                          helperText={errors.emergency_contact_number?.message || t('staff.form.phoneHelperText')}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </FormSection>
            </MotionBox>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <MotionBox 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.35 }}
              sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}
            >
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => navigate(`/staff`)}
                disabled={loading}
                sx={{ 
                  ...S.BTN_OUTLINE,
                  px: 4, 
                  py: 1.25,
                }}
              >
                {t('staff.form.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
                sx={{ 
                  ...S.BTN_PRIMARY,
                  px: 5, 
                  py: 1.25,
                }}
              >
                {loading ? t('staff.form.saving') : t('staff.form.save')}
              </Button>
            </MotionBox>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

/**
 * Student Form Component
 * 
 * Reusable form for creating and editing students
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
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
  Card,
  CardContent,
  alpha,
  useTheme,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { 
  PhotoCamera, 
  Save as SaveIcon, 
  ArrowBack as BackIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  ContactPhone as ContactIcon,
  FamilyRestroom as GuardianIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { apiClient } from '../../services/apiClient';
import { BSDatePicker } from '../../components/BSDatePicker/BSDatePicker';
import { motion } from 'framer-motion';
import { useNepaliNumbers } from '../../hooks/useNepaliNumbers';
import { DuplicateWarningDialog } from '../../components/students/DuplicateWarningDialog';
import { ValidationWarnings } from '../../components/students/ValidationWarnings';
import { SiblingsList } from '../../components/students/SiblingsList';

const MotionCard = motion.create(Card);

const parseDate = (value: string | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

interface StudentFormData {
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth_bs: string;
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  current_class: number;
  section: string;
  roll_number?: number;
  admission_date_bs: string;
  contact_number?: string;
  email?: string;
  address: string;
  city: string;
  district: string;
  guardian_name: string;
  guardian_relation: string;
  guardian_contact: string;
  guardian_email?: string;
  status: 'active' | 'inactive';
}

const GENDER_OPTIONS = [
  { value: 'male', labelKey: 'students.male' },
  { value: 'female', labelKey: 'students.female' },
  { value: 'other', labelKey: 'students.other' },
];

const BLOOD_GROUP_OPTIONS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const SECTION_OPTIONS = ['A', 'B', 'C'];

const RELATION_OPTIONS = [
  { value: 'father', labelKey: 'students.father' },
  { value: 'mother', labelKey: 'students.mother' },
  { value: 'guardian', labelKey: 'students.guardian' },
];

const STATUS_OPTIONS = [
  { value: 'active', labelKey: 'students.active' },
  { value: 'inactive', labelKey: 'students.inactive' },
];

export const StudentForm = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useTheme();
  const { formatNumber } = useNepaliNumbers();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // Enhanced features
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [validation, setValidation] = useState<any>(null);
  const [siblings, setSiblings] = useState<any[]>([]);
  const [siblingsLoading, setSiblingsLoading] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const { control, handleSubmit, reset, getValues, formState: { errors } } = useForm<StudentFormData>({
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      date_of_birth_bs: '',
      gender: 'male',
      blood_group: '',
      current_class: 1,
      section: 'A',
      roll_number: 0,
      admission_date_bs: '',
      contact_number: '',
      email: '',
      address: '',
      city: '',
      district: '',
      guardian_name: '',
      guardian_relation: 'father',
      guardian_contact: '',
      guardian_email: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (isEdit) {
      fetchStudent();
      fetchSiblings();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      const response = await apiClient.get(`/api/v1/students/${id}`);
      const student = response.data.data || response.data;
      
      console.log('Fetched student data:', student);
      
      // Map backend camelCase to form snake_case
      const formData = {
        first_name: student.firstNameEn || '',
        middle_name: student.middleNameEn || '',
        last_name: student.lastNameEn || '',
        date_of_birth_bs: student.dateOfBirthBS || '',
        gender: student.gender || 'male',
        blood_group: student.bloodGroup || '',
        current_class: student.class?.classLevel || 1,
        section: student.class?.section || 'A',
        roll_number: student.rollNumber || 0,
        admission_date_bs: student.admissionDate || '',
        contact_number: student.phone || '',
        email: student.email || '',
        address: student.addressEn || '',
        city: student.city || '',
        district: student.district || '',
        guardian_name: student.fatherName || '',
        guardian_relation: 'father',
        guardian_contact: student.fatherPhone || '',
        guardian_email: '',
        status: student.status || 'active',
      };
      
      console.log('Mapped form data:', formData);
      
      reset(formData);
      if (student.photoUrl) {
        setPhotoPreview(student.photoUrl);
      }
    } catch (error) {
      console.error('Failed to fetch student:', error);
      setError(t('messages.error'));
    }
  };

  const fetchSiblings = async () => {
    if (!id) return;
    
    try {
      setSiblingsLoading(true);
      const response = await apiClient.get(`/api/v1/students/${id}/siblings`);
      setSiblings(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch siblings:', error);
    } finally {
      setSiblingsLoading(false);
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: StudentFormData) => {
    try {
      setLoading(true);
      setError('');

      // Map form snake_case to backend camelCase
      const studentData = {
        firstNameEn: data.first_name,
        middleNameEn: data.middle_name || null,
        lastNameEn: data.last_name,
        dateOfBirthBS: data.date_of_birth_bs,
        gender: data.gender,
        bloodGroup: data.blood_group || null,
        currentClassId: data.current_class,
        rollNumber: data.roll_number || null,
        admissionDate: data.admission_date_bs,
        phone: data.contact_number || null,
        email: data.email || null,
        addressEn: data.address,
        city: data.city,
        district: data.district,
        fatherName: data.guardian_name,
        fatherPhone: data.guardian_contact,
        motherName: data.guardian_name, // Using same for now
        motherPhone: data.guardian_contact,
        emergencyContact: data.guardian_contact,
        status: data.status,
      };

      // For new students, check for duplicates first
      if (!isEdit) {
        await checkForDuplicates(studentData);
        return; // Will continue in handleProceedWithDuplicate if user confirms
      }

      // For edits, validate and save
      await validateAndSave(studentData);
    } catch (error: any) {
      console.error('Failed to save student:', error);
      setError(error.response?.data?.message || t('messages.error'));
      setLoading(false);
    }
  };

  const checkForDuplicates = async (studentData: any) => {
    try {
      setCheckingDuplicates(true);
      
      // Check for duplicates
      const dupResponse = await apiClient.post('/api/v1/students/detect-duplicates', studentData);
      const foundDuplicates = dupResponse.data.data?.duplicates || [];

      if (foundDuplicates.length > 0) {
        setDuplicates(foundDuplicates);
        setDuplicateDialogOpen(true);
        setLoading(false);
      } else {
        // No duplicates, proceed with validation and save
        await validateAndSave(studentData);
      }
    } catch (error: any) {
      console.error('Duplicate check failed:', error);
      // If duplicate check fails, proceed anyway
      await validateAndSave(studentData);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const validateAndSave = async (studentData: any) => {
    try {
      // Validate student data
      const valResponse = await apiClient.post('/api/v1/students/validate', studentData, {
        params: isEdit ? { excludeId: id } : {}
      });
      const validationResult = valResponse.data.data;
      
      setValidation(validationResult);

      // If there are blocking errors, don't save
      if (!validationResult.isValid) {
        setLoading(false);
        return;
      }

      // Save student
      let savedStudent;
      if (isEdit) {
        const response = await apiClient.put(`/api/v1/students/${id}`, studentData);
        savedStudent = response.data.data;
      } else {
        const response = await apiClient.post('/api/v1/students', studentData);
        savedStudent = response.data.data;
      }

      // Upload photo separately if provided
      if (photoFile && savedStudent) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photoFile);
        await apiClient.post(`/api/v1/students/${savedStudent.studentId || id}/photo`, photoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate('/students');
    } catch (error: any) {
      console.error('Failed to save student:', error);
      setError(error.response?.data?.message || t('messages.error'));
      setLoading(false);
    }
  };

  const handleProceedWithDuplicate = async () => {
    setDuplicateDialogOpen(false);
    
    // Get form data and proceed with save
    const formData = getValues();
    const studentData = {
      firstNameEn: formData.first_name,
      middleNameEn: formData.middle_name || null,
      lastNameEn: formData.last_name,
      dateOfBirthBS: formData.date_of_birth_bs,
      gender: formData.gender,
      bloodGroup: formData.blood_group || null,
      currentClassId: formData.current_class,
      rollNumber: formData.roll_number || null,
      admissionDate: formData.admission_date_bs,
      phone: formData.contact_number || null,
      email: formData.email || null,
      addressEn: formData.address,
      city: formData.city,
      district: formData.district,
      fatherName: formData.guardian_name,
      fatherPhone: formData.guardian_contact,
      motherName: formData.guardian_name,
      motherPhone: formData.guardian_contact,
      emergencyContact: formData.guardian_contact,
      status: formData.status,
    };

    await validateAndSave(studentData);
  };

  return (
    <Box sx={{ mt: 2, mb: 4 }} key={i18n.language}>
      {/* Header */}
      <MotionCard 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        elevation={0}
        sx={{ 
          mb: 3,
          borderRadius: 4,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(28,28,30,0.4) 0%, rgba(28,28,30,0.6) 100%)' 
            : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.5) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
          color: theme.palette.text.primary,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
              }}>
                <PersonIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                  {isEdit ? t('students.editStudent') : t('students.addStudent')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, opacity: 0.9 }}>
                  <Typography variant="body2">
                    {isEdit ? t('students.editStudentSubtitle') : t('students.addStudentSubtitle')}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/students')}
              sx={{ 
                borderRadius: 2,
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                '&:hover': { 
                  borderColor: 'rgba(255,255,255,0.5)', 
                  bgcolor: 'rgba(255,255,255,0.1)' 
                }
              }}
            >
              {t('common.back')}
            </Button>
          </Box>
        </CardContent>
      </MotionCard>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Validation Warnings */}
      <ValidationWarnings validation={validation} sx={{ mb: 3 }} />

      {/* Siblings List (for edit mode) */}
      {isEdit && siblings.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <SiblingsList siblings={siblings} loading={siblingsLoading} />
        </Box>
      )}

      {/* Photo Upload */}
      <MotionCard 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        elevation={0}
        sx={{ 
          mb: 3,
          borderRadius: 4,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`,
          background: theme.palette.mode === 'dark' 
            ? 'rgba(28,28,30,0.6)' 
            : 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={photoPreview}
                sx={{ 
                  width: 100, 
                  height: 100, 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <PersonIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
              </Avatar>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="photo-upload"
                type="file"
                onChange={handlePhotoChange}
              />
              <label htmlFor="photo-upload">
                <IconButton 
                  color="primary" 
                  component="span"
                  sx={{ 
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  <PhotoCamera />
                </IconButton>
              </label>
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {t('students.photo')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('students.photoHint')}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </MotionCard>

      {/* Form */}
      <MotionCard 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        elevation={0}
        sx={{ 
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.7)} 100%)`
            : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha('#fff', 0.8)} 100%)`,
          backdropFilter: 'blur(20px)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Personal Information */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <PersonIcon sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight={700}>
                    {t('students.personalInfo')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="first_name"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.firstName')}
                      fullWidth
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="middle_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.middleName')}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="last_name"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.lastName')}
                      fullWidth
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="date_of_birth_bs"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <BSDatePicker
                      label={t('students.dateOfBirth')}
                      value={parseDate(field.value)}
                      onChange={(date) => field.onChange(formatDate(date))}
                      error={!!errors.date_of_birth_bs}
                      helperText={errors.date_of_birth_bs?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="gender"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.gender}>
                      <InputLabel>{t('students.gender')} *</InputLabel>
                      <Select {...field} label={`${t('students.gender')} *`}>
                        {GENDER_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {t(option.labelKey)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="blood_group"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>{t('students.bloodGroup')}</InputLabel>
                      <Select {...field} label={t('students.bloodGroup')}>
                        <MenuItem value="">{t('common.none')}</MenuItem>
                        {BLOOD_GROUP_OPTIONS.filter(Boolean).map((bg) => (
                          <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Academic Information */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 2 }}>
                  <SchoolIcon sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight={700}>
                    {t('students.academicInfo')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={3}>
                <Controller
                  name="current_class"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.current_class}>
                      <InputLabel>{t('students.class')} *</InputLabel>
                      <Select {...field} label={`${t('students.class')} *`}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                          <MenuItem key={cls} value={cls}>
                            {t('students.class')} {formatNumber(cls)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Controller
                  name="section"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.section}>
                      <InputLabel>{t('students.section')} *</InputLabel>
                      <Select {...field} label={`${t('students.section')} *`}>
                        {SECTION_OPTIONS.map((sec) => (
                          <MenuItem key={sec} value={sec}>
                            {t('students.section')} {sec}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Controller
                  name="roll_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.rollNumber')}
                      type="number"
                      fullWidth
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value || ''}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Controller
                  name="admission_date_bs"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <BSDatePicker
                      label={t('students.admissionDate')}
                      value={parseDate(field.value)}
                      onChange={(date) => field.onChange(formatDate(date))}
                      error={!!errors.admission_date_bs}
                      helperText={errors.admission_date_bs?.message}
                    />
                  )}
                />
              </Grid>

              {/* Contact Information */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 2 }}>
                  <ContactIcon sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight={700}>
                    {t('students.contactInfo')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="contact_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.contactNumber')}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.email')}
                      type="email"
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="address"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.address')}
                      fullWidth
                      error={!!errors.address}
                      helperText={errors.address?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="city"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.city')}
                      fullWidth
                      error={!!errors.city}
                      helperText={errors.city?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="district"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.district')}
                      fullWidth
                      error={!!errors.district}
                      helperText={errors.district?.message}
                    />
                  )}
                />
              </Grid>

              {/* Guardian Information */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 2 }}>
                  <GuardianIcon sx={{ color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight={700}>
                    {t('students.guardianInfo')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="guardian_name"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.guardianName')}
                      fullWidth
                      error={!!errors.guardian_name}
                      helperText={errors.guardian_name?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="guardian_relation"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.guardian_relation}>
                      <InputLabel>{t('students.relation')} *</InputLabel>
                      <Select {...field} label={`${t('students.relation')} *`}>
                        {RELATION_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {t(option.labelKey)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="guardian_contact"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.guardianPhone')}
                      fullWidth
                      error={!!errors.guardian_contact}
                      helperText={errors.guardian_contact?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="guardian_email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.guardianEmail')}
                      type="email"
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* Status */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>{t('students.status')}</InputLabel>
                      <Select {...field} label={t('students.status')}>
                        {STATUS_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {t(option.labelKey)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={() => navigate('/students')}
                    disabled={loading || checkingDuplicates}
                    sx={{ borderRadius: 2 }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading || checkingDuplicates ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={loading || checkingDuplicates}
                    sx={{ 
                      borderRadius: 2,
                      px: 4,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                      '&:hover': { 
                        boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                      }
                    }}
                  >
                    {checkingDuplicates 
                      ? t('students.checkingDuplicates') || 'Checking...'
                      : loading 
                        ? t('common.saving') 
                        : t('common.save')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </MotionCard>

      {/* Duplicate Warning Dialog */}
      <DuplicateWarningDialog
        open={duplicateDialogOpen}
        duplicates={duplicates}
        onClose={() => {
          setDuplicateDialogOpen(false);
          setLoading(false);
        }}
        onProceed={handleProceedWithDuplicate}
      />
    </Box>
  );
};

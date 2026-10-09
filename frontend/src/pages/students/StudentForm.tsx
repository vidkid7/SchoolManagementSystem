/**
 * Student Form Component
 * 
 * Reusable form for creating and editing students
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
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
import { C, useAdminStyles } from '../../theme/designTokens';
import { DuplicateWarningDialog } from '../../components/students/DuplicateWarningDialog';
import { ValidationWarnings } from '../../components/students/ValidationWarnings';
import { SiblingsList } from '../../components/students/SiblingsList';
import { formatBSDate, formatDate, formatDateForInput, parseBSDate, parseDate } from './studentDateUtils';

const MotionCard = motion.create(Card);

interface StudentFormData {
  // English Names
  first_name: string;
  middle_name?: string;
  last_name: string;
  // Nepali Names
  first_name_np?: string;
  middle_name_np?: string;
  last_name_np?: string;
  // Birth Dates
  date_of_birth_bs: string;
  date_of_birth_ad: string;
  // Personal Info
  gender: 'male' | 'female' | 'other';
  blood_group?: string;
  // Address
  address: string;
  address_np?: string;
  city: string;
  district: string;
  // Contact
  contact_number?: string;
  email?: string;
  emergency_contact: string;
  // Academic
  admission_date: string;
  admission_class: number;
  current_class?: number | '';
  roll_number?: number;
  previous_school?: string;
  symbol_number?: string;
  neb_registration_number?: string;
  // Father Info
  father_name: string;
  father_phone: string;
  father_citizenship_no?: string;
  // Mother Info
  mother_name: string;
  mother_phone: string;
  mother_citizenship_no?: string;
  // Local Guardian
  local_guardian_name?: string;
  local_guardian_phone?: string;
  local_guardian_relation?: string;
  // Medical
  allergies?: string;
  medical_conditions?: string;
  // Other
  photo_url?: string;
  status: 'active' | 'inactive';
}

const GENDER_OPTIONS = [
  { value: 'male', labelKey: 'students.male' },
  { value: 'female', labelKey: 'students.female' },
  { value: 'other', labelKey: 'students.other' },
];

const BLOOD_GROUP_OPTIONS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const RELATION_OPTIONS = [
  { value: 'father', labelKey: 'students.father' },
  { value: 'mother', labelKey: 'students.mother' },
  { value: 'guardian', labelKey: 'students.guardian' },
];

const STATUS_OPTIONS = [
  { value: 'active', labelKey: 'students.active' },
  { value: 'inactive', labelKey: 'students.inactive' },
];

interface AcademicClassOption {
  classId: number;
  gradeLevel: number;
  section: string;
}

export const StudentForm = () => {
  const { t, i18n } = useTranslation();
  const navigate = useSlugNavigate();
  const { id, municipalitySlug } = useParams<{ id: string; municipalitySlug: string }>();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { formatNumber } = useNepaliNumbers();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [academicClasses, setAcademicClasses] = useState<AcademicClassOption[]>([]);
  
  // Enhanced features
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [validation, setValidation] = useState<any>(null);
  const [siblings, setSiblings] = useState<any[]>([]);
  const [siblingsLoading, setSiblingsLoading] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const { control, handleSubmit, reset, getValues, setValue, formState: { errors } } = useForm<StudentFormData>({
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      first_name_np: '',
      middle_name_np: '',
      last_name_np: '',
      date_of_birth_bs: '',
      date_of_birth_ad: '',
      gender: 'male',
      blood_group: '',
      address: '',
      address_np: '',
      city: '',
      district: '',
      contact_number: '',
      email: '',
      emergency_contact: '',
      admission_date: '',
      admission_class: 1,
      current_class: '',
      roll_number: 0,
      previous_school: '',
      symbol_number: '',
      neb_registration_number: '',
      father_name: '',
      father_phone: '',
      father_citizenship_no: '',
      mother_name: '',
      mother_phone: '',
      mother_citizenship_no: '',
      local_guardian_name: '',
      local_guardian_phone: '',
      local_guardian_relation: '',
      allergies: '',
      medical_conditions: '',
      photo_url: '',
      status: 'active',
    },
  });

  useEffect(() => {
    let mounted = true;
    apiClient.get('/academic/classes')
      .then((response) => {
        const classRows = response.data?.data || response.data;
        if (!mounted || !Array.isArray(classRows)) return;

        setAcademicClasses(classRows.flatMap((row: any) => {
          const classId = Number(row.classId ?? row.class_id);
          const gradeLevel = Number(row.gradeLevel ?? row.grade_level);
          if (!Number.isInteger(classId) || !Number.isInteger(gradeLevel)) return [];
          return [{ classId, gradeLevel, section: String(row.section || '') }];
        }));
      })
      .catch((classError) => {
        console.error('Failed to load academic classes:', classError);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
        // English Names
        first_name: student.firstNameEn || '',
        middle_name: student.middleNameEn || '',
        last_name: student.lastNameEn || '',
        // Nepali Names
        first_name_np: student.firstNameNp || '',
        middle_name_np: student.middleNameNp || '',
        last_name_np: student.lastNameNp || '',
        // Birth Dates - format for date inputs
        date_of_birth_bs: formatDateForInput(student.dateOfBirthBS),
        date_of_birth_ad: formatDateForInput(student.dateOfBirthAD),
        // Personal Info
        gender: student.gender || 'male',
        blood_group: student.bloodGroup || '',
        // Address
        address: student.addressEn || '',
        address_np: student.addressNp || '',
        city: student.city || '',
        district: student.district || '',
        // Contact
        contact_number: student.phone || '',
        email: student.email || '',
        emergency_contact: student.emergencyContact || '',
        // Academic - format dates and validate class values
        admission_date: formatDateForInput(student.admissionDate),
        admission_class: (() => {
          const admissionClass = student.admissionClass;
          // Only set if it's a valid class (1-12), otherwise default to 1
          if (admissionClass && admissionClass >= 1 && admissionClass <= 12) {
            return admissionClass;
          }
          return 1;
        })(),
        current_class: student.currentClassId || student.class?.classId || '',
        roll_number: student.rollNumber || 0,
        previous_school: student.previousSchool || '',
        symbol_number: student.symbolNumber || '',
        neb_registration_number: student.nebRegistrationNumber || '',
        // Father Info
        father_name: student.fatherName || '',
        father_phone: student.fatherPhone || '',
        father_citizenship_no: student.fatherCitizenshipNo || '',
        // Mother Info
        mother_name: student.motherName || '',
        mother_phone: student.motherPhone || '',
        mother_citizenship_no: student.motherCitizenshipNo || '',
        // Local Guardian
        local_guardian_name: student.localGuardianName || '',
        local_guardian_phone: student.localGuardianPhone || '',
        local_guardian_relation: student.localGuardianRelation || '',
        // Medical
        allergies: student.allergies || '',
        medical_conditions: student.medicalConditions || '',
        // Other
        photo_url: student.photoUrl || '',
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
        // English Names
        firstNameEn: data.first_name,
        middleNameEn: data.middle_name || null,
        lastNameEn: data.last_name,
        // Nepali Names
        firstNameNp: data.first_name_np || null,
        middleNameNp: data.middle_name_np || null,
        lastNameNp: data.last_name_np || null,
        // Birth Dates
        dateOfBirthBS: formatBSDate(parseDate(data.date_of_birth_ad)) || data.date_of_birth_bs,
        dateOfBirthAD: data.date_of_birth_ad,
        // Personal Info
        gender: data.gender,
        bloodGroup: data.blood_group || null,
        // Address
        addressEn: data.address,
        addressNp: data.address_np || null,
        city: data.city,
        district: data.district,
        // Contact
        phone: data.contact_number || null,
        email: data.email || null,
        emergencyContact: data.emergency_contact,
        // Academic
        admissionDate: data.admission_date,
        admissionClass: data.admission_class,
        currentClassId: data.current_class ? Number(data.current_class) : null,
        rollNumber: data.roll_number || null,
        previousSchool: data.previous_school || null,
        symbolNumber: data.symbol_number || null,
        nebRegistrationNumber: data.neb_registration_number || null,
        // Father Info
        fatherName: data.father_name,
        fatherPhone: data.father_phone,
        fatherCitizenshipNo: data.father_citizenship_no || null,
        // Mother Info
        motherName: data.mother_name,
        motherPhone: data.mother_phone,
        motherCitizenshipNo: data.mother_citizenship_no || null,
        // Local Guardian
        localGuardianName: data.local_guardian_name || null,
        localGuardianPhone: data.local_guardian_phone || null,
        localGuardianRelation: data.local_guardian_relation || null,
        // Medical
        allergies: data.allergies || null,
        medicalConditions: data.medical_conditions || null,
        // Other
        photoUrl: data.photo_url || null,
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

      navigate(`/students`);
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
      // English Names
      firstNameEn: formData.first_name,
      middleNameEn: formData.middle_name || null,
      lastNameEn: formData.last_name,
      // Nepali Names
      firstNameNp: formData.first_name_np || null,
      middleNameNp: formData.middle_name_np || null,
      lastNameNp: formData.last_name_np || null,
      // Birth Dates
      dateOfBirthBS: formatBSDate(parseDate(formData.date_of_birth_ad)) || formData.date_of_birth_bs,
      dateOfBirthAD: formData.date_of_birth_ad,
      // Personal Info
      gender: formData.gender,
      bloodGroup: formData.blood_group || null,
      // Address
      addressEn: formData.address,
      addressNp: formData.address_np || null,
      city: formData.city,
      district: formData.district,
      // Contact
      phone: formData.contact_number || null,
      email: formData.email || null,
      emergencyContact: formData.emergency_contact,
      // Academic
      admissionDate: formData.admission_date,
      admissionClass: formData.admission_class,
      currentClassId: formData.current_class ? Number(formData.current_class) : null,
      rollNumber: formData.roll_number || null,
      previousSchool: formData.previous_school || null,
      symbolNumber: formData.symbol_number || null,
      nebRegistrationNumber: formData.neb_registration_number || null,
      // Father Info
      fatherName: formData.father_name,
      fatherPhone: formData.father_phone,
      fatherCitizenshipNo: formData.father_citizenship_no || null,
      // Mother Info
      motherName: formData.mother_name,
      motherPhone: formData.mother_phone,
      motherCitizenshipNo: formData.mother_citizenship_no || null,
      // Local Guardian
      localGuardianName: formData.local_guardian_name || null,
      localGuardianPhone: formData.local_guardian_phone || null,
      localGuardianRelation: formData.local_guardian_relation || null,
      // Medical
      allergies: formData.allergies || null,
      medicalConditions: formData.medical_conditions || null,
      // Other
      photoUrl: formData.photo_url || null,
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
          borderRadius: 2,
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
              onClick={() => navigate(`/students`)}
              sx={{ ...S.BTN_OUTLINE,  
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
          borderRadius: 2,
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
          borderRadius: 2,
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

              {/* Nepali Names */}
              <Grid item xs={12} md={4}>
                <Controller
                  name="first_name_np"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${t('students.firstName')} (Nepali)`}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="middle_name_np"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${t('students.middleName')} (Nepali)`}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="last_name_np"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${t('students.lastName')} (Nepali)`}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* Date of Birth */}
              <Grid item xs={12} md={4}>
                <Controller
                  name="date_of_birth_bs"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <BSDatePicker
                      label={`${t('students.dateOfBirth')} (BS) *`}
                      value={parseBSDate(field.value)}
                      onChange={(date) => {
                        field.onChange(formatBSDate(date));
                        setValue('date_of_birth_ad', formatDate(date), {
                          shouldDirty: true,
                          shouldValidate: true
                        });
                      }}
                      error={!!errors.date_of_birth_bs}
                      helperText={errors.date_of_birth_bs?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="date_of_birth_ad"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label={`${t('students.dateOfBirth')} (AD) *`}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.date_of_birth_ad}
                      helperText={errors.date_of_birth_ad?.message}
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
                  name="admission_date"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label={`${t('students.admissionDate')} *`}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.admission_date}
                      helperText={errors.admission_date?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Controller
                  name="admission_class"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.admission_class}>
                      <InputLabel>{t('students.admissionClass')} *</InputLabel>
                      <Select {...field} label={`${t('students.admissionClass')} *`}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                          <MenuItem key={cls} value={cls}>
                            Class {formatNumber(cls)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <Controller
                  name="current_class"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.current_class}>
                      <InputLabel>{t('students.currentClass')}</InputLabel>
                      <Select {...field} label={t('students.currentClass')} value={field.value || ''}>
                        <MenuItem value="">{t('students.unassigned')}</MenuItem>
                        {academicClasses.map((cls) => (
                          <MenuItem key={cls.classId} value={cls.classId}>
                            {t('students.class')} {formatNumber(cls.gradeLevel)} — {t('students.section')} {cls.section}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {academicClasses.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">{t('students.noClassesConfigured')}</Alert>
                </Grid>
              )}

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

              <Grid item xs={12} md={4}>
                <Controller
                  name="previous_school"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.previousSchool')}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="symbol_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.symbolNumber')}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="neb_registration_number"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.nebRegistrationNumber')}
                      fullWidth
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

              <Grid item xs={12} md={6}>
                <Controller
                  name="address"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${t('students.address')} (English) *`}
                      fullWidth
                      error={!!errors.address}
                      helperText={errors.address?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="address_np"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${t('students.address')} (Nepali)`}
                      fullWidth
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

              <Grid item xs={12} md={4}>
                <Controller
                  name="emergency_contact"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${t('students.emergencyContact')} *`}
                      fullWidth
                      error={!!errors.emergency_contact}
                      helperText={errors.emergency_contact?.message}
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

              {/* Father Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('students.fatherInformation')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="father_name"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${t('students.fatherName')} *`}
                      fullWidth
                      error={!!errors.father_name}
                      helperText={errors.father_name?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="father_phone"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${t('students.fatherPhone')} *`}
                      fullWidth
                      error={!!errors.father_phone}
                      helperText={errors.father_phone?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="father_citizenship_no"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.fatherCitizenshipNo')}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* Mother Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, mt: 2 }}>
                  {t('students.motherInformation')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="mother_name"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${t('students.motherName')} *`}
                      fullWidth
                      error={!!errors.mother_name}
                      helperText={errors.mother_name?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="mother_phone"
                  control={control}
                  rules={{ required: t('validation.required') }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`${t('students.fatherPhone')} *`}
                      fullWidth
                      error={!!errors.mother_phone}
                      helperText={errors.mother_phone?.message}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="mother_citizenship_no"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.motherCitizenshipNo')}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* Local Guardian Information */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, mt: 2 }}>
                  {t('students.localGuardianInformation')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="local_guardian_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.localGuardianName')}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="local_guardian_phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.localGuardianPhone')}
                      fullWidth
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <Controller
                  name="local_guardian_relation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.localGuardianRelation')}
                      fullWidth
                      placeholder={t('students.guardianRelationPlaceholder')}
                    />
                  )}
                />
              </Grid>

              {/* Medical Information */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 2 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {t('students.medicalInformation')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="allergies"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.allergies')}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder={t('students.listAllergies')}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Controller
                  name="medical_conditions"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={t('students.medicalConditions')}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder={t('students.listMedicalConditions')}
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
                    onClick={() => navigate(`/students`)}
                    disabled={loading || checkingDuplicates}
                    sx={{ ...S.BTN_OUTLINE,  borderRadius: 2 }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    startIcon={loading || checkingDuplicates ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={loading || checkingDuplicates}
                    sx={S.BTN_PRIMARY}
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

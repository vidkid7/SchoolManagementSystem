/**
 * Bulk Add Students
 * Add multiple students at once using a form or import from Excel
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  GroupAdd as GroupAddIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import apiClient from '../../services/apiClient';
import { C, useAdminStyles, R } from '../../theme/designTokens';

const MotionCard = motion.create(Card);

interface StudentForm {
  id: string;
  firstNameEn: string;
  middleNameEn: string;
  lastNameEn: string;
  firstNameNp: string;
  middleNameNp: string;
  lastNameNp: string;
  dateOfBirthBS: string;
  dateOfBirthAD: string;
  gender: string;
  bloodGroup: string;
  addressEn: string;
  addressNp: string;
  phone: string;
  email: string;
  fatherName: string;
  fatherPhone: string;
  fatherCitizenshipNo: string;
  motherName: string;
  motherPhone: string;
  motherCitizenshipNo: string;
  localGuardianName: string;
  localGuardianPhone: string;
  localGuardianRelation: string;
  admissionDate: string;
  admissionClass: string;
  currentClassId: string;
  rollNumber: string;
  previousSchool: string;
  allergies: string;
  medicalConditions: string;
  emergencyContact: string;
  symbolNumber: string;
  nebRegistrationNumber: string;
  photoUrl: string;
}

interface ImportedStudent {
  firstNameEn: string;
  lastNameEn: string;
  dateOfBirth: string;
  gender: string;
  classId: string;
  section: string;
  rollNumber: string;
  phone: string;
  email: string;
  status?: string;
}

export const BulkAdd = () => {
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const [tabValue, setTabValue] = useState(0); // 0 = Manual Form, 1 = Import Excel
  const [students, setStudents] = useState<StudentForm[]>([
    {
      id: '1',
      firstNameEn: '',
      middleNameEn: '',
      lastNameEn: '',
      firstNameNp: '',
      middleNameNp: '',
      lastNameNp: '',
      dateOfBirthBS: '',
      dateOfBirthAD: '',
      gender: 'male',
      bloodGroup: '',
      addressEn: '',
      addressNp: '',
      phone: '',
      email: '',
      fatherName: '',
      fatherPhone: '',
      fatherCitizenshipNo: '',
      motherName: '',
      motherPhone: '',
      motherCitizenshipNo: '',
      localGuardianName: '',
      localGuardianPhone: '',
      localGuardianRelation: '',
      admissionDate: '',
      admissionClass: '',
      currentClassId: '',
      rollNumber: '',
      previousSchool: '',
      allergies: '',
      medicalConditions: '',
      emergencyContact: '',
      symbolNumber: '',
      nebRegistrationNumber: '',
      photoUrl: '',
    },
  ]);
  const [file, setFile] = useState<File | null>(null);
  const [importedStudents, setImportedStudents] = useState<ImportedStudent[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addStudentForm = () => {
    const newId = (Math.max(...students.map(s => parseInt(s.id))) + 1).toString();
    setStudents([
      ...students,
      {
        id: newId,
        firstNameEn: '',
        middleNameEn: '',
        lastNameEn: '',
        firstNameNp: '',
        middleNameNp: '',
        lastNameNp: '',
        dateOfBirthBS: '',
        dateOfBirthAD: '',
        gender: 'male',
        bloodGroup: '',
        addressEn: '',
        addressNp: '',
        phone: '',
        email: '',
        fatherName: '',
        fatherPhone: '',
        fatherCitizenshipNo: '',
        motherName: '',
        motherPhone: '',
        motherCitizenshipNo: '',
        localGuardianName: '',
        localGuardianPhone: '',
        localGuardianRelation: '',
        admissionDate: '',
        admissionClass: '',
        currentClassId: '',
        rollNumber: '',
        previousSchool: '',
        allergies: '',
        medicalConditions: '',
        emergencyContact: '',
        symbolNumber: '',
        nebRegistrationNumber: '',
        photoUrl: '',
      },
    ]);
  };

  const removeStudentForm = (id: string) => {
    if (students.length > 1) {
      setStudents(students.filter(s => s.id !== id));
    }
  };

  const updateStudent = (id: string, field: keyof StudentForm, value: string) => {
    setStudents(students.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
        selectedFile.type !== 'application/vnd.ms-excel' &&
        selectedFile.type !== 'text/csv'
      ) {
        setError(t('bulkImport.invalidFile'));
        return;
      }
      setFile(selectedFile);
      setError('');
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      // Parse the file to preview data
      const response = await apiClient.post('/students/parse-excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportedStudents(response.data.data || []);
      setSuccess(t('students.fileParseSuccess', { count: response.data.data?.length || 0 }));
    } catch (error: any) {
      console.error('Failed to parse file:', error);
      setError(error.response?.data?.message || t('students.fileParseFailed'));
      setImportedStudents([]);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await apiClient.get('/students/import-template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_bulk_add_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download template:', error);
      setError(t('students.templateDownloadFailed'));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      let studentsToSubmit: any[] = [];

      if (tabValue === 0) {
        // Manual form submission
        const invalidStudents = students.filter(
          s => !s.firstNameEn || !s.lastNameEn || !s.dateOfBirthBS || !s.dateOfBirthAD || 
               !s.addressEn || !s.fatherName || !s.fatherPhone || !s.motherName || 
               !s.motherPhone || !s.emergencyContact || !s.admissionDate || !s.admissionClass
        );

        if (invalidStudents.length > 0) {
          setError(t('students.fillRequiredFields'));
          return;
        }

        studentsToSubmit = students.map(s => ({
          firstNameEn: s.firstNameEn,
          middleNameEn: s.middleNameEn || undefined,
          lastNameEn: s.lastNameEn,
          firstNameNp: s.firstNameNp || undefined,
          middleNameNp: s.middleNameNp || undefined,
          lastNameNp: s.lastNameNp || undefined,
          dateOfBirthBS: s.dateOfBirthBS,
          dateOfBirthAD: s.dateOfBirthAD,
          gender: s.gender,
          bloodGroup: s.bloodGroup || undefined,
          addressEn: s.addressEn,
          addressNp: s.addressNp || undefined,
          phone: s.phone || undefined,
          email: s.email || undefined,
          fatherName: s.fatherName,
          fatherPhone: s.fatherPhone,
          fatherCitizenshipNo: s.fatherCitizenshipNo || undefined,
          motherName: s.motherName,
          motherPhone: s.motherPhone,
          motherCitizenshipNo: s.motherCitizenshipNo || undefined,
          localGuardianName: s.localGuardianName || undefined,
          localGuardianPhone: s.localGuardianPhone || undefined,
          localGuardianRelation: s.localGuardianRelation || undefined,
          admissionDate: s.admissionDate,
          admissionClass: parseInt(s.admissionClass),
          currentClassId: s.currentClassId ? parseInt(s.currentClassId) : undefined,
          rollNumber: s.rollNumber ? parseInt(s.rollNumber) : undefined,
          previousSchool: s.previousSchool || undefined,
          allergies: s.allergies || undefined,
          medicalConditions: s.medicalConditions || undefined,
          emergencyContact: s.emergencyContact,
          symbolNumber: s.symbolNumber || undefined,
          nebRegistrationNumber: s.nebRegistrationNumber || undefined,
          photoUrl: s.photoUrl || undefined,
          status: 'active',
        }));
      } else {
        // Excel import submission
        if (importedStudents.length === 0) {
          setError(t('students.noStudentsToImport'));
          return;
        }

        studentsToSubmit = importedStudents.map(s => ({
          firstNameEn: s.firstNameEn,
          lastNameEn: s.lastNameEn,
          dateOfBirth: s.dateOfBirth,
          gender: s.gender,
          currentClassId: parseInt(s.classId),
          section: s.section,
          rollNumber: s.rollNumber ? parseInt(s.rollNumber) : undefined,
          phone: s.phone,
          email: s.email,
          status: s.status || 'active',
        }));
      }

      // Submit all students
      const response = await apiClient.post('/students/bulk-create', {
        students: studentsToSubmit,
      });

      setSuccess(t('students.bulkAddSuccess', { count: studentsToSubmit.length }));
      setTimeout(() => {
        navigate(`/students`);
      }, 2000);
    } catch (error: any) {
      console.error('Failed to bulk add students:', error);
      setError(error.response?.data?.message || t('students.bulkAddFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <MotionCard
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        elevation={0}
        sx={{
          ...S.PAGE_HEADER,
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: R.lg,
                  bgcolor: S.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,122,255,0.08)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <GroupAddIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800}>
                  {t('students.bulkAdd')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  {t('students.bulkAddSubtitle')}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate(`/students`)}
              sx={{ 
                ...S.BTN_OUTLINE,
              }}
            >
              {t('common.back')}
            </Button>
          </Box>
        </CardContent>
      </MotionCard>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabs for Manual vs Import */}
      <Paper
        elevation={0}
        sx={{
          ...S.GLASS,
          mb: 3,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            },
          }}
        >
          <Tab label={t('students.manualEntry')} icon={<AddIcon />} iconPosition="start" />
          <Tab label={t('students.importFromExcel')} icon={<CloudUploadIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <>
          {/* Student Forms */}
      {students.map((student, index) => (
        <Paper
          key={student.id}
          elevation={0}
          sx={{
            ...S.GLASS,
            p: 3,
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              {t('students.student')} {index + 1}
            </Typography>
            {students.length > 1 && (
              <IconButton
                color="error"
                onClick={() => removeStudentForm(student.id)}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          {/* Basic Information */}
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
            {t('students.personalInfo')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.firstName') + ' (English) *'}
                value={student.firstNameEn}
                onChange={(e) => updateStudent(student.id, 'firstNameEn', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.middleName') + ' (English)'}
                value={student.middleNameEn}
                onChange={(e) => updateStudent(student.id, 'middleNameEn', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.lastName') + ' (English) *'}
                value={student.lastNameEn}
                onChange={(e) => updateStudent(student.id, 'lastNameEn', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.firstName') + ' (Nepali)'}
                value={student.firstNameNp}
                onChange={(e) => updateStudent(student.id, 'firstNameNp', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.middleName') + ' (Nepali)'}
                value={student.middleNameNp}
                onChange={(e) => updateStudent(student.id, 'middleNameNp', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.lastName') + ' (Nepali)'}
                value={student.lastNameNp}
                onChange={(e) => updateStudent(student.id, 'lastNameNp', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label={t('students.dateOfBirth') + ' (BS) *'}
                value={student.dateOfBirthBS}
                onChange={(e) => updateStudent(student.id, 'dateOfBirthBS', e.target.value)}
                InputLabelProps={{ shrink: true }}
                placeholder="YYYY-MM-DD"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label={t('students.dateOfBirth') + ' (AD) *'}
                value={student.dateOfBirthAD}
                onChange={(e) => updateStudent(student.id, 'dateOfBirthAD', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label={t('students.gender') + ' *'}
                value={student.gender}
                onChange={(e) => updateStudent(student.id, 'gender', e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="male">{t('students.male')}</option>
                <option value="female">{t('students.female')}</option>
                <option value="other">{t('students.other')}</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label={t('students.bloodGroup')}
                value={student.bloodGroup}
                onChange={(e) => updateStudent(student.id, 'bloodGroup', e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="">{t('common.select')}</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label={t('students.address') + ' (English) *'}
                value={student.addressEn}
                onChange={(e) => updateStudent(student.id, 'addressEn', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label={t('students.address') + ' (Nepali)'}
                value={student.addressNp}
                onChange={(e) => updateStudent(student.id, 'addressNp', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.phone')}
                value={student.phone}
                onChange={(e) => updateStudent(student.id, 'phone', e.target.value)}
                placeholder="9841000001"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label={t('students.email')}
                value={student.email}
                onChange={(e) => updateStudent(student.id, 'email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('students.emergencyContact') + ' *'}
                value={student.emergencyContact}
                onChange={(e) => updateStudent(student.id, 'emergencyContact', e.target.value)}
                placeholder="9841000001"
              />
            </Grid>
          </Grid>

          {/* Guardian Information */}
          <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 3, mb: 2 }}>
            {t('students.guardianInfo')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.fatherName') + ' *'}
                value={student.fatherName}
                onChange={(e) => updateStudent(student.id, 'fatherName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.fatherPhone') + ' *'}
                value={student.fatherPhone}
                onChange={(e) => updateStudent(student.id, 'fatherPhone', e.target.value)}
                placeholder="9841000001"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Father Citizenship No"
                value={student.fatherCitizenshipNo}
                onChange={(e) => updateStudent(student.id, 'fatherCitizenshipNo', e.target.value)}
                sx={{ ...S.TF }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.motherName') + ' *'}
                value={student.motherName}
                onChange={(e) => updateStudent(student.id, 'motherName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.motherPhone') + ' *'}
                value={student.motherPhone}
                onChange={(e) => updateStudent(student.id, 'motherPhone', e.target.value)}
                placeholder="9841000001"
                sx={{ ...S.TF }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.motherCitizenshipNo')}
                value={student.motherCitizenshipNo}
                onChange={(e) => updateStudent(student.id, 'motherCitizenshipNo', e.target.value)}
                sx={{ ...S.TF }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.localGuardianName')}
                value={student.localGuardianName}
                onChange={(e) => updateStudent(student.id, 'localGuardianName', e.target.value)}
                sx={{ ...S.TF }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.localGuardianPhone')}
                value={student.localGuardianPhone}
                onChange={(e) => updateStudent(student.id, 'localGuardianPhone', e.target.value)}
                placeholder="9841000001"
                sx={{ ...S.TF }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.localGuardianRelation')}
                value={student.localGuardianRelation}
                onChange={(e) => updateStudent(student.id, 'localGuardianRelation', e.target.value)}
                placeholder={t('students.localGuardianRelationPlaceholder')}
                sx={{ ...S.TF }}
              />
            </Grid>
          </Grid>

          {/* Academic Information */}
          <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 3, mb: 2 }}>
            {t('students.academicInfo')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label={t('students.admissionDate') + ' *'}
                value={student.admissionDate}
                onChange={(e) => updateStudent(student.id, 'admissionDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.admissionClass') + ' *'}
                value={student.admissionClass}
                onChange={(e) => updateStudent(student.id, 'admissionClass', e.target.value)}
                placeholder="1-12"
                sx={{ ...S.TF }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.currentClassId')}
                value={student.currentClassId}
                onChange={(e) => updateStudent(student.id, 'currentClassId', e.target.value)}
                placeholder={t('students.currentClassIdPlaceholder')}
                sx={{ ...S.TF }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.rollNumber')}
                value={student.rollNumber}
                onChange={(e) => updateStudent(student.id, 'rollNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.previousSchool')}
                value={student.previousSchool}
                onChange={(e) => updateStudent(student.id, 'previousSchool', e.target.value)}
                sx={{ ...S.TF }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('students.symbolNumber')}
                value={student.symbolNumber}
                onChange={(e) => updateStudent(student.id, 'symbolNumber', e.target.value)}
                sx={{ ...S.TF }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('students.nebRegistrationNumber')}
                value={student.nebRegistrationNumber}
                onChange={(e) => updateStudent(student.id, 'nebRegistrationNumber', e.target.value)}
                sx={{ ...S.TF }}
              />
            </Grid>
          </Grid>

          {/* Medical & Other Information */}
          <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 3, mb: 2 }}>
            {t('students.medicalInfo')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('students.allergies')}
                value={student.allergies}
                onChange={(e) => updateStudent(student.id, 'allergies', e.target.value)}
                multiline
                rows={2}
                sx={{ ...S.TF }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('students.medicalConditions')}
                value={student.medicalConditions}
                onChange={(e) => updateStudent(student.id, 'medicalConditions', e.target.value)}
                multiline
                rows={2}
                sx={{ ...S.TF }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('students.photoUrl')}
                value={student.photoUrl}
                onChange={(e) => updateStudent(student.id, 'photoUrl', e.target.value)}
                placeholder="https://example.com/photos/student.jpg"
                sx={{ ...S.TF }}
              />
            </Grid>
          </Grid>
        </Paper>
      ))}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addStudentForm}
              sx={{ ...S.BTN_OUTLINE }}
            >
              {t('students.addAnother')}
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={loading}
              sx={{ ...S.BTN_PRIMARY, px: 4 }}
            >
              {loading ? t('common.saving') : t('students.saveAll')}
            </Button>
          </Box>
        </>
      )}

      {/* Excel Import Tab */}
      {tabValue === 1 && (
        <Box>
          {/* Upload Section */}
          <Paper
            elevation={0}
            sx={{
              ...S.GLASS,
              p: 4,
              mb: 3,
              border: `2px dashed ${C.primaryBdr}`,
              textAlign: 'center',
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('students.uploadExcelFile')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('students.uploadExcelDescription')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ ...S.BTN_PRIMARY }}
              >
                {t('students.selectFile')}
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                />
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
                sx={{ ...S.BTN_OUTLINE }}
              >
                {t('students.downloadTemplate')}
              </Button>
            </Box>
            {file && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={file.name}
                  onDelete={() => {
                    setFile(null);
                    setImportedStudents([]);
                  }}
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            )}
          </Paper>

          {/* Preview Table */}
          {uploading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>{t('students.parsingFile')}</Typography>
            </Box>
          )}

          {!uploading && importedStudents.length > 0 && (
            <>
              <Paper
                elevation={0}
                sx={{
                  ...S.GLASS,
                  mb: 3,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    bgcolor: S.TH_BG,
                    borderBottom: `1px solid ${S.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <Typography variant="h6" fontWeight={700}>
                    {t('students.previewData')} ({importedStudents.length} {t('students.title').toLowerCase()})
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ ...S.TD, fontWeight: 700, bgcolor: S.TH_BG }}>#</TableCell>
                        <TableCell sx={{ ...S.TD, fontWeight: 700, bgcolor: S.TH_BG }}>{t('students.firstName')}</TableCell>
                        <TableCell sx={{ ...S.TD, fontWeight: 700, bgcolor: S.TH_BG }}>{t('students.lastName')}</TableCell>
                        <TableCell sx={{ ...S.TD, fontWeight: 700, bgcolor: S.TH_BG }}>{t('students.dateOfBirth')}</TableCell>
                        <TableCell sx={{ ...S.TD, fontWeight: 700, bgcolor: S.TH_BG }}>{t('students.gender')}</TableCell>
                        <TableCell sx={{ ...S.TD, fontWeight: 700, bgcolor: S.TH_BG }}>{t('students.class')}</TableCell>
                        <TableCell sx={{ ...S.TD, fontWeight: 700, bgcolor: S.TH_BG }}>{t('students.section')}</TableCell>
                        <TableCell sx={{ ...S.TD, fontWeight: 700, bgcolor: S.TH_BG }}>{t('students.rollNumber')}</TableCell>
                        <TableCell sx={{ ...S.TD, fontWeight: 700, bgcolor: S.TH_BG }}>{t('students.phone')}</TableCell>
                        <TableCell sx={{ ...S.TD, fontWeight: 700, bgcolor: S.TH_BG }}>{t('students.email')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importedStudents.map((student, index) => (
                        <TableRow key={index} sx={{ ...S.TR_HOVER }}>
                          <TableCell sx={{ ...S.TD }}>{index + 1}</TableCell>
                          <TableCell sx={{ ...S.TD }}>{student.firstNameEn}</TableCell>
                          <TableCell sx={{ ...S.TD }}>{student.lastNameEn}</TableCell>
                          <TableCell sx={{ ...S.TD }}>{student.dateOfBirth}</TableCell>
                          <TableCell sx={{ ...S.TD }}>{student.gender}</TableCell>
                          <TableCell sx={{ ...S.TD }}>{student.classId}</TableCell>
                          <TableCell sx={{ ...S.TD }}>{student.section}</TableCell>
                          <TableCell sx={{ ...S.TD }}>{student.rollNumber || '-'}</TableCell>
                          <TableCell sx={{ ...S.TD }}>{student.phone || '-'}</TableCell>
                          <TableCell sx={{ ...S.TD }}>{student.email || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Submit Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{ ...S.BTN_PRIMARY, px: 4 }}
                >
                  {loading ? t('common.saving') : t('students.importStudents', { count: importedStudents.length })}
                </Button>
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

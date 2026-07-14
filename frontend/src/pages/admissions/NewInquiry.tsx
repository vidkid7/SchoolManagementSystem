/**
 * New Inquiry Form
 * Create new admission inquiry
 */

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { PersonAdd as InquiryIcon, Save as SaveIcon } from '@mui/icons-material';
import { C, useAdminStyles, R } from '../../theme/designTokens';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import api from '../../config/api';
import { useTranslation } from 'react-i18next';

export function NewInquiry() {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const navigate = useSlugNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    firstNameEn: '',
    middleNameEn: '',
    lastNameEn: '',
    dateOfBirthAD: '',
    gender: '',
    phone: '',
    email: '',
    addressEn: '',
    fatherName: '',
    fatherPhone: '',
    motherName: '',
    motherPhone: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
    applyingForClass: '',
    previousSchool: '',
    previousClass: '',
    inquirySource: '',
    inquiryNotes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');

      const payload = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.trim() || undefined : value,
        ])
      );
      
      const response = await api.post('/admissions/inquiry', {
        ...payload,
        applyingForClass: parseInt(formData.applyingForClass),
        previousClass: formData.previousClass ? parseInt(formData.previousClass) : undefined,
      });
      
      setSuccess(t('admissions.inquiryCreatedSuccessfully'));
      setTimeout(() => {
        navigate(`/admissions/${response.data.data.admissionId}`);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to create inquiry:', error);
      setError(error.response?.data?.message || t('admissions.failedToCreateInquiry'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ ...S.GLASS, p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <InquiryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            {t('admissions.newAdmissionInquiry')}
          </Typography>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            {t('admissions.studentInformation')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label={t('admissions.firstNameEnglish')}
                name="firstNameEn"
                value={formData.firstNameEn}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('admissions.middleNameEnglish')}
                name="middleNameEn"
                value={formData.middleNameEn}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label={t('admissions.lastNameEnglish')}
                name="lastNameEn"
                value={formData.lastNameEn}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label={t('admissions.dateOfBirth')}
                name="dateOfBirthAD"
                value={formData.dateOfBirthAD}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label={t('admissions.gender')}
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <MenuItem value="male">{t('admissions.male')}</MenuItem>
                <MenuItem value="female">{t('admissions.female')}</MenuItem>
                <MenuItem value="other">{t('admissions.other')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                select
                label={t('admissions.applyingForClass')}
                name="applyingForClass"
                value={formData.applyingForClass}
                onChange={handleChange}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                  <MenuItem key={cls} value={cls}>{t('common.class')} {cls}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            {t('admissions.contactInformation')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('admissions.phone')}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label={t('admissions.email')}
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label={t('admissions.address')}
                name="addressEn"
                value={formData.addressEn}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            {t('admissions.parentGuardianInformation')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('admissions.fatherName')}
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('admissions.fatherPhone')}
                name="fatherPhone"
                value={formData.fatherPhone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('admissions.motherName')}
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('admissions.motherPhone')}
                name="motherPhone"
                value={formData.motherPhone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('admissions.guardianName')}
                name="guardianName"
                value={formData.guardianName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('admissions.guardianPhone')}
                name="guardianPhone"
                value={formData.guardianPhone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label={t('admissions.guardianRelation')}
                name="guardianRelation"
                value={formData.guardianRelation}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            {t('admissions.previousEducation')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('admissions.previousSchool')}
                name="previousSchool"
                value={formData.previousSchool}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label={t('admissions.previousClass')}
                name="previousClass"
                value={formData.previousClass}
                onChange={handleChange}
              >
                <MenuItem value="">{t('admissions.none')}</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                  <MenuItem key={cls} value={cls}>{t('common.class')} {cls}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            {t('admissions.inquiryDetails')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label={t('admissions.inquirySource')}
                name="inquirySource"
                value={formData.inquirySource}
                onChange={handleChange}
              >
                <MenuItem value="walk-in">{t('admissions.walkIn')}</MenuItem>
                <MenuItem value="phone">{t('admissions.phoneInquiry')}</MenuItem>
                <MenuItem value="online">{t('admissions.online')}</MenuItem>
                <MenuItem value="referral">{t('admissions.referral')}</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('admissions.inquiryNotes')}
                name="inquiryNotes"
                value={formData.inquiryNotes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined" sx={S.BTN_OUTLINE}
              onClick={() => navigate('/admissions/list')}
              disabled={loading}
            >
              {t('admissions.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained" sx={S.BTN_PRIMARY}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
            >
              {t('admissions.createInquiry')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default NewInquiry;

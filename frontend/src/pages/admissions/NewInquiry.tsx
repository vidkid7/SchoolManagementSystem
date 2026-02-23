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
} from '@mui/material';
import { PersonAdd as InquiryIcon, Save as SaveIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

export function NewInquiry() {
  const navigate = useNavigate();
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
      
      const response = await api.post('/admissions/inquiry', {
        ...formData,
        applyingForClass: parseInt(formData.applyingForClass),
        previousClass: formData.previousClass ? parseInt(formData.previousClass) : undefined,
      });
      
      setSuccess('Inquiry created successfully!');
      setTimeout(() => {
        navigate(`/admissions/${response.data.data.admissionId}`);
      }, 1500);
    } catch (error: any) {
      console.error('Failed to create inquiry:', error);
      setError(error.response?.data?.message || 'Failed to create inquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <InquiryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            New Admission Inquiry
          </Typography>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Student Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="First Name (English)"
                name="firstNameEn"
                value={formData.firstNameEn}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Middle Name (English)"
                name="middleNameEn"
                value={formData.middleNameEn}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                label="Last Name (English)"
                name="lastNameEn"
                value={formData.lastNameEn}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Date of Birth"
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
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                required
                select
                label="Applying for Class"
                name="applyingForClass"
                value={formData.applyingForClass}
                onChange={handleChange}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                  <MenuItem key={cls} value={cls}>Class {cls}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Contact Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label="Email"
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
                label="Address"
                name="addressEn"
                value={formData.addressEn}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Parent/Guardian Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Father's Name"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Father's Phone"
                name="fatherPhone"
                value={formData.fatherPhone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mother's Name"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mother's Phone"
                name="motherPhone"
                value={formData.motherPhone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Guardian's Name"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Guardian's Phone"
                name="guardianPhone"
                value={formData.guardianPhone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Guardian's Relation"
                name="guardianRelation"
                value={formData.guardianRelation}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Previous Education
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Previous School"
                name="previousSchool"
                value={formData.previousSchool}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Previous Class"
                name="previousClass"
                value={formData.previousClass}
                onChange={handleChange}
              >
                <MenuItem value="">None</MenuItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                  <MenuItem key={cls} value={cls}>Class {cls}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Inquiry Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Inquiry Source"
                name="inquirySource"
                value={formData.inquirySource}
                onChange={handleChange}
              >
                <MenuItem value="walk-in">Walk-in</MenuItem>
                <MenuItem value="phone">Phone</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="referral">Referral</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Inquiry Notes"
                name="inquiryNotes"
                value={formData.inquiryNotes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/admissions/list')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={loading}
            >
              Create Inquiry
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default NewInquiry;

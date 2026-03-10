import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, TextField, Typography, Alert, CircularProgress, MenuItem } from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { AppDispatch, RootState } from '../../store';
import { register, clearError } from '../../store/slices/authSlice';

const ROLES = [
  'School_Admin',
  'Class_Teacher',
  'Subject_Teacher',
  'Department_Head',
  'Student',
  'Parent',
  'Librarian',
  'Accountant',
  'ECA_Coordinator',
  'Sports_Coordinator',
  'Transport_Manager',
  'Hostel_Warden',
  'Non_Teaching_Staff',
];

export function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Class_Teacher',
    phoneNumber: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(register({
      ...form,
      phoneNumber: form.phoneNumber || undefined,
    }));
    if (register.fulfilled.match(result)) navigate('/login');
  };

  return (
    <Box sx={{ maxWidth: 440, mx: 'auto', mt: 4, p: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonAdd /> Register
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField fullWidth label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required sx={{ mb: 2 }} />
        <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required sx={{ mb: 2 }} />
        <TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required sx={{ mb: 2 }} />
        <TextField fullWidth label="Confirm password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required error={form.password !== form.confirmPassword && !!form.confirmPassword} sx={{ mb: 2 }} />
        <TextField select fullWidth label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required sx={{ mb: 2 }}>
          {ROLES.map((r) => (
            <MenuItem key={r} value={r}>{r.replace(/_/g, ' ')}</MenuItem>
          ))}
        </TextField>
        <TextField fullWidth label="Phone (optional)" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} sx={{ mb: 2 }} />
        <Button type="submit" variant="contained" fullWidth disabled={isLoading || form.password !== form.confirmPassword} startIcon={isLoading ? <CircularProgress size={20} /> : null}>
          {isLoading ? 'Creating account…' : 'Register'}
        </Button>
      </form>
      <Button component={Link} to="/login" fullWidth sx={{ mt: 2 }}>Already have an account? Log in</Button>
    </Box>
  );
}

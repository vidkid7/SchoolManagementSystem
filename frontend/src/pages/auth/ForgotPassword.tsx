import { useState, FormEvent, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { Lock } from '@mui/icons-material';
import { AppDispatch, RootState } from '../../store';
import { forgotPassword, clearError } from '../../store/slices/authSlice';

export function ForgotPassword() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(forgotPassword(email));
    if (forgotPassword.fulfilled.match(result)) setSent(true);
  };

  return (
    <Box component="main" sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3 }}>
      <Typography component="h1" variant="h5" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Lock /> Forgot password
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: '#475569' }}>
        Enter your email and we’ll send you a link to reset your password.
      </Typography>
      {sent && <Alert severity="success" sx={{ mb: 2 }}>If an account exists for this email, you will receive reset instructions.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <form method="post" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          id="forgot-password-email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          sx={{
            mb: 2,
            '& .MuiInputLabel-root': { color: 'text.primary' },
            '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
          }}
        />
        <Button type="submit" variant="contained" fullWidth disabled={isLoading} startIcon={isLoading ? <CircularProgress size={20} /> : null}>
          {isLoading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
      <Button component={Link} to="/login" fullWidth sx={{ mt: 2 }}>Back to login</Button>
    </Box>
  );
}

import { useState, FormEvent, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, TextField, Typography, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import { AppDispatch, RootState } from '../../store';
import { resetPassword, clearError } from '../../store/slices/authSlice';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) return;
    dispatch(clearError());
    const result = await dispatch(resetPassword({ token, newPassword, confirmNewPassword }));
    if (resetPassword.fulfilled.match(result)) setDone(true);
  };

  if (!token) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3 }}>
        <Alert severity="warning">Missing reset token. Use the link from your email.</Alert>
        <Button component={Link} to="/forgot-password" sx={{ mt: 2 }}>Request new link</Button>
      </Box>
    );
  }

  if (done) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3 }}>
        <Alert severity="success">Password has been reset. You can now log in.</Alert>
        <Button component={Link} to="/login" variant="contained" sx={{ mt: 2 }}>Go to login</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Lock /> Set new password
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="New password"
          type={showPassword ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          sx={{ mb: 2 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          label="Confirm new password"
          type={showPassword ? 'text' : 'password'}
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          required
          error={newPassword !== confirmNewPassword && confirmNewPassword.length > 0}
          helperText={newPassword !== confirmNewPassword && confirmNewPassword.length > 0 ? 'Passwords do not match' : ''}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" fullWidth disabled={isLoading || newPassword !== confirmNewPassword} startIcon={isLoading ? <CircularProgress size={20} /> : null}>
          {isLoading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
      <Button component={Link} to="/login" fullWidth sx={{ mt: 2 }}>Back to login</Button>
    </Box>
  );
}

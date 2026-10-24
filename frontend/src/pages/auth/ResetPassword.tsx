import { useState, FormEvent, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, TextField, Typography, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import { AppDispatch, RootState } from '../../store';
import { resetPassword, clearError } from '../../store/slices/authSlice';
import { isPasswordPolicySatisfied } from './passwordPolicy';

const passwordPolicyMessage = 'Use 8–128 characters with an uppercase letter, a lowercase letter, and a number.';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const newPasswordMeetsPolicy = isPasswordPolicySatisfied(newPassword);

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
      <Box component="main" sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3 }}>
        <Alert severity="warning">Missing reset token. Use the link from your email.</Alert>
        <Button component={Link} to="/forgot-password" sx={{ mt: 2 }}>Request new link</Button>
      </Box>
    );
  }

  if (done) {
    return (
      <Box component="main" sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3 }}>
        <Alert severity="success">Password has been reset. You can now log in.</Alert>
        <Button component={Link} to="/login" variant="contained" sx={{ mt: 2 }}>Go to login</Button>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ maxWidth: 400, mx: 'auto', mt: 6, p: 3 }}>
      <Typography component="h1" variant="h5" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Lock /> Set new password
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <form method="post" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          id="reset-password-new-password"
          name="newPassword"
          label="New password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          error={newPassword.length > 0 && !newPasswordMeetsPolicy}
          helperText={newPassword.length > 0 && !newPasswordMeetsPolicy ? passwordPolicyMessage : ''}
          sx={{
            mb: 2,
            '& .MuiInputLabel-root': { color: 'text.primary' },
            '& .MuiInputLabel-root.Mui-error': {
              color: (theme) => theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.dark,
            },
            '& .MuiFormHelperText-root.Mui-error': {
              color: (theme) => theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.dark,
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          fullWidth
          id="reset-password-confirm-password"
          name="confirmNewPassword"
          label="Confirm new password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          required
          error={newPassword !== confirmNewPassword && confirmNewPassword.length > 0}
          helperText={newPassword !== confirmNewPassword && confirmNewPassword.length > 0 ? 'Passwords do not match' : ''}
          sx={{
            mb: 2,
            '& .MuiInputLabel-root': { color: 'text.primary' },
            '& .MuiInputLabel-root.Mui-error': {
              color: (theme) => theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.dark,
            },
            '& .MuiFormHelperText-root.Mui-error': {
              color: (theme) => theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.dark,
            },
          }}
        />
        <Button type="submit" variant="contained" fullWidth disabled={isLoading || !newPasswordMeetsPolicy || newPassword !== confirmNewPassword} startIcon={isLoading ? <CircularProgress size={20} /> : null}>
          {isLoading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
      <Button component={Link} to="/login" fullWidth sx={{ mt: 2 }}>Back to login</Button>
    </Box>
  );
}

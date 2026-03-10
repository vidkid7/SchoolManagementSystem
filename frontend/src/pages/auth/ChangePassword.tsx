import { useState, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, TextField, Typography, Alert, CircularProgress, InputAdornment, IconButton, Paper } from '@mui/material';
import { Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { AppDispatch, RootState } from '../../store';
import { changePassword, clearError } from '../../store/slices/authSlice';

export function ChangePassword() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) return;
    dispatch(clearError());
    const result = await dispatch(changePassword({ currentPassword, newPassword, confirmNewPassword }));
    if (changePassword.fulfilled.match(result)) {
      setDone(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  if (done) {
    return (
      <Box sx={{ maxWidth: 440, mx: 'auto', p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Alert severity="success">Your password has been changed.</Alert>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 440, mx: 'auto', p: 3 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Lock /> Change password
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>}
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Current password"
            type={showPasswords ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPasswords(!showPasswords)} edge="end">{showPasswords ? <VisibilityOff /> : <Visibility />}</IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="New password"
            type={showPasswords ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirm new password"
            type={showPasswords ? 'text' : 'password'}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            error={newPassword !== confirmNewPassword && confirmNewPassword.length > 0}
            helperText={newPassword !== confirmNewPassword && confirmNewPassword.length > 0 ? 'Passwords do not match' : ''}
            sx={{ mb: 2 }}
          />
          <Button type="submit" variant="contained" disabled={isLoading || newPassword !== confirmNewPassword} startIcon={isLoading ? <CircularProgress size={20} /> : null}>
            {isLoading ? 'Updating…' : 'Change password'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

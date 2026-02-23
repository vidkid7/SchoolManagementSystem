/**
 * Promote and Transfer Dialogs for Student Management
 * 
 * Handles student promotion to next grade and transfer to different class/section
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Alert,
  Box,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as PromoteIcon,
  SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import apiClient from '../../services/apiClient';
import { useNepaliNumbers } from '../../hooks/useNepaliNumbers';

interface PromoteDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: number;
  currentClass: number;
  studentName: string;
  onSuccess: () => void;
}

export const PromoteDialog = ({ open, onClose, studentId, currentClass, studentName, onSuccess }: PromoteDialogProps) => {
  const theme = useTheme();
  const { formatNumber } = useNepaliNumbers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    academicYearId: 1, // Default to current academic year
    nextClassId: currentClass + 1,
    totalMarks: '',
    obtainedMarks: '',
    percentage: '',
    rank: '',
    remarks: '',
  });

  const nextClass = currentClass + 1;
  const canPromote = currentClass < 12;

  const handlePromote = async () => {
    if (!canPromote) {
      setError('Cannot promote beyond Class 12');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        academicYearId: formData.academicYearId,
        nextClassId: formData.nextClassId,
        academicData: {
          totalMarks: formData.totalMarks ? parseFloat(formData.totalMarks) : undefined,
          obtainedMarks: formData.obtainedMarks ? parseFloat(formData.obtainedMarks) : undefined,
          percentage: formData.percentage ? parseFloat(formData.percentage) : undefined,
          rank: formData.rank ? parseInt(formData.rank) : undefined,
        },
        remarks: formData.remarks || undefined,
      };

      await apiClient.post(`/api/v1/students/${studentId}/promote`, payload);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to promote student:', err);
      setError(err.response?.data?.message || 'Failed to promote student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 2, 
            bgcolor: alpha(theme.palette.success.main, 0.1),
            display: 'flex',
          }}>
            <PromoteIcon sx={{ color: 'success.main' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Promote Student</Typography>
            <Typography variant="caption" color="text.secondary">
              {studentName}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!canPromote && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Student is in Class 12. Cannot promote beyond this grade.
          </Alert>
        )}

        <Box sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2, 
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Current Class</Typography>
              <Chip 
                label={`Class ${formatNumber(currentClass)}`}
                sx={{ 
                  mt: 0.5,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main,
                  fontWeight: 700,
                }}
              />
            </Box>
            <PromoteIcon sx={{ fontSize: 32, color: 'success.main' }} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Next Class</Typography>
              <Chip 
                label={`Class ${formatNumber(nextClass)}`}
                sx={{ 
                  mt: 0.5,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  fontWeight: 700,
                }}
              />
            </Box>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Academic Performance (Optional)
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Total Marks"
              type="number"
              fullWidth
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
              disabled={!canPromote}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Obtained Marks"
              type="number"
              fullWidth
              value={formData.obtainedMarks}
              onChange={(e) => setFormData({ ...formData, obtainedMarks: e.target.value })}
              disabled={!canPromote}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Percentage"
              type="number"
              fullWidth
              value={formData.percentage}
              onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
              disabled={!canPromote}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Rank"
              type="number"
              fullWidth
              value={formData.rank}
              onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
              disabled={!canPromote}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Remarks"
              multiline
              rows={3}
              fullWidth
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              disabled={!canPromote}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handlePromote}
          disabled={loading || !canPromote}
          startIcon={<PromoteIcon />}
        >
          {loading ? 'Promoting...' : 'Promote Student'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: number;
  currentClass: number;
  currentSection: string;
  studentName: string;
  onSuccess: () => void;
}

export const TransferDialog = ({ open, onClose, studentId, currentClass, currentSection, studentName, onSuccess }: TransferDialogProps) => {
  const theme = useTheme();
  const { formatNumber } = useNepaliNumbers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    newClassId: currentClass,
    newSection: currentSection,
    newRollNumber: '',
    reason: '',
    transferType: 'internal', // internal or external
  });

  const handleTransfer = async () => {
    if (!formData.reason) {
      setError('Please provide a reason for transfer');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        newClassId: formData.newClassId,
        newSection: formData.newSection,
        newRollNumber: formData.newRollNumber ? parseInt(formData.newRollNumber) : undefined,
        reason: formData.reason,
        transferType: formData.transferType,
      };

      await apiClient.post(`/api/v1/students/${studentId}/transfer`, payload);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to transfer student:', err);
      setError(err.response?.data?.message || 'Failed to transfer student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 2, 
            bgcolor: alpha(theme.palette.info.main, 0.1),
            display: 'flex',
          }}>
            <TransferIcon sx={{ color: 'info.main' }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700}>Transfer Student</Typography>
            <Typography variant="caption" color="text.secondary">
              {studentName}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2, 
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Current Assignment
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip 
              label={`Class ${formatNumber(currentClass)}`}
              size="small"
              sx={{ 
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                fontWeight: 600,
              }}
            />
            <Chip 
              label={`Section ${currentSection}`}
              size="small"
              sx={{ 
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Transfer Type</InputLabel>
              <Select
                value={formData.transferType}
                label="Transfer Type"
                onChange={(e) => setFormData({ ...formData, transferType: e.target.value })}
              >
                <MenuItem value="internal">Internal (Within School)</MenuItem>
                <MenuItem value="external">External (To Another School)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formData.transferType === 'internal' && (
            <>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>New Class</InputLabel>
                  <Select
                    value={formData.newClassId}
                    label="New Class"
                    onChange={(e) => setFormData({ ...formData, newClassId: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                      <MenuItem key={cls} value={cls}>
                        Class {formatNumber(cls)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>New Section</InputLabel>
                  <Select
                    value={formData.newSection}
                    label="New Section"
                    onChange={(e) => setFormData({ ...formData, newSection: e.target.value })}
                  >
                    {['A', 'B', 'C'].map((sec) => (
                      <MenuItem key={sec} value={sec}>
                        Section {sec}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="New Roll Number (Optional)"
                  type="number"
                  fullWidth
                  value={formData.newRollNumber}
                  onChange={(e) => setFormData({ ...formData, newRollNumber: e.target.value })}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <TextField
              label="Reason for Transfer *"
              multiline
              rows={4}
              fullWidth
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              helperText="Please provide a detailed reason for the transfer"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="info"
          onClick={handleTransfer}
          disabled={loading || !formData.reason}
          startIcon={<TransferIcon />}
        >
          {loading ? 'Transferring...' : 'Transfer Student'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

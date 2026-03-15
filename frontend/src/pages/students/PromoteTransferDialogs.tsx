/**
 * Promote and Transfer Dialogs for Student Management
 * 
 * Handles student promotion to next grade and transfer to different class/section
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(t('students.promote.cannotPromote'));
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
      setError(err.response?.data?.message || t('students.promote.failed'));
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
            <Typography variant="h6" fontWeight={700}>{t('students.promote.title')}</Typography>
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
            {t('students.promote.cannotPromoteWarning')}
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
              <Typography variant="caption" color="text.secondary">{t('students.promote.currentClass')}</Typography>
              <Chip 
                label={`${t('students.class')} ${formatNumber(currentClass)}`}
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
              <Typography variant="caption" color="text.secondary">{t('students.promote.nextClass')}</Typography>
              <Chip 
                label={`${t('students.class')} ${formatNumber(nextClass)}`}
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
              {t('students.promote.academicPerformance')}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('students.promote.totalMarks')}
              type="number"
              fullWidth
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
              disabled={!canPromote}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('students.promote.obtainedMarks')}
              type="number"
              fullWidth
              value={formData.obtainedMarks}
              onChange={(e) => setFormData({ ...formData, obtainedMarks: e.target.value })}
              disabled={!canPromote}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('students.promote.percentage')}
              type="number"
              fullWidth
              value={formData.percentage}
              onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
              disabled={!canPromote}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label={t('students.promote.rank')}
              type="number"
              fullWidth
              value={formData.rank}
              onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
              disabled={!canPromote}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={t('students.promote.remarks')}
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
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handlePromote}
          disabled={loading || !canPromote}
          startIcon={<PromoteIcon />}
        >
          {loading ? t('students.promote.promoting') : t('students.promote.promoteButton')}
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
  const { t } = useTranslation();
  const { formatNumber } = useNepaliNumbers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Validate and sanitize initial values
  const validClass = currentClass >= 1 && currentClass <= 12 ? currentClass : 1;
  const validSection = ['A', 'B', 'C'].includes(currentSection) ? currentSection : 'A';
  
  const [formData, setFormData] = useState({
    newClassId: validClass,
    newSection: validSection,
    newRollNumber: '',
    reason: '',
    transferType: 'internal', // internal or external
  });

  const handleTransfer = async () => {
    if (!formData.reason) {
      setError(t('students.transfer.reasonRequired'));
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
      setError(err.response?.data?.message || t('students.transfer.failed'));
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
            <Typography variant="h6" fontWeight={700}>{t('students.transfer.title')}</Typography>
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
            {t('students.transfer.currentAssignment')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip 
              label={`${t('students.class')} ${formatNumber(currentClass)}`}
              size="small"
              sx={{ 
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                fontWeight: 600,
              }}
            />
            <Chip 
              label={`${t('students.section')} ${currentSection}`}
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
              <InputLabel>{t('students.transfer.transferType')}</InputLabel>
              <Select
                value={formData.transferType}
                label={t('students.transfer.transferType')}
                onChange={(e) => setFormData({ ...formData, transferType: e.target.value })}
              >
                <MenuItem value="internal">{t('students.transfer.internal')}</MenuItem>
                <MenuItem value="external">{t('students.transfer.external')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formData.transferType === 'internal' && (
            <>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('students.transfer.newClass')}</InputLabel>
                  <Select
                    value={formData.newClassId}
                    label={t('students.transfer.newClass')}
                    onChange={(e) => setFormData({ ...formData, newClassId: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => (
                      <MenuItem key={cls} value={cls}>
                        {t('students.class')} {formatNumber(cls)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>{t('students.transfer.newSection')}</InputLabel>
                  <Select
                    value={formData.newSection}
                    label={t('students.transfer.newSection')}
                    onChange={(e) => setFormData({ ...formData, newSection: e.target.value })}
                  >
                    {['A', 'B', 'C'].map((sec) => (
                      <MenuItem key={sec} value={sec}>
                        {t('students.section')} {sec}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={t('students.transfer.newRollNumber')}
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
              label={t('students.transfer.reason')}
              multiline
              rows={4}
              fullWidth
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              helperText={t('students.transfer.reasonHelper')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          color="info"
          onClick={handleTransfer}
          disabled={loading || !formData.reason}
          startIcon={<TransferIcon />}
        >
          {loading ? t('students.transfer.transferring') : t('students.transfer.transferButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

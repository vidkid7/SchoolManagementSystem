/**
 * Promote and Transfer Dialogs for Student Management
 * 
 * Handles student promotion to next grade and transfer to different class/section
 */

import { useEffect, useState } from 'react';
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
import { useAdminStyles } from '../../theme/designTokens';

const getApiErrorMessage = (error: unknown): string | undefined => {
  if (typeof error !== 'object' || error === null) return undefined;
  return (error as { response?: { data?: { message?: string } } }).response?.data?.message;
};

interface PromoteDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: number;
  currentClass: number;
  studentName: string;
  onSuccess: () => void;
}

interface AcademicClass {
  classId: number;
  gradeLevel: number;
  section: string;
  academicYearId: number;
}

interface PromotionContext {
  currentGradeLevel: number;
  academicYearId: number;
  nextClassId: number;
}

export const PromoteDialog = ({ open, onClose, studentId, currentClass, studentName, onSuccess }: PromoteDialogProps) => {
  const theme = useTheme();
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const { formatNumber } = useNepaliNumbers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promotionContext, setPromotionContext] = useState<PromotionContext | null>(null);
  const [formData, setFormData] = useState({
    totalMarks: '',
    rank: '',
    remarks: '',
  });

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const loadPromotionContext = async () => {
      setLoading(true);
      setError('');
      setPromotionContext(null);
      try {
        const [classesResponse, yearsResponse] = await Promise.all([
          apiClient.get('/api/v1/academic/classes'),
          apiClient.get('/api/v1/academic/years'),
        ]);
        const classes = (classesResponse.data?.data ?? []) as AcademicClass[];
        const years = yearsResponse.data?.data ?? [];
        const currentYear = years.find((year: { isCurrent?: boolean }) => year.isCurrent);
        const currentClassRecord = classes.find((item) => Number(item.classId) === Number(currentClass));

        if (!currentYear || !currentClassRecord) {
          throw new Error('Promotion context is unavailable');
        }

        const academicYearId = Number(currentYear.academicYearId);
        const nextGradeLevel = Number(currentClassRecord.gradeLevel) + 1;
        const nextClass = classes.find((item) =>
          Number(item.academicYearId) === academicYearId
          && Number(item.gradeLevel) === nextGradeLevel
          && item.section === currentClassRecord.section,
        ) ?? classes.find((item) =>
          Number(item.academicYearId) === academicYearId
          && Number(item.gradeLevel) === nextGradeLevel,
        );

        if (!nextClass) throw new Error('Next class is unavailable for the current academic year');
        if (!cancelled) {
          setPromotionContext({
            currentGradeLevel: Number(currentClassRecord.gradeLevel),
            academicYearId,
            nextClassId: Number(nextClass.classId),
          });
        }
      } catch {
        if (!cancelled) setError(t('students.promote.failed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPromotionContext();
    return () => { cancelled = true; };
  }, [open, currentClass, t]);

  const currentGradeLevel = promotionContext?.currentGradeLevel;
  const nextClass = currentGradeLevel == null ? null : currentGradeLevel + 1;
  const canPromote = currentGradeLevel != null && currentGradeLevel < 12 && promotionContext != null;

  const handlePromote = async () => {
    if (!canPromote) {
      setError(t('students.promote.cannotPromote'));
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        academicYearId: promotionContext.academicYearId,
        nextClassId: promotionContext.nextClassId,
        currentClassId: Number(currentClass),
        currentGradeLevel: promotionContext.currentGradeLevel,
        totalMarks: formData.totalMarks ? parseFloat(formData.totalMarks) : undefined,
        rank: formData.rank ? parseInt(formData.rank, 10) : undefined,
        remarks: formData.remarks || undefined,
      };

      await apiClient.post(`/api/v1/students/${studentId}/promote`, payload);
      
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to promote student:', err);
      setError(getApiErrorMessage(err) || t('students.promote.failed'));
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
                label={`${t('students.class')} ${currentGradeLevel == null ? '—' : formatNumber(currentGradeLevel)}`}
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
                label={`${t('students.class')} ${nextClass == null ? '—' : formatNumber(nextClass)}`}
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
          variant="contained" sx={S.BTN_PRIMARY}
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
  const S = useAdminStyles(theme);
  const { t } = useTranslation();
  const { formatNumber } = useNepaliNumbers();
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    newClassId: '',
    newRollNumber: '',
    reason: '',
  });

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const loadClasses = async () => {
      setClassesLoading(true);
      setError('');
      setClasses([]);
      setCurrentAcademicYearId(null);
      try {
        const yearsResponse = await apiClient.get('/api/v1/academic/years');
        const currentYear = (yearsResponse.data?.data ?? []).find((year: { isCurrent?: boolean }) => year.isCurrent);
        if (!currentYear) throw new Error('Current academic year is unavailable');
        const classesResponse = await apiClient.get('/api/v1/academic/classes');
        if (!cancelled) {
          setCurrentAcademicYearId(Number(currentYear.academicYearId));
          setClasses((classesResponse.data?.data ?? []) as AcademicClass[]);
        }
      } catch {
        if (!cancelled) setError(t('students.transfer.failed'));
      } finally {
        if (!cancelled) setClassesLoading(false);
      }
    };

    loadClasses();
    return () => { cancelled = true; };
  }, [open, t]);

  const currentClassRecord = classes.find((item) => Number(item.classId) === Number(currentClass));
  const parsedRollNumber = formData.newRollNumber.trim() ? Number(formData.newRollNumber) : undefined;
  const rollNumberError = parsedRollNumber !== undefined
    && (!Number.isInteger(parsedRollNumber) || parsedRollNumber < 1)
    ? t('students.transfer.invalidRollNumber')
    : '';

  const handleTransfer = async () => {
    if (!formData.newClassId) {
      setError(t('students.transfer.reasonRequired'));
      return;
    }
    if (!formData.reason.trim()) {
      setError(t('students.transfer.reasonRequired'));
      return;
    }
    if (rollNumberError) {
      setError(rollNumberError);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        newClassId: Number(formData.newClassId),
        newRollNumber: parsedRollNumber,
        reason: formData.reason.trim(),
      };

      await apiClient.post(`/api/v1/students/${studentId}/transfer`, payload);
      
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to transfer student:', err);
      setError(getApiErrorMessage(err) || t('students.transfer.failed'));
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
              label={currentClassRecord
                ? `${t('students.class')} ${formatNumber(currentClassRecord.gradeLevel)}`
                : `${t('students.class')} ${formatNumber(currentClass)}`}
              size="small"
              sx={{ 
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                fontWeight: 600,
              }}
            />
            <Chip 
              label={`${t('students.section')} ${currentClassRecord?.section ?? currentSection}`}
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
            <FormControl fullWidth disabled={classesLoading || classes.length === 0}>
              <InputLabel id="transfer-class-label">{t('students.transfer.newClass')}</InputLabel>
              <Select
                labelId="transfer-class-label"
                value={formData.newClassId}
                label={t('students.transfer.newClass')}
                onChange={(e) => setFormData({ ...formData, newClassId: String(e.target.value) })}
              >
                {classes.filter((item) =>
                  Number(item.academicYearId) === currentAcademicYearId
                  && Number(item.classId) !== Number(currentClass),
                ).map((item) => (
                  <MenuItem key={item.classId} value={String(item.classId)}>
                    {t('students.class')} {formatNumber(item.gradeLevel)} — {t('students.section')} {item.section}
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
              error={Boolean(rollNumberError)}
              helperText={rollNumberError || undefined}
              inputProps={{ min: 1, step: 1 }}
              onChange={(e) => setFormData({ ...formData, newRollNumber: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label={t('students.transfer.reason')}
              multiline
              rows={4}
              fullWidth
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              inputProps={{ maxLength: 500 }}
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
          variant="contained" sx={S.BTN_PRIMARY}
          color="info"
          onClick={handleTransfer}
          disabled={loading || classesLoading || !formData.newClassId || !formData.reason.trim() || Boolean(rollNumberError)}
          startIcon={<TransferIcon />}
        >
          {loading ? t('students.transfer.transferring') : t('students.transfer.transferButton')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

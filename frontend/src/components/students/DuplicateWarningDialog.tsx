/**
 * Duplicate Warning Dialog Component
 * 
 * Shows potential duplicate students before creating a new student
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Alert,
  alpha,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface DuplicateScore {
  student: {
    studentId: number;
    studentCode: string;
    firstNameEn: string;
    lastNameEn: string;
    photoUrl?: string;
    phone?: string;
    class?: {
      gradeLevel: number;
      section: string;
    };
  };
  nameScore: number;
  dobScore: number;
  guardianScore: number;
  addressScore: number;
  overallScore: number;
  isDuplicate: boolean;
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
}

interface DuplicateWarningDialogProps {
  open: boolean;
  duplicates: DuplicateScore[];
  onClose: () => void;
  onProceed: () => void;
}

const CONFIDENCE_CONFIG = {
  high: { color: '#ef4444', bg: '#fef2f2', label: 'High Risk' },
  medium: { color: '#f59e0b', bg: '#fffbeb', label: 'Medium Risk' },
  low: { color: '#3b82f6', bg: '#eff6ff', label: 'Low Risk' },
};

export const DuplicateWarningDialog = ({
  open,
  duplicates,
  onClose,
  onProceed,
}: DuplicateWarningDialogProps) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const highConfidence = duplicates.filter(d => d.confidence === 'high');
  const mediumConfidence = duplicates.filter(d => d.confidence === 'medium');
  const lowConfidence = duplicates.filter(d => d.confidence === 'low');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: `0 20px 60px ${alpha('#000', 0.3)}`,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha('#f59e0b', 0.1),
            color: '#f59e0b',
          }}>
            <WarningIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {t('students.duplicateWarning') || 'Potential Duplicate Detected'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {duplicates.length} {t('students.similarStudentsFound') || 'similar student(s) found'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2">
            {t('students.duplicateMessage') || 
              'We found students with similar information. Please review before proceeding to avoid duplicate entries.'}
          </Typography>
        </Alert>

        {highConfidence.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} color="error" sx={{ mb: 1 }}>
              {t('students.highConfidence') || 'High Confidence Matches'}
            </Typography>
            <List sx={{ bgcolor: alpha('#ef4444', 0.05), borderRadius: 2, p: 1 }}>
              {highConfidence.map((dup) => (
                <ListItem
                  key={dup.student.studentId}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: 'background.paper',
                    border: `2px solid ${alpha('#ef4444', 0.2)}`,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={dup.student.photoUrl} sx={{ bgcolor: alpha('#ef4444', 0.1) }}>
                      <PersonIcon sx={{ color: '#ef4444' }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {dup.student.firstNameEn} {dup.student.lastNameEn}
                        </Typography>
                        <Chip
                          label={`${Math.round(dup.overallScore * 100)}% match`}
                          size="small"
                          sx={{
                            bgcolor: CONFIDENCE_CONFIG[dup.confidence].bg,
                            color: CONFIDENCE_CONFIG[dup.confidence].color,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {dup.student.studentCode} • {dup.student.class ? 
                            `Class ${dup.student.class.gradeLevel}-${dup.student.class.section}` : 
                            'No class assigned'}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {dup.reasons.map((reason, idx) => (
                            <Chip
                              key={idx}
                              label={reason}
                              size="small"
                              sx={{
                                mr: 0.5,
                                mt: 0.5,
                                fontSize: '0.65rem',
                                height: 20,
                                bgcolor: alpha('#ef4444', 0.1),
                                color: '#ef4444',
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {mediumConfidence.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} color="warning.main" sx={{ mb: 1 }}>
              {t('students.mediumConfidence') || 'Medium Confidence Matches'}
            </Typography>
            <List sx={{ bgcolor: alpha('#f59e0b', 0.05), borderRadius: 2, p: 1 }}>
              {mediumConfidence.map((dup) => (
                <ListItem
                  key={dup.student.studentId}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: 'background.paper',
                    border: `1px solid ${alpha('#f59e0b', 0.2)}`,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={dup.student.photoUrl} sx={{ bgcolor: alpha('#f59e0b', 0.1) }}>
                      <PersonIcon sx={{ color: '#f59e0b' }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {dup.student.firstNameEn} {dup.student.lastNameEn}
                        </Typography>
                        <Chip
                          label={`${Math.round(dup.overallScore * 100)}% match`}
                          size="small"
                          sx={{
                            bgcolor: CONFIDENCE_CONFIG[dup.confidence].bg,
                            color: CONFIDENCE_CONFIG[dup.confidence].color,
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {dup.student.studentCode}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          {dup.reasons.map((reason, idx) => (
                            <Chip
                              key={idx}
                              label={reason}
                              size="small"
                              sx={{
                                mr: 0.5,
                                mt: 0.5,
                                fontSize: '0.65rem',
                                height: 20,
                                bgcolor: alpha('#f59e0b', 0.1),
                                color: '#f59e0b',
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {lowConfidence.length > 0 && (
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="info.main" sx={{ mb: 1 }}>
              {t('students.lowConfidence') || 'Low Confidence Matches'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {lowConfidence.length} {t('students.otherPossibleMatches') || 'other possible match(es)'}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          {t('common.cancel') || 'Cancel'}
        </Button>
        <Button
          onClick={onProceed}
          variant="contained"
          color={highConfidence.length > 0 ? 'error' : 'warning'}
          startIcon={<CheckIcon />}
          sx={{
            borderRadius: 2,
            px: 3,
          }}
        >
          {t('students.proceedAnyway') || 'Proceed Anyway'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

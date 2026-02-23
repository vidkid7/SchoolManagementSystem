/**
 * Siblings List Component
 * 
 * Displays potential siblings based on guardian phone matching
 */

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Paper,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  FamilyRestroom as FamilyIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Sibling {
  studentId: number;
  studentCode: string;
  firstNameEn: string;
  lastNameEn: string;
  photoUrl?: string;
  class?: {
    gradeLevel: number;
    section: string;
  };
  status: string;
}

interface SiblingsListProps {
  siblings: Sibling[];
  loading?: boolean;
}

export const SiblingsList = ({ siblings, loading }: SiblingsListProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {t('common.loading') || 'Loading...'}
        </Typography>
      </Paper>
    );
  }

  if (siblings.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          textAlign: 'center',
        }}
      >
        <FamilyIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {t('students.noSiblingsFound') || 'No siblings found'}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <FamilyIcon sx={{ color: theme.palette.primary.main }} />
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {t('students.potentialSiblings') || 'Potential Siblings'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {siblings.length} {t('students.siblingsFound') || 'sibling(s) found with same guardian phone'}
          </Typography>
        </Box>
      </Box>

      <List sx={{ p: 1 }}>
        {siblings.map((sibling) => (
          <ListItem
            key={sibling.studentId}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
            secondaryAction={
              <Tooltip title={t('common.view') || 'View'}>
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => navigate(`/students/${sibling.studentId}`)}
                  sx={{
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                  }}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          >
            <ListItemAvatar>
              <Avatar
                src={sibling.photoUrl}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <PersonIcon sx={{ color: theme.palette.primary.main }} />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight={600}>
                    {sibling.firstNameEn} {sibling.lastNameEn}
                  </Typography>
                  {sibling.status === 'active' && (
                    <Chip
                      label={t('students.active') || 'Active'}
                      size="small"
                      sx={{
                        bgcolor: alpha('#10b981', 0.1),
                        color: '#10b981',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        height: 20,
                      }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {sibling.studentCode}
                  </Typography>
                  {sibling.class && (
                    <Chip
                      label={`Class ${sibling.class.gradeLevel}-${sibling.class.section}`}
                      size="small"
                      sx={{
                        ml: 1,
                        fontSize: '0.65rem',
                        height: 20,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      }}
                    />
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

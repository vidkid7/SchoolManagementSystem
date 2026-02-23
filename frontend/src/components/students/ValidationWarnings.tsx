/**
 * Validation Warnings Component
 * 
 * Displays validation errors and warnings for student data
 */

import {
  Alert,
  AlertTitle,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Typography,
  alpha,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ValidationWarningsProps {
  validation: ValidationResult | null;
  sx?: any;
}

export const ValidationWarnings = ({ validation, sx }: ValidationWarningsProps) => {
  const { t } = useTranslation();
  const [errorsExpanded, setErrorsExpanded] = useState(true);
  const [warningsExpanded, setWarningsExpanded] = useState(true);

  if (!validation || (validation.errors.length === 0 && validation.warnings.length === 0)) {
    return null;
  }

  return (
    <Box sx={sx}>
      {/* Errors */}
      {validation.errors.length > 0 && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            borderRadius: 2,
            border: `1px solid ${alpha('#ef4444', 0.3)}`,
          }}
          action={
            <IconButton
              size="small"
              onClick={() => setErrorsExpanded(!errorsExpanded)}
            >
              {errorsExpanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          }
        >
          <AlertTitle sx={{ fontWeight: 700 }}>
            {t('validation.errors') || 'Validation Errors'} ({validation.errors.length})
          </AlertTitle>
          <Collapse in={errorsExpanded}>
            <List dense sx={{ mt: 1 }}>
              {validation.errors.map((error, index) => (
                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <ErrorIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="error.dark">
                        {error}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Alert>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            borderRadius: 2,
            border: `1px solid ${alpha('#f59e0b', 0.3)}`,
          }}
          action={
            <IconButton
              size="small"
              onClick={() => setWarningsExpanded(!warningsExpanded)}
            >
              {warningsExpanded ? <CollapseIcon /> : <ExpandIcon />}
            </IconButton>
          }
        >
          <AlertTitle sx={{ fontWeight: 700 }}>
            {t('validation.warnings') || 'Validation Warnings'} ({validation.warnings.length})
          </AlertTitle>
          <Collapse in={warningsExpanded}>
            <List dense sx={{ mt: 1 }}>
              {validation.warnings.map((warning, index) => (
                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <WarningIcon fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="warning.dark">
                        {warning}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Alert>
      )}
    </Box>
  );
};

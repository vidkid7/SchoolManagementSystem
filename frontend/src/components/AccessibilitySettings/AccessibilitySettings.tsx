/**
 * Accessibility Settings Component
 * 
 * Provides UI controls for accessibility features
 * Requirements: 34.5, 34.6, 34.7
 */

import React from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  FormControlLabel,
  Switch,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TextIncrease,
  TextDecrease,
  RestartAlt,
  Keyboard,
  Contrast,
} from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useTranslation } from 'react-i18next';

interface AccessibilitySettingsProps {
  compact?: boolean;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ compact = false }) => {
  const {
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    keyboardNavigationEnabled,
    setKeyboardNavigationEnabled,
    highContrastMode,
    setHighContrastMode,
  } = useAccessibility();

  const { t } = useTranslation();

  if (compact) {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Tooltip title={t('accessibility.decreaseFontSize', 'Decrease Font Size')}>
          <span>
            <IconButton
              onClick={decreaseFontSize}
              disabled={fontSize === 'small'}
              size="small"
              aria-label="Decrease font size"
            >
              <TextDecrease />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('accessibility.increaseFontSize', 'Increase Font Size')}>
          <span>
            <IconButton
              onClick={increaseFontSize}
              disabled={fontSize === 'large'}
              size="small"
              aria-label="Increase font size"
            >
              <TextIncrease />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t('accessibility.resetFontSize', 'Reset Font Size')}>
          <IconButton onClick={resetFontSize} size="small" aria-label="Reset font size">
            <RestartAlt />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('accessibility.title', 'Accessibility Settings')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('accessibility.description', 'Customize your experience for better accessibility')}
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Font Size Control */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('accessibility.fontSize', 'Font Size')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('accessibility.fontSizeDescription', 'Adjust text size for better readability')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <ButtonGroup variant="outlined" aria-label="Font size selection">
            <Button
              onClick={() => setFontSize('small')}
              variant={fontSize === 'small' ? 'contained' : 'outlined'}
              aria-pressed={fontSize === 'small'}
            >
              {t('accessibility.small', 'Small')}
            </Button>
            <Button
              onClick={() => setFontSize('normal')}
              variant={fontSize === 'normal' ? 'contained' : 'outlined'}
              aria-pressed={fontSize === 'normal'}
            >
              {t('accessibility.normal', 'Normal')}
            </Button>
            <Button
              onClick={() => setFontSize('large')}
              variant={fontSize === 'large' ? 'contained' : 'outlined'}
              aria-pressed={fontSize === 'large'}
            >
              {t('accessibility.large', 'Large')}
            </Button>
          </ButtonGroup>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={t('accessibility.decreaseFontSize', 'Decrease Font Size (Ctrl/Cmd + -)')}>
              <span>
                <IconButton
                  onClick={decreaseFontSize}
                  disabled={fontSize === 'small'}
                  aria-label="Decrease font size"
                >
                  <TextDecrease />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t('accessibility.increaseFontSize', 'Increase Font Size (Ctrl/Cmd + +)')}>
              <span>
                <IconButton
                  onClick={increaseFontSize}
                  disabled={fontSize === 'large'}
                  aria-label="Increase font size"
                >
                  <TextIncrease />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t('accessibility.resetFontSize', 'Reset Font Size (Ctrl/Cmd + 0)')}>
              <IconButton onClick={resetFontSize} aria-label="Reset font size">
                <RestartAlt />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Keyboard Navigation */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={keyboardNavigationEnabled}
              onChange={(e) => setKeyboardNavigationEnabled(e.target.checked)}
              inputProps={{ 'aria-label': 'Enable keyboard navigation shortcuts' }}
            />
          }
          label={
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Keyboard fontSize="small" />
                <Typography variant="subtitle1">
                  {t('accessibility.keyboardNavigation', 'Keyboard Navigation')}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t(
                  'accessibility.keyboardNavigationDescription',
                  'Enable keyboard shortcuts for navigation and actions'
                )}
              </Typography>
            </Box>
          }
        />
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* High Contrast Mode */}
      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={highContrastMode}
              onChange={(e) => setHighContrastMode(e.target.checked)}
              inputProps={{ 'aria-label': 'Enable high contrast mode' }}
            />
          }
          label={
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Contrast fontSize="small" />
                <Typography variant="subtitle1">
                  {t('accessibility.highContrast', 'High Contrast Mode')}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t(
                  'accessibility.highContrastDescription',
                  'Increase color contrast for better visibility'
                )}
              </Typography>
            </Box>
          }
        />
      </Box>

      {/* Keyboard Shortcuts Help */}
      {keyboardNavigationEnabled && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('accessibility.keyboardShortcuts', 'Keyboard Shortcuts')}
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                <strong>Ctrl/Cmd + +</strong>: {t('accessibility.increaseFontSize', 'Increase font size')}
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                <strong>Ctrl/Cmd + -</strong>: {t('accessibility.decreaseFontSize', 'Decrease font size')}
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                <strong>Ctrl/Cmd + 0</strong>: {t('accessibility.resetFontSize', 'Reset font size')}
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                <strong>Tab</strong>: {t('accessibility.navigateForward', 'Navigate forward')}
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                <strong>Shift + Tab</strong>: {t('accessibility.navigateBackward', 'Navigate backward')}
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default AccessibilitySettings;

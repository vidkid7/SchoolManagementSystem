/**
 * Theme Toggle Component
 * 
 * Provides a button to toggle between light and dark themes
 * Requirements: 34.1, 34.2
 */

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

const ThemeToggle: React.FC = () => {
  const { mode, toggleMode } = useTheme();
  const { t } = useTranslation();

  return (
    <Tooltip
      title={
        mode === 'light'
          ? t('theme.switchToDark', 'Switch to Dark Mode')
          : t('theme.switchToLight', 'Switch to Light Mode')
      }
    >
      <IconButton onClick={toggleMode} color="inherit" aria-label="Toggle theme">
        {mode === 'light' ? <DarkMode /> : <LightMode />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;

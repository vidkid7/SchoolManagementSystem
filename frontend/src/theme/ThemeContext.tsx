/**
 * Theme Context and Provider
 * 
 * Provides theme management with light/dark mode toggle and persistence
 * Requirements: 34.1, 34.2, 34.3
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from './themeConfig';

interface ThemeContextType {
  mode: PaletteMode;
  toggleMode: () => void;
  setMode: (mode: PaletteMode) => void;
  primaryColor: string;
  secondaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: PaletteMode;
  defaultPrimaryColor?: string;
  defaultSecondaryColor?: string;
  disableAnimations?: boolean;
  highContrast?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'light',
  defaultPrimaryColor = '#1976d2',
  defaultSecondaryColor = '#dc004e',
  disableAnimations = false,
  highContrast: defaultHighContrast = false,
}) => {
  // Load saved preferences from localStorage (Requirement 34.3)
  const [mode, setMode] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem('sms_theme_mode');
    if (saved === 'dark' || saved === 'light') return saved;

    // Check system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return defaultMode;
  });

  const [primaryColor, setPrimaryColor] = useState(
    () => localStorage.getItem('sms_primary_color') || defaultPrimaryColor
  );

  const [secondaryColor, setSecondaryColor] = useState(
    () => localStorage.getItem('sms_secondary_color') || defaultSecondaryColor
  );

  const [highContrast, setHighContrast] = useState(
    () => {
      const saved = localStorage.getItem('sms_high_contrast');
      return saved === 'true' || defaultHighContrast;
    }
  );

  // Save preferences to localStorage (Requirement 34.3)
  useEffect(() => {
    localStorage.setItem('sms_theme_mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('sms_primary_color', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    localStorage.setItem('sms_secondary_color', secondaryColor);
  }, [secondaryColor]);

  useEffect(() => {
    localStorage.setItem('sms_high_contrast', String(highContrast));
  }, [highContrast]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set a preference
      if (!localStorage.getItem('sms_theme_mode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Toggle between light and dark mode (Requirement 34.2)
  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Memoize theme to prevent unnecessary re-renders
  const theme = useMemo(
    () => createAppTheme(mode, { primaryColor, secondaryColor }, disableAnimations, highContrast),
    [mode, primaryColor, secondaryColor, disableAnimations, highContrast]
  );

  const contextValue: ThemeContextType = {
    mode,
    toggleMode,
    setMode,
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    setSecondaryColor,
    highContrast,
    setHighContrast,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

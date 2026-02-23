/**
 * Theme Configuration
 * 
 * iOS-inspired Liquid Glass Design for the School Management System
 * Features: Glassmorphism, smooth animations, elegant blur effects
 */

import { createTheme, ThemeOptions, PaletteMode } from '@mui/material';

export interface SchoolTheme {
  primaryColor: string;
  secondaryColor: string;
}

const liquidGlassShadows = {
  light: {
    subtle: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
    medium: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
    elevated: '0 16px 48px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06)',
    glow: (color: string) => `0 0 40px ${color}20, 0 0 80px ${color}10`,
  },
  dark: {
    subtle: '0 2px 8px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)',
    medium: '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)',
    elevated: '0 16px 48px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.4)',
    glow: (color: string) => `0 0 40px ${color}30, 0 0 80px ${color}15`,
  },
};

const getBaseTheme = (): ThemeOptions => ({
  typography: {
    fontFamily: [
      'SF Pro Display',
      'SF Pro Text',
      'Inter',
      'Noto Sans Devanagari',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 700, letterSpacing: '-0.03em', fontSize: '2.5rem' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em', fontSize: '2rem' },
    h3: { fontWeight: 600, letterSpacing: '-0.015em', fontSize: '1.5rem' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1.25rem' },
    h5: { fontWeight: 600, letterSpacing: '-0.005em', fontSize: '1.1rem' },
    h6: { fontWeight: 600, letterSpacing: 0, fontSize: '1rem' },
    body1: { letterSpacing: '0.01em', lineHeight: 1.6 },
    body2: { letterSpacing: '0.01em', lineHeight: 1.5 },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(128, 128, 128, 0.3) transparent',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(128, 128, 128, 0.3)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(128, 128, 128, 0.5)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 14,
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: liquidGlassShadows.light.medium,
          borderRadius: 24,
          backgroundImage: 'none',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 24,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 10,
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
  },
});

// Light mode palette - iOS-inspired with warm undertones
const getLightPalette = (): ThemeOptions => ({
  palette: {
    mode: 'light',
    primary: {
      main: '#007AFF', // iOS Blue
      light: '#5AC8FA',
      dark: '#0051D5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#5856D6', // iOS Purple
      light: '#AF52DE',
      dark: '#3A38B1',
    },
    background: {
      default: '#F2F2F7', // iOS System Gray 6
      paper: 'rgba(255, 255, 255, 0.72)', // Liquid glass
    },
    text: {
      primary: '#1C1C1E', // iOS Label
      secondary: '#8E8E93', // iOS Secondary Label
    },
    success: {
      main: '#34C759', // iOS Green
      light: '#30D158',
      dark: '#248A3D',
    },
    warning: {
      main: '#FF9500', // iOS Orange
      light: '#FFCC00',
      dark: '#C93400',
    },
    error: {
      main: '#FF3B30', // iOS Red
      light: '#FF453A',
      dark: '#D70015',
    },
    info: {
      main: '#007AFF', // iOS Blue
      light: '#5AC8FA',
      dark: '#0051D5',
    },
    divider: 'rgba(60, 60, 67, 0.12)',
    action: {
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(0, 122, 255, 0.12)',
      disabled: 'rgba(0, 0, 0, 0.26)',
    },
  },
});

// Dark mode palette - iOS-inspired OLED-friendly
const getDarkPalette = (): ThemeOptions => ({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0A84FF', // iOS Blue (Dark)
      light: '#64D2FF',
      dark: '#0040DD',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#5E5CE6', // iOS Purple (Dark)
      light: '#BF5AF2',
      dark: '#4636C8',
    },
    background: {
      default: '#000000', // True black for OLED
      paper: 'rgba(28, 28, 30, 0.72)', // Liquid glass dark
    },
    text: {
      primary: '#FFFFFF', // iOS Label
      secondary: '#8E8E93', // iOS Secondary Label
    },
    success: {
      main: '#30D158', // iOS Green (Dark)
      light: '#32FF6A',
      dark: '#1B7F3D',
    },
    warning: {
      main: '#FF9F0A', // iOS Orange (Dark)
      light: '#FFD60A',
      dark: '#A65D00',
    },
    error: {
      main: '#FF453A', // iOS Red (Dark)
      light: '#FF6961',
      dark: '#C41C1C',
    },
    info: {
      main: '#64D2FF', // iOS Cyan (Dark)
      light: '#70D7FF',
      dark: '#0055B3',
    },
    action: {
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(10, 132, 255, 0.24)',
      disabled: 'rgba(255, 255, 255, 0.3)',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
});

// High contrast palette for accessibility (Requirement 34.6)
const getHighContrastPalette = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#000000' : '#ffffff',
      contrastText: mode === 'light' ? '#ffffff' : '#000000',
    },
    secondary: {
      main: mode === 'light' ? '#0066cc' : '#66b3ff',
    },
    background: {
      default: mode === 'light' ? '#ffffff' : '#000000',
      paper: mode === 'light' ? '#ffffff' : '#1a1a1a',
    },
    text: {
      primary: mode === 'light' ? '#000000' : '#ffffff',
      secondary: mode === 'light' ? '#333333' : '#cccccc',
    },
    success: {
      main: mode === 'light' ? '#006600' : '#00cc00',
    },
    warning: {
      main: mode === 'light' ? '#cc6600' : '#ff9933',
    },
    error: {
      main: mode === 'light' ? '#cc0000' : '#ff3333',
    },
    info: {
      main: mode === 'light' ? '#0066cc' : '#3399ff',
    },
  },
});

// Create theme based on mode and school configuration
export const createAppTheme = (
  mode: PaletteMode,
  schoolTheme: SchoolTheme,
  disableAnimations = false,
  highContrast = false
) => {
  const paletteTheme = highContrast
    ? getHighContrastPalette(mode)
    : mode === 'dark'
    ? getDarkPalette()
    : getLightPalette();

  const baseTheme = getBaseTheme();
  const shadows = mode === 'dark' ? liquidGlassShadows.dark : liquidGlassShadows.light;

  // Enhanced glassmorphic styles - iOS Liquid Glass Design
  const glassmorphismComponents = {
    components: {
      ...baseTheme.components,
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: shadows.medium,
            borderRadius: 24,
            backgroundImage: 'none',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            backgroundColor: mode === 'dark' 
              ? 'rgba(28, 28, 30, 0.72)' 
              : 'rgba(255, 255, 255, 0.72)',
            border: mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.08)' 
              : '1px solid rgba(255, 255, 255, 0.5)',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: shadows.elevated,
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          rounded: {
            borderRadius: 24,
          },
          elevation1: {
            boxShadow: shadows.medium,
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            backgroundColor: mode === 'dark' 
              ? 'rgba(28, 28, 30, 0.72)' 
              : 'rgba(255, 255, 255, 0.72)',
            border: mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.08)' 
              : '1px solid rgba(255, 255, 255, 0.5)',
          },
          elevation2: {
            boxShadow: shadows.elevated,
            backdropFilter: 'blur(50px) saturate(200%)',
            WebkitBackdropFilter: 'blur(50px) saturate(200%)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28,
            backdropFilter: 'blur(50px) saturate(200%)',
            WebkitBackdropFilter: 'blur(50px) saturate(200%)',
            backgroundColor: mode === 'dark' 
              ? 'rgba(44, 44, 46, 0.85)' 
              : 'rgba(255, 255, 255, 0.88)',
            border: mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.12)' 
              : '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: shadows.elevated,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backdropFilter: 'blur(50px) saturate(180%)',
            WebkitBackdropFilter: 'blur(50px) saturate(180%)',
            backgroundColor: mode === 'dark' 
              ? 'rgba(28, 28, 30, 0.88)' 
              : 'rgba(255, 255, 255, 0.88)',
            borderRight: mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.08)' 
              : '1px solid rgba(255, 255, 255, 0.5)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          },
          contained: {
            boxShadow: shadows.subtle,
            '&:hover': {
              boxShadow: shadows.medium,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            backgroundColor: mode === 'dark' 
              ? 'rgba(28, 28, 30, 0.72)' 
              : 'rgba(255, 255, 255, 0.72)',
            borderBottom: mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.08)' 
              : '1px solid rgba(255, 255, 255, 0.5)',
          },
        },
      },
    },
  };

  const theme = createTheme({
    ...baseTheme,
    ...paletteTheme,
    ...glassmorphismComponents,
    shadows: mode === 'dark' 
      ? [
          'none',
          shadows.subtle,
          shadows.subtle,
          shadows.medium,
          shadows.medium,
          shadows.medium,
          shadows.medium,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
        ]
      : [
          'none',
          shadows.subtle,
          shadows.subtle,
          shadows.medium,
          shadows.medium,
          shadows.medium,
          shadows.medium,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
          shadows.elevated,
        ],
  });

  // Apply animation disabling if needed
  if (disableAnimations) {
    return createTheme({
      ...theme,
      transitions: {
        ...theme.transitions,
        create: () => 'none',
      },
      components: {
        ...theme.components,
        MuiCssBaseline: {
          styleOverrides: {
            '*, *::before, *::after': {
              transition: 'none !important',
              animation: 'none !important',
            },
          },
        },
      },
    });
  }

  return theme;
};

export default createAppTheme;

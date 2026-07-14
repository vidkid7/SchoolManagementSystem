/**
 * Theme Configuration
 * 
 * Modern glassmorphic design with rectangular boxes + slight round corners.
 * Features: Frosted glass surfaces, smooth animations, elegant blur effects.
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
    borderRadius: 12, // Rectangular with slight rounding (was 16)
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
          borderRadius: 8,   // Rectangular + slight rounding (was 14)
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            transform: 'translateY(-1px)',
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
          borderRadius: 12,   // Rectangular + slight rounding (was 24)
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
          borderRadius: 12,   // Rectangular + slight rounding (was 24)
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
            borderRadius: 8,   // Rectangular + slight rounding (was 14)
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 6,   // Slight rounding (was 10)
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
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          backdropFilter: 'blur(12px)',
        },
      },
    },
  },
});

// Light mode palette - aligned with the dashboard design system
const getLightPalette = (): ThemeOptions => ({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Brand blue (matches dashboard)
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed', // Brand purple (matches dashboard)
      light: '#a855f7',
      dark: '#6d28d9',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f3f7fc', // Matches dashboard shell background
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Slate 900
      secondary: '#64748b', // Slate 500
    },
    success: {
      main: '#16a34a',
      light: '#22c55e',
      dark: '#15803d',
    },
    warning: {
      main: '#f97316',
      light: '#fb923c',
      dark: '#c2410c',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
    },
    info: {
      main: '#2563eb',
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    divider: 'rgba(226, 232, 240, 0.92)',
    action: {
      hover: 'rgba(37, 99, 235, 0.05)',
      selected: 'rgba(37, 99, 235, 0.12)',
      disabled: 'rgba(15, 23, 42, 0.26)',
    },
  },
});

// Dark mode palette - aligned with the dashboard design system
const getDarkPalette = (): ThemeOptions => ({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // Brand blue (dark surfaces)
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8b5cf6', // Brand purple (dark surfaces)
      light: '#a78bfa',
      dark: '#6d28d9',
      contrastText: '#ffffff',
    },
    background: {
      default: '#030712', // Matches dashboard dark shell
      paper: '#0f172a',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    success: {
      main: '#22c55e',
      light: '#4ade80',
      dark: '#16a34a',
    },
    warning: {
      main: '#f97316',
      light: '#fb923c',
      dark: '#c2410c',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#b91c1c',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    action: {
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(59, 130, 246, 0.24)',
      disabled: 'rgba(255, 255, 255, 0.3)',
    },
    divider: 'rgba(148, 163, 184, 0.18)',
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

  // Enhanced glassmorphic styles with rectangular + slight round corners
  const glassmorphismComponents = {
    components: {
      ...baseTheme.components,
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: shadows.medium,
            borderRadius: 12,   // Rectangular + slight rounding
            backgroundImage: 'none',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            backgroundColor: mode === 'dark' 
              ? 'rgba(15, 23, 42, 0.78)' 
              : 'rgba(255, 255, 255, 0.82)',
            border: mode === 'dark' 
              ? '1px solid rgba(148, 163, 184, 0.18)' 
              : '1px solid rgba(226, 232, 240, 0.9)',
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
            borderRadius: 12,  // Rectangular + slight rounding
          },
          elevation1: {
            boxShadow: shadows.medium,
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            backgroundColor: mode === 'dark' 
              ? 'rgba(15, 23, 42, 0.78)' 
              : 'rgba(255, 255, 255, 0.82)',
            border: mode === 'dark' 
              ? '1px solid rgba(148, 163, 184, 0.18)' 
              : '1px solid rgba(226, 232, 240, 0.9)',
          },
          elevation2: {
            boxShadow: shadows.elevated,
            backdropFilter: 'blur(50px) saturate(200%)',
            WebkitBackdropFilter: 'blur(50px) saturate(200%)',
          },
        },
      },
      MuiDialog: {
        defaultProps: {
          disableEnforceFocus: true,
          disableAutoFocus: true,
          disableRestoreFocus: true,
          hideBackdrop: false,
          disableScrollLock: true,
        },
        styleOverrides: {
          paper: {
            borderRadius: 16,  // Slightly more for dialogs (was 28)
            backdropFilter: 'blur(50px) saturate(200%)',
            WebkitBackdropFilter: 'blur(50px) saturate(200%)',
            backgroundColor: mode === 'dark' 
              ? 'rgba(15, 23, 42, 0.92)' 
              : 'rgba(255, 255, 255, 0.92)',
            border: mode === 'dark' 
              ? '1px solid rgba(148, 163, 184, 0.2)' 
              : '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: shadows.elevated,
          },
        },
      },
      MuiModal: {
        defaultProps: {
          disableEnforceFocus: true,
          disableAutoFocus: true,
          disableRestoreFocus: true,
          disableScrollLock: true,
        },
      },
      MuiPopover: {
        defaultProps: {
          disableEnforceFocus: true,
          disableAutoFocus: true,
          disableRestoreFocus: true,
        },
      },
      MuiMenu: {
        defaultProps: {
          disableEnforceFocus: true,
          disableAutoFocus: true,
          disableRestoreFocus: true,
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backdropFilter: 'blur(50px) saturate(180%)',
            WebkitBackdropFilter: 'blur(50px) saturate(180%)',
            backgroundColor: mode === 'dark' 
              ? 'rgba(8, 20, 39, 0.92)' 
              : 'rgba(255, 255, 255, 0.88)',
            borderRight: mode === 'dark' 
              ? '1px solid rgba(148, 163, 184, 0.16)' 
              : '1px solid rgba(226, 232, 240, 0.9)',
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
              ? 'rgba(8, 20, 39, 0.78)' 
              : 'rgba(255, 255, 255, 0.78)',
            borderBottom: mode === 'dark' 
              ? '1px solid rgba(148, 163, 184, 0.16)' 
              : '1px solid rgba(226, 232, 240, 0.9)',
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

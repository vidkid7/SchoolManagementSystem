/**
 * Accountant Portal Design System
 * Professional, minimal design with muted colors and clean aesthetics
 */

import { Theme } from '@mui/material';

export const getAccountantStyles = (theme: Theme) => ({
  // Background liquid glass effects - very subtle
  liquidGlass: {
    position: 'fixed' as const,
    borderRadius: '50%',
    filter: 'blur(120px)',
    zIndex: 0,
    pointerEvents: 'none' as const,
    opacity: 0.3,
  },

  // Glass card - minimal and clean
  glassCard: {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(255,255,255,0.02)' 
      : 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: 2,
    boxShadow: theme.palette.mode === 'dark'
      ? '0 1px 3px rgba(0,0,0,0.2)'
      : '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: theme.palette.mode === 'dark'
        ? '0 2px 8px rgba(0,0,0,0.3)'
        : '0 2px 8px rgba(0,0,0,0.08)',
    },
  },

  // Glass card elevated
  glassCardElevated: {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(255,255,255,0.03)' 
      : 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 2,
    boxShadow: theme.palette.mode === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.3)'
      : '0 2px 8px rgba(0,0,0,0.08)',
  },

  // Stat card - minimal with subtle accent
  statCard: (accentColor: string) => ({
    background: theme.palette.mode === 'dark' 
      ? 'rgba(255,255,255,0.02)' 
      : 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: 2,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'all 0.2s ease',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    '&::before': {
      content: '""',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      height: '2px',
      background: accentColor,
      opacity: 0.6,
    },
    '&:hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
  }),

  // Button - primary action (minimal)
  primaryButton: {
    background: theme.palette.mode === 'dark' ? '#1a1a1a' : '#2c2c2c',
    color: '#ffffff',
    fontWeight: 500,
    textTransform: 'none' as const,
    borderRadius: 1.5,
    px: 3,
    py: 1,
    boxShadow: 'none',
    border: 'none',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: theme.palette.mode === 'dark' ? '#2a2a2a' : '#3c3c3c',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
  },

  // Button - secondary action
  secondaryButton: {
    background: 'transparent',
    color: theme.palette.text.primary,
    fontWeight: 500,
    textTransform: 'none' as const,
    borderRadius: 1.5,
    px: 3,
    py: 1,
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      background: theme.palette.mode === 'dark' 
        ? 'rgba(255,255,255,0.05)' 
        : 'rgba(0,0,0,0.03)',
      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)',
    },
  },

  // Icon button
  iconButton: {
    background: 'transparent',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      background: theme.palette.mode === 'dark' 
        ? 'rgba(255,255,255,0.05)' 
        : 'rgba(0,0,0,0.03)',
      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)'},
  },

  // Table styles
  table: {
    container: {
      background: 'transparent',
      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
      borderRadius: 2,
    },
    header: {
      background: theme.palette.mode === 'dark' 
        ? 'rgba(255,255,255,0.02)' 
        : 'rgba(0,0,0,0.02)',
      color: theme.palette.text.secondary,
      fontWeight: 600,
      fontSize: '0.75rem',
      letterSpacing: '0.03em',
      textTransform: 'uppercase' as const,
      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
    },
    cell: {
      color: theme.palette.text.primary,
      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'}`,
    },
    row: {
      transition: 'background 0.15s ease',
      '&:hover': {
        background: theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.02)' 
          : 'rgba(0,0,0,0.015)'},
    },
  },

  // Input field
  textField: {
    '& .MuiOutlinedInput-root': {
      background: theme.palette.mode === 'dark' 
        ? 'rgba(255,255,255,0.02)' 
        : 'rgba(255,255,255,0.5)',
      borderRadius: 1.5,
      '& fieldset': {
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)',
        transition: 'all 0.2s ease',
      },
      '&:hover fieldset': {
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)'},
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)',
        borderWidth: 1,
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
      '&.Mui-focused': {
        color: theme.palette.text.primary,
      },
    },
  },

  // Muted professional color palette
  colors: {
    primary: '#2c2c2c',
    success: '#4a5568',
    warning: '#6b7280',
    error: '#8b5a5a',
    info: '#4a5568',
    purple: '#6b7280',
    gray: '#9ca3af',
    background: '#fafafa',
  },

  // Status badge - minimal
  statusBadge: (status: string) => {
    const colors: Record<string, { fg: string; bg: string }> = {
      paid: { fg: '#4a5568', bg: 'rgba(74,85,104,0.08)' },
      completed: { fg: '#4a5568', bg: 'rgba(74,85,104,0.08)' },
      active: { fg: '#4a5568', bg: 'rgba(74,85,104,0.08)' },
      partial: { fg: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
      pending: { fg: '#9ca3af', bg: 'rgba(156,163,175,0.08)' },
      overdue: { fg: '#8b5a5a', bg: 'rgba(139,90,90,0.08)' },
      failed: { fg: '#8b5a5a', bg: 'rgba(139,90,90,0.08)' },
      refunded: { fg: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
      cancelled: { fg: '#9ca3af', bg: 'rgba(156,163,175,0.08)' },
      inactive: { fg: '#9ca3af', bg: 'rgba(156,163,175,0.08)' },
    };
    const c = colors[status?.toLowerCase()] ?? { fg: '#9ca3af', bg: 'rgba(156,163,175,0.08)' };
    return {
      color: c.fg,
      background: c.bg,
      border: `1px solid ${c.fg}20`,
      fontWeight: 500,
      fontSize: '0.7rem',
      height: 22,
      borderRadius: 1,
      px: 1.5,
    };
  },

  // Section header
  sectionHeader: {
    color: theme.palette.text.secondary,
    fontWeight: 600,
    fontSize: '0.7rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    mb: 2,
    opacity: 0.7,
  },

  // Avatar - minimal
  avatarGradient: (color1: string, color2: string) => ({
    background: theme.palette.mode === 'dark' ? '#2c2c2c' : '#3c3c3c',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  }),

  // Page container
  pageContainer: (theme: any) => ({
    minHeight: '100vh',
    p: 3,
    position: 'relative' as const,
    background: theme.palette.mode === 'dark' 
      ? '#0a0a0a' 
      : '#fafafa',
  }),
});

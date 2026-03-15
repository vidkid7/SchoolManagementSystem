/**
 * Shared Design Token System
 * 
 * Unified glassmorphic design tokens used across ALL admin panels and portals.
 * Design language: Rectangular boxes with slight round corners + frosted glass.
 * 
 * Import `C` for color primitives and `useAdminStyles(theme)` for pre-built sx objects.
 * 
 * Usage:
 *   import { C, useAdminStyles, RADIUS } from '../../theme/designTokens';
 *   const theme = useTheme();
 *   const S = useAdminStyles(theme);
 *   // Then use: S.GLASS, S.BTN_PRIMARY, S.TD, etc.
 */

// ─── Border Radius Scale (rectangular with slight rounding) ─────────────────
export const RADIUS = {
  xs:   '4px',     // chips, badges
  sm:   '8px',     // buttons, inputs, small cards
  md:   '12px',    // cards, panels, containers
  lg:   '16px',    // dialogs, modals, large panels
  xl:   '20px',    // hero sections, splash elements
  pill: '9999px',  // avatar, fully rounded elements
} as const;

// MUI sx-friendly numeric scale (theme.spacing multiplier)
export const R = {
  xs:   0.5,  // 4px
  sm:   1,    // 8px
  md:   1.5,  // 12px
  lg:   2,    // 16px
  xl:   2.5,  // 20px
} as const;

// ─── Semantic Color Palette ──────────────────────────────────────────────────
export const C = {
  // Brand / Primary
  primary:    '#007AFF',
  purple:     '#5856D6',

  // Semantic
  success:    '#34C759',
  warning:    '#FF9500',
  danger:     '#FF3B30',
  neutral:    '#8E8E93',
  info:       '#5AC8FA',

  // Tinted backgrounds (12% opacity)
  primaryBg:  'rgba(0,122,255,0.12)',
  purpleBg:   'rgba(88,86,214,0.12)',
  successBg:  'rgba(52,199,89,0.12)',
  warningBg:  'rgba(255,149,0,0.12)',
  dangerBg:   'rgba(255,59,48,0.12)',
  neutralBg:  'rgba(142,142,147,0.12)',
  infoBg:     'rgba(90,200,250,0.12)',

  // Tinted borders (25% opacity)
  primaryBdr: 'rgba(0,122,255,0.25)',
  purpleBdr:  'rgba(88,86,214,0.25)',
  successBdr: 'rgba(52,199,89,0.25)',
  warningBdr: 'rgba(255,149,0,0.25)',
  dangerBdr:  'rgba(255,59,48,0.25)',
  neutralBdr: 'rgba(142,142,147,0.25)',
  infoBdr:    'rgba(90,200,250,0.25)',
};

// ─── Status → semantic color mapper ────────────────────────────────────────
export const STATUS_COLORS: Record<string, { fg: string; bg: string; border: string }> = {
  // Generic states
  active:    { fg: C.success,  bg: C.successBg,  border: C.successBdr },
  inactive:  { fg: C.neutral,  bg: C.neutralBg,  border: C.neutralBdr },
  pending:   { fg: C.warning,  bg: C.warningBg,  border: C.warningBdr },
  cancelled: { fg: C.neutral,  bg: C.neutralBg,  border: C.neutralBdr },
  failed:    { fg: C.danger,   bg: C.dangerBg,   border: C.dangerBdr  },

  // Finance
  paid:      { fg: C.success,  bg: C.successBg,  border: C.successBdr },
  overdue:   { fg: C.danger,   bg: C.dangerBg,   border: C.dangerBdr  },
  partial:   { fg: C.primary,  bg: C.primaryBg,  border: C.primaryBdr },
  refunded:  { fg: C.purple,   bg: C.purpleBg,   border: C.purpleBdr  },
  unpaid:    { fg: C.warning,  bg: C.warningBg,  border: C.warningBdr },
  completed: { fg: C.success,  bg: C.successBg,  border: C.successBdr },

  // Staff
  on_leave:  { fg: C.warning,  bg: C.warningBg,  border: C.warningBdr },
  on_duty:   { fg: C.success,  bg: C.successBg,  border: C.successBdr },

  // Students
  transferred:{ fg: C.info,    bg: C.infoBg,     border: C.infoBdr    },
  graduated:  { fg: C.purple,  bg: C.purpleBg,   border: C.purpleBdr  },
  suspended:  { fg: C.danger,  bg: C.dangerBg,   border: C.dangerBdr  },

  // Admissions
  inquiry:   { fg: C.info,     bg: C.infoBg,     border: C.infoBdr    },
  applied:   { fg: C.primary,  bg: C.primaryBg,  border: C.primaryBdr },
  admitted:  { fg: C.success,  bg: C.successBg,  border: C.successBdr },
  enrolled:  { fg: C.purple,   bg: C.purpleBg,   border: C.purpleBdr  },
  rejected:  { fg: C.danger,   bg: C.dangerBg,   border: C.dangerBdr  },
  waitlisted:{ fg: C.neutral,  bg: C.neutralBg,  border: C.neutralBdr },

  // Audit actions
  create:    { fg: C.success,  bg: C.successBg,  border: C.successBdr },
  update:    { fg: C.info,     bg: C.infoBg,     border: C.infoBdr    },
  delete:    { fg: C.danger,   bg: C.dangerBg,   border: C.dangerBdr  },
  restore:   { fg: C.warning,  bg: C.warningBg,  border: C.warningBdr },
};

export function getStatusColor(status: string) {
  return STATUS_COLORS[status?.toLowerCase()] ?? { fg: C.neutral, bg: C.neutralBg, border: C.neutralBdr };
}

// ─── Theme-aware sx style objects ────────────────────────────────────────────
export const useAdminStyles = (theme: any) => {
  const dark = theme.palette.mode === 'dark';

  // Core glassmorphic surface — rectangular with slight round corners
  const GLASS_BASE = {
    background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)'}`,
    borderRadius: R.md,  // 12px — rectangular with slight rounding
    boxShadow: dark
      ? '0 4px 20px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05) inset'
      : '0 4px 20px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return {
    // Glass surface variants
    GLASS: GLASS_BASE,
    GLASS_ELEVATED: {
      ...GLASS_BASE,
      background: dark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.88)',
      boxShadow: dark
        ? '0 8px 32px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.08) inset'
        : '0 8px 32px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset',
    },
    GLASS_HEADER: {
      ...GLASS_BASE,
      background: dark
        ? 'linear-gradient(135deg, rgba(0,122,255,0.1) 0%, rgba(88,86,214,0.08) 100%)'
        : 'linear-gradient(135deg, rgba(0,122,255,0.08) 0%, rgba(88,86,214,0.06) 100%)',
      borderBottom: `1px solid ${dark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.12)'}`,
    },
    // Subtle card variant — less prominent glass
    GLASS_SUBTLE: {
      ...GLASS_BASE,
      background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
      boxShadow: dark
        ? '0 2px 8px rgba(0,0,0,0.2)'
        : '0 2px 8px rgba(0,0,0,0.04)',
    },

    // Table helpers
    TH_BG: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,122,255,0.04)',
    TD: {
      color: theme.palette.text.primary,
      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    },
    TR_HOVER: {
      '&:hover': {
        background: dark ? 'rgba(0,122,255,0.06)' : 'rgba(0,122,255,0.04)',
      },
    },

    // Button styles — rectangular with slight rounding
    BTN_PRIMARY: {
      background: `linear-gradient(135deg, ${C.primary} 0%, ${C.purple} 100%)`,
      color: '#fff',
      textTransform: 'none' as const,
      fontWeight: 600,
      borderRadius: R.sm,  // 8px
      px: 2.5,
      py: 1,
      boxShadow: `0 4px 14px rgba(0,122,255,0.35)`,
      border: 'none',
      '&:hover': {
        background: `linear-gradient(135deg, #0062CC 0%, #4845AB 100%)`,
        boxShadow: `0 6px 20px rgba(0,122,255,0.45)`,
        transform: 'translateY(-1px)',
      },
      '&:active': { transform: 'translateY(0)' },
      '&.Mui-disabled': {
        background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        color: theme.palette.text.disabled,
        boxShadow: 'none',
      },
    },
    BTN_SUCCESS: {
      background: `linear-gradient(135deg, ${C.success} 0%, #28a745 100%)`,
      color: '#fff',
      textTransform: 'none' as const,
      fontWeight: 600,
      borderRadius: R.sm,
      px: 2.5,
      py: 1,
      boxShadow: `0 4px 14px rgba(52,199,89,0.3)`,
      border: 'none',
      '&:hover': {
        background: `linear-gradient(135deg, #28a745 0%, #1e7e34 100%)`,
        boxShadow: `0 6px 20px rgba(52,199,89,0.4)`,
        transform: 'translateY(-1px)',
      },
    },
    BTN_DANGER: {
      background: `linear-gradient(135deg, ${C.danger} 0%, #cc1f15 100%)`,
      color: '#fff',
      textTransform: 'none' as const,
      fontWeight: 600,
      borderRadius: R.sm,
      px: 2.5,
      py: 1,
      boxShadow: `0 4px 14px rgba(255,59,48,0.3)`,
      border: 'none',
      '&:hover': {
        background: `linear-gradient(135deg, #cc1f15 0%, #a8180e 100%)`,
        boxShadow: `0 6px 20px rgba(255,59,48,0.4)`,
        transform: 'translateY(-1px)',
      },
    },
    BTN_WARNING: {
      background: `linear-gradient(135deg, ${C.warning} 0%, #e68600 100%)`,
      color: '#fff',
      textTransform: 'none' as const,
      fontWeight: 600,
      borderRadius: R.sm,
      px: 2.5,
      py: 1,
      boxShadow: `0 4px 14px rgba(255,149,0,0.3)`,
      border: 'none',
      '&:hover': {
        background: `linear-gradient(135deg, #e68600 0%, #cc7700 100%)`,
        boxShadow: `0 6px 20px rgba(255,149,0,0.4)`,
        transform: 'translateY(-1px)',
      },
    },
    BTN_OUTLINE: {
      color: C.primary,
      borderColor: C.primaryBdr,
      textTransform: 'none' as const,
      fontWeight: 600,
      borderRadius: R.sm,
      border: `1px solid ${C.primaryBdr}`,
      '&:hover': { background: C.primaryBg, borderColor: C.primary },
    },
    BTN_GHOST: {
      color: theme.palette.text.secondary,
      textTransform: 'none' as const,
      fontWeight: 500,
      borderRadius: R.sm,
      '&:hover': { background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
    },
    BTN_ICON: {
      borderRadius: R.sm,
      color: theme.palette.text.secondary,
      '&:hover': {
        background: dark ? 'rgba(0,122,255,0.12)' : C.primaryBg,
        color: C.primary,
      },
    },

    // Form field — rectangular with slight rounding
    TF: {
      '& .MuiOutlinedInput-root': {
        color: theme.palette.text.primary,
        borderRadius: R.sm,  // 8px
        '& fieldset': { borderColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' },
        '&:hover fieldset': { borderColor: C.primary },
        '&.Mui-focused fieldset': { borderColor: C.primary },
      },
      '& .MuiInputLabel-root': {
        color: theme.palette.text.secondary,
        '&.Mui-focused': { color: C.primary },
      },
    },

    // Select field — rectangular with slight rounding
    SELECT: {
      borderRadius: R.sm,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: C.primary },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: C.primary },
    },

    // Stat card with left accent border
    STAT_CARD: (accent: string, borderAlpha = 0.25) => ({
      ...GLASS_BASE,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      pl: 0.5,
      border: `1px solid rgba(${hexToRgb(accent)},${borderAlpha})`,
      '&::before': {
        content: '""',
        position: 'absolute' as const,
        top: 0,
        left: 0,
        bottom: 0,
        width: 4,
        background: accent,
        borderRadius: `${RADIUS.md} 0 0 ${RADIUS.md}`,
      },
    }),

    // Icon box — rectangular with slight rounding
    ICON_BOX: (accent: string, size = 40) => ({
      width: size,
      height: size,
      borderRadius: R.sm,  // 8px
      background: `rgba(${hexToRgb(accent)},0.12)`,
      border: `1px solid rgba(${hexToRgb(accent)},0.25)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: accent,
      flexShrink: 0,
    }),

    // Page header / hero area
    PAGE_HEADER: {
      ...GLASS_BASE,
      background: dark
        ? 'linear-gradient(135deg, rgba(0,122,255,0.1) 0%, rgba(88,86,214,0.08) 100%)'
        : 'linear-gradient(135deg, rgba(0,122,255,0.07) 0%, rgba(88,86,214,0.05) 100%)',
      p: 3,
      mb: 3,
    },

    // Section wrapper
    SECTION: {
      ...GLASS_BASE,
      p: 3,
      mb: 3,
    },

    // Tab bar active indicator
    TAB_ACTIVE: {
      color: C.primary,
      '&.Mui-selected': { color: C.primary, fontWeight: 700 },
    },
    TAB_INDICATOR: { backgroundColor: C.primary, height: 3, borderRadius: '3px 3px 0 0' },

    // Badge / chip helper
    CHIP: (accent: string) => ({
      background: `rgba(${hexToRgb(accent)},0.12)`,
      color: accent,
      border: `1px solid rgba(${hexToRgb(accent)},0.25)`,
      borderRadius: R.xs,
      fontWeight: 600,
      fontSize: '0.75rem',
    }),

    // Empty state placeholder
    EMPTY_STATE: {
      textAlign: 'center' as const,
      py: 8,
      color: theme.palette.text.secondary,
    },

    // Divider
    DIVIDER: {
      borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      my: 2,
    },

    dark,
  };
};

// ─── Helper ──────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  // Handle rgba() strings by extracting rgb values
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    const m = hex.match(/[\d.]+/g);
    if (m) return `${m[0]},${m[1]},${m[2]}`;
  }
  // Handle hex
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return `${parseInt(clean[0]+clean[0],16)},${parseInt(clean[1]+clean[1],16)},${parseInt(clean[2]+clean[2],16)}`;
  }
  return `${parseInt(clean.slice(0,2),16)},${parseInt(clean.slice(2,4),16)},${parseInt(clean.slice(4,6),16)}`;
}

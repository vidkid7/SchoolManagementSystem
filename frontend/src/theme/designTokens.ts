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
  // Brand / Primary (aligned with dashboard design system)
  primary:    '#2563eb',
  purple:     '#7c3aed',

  // Semantic
  success:    '#16a34a',
  warning:    '#f97316',
  danger:     '#dc2626',
  neutral:    '#64748b',
  info:       '#0891b2',

  // Tinted backgrounds (12% opacity)
  primaryBg:  'rgba(37,99,235,0.12)',
  purpleBg:   'rgba(124,58,237,0.12)',
  successBg:  'rgba(22,163,74,0.12)',
  warningBg:  'rgba(249,115,22,0.12)',
  dangerBg:   'rgba(220,38,38,0.12)',
  neutralBg:  'rgba(100,116,139,0.12)',
  infoBg:     'rgba(8,145,178,0.12)',

  // Tinted borders (25% opacity)
  primaryBdr: 'rgba(37,99,235,0.25)',
  purpleBdr:  'rgba(124,58,237,0.25)',
  successBdr: 'rgba(22,163,74,0.25)',
  warningBdr: 'rgba(249,115,22,0.25)',
  dangerBdr:  'rgba(220,38,38,0.25)',
  neutralBdr: 'rgba(100,116,139,0.25)',
  infoBdr:    'rgba(8,145,178,0.25)',
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

  // Core dashboard-grade glass surface shared by module pages.
  const GLASS_BASE = {
    background: dark
      ? 'linear-gradient(180deg, rgba(15,23,42,0.84) 0%, rgba(15,23,42,0.64) 100%)'
      : 'linear-gradient(180deg, var(--sms-glass-strong, rgba(255,255,255,0.82)) 0%, var(--sms-glass, rgba(255,255,255,0.68)) 100%)',
    backdropFilter: 'blur(22px) saturate(175%)',
    WebkitBackdropFilter: 'blur(22px) saturate(175%)',
    border: `1px solid ${dark ? 'rgba(148,163,184,0.22)' : 'var(--sms-border, rgba(226,232,240,0.92))'}`,
    borderRadius: RADIUS.md,
    boxShadow: dark
      ? '0 18px 44px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.07)'
      : '0 14px 34px rgba(15,23,42,0.085), inset 0 1px 0 rgba(255,255,255,0.44)',
    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease',
  };

  return {
    // Glass surface variants
    GLASS: GLASS_BASE,
    GLASS_ELEVATED: {
      ...GLASS_BASE,
      background: dark
        ? 'linear-gradient(180deg, rgba(15,23,42,0.92) 0%, rgba(17,28,47,0.72) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.78) 100%)',
      boxShadow: dark
        ? '0 22px 54px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
        : '0 18px 46px rgba(15,23,42,0.105), inset 0 1px 0 rgba(255,255,255,0.52)',
    },
    GLASS_HEADER: {
      ...GLASS_BASE,
      background: dark
        ? 'linear-gradient(135deg, rgba(8,20,39,0.95) 0%, rgba(15,45,83,0.72) 54%, rgba(23,37,84,0.72) 100%)'
        : 'linear-gradient(135deg, rgba(239,246,255,0.96) 0%, rgba(248,250,252,0.88) 52%, rgba(238,242,255,0.88) 100%)',
      border: `1px solid ${dark ? 'rgba(96,165,250,0.2)' : 'rgba(191,219,254,0.86)'}`,
    },
    // Subtle card variant — less prominent glass
    GLASS_SUBTLE: {
      ...GLASS_BASE,
      background: dark
        ? 'linear-gradient(180deg, rgba(17,28,47,0.58) 0%, rgba(15,23,42,0.48) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(248,250,252,0.56) 100%)',
      boxShadow: dark
        ? '0 10px 28px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)'
        : '0 10px 26px rgba(15,23,42,0.055), inset 0 1px 0 rgba(255,255,255,0.4)',
    },

    // Table helpers
    TH_BG: dark ? 'rgba(255,255,255,0.04)' : 'rgba(37,99,235,0.04)',
    TD: {
      color: theme.palette.text.primary,
      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    },
    TR_HOVER: {
      '&:hover': {
        background: dark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)',
      },
    },

    // Button styles — rectangular with slight rounding
    BTN_PRIMARY: {
      background: `linear-gradient(135deg, ${C.primary} 0%, ${C.purple} 100%)`,
      color: '#fff',
      textTransform: 'none' as const,
      fontWeight: 600,
      borderRadius: RADIUS.sm,
      px: 2.5,
      py: 1,
      boxShadow: `0 4px 14px rgba(37,99,235,0.35)`,
      border: 'none',
      '&:hover': {
        background: `linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)`,
        boxShadow: `0 6px 20px rgba(37,99,235,0.45)`,
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
      background: `linear-gradient(135deg, ${C.success} 0%, #15803d 100%)`,
      color: '#fff',
      textTransform: 'none' as const,
      fontWeight: 600,
      borderRadius: RADIUS.sm,
      px: 2.5,
      py: 1,
      boxShadow: `0 4px 14px rgba(22,163,74,0.3)`,
      border: 'none',
      '&:hover': {
        background: `linear-gradient(135deg, #15803d 0%, #166534 100%)`,
        boxShadow: `0 6px 20px rgba(22,163,74,0.4)`,
        transform: 'translateY(-1px)',
      },
    },
    BTN_DANGER: {
      background: `linear-gradient(135deg, ${C.danger} 0%, #b91c1c 100%)`,
      color: '#fff',
      textTransform: 'none' as const,
      fontWeight: 600,
      borderRadius: RADIUS.sm,
      px: 2.5,
      py: 1,
      boxShadow: `0 4px 14px rgba(220,38,38,0.3)`,
      border: 'none',
      '&:hover': {
        background: `linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)`,
        boxShadow: `0 6px 20px rgba(220,38,38,0.4)`,
        transform: 'translateY(-1px)',
      },
    },
    BTN_WARNING: {
      background: `linear-gradient(135deg, ${C.warning} 0%, #c2410c 100%)`,
      color: '#fff',
      textTransform: 'none' as const,
      fontWeight: 600,
      borderRadius: RADIUS.sm,
      px: 2.5,
      py: 1,
      boxShadow: `0 4px 14px rgba(249,115,22,0.3)`,
      border: 'none',
      '&:hover': {
        background: `linear-gradient(135deg, #c2410c 0%, #9a3412 100%)`,
        boxShadow: `0 6px 20px rgba(249,115,22,0.4)`,
        transform: 'translateY(-1px)',
      },
    },
    BTN_OUTLINE: {
      color: C.primary,
      borderColor: C.primaryBdr,
      textTransform: 'none' as const,
      fontWeight: 600,
      borderRadius: RADIUS.sm,
      border: `1px solid ${C.primaryBdr}`,
      '&:hover': { background: C.primaryBg, borderColor: C.primary },
    },
    BTN_GHOST: {
      color: theme.palette.text.secondary,
      textTransform: 'none' as const,
      fontWeight: 500,
      borderRadius: RADIUS.sm,
      '&:hover': { background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
    },
    BTN_ICON: {
      borderRadius: RADIUS.sm,
      color: theme.palette.text.secondary,
      '&:hover': {
        background: dark ? 'rgba(37,99,235,0.16)' : C.primaryBg,
        color: C.primary,
      },
    },

    // Form field — rectangular with slight rounding
    TF: {
      '& .MuiOutlinedInput-root': {
        color: theme.palette.text.primary,
        borderRadius: RADIUS.sm,
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
      borderRadius: RADIUS.sm,
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
      borderRadius: RADIUS.sm,
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
        ? 'linear-gradient(135deg, rgba(8,20,39,0.94) 0%, rgba(15,45,83,0.72) 58%, rgba(23,37,84,0.62) 100%)'
        : 'linear-gradient(135deg, rgba(239,246,255,0.96) 0%, rgba(255,255,255,0.84) 56%, rgba(238,242,255,0.86) 100%)',
      p: { xs: 1.5, md: 2 },
      mb: 1.5,
    },

    // Section wrapper
    SECTION: {
      ...GLASS_BASE,
      p: { xs: 1.5, md: 2 },
      mb: 1.5,
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
      borderRadius: RADIUS.xs,
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

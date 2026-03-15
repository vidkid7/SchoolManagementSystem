/**
 * useSlugNavigate
 *
 * Drop-in replacement for useNavigate that automatically prepends the active
 * municipality slug to every absolute path that isn't a public route.
 *
 * Usage:
 *   import { useSlugNavigate } from '../../hooks/useSlugNavigate';
 *   const navigate = useSlugNavigate();
 *   navigate('/attendance/reports');  // → /KMC/attendance/reports
 *   navigate('/login');               // → /login  (public, unchanged)
 */

import { useNavigate, useParams, type NavigateOptions } from 'react-router-dom';

/** Paths that should never receive a municipality slug prefix */
const PUBLIC_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password', '/unauthorized'];

export function useSlugNavigate() {
  const navigate = useNavigate();
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();

  return (to: string | number, options?: NavigateOptions) => {
    if (
      typeof to === 'string' &&
      to.startsWith('/') &&
      !PUBLIC_PREFIXES.some(p => to.startsWith(p))
    ) {
      return navigate(
        municipalitySlug ? `/${municipalitySlug}${to}` : to,
        options
      );
    }
    // Relative paths, numeric history offsets, and public paths pass through unchanged
    return navigate(to as any, options);
  };
}

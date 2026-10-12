/**
 * useCurrentAcademicYear
 *
 * Central hook for accessing the current academic year.
 * Fetches from GET /academic/years/current and caches the result for 5 minutes.
 * All pages/portals should use this hook instead of implementing their own fetch.
 */

import { useState, useEffect } from 'react';
import api from '../config/api';

export interface AcademicYear {
  academicYearId: number;
  name: string;
  startDateBS: string;
  endDateBS: string;
  startDateAD: string;
  endDateAD: string;
  isCurrent: boolean;
}

interface UseCurrentAcademicYearResult {
  currentYear: AcademicYear | null;
  academicYears: AcademicYear[];
  loading: boolean;
  error: string | null;
  /** Human-readable label, e.g. "AY 2082/83" */
  label: string;
}

// Module-level cache so all hook instances share the same data
let cachedCurrentYear: AcademicYear | null = null;
let cachedAllYears: AcademicYear[] = [];
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function formatLabel(year: AcademicYear | null): string {
  if (!year || typeof year.name !== 'string' || !year.name.trim()) return '';
  // "2081-2082" → "AY 2081/82"
  const parts = year.name.split('-');
  if (parts.length === 2) {
    return `AY ${parts[0]}/${parts[1].slice(2)}`;
  }
  return `AY ${year.name}`;
}

function normalizeAcademicYear(value: unknown): AcademicYear | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<AcademicYear>;
  const academicYearId = Number(candidate.academicYearId);
  if (!Number.isFinite(academicYearId) || academicYearId <= 0) return null;

  const name = typeof candidate.name === 'string' && candidate.name.trim()
    ? candidate.name.trim()
    : `Academic Year ${academicYearId}`;

  return {
    ...candidate,
    academicYearId,
    name,
    startDateBS: typeof candidate.startDateBS === 'string' ? candidate.startDateBS : '',
    endDateBS: typeof candidate.endDateBS === 'string' ? candidate.endDateBS : '',
    startDateAD: typeof candidate.startDateAD === 'string' ? candidate.startDateAD : '',
    endDateAD: typeof candidate.endDateAD === 'string' ? candidate.endDateAD : '',
    isCurrent: Boolean(candidate.isCurrent),
  };
}

export function useCurrentAcademicYear(): UseCurrentAcademicYearResult {
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(cachedCurrentYear);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(cachedAllYears);
  const [loading, setLoading] = useState(!cachedCurrentYear || Date.now() > cacheExpiry);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedCurrentYear && Date.now() < cacheExpiry) {
      setCurrentYear(cachedCurrentYear);
      setAcademicYears(cachedAllYears);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchYear = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current year from dedicated endpoint
        const [currentRes, allRes] = await Promise.all([
          api.get('/academic/years/current'),
          api.get('/academic/years'),
        ]);

        if (cancelled) return;

        const current = normalizeAcademicYear(currentRes.data?.data ?? currentRes.data);
        const allData = allRes.data?.data ?? allRes.data;
        const all = Array.isArray(allData)
          ? allData.map(normalizeAcademicYear).filter((year): year is AcademicYear => year !== null)
          : [];

        cachedCurrentYear = current;
        cachedAllYears = all;
        cacheExpiry = Date.now() + CACHE_TTL_MS;

        setCurrentYear(current);
        setAcademicYears(cachedAllYears);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.response?.data?.message ?? 'Failed to load academic year');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchYear();
    return () => { cancelled = true; };
  }, []);

  return {
    currentYear,
    academicYears,
    loading,
    error,
    label: formatLabel(currentYear),
  };
}

/** Invalidate the cache (call after any academic year change) */
export function invalidateAcademicYearCache(): void {
  cachedCurrentYear = null;
  cachedAllYears = [];
  cacheExpiry = 0;
}

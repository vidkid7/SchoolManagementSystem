export interface FeeComponentAmount {
  amount?: number | string | null;
}

export interface FeeAmountSource {
  amount?: number | string | null;
  totalAmount?: number | string | null;
  feeComponents?: FeeComponentAmount[];
}

/** Prefer the server total, but recover from components when older backend data is stale. */
export function getFeeStructureAmount(fee: FeeAmountSource): number {
  const total = Number(fee.amount ?? fee.totalAmount);
  if (Number.isFinite(total) && total > 0) return total;

  return (fee.feeComponents ?? []).reduce((sum, component) => {
    const amount = Number(component.amount);
    return sum + (Number.isFinite(amount) && amount > 0 ? amount : 0);
  }, 0);
}

export function getAcademicYearDisplayName(
  academicYearId: number,
  years: Array<{ academicYearId: number; name: string }>,
  fallback?: { academicYearId: number; name: string } | null,
): string {
  const year = years.find((candidate) => candidate.academicYearId === academicYearId)
    ?? (fallback?.academicYearId === academicYearId ? fallback : undefined);
  return year ? `AY ${year.name.replace('-', '/')}` : `Academic Year ${academicYearId}`;
}

export function getFeeStructureClassSelection(fee: {
  classId?: number;
  applicableClasses?: number[];
}): string {
  if (fee.classId) return String(fee.classId);
  return fee.applicableClasses?.length === 1 ? String(fee.applicableClasses[0]) : '';
}

export function getApplicableClassesForUpdate(
  originalClasses: number[] | undefined,
  selectedClassId: string,
  selectionChanged: boolean,
): number[] {
  if (!selectionChanged && originalClasses?.length) return originalClasses;
  return selectedClassId ? [Number(selectedClassId)] : Array.from({ length: 12 }, (_, index) => index + 1);
}

type StudentListResponse = {
  meta?: { total?: unknown };
  pagination?: { total?: unknown };
  total?: unknown;
};

export function getStudentCount(response: { data?: StudentListResponse } | null | undefined): number {
  const total = response?.data?.meta?.total ?? response?.data?.pagination?.total ?? response?.data?.total;
  return typeof total === 'number' && Number.isFinite(total) && total >= 0 ? total : 0;
}

export interface DocumentStats {
  total: number;
  active: number;
  expired: number;
  expiringSoon: number;
}

interface DocumentStatsResponse {
  total?: number | string;
  totalDocuments?: number | string;
  active?: number | string;
  expired?: number | string;
  expiredCount?: number | string;
  expiringSoon?: number | string;
  expiringSoonCount?: number | string;
}

const finiteNumber = (value: number | string | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function normalizeDocumentStats(data: DocumentStatsResponse | null | undefined): DocumentStats {
  const total = finiteNumber(data?.totalDocuments ?? data?.total);
  const expired = finiteNumber(data?.expiredCount ?? data?.expired);
  const expiringSoon = finiteNumber(data?.expiringSoonCount ?? data?.expiringSoon);
  const active = data?.active === undefined
    ? Math.max(0, total - expired - expiringSoon)
    : finiteNumber(data.active);

  return { total, active, expired, expiringSoon };
}

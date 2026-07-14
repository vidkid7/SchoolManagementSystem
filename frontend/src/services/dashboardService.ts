import apiClient from './apiClient';
import type { DashboardConfig } from '../dashboards/dashboardConfigs';

type DashboardData = Record<string, unknown>;

function unwrapResponse(payload: any): unknown {
  if (payload?.data?.data !== undefined) return payload.data.data;
  if (payload?.data !== undefined) return payload.data;
  return payload;
}

function normalizeListPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return value;

  const objectValue = value as Record<string, unknown>;
  const listKeys = ['items', 'rows', 'data', 'results', 'records', 'students', 'children', 'payments', 'invoices'];
  for (const key of listKeys) {
    if (Array.isArray(objectValue[key])) {
      return objectValue[key];
    }
  }

  return value;
}

export async function fetchDashboardData(config: DashboardConfig): Promise<DashboardData> {
  if (config.requests?.length) {
    const results = await Promise.allSettled(
      config.requests.map(async (request) => {
        const response = await apiClient.get(request.endpoint);
        return [request.key, normalizeListPayload(unwrapResponse(response))] as const;
      })
    );

    return results.reduce<DashboardData>((acc, result, index) => {
      const request = config.requests![index];
      if (result.status === 'fulfilled') {
        acc[result.value[0]] = result.value[1];
      } else if (!request.optional) {
        throw result.reason;
      } else {
        acc[request.key] = null;
      }
      return acc;
    }, {});
  }

  if (!config.endpoint) return {};

  const response = await apiClient.get(config.endpoint);
  return normalizeListPayload(unwrapResponse(response)) as DashboardData;
}

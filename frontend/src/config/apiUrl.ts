const API_VERSION_PATH = '/api/v1';

const withApiVersion = (apiUrl: string): string => {
  const normalizedUrl = apiUrl.replace(/\/+$/, '');
  return normalizedUrl.endsWith(API_VERSION_PATH)
    ? normalizedUrl
    : `${normalizedUrl}${API_VERSION_PATH}`;
};

export const resolveApiBaseUrl = (
  runtimeApiBaseUrl?: string,
  buildTimeApiBaseUrl?: string,
  buildTimeApiUrl?: string,
): string => {
  const configuredBuildTimeBase = buildTimeApiBaseUrl || (buildTimeApiUrl ? withApiVersion(buildTimeApiUrl) : undefined);

  if (runtimeApiBaseUrl) {
    if (runtimeApiBaseUrl === API_VERSION_PATH && configuredBuildTimeBase) {
      return configuredBuildTimeBase;
    }
    return runtimeApiBaseUrl;
  }

  return configuredBuildTimeBase || `http://localhost:3000${API_VERSION_PATH}`;
};

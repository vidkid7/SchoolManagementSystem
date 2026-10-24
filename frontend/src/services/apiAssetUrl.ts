/** Resolve an API file path against the API host, not the frontend origin. */
export const resolveApiAssetUrlAtOrigin = (
  assetUrl: string,
  apiBaseUrl: string,
  frontendOrigin: string,
): string => {
  const apiOrigin = new URL(apiBaseUrl || frontendOrigin, frontendOrigin).origin;
  return new URL(assetUrl, apiOrigin).toString();
};

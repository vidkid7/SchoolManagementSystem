export const isRoleCodeValid = (code: string): boolean => /^[A-Z_]{3,50}$/.test(code);

export const getApiErrorMessage = (error: any, fallback: string): string => {
  const responseData = error?.response?.data;
  return responseData?.errors?.[0]?.message || responseData?.message || fallback;
};

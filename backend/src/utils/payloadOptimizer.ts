/**
 * Payload Optimizer Utility
 * Minimizes API response payload sizes for low-bandwidth optimization
 * Requirements: 29.7, 29.9
 */

/**
 * Remove null and undefined values from an object
 */
export function removeNullValues<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  
  for (const key in obj) {
    if (obj[key] !== null && obj[key] !== undefined) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        result[key] = removeNullValues(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  }
  
  return result;
}

/**
 * Pick only specified fields from an object
 */
export function pickFields<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  fields: K[]
): Pick<T, K> {
  const result: any = {};
  
  for (const field of fields) {
    if (field in obj) {
      result[field] = obj[field];
    }
  }
  
  return result;
}

/**
 * Omit specified fields from an object
 */
export function omitFields<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  fields: K[]
): Omit<T, K> {
  const result: any = { ...obj };
  
  for (const field of fields) {
    delete result[field];
  }
  
  return result;
}

/**
 * Optimize array of objects by removing common fields
 * Useful for list responses where many objects share the same values
 */
export function optimizeList<T extends Record<string, any>>(
  items: T[],
  commonFields?: (keyof T)[]
): {
  items: Partial<T>[];
  common?: Partial<T>;
} {
  if (items.length === 0) {
    return { items: [] };
  }

  // If no common fields specified, return as is
  if (!commonFields || commonFields.length === 0) {
    return { items };
  }

  // Extract common values
  const common: any = {};
  const firstItem = items[0];
  
  for (const field of commonFields) {
    if (field in firstItem) {
      // Check if all items have the same value for this field
      const allSame = items.every(item => item[field] === firstItem[field]);
      if (allSame) {
        common[field] = firstItem[field];
      }
    }
  }

  // Remove common fields from items
  const optimizedItems = items.map(item => {
    const optimized: any = { ...item };
    for (const field in common) {
      delete optimized[field];
    }
    return optimized;
  });

  return {
    items: optimizedItems,
    common: Object.keys(common).length > 0 ? common : undefined
  };
}

/**
 * Truncate long text fields to reduce payload size
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number = 100
): string | null | undefined {
  if (!text) return text;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Optimize timestamps by converting to ISO strings and removing milliseconds
 */
export function optimizeTimestamp(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Return ISO string without milliseconds
  return dateObj.toISOString().split('.')[0] + 'Z';
}

/**
 * Optimize a response object for low-bandwidth
 */
export function optimizeResponse<T extends Record<string, any>>(
  data: T,
  options?: {
    removeNull?: boolean;
    truncateFields?: { field: keyof T; maxLength: number }[];
    omitFields?: (keyof T)[];
    pickFields?: (keyof T)[];
  }
): Partial<T> {
  let result: any = data;

  // Pick specific fields if specified
  if (options?.pickFields && options.pickFields.length > 0) {
    result = pickFields(result, options.pickFields);
  }

  // Omit specific fields if specified
  if (options?.omitFields && options.omitFields.length > 0) {
    result = omitFields(result, options.omitFields);
  }

  // Truncate long text fields
  if (options?.truncateFields) {
    for (const { field, maxLength } of options.truncateFields) {
      if (field in result && typeof result[field] === 'string') {
        result[field] = truncateText(result[field], maxLength);
      }
    }
  }

  // Remove null values
  if (options?.removeNull) {
    result = removeNullValues(result);
  }

  return result;
}

/**
 * Middleware to optimize API responses
 */
export function payloadOptimizerMiddleware(options?: {
  removeNull?: boolean;
  maxTextLength?: number;
}) {
  return (req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      // Only optimize if client requests it via header
      const optimize = req.headers['x-optimize-payload'] === 'true';
      
      if (optimize && data && typeof data === 'object') {
        if (options?.removeNull) {
          data = removeNullValues(data);
        }
      }

      return originalJson(data);
    };

    next();
  };
}

export default {
  removeNullValues,
  pickFields,
  omitFields,
  optimizeList,
  truncateText,
  optimizeTimestamp,
  optimizeResponse,
  payloadOptimizerMiddleware
};

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Button,
} from '@mui/material';
import { useInfiniteScroll } from '../../hooks/useLazyLoad';

export interface LazyListProps<T> {
  /**
   * Function to fetch items for a given page
   */
  fetchItems: (page: number, pageSize: number) => Promise<{ items: T[]; total: number }>;
  
  /**
   * Function to render each item
   */
  renderItem: (item: T, index: number) => React.ReactNode;
  
  /**
   * Number of items per page (default: 20)
   */
  pageSize?: number;
  
  /**
   * Loading indicator component
   */
  loadingComponent?: React.ReactNode;
  
  /**
   * Empty state component
   */
  emptyComponent?: React.ReactNode;
  
  /**
   * Error component
   */
  errorComponent?: (error: Error, retry: () => void) => React.ReactNode;
  
  /**
   * Container component props
   */
  containerProps?: React.ComponentProps<typeof Box>;
  
  /**
   * Enable infinite scroll (default: true)
   */
  infiniteScroll?: boolean;
}

/**
 * LazyList component with pagination and infinite scroll support
 * 
 * Features:
 * - Lazy loading with pagination
 * - Infinite scroll support
 * - Loading states
 * - Error handling with retry
 * - Empty state
 * 
 * Requirements: 29.6, 29.8
 */
export function LazyList<T>({
  fetchItems,
  renderItem,
  pageSize = 20,
  loadingComponent,
  emptyComponent,
  errorComponent,
  containerProps,
  infiniteScroll = true,
}: LazyListProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchItems(page, pageSize);
      
      setItems((prev) => [...prev, ...result.items]);
      setTotal(result.total);
      setPage((prev) => prev + 1);
      
      // Check if there are more items to load
      const loadedCount = items.length + result.items.length;
      setHasMore(loadedCount < result.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load items'));
    } finally {
      setLoading(false);
    }
  }, [fetchItems, page, pageSize, loading, hasMore, items.length]);

  const retry = useCallback(() => {
    setError(null);
    loadMore();
  }, [loadMore]);

  // Load initial items
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll sentinel
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(
    loadMore,
    infiniteScroll && hasMore && !loading && !error
  );

  // Render loading state
  if (loading && items.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        {loadingComponent || <CircularProgress />}
      </Box>
    );
  }

  // Render error state
  if (error && items.length === 0) {
    if (errorComponent) {
      return <>{errorComponent(error, retry)}</>;
    }
    
    return (
      <Box display="flex" flexDirection="column" alignItems="center" py={4}>
        <Typography color="error" gutterBottom>
          {error.message}
        </Typography>
        <Button onClick={retry} variant="contained" color="primary">
          Retry
        </Button>
      </Box>
    );
  }

  // Render empty state
  if (items.length === 0) {
    return (
      <Box py={4}>
        {emptyComponent || (
          <Typography align="center" color="textSecondary">
            No items found
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box {...containerProps}>
      {/* Render items */}
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}

      {/* Loading more indicator */}
      {loading && items.length > 0 && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Error state for loading more */}
      {error && items.length > 0 && (
        <Box display="flex" flexDirection="column" alignItems="center" py={2}>
          <Typography color="error" variant="body2" gutterBottom>
            {error.message}
          </Typography>
          <Button onClick={retry} size="small" variant="outlined">
            Retry
          </Button>
        </Box>
      )}

      {/* Load more button (when infinite scroll is disabled) */}
      {!infiniteScroll && hasMore && !loading && (
        <Box display="flex" justifyContent="center" py={2}>
          <Button onClick={loadMore} variant="contained">
            Load More
          </Button>
        </Box>
      )}

      {/* End of list message */}
      {!hasMore && items.length > 0 && (
        <Box py={2}>
          <Typography align="center" variant="body2" color="textSecondary">
            Showing all {total} items
          </Typography>
        </Box>
      )}

      {/* Infinite scroll sentinel */}
      {infiniteScroll && hasMore && !loading && !error && (
        <div ref={sentinelRef} style={{ height: '1px' }} />
      )}
    </Box>
  );
}

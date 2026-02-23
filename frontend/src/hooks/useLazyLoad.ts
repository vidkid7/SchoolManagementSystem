import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for lazy loading with Intersection Observer
 * 
 * @param options - IntersectionObserver options
 * @returns Object with ref to attach to element and isInView state
 */
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Once loaded, stop observing
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before element enters viewport
        threshold: 0.01,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return { ref: elementRef, isInView };
}

/**
 * Custom hook for infinite scroll pagination
 * 
 * @param callback - Function to call when reaching the bottom
 * @param hasMore - Whether there are more items to load
 * @returns Ref to attach to the sentinel element
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>(
  callback: () => void,
  hasMore: boolean
) {
  const sentinelRef = useRef<T>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      {
        rootMargin: '100px', // Trigger 100px before reaching the bottom
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [callback, hasMore]);

  return sentinelRef;
}

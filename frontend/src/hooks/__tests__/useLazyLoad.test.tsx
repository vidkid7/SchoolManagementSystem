import { renderHook } from '@testing-library/react';
import { useLazyLoad, useInfiniteScroll } from '../useLazyLoad';

// Mock IntersectionObserver
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

beforeAll(() => {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  })) as any;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useLazyLoad', () => {
  it('should initialize with isInView as false', () => {
    const { result } = renderHook(() => useLazyLoad());
    
    expect(result.current.isInView).toBe(false);
    expect(result.current.ref.current).toBeNull();
  });

  it('should return a ref object', () => {
    const { result } = renderHook(() => useLazyLoad());
    
    expect(result.current.ref).toBeDefined();
    expect(typeof result.current.ref).toBe('object');
  });

  it('should accept custom options', () => {
    const options = {
      rootMargin: '100px',
      threshold: 0.5,
    };
    
    const { result } = renderHook(() => useLazyLoad(options));
    
    expect(result.current.ref).toBeDefined();
    expect(result.current.isInView).toBe(false);
  });
});

describe('useInfiniteScroll', () => {
  it('should return a ref object', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useInfiniteScroll(callback, true));
    
    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe('object');
  });

  it('should accept callback and hasMore parameters', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useInfiniteScroll(callback, true));
    
    expect(result.current).toBeDefined();
  });

  it('should work when hasMore is false', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useInfiniteScroll(callback, false));
    
    expect(result.current).toBeDefined();
  });
});

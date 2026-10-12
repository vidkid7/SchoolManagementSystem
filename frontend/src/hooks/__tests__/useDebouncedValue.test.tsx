import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from '../useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('publishes the latest value only after the debounce interval', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 350), {
      initialProps: { value: '' },
    });

    rerender({ value: 'Codex' });
    act(() => jest.advanceTimersByTime(200));
    rerender({ value: 'Codex Audit' });
    act(() => jest.advanceTimersByTime(349));
    expect(result.current).toBe('');

    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe('Codex Audit');
  });

  it('cancels a pending value when the hook unmounts', () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebouncedValue(value, 350), {
      initialProps: { value: '' },
    });

    rerender({ value: 'student' });
    unmount();
    expect(() => act(() => jest.runOnlyPendingTimers())).not.toThrow();
  });
});

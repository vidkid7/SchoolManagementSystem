import { renderHook, waitFor } from '@testing-library/react';
import api from '../../config/api';
import { invalidateAcademicYearCache, useCurrentAcademicYear } from '../useCurrentAcademicYear';

jest.mock('../../config/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedGet = api.get as jest.MockedFunction<typeof api.get>;

describe('useCurrentAcademicYear', () => {
  beforeEach(() => {
    invalidateAcademicYearCache();
    mockedGet.mockReset();
  });

  it('loads and formats a valid current year', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: { data: { academicYearId: 8, name: '2082-2083 BS', isCurrent: true } } } as any)
      .mockResolvedValueOnce({ data: { data: [{ academicYearId: 8, name: '2082-2083 BS', isCurrent: true }] } } as any);

    const { result } = renderHook(() => useCurrentAcademicYear());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentYear?.academicYearId).toBe(8);
    expect(result.current.label).toBe('AY 2082/83 BS');
    expect(result.current.academicYears).toHaveLength(1);
  });

  it('does not crash when the current-year response has no year payload', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: { success: true, message: 'No current year' } } as any)
      .mockResolvedValueOnce({ data: { data: [] } } as any);

    const { result } = renderHook(() => useCurrentAcademicYear());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentYear).toBeNull();
    expect(result.current.label).toBe('');
  });

  it('provides a safe display name when the server omits the year name', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: { data: { academicYearId: 9, isCurrent: true } } } as any)
      .mockResolvedValueOnce({ data: { data: [{ academicYearId: 9, isCurrent: true }] } } as any);

    const { result } = renderHook(() => useCurrentAcademicYear());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentYear?.name).toBe('Academic Year 9');
    expect(result.current.label).toBe('AY Academic Year 9');
  });
});

import { createReserveBookPayload } from './reserveBookPayload';

describe('createReserveBookPayload', () => {
  it('sends numeric book and student IDs from selected records', () => {
    expect(createReserveBookPayload({ bookId: 12 }, { studentId: 34 })).toEqual({ bookId: 12, studentId: 34 });
  });

  it('rejects invalid IDs', () => {
    expect(() => createReserveBookPayload({ bookId: 0 }, { studentId: 34 })).toThrow('Select a valid unavailable book and student');
    expect(() => createReserveBookPayload({ bookId: 12 }, { studentId: Number.NaN })).toThrow('Select a valid unavailable book and student');
  });
});

import { getStudentCount } from './studentCount';

describe('getStudentCount', () => {
  it('reads the total from the API pagination metadata', () => {
    expect(getStudentCount({ data: { meta: { total: 21 } } })).toBe(21);
  });

  it('supports legacy total shapes and safely defaults invalid values', () => {
    expect(getStudentCount({ data: { pagination: { total: 7 } } })).toBe(7);
    expect(getStudentCount({ data: { total: 3 } })).toBe(3);
    expect(getStudentCount({ data: { meta: { total: '21' } } })).toBe(0);
    expect(getStudentCount(undefined)).toBe(0);
  });
});

import {
  getAcademicYearDisplayName,
  getApplicableClassesForUpdate,
  getFeeStructureAmount,
  getFeeStructureClassSelection,
} from './feeStructureUtils';

describe('feeStructureUtils', () => {
  it('uses component amounts when the backend total is zero or missing', () => {
    expect(getFeeStructureAmount({ totalAmount: '0.00', feeComponents: [{ amount: '100.00' }] })).toBe(100);
    expect(getFeeStructureAmount({ feeComponents: [{ amount: '100' }, { amount: 25 }] })).toBe(125);
  });

  it('prefers a positive server total and ignores invalid component amounts', () => {
    expect(getFeeStructureAmount({ totalAmount: '125.00', feeComponents: [{ amount: 100 }] })).toBe(125);
    expect(getFeeStructureAmount({ totalAmount: 0, feeComponents: [{ amount: 'invalid' }, { amount: -1 }] })).toBe(0);
  });

  it('resolves an academic year id to a readable name', () => {
    const years = [{ academicYearId: 30001, name: '2083-2084 BS' }];
    expect(getAcademicYearDisplayName(30001, years)).toBe('AY 2083/2084 BS');
    expect(getAcademicYearDisplayName(30002, years)).toBe('Academic Year 30002');
  });

  it('does not misrepresent or narrow existing class applicability while editing', () => {
    expect(getFeeStructureClassSelection({ applicableClasses: [1, 2, 3] })).toBe('');
    expect(getFeeStructureClassSelection({ applicableClasses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] })).toBe('');
    expect(getFeeStructureClassSelection({ applicableClasses: [4] })).toBe('4');
    expect(getApplicableClassesForUpdate([1, 2, 3], '', false)).toEqual([1, 2, 3]);
    expect(getApplicableClassesForUpdate([1, 2, 3], '4', true)).toEqual([4]);
    expect(getApplicableClassesForUpdate([4], '', true)).toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
  });
});

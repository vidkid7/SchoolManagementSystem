import { validateEnrollmentForm } from './enrollmentValidation';

describe('validateEnrollmentForm', () => {
  it('requires a positive integer ECA and student id', () => {
    expect(validateEnrollmentForm({})).toEqual({ ecaId: 'required', studentId: 'required' });
    expect(validateEnrollmentForm({ ecaId: '0', studentId: '-1' })).toEqual({
      ecaId: 'positiveInteger',
      studentId: 'positiveInteger',
    });
    expect(validateEnrollmentForm({ ecaId: '1.5', studentId: 'abc' })).toEqual({
      ecaId: 'positiveInteger',
      studentId: 'positiveInteger',
    });
  });

  it('accepts positive integer ids', () => {
    expect(validateEnrollmentForm({ ecaId: '12', studentId: '600001' })).toEqual({});
  });
});

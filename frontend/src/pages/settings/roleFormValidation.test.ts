import { getApiErrorMessage, isRoleCodeValid } from './roleFormValidation';

describe('role form validation', () => {
  it.each(['SCHOOL_ADMIN', 'QA_ROLE', 'A_B'])('accepts a valid role code: %s', (code) => {
    expect(isRoleCodeValid(code)).toBe(true);
  });

  it.each(['', 'QA_ROLE_2026', 'ab', 'ROLE-CODE', 'ROLE CODE', 'A'.repeat(51)])(
    'rejects an invalid role code: %s',
    (code) => expect(isRoleCodeValid(code)).toBe(false),
  );

  it('prefers the first field-level API validation message', () => {
    expect(getApiErrorMessage({
      response: { data: { message: 'Validation failed', errors: [{ message: 'Invalid role code' }] } },
    }, 'Fallback')).toBe('Invalid role code');
  });

  it('falls back to the API message and then the generic message', () => {
    expect(getApiErrorMessage({ response: { data: { message: 'Duplicate role code' } } }, 'Fallback'))
      .toBe('Duplicate role code');
    expect(getApiErrorMessage({}, 'Fallback')).toBe('Fallback');
  });
});

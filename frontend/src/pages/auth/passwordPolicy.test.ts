import { isPasswordPolicySatisfied } from './passwordPolicy';

describe('isPasswordPolicySatisfied', () => {
  it('requires 8 to 128 characters with uppercase, lowercase, and a digit', () => {
    expect(isPasswordPolicySatisfied('Short1A')).toBe(false);
    expect(isPasswordPolicySatisfied('lowercase1')).toBe(false);
    expect(isPasswordPolicySatisfied('UPPERCASE1')).toBe(false);
    expect(isPasswordPolicySatisfied('NoDigitsHere')).toBe(false);
    expect(isPasswordPolicySatisfied('ValidPass1')).toBe(true);
    expect(isPasswordPolicySatisfied(`A1${'a'.repeat(126)}`)).toBe(true);
    expect(isPasswordPolicySatisfied(`A1${'a'.repeat(127)}`)).toBe(false);
  });
});

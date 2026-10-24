export const isPasswordPolicySatisfied = (password: string): boolean =>
  password.length >= 8
  && password.length <= 128
  && /[a-z]/.test(password)
  && /[A-Z]/.test(password)
  && /\d/.test(password);

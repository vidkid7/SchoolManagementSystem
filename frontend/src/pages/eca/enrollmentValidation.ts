export type EnrollmentFormErrors = {
  ecaId?: 'required' | 'positiveInteger';
  studentId?: 'required' | 'positiveInteger';
};

export function validateEnrollmentForm(form: { ecaId?: unknown; studentId?: unknown }): EnrollmentFormErrors {
  const errors: EnrollmentFormErrors = {};
  for (const field of ['ecaId', 'studentId'] as const) {
    const value = String(form[field] ?? '').trim();
    if (!value) {
      errors[field] = 'required';
    } else if (!/^[1-9]\d*$/.test(value)) {
      errors[field] = 'positiveInteger';
    }
  }
  return errors;
}

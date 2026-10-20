import { createGradingSchemeSchema, updateGradingSchemeSchema } from '../systemSettings.validation';

const grade = {
  grade: 'A',
  gradePoint: 4,
  minPercentage: 90,
  maxPercentage: 100,
  description: 'Excellent',
};

describe('grading scheme name validation', () => {
  it.each(['', '   '])('rejects an empty or whitespace-only name (%j)', (name) => {
    const { error } = createGradingSchemeSchema.validate({ name, grades: [grade] });
    expect(error?.message).toContain('Grading scheme name is required');
  });

  it('trims a valid name', () => {
    const { error, value } = createGradingSchemeSchema.validate({ name: '  Custom Scheme  ', grades: [grade] });
    expect(error).toBeUndefined();
    expect(value.name).toBe('Custom Scheme');
  });

  it('rejects whitespace-only names in updates too', () => {
    const { error } = updateGradingSchemeSchema.validate({ name: '   ' });
    expect(error?.message).toContain('Grading scheme name is required');
  });
});

import { listStudentsQuerySchema } from '../student.validation';

describe('student list query validation', () => {
  it('preserves class and section filters when unknown query keys are stripped', () => {
    const { error, value } = listStudentsQuerySchema.validate(
      { class: '1', section: 'K', unrecognized: 'ignored' },
      { stripUnknown: true }
    );

    expect(error).toBeUndefined();
    expect(value).toMatchObject({ class: 1, section: 'K' });
    expect(value.unrecognized).toBeUndefined();
  });

  it('rejects class filters outside the supported grade range', () => {
    const { error } = listStudentsQuerySchema.validate({ class: '13' }, { stripUnknown: true });

    expect(error).toBeDefined();
    expect(error?.details[0].path).toEqual(['class']);
  });
});

import { validateClassForm } from './classFormValidation';

describe('validateClassForm', () => {
  it('requires a valid grade and section before saving', () => {
    expect(validateClassForm({ grade_level: '', section: '', capacity: '' })).toEqual({
      grade_level: 'gradeRequired',
      section: 'sectionRequired',
    });
  });

  it('accepts a valid class and an omitted optional capacity', () => {
    expect(validateClassForm({ grade_level: '12', section: 'K', capacity: '' })).toEqual({});
  });

  it('rejects an out-of-range grade or oversized section', () => {
    expect(validateClassForm({ grade_level: '13', section: 'section-123', capacity: '' })).toEqual({
      grade_level: 'gradeRange',
      section: 'sectionLength',
    });
  });

  it('accepts valid capacity and rejects invalid capacity', () => {
    expect(validateClassForm({ grade_level: '1', section: 'A', capacity: '100' })).toEqual({});
    expect(validateClassForm({ grade_level: '1', section: 'A', capacity: '0' }).capacity).toBe(
      'capacityRange'
    );
  });
});

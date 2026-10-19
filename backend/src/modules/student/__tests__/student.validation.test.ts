import { createStudentSchema, listStudentsQuerySchema, updateStudentSchema } from '../student.validation';

describe('student address validation', () => {
  it('accepts and preserves optional city and district on create', () => {
    const payload = {
      firstNameEn: 'Test', lastNameEn: 'Student', dateOfBirthBS: '2073-01-19', dateOfBirthAD: '2016-05-01',
      gender: 'male', addressEn: 'Test address', fatherName: 'Test Father', fatherPhone: '9801110001',
      motherName: 'Test Mother', motherPhone: '9801110002', emergencyContact: '9801110000',
      admissionDate: '2026-07-17', admissionClass: 1, city: 'Kathmandu', district: 'Kathmandu',
    };
    const { error, value } = createStudentSchema.validate(payload, { stripUnknown: true });

    expect(error).toBeUndefined();
    expect(value).toMatchObject({ city: 'Kathmandu', district: 'Kathmandu' });
  });

  it('accepts and preserves optional city and district on update', () => {
    const { error, value } = updateStudentSchema.validate(
      { city: 'Pokhara', district: 'Kaski' },
      { stripUnknown: true }
    );

    expect(error).toBeUndefined();
    expect(value).toEqual({ city: 'Pokhara', district: 'Kaski' });
  });
});

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

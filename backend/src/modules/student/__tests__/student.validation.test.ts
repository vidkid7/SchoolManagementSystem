import {
  createStudentSchema,
  listStudentsQuerySchema,
  promoteStudentSchema,
  updateStudentSchema,
} from '../student.validation';

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

describe('student create form-to-API contract', () => {
  it('accepts the payload shape emitted by the form, including empty optional values', () => {
    const payload = {
      firstNameEn: 'QA', middleNameEn: null, lastNameEn: 'Student',
      firstNameNp: null, middleNameNp: null, lastNameNp: null,
      dateOfBirthBS: '2073-01-19', dateOfBirthAD: '2016-05-01', gender: 'male', bloodGroup: null,
      addressEn: 'Test Street', addressNp: null, city: '', district: '', phone: null, email: null,
      emergencyContact: '9801110001', admissionDate: '2026-07-17', admissionClass: 1,
      currentClassId: null, rollNumber: null, previousSchool: null,
      fatherName: 'QA Father', fatherPhone: '9801110002', fatherCitizenshipNo: null,
      motherName: 'QA Mother', motherPhone: '9801110003', motherCitizenshipNo: null,
      localGuardianName: null, localGuardianPhone: null, localGuardianRelation: null,
      allergies: null, medicalConditions: null, symbolNumber: null, nebRegistrationNumber: null,
      photoUrl: null, status: 'active',
    };
    const { error, value } = createStudentSchema.validate(payload, { stripUnknown: true });

    expect(error).toBeUndefined();
    expect(value).toMatchObject({
      firstNameEn: 'QA',
      dateOfBirthBS: '2073-01-19',
      dateOfBirthAD: new Date('2016-05-01T00:00:00.000Z'),
      emergencyContact: '9801110001',
      currentClassId: null,
      fatherPhone: '9801110002',
      motherPhone: '9801110003',
    });
    expect(value.photoUrl).toBeUndefined();
    expect(value.status).toBeUndefined();
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

describe('student promotion validation', () => {
  it('accepts the flat promotion payload required by the route and controller', () => {
    const payload = {
      academicYearId: 15,
      nextClassId: 118,
      currentClassId: 63,
      currentGradeLevel: 6,
      totalMarks: 82,
      rank: 3,
      remarks: 'Promoted after annual review',
    };
    const { error, value } = promoteStudentSchema.validate(payload, { stripUnknown: true });

    expect(error).toBeUndefined();
    expect(value).toEqual(payload);
  });

  it('rejects academic fields nested under an unsupported academicData object', () => {
    const { error } = promoteStudentSchema.validate({
      academicYearId: 15,
      nextClassId: 118,
      academicData: { currentClassId: 63, currentGradeLevel: 6 },
    }, { stripUnknown: true, abortEarly: false });

    expect(error).toBeDefined();
    expect(error?.details.map((detail) => detail.path[0])).toEqual(expect.arrayContaining([
      'currentClassId',
      'currentGradeLevel',
    ]));
  });
});

import { createInquirySchema } from '../admission.validation';

describe('createInquirySchema', () => {
  it('accepts and retains all fields collected by the inquiry form', () => {
    const inquiry = {
      firstNameEn: 'QA',
      middleNameEn: 'Admissions',
      lastNameEn: 'Persistence',
      dateOfBirthAD: '2020-01-15',
      gender: 'female',
      addressEn: 'Synthetic QA address',
      applyingForClass: 1,
      phone: '9841234567',
      email: 'qa.persistence@example.com',
      fatherName: 'Synthetic Father',
      fatherPhone: '9841234568',
      motherName: 'Synthetic Mother',
      motherPhone: '9841234569',
      guardianName: 'Synthetic Guardian',
      guardianPhone: '9841234570',
      guardianRelation: 'Parent',
      previousSchool: 'Synthetic QA School',
      previousClass: 1,
      inquirySource: 'online',
      inquiryNotes: 'QA persistence check'
    };

    const { error, value } = createInquirySchema.validate(inquiry, { stripUnknown: true });

    expect(error).toBeUndefined();
    const { dateOfBirthAD, ...remainingFields } = inquiry;
    expect(value).toMatchObject(remainingFields);
    expect(value.dateOfBirthAD).toEqual(new Date(dateOfBirthAD));
  });
});

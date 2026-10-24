import { createSchoolConfigSchema, updateSchoolConfigSchema } from '../config.validation';

const fullSchoolConfig = {
  schoolNameEn: 'Test School',
  schoolNameNp: 'परीक्षण विद्यालय',
  schoolCode: 'TST-001',
  email: 'office@test.example.com',
  phone: '0123456789',
  addressEn: 'Test Street',
  addressNp: 'परीक्षण मार्ग',
  city: 'Kathmandu',
  district: 'Kathmandu',
  province: 'Bagmati Pradesh',
  establishedYear: 2001,
  affiliationNumber: 'AFF-123',
  principalName: 'Test Principal',
  principalNameNp: 'परीक्षण प्रधानाध्यापक',
  primaryColor: '#123456',
  secondaryColor: '#234567',
  accentColor: '#345678',
  defaultLanguage: 'nepali',
  academicYearStartMonth: 7,
};

describe('school configuration validation contract', () => {
  it('accepts and preserves the fields entered by the School Configuration create form', () => {
    const { error, value } = createSchoolConfigSchema.validate(fullSchoolConfig, { stripUnknown: true });

    expect(error).toBeUndefined();
    expect(value).toEqual(fullSchoolConfig);
  });

  it('requires the fields visibly marked as required during configuration creation', () => {
    const { error } = createSchoolConfigSchema.validate({ schoolNameEn: 'Test School' }, { abortEarly: false });

    expect(error?.details.map(({ path }) => path.join('.'))).toEqual(expect.arrayContaining([
      'schoolNameNp', 'schoolCode', 'email', 'phone', 'addressEn', 'addressNp', 'city', 'district', 'province',
    ]));
  });

  it('accepts persisted profile, branding, locale, and academic-month changes during update', () => {
    const update = {
      city: 'Pokhara',
      province: 'Gandaki Pradesh',
      establishedYear: 1998,
      principalName: 'Updated Principal',
      primaryColor: '#abcdef',
      defaultLanguage: 'english',
      academicYearStartMonth: 4,
    };
    const { error, value } = updateSchoolConfigSchema.validate(update, { stripUnknown: true });

    expect(error).toBeUndefined();
    expect(value).toEqual(update);
  });

  it('rejects frontend locale codes and malformed branding colors', () => {
    expect(updateSchoolConfigSchema.validate({ defaultLanguage: 'ne' }).error).toBeDefined();
    expect(updateSchoolConfigSchema.validate({ primaryColor: 'blue' }).error).toBeDefined();
  });
});

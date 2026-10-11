import enhancedValidationService from '../enhancedValidation.service';

describe('EnhancedValidationService student form payloads', () => {
  it('treats a string admission class as its numeric grade during age validation', async () => {
    const result = await enhancedValidationService.validateStudentData({
      dateOfBirthAD: new Date(2020, 0, 1),
      admissionClass: '1' as unknown as number,
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

import enhancedValidationService from '../enhancedValidation.service';
import { logger } from '@utils/logger';

describe('EnhancedValidationService student form payloads', () => {
  it('treats a string admission class as its numeric grade during age validation', async () => {
    const result = await enhancedValidationService.validateStudentData({
      dateOfBirthAD: new Date(2020, 0, 1),
      admissionClass: '1' as unknown as number,
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts the matching Bikram Sambat and Gregorian dates sent by the student form', async () => {
    const result = await enhancedValidationService.validateStudentData({
      dateOfBirthBS: '2073-01-19',
      dateOfBirthAD: new Date('2016-05-01'),
      admissionClass: 1,
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('older than typical');
  });

  it('does not log personal student fields when comprehensive validation fails', async () => {
    const sensitiveStudentName = 'Codex QA Synthetic Student';
    const logError = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    const rollCheck = jest
      .spyOn(enhancedValidationService, 'validateRollNumberUniqueness')
      .mockRejectedValue(new Error('Synthetic repository failure'));

    try {
      const result = await enhancedValidationService.validateStudentData({
        firstNameEn: sensitiveStudentName,
        currentClassId: 12,
        rollNumber: 3,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(['Validation failed due to system error']);
      expect(logError).toHaveBeenCalledWith('Error in comprehensive validation');
      expect(logError.mock.calls[0]).toEqual(['Error in comprehensive validation']);
      expect(JSON.stringify(logError.mock.calls)).not.toContain(sensitiveStudentName);
    } finally {
      rollCheck.mockRestore();
      logError.mockRestore();
    }
  });
});

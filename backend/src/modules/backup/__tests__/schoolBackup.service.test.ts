describe('SchoolBackupService encrypted archive', () => {
  const schoolId = '80bba647-55d5-46d0-b128-288ee2c2511a';
  const passphrase = 'test-only-passphrase-strong';

  const setup = () => {
    jest.resetModules();
    const school = { id: schoolId, schoolNameEn: 'QA School', schoolCode: 'QA-001' };
    const mockSchoolConfig = { findByPk: jest.fn().mockResolvedValue(school) };
    const mockUser = {
      name: 'User',
      rawAttributes: {
        userId: {}, schoolConfigId: {}, username: {}, password: {},
        refreshToken: {}, passwordResetToken: {}, passwordResetExpires: {},
      },
      findAll: jest.fn().mockResolvedValue([{
        userId: 12,
        schoolConfigId: schoolId,
        username: 'qa-admin',
        password: 'encrypted-password-hash',
        refreshToken: 'must-not-be-exported',
        passwordResetToken: 'must-not-be-exported',
        passwordResetExpires: new Date(),
      }]),
    };
    const mockStudent = {
      name: 'Student',
      rawAttributes: { id: {}, schoolConfigId: {}, fullNameEn: {} },
      findAll: jest.fn().mockResolvedValue([{
        id: 'student-1', schoolConfigId: schoolId, fullNameEn: 'QA Student',
      }]),
    };

    jest.doMock('@config/database', () => ({
      __esModule: true,
      default: { models: { User: mockUser, Student: mockStudent } },
    }));
    jest.doMock('@models/SchoolConfig.model', () => ({ __esModule: true, default: mockSchoolConfig }));
    jest.doMock('@models/User.model', () => ({ __esModule: true, default: mockUser }));
    jest.doMock('@middleware/errorHandler', () => ({
      NotFoundError: class NotFoundError extends Error {},
      ValidationError: class ValidationError extends Error {},
    }));

    const { schoolBackupService } = require('../schoolBackup.service') as {
      schoolBackupService: {
        create: (id: string, secret: string) => Promise<{ file: Buffer; rowCount: number }>;
        verify: (id: string, secret: string, file: Buffer) => Promise<{ rowCount: number; school: { id: string } }>;
      };
    };
    return { schoolBackupService, mockUser, mockStudent };
  };

  it('creates an encrypted archive and verifies its school and row count', async () => {
    const { schoolBackupService, mockUser, mockStudent } = setup();

    const backup = await schoolBackupService.create(schoolId, passphrase);
    const verified = await schoolBackupService.verify(schoolId, passphrase, backup.file);

    expect(backup.rowCount).toBe(2);
    expect(verified).toMatchObject({ rowCount: 2, school: { id: schoolId } });
    const archiveEnvelope = JSON.parse(backup.file.toString('utf8'));
    expect(archiveEnvelope.cipher).toBe('aes-256-gcm');
    expect(backup.file.toString('utf8')).not.toContain('QA Student');
    expect(backup.file.toString('utf8')).not.toContain('must-not-be-exported');
    expect(mockUser.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { schoolConfigId: schoolId } }));
    expect(mockStudent.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { schoolConfigId: schoolId } }));
  });

  it('rejects a wrong passphrase and a backup bound to another school ID', async () => {
    const { schoolBackupService } = setup();
    const backup = await schoolBackupService.create(schoolId, passphrase);

    await expect(schoolBackupService.verify(schoolId, 'wrong-test-passphrase', backup.file))
      .rejects.toThrow('Could not decrypt backup');
    await expect(schoolBackupService.verify('00000000-0000-4000-8000-000000000001', passphrase, backup.file))
      .rejects.toThrow('Could not decrypt backup');
  });
});

import CVService from '../cv.service';
import CVRepository from '../cv.repository';
import StudentRepository from '@modules/student/student.repository';

jest.mock('../cv.repository', () => ({
  __esModule: true,
  default: {
    findByStudentId: jest.fn(),
    upsert: jest.fn(),
    updateLastGeneratedAt: jest.fn(),
  },
}));

jest.mock('@modules/student/student.repository', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

const repository = CVRepository as jest.Mocked<typeof CVRepository>;
const studentRepository = StudentRepository as jest.Mocked<typeof StudentRepository>;

const customizationRow = (overrides: Record<string, unknown> = {}) => ({
  studentId: 17,
  showPersonalInfo: true,
  showAcademicPerformance: true,
  showAttendance: true,
  showECA: true,
  showSports: true,
  showCertificates: true,
  showAwards: true,
  showTeacherRemarks: true,
  careerGoals: '',
  personalStatement: '',
  templateId: 'standard',
  schoolBrandingEnabled: true,
  lastGeneratedAt: null,
  getSkills: () => ['Reading'],
  getHobbies: () => ['Chess'],
  ...overrides,
});

describe('CVService customization', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns normalized existing customization without creating a duplicate', async () => {
    repository.findByStudentId.mockResolvedValue(customizationRow() as any);

    const result = await CVService.getOrCreateCustomization(17);

    expect(repository.findByStudentId).toHaveBeenCalledWith(17);
    expect(repository.upsert).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      studentId: 17,
      templateId: 'standard',
      skills: ['Reading'],
      hobbies: ['Chess'],
    });
  });

  it('creates a default customization when none exists', async () => {
    const row = customizationRow();
    repository.findByStudentId.mockResolvedValue(null);
    repository.upsert.mockResolvedValue(row as any);

    const result = await CVService.getOrCreateCustomization(17);

    expect(repository.upsert).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 17,
      showPersonalInfo: true,
      templateId: 'standard',
      skills: [],
      hobbies: [],
    }));
    expect(result.studentId).toBe(17);
  });

  it('updates only the requested fields and returns the persisted customization', async () => {
    repository.findByStudentId
      .mockResolvedValueOnce(customizationRow() as any)
      .mockResolvedValueOnce(customizationRow({ templateId: 'modern', showAttendance: false }) as any);

    const result = await CVService.updateCustomization(17, {
      templateId: 'modern',
      showAttendance: false,
    });

    expect(repository.upsert).toHaveBeenCalledWith(expect.objectContaining({
      studentId: 17,
      templateId: 'modern',
      showAttendance: false,
      showPersonalInfo: true,
    }));
    expect(result).toMatchObject({ studentId: 17, templateId: 'modern', showAttendance: false });
  });

  it('marks a generated CV through the repository', async () => {
    await CVService.markGenerated(17);

    expect(repository.updateLastGeneratedAt).toHaveBeenCalledWith(17);
  });

  it('reports a missing student when compiling CV data', async () => {
    studentRepository.findById.mockResolvedValue(null);

    await expect(CVService.getCVData(999)).rejects.toThrow('Student not found');
    expect(studentRepository.findById).toHaveBeenCalledWith(999);
  });
});

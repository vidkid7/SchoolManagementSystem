jest.mock('../cv.repository', () => ({
  __esModule: true,
  default: {
    findByStudentId: jest.fn(),
    upsert: jest.fn(),
    updateLastGeneratedAt: jest.fn()
  }
}));
jest.mock('@modules/student/student.repository', () => ({ __esModule: true, default: { findById: jest.fn() } }));
jest.mock('@models/AttendanceRecord.model', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
  AttendanceStatus: { PRESENT: 'present', ABSENT: 'absent', LATE: 'late', EXCUSED: 'excused' }
}));
jest.mock('@models/Grade.model', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock('@models/ECAEnrollment.model', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock('@models/ECAAchievement.model', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock('@models/SportsEnrollment.model', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock('@models/SportsAchievement.model', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock('@models/Certificate.model', () => ({ __esModule: true, Certificate: { findOne: jest.fn() } }));

import CVService from '../cv.service';
import CVRepository from '../cv.repository';
import StudentRepository from '@modules/student/student.repository';
import AttendanceRecord from '@models/AttendanceRecord.model';
import Grade from '@models/Grade.model';
import ECAEnrollment from '@models/ECAEnrollment.model';
import ECAAchievement from '@models/ECAAchievement.model';
import SportsEnrollment from '@models/SportsEnrollment.model';
import SportsAchievement from '@models/SportsAchievement.model';
import { Certificate } from '@models/Certificate.model';

describe('CV regeneration state', () => {
  const relatedModels: any[] = [AttendanceRecord, Grade, ECAEnrollment, ECAAchievement, SportsEnrollment, SportsAchievement, Certificate];

  beforeEach(() => {
    jest.clearAllMocks();
    relatedModels.forEach((model) => (model.findOne as jest.Mock).mockResolvedValue(null));
    (StudentRepository.findById as jest.Mock).mockResolvedValue({ updatedAt: new Date('2026-10-09T00:00:00.000Z') });
  });

  it('requires generation before a CV has been generated', async () => {
    (CVRepository.findByStudentId as jest.Mock).mockResolvedValue(null);

    await expect(CVService.needsRegeneration(100)).resolves.toBe(true);
  });

  it('reports a current CV when no source data changed afterward', async () => {
    (CVRepository.findByStudentId as jest.Mock).mockResolvedValue({ lastGeneratedAt: new Date('2026-10-10T00:00:00.000Z') });

    await expect(CVService.needsRegeneration(100)).resolves.toBe(false);
    expect(relatedModels.every((model) => model.findOne.mock.calls.length === 1)).toBe(true);
  });

  it('requires regeneration when a related activity changed after generation', async () => {
    (CVRepository.findByStudentId as jest.Mock).mockResolvedValue({ lastGeneratedAt: new Date('2026-10-10T00:00:00.000Z') });
    (Grade.findOne as jest.Mock).mockResolvedValue({ get: () => new Date('2026-10-11T00:00:00.000Z') });

    await expect(CVService.needsRegeneration(100)).resolves.toBe(true);
  });

  it('persists default customization on first read and marks regeneration when customization changes', async () => {
    const row = {
      studentId: 100,
      showPersonalInfo: true,
      showAcademicPerformance: true,
      showAttendance: true,
      showECA: true,
      showSports: true,
      showCertificates: true,
      showAwards: true,
      showTeacherRemarks: true,
      skills: '[]',
      hobbies: '[]',
      careerGoals: '',
      personalStatement: '',
      templateId: 'standard',
      schoolBrandingEnabled: true,
      lastGeneratedAt: new Date('2026-10-10T00:00:00.000Z'),
      getSkills: () => [],
      getHobbies: () => []
    };
    (CVRepository.findByStudentId as jest.Mock).mockResolvedValueOnce(row).mockResolvedValueOnce({ ...row, lastGeneratedAt: null, templateId: 'modern' });
    (CVRepository.upsert as jest.Mock).mockResolvedValue(undefined);

    await CVService.updateCustomization(100, { templateId: 'modern' });

    expect(CVRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ studentId: 100, templateId: 'modern' }));
    expect(CVRepository.findByStudentId).toHaveBeenCalledTimes(2);
  });
});

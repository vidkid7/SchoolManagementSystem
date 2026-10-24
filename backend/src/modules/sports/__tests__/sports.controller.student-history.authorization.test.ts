import sportsController from '../sports.controller';
import sportsEnrollmentService from '../sportsEnrollment.service';
import sportsAchievementService from '../sportsAchievement.service';
import { assertStudentAccess, getPortalStudentIds } from '@modules/security/studentAccess';
import { Op } from 'sequelize';

jest.mock('../sportsEnrollment.service', () => ({
  __esModule: true,
  default: { getStudentEnrollments: jest.fn(), getStudentParticipationSummary: jest.fn() },
}));
jest.mock('../sportsAchievement.service', () => ({
  __esModule: true,
  default: { getStudentAchievements: jest.fn(), getStudentSportsForCV: jest.fn(), getAchievements: jest.fn() },
}));
jest.mock('@modules/security/studentAccess', () => ({ assertStudentAccess: jest.fn(), getPortalStudentIds: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it('checks student ownership before loading sports history', async () => {
  const denied = new Error('Student not found');
  (assertStudentAccess as jest.Mock).mockRejectedValue(denied);
  const req = { params: { studentId: '52' }, user: { userId: 8, role: 'Student' } } as any;
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();

  await sportsController.getStudentSportsHistory(req, res as any, next);

  expect(assertStudentAccess).toHaveBeenCalledWith(req, 52);
  expect(next).toHaveBeenCalledWith(denied);
  expect(sportsEnrollmentService.getStudentEnrollments).not.toHaveBeenCalled();
  expect(sportsEnrollmentService.getStudentParticipationSummary).not.toHaveBeenCalled();
  expect(sportsAchievementService.getStudentAchievements).not.toHaveBeenCalled();
  expect(sportsAchievementService.getStudentSportsForCV).not.toHaveBeenCalled();
});

it('limits parent achievement lists to linked children', async () => {
  (getPortalStudentIds as jest.Mock).mockResolvedValue([51, 52]);
  (sportsAchievementService.getAchievements as jest.Mock).mockResolvedValue([]);
  const req = { query: {}, user: { userId: 8, role: 'Parent' } } as any;
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

  await sportsController.getAchievements(req, res as any, jest.fn());

  expect(sportsAchievementService.getAchievements).toHaveBeenCalledWith(expect.objectContaining({
    studentId: { [Op.in]: [51, 52] },
  }));
});

it('rejects a cross-student achievement filter before querying records', async () => {
  const denied = new Error('Student not found');
  (assertStudentAccess as jest.Mock).mockRejectedValue(denied);
  const req = { query: { studentId: '99' }, user: { userId: 8, role: 'Student' } } as any;
  const next = jest.fn();

  await sportsController.getAchievements(req, { status: jest.fn().mockReturnThis(), json: jest.fn() } as any, next);

  expect(assertStudentAccess).toHaveBeenCalledWith(req, 99);
  expect(next).toHaveBeenCalledWith(denied);
  expect(sportsAchievementService.getAchievements).not.toHaveBeenCalled();
});

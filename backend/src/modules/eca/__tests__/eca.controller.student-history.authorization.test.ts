import ecaController from '../eca.controller';
import ecaEnrollmentService from '../ecaEnrollment.service';
import ecaCertificateService from '../ecaCertificate.service';
import { assertStudentAccess, getPortalStudentIds } from '@modules/security/studentAccess';
import ECAAchievement from '@models/ECAAchievement.model';
import { Op } from 'sequelize';

jest.mock('../ecaEnrollment.service', () => ({
  __esModule: true,
  default: {
    getStudentEnrollments: jest.fn(),
    getStudentParticipationSummary: jest.fn(),
  },
}));
jest.mock('../ecaCertificate.service', () => ({ __esModule: true, default: { getStudentECAForCV: jest.fn() } }));
jest.mock('@models/ECAAchievement.model', () => ({ __esModule: true, default: { findAll: jest.fn() } }));
jest.mock('@modules/security/studentAccess', () => ({ assertStudentAccess: jest.fn(), getPortalStudentIds: jest.fn() }));

const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('ECA student history authorization', () => {
  beforeEach(() => jest.clearAllMocks());

  it('checks student ownership before loading ECA history', async () => {
    const denied = new Error('Student not found');
    (assertStudentAccess as jest.Mock).mockRejectedValue(denied);
    const req = { params: { studentId: '52' }, user: { userId: 8, role: 'Student' } } as any;
    const res = response();
    const next = jest.fn();

    await ecaController.getStudentECAHistory(req, res as any, next);

    expect(assertStudentAccess).toHaveBeenCalledWith(req, 52);
    expect(next).toHaveBeenCalledWith(denied);
    expect(ecaEnrollmentService.getStudentEnrollments).not.toHaveBeenCalled();
    expect(ecaCertificateService.getStudentECAForCV).not.toHaveBeenCalled();
    expect(ECAAchievement.findAll).not.toHaveBeenCalled();
  });

  it('limits parent achievement lists to linked children', async () => {
    (getPortalStudentIds as jest.Mock).mockResolvedValue([51, 52]);
    (ECAAchievement.findAll as jest.Mock).mockResolvedValue([]);
    const req = { query: {}, user: { userId: 8, role: 'Parent' } } as any;
    const res = response();

    await ecaController.getAchievements(req, res as any, jest.fn());

    expect(ECAAchievement.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { studentId: { [Op.in]: [51, 52] } },
    }));
  });

  it('rejects a cross-student achievement filter before querying records', async () => {
    const denied = new Error('Student not found');
    (assertStudentAccess as jest.Mock).mockRejectedValue(denied);
    const req = { query: { studentId: '99' }, user: { userId: 8, role: 'Student' } } as any;
    const next = jest.fn();

    await ecaController.getAchievements(req, response() as any, next);

    expect(assertStudentAccess).toHaveBeenCalledWith(req, 99);
    expect(next).toHaveBeenCalledWith(denied);
    expect(ECAAchievement.findAll).not.toHaveBeenCalled();
  });
});

import { Request } from 'express';
import Student from '@models/Student.model';
import parentService from '@modules/parent/parent.service';
import { assertStudentAccess, getPortalStudentIds } from '../studentAccess';

jest.mock('@models/Student.model', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock('@modules/parent/parent.service', () => ({ __esModule: true, default: { getParentChildren: jest.fn() } }));

const requestAs = (role: string, userId = 22) => ({ user: { role, userId } } as unknown as Request);

describe('student portal record ownership', () => {
  beforeEach(() => jest.clearAllMocks());

  it('limits a student to the student record linked to their user account', async () => {
    (Student.findOne as jest.Mock).mockResolvedValue({ studentId: 51 });
    await expect(assertStudentAccess(requestAs('Student'), 51)).resolves.toBeUndefined();
    await expect(assertStudentAccess(requestAs('Student'), 52)).rejects.toMatchObject({ statusCode: 404 });
    expect(Student.findOne).toHaveBeenCalledWith({ where: { userId: 22 }, attributes: ['studentId'] });
  });

  it('limits a parent to students linked by the parent portal relationship', async () => {
    (parentService.getParentChildren as jest.Mock).mockResolvedValue([{ studentId: 61 }, { studentId: 62 }]);
    await expect(assertStudentAccess(requestAs('Parent'), 62)).resolves.toBeUndefined();
    await expect(assertStudentAccess(requestAs('Parent'), 63)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('does not apply portal ownership filters to school staff', async () => {
    await expect(getPortalStudentIds(requestAs('School_Admin'))).resolves.toBeNull();
    expect(Student.findOne).not.toHaveBeenCalled();
    expect(parentService.getParentChildren).not.toHaveBeenCalled();
  });
});

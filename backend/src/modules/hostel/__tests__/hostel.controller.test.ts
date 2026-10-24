import { Request, Response } from 'express';
import { Op } from 'sequelize';
import hostelController from '../hostel.controller';
import HostelResident from '@models/HostelResident.model';
import Student from '@models/Student.model';

describe('Hostel resident listing', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.restoreAllMocks();
    req = { query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  });

  it('returns only students with active hostel assignments and paginates the assignments', async () => {
    const student = { studentId: 812, firstNameEn: 'QA', lastNameEn: 'Resident', studentCode: 'QA-RES-812' };
    const resident = {
      get: jest.fn().mockReturnValue({ id: 45, roomId: 3, student }),
    };
    jest.spyOn(HostelResident, 'findAndCountAll').mockResolvedValue({ count: 1, rows: [resident] } as never);
    jest.spyOn(Student, 'findAndCountAll').mockResolvedValue({ count: 1, rows: [] } as never);
    req.query = { page: '2', limit: '10', search: 'QA-RES' };

    await hostelController.getResidentStudents(req as Request, res as Response);

    expect(HostelResident.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'active' },
      include: [expect.objectContaining({
        model: Student,
        as: 'student',
        required: true,
        where: {
          [Op.or]: [
            { firstNameEn: { [Op.like]: '%QA-RES%' } },
            { lastNameEn: { [Op.like]: '%QA-RES%' } },
            { studentCode: { [Op.like]: '%QA-RES%' } },
          ],
        },
      })],
      limit: 10,
      offset: 10,
      distinct: true,
    }));
    expect(Student.findAndCountAll).not.toHaveBeenCalled();
    const response = (res.json as jest.Mock).mock.calls[0][0];
    expect(response.data.students).toEqual([{ ...student, hostelResidentId: 45, roomId: 3 }]);
    expect(response.data.pagination).toEqual({ total: 1, page: 2, limit: 10, pages: 1 });
  });

  it('returns an empty resident state and clamps invalid pagination values', async () => {
    jest.spyOn(HostelResident, 'findAndCountAll').mockResolvedValue({ count: 0, rows: [] } as never);
    req.query = { page: '-2', limit: '1000' };

    await hostelController.getResidentStudents(req as Request, res as Response);

    expect(HostelResident.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'active' },
      include: [expect.objectContaining({ model: Student, as: 'student', required: true })],
      limit: 100,
      offset: 0,
      distinct: true,
    }));
    const response = (res.json as jest.Mock).mock.calls[0][0];
    expect(response.data.students).toEqual([]);
    expect(response.data.pagination).toEqual({ total: 0, page: 1, limit: 100, pages: 0 });
  });
});

import { Request, Response, NextFunction } from 'express';
import StudentRepository from '../student.repository';
import StudentTransferHistory from '@models/StudentTransferHistory.model';
import studentController from '../student.controller';

function invokeGetTransferHistory(studentId: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = { params: { id: studentId } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn((body: unknown) => resolve(body)),
    } as unknown as Response;
    const next: NextFunction = (error?: unknown) => {
      if (error) reject(error);
    };

    studentController.getTransferHistory(req, res, next);
  });
}

describe('student transfer history controller', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns history only after confirming the student exists', async () => {
    const student = { studentId: 42 };
    const history = [
      { fromClassId: 10, toClassId: 20, reason: 'section reassignment' },
    ];
    jest.spyOn(StudentRepository, 'findById').mockResolvedValue(student as never);
    const findHistory = jest.spyOn(StudentTransferHistory, 'findAll').mockResolvedValue(history as never);

    await expect(invokeGetTransferHistory('42')).resolves.toMatchObject({
      success: true,
      data: history,
      message: 'Student transfer history retrieved successfully',
    });
    expect(StudentRepository.findById).toHaveBeenCalledWith(42);
    expect(findHistory).toHaveBeenCalledWith({
      where: { studentId: 42 },
      order: [['transferredAt', 'DESC']],
    });
  });

  it('does not query history for a missing student', async () => {
    jest.spyOn(StudentRepository, 'findById').mockResolvedValue(null);
    const findHistory = jest.spyOn(StudentTransferHistory, 'findAll');

    await expect(invokeGetTransferHistory('999')).rejects.toMatchObject({ statusCode: 404 });
    expect(findHistory).not.toHaveBeenCalled();
  });
});

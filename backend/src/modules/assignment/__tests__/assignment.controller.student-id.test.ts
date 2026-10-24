import assignmentController from '../assignment.controller';
import Assignment from '@models/Assignment.model';
import AssignmentSubmission from '@models/AssignmentSubmission.model';
import Student from '@models/Student.model';

jest.mock('@models/Assignment.model', () => ({ __esModule: true, default: { findByPk: jest.fn(), findAll: jest.fn() } }));
jest.mock('@models/AssignmentSubmission.model', () => ({ __esModule: true, default: { create: jest.fn(), findAll: jest.fn() } }));
jest.mock('@models/Student.model', () => ({ __esModule: true, default: { findOne: jest.fn() } }));

const createResponse = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

describe('assignment student ID mapping', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stores the linked student record ID when submitting work', async () => {
    (Student.findOne as jest.Mock).mockResolvedValue({ studentId: 720001 });
    (Assignment.findByPk as jest.Mock).mockResolvedValue({ id: 31 });
    (AssignmentSubmission.create as jest.Mock).mockResolvedValue({ id: 90 });
    const res = createResponse();
    await assignmentController.submitAssignment({
      params: { id: '31' }, body: { content: 'My submission' }, user: { userId: 501 } as any,
    } as any, res as any);
    expect(Student.findOne).toHaveBeenCalledWith({ where: { userId: 501 }, attributes: ['studentId'] });
    expect(AssignmentSubmission.create).toHaveBeenCalledWith(expect.objectContaining({ assignmentId: 31, studentId: 720001 }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('uses the linked student record ID to find the current student\'s submissions', async () => {
    (Student.findOne as jest.Mock).mockResolvedValue({
      studentId: 720001,
      currentClass: { gradeLevel: 10, section: 'A' },
    });
    (Assignment.findAll as jest.Mock).mockResolvedValue([{ id: 31, toJSON: () => ({ id: 31 }) }]);
    (AssignmentSubmission.findAll as jest.Mock).mockResolvedValue([{ assignmentId: 31, status: 'submitted' }]);
    const res = createResponse();
    await assignmentController.getMyAssignments({ user: { userId: 501 } as any } as any, res as any);
    expect(Student.findOne).toHaveBeenCalledWith(expect.objectContaining({
      include: [{ association: 'currentClass', attributes: ['gradeLevel', 'section'] }],
    }));
    expect(Assignment.findAll).toHaveBeenCalledWith({
      where: { className: 'Class 10 A', status: 'active' },
      order: [['createdAt', 'DESC']],
    });
    expect(AssignmentSubmission.findAll).toHaveBeenCalledWith({ where: { studentId: 720001 } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('does not accept a submission without a linked student record', async () => {
    (Student.findOne as jest.Mock).mockResolvedValue(null);
    const res = createResponse();
    await assignmentController.submitAssignment({
      params: { id: '31' }, body: { content: 'My submission' }, user: { userId: 501 } as any,
    } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(Assignment.findByPk).not.toHaveBeenCalled();
    expect(AssignmentSubmission.create).not.toHaveBeenCalled();
  });

  it('returns no student assignments when no linked class exists', async () => {
    (Student.findOne as jest.Mock).mockResolvedValue({ studentId: 720001, currentClass: null });
    (AssignmentSubmission.findAll as jest.Mock).mockResolvedValue([]);
    const res = createResponse();

    await assignmentController.getMyAssignments({ user: { userId: 501 } as any } as any, res as any);

    expect(Assignment.findAll).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ assignments: [], total: 0 }),
    }));
  });

  it('does not list active assignments without a class scope', async () => {
    await expect(assignmentController.getAllAssignmentsForStudent()).resolves.toEqual([]);
    expect(Assignment.findAll).not.toHaveBeenCalled();
  });
});

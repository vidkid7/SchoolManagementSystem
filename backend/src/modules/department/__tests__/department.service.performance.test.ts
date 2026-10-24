import departmentService from '../department.service';
import Staff from '@models/Staff.model';
import StaffAssignment from '@models/StaffAssignment.model';
import Grade from '@models/Grade.model';
import Exam, { ExamStatus } from '@models/Exam.model';
import Class from '@models/Class.model';

jest.mock('@models/Staff.model', () => ({
  __esModule: true,
  default: { findOne: jest.fn(), findAll: jest.fn() },
}));
jest.mock('@models/StaffAssignment.model', () => ({
  __esModule: true,
  default: { findAll: jest.fn() },
}));
jest.mock('@models/StaffAttendance.model', () => ({ __esModule: true, default: { findAll: jest.fn() } }));
jest.mock('@models/Grade.model', () => ({ __esModule: true, default: { findAll: jest.fn() } }));
jest.mock('@models/Exam.model', () => ({
  __esModule: true,
  default: { name: 'ExamModel' },
  ExamStatus: { COMPLETED: 'completed' },
}));
jest.mock('@models/Class.model', () => ({ __esModule: true, default: { name: 'ClassModel' } }));

describe('departmentService.getDepartmentPerformance', () => {
  const mockStaffFindOne = jest.mocked(Staff.findOne);
  const mockStaffFindAll = jest.mocked(Staff.findAll);
  const mockAssignmentFindAll = jest.mocked(StaffAssignment.findAll);
  const mockGradeFindAll = jest.mocked(Grade.findAll);

  beforeEach(() => {
    jest.clearAllMocks();
    mockStaffFindOne.mockResolvedValue({ department: 'Science' } as never);
    mockStaffFindAll.mockResolvedValue([{ staffId: 10 }, { staffId: 11 }] as never);
    mockAssignmentFindAll.mockResolvedValue([
      { classId: 21 },
      { classId: 21 },
      { classId: 22 },
      { classId: null },
    ] as never);
  });

  it('returns mark-weighted class averages from completed exams assigned to department teachers', async () => {
    mockGradeFindAll.mockResolvedValue([
      { totalMarks: '80', exam: { fullMarks: '100', class: { classId: 21, gradeLevel: 8, section: 'A' } } },
      { totalMarks: '90', exam: { fullMarks: '100', class: { classId: 21, gradeLevel: 8, section: 'A' } } },
      { totalMarks: '36', exam: { fullMarks: '40', class: { classId: 22, gradeLevel: 9, section: 'B' } } },
      { totalMarks: '110', exam: { fullMarks: '100', class: { classId: 22, gradeLevel: 9, section: 'B' } } },
      { totalMarks: '40', exam: { fullMarks: '0', class: { classId: 22, gradeLevel: 9, section: 'B' } } },
    ] as never);

    const result = await departmentService.getDepartmentPerformance(99);

    expect(result).toEqual([
      { class: 'Class 8-A', averageScore: 85 },
      { class: 'Class 9-B', averageScore: 90 },
    ]);
    expect(mockStaffFindAll).toHaveBeenCalledWith({
      where: { department: 'Science', category: 'teaching' },
      attributes: ['staffId'],
    });
    expect(mockAssignmentFindAll).toHaveBeenCalledWith({
      where: { staffId: [10, 11], isActive: true },
      attributes: ['classId'],
    });
    const query = mockGradeFindAll.mock.calls[0][0] as unknown as { include: unknown[] };
    expect(query.include[0]).toMatchObject({
      model: Exam,
      as: 'exam',
      where: { classId: [21, 22], status: ExamStatus.COMPLETED },
      include: [{ model: Class, as: 'class', required: true }],
    });
  });

  it('returns no rows and skips grade queries when the head or department has no teachers/classes', async () => {
    mockStaffFindOne.mockResolvedValueOnce(null);
    await expect(departmentService.getDepartmentPerformance(99)).resolves.toEqual([]);
    expect(mockStaffFindAll).not.toHaveBeenCalled();
    expect(mockGradeFindAll).not.toHaveBeenCalled();

    mockStaffFindOne.mockResolvedValueOnce({ department: 'Science' } as never);
    mockStaffFindAll.mockResolvedValueOnce([] as never);
    await expect(departmentService.getDepartmentPerformance(99)).resolves.toEqual([]);
    expect(mockAssignmentFindAll).not.toHaveBeenCalled();
  });

  it('returns an empty result when assigned classes have no valid completed exam grades', async () => {
    mockGradeFindAll.mockResolvedValue([] as never);

    await expect(departmentService.getDepartmentPerformance(99)).resolves.toEqual([]);
  });
});

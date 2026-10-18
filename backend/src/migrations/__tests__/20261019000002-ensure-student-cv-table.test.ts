import createStudentCVTable from '../031-create-student-cv-table';
import { down, up } from '../20261019000002-ensure-student-cv-table';

jest.mock('../031-create-student-cv-table', () => ({
  __esModule: true,
  default: { up: jest.fn() }
}));

describe('ensure student CV table migration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates the table when it is missing', async () => {
    const queryInterface = { showAllTables: jest.fn().mockResolvedValue(['students']) };

    await up(queryInterface as any);

    expect(createStudentCVTable.up).toHaveBeenCalledWith(queryInterface);
  });

  it('does not recreate an existing table', async () => {
    const queryInterface = { showAllTables: jest.fn().mockResolvedValue(['student_cv']) };

    await up(queryInterface as any);

    expect(createStudentCVTable.up).not.toHaveBeenCalled();
  });

  it('drops the table only when it exists', async () => {
    const queryInterface = {
      showAllTables: jest.fn().mockResolvedValue(['student_cv']),
      dropTable: jest.fn()
    };

    await down(queryInterface as any);

    expect(queryInterface.dropTable).toHaveBeenCalledWith('student_cv');
  });
});

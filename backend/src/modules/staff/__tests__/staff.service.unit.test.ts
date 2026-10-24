import Staff from '@models/Staff.model';
import staffService from '../staff.service';

describe('staff list filters', () => {
  afterEach(() => jest.restoreAllMocks());

  it('passes an exact position filter to the staff query', async () => {
    const findAndCountAll = jest.spyOn(Staff, 'findAndCountAll').mockResolvedValue({ rows: [], count: 0 } as never);

    await staffService.findAll({ position: 'teacher' }, { limit: 20, offset: 0 });

    expect(findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { position: 'teacher' },
      limit: 20,
      offset: 0,
    }));
  });
});

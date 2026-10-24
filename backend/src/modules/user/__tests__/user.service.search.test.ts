import User from '@models/User.model';
import { Op } from 'sequelize';
import { UserService } from '../user.service';

describe('UserService case-insensitive search', () => {
  afterEach(() => jest.restoreAllMocks());

  it('lowercases the search term and both searchable fields', async () => {
    const findAndCountAll = jest.spyOn(User, 'findAndCountAll').mockResolvedValue({ count: 0, rows: [] } as any);
    const service = new UserService();

    await service.getAllUsers({ search: 'QA', page: 1, limit: 10 }, 'school-1');

    const options = findAndCountAll.mock.calls[0][0] as any;
    const [usernameSearch, emailSearch] = options.where[Op.or];
    for (const [condition, column] of [[usernameSearch, 'username'], [emailSearch, 'email']]) {
      expect(condition.attribute).toMatchObject({ fn: 'LOWER', args: [{ col: column }] });
      expect(condition.logic[Op.like]).toBe('%qa%');
    }
  });
});

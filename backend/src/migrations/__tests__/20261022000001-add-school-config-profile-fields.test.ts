import { QueryInterface } from 'sequelize';
import { down, up } from '../20261022000001-add-school-config-profile-fields';

describe('school configuration profile field migration', () => {
  it('adds only missing profile and branding columns', async () => {
    const addColumn = jest.fn().mockResolvedValue(undefined);
    const queryInterface = {
      describeTable: jest.fn().mockResolvedValue({ id: {}, school_name_en: {}, city: {} }),
      addColumn,
    } as unknown as QueryInterface;

    await up(queryInterface);

    expect(addColumn).toHaveBeenCalledTimes(10);
    expect(addColumn).not.toHaveBeenCalledWith('school_config', 'city', expect.anything());
    expect(addColumn).toHaveBeenCalledWith('school_config', 'primary_color', expect.objectContaining({ allowNull: true }));
  });

  it('removes the added fields when rolled back', async () => {
    const removeColumn = jest.fn().mockResolvedValue(undefined);
    const queryInterface = {
      describeTable: jest.fn().mockResolvedValue({
        city: {}, district: {}, province: {}, postal_code: {}, established_year: {}, affiliation_number: {},
        principal_name: {}, principal_name_np: {}, primary_color: {}, secondary_color: {}, accent_color: {},
      }),
      removeColumn,
    } as unknown as QueryInterface;

    await down(queryInterface);

    expect(removeColumn).toHaveBeenCalledTimes(11);
    expect(removeColumn).toHaveBeenCalledWith('school_config', 'city');
  });
});

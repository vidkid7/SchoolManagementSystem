import { Op } from 'sequelize';
import { buildStudentSearchConditions } from '../student.repository';

describe('buildStudentSearchConditions', () => {
  it('matches every term across first, middle, and last names', () => {
    const conditions = buildStudentSearchConditions('Ram Sharma');
    const combinedNameCondition = conditions.find((condition) => Op.and in condition);

    expect(combinedNameCondition).toBeDefined();
    const termConditions = combinedNameCondition?.[Op.and] as Array<Record<PropertyKey, unknown>>;
    expect(termConditions).toHaveLength(2);
    expect(termConditions[0][Op.or]).toEqual([
      { firstNameEn: { [Op.like]: '%Ram%' } },
      { middleNameEn: { [Op.like]: '%Ram%' } },
      { lastNameEn: { [Op.like]: '%Ram%' } },
      { firstNameNp: { [Op.like]: '%Ram%' } },
      { middleNameNp: { [Op.like]: '%Ram%' } },
      { lastNameNp: { [Op.like]: '%Ram%' } },
    ]);
    expect(termConditions[1][Op.or]).toEqual([
      { firstNameEn: { [Op.like]: '%Sharma%' } },
      { middleNameEn: { [Op.like]: '%Sharma%' } },
      { lastNameEn: { [Op.like]: '%Sharma%' } },
      { firstNameNp: { [Op.like]: '%Sharma%' } },
      { middleNameNp: { [Op.like]: '%Sharma%' } },
      { lastNameNp: { [Op.like]: '%Sharma%' } },
    ]);
  });
});

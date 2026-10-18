jest.mock('@models/FeeStructure.model', () => ({
  FeeStructure: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  FeeComponent: {},
}));

import { FeeStructure } from '@models/FeeStructure.model';
import feeStructureRepository from '../feeStructure.repository';

const mockStructure = (totalAmount: string, calculatedTotal: number) => ({
  feeStructureId: 12,
  totalAmount,
  calculateTotalAmount: jest.fn().mockResolvedValue(calculatedTotal),
  setDataValue: jest.fn(),
});

describe('fee structure total repair', () => {
  beforeEach(() => jest.clearAllMocks());

  it('repairs and returns a stale total when loading one fee structure', async () => {
    const structure = mockStructure('0.00', 100);
    (FeeStructure.findByPk as jest.Mock).mockResolvedValue(structure);

    const result = await feeStructureRepository.findById(12);

    expect(FeeStructure.update).toHaveBeenCalledWith(
      { totalAmount: 100 },
      { where: { feeStructureId: 12 }, transaction: undefined },
    );
    expect(structure.setDataValue).toHaveBeenCalledWith('totalAmount', 100);
    expect(result).toBe(structure);
  });

  it('repairs stale totals while listing and avoids unnecessary writes', async () => {
    const stale = mockStructure('0.00', 100);
    const correct = mockStructure('50.00', 50);
    (FeeStructure.findAll as jest.Mock).mockResolvedValue([stale, correct]);

    const result = await feeStructureRepository.findAll();

    expect(FeeStructure.update).toHaveBeenCalledTimes(1);
    expect(FeeStructure.update).toHaveBeenCalledWith(
      { totalAmount: 100 },
      { where: { feeStructureId: 12 }, transaction: undefined },
    );
    expect(stale.setDataValue).toHaveBeenCalledWith('totalAmount', 100);
    expect(correct.setDataValue).not.toHaveBeenCalled();
    expect(result).toEqual([stale, correct]);
  });
});

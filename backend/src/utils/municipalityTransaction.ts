import { Transaction } from 'sequelize';
import { sequelize } from '@config/database';
import Municipality from '@models/Municipality.model';

export async function withMunicipalityTransaction<T>(
  municipalityId: string,
  callback: (transaction: Transaction) => Promise<T>
): Promise<T> {
  const transaction = await sequelize.transaction();

  try {
    // Validate municipality exists and is active
    const municipality = await Municipality.findOne({
      where: { id: municipalityId, isActive: true },
      transaction,
    });

    if (!municipality) {
      throw new Error(`Municipality ${municipalityId} not found or inactive`);
    }

    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

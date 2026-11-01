import sequelize from '../config/database';
import User, { UserRole, UserStatus } from '../models/User.model';
import Municipality from '../models/Municipality.model';
import { Op } from 'sequelize';
import { logger } from '../utils/logger';
import { seedRolesAndPermissions } from './seed-roles-permissions';

async function bootstrapDevUser(): Promise<void> {
  try {
    await sequelize.authenticate();

    // Keep the bootstrap identity predictable, but require the credential to be
    // supplied as a deployment secret. No default password is ever created.
    const username = 'devuser';
    const email = process.env.INITIAL_ADMIN_EMAIL?.trim();
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    const municipalityCode = process.env.DEFAULT_MUNICIPALITY_CODE?.trim();
    const municipalityName = process.env.DEFAULT_MUNICIPALITY_NAME?.trim();
    const municipalityDistrict = process.env.DEFAULT_MUNICIPALITY_DISTRICT?.trim();
    if (!/^devuser$/i.test(username) || !email || !password || password.length < 14 ||
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new Error('Set INITIAL_ADMIN_EMAIL and an INITIAL_ADMIN_PASSWORD of at least 14 characters with upper/lowercase letters and a number. The protected username is devuser.');
    }
    if (!municipalityCode || !municipalityName || !municipalityDistrict) {
      throw new Error('Set DEFAULT_MUNICIPALITY_CODE, DEFAULT_MUNICIPALITY_NAME, and DEFAULT_MUNICIPALITY_DISTRICT before bootstrapping.');
    }

    const existingIdentity = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
      paranoid: false,
    });
    if (existingIdentity) {
      if (existingIdentity.username.toLowerCase() === 'devuser' &&
        existingIdentity.isSystemAccount &&
        existingIdentity.role === UserRole.MUNICIPALITY_ADMIN) {
        logger.info('Protected devuser account already exists; bootstrap skipped without changing its password.');
        return;
      }
      throw new Error('The devuser username or configured email is already in use by another account.');
    }

    const [municipality] = await Municipality.findOrCreate({
      where: { code: municipalityCode },
      defaults: {
        nameEn: municipalityName,
        code: municipalityCode,
        district: municipalityDistrict,
        province: process.env.DEFAULT_MUNICIPALITY_PROVINCE?.trim(),
        isActive: true,
      },
    });

    await seedRolesAndPermissions();

    await User.create({
      username,
      email,
      password,
      firstName: process.env.INITIAL_ADMIN_FIRST_NAME?.trim() || 'System',
      lastName: process.env.INITIAL_ADMIN_LAST_NAME?.trim() || 'Operator',
      role: UserRole.MUNICIPALITY_ADMIN,
      status: UserStatus.ACTIVE,
      municipalityId: String(municipality.getDataValue('id')),
      isSystemAccount: true,
      failedLoginAttempts: 0,
    });

    logger.info('Protected devuser created as a municipality-scoped system operator. Remove INITIAL_ADMIN_PASSWORD from the service environment after this command succeeds.');
  } finally {
    await sequelize.close();
  }
}

bootstrapDevUser().catch((error: unknown) => {
  logger.error('Protected devuser bootstrap failed:', error);
  process.exitCode = 1;
});

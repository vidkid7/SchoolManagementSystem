import sequelize from '../config/database';
import User, { UserRole, UserStatus } from '../models/User.model';
import Municipality from '../models/Municipality.model';
import { SchoolConfig } from '../models/SchoolConfig.model';
import { logger } from '../utils/logger';

async function bootstrapAdmin(): Promise<void> {
  try {
    await sequelize.authenticate();

    if (await User.count() > 0) {
      logger.info('Users already exist; initial administrator bootstrap skipped.');
      return;
    }

    const username = process.env.INITIAL_ADMIN_USERNAME?.trim();
    const email = process.env.INITIAL_ADMIN_EMAIL?.trim();
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    if (!username || !email || !password || password.length < 14) {
      throw new Error('Set INITIAL_ADMIN_USERNAME, INITIAL_ADMIN_EMAIL, and a 14+ character INITIAL_ADMIN_PASSWORD to initialize the first administrator.');
    }

    const [municipality] = await Municipality.findOrCreate({
      where: { code: 'KMC' },
      defaults: {
        nameEn: 'Kathmandu Metropolitan City',
        code: 'KMC',
        district: 'Kathmandu',
        province: 'Bagmati',
        isActive: true,
      },
    });

    const [school] = await SchoolConfig.findOrCreate({
      where: { schoolCode: 'DEFAULT-SCHOOL' },
      defaults: {
        municipalityId: String(municipality.getDataValue('id')),
        schoolNameEn: process.env.DEFAULT_SCHOOL_NAME || 'School Management System',
        schoolCode: 'DEFAULT-SCHOOL',
        isActive: true,
      },
    });

    await User.create({
      username,
      email,
      password,
      role: UserRole.SCHOOL_ADMIN,
      status: UserStatus.ACTIVE,
      municipalityId: String(municipality.getDataValue('id')),
      schoolConfigId: String(school.getDataValue('id')),
      failedLoginAttempts: 0,
    });

    logger.info('Initial school administrator created. Remove INITIAL_ADMIN_PASSWORD from service environment after this deploy.');
  } finally {
    await sequelize.close();
  }
}

bootstrapAdmin().catch((error: unknown) => {
  logger.error('Initial administrator bootstrap failed:', error);
  process.exitCode = 1;
});

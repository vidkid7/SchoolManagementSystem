import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database';
import Municipality from '../models/Municipality.model';
import SchoolConfig from '../models/SchoolConfig.model';
import User, { UserRole, UserStatus } from '../models/User.model';
import { logger } from '../utils/logger';

interface SchoolSeedInput {
  id?: string;
  schoolCode?: string;
  schoolNameEn?: string;
  schoolNameNp?: string;
  addressEn?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive?: boolean;
}

interface MunicipalityAdminSeedInput {
  username?: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  status?: UserStatus;
  schoolCode?: string;
}

interface MunicipalitySeedInput {
  code: string;
  nameEn: string;
  nameNp?: string;
  district: string;
  province?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive?: boolean;
  schools?: SchoolSeedInput[];
  admins?: MunicipalityAdminSeedInput[];
}

interface UserAssignmentInput {
  username?: string;
  email?: string;
  userId?: number;
  schoolCode: string;
}

interface MunicipalityTenantConfig {
  municipalities: MunicipalitySeedInput[];
  userAssignments?: UserAssignmentInput[];
  defaultSchoolCodeForUnassignedUsers?: string;
}

interface ScriptOptions {
  configPath: string;
  apply: boolean;
}

function normalizeUsername(input: string): string {
  const normalized = input.replace(/[^a-zA-Z0-9]/g, '').slice(0, 50);
  if (normalized.length < 3) {
    throw new Error(`Username "${input}" is invalid after normalization`);
  }
  return normalized;
}

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  let configPath = 'municipality-tenancy.json';
  let apply = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--apply') {
      apply = true;
      continue;
    }

    if (arg === '--config' && args[i + 1]) {
      configPath = args[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith('--config=')) {
      configPath = arg.replace('--config=', '');
    }
  }

  return { configPath, apply };
}

function readConfig(configPath: string): MunicipalityTenantConfig {
  const absolutePath = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Config file not found: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, 'utf-8');
  const parsed = JSON.parse(raw) as MunicipalityTenantConfig;

  if (!Array.isArray(parsed.municipalities) || parsed.municipalities.length === 0) {
    throw new Error('Config must include at least one municipality');
  }

  return parsed;
}

async function resolveSchoolByCode(
  schoolCode: string,
  transaction: Transaction
): Promise<SchoolConfig> {
  const school = await SchoolConfig.findOne({ where: { schoolCode }, transaction });
  if (!school) {
    throw new Error(`School not found for schoolCode: ${schoolCode}`);
  }
  return school;
}

async function upsertMunicipalityWithSchoolsAndAdmins(
  municipalityInput: MunicipalitySeedInput,
  transaction: Transaction
): Promise<void> {
  const [municipality] = await Municipality.findOrCreate({
    where: { code: municipalityInput.code },
    defaults: {
      nameEn: municipalityInput.nameEn,
      nameNp: municipalityInput.nameNp,
      code: municipalityInput.code,
      district: municipalityInput.district,
      province: municipalityInput.province,
      address: municipalityInput.address,
      contactPhone: municipalityInput.contactPhone,
      contactEmail: municipalityInput.contactEmail,
      isActive: municipalityInput.isActive ?? true,
    },
    transaction,
  });

  await municipality.update({
    nameEn: municipalityInput.nameEn,
    nameNp: municipalityInput.nameNp,
    district: municipalityInput.district,
    province: municipalityInput.province,
    address: municipalityInput.address,
    contactPhone: municipalityInput.contactPhone,
    contactEmail: municipalityInput.contactEmail,
    isActive: municipalityInput.isActive ?? municipality.isActive,
  }, { transaction });

  logger.info('Municipality upserted', {
    code: municipality.code,
    id: municipality.id,
  });

  if (municipalityInput.schools?.length) {
    for (const schoolInput of municipalityInput.schools) {
      let school: SchoolConfig | null = null;

      if (schoolInput.id) {
        school = await SchoolConfig.findByPk(schoolInput.id, { transaction });
      }

      if (!school && schoolInput.schoolCode) {
        school = await SchoolConfig.findOne({
          where: { schoolCode: schoolInput.schoolCode },
          transaction,
        });
      }

      if (!school) {
        school = await SchoolConfig.create({
          municipalityId: municipality.id,
          schoolCode: schoolInput.schoolCode,
          schoolNameEn: schoolInput.schoolNameEn || `School ${municipality.code}`,
          schoolNameNp: schoolInput.schoolNameNp,
          addressEn: schoolInput.addressEn,
          phone: schoolInput.phone,
          email: schoolInput.email,
          website: schoolInput.website,
          isActive: schoolInput.isActive ?? true,
        }, {
          transaction,
        });
      } else {
        await school.update({
          municipalityId: municipality.id,
          schoolCode: schoolInput.schoolCode || school.schoolCode,
          schoolNameEn: schoolInput.schoolNameEn || school.schoolNameEn,
          schoolNameNp: schoolInput.schoolNameNp ?? school.schoolNameNp,
          addressEn: schoolInput.addressEn ?? school.addressEn,
          phone: schoolInput.phone ?? school.phone,
          email: schoolInput.email ?? school.email,
          website: schoolInput.website ?? school.website,
          isActive: schoolInput.isActive ?? school.isActive,
        }, { transaction });
      }

      logger.info('School mapped to municipality', {
        schoolId: school.id,
        schoolCode: school.schoolCode,
        municipalityCode: municipality.code,
      });
    }
  }

  if (municipalityInput.admins?.length) {
    for (const adminInput of municipalityInput.admins) {
      if (!adminInput.email && !adminInput.username) {
        throw new Error(
          `Municipality admin in ${municipality.code} must include email or username`
        );
      }

      const whereClause = adminInput.username
        ? { username: adminInput.username }
        : { email: adminInput.email };

      let schoolConfigId: string | undefined;
      if (adminInput.schoolCode) {
        const school = await resolveSchoolByCode(adminInput.schoolCode, transaction);
        schoolConfigId = school.id;
      }

      const existingUser = await User.findOne({ where: whereClause, transaction });
      if (!existingUser) {
        if (!adminInput.password) {
          throw new Error(
            `Password is required for new municipality admin: ${adminInput.email}`
          );
        }

        const username = normalizeUsername(
          adminInput.username || adminInput.email.split('@')[0]
        );
        await User.create({
          username,
          email: adminInput.email,
          password: adminInput.password,
          role: UserRole.MUNICIPALITY_ADMIN,
          status: adminInput.status ?? UserStatus.ACTIVE,
          municipalityId: municipality.id,
          schoolConfigId,
          phoneNumber: adminInput.phoneNumber,
        }, {
          transaction,
        });

        logger.info('Municipality admin created', {
          municipalityCode: municipality.code,
          email: adminInput.email,
          username,
        });
      } else {
        existingUser.role = UserRole.MUNICIPALITY_ADMIN;
        existingUser.status = adminInput.status ?? existingUser.status;
        existingUser.municipalityId = municipality.id;
        existingUser.schoolConfigId = schoolConfigId ?? existingUser.schoolConfigId;
        existingUser.phoneNumber = adminInput.phoneNumber ?? existingUser.phoneNumber;
        existingUser.email = adminInput.email || existingUser.email;
        if (adminInput.username) {
          existingUser.username = normalizeUsername(adminInput.username);
        }

        if (adminInput.password) {
          existingUser.password = adminInput.password;
        }

        await existingUser.save({ transaction });

        logger.info('Municipality admin updated', {
          municipalityCode: municipality.code,
          userId: existingUser.userId,
          username: existingUser.username,
        });
      }
    }
  }
}

async function applyUserAssignments(
  assignments: UserAssignmentInput[],
  transaction: Transaction
): Promise<void> {
  for (const assignment of assignments) {
    const school = await resolveSchoolByCode(assignment.schoolCode, transaction);

    const whereClause = assignment.userId
      ? { userId: assignment.userId }
      : assignment.username
        ? { username: assignment.username }
        : { email: assignment.email };

    const user = await User.findOne({ where: whereClause, transaction });
    if (!user) {
      throw new Error(
        `User not found for assignment (${JSON.stringify(whereClause)} -> ${assignment.schoolCode})`
      );
    }

    user.schoolConfigId = school.id;
    user.municipalityId = school.municipalityId || user.municipalityId;
    await user.save({ transaction });

    logger.info('User school assignment updated', {
      userId: user.userId,
      username: user.username,
      schoolCode: school.schoolCode,
    });
  }
}

async function applyDefaultSchoolForUnassignedUsers(
  schoolCode: string,
  transaction: Transaction
): Promise<void> {
  const school = await resolveSchoolByCode(schoolCode, transaction);

  const [updatedCount] = await User.update(
    {
      schoolConfigId: school.id,
      municipalityId: school.municipalityId,
    },
    {
      where: {
        schoolConfigId: null,
        role: {
          [Op.ne]: UserRole.MUNICIPALITY_ADMIN,
        },
      } as any,
      transaction,
    }
  );

  logger.info('Default school assigned to unassigned users', {
    schoolCode: school.schoolCode,
    updatedCount,
  });
}

async function run(): Promise<void> {
  const { configPath, apply } = parseArgs();
  const config = readConfig(configPath);

  logger.info('Municipality tenancy script started', {
    mode: apply ? 'APPLY' : 'DRY_RUN',
    configPath,
  });

  await sequelize.authenticate();
  const execute = async (transaction: Transaction): Promise<void> => {
    for (const municipality of config.municipalities) {
      await upsertMunicipalityWithSchoolsAndAdmins(municipality, transaction);
    }

    if (config.userAssignments?.length) {
      await applyUserAssignments(config.userAssignments, transaction);
    }

    if (config.defaultSchoolCodeForUnassignedUsers) {
      await applyDefaultSchoolForUnassignedUsers(
        config.defaultSchoolCodeForUnassignedUsers,
        transaction
      );
    }
  };

  if (apply) {
    await sequelize.transaction(async transaction => {
      await execute(transaction);
    });
    logger.info('Municipality tenancy script completed and committed');
    return;
  }

  const dryRunRollbackError = '__DRY_RUN_ROLLBACK__';
  try {
    await sequelize.transaction(async transaction => {
      await execute(transaction);
      throw new Error(dryRunRollbackError);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message !== dryRunRollbackError) {
      throw error;
    }
  }
  logger.info('Dry-run completed. No data was committed');
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Municipality tenancy script failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });

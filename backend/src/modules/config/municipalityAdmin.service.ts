import { Op } from 'sequelize';
import Municipality from '@models/Municipality.model';
import SchoolConfig, { SchoolConfigCreationAttributes } from '@models/SchoolConfig.model';
import User, { UserRole, UserStatus } from '@models/User.model';
import auditLogger from '@utils/auditLogger';
import { AuditAction } from '@models/AuditLog.model';
import { AuthorizationError, NotFoundError, ValidationError } from '@middleware/errorHandler';
import sequelize from '@config/database';
import { runWithTenantContext } from '@middleware/tenantContext';
import { seedSchoolFoundation } from './schoolFoundationSeeder';

interface MunicipalityAdminContext {
  userId: number;
  municipalityId?: string;
  isSystemAccount?: boolean;
}

interface CreateSchoolAdminData {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

interface MunicipalityIncident {
  id: string;
  category: 'school' | 'user';
  severity: 'medium' | 'high';
  title: string;
  description: string;
  entityId: string | number;
  occurredAt: Date;
}

class MunicipalityAdminService {
  private assertSystemAccount(context: MunicipalityAdminContext): void {
    if (!context.isSystemAccount) {
      throw new AuthorizationError('This operation is reserved for the protected system account');
    }
  }

  private runInSchoolScope<T>(school: SchoolConfig, userId: number, callback: () => Promise<T>): Promise<T> {
    return runWithTenantContext({
      userId,
      role: UserRole.MUNICIPALITY_ADMIN,
      municipalityId: school.municipalityId,
      schoolConfigIds: [String(school.id)],
      enforceIsolation: true,
    }, callback);
  }

  async getPlatformMunicipalities(context: MunicipalityAdminContext): Promise<Array<Record<string, unknown>>> {
    this.assertSystemAccount(context);
    const rows = await Municipality.findAll({
      where: { isActive: true },
      attributes: ['id', 'nameEn', 'nameNp', 'code', 'district', 'province'],
      order: [['nameEn', 'ASC']],
      raw: true,
    } as any);
    return rows as unknown as Array<Record<string, unknown>>;
  }

  private async resolveMunicipalityScope(context: MunicipalityAdminContext): Promise<Municipality> {
    if (!context.municipalityId) {
      throw new ValidationError(
        'Your account is not assigned to any municipality. Please contact a system administrator.'
      );
    }

    const municipality = await Municipality.findOne({
      where: { id: context.municipalityId, isActive: true },
    });

    if (!municipality) {
      throw new NotFoundError('Municipality');
    }

    return municipality;
  }

  private async findMunicipalitySchoolOrThrow(
    schoolId: string,
    municipalityId: string,
    isSystemAccount = false
  ): Promise<SchoolConfig> {
    const school = await SchoolConfig.findOne(isSystemAccount
      ? { where: { id: schoolId }, skipTenantIsolation: true } as any
      : { where: { id: schoolId, municipalityId } });

    if (!school) {
      throw new NotFoundError('School configuration');
    }

    return school;
  }

  async getDashboard(context: MunicipalityAdminContext): Promise<Record<string, unknown>> {
    if (context.isSystemAccount) {
      this.assertSystemAccount(context);
      const [schools, users] = await Promise.all([
        SchoolConfig.findAll({
          attributes: ['id', 'schoolNameEn', 'schoolCode', 'isActive', 'createdAt'],
          order: [['createdAt', 'DESC']],
          skipTenantIsolation: true,
        } as any),
        User.findAll({
          where: { role: UserRole.SCHOOL_ADMIN },
          attributes: ['userId', 'status'],
          skipTenantIsolation: true,
        } as any),
      ]);
      const activeSchools = schools.filter((school) => school.isActive).length;
      return {
        municipality: { nameEn: 'All Schools', code: 'PLATFORM', district: 'Platform-wide' },
        systemHealth: { api: 'online', database: 'online', checkedAt: new Date().toISOString() },
        summary: {
          totalSchools: schools.length,
          activeSchools,
          inactiveSchools: schools.length - activeSchools,
          totalUsers: users.length,
          activeSchoolAdmins: users.filter((user) => user.status === UserStatus.ACTIVE).length,
        },
        recentSchools: schools.slice(0, 5),
      };
    }
    const municipality = await this.resolveMunicipalityScope(context);

    const totalSchools = await SchoolConfig.count({
      where: { municipalityId: municipality.id },
    });

    const activeSchools = await SchoolConfig.count({
      where: { municipalityId: municipality.id, isActive: true },
    });

    const totalUsers = await User.count({
      where: { municipalityId: municipality.id },
    });

    const activeSchoolAdmins = await User.count({
      where: {
        municipalityId: municipality.id,
        role: UserRole.SCHOOL_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    const recentSchools = await SchoolConfig.findAll({
      where: { municipalityId: municipality.id },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'schoolNameEn', 'schoolCode', 'isActive', 'createdAt'],
    });

    return {
      municipality: {
        id: municipality.id,
        nameEn: municipality.nameEn,
        nameNp: municipality.nameNp,
        code: municipality.code,
        district: municipality.district,
        province: municipality.province,
      },
      summary: {
        totalSchools,
        activeSchools,
        inactiveSchools: Math.max(totalSchools - activeSchools, 0),
        totalUsers,
        activeSchoolAdmins,
      },
      recentSchools,
    };
  }

  async getSchools(
    context: MunicipalityAdminContext,
    includeInactive = false
  ): Promise<SchoolConfig[]> {
    if (context.isSystemAccount) {
      this.assertSystemAccount(context);
      return SchoolConfig.findAll({
        where: includeInactive ? {} : { isActive: true },
        order: [['schoolNameEn', 'ASC']],
        skipTenantIsolation: true,
      } as any);
    }
    const municipality = await this.resolveMunicipalityScope(context);
    const whereClause: Record<string, unknown> = { municipalityId: municipality.id };

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    return SchoolConfig.findAll({
      where: whereClause,
      order: [['schoolNameEn', 'ASC']],
    });
  }

  async createSchool(
    context: MunicipalityAdminContext,
    data: SchoolConfigCreationAttributes & { municipalityId?: string }
  ): Promise<SchoolConfig> {
    const municipality = context.isSystemAccount && data.municipalityId
      ? await Municipality.findOne({
        where: { id: data.municipalityId, isActive: true },
        skipTenantIsolation: true,
      } as any)
      : await this.resolveMunicipalityScope(context);
    if (!municipality) throw new NotFoundError('Municipality');

    if (data.schoolCode) {
      const existingByCode = await SchoolConfig.findOne({
        where: { schoolCode: data.schoolCode },
        ...(context.isSystemAccount ? { skipTenantIsolation: true } : {}),
      } as any);

      if (existingByCode) {
        throw new ValidationError('A school with this code already exists');
      }
    }

    const { school, foundation } = await sequelize.transaction(async (transaction) => {
      const createdSchool = await SchoolConfig.create({
        ...data,
        municipalityId: municipality.id,
        isActive: data.isActive ?? true,
        academicYearStartMonth: data.academicYearStartMonth ?? 1,
        academicYearDurationMonths: data.academicYearDurationMonths ?? 12,
        termsPerYear: data.termsPerYear ?? 3,
        defaultCalendarSystem: data.defaultCalendarSystem ?? 'BS',
        defaultLanguage: data.defaultLanguage ?? 'nepali',
        timezone: data.timezone ?? 'Asia/Kathmandu',
        currency: data.currency ?? 'NPR',
        dateFormat: data.dateFormat ?? 'YYYY-MM-DD',
        timeFormat: data.timeFormat ?? 'HH:mm',
        numberFormat: data.numberFormat ?? 'en-US',
      }, { transaction });

      const seededFoundation = await runWithTenantContext({
        userId: context.userId,
        role: UserRole.MUNICIPALITY_ADMIN,
        municipalityId: municipality.id,
        schoolConfigIds: [String(createdSchool.id)],
        enforceIsolation: true,
      }, () => seedSchoolFoundation(String(createdSchool.id), municipality.id, transaction));

      return { school: createdSchool, foundation: seededFoundation };
    });

    await runWithTenantContext({
      userId: context.userId,
      role: UserRole.MUNICIPALITY_ADMIN,
      municipalityId: municipality.id,
      schoolConfigIds: [String(school.id)],
      enforceIsolation: true,
    }, () => auditLogger.log({
      userId: context.userId,
      entityType: 'school_config',
      entityId: school.id as any,
      action: AuditAction.CREATE,
      newValue: {
        schoolNameEn: school.schoolNameEn,
        schoolCode: school.schoolCode,
        municipalityId: school.municipalityId,
        foundationSeeded: foundation,
      },
    }));

    return school;
  }

  async updateSchool(
    context: MunicipalityAdminContext,
    schoolId: string,
    data: Partial<SchoolConfigCreationAttributes>
  ): Promise<SchoolConfig> {
    const municipality = context.isSystemAccount ? null : await this.resolveMunicipalityScope(context);
    const school = await this.findMunicipalitySchoolOrThrow(schoolId, municipality?.id || '', context.isSystemAccount);

    if (data.schoolCode && data.schoolCode !== school.schoolCode) {
      const duplicate = await SchoolConfig.findOne({
        where: {
          schoolCode: data.schoolCode,
          id: {
            [Op.ne]: school.id,
          },
        },
        ...(context.isSystemAccount ? { skipTenantIsolation: true } : {}),
      } as any);

      if (duplicate) {
        throw new ValidationError('A school with this code already exists');
      }
    }

    const oldValue = school.toJSON();
    await this.runInSchoolScope(school, context.userId, async () => {
      await school.update(data);
      await auditLogger.log({
        userId: context.userId,
        entityType: 'school_config',
        entityId: school.id as any,
        action: AuditAction.UPDATE,
        oldValue,
        newValue: data,
      });
    });

    return school;
  }

  async setSchoolActiveState(
    context: MunicipalityAdminContext,
    schoolId: string,
    isActive: boolean
  ): Promise<SchoolConfig> {
    const municipality = context.isSystemAccount ? null : await this.resolveMunicipalityScope(context);
    const school = await this.findMunicipalitySchoolOrThrow(schoolId, municipality?.id || '', context.isSystemAccount);

    const oldValue = school.toJSON();
    await this.runInSchoolScope(school, context.userId, async () => {
      await school.update({ isActive });
      await auditLogger.log({
        userId: context.userId,
        entityType: 'school_config',
        entityId: school.id as any,
        action: AuditAction.UPDATE,
        oldValue,
        newValue: { isActive },
      });
    });

    return school;
  }

  async getMunicipalityUsers(
    context: MunicipalityAdminContext,
    role?: UserRole
  ): Promise<Array<Record<string, unknown>>> {
    if (context.isSystemAccount) {
      this.assertSystemAccount(context);
      const where: Record<string, unknown> = {};
      if (role) where.role = role;
      const users = await User.findAll({
        where,
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken', 'passwordResetExpires'] },
        skipTenantIsolation: true,
      } as any);
      return users.map((user) => user.toJSON() as unknown as Record<string, unknown>);
    }
    const municipality = await this.resolveMunicipalityScope(context);
    const whereClause: Record<string, unknown> = { municipalityId: municipality.id };

    if (role) {
      whereClause.role = role;
    }

    const users = await User.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      attributes: {
        exclude: ['password', 'refreshToken', 'passwordResetToken', 'passwordResetExpires'],
      },
    });

    return users.map((user) => user.toJSON() as unknown as Record<string, unknown>);
  }

  async getReports(context: MunicipalityAdminContext): Promise<Record<string, unknown>> {
    if (context.isSystemAccount) {
      this.assertSystemAccount(context);
      const [totalSchools, activeSchools, totalUsers, activeUsers, inactiveUsers, suspendedUsers,
        lockedUsers, schoolAdmins, teachers, students, parents, supportStaff] = await Promise.all([
        SchoolConfig.count({ skipTenantIsolation: true } as any),
        SchoolConfig.count({ where: { isActive: true }, skipTenantIsolation: true } as any),
        User.count({ skipTenantIsolation: true } as any),
        User.count({ where: { status: UserStatus.ACTIVE }, skipTenantIsolation: true } as any),
        User.count({ where: { status: UserStatus.INACTIVE }, skipTenantIsolation: true } as any),
        User.count({ where: { status: UserStatus.SUSPENDED }, skipTenantIsolation: true } as any),
        User.count({ where: { status: UserStatus.LOCKED }, skipTenantIsolation: true } as any),
        User.count({ where: { role: UserRole.SCHOOL_ADMIN }, skipTenantIsolation: true } as any),
        User.count({ where: { role: { [Op.in]: [UserRole.CLASS_TEACHER, UserRole.SUBJECT_TEACHER, UserRole.DEPARTMENT_HEAD] } }, skipTenantIsolation: true } as any),
        User.count({ where: { role: UserRole.STUDENT }, skipTenantIsolation: true } as any),
        User.count({ where: { role: UserRole.PARENT }, skipTenantIsolation: true } as any),
        User.count({ where: { role: { [Op.in]: [UserRole.ECA_COORDINATOR, UserRole.SPORTS_COORDINATOR, UserRole.LIBRARIAN, UserRole.ACCOUNTANT, UserRole.TRANSPORT_MANAGER, UserRole.HOSTEL_WARDEN, UserRole.NON_TEACHING_STAFF] } }, skipTenantIsolation: true } as any),
      ]);
      return {
        municipality: { nameEn: 'All Schools', code: 'PLATFORM', district: 'Platform-wide' },
        schoolMetrics: { totalSchools: Number(totalSchools), activeSchools: Number(activeSchools), inactiveSchools: Math.max(Number(totalSchools) - Number(activeSchools), 0) },
        userMetrics: {
          totalUsers,
          byStatus: { active: activeUsers, inactive: inactiveUsers, suspended: suspendedUsers, locked: lockedUsers },
          byRole: { schoolAdmins, teachers, students, parents, supportStaff },
        },
      };
    }
    const municipality = await this.resolveMunicipalityScope(context);

    const [
      totalSchools,
      activeSchools,
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      lockedUsers,
      schoolAdmins,
      teachers,
      students,
      parents,
      supportStaff,
    ] = await Promise.all([
      SchoolConfig.count({ where: { municipalityId: municipality.id } }),
      SchoolConfig.count({ where: { municipalityId: municipality.id, isActive: true } }),
      User.count({ where: { municipalityId: municipality.id } }),
      User.count({
        where: { municipalityId: municipality.id, status: UserStatus.ACTIVE },
      }),
      User.count({
        where: { municipalityId: municipality.id, status: UserStatus.INACTIVE },
      }),
      User.count({
        where: { municipalityId: municipality.id, status: UserStatus.SUSPENDED },
      }),
      User.count({
        where: { municipalityId: municipality.id, status: UserStatus.LOCKED },
      }),
      User.count({
        where: { municipalityId: municipality.id, role: UserRole.SCHOOL_ADMIN },
      }),
      User.count({
        where: {
          municipalityId: municipality.id,
          role: {
            [Op.in]: [
              UserRole.CLASS_TEACHER,
              UserRole.SUBJECT_TEACHER,
              UserRole.DEPARTMENT_HEAD,
            ],
          },
        },
      }),
      User.count({
        where: { municipalityId: municipality.id, role: UserRole.STUDENT },
      }),
      User.count({
        where: { municipalityId: municipality.id, role: UserRole.PARENT },
      }),
      User.count({
        where: {
          municipalityId: municipality.id,
          role: {
            [Op.in]: [
              UserRole.ECA_COORDINATOR,
              UserRole.SPORTS_COORDINATOR,
              UserRole.LIBRARIAN,
              UserRole.ACCOUNTANT,
              UserRole.TRANSPORT_MANAGER,
              UserRole.HOSTEL_WARDEN,
              UserRole.NON_TEACHING_STAFF,
            ],
          },
        },
      }),
    ]);

    return {
      municipality: {
        id: municipality.id,
        nameEn: municipality.nameEn,
        code: municipality.code,
        district: municipality.district,
      },
      schoolMetrics: {
        totalSchools,
        activeSchools,
        inactiveSchools: Math.max(totalSchools - activeSchools, 0),
      },
      userMetrics: {
        totalUsers,
        byStatus: {
          active: activeUsers,
          inactive: inactiveUsers,
          suspended: suspendedUsers,
          locked: lockedUsers,
        },
        byRole: {
          schoolAdmins,
          teachers,
          students,
          parents,
          supportStaff,
        },
      },
    };
  }

  async getIncidents(
    context: MunicipalityAdminContext,
    limit = 20
  ): Promise<Record<string, unknown>> {
    const municipality = context.isSystemAccount ? null : await this.resolveMunicipalityScope(context);
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    const [inactiveSchools, flaggedUsers] = await Promise.all([
      SchoolConfig.findAll({
        where: { ...(municipality ? { municipalityId: municipality.id } : {}), isActive: false },
        order: [['updatedAt', 'DESC']],
        limit: safeLimit,
        attributes: ['id', 'schoolNameEn', 'schoolCode', 'updatedAt', 'createdAt'],
        ...(context.isSystemAccount ? { skipTenantIsolation: true } : {}),
      }),
      User.findAll({
        where: {
          ...(municipality ? { municipalityId: municipality.id } : {}),
          status: {
            [Op.in]: [UserStatus.INACTIVE, UserStatus.SUSPENDED, UserStatus.LOCKED],
          },
        },
        order: [['updatedAt', 'DESC']],
        limit: safeLimit,
        attributes: [
          'userId',
          'username',
          'email',
          'role',
          'status',
          'schoolConfigId',
          'updatedAt',
          'createdAt',
        ],
        ...(context.isSystemAccount ? { skipTenantIsolation: true } : {}),
      }),
    ]);

    const schoolIncidents: MunicipalityIncident[] = inactiveSchools.map((school) => ({
      id: `school-${school.id}`,
      category: 'school',
      severity: 'medium',
      title: 'School is inactive',
      description: `${school.schoolNameEn} (${school.schoolCode || 'No code'}) is currently inactive.`,
      entityId: school.id,
      occurredAt: school.updatedAt || school.createdAt,
    }));

    const userIncidents: MunicipalityIncident[] = flaggedUsers.map((user) => ({
      id: `user-${user.userId}`,
      category: 'user',
      severity:
        user.status === UserStatus.SUSPENDED || user.status === UserStatus.LOCKED
          ? 'high'
          : 'medium',
      title: `User status: ${user.status}`,
      description: `${user.username} (${user.email}) is marked as ${user.status}.`,
      entityId: user.userId,
      occurredAt: user.updatedAt || user.createdAt,
    }));

    const incidents = [...schoolIncidents, ...userIncidents]
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, safeLimit);

    return {
      municipality: municipality ? {
        id: municipality.id,
        nameEn: municipality.nameEn,
        code: municipality.code,
      } : { nameEn: 'All Schools', code: 'PLATFORM' },
      summary: {
        totalIncidents: incidents.length,
        inactiveSchools: schoolIncidents.length,
        flaggedUsers: userIncidents.length,
      },
      incidents,
    };
  }

  async createSchoolAdmin(
    context: MunicipalityAdminContext,
    schoolId: string,
    data: CreateSchoolAdminData
  ): Promise<Record<string, unknown>> {
    const municipality = context.isSystemAccount ? null : await this.resolveMunicipalityScope(context);
    const school = await this.findMunicipalitySchoolOrThrow(schoolId, municipality?.id || '', context.isSystemAccount);

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username: data.username }, { email: data.email }],
      },
      ...(context.isSystemAccount ? { skipTenantIsolation: true } : {}),
    } as any);

    if (existingUser) {
      throw new ValidationError('Username or email already exists');
    }

    const user = await this.runInSchoolScope(school, context.userId, () => User.create({
      username: data.username,
      email: data.email,
      password: data.password,
      role: UserRole.SCHOOL_ADMIN,
      status: UserStatus.ACTIVE,
      municipalityId: school.municipalityId,
      schoolConfigId: school.id,
      phoneNumber: data.phoneNumber,
      failedLoginAttempts: 0,
    }));

    await this.runInSchoolScope(school, context.userId, () => auditLogger.log({
      userId: context.userId,
      entityType: 'user',
      entityId: user.userId,
      action: AuditAction.CREATE,
      newValue: {
        userId: user.userId,
        role: user.role,
        municipalityId: user.municipalityId,
        schoolConfigId: user.schoolConfigId,
      },
    }));

    const userJson = user.toJSON() as unknown as Record<string, unknown>;
    delete userJson.password;
    delete userJson.refreshToken;

    return userJson;
  }

  async issuePasswordResetLink(
    context: MunicipalityAdminContext,
    userId: number
  ): Promise<{ userId: number; username: string; resetUrl: string; expiresAt: Date }> {
    this.assertSystemAccount(context);
    if (userId === context.userId) {
      throw new ValidationError('Use your own account password-change or recovery flow for this account.');
    }

    const user = await User.findOne({
      where: { userId, role: UserRole.SCHOOL_ADMIN, isSystemAccount: false },
      skipTenantIsolation: true,
    } as any);
    if (!user) {
      throw new NotFoundError('School administrator');
    }
    if (!user.schoolConfigId) throw new NotFoundError('School administrator');
    return this.issueSchoolAdminPasswordResetLink(context, user.schoolConfigId, user.userId);
  }

  async getSchoolAdmins(context: MunicipalityAdminContext, schoolId: string): Promise<Array<Record<string, unknown>>> {
    this.assertSystemAccount(context);
    const school = await this.findMunicipalitySchoolOrThrow(schoolId, '', true);
    const users = await User.findAll({
      where: { schoolConfigId: school.id, role: UserRole.SCHOOL_ADMIN, isSystemAccount: false },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken', 'passwordResetExpires'] },
      skipTenantIsolation: true,
    } as any);
    return users.map((user) => user.toJSON() as unknown as Record<string, unknown>);
  }

  async issueSchoolAdminPasswordResetLink(
    context: MunicipalityAdminContext,
    schoolId: string,
    userId: number
  ): Promise<{ userId: number; username: string; resetUrl: string; expiresAt: Date }> {
    this.assertSystemAccount(context);
    const school = await this.findMunicipalitySchoolOrThrow(schoolId, '', true);
    if (userId === context.userId) {
      throw new ValidationError('Use your own account password-change or recovery flow for this account.');
    }
    const user = await User.findOne({
      where: {
        userId,
        schoolConfigId: school.id,
        role: UserRole.SCHOOL_ADMIN,
        isSystemAccount: false,
      },
      skipTenantIsolation: true,
    } as any);
    if (!user) throw new NotFoundError('School administrator');

    const { token, expiresAt } = await this.runInSchoolScope(school, context.userId, async () => {
      const generatedToken = await user.generatePasswordResetToken();
      return { token: generatedToken, expiresAt: user.passwordResetExpires! };
    });
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    await this.runInSchoolScope(school, context.userId, () => auditLogger.log({
      userId: context.userId,
      entityType: 'user',
      entityId: user.userId,
      action: AuditAction.UPDATE,
      newValue: { action: 'school_admin_password_reset_link_issued', schoolConfigId: school.id },
    }));

    return { userId: user.userId, username: user.username, resetUrl, expiresAt };
  }
}

export default new MunicipalityAdminService();

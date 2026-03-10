import { Op } from 'sequelize';
import Municipality from '@models/Municipality.model';
import SchoolConfig, { SchoolConfigCreationAttributes } from '@models/SchoolConfig.model';
import User, { UserRole, UserStatus } from '@models/User.model';
import auditLogger from '@utils/auditLogger';
import { AuditAction } from '@models/AuditLog.model';
import { NotFoundError, ValidationError } from '@middleware/errorHandler';

interface MunicipalityAdminContext {
  userId: number;
  municipalityId?: string;
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
    municipalityId: string
  ): Promise<SchoolConfig> {
    const school = await SchoolConfig.findOne({
      where: { id: schoolId, municipalityId },
    });

    if (!school) {
      throw new NotFoundError('School configuration');
    }

    return school;
  }

  async getDashboard(context: MunicipalityAdminContext): Promise<Record<string, unknown>> {
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
    data: SchoolConfigCreationAttributes
  ): Promise<SchoolConfig> {
    const municipality = await this.resolveMunicipalityScope(context);

    if (data.schoolCode) {
      const existingByCode = await SchoolConfig.findOne({
        where: { schoolCode: data.schoolCode },
      });

      if (existingByCode) {
        throw new ValidationError('A school with this code already exists');
      }
    }

    const school = await SchoolConfig.create({
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
    });

    await auditLogger.log({
      userId: context.userId,
      entityType: 'school_config',
      entityId: school.id as any,
      action: AuditAction.CREATE,
      newValue: {
        schoolNameEn: school.schoolNameEn,
        schoolCode: school.schoolCode,
        municipalityId: school.municipalityId,
      },
    });

    return school;
  }

  async updateSchool(
    context: MunicipalityAdminContext,
    schoolId: string,
    data: Partial<SchoolConfigCreationAttributes>
  ): Promise<SchoolConfig> {
    const municipality = await this.resolveMunicipalityScope(context);
    const school = await this.findMunicipalitySchoolOrThrow(schoolId, municipality.id);

    if (data.schoolCode && data.schoolCode !== school.schoolCode) {
      const duplicate = await SchoolConfig.findOne({
        where: {
          schoolCode: data.schoolCode,
          id: {
            [Op.ne]: school.id,
          },
        },
      });

      if (duplicate) {
        throw new ValidationError('A school with this code already exists');
      }
    }

    const oldValue = school.toJSON();
    await school.update(data);

    await auditLogger.log({
      userId: context.userId,
      entityType: 'school_config',
      entityId: school.id as any,
      action: AuditAction.UPDATE,
      oldValue,
      newValue: data,
    });

    return school;
  }

  async setSchoolActiveState(
    context: MunicipalityAdminContext,
    schoolId: string,
    isActive: boolean
  ): Promise<SchoolConfig> {
    const municipality = await this.resolveMunicipalityScope(context);
    const school = await this.findMunicipalitySchoolOrThrow(schoolId, municipality.id);

    const oldValue = school.toJSON();
    await school.update({ isActive });

    await auditLogger.log({
      userId: context.userId,
      entityType: 'school_config',
      entityId: school.id as any,
      action: AuditAction.UPDATE,
      oldValue,
      newValue: { isActive },
    });

    return school;
  }

  async getMunicipalityUsers(
    context: MunicipalityAdminContext,
    role?: UserRole
  ): Promise<Array<Record<string, unknown>>> {
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
    const municipality = await this.resolveMunicipalityScope(context);
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    const [inactiveSchools, flaggedUsers] = await Promise.all([
      SchoolConfig.findAll({
        where: { municipalityId: municipality.id, isActive: false },
        order: [['updatedAt', 'DESC']],
        limit: safeLimit,
        attributes: ['id', 'schoolNameEn', 'schoolCode', 'updatedAt', 'createdAt'],
      }),
      User.findAll({
        where: {
          municipalityId: municipality.id,
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
      municipality: {
        id: municipality.id,
        nameEn: municipality.nameEn,
        code: municipality.code,
      },
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
    const municipality = await this.resolveMunicipalityScope(context);
    const school = await this.findMunicipalitySchoolOrThrow(schoolId, municipality.id);

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username: data.username }, { email: data.email }],
      },
    });

    if (existingUser) {
      throw new ValidationError('Username or email already exists');
    }

    const user = await User.create({
      username: data.username,
      email: data.email,
      password: data.password,
      role: UserRole.SCHOOL_ADMIN,
      status: UserStatus.ACTIVE,
      municipalityId: municipality.id,
      schoolConfigId: school.id,
      phoneNumber: data.phoneNumber,
      failedLoginAttempts: 0,
    });

    await auditLogger.log({
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
    });

    const userJson = user.toJSON() as unknown as Record<string, unknown>;
    delete userJson.password;
    delete userJson.refreshToken;

    return userJson;
  }
}

export default new MunicipalityAdminService();

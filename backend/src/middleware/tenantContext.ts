import { AsyncLocalStorage } from 'async_hooks';
import SchoolConfig from '@models/SchoolConfig.model';
import { UserRole } from '@models/User.model';
import { logger } from '@utils/logger';

export interface TenantContextStore {
  userId?: number;
  role?: UserRole;
  municipalityId?: string;
  schoolConfigIds?: string[];
  enforceIsolation: boolean;
}

export interface TenantUserContext {
  userId: number;
  role: UserRole;
  municipalityId?: string;
  schoolConfigId?: string;
}

const tenantStorage = new AsyncLocalStorage<TenantContextStore>();

const SCHOOL_SCOPED_ROLES = new Set<UserRole>([
  UserRole.SCHOOL_ADMIN,
  UserRole.SUBJECT_TEACHER,
  UserRole.CLASS_TEACHER,
  UserRole.DEPARTMENT_HEAD,
  UserRole.ECA_COORDINATOR,
  UserRole.SPORTS_COORDINATOR,
  UserRole.STUDENT,
  UserRole.PARENT,
  UserRole.LIBRARIAN,
  UserRole.ACCOUNTANT,
  UserRole.TRANSPORT_MANAGER,
  UserRole.HOSTEL_WARDEN,
  UserRole.NON_TEACHING_STAFF,
]);

export const getTenantContext = (): TenantContextStore | undefined => {
  return tenantStorage.getStore();
};

export const runWithTenantContext = (
  context: TenantContextStore,
  callback: () => void
): void => {
  tenantStorage.run(context, callback);
};

export const resolveTenantContext = async (
  user?: TenantUserContext
): Promise<TenantContextStore> => {
  if (!user) {
    return { enforceIsolation: false };
  }

  if (user.role === UserRole.MUNICIPALITY_ADMIN) {
    if (!user.municipalityId) {
      logger.warn('Municipality admin authenticated without municipalityId', {
        userId: user.userId,
      });
      return {
        userId: user.userId,
        role: user.role,
        enforceIsolation: true,
        schoolConfigIds: [],
      };
    }

    const schools = await SchoolConfig.findAll({
      attributes: ['id'],
      where: {
        municipalityId: user.municipalityId,
        isActive: true,
      },
      raw: true,
    });

    const schoolConfigIds = schools
      .map(row => String((row as { id: string }).id))
      .filter(Boolean);

    return {
      userId: user.userId,
      role: user.role,
      municipalityId: user.municipalityId,
      schoolConfigIds,
      enforceIsolation: true,
    };
  }

  if (SCHOOL_SCOPED_ROLES.has(user.role)) {
    return {
      userId: user.userId,
      role: user.role,
      municipalityId: user.municipalityId,
      schoolConfigIds: user.schoolConfigId ? [user.schoolConfigId] : [],
      enforceIsolation: true,
    };
  }

  return {
    userId: user.userId,
    role: user.role,
    municipalityId: user.municipalityId,
    enforceIsolation: false,
  };
};

import 'dotenv/config';
import sequelize from '../config/database';
import Role from '../models/Role.model';
import Permission from '../models/Permission.model';
import '../models/RolePermission.model';
import { logger } from '../utils/logger';

const systemRoles = [
  { name: 'School Admin', code: 'SCHOOL_ADMIN', description: 'Full administrative access to all modules', isSystem: true },
  { name: 'Class Teacher', code: 'CLASS_TEACHER', description: 'Manages a specific class: attendance, grades, communication', isSystem: true },
  { name: 'Subject Teacher', code: 'SUBJECT_TEACHER', description: 'Teaches specific subjects; marks attendance and grades', isSystem: true },
  { name: 'Department Head', code: 'DEPARTMENT_HEAD', description: 'Oversees an academic department; access to reports', isSystem: true },
  { name: 'ECA Coordinator', code: 'ECA_COORDINATOR', description: 'Manages extra-curricular activities', isSystem: true },
  { name: 'Sports Coordinator', code: 'SPORTS_COORDINATOR', description: 'Manages sports teams, tournaments, and achievements', isSystem: true },
  { name: 'Student', code: 'STUDENT', description: 'Read-only access to own academic data', isSystem: true },
  { name: 'Parent', code: 'PARENT', description: 'Read-only access to child academic data', isSystem: true },
  { name: 'Librarian', code: 'LIBRARIAN', description: 'Manages library books, circulation, and fines', isSystem: true },
  { name: 'Accountant', code: 'ACCOUNTANT', description: 'Manages fee collection, invoices, and financial reports', isSystem: true },
  { name: 'Transport Manager', code: 'TRANSPORT_MANAGER', description: 'Manages student transport logistics', isSystem: true },
  { name: 'Hostel Warden', code: 'HOSTEL_WARDEN', description: 'Manages hostel residents and facilities', isSystem: true },
  { name: 'Non-Teaching Staff', code: 'NON_TEACHING_STAFF', description: 'General staff with limited access to communication and documents', isSystem: true },
];

const systemPermissions = [
  { name: 'Create Student', code: 'student:create', category: 'student', action: 'create', resource: 'student', isSystem: true },
  { name: 'Read Student', code: 'student:read', category: 'student', action: 'read', resource: 'student', isSystem: true },
  { name: 'Update Student', code: 'student:update', category: 'student', action: 'update', resource: 'student', isSystem: true },
  { name: 'Delete Student', code: 'student:delete', category: 'student', action: 'delete', resource: 'student', isSystem: true },
  { name: 'Manage Students', code: 'student:manage', category: 'student', action: 'manage', resource: 'student', isSystem: true },

  { name: 'Create Staff', code: 'staff:create', category: 'staff', action: 'create', resource: 'staff', isSystem: true },
  { name: 'Read Staff', code: 'staff:read', category: 'staff', action: 'read', resource: 'staff', isSystem: true },
  { name: 'Update Staff', code: 'staff:update', category: 'staff', action: 'update', resource: 'staff', isSystem: true },
  { name: 'Delete Staff', code: 'staff:delete', category: 'staff', action: 'delete', resource: 'staff', isSystem: true },

  { name: 'Read Academic', code: 'academic:read', category: 'academic', action: 'read', resource: 'academic', isSystem: true },
  { name: 'Manage Academic', code: 'academic:manage', category: 'academic', action: 'manage', resource: 'academic', isSystem: true },

  { name: 'Mark Attendance', code: 'attendance:create', category: 'attendance', action: 'create', resource: 'attendance', isSystem: true },
  { name: 'Read Attendance', code: 'attendance:read', category: 'attendance', action: 'read', resource: 'attendance', isSystem: true },
  { name: 'Manage Attendance', code: 'attendance:manage', category: 'attendance', action: 'manage', resource: 'attendance', isSystem: true },

  { name: 'Create Exam', code: 'examination:create', category: 'examination', action: 'create', resource: 'examination', isSystem: true },
  { name: 'Read Exam', code: 'examination:read', category: 'examination', action: 'read', resource: 'examination', isSystem: true },
  { name: 'Enter Grades', code: 'examination:update', category: 'examination', action: 'update', resource: 'examination', isSystem: true },
  { name: 'Manage Examinations', code: 'examination:manage', category: 'examination', action: 'manage', resource: 'examination', isSystem: true },

  { name: 'Read Finance', code: 'finance:read', category: 'finance', action: 'read', resource: 'finance', isSystem: true },
  { name: 'Manage Finance', code: 'finance:manage', category: 'finance', action: 'manage', resource: 'finance', isSystem: true },

  { name: 'Read Library', code: 'library:read', category: 'library', action: 'read', resource: 'library', isSystem: true },
  { name: 'Manage Library', code: 'library:manage', category: 'library', action: 'manage', resource: 'library', isSystem: true },

  { name: 'Read ECA', code: 'eca:read', category: 'eca', action: 'read', resource: 'eca', isSystem: true },
  { name: 'Manage ECA', code: 'eca:manage', category: 'eca', action: 'manage', resource: 'eca', isSystem: true },

  { name: 'Read Sports', code: 'sports:read', category: 'sports', action: 'read', resource: 'sports', isSystem: true },
  { name: 'Manage Sports', code: 'sports:manage', category: 'sports', action: 'manage', resource: 'sports', isSystem: true },

  { name: 'Send Message', code: 'communication:create', category: 'communication', action: 'create', resource: 'communication', isSystem: true },
  { name: 'Read Communication', code: 'communication:read', category: 'communication', action: 'read', resource: 'communication', isSystem: true },

  { name: 'Read Documents', code: 'document:read', category: 'document', action: 'read', resource: 'document', isSystem: true },
  { name: 'Manage Documents', code: 'document:manage', category: 'document', action: 'manage', resource: 'document', isSystem: true },

  { name: 'Read Certificates', code: 'certificate:read', category: 'certificate', action: 'read', resource: 'certificate', isSystem: true },
  { name: 'Manage Certificates', code: 'certificate:manage', category: 'certificate', action: 'manage', resource: 'certificate', isSystem: true },

  { name: 'View Reports', code: 'report:read', category: 'report', action: 'read', resource: 'report', isSystem: true },
  { name: 'Manage Reports', code: 'report:manage', category: 'report', action: 'manage', resource: 'report', isSystem: true },

  { name: 'Manage System', code: 'system:manage', category: 'system', action: 'manage', resource: 'system', isSystem: true },

  { name: 'Read Transport', code: 'transport:read', category: 'transport', action: 'read', resource: 'transport', isSystem: true },
  { name: 'Manage Transport', code: 'transport:manage', category: 'transport', action: 'manage', resource: 'transport', isSystem: true },

  { name: 'Read Hostel', code: 'hostel:read', category: 'hostel', action: 'read', resource: 'hostel', isSystem: true },
  { name: 'Manage Hostel', code: 'hostel:manage', category: 'hostel', action: 'manage', resource: 'hostel', isSystem: true },
];

const rolePermissionMap: Record<string, string[]> = {
  SCHOOL_ADMIN: systemPermissions.map(p => p.code),
  CLASS_TEACHER: [
    'student:read', 'academic:read', 'attendance:create', 'attendance:read',
    'examination:create', 'examination:read', 'examination:update',
    'communication:create', 'communication:read', 'document:read', 'report:read',
    'certificate:read'
  ],
  SUBJECT_TEACHER: [
    'student:read', 'academic:read', 'attendance:create', 'attendance:read',
    'examination:create', 'examination:read', 'examination:update',
    'communication:create', 'communication:read', 'document:read'
  ],
  DEPARTMENT_HEAD: [
    'student:read', 'academic:read', 'attendance:read',
    'examination:read', 'communication:create', 'communication:read',
    'document:read', 'report:read', 'eca:read', 'sports:read'
  ],
  ECA_COORDINATOR: [
    'student:read', 'eca:read', 'eca:manage',
    'communication:create', 'communication:read', 'document:read', 'report:read'
  ],
  SPORTS_COORDINATOR: [
    'student:read', 'sports:read', 'sports:manage',
    'communication:create', 'communication:read', 'document:read', 'report:read'
  ],
  STUDENT: [
    'attendance:read', 'examination:read', 'communication:read',
    'library:read', 'document:read', 'certificate:read', 'eca:read', 'sports:read'
  ],
  PARENT: [
    'student:read', 'attendance:read', 'examination:read',
    'communication:read', 'document:read', 'certificate:read'
  ],
  LIBRARIAN: [
    'student:read', 'library:read', 'library:manage',
    'communication:create', 'communication:read', 'document:read', 'report:read'
  ],
  ACCOUNTANT: [
    'student:read', 'finance:read', 'finance:manage',
    'communication:create', 'communication:read', 'document:read', 'report:read'
  ],
  TRANSPORT_MANAGER: [
    'student:read', 'transport:read', 'transport:manage',
    'communication:create', 'communication:read', 'document:read'
  ],
  HOSTEL_WARDEN: [
    'student:read', 'hostel:read', 'hostel:manage',
    'communication:create', 'communication:read', 'document:read'
  ],
  NON_TEACHING_STAFF: [
    'communication:create', 'communication:read', 'document:read'
  ],
};

async function seedRolesAndPermissions(): Promise<void> {
  try {
    logger.info('Starting roles and permissions seeding...');
    await sequelize.authenticate();
    logger.info('Database connection established');

    const permissionInstances: Record<string, Permission> = {};

    for (const perm of systemPermissions) {
      const [instance, created] = await Permission.findOrCreate({
        where: { code: perm.code },
        defaults: perm as any
      });
      permissionInstances[perm.code] = instance;
      if (created) {
        logger.info(`Created permission: ${perm.code}`);
      }
    }

    for (const roleDef of systemRoles) {
      const [roleInstance, created] = await Role.findOrCreate({
        where: { code: roleDef.code },
        defaults: roleDef as any
      });

      if (created) {
        logger.info(`Created role: ${roleDef.code}`);
      }

      const permCodes = rolePermissionMap[roleDef.code] || [];
      const permInstances = permCodes.map(code => permissionInstances[code]).filter(Boolean);

      if (permInstances.length > 0) {
        await (roleInstance as any).setPermissions(permInstances);
        logger.info(`Assigned ${permInstances.length} permissions to ${roleDef.code}`);
      }
    }

    logger.info('Roles and permissions seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Roles and permissions seeding failed:', error);
    process.exit(1);
  }
}

seedRolesAndPermissions();

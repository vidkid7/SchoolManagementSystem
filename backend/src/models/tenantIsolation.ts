import { DataTypes, Model, ModelStatic, Op } from 'sequelize';
import { getTenantContext } from '@middleware/tenantContext';
import Admission from './Admission.model';
import { AcademicYear, Term } from './AcademicYear.model';
import Class from './Class.model';
import { Subject, ClassSubject } from './Subject.model';
import Student from './Student.model';
import Staff from './Staff.model';
import StaffAssignment from './StaffAssignment.model';
import StaffDocument from './StaffDocument.model';
import StaffAttendance from './StaffAttendance.model';
import AttendanceRecord from './AttendanceRecord.model';
import LeaveApplication from './LeaveApplication.model';
import Exam from './Exam.model';
import ExamSchedule from './ExamSchedule.model';
import Grade from './Grade.model';
import { FeeStructure, FeeComponent } from './FeeStructure.model';
import { Invoice, InvoiceItem } from './Invoice.model';
import { Payment, InstallmentPlan } from './Payment.model';
import Refund from './Refund.model';
import FeeReminder from './FeeReminder.model';
import Book from './Book.model';
import Circulation from './Circulation.model';
import Reservation from './Reservation.model';
import LibraryFine from './LibraryFine.model';
import Sport from './Sport.model';
import Team from './Team.model';
import Tournament from './Tournament.model';
import SportsEnrollment from './SportsEnrollment.model';
import SportsAchievement from './SportsAchievement.model';
import ECA from './ECA.model';
import ECAEvent from './ECAEvent.model';
import ECAEnrollment from './ECAEnrollment.model';
import ECAAchievement from './ECAAchievement.model';
import Event from './Event.model';
import Certificate from './Certificate.model';
import GradingScheme from './GradingScheme.model';
import NotificationTemplate from './NotificationTemplate.model';
import AuditLog from './AuditLog.model';
import ArchiveMetadata from './ArchiveMetadata.model';
import CertificateTemplate from './CertificateTemplate.model';
import Document from './Document.model';
import DocumentAccessLog from './DocumentAccessLog.model';
import { Timetable } from './Timetable.model';
import AcademicHistory from './AcademicHistory.model';
import Assignment from './Assignment.model';
import AssignmentSubmission from './AssignmentSubmission.model';
import LessonPlan from './LessonPlan.model';
import SyllabusProgress from './SyllabusProgress.model';
import HostelRoom from './HostelRoom.model';
import HostelResident from './HostelResident.model';
import HostelIncident from './HostelIncident.model';
import HostelVisitor from './HostelVisitor.model';

type TenantOptions = {
  where?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  skipTenantIsolation?: boolean;
};

const NO_ACCESS_TENANT_ID = '00000000-0000-0000-0000-000000000000';
const TENANT_HOOK_FLAG = Symbol.for('tenantHooksApplied');
const TENANT_MODEL_FLAG = Symbol.for('tenantAttributeApplied');

const TENANT_MODELS: Array<ModelStatic<Model>> = [
  Admission,
  AcademicYear,
  Term,
  Class,
  Subject,
  ClassSubject,
  Student,
  Staff,
  StaffAssignment,
  StaffDocument,
  StaffAttendance,
  AttendanceRecord,
  LeaveApplication,
  Exam,
  ExamSchedule,
  Grade,
  FeeStructure,
  FeeComponent,
  Invoice,
  InvoiceItem,
  Payment,
  InstallmentPlan,
  Refund,
  FeeReminder,
  Book,
  Circulation,
  Reservation,
  LibraryFine,
  Sport,
  Team,
  Tournament,
  SportsEnrollment,
  SportsAchievement,
  ECA,
  ECAEvent,
  ECAEnrollment,
  ECAAchievement,
  Event,
  Certificate,
  GradingScheme,
  NotificationTemplate,
  AuditLog,
  ArchiveMetadata,
  CertificateTemplate as unknown as ModelStatic<Model>,
  Document as unknown as ModelStatic<Model>,
  DocumentAccessLog as unknown as ModelStatic<Model>,
  Timetable as unknown as ModelStatic<Model>,
  AcademicHistory,
  Assignment,
  AssignmentSubmission,
  LessonPlan,
  SyllabusProgress,
  HostelRoom,
  HostelResident,
  HostelIncident,
  HostelVisitor,
];

function getScopedSchoolIds(): string[] | null {
  const context = getTenantContext();
  if (!context?.enforceIsolation) {
    return null;
  }

  return context.schoolConfigIds ?? [];
}

function getMunicipalityCondition(): Record<string, unknown> | null {
  const context = getTenantContext();
  if (!context?.enforceIsolation || !context.municipalityId) {
    return null;
  }
  // Use snake_case field names (actual DB column names) because these conditions
  // are added in hooks that fire AFTER Sequelize's mapOptionFieldNames has already
  // run — Sequelize won't re-map them, so they must match the column names directly.
  return { municipality_id: context.municipalityId };
}

function getTenantCondition(): Record<string, unknown> | null {
  const context = getTenantContext();
  if (!context?.enforceIsolation) return null;

  const conditions: Record<string, unknown> = {};

  // Use snake_case field names (actual DB column names) for the same reason as above.
  if (context.municipalityId) {
    conditions.municipality_id = context.municipalityId;
  }

  const scopedIds = context.schoolConfigIds ?? [];
  if (scopedIds.length === 1) {
    conditions.school_config_id = scopedIds[0];
  } else if (scopedIds.length > 1) {
    conditions.school_config_id = { [Op.in]: scopedIds };
  } else if (scopedIds.length === 0 && !context.municipalityId) {
    conditions.school_config_id = NO_ACCESS_TENANT_ID;
  }

  return Object.keys(conditions).length > 0 ? conditions : null;
}

function applyTenantFilter(options: TenantOptions): void {
  if (options?.skipTenantIsolation) {
    return;
  }

  const tenantCondition = getTenantCondition();
  if (!tenantCondition) {
    return;
  }

  if (!options.where) {
    options.where = tenantCondition;
    return;
  }

  options.where = {
    [Op.and]: [options.where, tenantCondition],
  };
}

function assertTenantWriteAccess(instance: Model, options?: TenantOptions): void {
  if (options?.skipTenantIsolation) {
    return;
  }

  const context = getTenantContext();
  if (!context?.enforceIsolation) {
    return;
  }

  // Validate and assign municipalityId using camelCase attribute names so
  // Sequelize applies the field mapping when persisting to the DB.
  if (context.municipalityId) {
    const existingMunicipalityId = instance.getDataValue('municipalityId') as string | undefined;
    if (existingMunicipalityId && existingMunicipalityId !== context.municipalityId) {
      throw new Error('Cross-municipality write blocked');
    }
    if (!existingMunicipalityId) {
      instance.setDataValue('municipalityId', context.municipalityId);
    }
  }

  // Validate and assign schoolConfigId
  const scopedIds = context.schoolConfigIds ?? [];
  if (scopedIds.length === 0) {
    // Municipality admin might not need schoolConfigId for some tables
    return;
  }

  const existingTenantId = instance.getDataValue('schoolConfigId') as string | undefined;

  if (existingTenantId) {
    if (!scopedIds.includes(existingTenantId)) {
      throw new Error('Cross-tenant write blocked');
    }
    return;
  }

  if (scopedIds.length !== 1) {
    throw new Error('schoolConfigId is required for multi-school tenant writes');
  }

  instance.setDataValue('schoolConfigId', scopedIds[0]);
}

function assertTenantBulkWriteAccess(options: TenantOptions): void {
  if (options?.skipTenantIsolation) {
    return;
  }

  applyTenantFilter(options);

  const context = getTenantContext();
  if (!context?.enforceIsolation) {
    return;
  }

  // Validate municipalityId in bulk update attributes
  if (context.municipalityId) {
    const attrs = options.attributes;
    if (attrs && Object.prototype.hasOwnProperty.call(attrs, 'municipalityId')) {
      const municipalityId = attrs.municipalityId as string | undefined;
      if (municipalityId && municipalityId !== context.municipalityId) {
        throw new Error('Cross-municipality bulk update blocked');
      }
    }
  }

  // Validate schoolConfigId in bulk update attributes
  const scopedIds = context.schoolConfigIds ?? [];
  if (scopedIds.length === 0) {
    return;
  }

  const attrs = options.attributes;
  if (!attrs || !Object.prototype.hasOwnProperty.call(attrs, 'schoolConfigId')) {
    return;
  }

  const schoolConfigId = attrs.schoolConfigId as string | undefined;
  if (!schoolConfigId) {
    return;
  }

  if (!scopedIds.includes(schoolConfigId)) {
    throw new Error('Cross-tenant bulk update blocked');
  }
}

function ensureTenantAttribute(model: ModelStatic<Model>): void {
  if ((model as any)[TENANT_MODEL_FLAG]) {
    return;
  }

  if (!model.sequelize) {
    return;
  }

  let needsRefresh = false;

  // Add municipalityId if missing
  if (!Object.prototype.hasOwnProperty.call(model.rawAttributes, 'municipalityId')) {
    model.rawAttributes.municipalityId = {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'municipality_id',
    } as any;
    needsRefresh = true;
  }

  // Add schoolConfigId if missing
  if (!Object.prototype.hasOwnProperty.call(model.rawAttributes, 'schoolConfigId')) {
    model.rawAttributes.schoolConfigId = {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'school_config_id',
    } as any;
    needsRefresh = true;
  }

  if (needsRefresh) {
    (model as any).refreshAttributes();
  }

  (model as any)[TENANT_MODEL_FLAG] = true;
}

function registerHooks(model: ModelStatic<Model>): void {
  if ((model as any)[TENANT_HOOK_FLAG]) {
    return;
  }

  if (!model.sequelize) {
    return;
  }

  (model as any).addHook('beforeFind', 'tenant-isolation-before-find', (options: TenantOptions) => {
    applyTenantFilter(options);
  });

  (model as any).addHook('beforeCount', 'tenant-isolation-before-count', (options: TenantOptions) => {
    applyTenantFilter(options);
  });

  (model as any).addHook('beforeBulkUpdate', 'tenant-isolation-before-bulk-update', (options: TenantOptions) => {
    assertTenantBulkWriteAccess(options);
  });

  (model as any).addHook('beforeBulkDestroy', 'tenant-isolation-before-bulk-destroy', (options: TenantOptions) => {
    applyTenantFilter(options);
  });

  (model as any).addHook(
    'beforeBulkCreate',
    'tenant-isolation-before-bulk-create',
    (instances: Model[], options: TenantOptions) => {
      instances.forEach(instance => {
        assertTenantWriteAccess(instance, options);
      });
    }
  );

  (model as any).addHook(
    'beforeCreate',
    'tenant-isolation-before-create',
    (instance: Model, options: TenantOptions) => {
      assertTenantWriteAccess(instance, options);
    }
  );

  (model as any).addHook(
    'beforeUpdate',
    'tenant-isolation-before-update',
    (instance: Model, options: TenantOptions) => {
      assertTenantWriteAccess(instance, options);
    }
  );

  (model as any).addHook(
    'beforeDestroy',
    'tenant-isolation-before-destroy',
    (instance: Model, options: TenantOptions) => {
      assertTenantWriteAccess(instance, options);
    }
  );

  (model as any).addHook(
    'beforeUpsert',
    'tenant-isolation-before-upsert',
    (values: Record<string, unknown>, options: TenantOptions) => {
      if (options?.skipTenantIsolation) {
        return;
      }

      const context = getTenantContext();
      if (!context?.enforceIsolation) {
        return;
      }

      // Validate and assign municipalityId (camelCase attribute name)
      if (context.municipalityId) {
        const municipalityId = values.municipalityId as string | undefined;
        if (municipalityId && municipalityId !== context.municipalityId) {
          throw new Error('Cross-municipality upsert blocked');
        }
        if (!municipalityId) {
          values.municipalityId = context.municipalityId;
        }
      }

      // Validate and assign schoolConfigId (camelCase attribute name)
      const scopedIds = context.schoolConfigIds ?? [];
      if (scopedIds.length === 0) {
        return;
      }

      const schoolConfigId = values.schoolConfigId as string | undefined;
      if (schoolConfigId) {
        if (!scopedIds.includes(schoolConfigId)) {
          throw new Error('Cross-tenant upsert blocked');
        }
        return;
      }

      if (scopedIds.length !== 1) {
        throw new Error('schoolConfigId is required for multi-school tenant writes');
      }

      values.schoolConfigId = scopedIds[0];
    }
  );

  (model as any)[TENANT_HOOK_FLAG] = true;
}

export { getMunicipalityCondition, getTenantCondition };

export function initializeTenantIsolation(): void {
  TENANT_MODELS.forEach(model => {
    ensureTenantAttribute(model);
    registerHooks(model);
  });
}

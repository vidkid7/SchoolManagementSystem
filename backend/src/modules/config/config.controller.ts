import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { asyncHandler } from '@middleware/errorHandler';
import { sendSuccess, sendError } from '@utils/responseFormatter';
import AttendanceRule from '@models/AttendanceRule.model';
import configService from './config.service';
import { AuthorizationError, ValidationError } from '@middleware/errorHandler';
import { UserRole } from '@models/User.model';

const SCHOOL_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'school');

class ConfigController {
  private async enforceSchoolScope(req: Request, targetSchoolId: string): Promise<void> {
    if (
      req.user?.role === UserRole.SCHOOL_ADMIN &&
      req.user.schoolConfigId &&
      req.user.schoolConfigId !== targetSchoolId
    ) {
      throw new AuthorizationError('You can only access your assigned school configuration');
    }

    if (
      req.user?.role === UserRole.MUNICIPALITY_ADMIN &&
      req.user.municipalityId
    ) {
      const targetConfig = await configService.getConfigById(targetSchoolId);
      if (targetConfig.municipalityId !== req.user.municipalityId) {
        throw new AuthorizationError('You can only access school configurations in your municipality');
      }
    }
  }

  // --- School configuration ---
  getSchoolConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    let config = null;
    if (req.user?.schoolConfigId) {
      config = await configService.getConfigById(req.user.schoolConfigId);
    } else {
      config = await configService.getActiveConfig();
    }
    sendSuccess(res, config, config ? 'School configuration retrieved' : 'No active school configuration');
  });

  getSchoolConfigById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await this.enforceSchoolScope(req, id);
    const config = await configService.getConfigById(id);
    sendSuccess(res, config, 'School configuration retrieved');
  });

  createSchoolConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const config = await configService.createConfig(req.body, userId);
    sendSuccess(res, config, 'School configuration created', 201);
  });

  updateSchoolConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await this.enforceSchoolScope(req, id);
    const userId = req.user!.userId;
    const config = await configService.updateConfig(id, req.body, userId);
    sendSuccess(res, config, 'School configuration updated');
  });

  /** Update active school config (PUT /school with no id - used by AdminSettings) */
  updateActiveSchoolConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const active = req.user?.schoolConfigId
      ? await configService.getConfigById(req.user.schoolConfigId)
      : await configService.getActiveConfig();
    if (!active) {
      sendError(res, 'No active school configuration to update', 404);
      return;
    }
    const body = req.body as Record<string, unknown>;
    const data = {
      schoolNameEn: body.schoolNameEn ?? body.name,
      schoolNameNp: body.schoolNameNp ?? body.nameNp,
      addressEn: body.addressEn ?? body.address,
      addressNp: body.addressNp,
      phone: body.phone,
      email: body.email,
      website: body.website,
      schoolCode: body.schoolCode,
    } as Record<string, unknown>;
    const config = await configService.updateConfig(active.id, data, userId);
    sendSuccess(res, config, 'School configuration updated');
  });

  uploadSchoolLogo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await this.enforceSchoolScope(req, id);
    const userId = req.user!.userId;
    if (!req.file) {
      throw new ValidationError('Logo file is required', [
        { field: 'logo', message: 'Please upload an image file (JPEG, PNG, or GIF)' }
      ]);
    }
    await fs.mkdir(SCHOOL_UPLOAD_DIR, { recursive: true });
    const ext = path.extname(req.file.originalname) || '.png';
    const filename = `logo-${id}-${Date.now()}${ext}`;
    const filePath = path.join(SCHOOL_UPLOAD_DIR, filename);
    await fs.writeFile(filePath, req.file.buffer);
    const logoUrl = `/uploads/school/${filename}`;
    const config = await configService.uploadLogo(id, logoUrl, userId);
    sendSuccess(res, config, 'Logo uploaded successfully');
  });

  deactivateSchoolConfig = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await this.enforceSchoolScope(req, id);
    const userId = req.user!.userId;
    await configService.deactivateConfig(id, userId);
    sendSuccess(res, null, 'School configuration deactivated');
  });

  // --- Attendance rules (existing) ---
  getActiveAttendanceRules = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const activeRule = await AttendanceRule.findOne({
      where: { isActive: true },
      order: [['createdAt', 'DESC']]
    });

    const defaultRule = {
      id: 'default',
      name: 'Default Attendance Rules',
      minimumAttendancePercentage: 75.0,
      lowAttendanceThreshold: 75.0,
      criticalAttendanceThreshold: 60.0,
      correctionWindowHours: 24,
      allowTeacherCorrection: true,
      allowAdminCorrection: true,
      maxLeaveDaysPerMonth: 5,
      maxLeaveDaysPerYear: 30,
      requireLeaveApproval: true,
      enableLowAttendanceAlerts: true,
      alertParents: true,
      alertAdmins: true,
      isActive: true
    };

    sendSuccess(res, activeRule || defaultRule, 'Active attendance rules retrieved successfully');
  });

  updateAttendanceRules = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;

    const rule = await AttendanceRule.findByPk(id);
    if (!rule) {
      sendError(res, 'Attendance rule not found', 404);
      return;
    }

    await rule.update({
      minimumAttendancePercentage: updateData.minimumAttendancePercentage,
      correctionWindowHours: updateData.lateArrivalGracePeriod,
      allowTeacherCorrection: updateData.allowBackdatedEntry,
      maxLeaveDaysPerMonth: updateData.backdatedEntryDaysLimit,
      requireLeaveApproval: updateData.requireRemarks,
      alertParents: updateData.notifyParentsOnAbsence,
    });

    sendSuccess(res, rule, 'Attendance rules updated successfully');
  });

  createAttendanceRules = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const createData = req.body;

    const existingActive = await AttendanceRule.findOne({ where: { isActive: true } });
    if (existingActive) {
      await existingActive.update({ isActive: false });
    }

    const newRule = await AttendanceRule.create({
      name: 'Custom Attendance Rules',
      minimumAttendancePercentage: createData.minimumAttendancePercentage,
      lowAttendanceThreshold: createData.minimumAttendancePercentage,
      criticalAttendanceThreshold: 60.0,
      correctionWindowHours: createData.lateArrivalGracePeriod,
      allowTeacherCorrection: createData.allowBackdatedEntry,
      allowAdminCorrection: true,
      maxLeaveDaysPerMonth: createData.backdatedEntryDaysLimit,
      maxLeaveDaysPerYear: 30,
      requireLeaveApproval: createData.requireRemarks,
      enableLowAttendanceAlerts: true,
      alertParents: createData.notifyParentsOnAbsence,
      alertAdmins: true,
      isActive: true,
    });

    sendSuccess(res, newRule, 'Attendance rules created successfully', 201);
  });
}

export default new ConfigController();

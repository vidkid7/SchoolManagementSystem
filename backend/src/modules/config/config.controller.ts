import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { sendSuccess, sendError } from '@utils/responseFormatter';
import AttendanceRule from '@models/AttendanceRule.model';

class ConfigController {
  getActiveAttendanceRules = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

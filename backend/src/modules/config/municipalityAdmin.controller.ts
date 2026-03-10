import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';
import { sendSuccess } from '@utils/responseFormatter';
import { UserRole } from '@models/User.model';
import municipalityAdminService from './municipalityAdmin.service';

class MunicipalityAdminController {
  private getContext(req: Request): { userId: number; municipalityId?: string } {
    return {
      userId: req.user!.userId,
      municipalityId: req.user!.municipalityId,
    };
  }

  getDashboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = await municipalityAdminService.getDashboard(this.getContext(req));
    sendSuccess(res, data, 'Municipality dashboard retrieved');
  });

  getReports = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data = await municipalityAdminService.getReports(this.getContext(req));
    sendSuccess(res, data, 'Municipality reports retrieved');
  });

  listIncidents = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = Number((req.query as { limit?: string }).limit) || 20;
    const incidents = await municipalityAdminService.getIncidents(this.getContext(req), limit);
    sendSuccess(res, incidents, 'Municipality incidents retrieved');
  });

  listSchools = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const includeInactive = Boolean((req.query as { includeInactive?: boolean }).includeInactive);
    const schools = await municipalityAdminService.getSchools(this.getContext(req), includeInactive);
    sendSuccess(res, schools, 'Municipality schools retrieved');
  });

  createSchool = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const school = await municipalityAdminService.createSchool(this.getContext(req), req.body);
    sendSuccess(res, school, 'School created successfully', 201);
  });

  updateSchool = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const school = await municipalityAdminService.updateSchool(
      this.getContext(req),
      req.params.schoolId,
      req.body
    );
    sendSuccess(res, school, 'School updated successfully');
  });

  deactivateSchool = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const school = await municipalityAdminService.setSchoolActiveState(
      this.getContext(req),
      req.params.schoolId,
      false
    );
    sendSuccess(res, school, 'School deactivated successfully');
  });

  activateSchool = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const school = await municipalityAdminService.setSchoolActiveState(
      this.getContext(req),
      req.params.schoolId,
      true
    );
    sendSuccess(res, school, 'School activated successfully');
  });

  listUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const role = (req.query as { role?: UserRole }).role;
    const users = await municipalityAdminService.getMunicipalityUsers(this.getContext(req), role);
    sendSuccess(res, users, 'Municipality users retrieved');
  });

  createSchoolAdmin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await municipalityAdminService.createSchoolAdmin(
      this.getContext(req),
      req.params.schoolId,
      req.body
    );
    sendSuccess(res, user, 'School admin created successfully', 201);
  });
}

export default new MunicipalityAdminController();

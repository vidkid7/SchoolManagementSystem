import Staff from '@models/Staff.model';
import StaffLeaveRequest from '@models/StaffLeaveRequest.model';

export interface StaffLeaveInput {
  leaveType: 'casual' | 'sick' | 'personal' | 'other';
  startDate: string | Date;
  endDate: string | Date;
  reason: string;
}

class StaffLeaveService {
  private async getStaff(userId: number): Promise<Staff> {
    const staff = await Staff.findOne({ where: { userId } });
    if (!staff) {
      const error = new Error('Staff profile not found for this account') as Error & { statusCode?: number };
      error.statusCode = 404;
      throw error;
    }
    return staff;
  }

  async listForUser(userId: number): Promise<StaffLeaveRequest[]> {
    const staff = await this.getStaff(userId);
    return StaffLeaveRequest.findAll({
      where: { staffId: staff.staffId, appliedBy: userId },
      order: [['createdAt', 'DESC']],
    });
  }

  async applyForUser(userId: number, input: StaffLeaveInput): Promise<StaffLeaveRequest> {
    const staff = await this.getStaff(userId);
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate < startDate) {
      const error = new Error('End date must be on or after start date') as Error & { statusCode?: number };
      error.statusCode = 400;
      throw error;
    }
    return StaffLeaveRequest.create({
      staffId: staff.staffId,
      leaveType: input.leaveType,
      startDate,
      endDate,
      reason: input.reason.trim(),
      appliedBy: userId,
      status: 'pending',
    });
  }

  async cancelForUser(userId: number, requestId: number): Promise<boolean> {
    const staff = await this.getStaff(userId);
    const request = await StaffLeaveRequest.findOne({ where: { staffLeaveRequestId: requestId, staffId: staff.staffId, appliedBy: userId } });
    if (!request) return false;
    if (request.status !== 'pending') {
      const error = new Error('Only pending leave requests can be cancelled') as Error & { statusCode?: number };
      error.statusCode = 409;
      throw error;
    }
    await request.update({ status: 'cancelled' });
    return true;
  }
}

export default new StaffLeaveService();

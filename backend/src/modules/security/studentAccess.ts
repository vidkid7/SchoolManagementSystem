import { Request } from 'express';
import { AuthorizationError, NotFoundError } from '@middleware/errorHandler';
import { UserRole } from '@models/User.model';
import Student from '@models/Student.model';
import parentService from '@modules/parent/parent.service';

const roleOf = (req: Request): string => String(req.user?.role || '').toLowerCase();

/** Return the student IDs a portal user may access, or null for school staff. */
export async function getPortalStudentIds(req: Request): Promise<number[] | null> {
  const role = roleOf(req);
  const userId = req.user?.userId;
  if (!userId) throw new AuthorizationError('Authentication required');
  if (role === UserRole.STUDENT.toLowerCase()) {
    const student = await Student.findOne({ where: { userId }, attributes: ['studentId'] });
    return student ? [student.studentId] : [];
  }
  if (role === UserRole.PARENT.toLowerCase()) {
    const children = await parentService.getParentChildren(userId);
    return children.map(child => child.studentId);
  }
  return null;
}

export async function assertStudentAccess(req: Request, studentId: number): Promise<void> {
  const allowedIds = await getPortalStudentIds(req);
  if (allowedIds && !allowedIds.includes(studentId)) throw new NotFoundError('Student');
}

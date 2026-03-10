import { UserRole } from '@models/User.model';

/**
 * Extend Express Request type to include custom properties
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
        email: string;
        role: UserRole;
        municipalityId?: string;
        schoolConfigId?: string;
        allowedSchoolConfigIds?: string[];
        permissions?: string[];
      };
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
    }
  }
}

export {};

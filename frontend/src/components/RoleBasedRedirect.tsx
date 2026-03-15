/**
 * Role-Based Redirect Component
 * Redirects users to their appropriate portal/dashboard based on their role,
 * scoped under their municipality slug.
 */

import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const RoleBasedRedirect = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const getRedirectPath = (role?: string): string => {
    if (!role) return '/login';

    switch (role) {
      case 'Student':
        return '/portal/student';
      case 'Parent':
        return '/portal/parent';
      case 'Subject_Teacher':
        return '/portal/teacher';
      case 'Class_Teacher':
        return '/portal/class-teacher';
      case 'Department_Head':
        return '/portal/department-head';
      case 'Accountant':
        return '/portal/accountant';
      case 'Librarian':
        return '/portal/librarian';
      case 'Municipality_Admin':
        return '/municipality';
      case 'Transport_Manager':
        return '/portal/transport';
      case 'Hostel_Warden':
        return '/portal/hostel';
      case 'Non_Teaching_Staff':
        return '/portal/non-teaching-staff';
      case 'ECA_Coordinator':
        return '/portal/eca-coordinator';
      case 'Sports_Coordinator':
        return '/portal/sports-coordinator';
      case 'School_Admin':
      default:
        return '/dashboard';
    }
  };

  const basePath = getRedirectPath(user?.role);

  if (basePath === '/login') {
    return <Navigate to="/login" replace />;
  }

  const slug = user?.municipalityCode;
  const redirectPath = slug ? `/${slug}${basePath}` : basePath;
  return <Navigate to={redirectPath} replace />;
};

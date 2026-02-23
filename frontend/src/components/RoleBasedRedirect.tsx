/**
 * Role-Based Redirect Component
 * Redirects users to their appropriate portal/dashboard based on their role
 */

import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const RoleBasedRedirect = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const getRedirectPath = (role?: string) => {
    if (!role) return '/login';

    switch (role) {
      case 'Student':
        return '/portal/student';
      case 'Parent':
        return '/portal/parent';
      case 'Subject_Teacher':
      case 'Class_Teacher':
        return '/portal/teacher';
      case 'Accountant':
        return '/portal/accountant';
      case 'Librarian':
        return '/portal/librarian';
      case 'Transport_Manager':
        return '/portal/transport';
      case 'Hostel_Warden':
        return '/portal/hostel';
      case 'Non_Teaching_Staff':
        return '/portal/non-teaching-staff';
      case 'ECA_Coordinator':
        return '/eca';
      case 'Sports_Coordinator':
        return '/sports';
      case 'School_Admin':
      case 'Department_Head':
      default:
        return '/dashboard';
    }
  };

  const redirectPath = getRedirectPath(user?.role);
  return <Navigate to={redirectPath} replace />;
};

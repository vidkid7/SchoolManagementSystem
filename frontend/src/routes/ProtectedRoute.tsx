/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { RootState } from '../store';
import { setUser } from '../store/slices/authSlice';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

// Helper function to parse JWT token
function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT:', e);
    return null;
  }
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  // Fallback: If user object is missing but we have a token, reconstruct user from token
  useEffect(() => {
    if (isAuthenticated && !user) {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        const decoded = parseJwt(accessToken);
        if (decoded && decoded.role) {
          console.log('🔧 ProtectedRoute: Reconstructing user object from JWT token');
          const reconstructedUser = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            municipalityId: decoded.municipalityId,
            schoolConfigId: decoded.schoolConfigId,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
          };
          dispatch(setUser(reconstructedUser));
        }
      }
    }
  }, [isAuthenticated, user, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If we have allowedRoles but no user object yet, wait for the useEffect to run
  if (allowedRoles && !user) {
    // Try to get role from token as immediate fallback
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      const decoded = parseJwt(accessToken);
      if (decoded && decoded.role && allowedRoles.includes(decoded.role)) {
        // Role is allowed, let them through (useEffect will set user object)
        return <Outlet />;
      }
    }
    // If we can't verify from token, block access
    return <Navigate to="/unauthorized" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

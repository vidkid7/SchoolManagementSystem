/**
 * Municipality Route Guard
 *
 * Ensures authenticated users can only access routes within their own municipality scope.
 * Reads :municipalitySlug from URL and compares against the user's assigned municipality.
 */

import React from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const MunicipalityRouteGuard: React.FC = () => {
  const { municipalitySlug } = useParams<{ municipalitySlug: string }>();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const userSlug = user.municipalityCode;

  if (!userSlug) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (municipalitySlug && municipalitySlug.toLowerCase() === userSlug.toLowerCase() && municipalitySlug !== userSlug) {
    const suffix = location.pathname.replace(/^\/[^/]+/, '');
    return <Navigate to={`/${userSlug}${suffix}${location.search}`} replace />;
  }

  if (municipalitySlug && municipalitySlug.toLowerCase() !== userSlug.toLowerCase()) {
    return <Navigate to={`/${userSlug}/dashboard`} replace />;
  }

  return <Outlet />;
};

export default MunicipalityRouteGuard;

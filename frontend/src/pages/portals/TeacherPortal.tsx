import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

/**
 * Teacher Portal Redirect
 * Redirects teachers to their dashboard
 */
export const TeacherPortal: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to teacher dashboard
    navigate('/teacher/dashboard', { replace: true });
  }, [navigate]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  );
};

export default TeacherPortal;

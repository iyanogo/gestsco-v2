import React from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { getPortalProfilePathForUser } from '@/utils/portalPaths';

/** Redirige /profile vers le profil du portail courant selon le rôle. */
const ProfileRedirect: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getPortalProfilePathForUser(user)} replace />;
};

export default ProfileRedirect;

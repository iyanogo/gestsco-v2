import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { getPostLoginPath } from '@/utils/authRedirect';
import {
  canAccessAdminPortal,
  canAccessPath,
  canAccessStudentPortal,
  canAccessTeacherPortal,
  resolveAppRole,
} from '@/utils/rbac';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Portail Bootstrap à protéger */
  portal?: 'admin' | 'teacher' | 'student';
}

export const ProtectedRoute = ({ children, portal }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = resolveAppRole(user);

  if (portal === 'admin' && !canAccessAdminPortal(role)) {
    return <Navigate to={getPostLoginPath(user)} replace />;
  }

  if (portal === 'teacher' && !canAccessTeacherPortal(role)) {
    return <Navigate to={getPostLoginPath(user)} replace />;
  }

  if (portal === 'student' && !canAccessStudentPortal(role)) {
    return <Navigate to={getPostLoginPath(user)} replace />;
  }

  if (portal && !canAccessPath(role, location.pathname)) {
    return <Navigate to={getPostLoginPath(user)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

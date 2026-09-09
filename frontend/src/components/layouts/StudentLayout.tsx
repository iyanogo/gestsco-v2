import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { studentMenuItems } from '../../config/menuConfig';
import { useAuth } from '../../hooks/useAuth';
import { useHeaderNotifications } from '../../hooks/useHeaderNotifications';
import { getPortalProfilePath } from '../../utils/portalPaths';

const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { items: notificationItems, loading: notificationsLoading, viewAllHref } =
    useHeaderNotifications('student');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <MainLayout
      menuItems={studentMenuItems}
      userRole="student"
      user={{
        name: user?.full_name || user?.email || 'Étudiant',
        role: 'Étudiant',
        avatar: undefined
      }}
      notificationItems={notificationItems}
      notificationsLoading={notificationsLoading}
      notificationsViewAllHref={viewAllHref}
      onLogout={handleLogout}
      profilePath={getPortalProfilePath('student')}
    />
  );
};

export default StudentLayout;

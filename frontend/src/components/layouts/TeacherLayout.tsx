import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { teacherMenuItems } from '../../config/menuConfig';
import { useAuth } from '../../hooks/useAuth';
import { useHeaderNotifications } from '../../hooks/useHeaderNotifications';
import { getPortalProfilePath } from '../../utils/portalPaths';

const TeacherLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { items: notificationItems, loading: notificationsLoading, viewAllHref } =
    useHeaderNotifications('teacher');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <MainLayout
      menuItems={teacherMenuItems}
      userRole="teacher"
      user={{
        name: user?.full_name || user?.email || 'Enseignant',
        role: 'Enseignant',
        avatar: undefined
      }}
      notificationItems={notificationItems}
      notificationsLoading={notificationsLoading}
      notificationsViewAllHref={viewAllHref}
      onLogout={handleLogout}
      profilePath={getPortalProfilePath('teacher')}
    />
  );
};

export default TeacherLayout;

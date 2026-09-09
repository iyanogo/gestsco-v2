import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { adminMenuItems } from '../../config/menuConfig';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useHeaderNotifications } from '../../hooks/useHeaderNotifications';
import { getPortalProfilePath, getPortalSettingsPath } from '../../utils/portalPaths';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { role, roleLabel, filterMenu } = usePermissions();
  const navigate = useNavigate();

  const menuItems = useMemo(() => filterMenu(adminMenuItems), [filterMenu]);
  const { items: notificationItems, loading: notificationsLoading, viewAllHref } =
    useHeaderNotifications('admin');

  const sidebarRole =
    role === 'scolarite'
      ? 'scolarite'
      : role === 'comptable'
        ? 'comptable'
        : 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <MainLayout
      menuItems={menuItems}
      userRole={sidebarRole}
      footerLabel={roleLabel}
      user={{
        name: user?.full_name || user?.email || 'Administrateur',
        role: roleLabel,
        avatar: undefined,
      }}
      notificationItems={notificationItems}
      notificationsLoading={notificationsLoading}
      notificationsViewAllHref={viewAllHref}
      onLogout={handleLogout}
      profilePath={getPortalProfilePath('admin')}
      settingsPath={getPortalSettingsPath('admin', role)}
    />
  );
};

export default AdminLayout;

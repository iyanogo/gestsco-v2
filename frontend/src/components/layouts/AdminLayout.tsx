import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { adminMenuItems } from '../../config/menuConfig';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <MainLayout
      menuItems={adminMenuItems}
      userRole="admin"
      user={{
        name: user?.full_name || user?.email || 'Administrateur',
        role: user?.is_superuser ? 'Super Admin' : 'Administrateur',
        avatar: undefined
      }}
      notifications={3}
      onLogout={handleLogout}
    />
  );
};

export default AdminLayout;

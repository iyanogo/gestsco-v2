import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { studentMenuItems } from '../../config/menuConfig';
import { useAuth } from '../../hooks/useAuth';

const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      notifications={1}
      onLogout={handleLogout}
    />
  );
};

export default StudentLayout;
